'use server';

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { RosterData, DutyEvent } from '@/lib/types';
import type { RosterSummary } from '@/lib/types/roster';
import { calculateKilometers } from '@/lib/utils/geo/haversine';
import { extractDestinations } from '@/lib/utils/destinations';
import { setVerifiedAt } from '@/lib/actions/users';

export async function saveRoster(userId: string, rosterData: RosterData, icsContent?: string): Promise<string> {
  const flights = rosterData.events.filter((e) => e.type === 'FLIGHT');
  const totalSectors = flights.length;
  const totalKm = flights.reduce((acc, e) => {
    if (e.depPort && e.arrPort) return acc + calculateKilometers(e.depPort, e.arrPort);
    return acc;
  }, 0);
  const uniqueDestinations = extractDestinations(rosterData.events).length;

  const ref = await adminDb.collection('rosters').add({
    userId,
    month: rosterData.month,
    year: rosterData.year,
    crewName: rosterData.crewName ?? null,
    airline: 'MH',
    uploadedAt: Timestamp.now(),
    events: rosterData.events,
    eventCount: rosterData.events.length,
    totalSectors,
    totalKm,
    uniqueDestinations,
    ...(icsContent ? { icsContent } : {}),
  });

  // Mark user as verified crew on first successful roster parse (idempotent)
  await setVerifiedAt(userId);

  return ref.id;
}

export async function getUserRosters(userId: string): Promise<RosterSummary[]> {
  // Single-field query only — avoids needing a composite Firestore index.
  // Sort by uploadedAt descending in JS instead.
  const snap = await adminDb
    .collection('rosters')
    .where('userId', '==', userId)
    .get();

  return snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        month: d.month,
        year: d.year,
        crewName: d.crewName ?? null,
        airline: d.airline ?? 'MH',
        uploadedAt: (d.uploadedAt as Timestamp).toDate().toISOString(),
        eventCount: d.eventCount ?? 0,
        totalSectors: d.totalSectors ?? 0,
        totalKm: d.totalKm ?? 0,
        uniqueDestinations: d.uniqueDestinations ?? 0,
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)); // newest first
}

export async function deleteRoster(rosterId: string): Promise<void> {
  await adminDb.collection('rosters').doc(rosterId).delete();
}

export async function getRoster(rosterId: string): Promise<RosterData & { id: string }> {
  const doc = await adminDb.collection('rosters').doc(rosterId).get();
  if (!doc.exists) throw new Error('Roster not found');
  const d = doc.data()!;
  return {
    id: doc.id,
    month: d.month,
    year: d.year,
    crewName: d.crewName ?? undefined,
    events: d.events as DutyEvent[],
  };
}
