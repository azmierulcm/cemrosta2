'use server';

import { adminDb } from '@/lib/firebase/admin';

export interface EarnedDestination {
  iata: string;
  visits: number;
  isHome: boolean;
  isNew: boolean; // earned in the most recently uploaded roster
}

/**
 * Aggregates arrPort landings across ALL of a user's rosters.
 * isNew = true if the destination appears in the latestRosterId document.
 */
export async function getLifetimeDestinations(
  userId: string,
  latestRosterId?: string,
): Promise<EarnedDestination[]> {
  const snap = await adminDb
    .collection('rosters')
    .where('userId', '==', userId)
    .get();

  const visitMap = new Map<string, number>();
  const latestIatas = new Set<string>();

  for (const doc of snap.docs) {
    const events: any[] = doc.data().events ?? [];
    const isLatest = doc.id === latestRosterId;

    for (const e of events) {
      if (e.type === 'FLIGHT' && e.arrPort) {
        const iata = (e.arrPort as string).toUpperCase();
        if (!/^[A-Z]{3}$/.test(iata)) continue;
        visitMap.set(iata, (visitMap.get(iata) ?? 0) + 1);
        if (isLatest) latestIatas.add(iata);
      }
    }
  }

  return Array.from(visitMap.entries()).map(([iata, visits]) => ({
    iata,
    visits,
    isHome: iata === 'KUL',
    isNew: latestIatas.has(iata),
  }));
}
