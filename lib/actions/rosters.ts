'use server';

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { RosterData, DutyEvent } from '@/lib/types';
import type { RosterSummary } from '@/lib/types/roster';
import { calculateKilometers, calcTotalBlockMinutes } from '@/lib/utils/geo/haversine';
import { extractDestinations } from '@/lib/utils/destinations';
import { setVerifiedAt } from '@/lib/actions/users';
import { PARSER_VERSION } from '@/lib/parser/version';

// ─────────────────────────────────────────────────────────────────────────────
// Roster persistence — Firestore CRUD
//
// Bug fixes in this revision:
//   • airline field now uses the parsed IATA code (via RosterData.airline)
//     instead of the hardcoded string 'MH'.
//   • Duplicate roster detection — rejects uploads for the same userId +
//     month + year combination to prevent double-entries.
//   • totalBlockMinutes is now computed and stored on every save / update.
//   • parserVersion is stamped on every document so future re-parse sweeps
//     can target old-format rosters precisely.
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute all aggregate stats from a flat array of DutyEvents. */
function computeSummaryStats(events: DutyEvent[]) {
  const flights = events.filter((e) => e.type === 'FLIGHT');

  const totalSectors = flights.length;

  const totalKm = flights.reduce((acc, e) => {
    if (e.depPort && e.arrPort) return acc + calculateKilometers(e.depPort, e.arrPort);
    return acc;
  }, 0);

  const totalBlockMinutes = calcTotalBlockMinutes(flights);
  const uniqueDestinations = extractDestinations(events).length;

  return { totalSectors, totalKm, totalBlockMinutes, uniqueDestinations };
}

/**
 * Check whether the user already has a roster for this month+year.
 * Returns the existing roster ID if a duplicate is found, null otherwise.
 */
async function findDuplicateRoster(
  userId: string,
  month: string,
  year: string,
): Promise<string | null> {
  const snap = await adminDb
    .collection('rosters')
    .where('userId', '==', userId)
    .where('month', '==', month)
    .where('year', '==', year)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].id;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SaveRosterOptions {
  /** When true, replaces an existing roster for the same month/year. Default: false (throws). */
  allowOverwrite?: boolean;
}

export async function saveRoster(
  userId: string,
  rosterData: RosterData,
  icsContent?: string,
  options: SaveRosterOptions = {},
): Promise<string> {
  const { month, year } = rosterData;

  // ── Duplicate detection ────────────────────────────────────────────────────
  const existingId = await findDuplicateRoster(userId, month, year);

  if (existingId) {
    if (options.allowOverwrite) {
      // Delete the old document before writing the new one
      await adminDb.collection('rosters').doc(existingId).delete();
    } else {
      throw new Error(
        `You already have a roster for ${month} ${year}. Delete it first or re-upload to replace it.`,
      );
    }
  }

  // ── Compute stats ──────────────────────────────────────────────────────────
  const { totalSectors, totalKm, totalBlockMinutes, uniqueDestinations } =
    computeSummaryStats(rosterData.events);

  // ── Airline IATA code — use parsed value, fall back to 'MH' ──────────────
  // Bug fix: previously hardcoded to 'MH' regardless of parsed airline.
  const airline = rosterData.airline ?? 'MH';

  // ── Write to Firestore ─────────────────────────────────────────────────────
  const ref = await adminDb.collection('rosters').add({
    userId,
    month,
    year,
    crewName:          rosterData.crewName ?? null,
    airline,
    uploadedAt:        Timestamp.now(),
    events:            rosterData.events,
    eventCount:        rosterData.events.length,
    totalSectors,
    totalKm,
    totalBlockMinutes,
    uniqueDestinations,
    parserVersion:     PARSER_VERSION,
    ...(rosterData.monthlyStats ? { monthlyStats: rosterData.monthlyStats } : {}),
    ...(icsContent ? { icsContent } : {}),
  });

  // Mark user as verified crew on first successful roster parse (idempotent)
  await setVerifiedAt(userId);

  return ref.id;
}

export async function getUserRosters(userId: string): Promise<RosterSummary[]> {
  // Single-field query only — avoids needing a composite Firestore index.
  const snap = await adminDb
    .collection('rosters')
    .where('userId', '==', userId)
    .get();

  return snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id:                doc.id,
        month:             d.month,
        year:              d.year,
        crewName:          d.crewName ?? null,
        airline:           d.airline ?? 'MH',
        uploadedAt:        (d.uploadedAt as Timestamp).toDate().toISOString(),
        eventCount:        d.eventCount ?? 0,
        totalSectors:      d.totalSectors ?? 0,
        totalKm:           d.totalKm ?? 0,
        totalBlockMinutes: d.totalBlockMinutes ?? 0,
        uniqueDestinations: d.uniqueDestinations ?? 0,
        parserVersion:     d.parserVersion ?? undefined,
        monthlyStats:      d.monthlyStats ?? undefined,
      } satisfies RosterSummary;
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)); // newest first
}

export async function deleteRoster(rosterId: string): Promise<void> {
  await adminDb.collection('rosters').doc(rosterId).delete();
}

export async function updateRosterEvents(
  rosterId: string,
  events: DutyEvent[],
): Promise<void> {
  const { totalSectors, totalKm, totalBlockMinutes, uniqueDestinations } =
    computeSummaryStats(events);

  await adminDb.collection('rosters').doc(rosterId).update({
    events,
    eventCount:        events.length,
    totalSectors,
    totalKm,
    totalBlockMinutes,
    uniqueDestinations,
  });
}

export async function getRoster(rosterId: string): Promise<RosterData & { id: string }> {
  const doc = await adminDb.collection('rosters').doc(rosterId).get();
  if (!doc.exists) throw new Error('Roster not found');
  const d = doc.data()!;
  return {
    id:       doc.id,
    month:    d.month,
    year:     d.year,
    crewName: d.crewName ?? undefined,
    airline:  d.airline ?? 'MH',
    events:   d.events as DutyEvent[],
  };
}
