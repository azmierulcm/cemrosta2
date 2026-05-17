'use server';

import { adminDb } from '@/lib/firebase/admin';

export interface ProfileData {
  full_name?: string;
  rank?: string;
  airline?: string;
  fleet?: string;
  base?: string;
  bio?: string;
}

/**
 * Upsert a user's profile using the Admin SDK, which bypasses Firestore
 * security rules. Returns { ok: true } on success, { ok: false, error } on
 * failure so the client can surface a real error message instead of guessing.
 */
export async function saveProfile(
  userId: string,
  data: ProfileData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await adminDb
      .collection('profiles')
      .doc(userId)
      .set(data, { merge: true });
    return { ok: true };
  } catch (err) {
    console.error('[saveProfile] Firestore write failed:', err);
    return { ok: false, error: String(err) };
  }
}
