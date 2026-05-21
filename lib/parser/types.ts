export type DutyType = 'FLIGHT' | 'STANDBY' | 'LAYOVER' | 'OFF' | 'TRAINING' | 'GROUND';

// Re-export telemetry types so callers only need one import path
export type { ParseLogEntry, LogLevel } from './logger';
export type { ConfidenceScore, ConfidenceGrade, ConfidenceBreakdown } from './confidence';
export type { ParseReport, ParseStatus } from './report';

export interface ParsedFlight {
  flightNumber: string;
  depPort: string;
  arrPort: string;
  std: string;
  sta: string;
  signOn?: string;
  signOff?: string;
  hotel?: string;
}

export interface ParsedDuty {
  id: string;
  type: DutyType;
  date: string;       // ISO YYYY-MM-DD
  day?: string;       // "MON" | "TUE" … computed from date
  item?: string;      // flight number ("MH4") or duty code ("D", "DO", "S4-353")
  flight?: ParsedFlight;
  description?: string;
  signOn?: string;    // duty start time "HH:MM"
  signOff?: string;   // duty end time "HH:MM"
  blockHrs?: string;  // "HH:MM" direct from PDF Actual Block Hours column
  dutyHrs?: string;   // "HH:MM" direct from PDF Duty Hours column
  dutyCode?: string;  // AIMS pairing code e.g. "BA", "BB"
  acType?: string;    // aircraft type e.g. "359" (A350-900)
  notes?: string;     // hotel, layover port, or free-text from PDF
  /** Internal marker — set when this row is the arrival day of a long-haul.
   *  Merged into the preceding flight record during post-processing. */
  _isContinuation?: boolean;
}

/** Monthly aggregate values read directly from the PDF summary section. */
export interface ParsedMonthlyStats {
  actualBlockHours?: string;     // "HH:MM" — total block hours for the month
  dutyHours?: string;            // "HH:MM" — total duty hours for the month
  offDaysAtBase?: number;        // integer count of off days at base
  offDaysAwayFromBase?: number;  // integer count of off days away from base
}

export interface ParsedRoster {
  crewName: string;
  month: string;
  year: string;
  airline: string;
  duties: ParsedDuty[];
  monthlyStats?: ParsedMonthlyStats;
}

export class UnsupportedAirlineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedAirlineError';
  }
}
