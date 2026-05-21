import { adminDb } from '@/lib/firebase/admin';
import { getTopSuperlative } from './superlatives';
import type { PeriodConfig, RecapData, TopDestination } from './types';
import type { DutyEvent } from '@/lib/types';
import type { FirestoreRoster } from '@/lib/types/roster';

/** Convert month stored as 3-letter abbreviation ("MAY") or number ("05") to "05" */
const MONTH_ABBR: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};
function normalizeMonth(m: string): string {
  const upper = m.trim().toUpperCase();
  return MONTH_ABBR[upper] ?? String(m).padStart(2, '0');
}

/**
 * Fetch all roster documents for a user that fall within the period,
 * aggregate stats, and return a typed RecapData ready for the templates.
 */
export async function computeRecap(
  userId: string,
  period: PeriodConfig,
): Promise<RecapData> {
  // Fetch rosters + profile in parallel — both use the Admin SDK
  const [snap, profileSnap] = await Promise.all([
    adminDb.collection('rosters').where('userId', '==', userId).get(),
    adminDb.collection('profiles').doc(userId).get(),
  ]);

  // Filter to rosters whose year AND month fall within the period.
  // Handles month stored as abbreviation ("MAY") or zero-padded number ("05").
  const rosters = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreRoster))
    .filter((r) => {
      const yearMatch = String(r.year) === String(period.year);
      const monthMatch = period.months.includes(normalizeMonth(String(r.month)));
      return yearMatch && monthMatch;
    });

  // Aggregate top-level stats from summaries (fast — no full event load needed)
  const totalSectors = rosters.reduce((s, r) => s + (r.totalSectors ?? 0), 0);
  const totalKm = rosters.reduce((s, r) => s + (r.totalKm ?? 0), 0);

  // Crew name: prefer the profile full_name the user set in Settings,
  // fall back to the name parsed from the roster PDF, then a generic label.
  const profileName = (profileSnap.data()?.full_name as string | undefined)?.trim();
  const crewHandle = profileName || rosters[0]?.crewName || 'Crew';

  // Aggregate destination visit counts across all rosters
  const destCounts = new Map<string, number>();
  const allEvents: DutyEvent[] = [];

  for (const roster of rosters) {
    const events: DutyEvent[] = roster.events ?? [];
    allEvents.push(...events);

    for (const ev of events) {
      if (ev.type === 'FLIGHT' && ev.arrPort) {
        const iata = ev.arrPort.toUpperCase();
        destCounts.set(iata, (destCounts.get(iata) ?? 0) + 1);
      }
    }
  }

  // Top 5 destinations by visit count (exclude home base KUL from ranking)
  const topDestinations: TopDestination[] = [...destCounts.entries()]
    .filter(([iata]) => iata !== 'KUL')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([iata, visits]) => ({ iata, visits }));

  // New patches: IATA codes that appear for the first time in this period.
  // Heuristic: destinations visited exactly once across the user's full history
  // that have their first visit inside this period.
  // For now, derive from the roster's own events — a destination with visits === 1
  // in this period that hasn't appeared in earlier rosters is "new".
  // (Full history check requires another query — kept simple here.)
  const newPatches = [...destCounts.entries()]
    .filter(([, count]) => count === 1)
    .map(([iata]) => iata)
    .slice(0, 3);

  const superlative = getTopSuperlative(allEvents, 'KUL', period.type);

  return {
    userId,
    period,
    crewHandle,
    totalSectors,
    totalKm,
    topDestinations,
    newPatches,
    superlative,
  };
}
