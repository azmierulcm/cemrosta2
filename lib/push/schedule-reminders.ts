/**
 * schedule-reminders.ts
 *
 * Creates / replaces flight reminder documents in Firestore whenever a roster
 * is confirmed.  A separate cron job reads these documents and sends the
 * actual push notifications.
 *
 * Reminder timing:  STD (MYT / UTC+8) − 6 hours
 * Timezone note:    MAS rosters use MYT for all times.  We convert to UTC by
 *                   subtracting 8 hours before storing the sendAt timestamp.
 */

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { DutyEvent } from '@/lib/types';

const MYT_OFFSET_MS  = 8 * 60 * 60 * 1000; // UTC+8 → UTC
const LEAD_MS        = 6 * 60 * 60 * 1000; // 6-hour pre-flight reminder

/**
 * Parse a date string ("YYYY-MM-DD") and time string ("HH:MM") in MYT
 * and return the corresponding UTC Unix timestamp in ms, or null if either
 * value is malformed.
 */
function toUtcMs(date: string, std: string): number | null {
  const dateParts = date.split('-').map(Number);
  const timeParts = std.split(':').map(Number);

  if (dateParts.length < 3 || timeParts.length < 2) return null;

  const [year, month, day] = dateParts;
  const [h, m]             = timeParts;

  if ([year, month, day, h, m].some((n) => isNaN(n))) return null;

  // Build UTC timestamp treating the input as MYT (UTC+8)
  return Date.UTC(year, month - 1, day, h, m, 0) - MYT_OFFSET_MS;
}

/**
 * Schedule push-notification reminders for all flight duties in a roster.
 *
 * - Deletes any existing unsent reminders for the same user/year/month first
 *   (handles re-uploads of the same month cleanly).
 * - Skips flights whose reminder time is already in the past.
 * - Batches all Firestore writes in a single atomic commit.
 */
export async function scheduleFlightReminders(
  userId: string,
  events: DutyEvent[],
  year: string | number,
  month: string | number,
): Promise<void> {
  const now  = Date.now();
  const yearStr  = String(year);
  const monthStr = String(month);

  const batch = adminDb.batch();

  // ── 1. Delete stale unsent reminders for this user/month ─────────────────
  const staleSnap = await adminDb
    .collection('flight_reminders')
    .where('userId',  '==', userId)
    .where('year',    '==', yearStr)
    .where('month',   '==', monthStr)
    .where('sent',    '==', false)
    .get();

  staleSnap.docs.forEach((doc) => batch.delete(doc.ref));

  // ── 2. Create new reminders ───────────────────────────────────────────────
  // Only KUL departures — crew on nightstop at another station are already
  // on-location and don't need a 6-hour wake-up reminder.
  const flights = events.filter(
    (e) => e.type === 'FLIGHT' && e.date && e.std && e.depPort === 'KUL',
  );

  for (const event of flights) {
    const deptMs  = toUtcMs(event.date!, event.std!);
    if (deptMs === null) continue;

    const sendAtMs = deptMs - LEAD_MS;
    if (sendAtMs <= now) continue; // reminder time already passed — skip

    const ref = adminDb.collection('flight_reminders').doc();
    batch.set(ref, {
      userId,
      year:      yearStr,
      month:     monthStr,
      sendAt:    Timestamp.fromMillis(sendAtMs),
      flightNo:  event.flightNumber ?? '',
      from:      event.depPort      ?? '',
      to:        event.arrPort      ?? '',
      std:       event.std          ?? '',
      date:      event.date         ?? '',
      sent:      false,
      createdAt: Timestamp.now(),
    });
  }

  await batch.commit();
}
