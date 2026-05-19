import type { DutyEvent, MonthlyStats } from './index';

export interface RosterSummary {
  id: string;
  month: string;
  year: string;
  crewName: string | null;
  airline: string;
  uploadedAt: string; // ISO string
  eventCount: number;
  totalSectors: number;
  totalKm: number;
  totalBlockMinutes: number;
  uniqueDestinations: number;
  parserVersion?: string;
  monthlyStats?: MonthlyStats;
}

export interface FirestoreRoster extends RosterSummary {
  userId: string;
  events: DutyEvent[];
}
