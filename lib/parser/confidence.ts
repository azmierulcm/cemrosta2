import type { ParsedRoster } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Confidence Scoring Engine
//
// Scores a completed parse result against five weighted dimensions and returns
// a 0–100 overall score, a letter grade, and a list of human-readable flags
// that describe exactly what was wrong.
//
// Weights:
//   Text density       20 % — catch image/scanned PDFs early
//   Date extraction    30 % — dates are the parse skeleton; missing = bad
//   Port code quality  20 % — IATA completeness on flights
//   Timing integrity   20 % — valid HH:MM on std/sta fields
//   Crew name          10 % — bonus for successful name extraction
// ─────────────────────────────────────────────────────────────────────────────

export type ConfidenceGrade = 'HIGH' | 'MEDIUM' | 'LOW' | 'FAILED';

export interface ConfidenceBreakdown {
  textDensity: number;        // 0–100
  dateExtraction: number;     // 0–100
  portCodeIntegrity: number;  // 0–100
  timingIntegrity: number;    // 0–100
  crewNameFound: boolean;
}

export interface ConfidenceScore {
  overall: number;            // 0–100, rounded
  grade: ConfidenceGrade;
  breakdown: ConfidenceBreakdown;
  /** Machine-readable flag codes; empty on a clean parse */
  flags: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const TIME_RE = /^\d{2}:\d{2}$/;
const IATA_RE = /^[A-Z]{3}$/;

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function pct(numerator: number, denominator: number): number {
  return denominator === 0 ? 100 : clamp((numerator / denominator) * 100);
}

// ── Main scorer ─────────────────────────────────────────────────────────────

export function scoreRosterParse(parsed: ParsedRoster, rawText: string): ConfidenceScore {
  const flags: string[] = [];

  // ── 1. Text density ────────────────────────────────────────────────────────
  // Non-whitespace chars / total chars.  Typical text PDFs: 40–60%.
  // Scanned or corrupt PDFs often produce < 5 % meaningful characters.
  const totalChars = rawText.length;
  const nonWsChars = (rawText.match(/\S/g) ?? []).length;
  // *2 so that a perfectly dense text (50% non-ws) still scores ~100
  const textDensity = totalChars > 0 ? clamp((nonWsChars / totalChars) * 200) : 0;

  if (textDensity < 30) {
    flags.push('LOW_TEXT_DENSITY — possible scanned or empty PDF');
  }

  // ── 2. Date extraction ────────────────────────────────────────────────────
  // Compare calendar-date occurrences in the raw text vs duties actually parsed.
  const rawDateCount = (rawText.match(/\d{2}-[A-Z]{3}-\d{4}/gi) ?? []).length;
  const dutyCount = parsed.duties.length;
  const dateExtraction = rawDateCount > 0 ? pct(dutyCount, rawDateCount) : 0;

  if (dutyCount === 0) {
    flags.push('NO_DUTIES_EXTRACTED — parser found zero duty entries');
  } else if (rawDateCount > 0 && dutyCount < rawDateCount * 0.5) {
    flags.push(
      `LOW_DATE_COVERAGE — only ${dutyCount} duties from ${rawDateCount} date blocks`,
    );
  }

  // ── 3. Port code integrity ─────────────────────────────────────────────────
  const flights = parsed.duties.filter((d) => d.type === 'FLIGHT' && d.flight);
  let portCodeIntegrity = 100;

  if (flights.length > 0) {
    const totalPortSlots = flights.length * 2;
    const missingDep = flights.filter(
      (d) => !d.flight?.depPort || !IATA_RE.test(d.flight.depPort),
    ).length;
    const missingArr = flights.filter(
      (d) => !d.flight?.arrPort || !IATA_RE.test(d.flight.arrPort),
    ).length;

    portCodeIntegrity = pct(totalPortSlots - missingDep - missingArr, totalPortSlots);

    if (missingDep > 0) flags.push(`MISSING_DEP_PORT — ${missingDep} flight(s) have no departure IATA`);
    if (missingArr > 0) flags.push(`MISSING_ARR_PORT — ${missingArr} flight(s) have no arrival IATA`);
  }

  // ── 4. Timing integrity ────────────────────────────────────────────────────
  let timingIntegrity = 100;

  if (flights.length > 0) {
    const totalTimeSlots = flights.length * 2;
    const missingStd = flights.filter(
      (d) => !d.flight?.std || !TIME_RE.test(d.flight.std),
    ).length;
    const missingSta = flights.filter(
      (d) => !d.flight?.sta || !TIME_RE.test(d.flight.sta),
    ).length;

    timingIntegrity = pct(totalTimeSlots - missingStd - missingSta, totalTimeSlots);

    if (missingStd + missingSta > 0) {
      flags.push(`MISSING_TIMES — ${missingStd + missingSta} STD/STA field(s) blank or malformed`);
    }
  }

  // ── 5. Crew name ──────────────────────────────────────────────────────────
  const crewNameFound =
    !!parsed.crewName &&
    parsed.crewName !== 'Crew Member' &&
    parsed.crewName.trim().length > 0;

  if (!crewNameFound) {
    flags.push('CREW_NAME_NOT_FOUND — Name: field missing or could not be parsed');
  }

  // ── Weighted aggregate ─────────────────────────────────────────────────────
  const overall = clamp(
    textDensity      * 0.20 +
    dateExtraction   * 0.30 +
    portCodeIntegrity * 0.20 +
    timingIntegrity  * 0.20 +
    (crewNameFound ? 10 : 0),
  );

  const grade: ConfidenceGrade =
    overall >= 80 ? 'HIGH' :
    overall >= 55 ? 'MEDIUM' :
    overall >= 25 ? 'LOW' :
    'FAILED';

  return {
    overall: Math.round(overall),
    grade,
    breakdown: {
      textDensity: Math.round(textDensity),
      dateExtraction: Math.round(dateExtraction),
      portCodeIntegrity: Math.round(portCodeIntegrity),
      timingIntegrity: Math.round(timingIntegrity),
      crewNameFound,
    },
    flags,
  };
}

// ── Quick pre-parse text check (before running the airline parser) ──────────

/** Returns true if the raw extracted text looks too sparse to be a real roster. */
export function isTextTooSparse(text: string, threshold = 0.05): boolean {
  if (!text.trim()) return true;
  const alphaNum = (text.match(/[a-zA-Z0-9]/g) ?? []).length;
  return alphaNum / text.length < threshold;
}
