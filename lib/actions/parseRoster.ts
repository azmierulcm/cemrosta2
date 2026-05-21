'use server';

import { parseRosterText } from '@/lib/parser';
import { ParseLogger } from '@/lib/parser/logger';
import { scoreRosterParse, isTextTooSparse } from '@/lib/parser/confidence';
import { nativeTextHandler } from '@/lib/parser/handlers/native-text';
import { isLikelyScanned, scannedFallbackHandler } from '@/lib/parser/handlers/scanned-fallback';
import { buildReport, formatReportSummary } from '@/lib/parser/report';
import { UnsupportedAirlineError } from '@/lib/parser/types';
import { enrichParsedRoster, airlineNameToIata } from '@/lib/parser/enrichment';
import { recordParseFeedback } from '@/lib/parser/feedback';
import type { RosterData, DutyEvent } from '@/lib/types';
import { saveRoster } from '@/lib/actions/rosters';

// ─────────────────────────────────────────────────────────────────────────────
// parseRosterPreview — orchestrates the full parse pipeline
//
// Pipeline stages:
//   1. Native text extraction  (nativeTextHandler)
//   2. Scanned image detection  (scannedFallbackHandler)
//   3. Airline routing + parsing  (parseRosterText → mas-aims)
//   4. Confidence scoring  (scoreRosterParse)
//   5. End-of-run report  (buildReport + formatReportSummary)
//
// Fault tolerance:
//   • Each stage is individually try-caught.
//   • Failures are logged with exact file metadata, character offsets, and raw
//     chunk previews before a user-friendly error is surfaced.
//   • A ParseReport is always emitted — even when the pipeline fails — so every
//     run is observable in Vercel / serverless log drains.
// ─────────────────────────────────────────────────────────────────────────────

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

export async function parseRosterPreview(formData: FormData): Promise<RosterData> {
  const startTime = Date.now();
  const logger = new ParseLogger();

  // ── File validation ────────────────────────────────────────────────────────
  const file = formData.get('file') as File | null;
  if (!file) {
    logger.error('orchestrator:input', 'No file present in FormData');
    throw new Error('No file uploaded.');
  }

  const fileName = file.name ?? 'unknown.pdf';
  const fileSizeBytes = file.size ?? 0;

  // Guard: reject suspiciously large files before doing any parsing work.
  // A normal single-month AIMS roster is well under 1 MB.
  const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
  if (fileSizeBytes > MAX_FILE_BYTES) {
    throw new Error('File too large. Please upload a single-month roster PDF (max 10 MB).');
  }

  logger.info('orchestrator', 'Parse run started', {
    runId: logger.runId,
    fileName,
    fileSizeBytes,
  });

  // Shared extraction result shape — populated in stage 1
  let extractionMeta = {
    pageCount: 0,
    emptyPages: [] as number[],
    totalChars: 0,
  };

  // ── Stage 1: Native text extraction ───────────────────────────────────────
  let rawText = '';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Guard: verify magic bytes — all PDFs start with %PDF (25 50 44 46).
    // This catches files renamed to .pdf but containing other content.
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x25 || // %
      buffer[1] !== 0x50 || // P
      buffer[2] !== 0x44 || // D
      buffer[3] !== 0x46    // F
    ) {
      throw new Error('Not a valid PDF file. Please export your roster as a PDF and try again.');
    }
    const extraction = await nativeTextHandler(buffer, logger);

    rawText = extraction.text;
    extractionMeta = {
      pageCount: extraction.pageCount,
      emptyPages: extraction.emptyPages,
      totalChars: rawText.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('orchestrator:extraction', 'Text extraction stage failed', {
      error: message,
      fileName,
      fileSizeBytes,
    });

    // Emit failure report before surfacing error to user
    emitFailureReport({
      logger,
      startTime,
      fileName,
      fileSizeBytes,
      extractionMeta,
      parsed: null,
    });

    throw new Error(message);
  }

  // ── Stage 2: Scanned image detection ──────────────────────────────────────
  if (isTextTooSparse(rawText) || isLikelyScanned(rawText)) {
    try {
      scannedFallbackHandler(rawText, logger);
    } catch (err: unknown) {
      emitFailureReport({
        logger,
        startTime,
        fileName,
        fileSizeBytes,
        extractionMeta,
        parsed: null,
      });
      throw err;
    }
  }

  // ── Stage 3: Airline routing + parsing ────────────────────────────────────
  let parsed: Awaited<ReturnType<typeof parseRosterText>>;

  try {
    parsed = parseRosterText(rawText, logger);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isUnsupported = err instanceof UnsupportedAirlineError;

    logger.error('orchestrator:parse', isUnsupported ? 'Unsupported airline format' : 'Parser threw unhandled exception', {
      error: message,
      isUnsupported,
      fileName,
    });

    emitFailureReport({
      logger,
      startTime,
      fileName,
      fileSizeBytes,
      extractionMeta,
      parsed: null,
    });

    throw new Error(message);
  }

  if (!parsed.duties || parsed.duties.length === 0) {
    logger.error('orchestrator:parse', 'Parser returned zero duties', {
      fileName,
      crewName: parsed.crewName,
      month: parsed.month,
      year: parsed.year,
    });

    emitFailureReport({
      logger,
      startTime,
      fileName,
      fileSizeBytes,
      extractionMeta,
      parsed,
    });

    throw new Error('No duties were found. Make sure this is a Roster PDF.');
  }

  // ── Stage 4: Enrichment ───────────────────────────────────────────────────
  // Runs AFTER parsing but BEFORE confidence scoring so the scorer can use
  // enriched data (e.g. distanceKm for port integrity checks in future).
  const enriched = enrichParsedRoster(parsed);

  logger.info('orchestrator:enrichment', 'Enrichment complete', {
    inferredBase:      enriched.inferredBase,
    totalBlockMinutes: enriched.totalBlockMinutes,
    totalKm:           enriched.totalKm,
    layoverCount:      enriched.layoverCount,
    daysOff:           enriched.daysOff,
    trainingDays:      enriched.trainingDays,
  });

  // ── Stage 5: Confidence scoring ───────────────────────────────────────────
  const confidence = scoreRosterParse(parsed, rawText);

  logger.info('orchestrator:confidence', 'Confidence score computed', {
    overall: confidence.overall,
    grade:   confidence.grade,
    flags:   confidence.flags,
  });

  // ── Stage 6: End-of-run report ────────────────────────────────────────────
  const flights  = parsed.duties.filter((d) => d.type === 'FLIGHT');
  const standbys = parsed.duties.filter((d) => d.type === 'STANDBY');

  const report = buildReport({
    runId: logger.runId,
    startTime,
    fileName,
    fileSizeBytes,
    confidence,
    extraction: extractionMeta,
    parsing: {
      airline:           parsed.airline,
      month:             parsed.month,
      year:              parsed.year,
      crewName:          parsed.crewName,
      dutiesExtracted:   parsed.duties.length,
      flightsExtracted:  flights.length,
      standbysExtracted: standbys.length,
    },
    warnings: logger.getWarnings(),
    errors:   logger.getErrors(),
  });

  // Always emit the report — success or low-confidence
  console.log(JSON.stringify({ event: 'PARSE_REPORT', report }));
  console.log(formatReportSummary(report));

  // ── Map enriched duties → DutyEvent[] ────────────────────────────────────
  const events: DutyEvent[] = enriched.duties.map((d) =>
    stripUndefined({
      id:           d.id,
      type:         d.type as DutyEvent['type'],
      date:         d.date,
      day:          d.day,
      item:         d.item,
      flightNumber: d.flight?.flightNumber,
      depPort:      d.flight?.depPort,
      arrPort:      d.flight?.arrPort,
      std:          d.flight?.std,
      sta:          d.flight?.sta,
      signOn:       d.signOn ?? d.flight?.signOn,
      signOff:      d.signOff ?? d.flight?.signOff,
      blockHrs:     d.blockHrs,
      dutyHrs:      d.dutyHrs,
      dutyCode:     d.dutyCode,
      acType:       d.acType,
      hotel:        d.flight?.hotel,
      description:  d.description,
      notes:        d.notes,
    }),
  );

  return {
    events,
    month:             parsed.month,
    year:              parsed.year,
    crewName:          parsed.crewName,
    airline:           airlineNameToIata(parsed.airline),
    totalBlockMinutes: enriched.totalBlockMinutes,
    monthlyStats:      enriched.monthlyStats,
    parseReport:       report,
  };
}

// ── saveConfirmedRoster ───────────────────────────────────────────────────────

export interface SaveResult {
  rosterId:       string;
  calendarSecret: string;
  icsContent:     string;
}

/**
 * Persist a confirmed roster for the authenticated caller.
 *
 * `token` is a Firebase ID token — the userId is always derived server-side.
 * Callers can never write to an arbitrary user's roster collection.
 */
export async function saveConfirmedRoster(
  token: string,
  previewData: RosterData,
): Promise<SaveResult> {
  if (!token) throw new Error('You must be signed in to save a roster.');

  // Verify the token up-front so we have the userId for the feedback record.
  const { verifyIdToken } = await import('@/lib/firebase/auth-helpers');
  const userId = await verifyIdToken(token);

  try {
    const { generateICS } = await import('@/lib/utils/ics');
    const icsContent = generateICS(
      previewData.events,
      previewData.crewName ?? 'Crew Member',
      previewData.month,
      previewData.year,
    );
    // saveRoster verifies the token internally and uses the derived uid.
    const { rosterId, calendarSecret } = await saveRoster(token, previewData, icsContent);

    // ── Fire-and-forget parse feedback ────────────────────────────────────
    // Runs after the roster is saved — never blocks the response to the user.
    if (previewData.parseReport) {
      recordParseFeedback({
        rosterId,
        userId,
        report:            previewData.parseReport,
        totalKm:           0,   // re-computed in saveRoster; feedback uses score only
        totalBlockMinutes: previewData.totalBlockMinutes ?? 0,
      }).catch(() => {
        // Swallowed — feedback collection is non-critical
      });
    }

    return { rosterId, calendarSecret, icsContent };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[saveConfirmedRoster] failed:', err);
    throw new Error(message || 'Could not save roster. Please try again.');
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function emitFailureReport(args: {
  logger: ParseLogger;
  startTime: number;
  fileName: string;
  fileSizeBytes: number;
  extractionMeta: { pageCount: number; emptyPages: number[]; totalChars: number };
  parsed: { duties: unknown[]; airline: string; month: string; year: string; crewName: string } | null;
}): void {
  const { logger, startTime, fileName, fileSizeBytes, extractionMeta, parsed } = args;

  // Minimal confidence score for a failed run
  const failedConfidence = {
    overall: 0,
    grade: 'FAILED' as const,
    breakdown: {
      textDensity: 0,
      dateExtraction: 0,
      portCodeIntegrity: 0,
      timingIntegrity: 0,
      crewNameFound: false,
    },
    flags: ['PIPELINE_FAILURE'],
  };

  const report = buildReport({
    runId: logger.runId,
    startTime,
    fileName,
    fileSizeBytes,
    confidence: failedConfidence,
    extraction: extractionMeta,
    parsing: {
      airline:           parsed?.airline ?? null,
      month:             parsed?.month ?? null,
      year:              parsed?.year ?? null,
      crewName:          parsed?.crewName ?? null,
      dutiesExtracted:   parsed?.duties.length ?? 0,
      flightsExtracted:  0,
      standbysExtracted: 0,
    },
    warnings: logger.getWarnings(),
    errors:   logger.getErrors(),
  });

  console.log(JSON.stringify({ event: 'PARSE_REPORT', report }));
  console.log(formatReportSummary(report));
}
