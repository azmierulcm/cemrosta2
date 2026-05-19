'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  uid:         string;
  email:       string;
  displayName: string;
  createdAt:   string;
  // profile fields
  full_name?:  string;
  rank?:       string;
  airline?:    string;
  fleet?:      string;
  base?:       string;
  bio?:        string;
  avatar_url?: string;
  verifiedAt?: string;
}

export interface AdminStats {
  totalUsers:      number;
  totalListings:   number;
  activeListings:  number;
  hiddenListings:  number;
  soldListings:    number;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const [profilesSnap, listingsSnap] = await Promise.all([
    adminDb.collection('profiles').get(),
    adminDb.collection('listings').get(),
  ]);

  const listings = listingsSnap.docs.map((d) => d.data());
  return {
    totalUsers:     profilesSnap.size,
    totalListings:  listings.length,
    activeListings: listings.filter((l) => l.status === 'active').length,
    hiddenListings: listings.filter((l) => l.status === 'hidden').length,
    soldListings:   listings.filter((l) => l.status === 'sold').length,
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function adminGetAllUsers(): Promise<AdminUser[]> {
  const profilesSnap = await adminDb.collection('profiles').get();

  // Fetch Firebase Auth users in a batch (max 100 per call)
  const uids = profilesSnap.docs.map((d) => d.id);
  const authUsers: Record<string, { email: string; displayName: string; createdAt: string }> = {};

  for (let i = 0; i < uids.length; i += 100) {
    const batch = uids.slice(i, i + 100);
    const result = await adminAuth.getUsers(batch.map((uid) => ({ uid })));
    for (const u of result.users) {
      authUsers[u.uid] = {
        email:       u.email ?? '',
        displayName: u.displayName ?? '',
        createdAt:   u.metadata.creationTime ?? '',
      };
    }
  }

  return profilesSnap.docs.map((doc) => {
    const d    = doc.data();
    const auth = authUsers[doc.id] ?? { email: '', displayName: '', createdAt: '' };
    const verifiedTs = d.verifiedAt as FirebaseFirestore.Timestamp | undefined;
    return {
      uid:        doc.id,
      email:      auth.email,
      displayName: auth.displayName,
      createdAt:  auth.createdAt,
      full_name:  d.full_name,
      rank:       d.rank,
      airline:    d.airline,
      fleet:      d.fleet,
      base:       d.base,
      bio:        d.bio,
      avatar_url: d.avatar_url,
      verifiedAt: verifiedTs ? verifiedTs.toDate().toISOString() : undefined,
    };
  });
}

export async function adminUpdateUser(
  uid: string,
  fields: Partial<Pick<AdminUser, 'full_name' | 'rank' | 'airline' | 'fleet' | 'base' | 'bio'>>,
): Promise<void> {
  await adminDb.collection('profiles').doc(uid).set(fields, { merge: true });
}

export async function adminDeleteUser(uid: string): Promise<void> {
  await Promise.all([
    adminAuth.deleteUser(uid),
    adminDb.collection('profiles').doc(uid).delete(),
  ]);
}
