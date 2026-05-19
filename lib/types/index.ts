export type DutyType = 'FLIGHT' | 'STANDBY' | 'LAYOVER' | 'OFF' | 'TRAINING' | 'GROUND' | 'OTHER';

export interface DutyEvent {
  id: string;
  type: DutyType;
  date: string;         // ISO format YYYY-MM-DD
  day?: string;         // "MON" | "TUE" … day of week
  item?: string;        // flight number ("MH001") or duty code ("OFF", "SBY")
  flightNumber?: string;
  depPort?: string;
  arrPort?: string;
  std?: string;
  sta?: string;
  signOn?: string;
  signOff?: string;
  blockHrs?: string;    // "HH:MM" from PDF block-hours column
  dutyHrs?: string;     // "HH:MM" from PDF duty-hours column
  duration?: string;
  hotel?: string;
  description?: string;
  notes?: string;       // layover port, hotel, or other free-text from PDF
}

export interface MonthlyStats {
  actualBlockHours?: string;  // "HH:MM" — read directly from PDF summary
  dutyHours?: string;         // "HH:MM" — read directly from PDF summary
  offDaysAtBase?: number;
}

export interface Destination {
  city: string;
  country: string;
  iata: string;
  count: number;
  lastVisited: string;
  colorTheme: string;
  shape: 'oval' | 'hexagon' | 'rectangle';
}

export interface RosterStats {
  totalSectors: number;
  totalMiles: number;
  totalBlockTime: string;
  uniqueDestinations: number;
}

export interface RosterData {
  events: DutyEvent[];
  month: string;
  year: string;
  crewName?: string;
  /** IATA airline code, e.g. "MH". Parsed from the roster; stored in Firestore. */
  airline?: string;
  destinations?: Destination[];
  stats?: RosterStats;
  /** Aggregate block time in minutes — computed by enrichment module. */
  totalBlockMinutes?: number;
  /** Monthly stats read directly from the PDF summary section. */
  monthlyStats?: MonthlyStats;
  /** Structured parse report — present only when returned from parseRosterPreview */
  parseReport?: import('@/lib/parser/report').ParseReport;
}
