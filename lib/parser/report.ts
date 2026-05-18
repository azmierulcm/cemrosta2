import type { ParseLogEntry } from './logger';
import type { ConfidenceScore } from './confidence';

// ─────────────────────────────────────────────────────────────────────────────
// Parse Report Builder
//
// Emitted at the end of every run — success or failure.
// The full report is written as a single structured JSON line (machine-readable)
// followed by a human-readable summary block for log readability.
// ─────────────────────────────────────────────────────────────────────────────

export type ParseStatus = 'SUCCESS' | 'LOW_CONFIDENCE' | 'FAILED';

export interface ParseReport {
  runId: string;
  timestamp: string;
  fileName: string;
  fileSizeBytes: number;
  status: ParseStatus;
  durationMs: number;

  confidence: ConfidenceScore;

  extraction: {
    pageCount: number;
    emptyPages: number[];
    totalChars: number;
  };

  parsing: {
    airline: string | null;
    month: string | null;
    year: string | null;
    crewName: string | null;
    dutiesExtracted: number;
    flightsExtracted: number;
    standbysExtracted: number;
  };

  /** Structured WARN entries from the logger */
  warnings: ParseLogEntry[];
  /** Structured ERROR entries from the logger */
  errors: ParseLogEntry[];
}

// ── Builder ──────────────────────────────────────────────────────────────────

export interface BuildReportArgs {
  runId: string;
  startTime: number;
  fileName: string;
  fileSizeBytes: number;
  confidence: ConfidenceScore;
  extraction: ParseReport['extraction'];
  parsing: ParseReport['parsing'];
  warnings: ParseLogEntry[];
  errors: ParseLogEntry[];
}

export function buildReport(args: BuildReportArgs): ParseReport {
  const { errors, confidence, parsing } = args;

  const status: ParseStatus =
    errors.length > 0 && parsing.dutiesExtracted === 0
      ? 'FAILED'
      : confidence.grade === 'LOW' || confidence.grade === 'FAILED'
        ? 'LOW_CONFIDENCE'
        : 'SUCCESS';

  return {
    runId: args.runId,
    timestamp: new Date().toISOString(),
    fileName: args.fileName,
    fileSizeBytes: args.fileSizeBytes,
    status,
    durationMs: Date.now() - args.startTime,
    confidence: args.confidence,
    extraction: args.extraction,
    parsing: args.parsing,
    warnings: args.warnings,
    errors: args.errors,
  };
}

// ── Human-readable summary (logged alongside the JSON blob) ─────────────────

const STATUS_ICON: Record<ParseStatus, string> = {
  SUCCESS:        '✓',
  LOW_CONFIDENCE: '⚠',
  FAILED:         '✗',
};

const GRADE_ICON: Record<string, string> = {
  HIGH:   '●',
  MEDIUM: '◑',
  LOW:    '◔',
  FAILED: '○',
};

export function formatReportSummary(report: ParseReport): string {
  const { confidence, extraction, parsing } = report;
  const g = confidence.grade;
  const si = STATUS_ICON[report.status];
  const gi = GRADE_ICON[g] ?? '?';

  const lines: string[] = [
    '┌─────────────────────────────────────────────────────┐',
    `│  ROSTER PARSE REPORT                                │`,
    `│  Run  : ${report.runId.slice(0, 8)}   ${report.timestamp.slice(0, 19)} UTC  │`,
    '├─────────────────────────────────────────────────────┤',
    `│  Status   : ${si} ${report.status.padEnd(15)}  Score: ${gi} ${String(confidence.overall).padStart(3)}/100 (${g})  │`,
    `│  Duration : ${String(report.durationMs).padStart(5)} ms                                  │`,
    `│  File     : ${report.fileName.slice(0, 38).padEnd(38)}  │`,
    '├─────────────────────────────────────────────────────┤',
    `│  Pages    : ${String(extraction.pageCount).padEnd(3)}  (${extraction.emptyPages.length} empty/image)               │`,
    `│  Duties   : ${String(parsing.dutiesExtracted).padEnd(3)}  (${String(parsing.flightsExtracted).padEnd(3)} flights · ${String(parsing.standbysExtracted).padEnd(3)} standbys)       │`,
    `│  Airline  : ${(parsing.airline ?? 'Unknown').padEnd(38)}  │`,
    `│  Period   : ${(parsing.month && parsing.year ? `${parsing.month} ${parsing.year}` : 'Unknown').padEnd(38)}  │`,
    `│  Crew     : ${(parsing.crewName ?? 'Unknown').slice(0, 38).padEnd(38)}  │`,
    '├─────────────────────────────────────────────────────┤',
    `│  Scores   : density=${String(confidence.breakdown.textDensity).padStart(3)}  dates=${String(confidence.breakdown.dateExtraction).padStart(3)}  ports=${String(confidence.breakdown.portCodeIntegrity).padStart(3)}  times=${String(confidence.breakdown.timingIntegrity).padStart(3)}  │`,
  ];

  if (confidence.flags.length > 0) {
    lines.push('├─────────────────────────────────────────────────────┤');
    lines.push('│  FLAGS:                                             │');
    confidence.flags.forEach((flag) => {
      lines.push(`│    ⚑ ${flag.slice(0, 46).padEnd(46)}  │`);
    });
  }

  if (report.warnings.length > 0) {
    lines.push('├─────────────────────────────────────────────────────┤');
    lines.push(`│  WARNINGS (${String(report.warnings.length).padEnd(3)}):                                    │`);
    report.warnings.slice(0, 6).forEach((w) => {
      const label = `[${w.phase}] ${w.message}`;
      lines.push(`│    ⚡ ${label.slice(0, 45).padEnd(45)}  │`);
    });
    if (report.warnings.length > 6) {
      lines.push(`│    … ${report.warnings.length - 6} more — see JSON log for full context         │`);
    }
  }

  if (report.errors.length > 0) {
    lines.push('├─────────────────────────────────────────────────────┤');
    lines.push(`│  ERRORS (${String(report.errors.length).padEnd(3)}):                                      │`);
    report.errors.forEach((e) => {
      const label = `[${e.phase}] ${e.message}`;
      lines.push(`│    ✗ ${label.slice(0, 46).padEnd(46)}  │`);
    });
  }

  lines.push('└─────────────────────────────────────────────────────┘');
  return lines.join('\n');
}
