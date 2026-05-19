import { ParsedRoster, ParsedDuty, ParsedFlight, ParsedMonthlyStats } from '../types';
import type { ParseLogger } from '../logger';

// ─────────────────────────────────────────────────────────────────────────────
// Malaysia Airlines — AIMS Roster Parser
//
// Data extracted per duty row:
//   date       — ISO YYYY-MM-DD
//   day        — "MON" | "TUE" … (computed from date, not extracted from PDF)
//   item       — flight number ("MH001") or duty code ("OFF", "SBY", "SIM")
//   depPort    — IATA departure port
//   arrPort    — IATA arrival port
//   std / sta  — scheduled times (HH:MM)
//   blockHrs   — "HH:MM" from PDF block-hours column (best-effort, times[2])
//   dutyHrs    — "HH:MM" from PDF duty-hours column (best-effort, times[3])
//   signOn     — pre-flight sign-on time
//   signOff    — post-flight sign-off time
//   notes      — hotel / layover info if present
//
// Monthly stats extracted from the PDF summary section:
//   actualBlockHours — "HH:MM"
//   dutyHours        — "HH:MM"
//   offDaysAtBase    — integer
//
// Fault-tolerance: every individual duty is wrapped in its own try-catch.
// ─────────────────────────────────────────────────────────────────────────────

// ── Exclusion list for port-code extraction ────────────────────────────────────
const AIMS_NON_PORT = new Set([
  'ACT', 'STD', 'STA', 'SGN', 'SFI', 'OBS', 'POS', 'REL', 'DEB', 'ETA', 'ETD',
  'ARR', 'DEP', 'CAB', 'CCR', 'CRT', 'OPT', 'DAY', 'OFF', 'MNT', 'TRN',
  'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT',
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  'SIM', 'GND', 'CRM', 'LPC', 'OPC', 'CBT', 'TRG',
  'ASB', 'SBY',
]);

// ── Duty-type detection patterns ───────────────────────────────────────────────
const OFF_REGEX      = /\b(OFF|REST|AL|SL|ML|HL|PH|EL|CMP|COMP)\b/i;
const TRAINING_REGEX = /\b(SIM\/TRN|SIM|TRN|GND|LPC|OPC|CRM|TRAINING|CBT|RECURRENT|TRG)\b/i;
const STANDBY_REGEX  = /\b(SB|SA|SH|ASB|SBY|STBY|S\d+-\d+)\b/gi;

// ── Human-readable labels ──────────────────────────────────────────────────────
const OFF_LABEL: Record<string, string> = {
  OFF:  'Day Off',     REST: 'Rest Day',         AL:   'Annual Leave',
  SL:   'Sick Leave',  ML:   'Maternity Leave',   HL:   'Home Leave',
  PH:   'Public Holiday', EL: 'Emergency Leave',  CMP:  'Compensatory Off',
  COMP: 'Compensatory Off',
};

const TRAINING_LABEL: Record<string, string> = {
  'SIM/TRN': 'Simulator Training', SIM: 'Simulator',        TRN: 'Training',
  GND:       'Ground Training',    LPC: 'Line Proficiency Check',
  OPC:       'Operator Proficiency Check', CRM: 'Crew Resource Management',
  TRAINING:  'Training',           CBT: 'Computer-Based Training',
  RECURRENT: 'Recurrent Training', TRG: 'Training',
};

// ── Day-of-week lookup ─────────────────────────────────────────────────────────
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

function getDayOfWeek(dateISO: string): string {
  // Use noon UTC to avoid any DST/timezone boundary issues
  const d = new Date(`${dateISO}T12:00:00Z`);
  return DOW[d.getUTCDay()];
}

// ── HH:MM duration validator ───────────────────────────────────────────────────
// Block/duty hours are durations — hours can exceed 23. Clock times are 00-23.
// A value whose hours part is > 23 is definitely a duration, not a clock time.
// Values 00-23 are ambiguous; we accept them as potential durations here.
function isHHMM(s: string): boolean {
  return /^\d{1,3}:\d{2}$/.test(s);
}

// ── Monthly stats extraction ───────────────────────────────────────────────────
// AIMS PDFs print a summary section with total block hours, duty hours, and
// off-day counts. The exact label varies between AIMS versions and airlines;
// we try several patterns for each field.

function extractMonthlyStats(text: string, logger?: ParseLogger): ParsedMonthlyStats {
  const stats: ParsedMonthlyStats = {};

  // Actual block hours — matches "ACT BLK HRS 74:25", "ACTUAL BLOCK 74:25",
  // "BLK HRS : 74:25", "TOTAL BLOCK HRS 74:25"
  const blkPatterns = [
    /ACT(?:UAL)?\s+BLK(?:OCK)?\s+HRS?\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /BLK(?:OCK)?\s+HRS?\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /TOTAL\s+BLOCK(?:\s+HRS?)?\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /BLOCK\s+HRS?\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
  ];
  for (const pat of blkPatterns) {
    const m = text.match(pat);
    if (m) { stats.actualBlockHours = m[1]; break; }
  }

  // Duty hours — matches "DUTY HRS 89:10", "DHR : 89:10", "TOTAL DUTY 89:10"
  const dhrPatterns = [
    /DUTY\s+HRS?\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /DHR\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /TOTAL\s+DUTY(?:\s+HRS?)?\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
  ];
  for (const pat of dhrPatterns) {
    const m = text.match(pat);
    if (m) { stats.dutyHours = m[1]; break; }
  }

  // Off days — matches "OFF DAYS 8", "OFF DAYS AT BASE 8", "NO OF OFF DAYS 8",
  // "DAYS OFF : 8"
  const offPatterns = [
    /(?:NO\s+OF\s+)?OFF\s+DAYS?\s+(?:AT\s+BASE\s+)?[:\-]?\s*(\d{1,2})/i,
    /DAYS?\s+OFF\s*[:\-]?\s*(\d{1,2})/i,
  ];
  for (const pat of offPatterns) {
    const m = text.match(pat);
    if (m) { stats.offDaysAtBase = parseInt(m[1], 10); break; }
  }

  logger?.info('mas-aims:monthly-stats', 'Monthly stats extraction result', {
    actualBlockHours: stats.actualBlockHours ?? null,
    dutyHours:        stats.dutyHours ?? null,
    offDaysAtBase:    stats.offDaysAtBase ?? null,
  });

  return stats;
}

// ── Port extraction ────────────────────────────────────────────────────────────
function extractPorts(flightChunk: string): [string, string] {
  const direct = flightChunk.match(/MH\s*\d+\s+([A-Z]{3})\s+([A-Z]{3})/);
  if (direct) return [direct[1], direct[2]];
  const filtered = (flightChunk.match(/\b[A-Z]{3}\b/g) ?? []).filter(
    (p) => !AIMS_NON_PORT.has(p),
  );
  return [filtered[0] ?? '', filtered[1] ?? ''];
}

// ── Month map ──────────────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

// ── Roster period via MODE of all date matches ─────────────────────────────────
function inferRosterPeriod(dateMatches: RegExpMatchArray[]): { month: string; year: string } {
  const counts = new Map<string, number>();
  for (const m of dateMatches) {
    const key = `${m[2].toUpperCase()}-${m[3]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = `${dateMatches[0][2].toUpperCase()}-${dateMatches[0][3]}`;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) { bestCount = count; best = key; }
  }
  const [month, year] = best.split('-') as [string, string];
  return { month, year };
}

// ── Hotel / layover note extraction ───────────────────────────────────────────
// AIMS sometimes appends hotel or layover city text after flight times.
// Look for a capitalised word sequence that follows the time block.
function extractNotes(chunk: string): string | undefined {
  // Match text like "LAYOVER LHR" or "HOTEL SHERATON" after the times
  const m = chunk.match(/\b(LAYOVER|HOTEL|OVERNIGHT)\b[:\s]+([A-Z][A-Z0-9\s]{1,40})/i);
  return m ? m[0].trim() : undefined;
}

// ── Main parser ────────────────────────────────────────────────────────────────
export function parseMasAims(text: string, logger?: ParseLogger): ParsedRoster {
  const duties: ParsedDuty[] = [];
  let skippedDuties = 0;

  // ── Monthly stats (from PDF summary section) ───────────────────────────────
  const monthlyStats = extractMonthlyStats(text, logger);

  // ── Date blocks ────────────────────────────────────────────────────────────
  const dateRegex   = /(\d{2})-([A-Z]{3})-(\d{4})/gi;
  const dateMatches = Array.from(text.matchAll(dateRegex));

  if (dateMatches.length === 0) {
    logger?.error('mas-aims:dates', 'No DD-MMM-YYYY date patterns found in text', {
      textLength: text.length,
      preview: text.slice(0, 200),
    });
    throw new Error(
      'No dates found in the roster. Please ensure this is a text-based AIMS roster PDF.',
    );
  }

  logger?.info('mas-aims:dates', `Found ${dateMatches.length} date block(s)`, {
    firstDate: dateMatches[0][0],
    lastDate:  dateMatches[dateMatches.length - 1][0],
  });

  // ── Crew name ──────────────────────────────────────────────────────────────
  const crewNameMatch = text.match(/Name:\s*([A-Z][A-Z\s]+)/i);
  const crewName      = crewNameMatch ? crewNameMatch[1].trim() : 'Crew Member';

  if (!crewNameMatch) {
    logger?.warn('mas-aims:crew', 'Could not find "Name:" field — defaulting to "Crew Member"', {
      textPreview: text.slice(0, 300),
    });
  } else {
    logger?.info('mas-aims:crew', `Crew name extracted: ${crewName}`);
  }

  // ── Roster period ──────────────────────────────────────────────────────────
  const { month: rosterMonth, year: rosterYear } = inferRosterPeriod(dateMatches);
  logger?.info('mas-aims:period', `Roster period: ${rosterMonth} ${rosterYear}`);

  // ── Per-date-block parsing ─────────────────────────────────────────────────
  for (let i = 0; i < dateMatches.length; i++) {
    const match      = dateMatches[i];
    const dayNum     = match[1];
    const monthStr   = match[2].toUpperCase();
    const year       = match[3];
    const dateISO    = `${year}-${MONTH_MAP[monthStr] ?? '01'}-${dayNum}`;
    const charOffset = match.index!;
    const dayOfWeek  = getDayOfWeek(dateISO);

    const chunkStart = charOffset + match[0].length;
    const chunkEnd   = dateMatches[i + 1] ? dateMatches[i + 1].index! : text.length;
    const chunk      = text.substring(chunkStart, chunkEnd);

    const chunkTimes = chunk.match(/\d{2}:\d{2}/g) ?? [];

    // ── Flight extraction ────────────────────────────────────────────────────
    const flightRegex   = /MH\s*(\d+)/gi;
    const flightMatches = Array.from(chunk.matchAll(flightRegex));

    // Sign-on: last HH:MM before the first "MH XXXX" token
    const firstFlightOffset = flightMatches[0]?.index ?? chunk.length;
    const preFlightTimes    = chunk.substring(0, firstFlightOffset).match(/\d{2}:\d{2}/g) ?? [];
    const daySignOn         = preFlightTimes.at(-1);

    flightMatches.forEach((fMatch, fIdx) => {
      try {
        const flightEnd   = fIdx + 1 < flightMatches.length
          ? flightMatches[fIdx + 1].index!
          : chunk.length;
        const flightChunk = chunk.substring(fMatch.index!, flightEnd);

        const flightNo           = fMatch[1];
        const times              = flightChunk.match(/\d{2}:\d{2}/g) ?? [];
        const [depPort, arrPort] = extractPorts(flightChunk);

        const isFirst = fIdx === 0;
        const isLast  = fIdx === flightMatches.length - 1;

        // times[0]=STD  times[1]=STA  times[2]=blockHrs (best-effort)
        // times[3]=dutyHrs (best-effort, only present when AIMS prints per-leg duty)
        // For the last leg, times[2] may alternatively be the sign-off time.
        // We capture both possibilities: use times[2] as blockHrs and also
        // as signOff (they often have the same index in different AIMS versions).
        const blockHrs = times[2] && isHHMM(times[2]) ? times[2] : undefined;
        const dutyHrs  = times[3] && isHHMM(times[3]) ? times[3] : undefined;

        const flight: ParsedFlight = {
          flightNumber: `MH${flightNo}`,
          depPort,
          arrPort,
          std:    times[0] ?? '00:00',
          sta:    times[1] ?? '00:00',
          ...(isFirst && daySignOn ? { signOn:  daySignOn } : {}),
          ...(isLast  && times[2]  ? { signOff: times[2]  } : {}),
        };

        if (!depPort || !arrPort) {
          logger?.warn('mas-aims:flight', `Missing port code(s) on MH${flightNo}`, {
            date: dateISO, charOffset: charOffset + fMatch.index!,
            depPort: depPort || null, arrPort: arrPort || null,
            rawChunk: flightChunk.slice(0, 120),
          });
        }

        if (times.length < 2) {
          logger?.warn('mas-aims:flight', `Insufficient time fields on MH${flightNo}`, {
            date: dateISO, charOffset: charOffset + fMatch.index!,
            timesFound: times.length, rawChunk: flightChunk.slice(0, 120),
          });
        }

        duties.push({
          id:      `MH${flightNo}-${dateISO}-${fIdx}`,
          type:    'FLIGHT',
          date:    dateISO,
          day:     dayOfWeek,
          item:    `MH${flightNo}`,
          flight,
          blockHrs,
          dutyHrs,
          notes:   extractNotes(flightChunk),
          ...(isFirst && daySignOn ? { signOn:  daySignOn } : {}),
          ...(isLast  && times[2]  ? { signOff: times[2]  } : {}),
        });

      } catch (err: unknown) {
        skippedDuties++;
        logger?.error('mas-aims:flight', `Unexpected error parsing flight in date block ${dateISO}`, {
          date: dateISO, charOffset, flightIndex: fIdx,
          error: err instanceof Error ? err.message : String(err),
          rawChunk: chunk.slice(0, 200),
        });
      }
    });

    // ── Non-flight duties ────────────────────────────────────────────────────
    if (flightMatches.length === 0) {

      const offMatch = chunk.match(OFF_REGEX);
      if (offMatch) {
        try {
          const code = offMatch[1].toUpperCase();
          duties.push({
            id:          `${code}-${dateISO}`,
            type:        'OFF',
            date:        dateISO,
            day:         dayOfWeek,
            item:        code,
            description: OFF_LABEL[code] ?? `Off — ${code}`,
          });
        } catch (err: unknown) {
          skippedDuties++;
          logger?.error('mas-aims:off', `Error parsing OFF duty at ${dateISO}`, {
            date: dateISO, error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const trainingMatch = !offMatch ? chunk.match(TRAINING_REGEX) : null;
      if (trainingMatch) {
        try {
          const code = trainingMatch[1].toUpperCase();
          duties.push({
            id:          `${code}-${dateISO}`,
            type:        'TRAINING',
            date:        dateISO,
            day:         dayOfWeek,
            item:        code,
            signOn:      chunkTimes[0] ?? undefined,
            signOff:     chunkTimes[chunkTimes.length - 1] ?? undefined,
            description: TRAINING_LABEL[code] ?? `Training — ${code}`,
          });
        } catch (err: unknown) {
          skippedDuties++;
          logger?.error('mas-aims:training', `Error parsing TRAINING duty at ${dateISO}`, {
            date: dateISO, error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (!offMatch && !trainingMatch) {
        const standbyMatches = Array.from(chunk.matchAll(STANDBY_REGEX));
        standbyMatches.forEach((sMatch) => {
          try {
            const code   = sMatch[1].toUpperCase();
            const sChunk = chunk.substring(sMatch.index!);
            const sTimes = sChunk.match(/\d{2}:\d{2}/g) ?? chunkTimes;

            if (sTimes.length === 0) {
              logger?.warn('mas-aims:standby', `No times found for standby ${code}`, {
                date: dateISO, charOffset: charOffset + sMatch.index!, rawChunk: sChunk.slice(0, 120),
              });
            }

            duties.push({
              id:          `${code}-${dateISO}`,
              type:        'STANDBY',
              date:        dateISO,
              day:         dayOfWeek,
              item:        code,
              signOn:      sTimes[0] ?? undefined,
              signOff:     sTimes.at(-1) ?? undefined,
              description: `Standby — ${code}`,
            });
          } catch (err: unknown) {
            skippedDuties++;
            logger?.error('mas-aims:standby', `Error parsing standby at ${dateISO}`, {
              date: dateISO, charOffset, error: err instanceof Error ? err.message : String(err),
            });
          }
        });
      }

    } else {
      // Mixed-day standby alongside flights
      const standbyMatches = Array.from(chunk.matchAll(STANDBY_REGEX));
      standbyMatches.forEach((sMatch) => {
        try {
          const code   = sMatch[1].toUpperCase();
          const sChunk = chunk.substring(sMatch.index!);
          const sTimes = sChunk.match(/\d{2}:\d{2}/g) ?? chunkTimes;

          duties.push({
            id:          `${code}-${dateISO}-SBY`,
            type:        'STANDBY',
            date:        dateISO,
            day:         dayOfWeek,
            item:        code,
            signOn:      sTimes[0] ?? undefined,
            signOff:     sTimes.at(-1) ?? undefined,
            description: `Standby — ${code}`,
          });
        } catch (err: unknown) {
          skippedDuties++;
          logger?.error('mas-aims:standby', `Error parsing mixed-day standby at ${dateISO}`, {
            date: dateISO, charOffset, error: err instanceof Error ? err.message : String(err),
          });
        }
      });
    }
  }

  if (skippedDuties > 0) {
    logger?.warn('mas-aims', `${skippedDuties} duty/duties skipped due to parse errors`, {
      skippedDuties, totalExtracted: duties.length,
    });
  }

  logger?.info('mas-aims', 'Parse complete', {
    dutiesExtracted: duties.length,
    flights:         duties.filter((d) => d.type === 'FLIGHT').length,
    standbys:        duties.filter((d) => d.type === 'STANDBY').length,
    offDays:         duties.filter((d) => d.type === 'OFF').length,
    training:        duties.filter((d) => d.type === 'TRAINING').length,
    skippedDuties,
    monthlyStats,
  });

  return {
    crewName,
    month:   rosterMonth,
    year:    rosterYear,
    airline: 'Malaysia Airlines',
    duties,
    monthlyStats,
  };
}
