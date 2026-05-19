export type DutyType = 'FLIGHT' | 'STANDBY' | 'OFF' | 'TRAINING' | 'GROUND';

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
  date: string;    // ISO YYYY-MM-DD
  day?: string;    // "MON" | "TUE" … computed from date
  item?: string;   // flight number ("MH001") or duty code ("OFF", "SBY", "SIM")
  flight?: ParsedFlight;
  description?: string;
  signOn?: string;
  signOff?: string;
  blockHrs?: string;  // "HH:MM" direct from PDF block-hours column (best-effort)
  dutyHrs?: string;   // "HH:MM" direct from PDF duty-hours column (best-effort)
  notes?: string;     // hotel, layover port, or free-text from PDF
}

/** Monthly aggregate values read directly from the PDF summary section. */
export interface ParsedMonthlyStats {
  actualBlockHours?: string;  // "HH:MM" — total block hours for the month
  dutyHours?: string;         // "HH:MM" — total duty hours for the month
  offDaysAtBase?: number;     // integer count of off days
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
