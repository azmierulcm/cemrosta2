export type DutyType = 'FLIGHT' | 'STANDBY' | 'LAYOVER' | 'OFF' | 'OTHER';

export interface DutyEvent {
  id: string;
  type: DutyType;
  date: string; // ISO format YYYY-MM-DD
  flightNumber?: string;
  depPort?: string;
  arrPort?: string;
  std?: string; // ISO format or time string
  sta?: string; // ISO format or time string
  signOn?: string;
  signOff?: string;
  duration?: string;
  hotel?: string;
  description?: string;
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
  destinations?: Destination[];
  stats?: RosterStats;
  /** Structured parse report — present only when returned from parseRosterPreview */
  parseReport?: import('@/lib/parser/report').ParseReport;
}
