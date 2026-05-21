// ─────────────────────────────────────────────────────────────────────────────
// Roster Enrichment Module
//
// PROCEDURE FLOW — from raw ParsedRoster → Firestore-ready DutyEvent[]
// ─────────────────────────────────────────────────────────────────────────────
//
// After the airline-specific parser (mas-aims.ts) produces a ParsedRoster,
// this module runs a deterministic enrichment pass before the data is stored.
// The enrichment is PURE — it takes immutable input and returns a new
// enriched structure without mutating the original.
//
// ┌───────────────────────────────────────────────────────────────────────────┐
// │  STAGE 1 · parseMasAims()       raw text → ParsedRoster                  │
// │  STAGE 2 · enrichParsedRoster() ParsedRoster → EnrichedRoster  ← HERE   │
// │  STAGE 3 · scoreRosterParse()   EnrichedRoster → ConfidenceScore         │
// │  STAGE 4 · buildReport()        all → ParseReport (always emitted)       │
// │  STAGE 5 · saveRoster()         EnrichedRoster → Firestore               │
// │  STAGE 6 · recordParseFeedback() ParseReport → parse_feedback collection │
// └───────────────────────────────────────────────────────────────────────────┘
//
// Per-flight enrichment:
//   • blockMinutes  — STA minus STD, midnight-crossing aware.
//   • distanceKm    — haversine great-circle distance (requires IATA coords).
//   • isLayover     — last leg of the day lands away from the home base port.
//   • isTurnback    — last leg returns to base on the same duty day.
//
// Per-day enrichment:
//   • dutyMinutes   — signOff minus signOn for the duty day.
//   • hasLayover    — true when the last flight does not return to base.
//
// Aggregate stats:
//   • totalBlockMinutes, totalDutyMinutes, totalKm
//   • totalSectors (flight legs)
//   • daysOff, trainingDays, standbyDays
//   • layoverCount (multi-day stays away from base)
//   • inferredBase — IATA code deduced from highest departure frequency
//
// ─────────────────────────────────────────────────────────────────────────────

import type { ParsedRoster, ParsedDuty, ParsedFlight } from './types';
import { calculateKilometers } from '@/lib/utils/geo/haversine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EnrichedFlight extends ParsedFlight {
  /** Block time in minutes (STA − STD, midnight-crossing corrected). */
  blockMinutes: number;
  /** Great-circle distance in km between depPort and arrPort. */
  distanceKm: number;
}

export interface EnrichedDuty extends Omit<ParsedDuty, 'flight'> {
  flight?: EnrichedFlight;
  /** Total duty minutes (signOff − signOn). 0 when either time is absent. */
  dutyMinutes: number;
  /**
   * true when this duty ends at a port other than the home base — i.e. the
   * crew is away overnight.  Always false for non-flight duties.
   */
  isLayover: boolean;
  // blockHrs, dutyHrs, day, item, notes are inherited from ParsedDuty via Omit
}

export interface EnrichedRoster {
  crewName: string;
  month: string;
  year: string;
  airline: string;
  /** Home base IATA — inferred from the most frequent departure port. */
  inferredBase: string;
  duties: EnrichedDuty[];
  /** Monthly stats read directly from the PDF summary section. */
  monthlyStats?: import('./types').ParsedMonthlyStats;

  // ── Aggregate stats (computed — used as fallback when monthlyStats absent) ─
  totalBlockMinutes: number;
  totalDutyMinutes: number;
  totalKm: number;
  totalSectors: number;
  daysOff: number;
  trainingDays: number;
  standbyDays: number;
  layoverCount: number;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Parse "HH:MM" → total minutes since midnight.
 * Returns null when the string is absent or malformed.
 */
function toMinutes(time: string | undefined): number | null {
  if (!time) return null;
  const parts = time.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Calculate block minutes between STD and STA, correcting for midnight crossing.
 * If STA < STD (e.g. dep 22:00, arr 02:00) we add 1440 minutes.
 */
function calcBlockMinutes(std: string, sta: string): number {
  const depMin = toMinutes(std);
  const arrMin = toMinutes(sta);
  if (depMin === null || arrMin === null) return 0;
  let diff = arrMin - depMin;
  if (diff < 0) diff += 1440;
  return diff;
}

/**
 * Calculate duty minutes from signOn → signOff.
 * Handles overnight duties (signOff < signOn) by adding 1440.
 */
function calcDutyMinutes(signOn: string | undefined, signOff: string | undefined): number {
  const onMin  = toMinutes(signOn);
  const offMin = toMinutes(signOff);
  if (onMin === null || offMin === null) return 0;
  let diff = offMin - onMin;
  if (diff < 0) diff += 1440;
  return diff;
}

/**
 * Infer the crew's home base from the raw ParsedDuty list.
 *
 * Strategy: count how many times each IATA code appears as a departure port.
 * The most frequent departure port is almost certainly the home base.
 * Ties broken by also counting arrivals.
 *
 * Falls back to 'KUL' (Malaysia Airlines home base) if no flights found.
 */
function inferHomeBase(duties: ParsedDuty[]): string {
  const depCounts = new Map<string, number>();

  for (const duty of duties) {
    if (duty.type !== 'FLIGHT' || !duty.flight?.depPort) continue;
    const dep = duty.flight.depPort.toUpperCase();
    depCounts.set(dep, (depCounts.get(dep) ?? 0) + 1);
  }

  if (depCounts.size === 0) return 'KUL';

  let best = 'KUL';
  let bestCount = 0;
  for (const [iata, count] of depCounts) {
    if (count > bestCount) {
      bestCount = count;
      best = iata;
    }
  }
  return best;
}

/**
 * Determine whether a duty day ends in a layover.
 *
 * Logic:
 *  - Group all FLIGHT duties on the same date.
 *  - Take the LAST flight's arrPort.
 *  - If arrPort ≠ inferredBase → layover.
 *
 * Returns false for non-flight duties.
 */
function buildLayoverIndex(duties: ParsedDuty[], base: string): Set<string> {
  // dateISO → arrPort of last flight that day
  const lastArrByDate = new Map<string, string>();

  for (const duty of duties) {
    if (duty.type !== 'FLIGHT' || !duty.flight?.arrPort) continue;
    // Since duties are iterated in order, the last write wins (last flight of day)
    lastArrByDate.set(duty.date, duty.flight.arrPort.toUpperCase());
  }

  const layoverDates = new Set<string>();
  for (const [date, arrPort] of lastArrByDate) {
    if (arrPort !== base) layoverDates.add(date);
  }
  return layoverDates;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Enrich a ParsedRoster with computed metrics.
 *
 * This is the authoritative transformation that converts the raw parser output
 * into the data model stored in Firestore.  All derived stats (blockMinutes,
 * distanceKm, isLayover, totals) live here — NOT in the parser or in the UI.
 */
export function enrichParsedRoster(parsed: ParsedRoster): EnrichedRoster {
  const base = inferHomeBase(parsed.duties);
  const layoverDates = buildLayoverIndex(parsed.duties, base);

  let totalBlockMinutes = 0;
  let totalDutyMinutes  = 0;
  let totalKm           = 0;
  let totalSectors      = 0;
  let daysOff           = 0;
  let trainingDays      = 0;
  let standbyDays       = 0;

  const enrichedDuties: EnrichedDuty[] = parsed.duties.map((duty) => {
    const isLayover = layoverDates.has(duty.date);

    // ── Per-duty common fields ───────────────────────────────────────────
    const dutyMinutes = calcDutyMinutes(duty.signOn, duty.signOff);
    if (duty.type !== 'FLIGHT') {
      totalDutyMinutes += dutyMinutes;
    }

    // ── Type-specific enrichment ─────────────────────────────────────────
    // Non-flight duties: drop the `flight` property entirely so the return
    // type satisfies EnrichedDuty (which requires flight?: EnrichedFlight,
    // not flight?: ParsedFlight).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { flight: _rawFlight, ...dutyBase } = duty;

    switch (duty.type) {
      case 'OFF':
        daysOff++;
        return { ...dutyBase, dutyMinutes: 0, isLayover: false };

      case 'TRAINING':
        trainingDays++;
        totalDutyMinutes += dutyMinutes;
        return { ...dutyBase, dutyMinutes, isLayover: false };

      case 'STANDBY':
        standbyDays++;
        totalDutyMinutes += dutyMinutes;
        return { ...dutyBase, dutyMinutes, isLayover: false };

      case 'FLIGHT': {
        if (!duty.flight) {
          return { ...dutyBase, dutyMinutes: 0, isLayover };
        }

        const { std, sta, depPort, arrPort, signOn, signOff } = duty.flight;

        const blockMinutes = calcBlockMinutes(std, sta);
        const distanceKm   = calculateKilometers(depPort, arrPort);
        const flightDuty   = calcDutyMinutes(
          duty.signOn ?? signOn,
          duty.signOff ?? signOff,
        );

        totalBlockMinutes += blockMinutes;
        totalDutyMinutes  += flightDuty || dutyMinutes;
        totalKm           += distanceKm;
        totalSectors      += 1;

        const enrichedFlight: EnrichedFlight = {
          ...duty.flight,
          blockMinutes,
          distanceKm,
        };

        return {
          ...duty,
          flight: enrichedFlight,
          dutyMinutes: flightDuty || dutyMinutes,
          isLayover,
        };
      }

      default:
        return { ...dutyBase, dutyMinutes, isLayover: false };
    }
  });

  // De-duplicate layoverCount — one layover per unique date, not per flight leg
  // (already correctly computed because isLayover is per-duty, and we count
  //  it once per flight duty, but a 2-leg day produces 2 FLIGHT duties both
  //  on the same date → recount from the set size instead)
  const layoverCountCorrected = layoverDates.size;

  return {
    crewName:         parsed.crewName,
    month:            parsed.month,
    year:             parsed.year,
    airline:          parsed.airline,
    inferredBase:     base,
    duties:           enrichedDuties,
    monthlyStats:     parsed.monthlyStats,
    totalBlockMinutes,
    totalDutyMinutes,
    totalKm,
    totalSectors,
    daysOff,
    trainingDays,
    standbyDays,
    layoverCount: layoverCountCorrected,
  };
}

/**
 * Map airline full name → IATA designator.
 * Used when storing rosters so we persist the IATA code, not the verbose name.
 */
export function airlineNameToIata(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('MALAYSIA') || upper.includes('MAS') || upper.includes('MH'))  return 'MH';
  if (upper.includes('AIR ASIA') || upper.includes('AIRASIA'))                       return 'AK';
  if (upper.includes('BATIK') || upper.includes('MALINDO'))                          return 'OD';
  if (upper.includes('FIREFLY'))                                                      return 'FY';
  if (upper.includes('SINGAPORE'))                                                    return 'SQ';
  if (upper.includes('THAI'))                                                         return 'TG';
  if (upper.includes('EMIRATES'))                                                     return 'EK';
  if (upper.includes('QATAR'))                                                        return 'QR';
  if (upper.includes('CATHAY'))                                                       return 'CX';
  return name.slice(0, 2).toUpperCase(); // best-effort two-letter fallback
}
