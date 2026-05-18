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
  date: string; // ISO YYYY-MM-DD
  flight?: ParsedFlight;
  description?: string;
  signOn?: string;
  signOff?: string;
}

export interface ParsedRoster {
  crewName: string;
  month: string;
  year: string;
  airline: string;
  duties: ParsedDuty[];
}

export class UnsupportedAirlineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedAirlineError';
  }
}
