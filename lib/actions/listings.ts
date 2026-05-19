'use server';

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { isVerifiedCrew } from '@/lib/actions/users';
import type {
  Listing,
  ListingInput,
  ListingStatus,
} from '@/lib/types/marketplace';
import {
  LISTING_EXPIRY_DAYS,
  MAX_ACTIVE_LISTINGS,
  AUTO_HIDE_REPORT_THRESHOLD,
} from '@/lib/types/marketplace';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toIso(ts: FirebaseFirestore.Timestamp | null | undefined): string {
  return ts ? ts.toDate().toISOString() : new Date().toISOString();
}

function docToListing(id: string, d: FirebaseFirestore.DocumentData): Listing {
  return {
    id,
    userId: d.userId,
    sellerName: d.sellerName,
    sellerVerified: d.sellerVerified ?? false,
    sellerBase: d.sellerBase ?? '',
    sellerMemberSince: d.sellerMemberSince ?? '',
    title: d.title,
    category: d.category,
    condition: d.condition,
    price: d.price,
    description: d.description,
    images: d.images ?? [],
    contactPref: d.contactPref,
    contactValue: d.contactValue,
    status: d.status,
    reportCount: d.reportCount ?? 0,
    reportedBy: d.reportedBy ?? [],
    createdAt: toIso(d.createdAt),
    expiresAt: toIso(d.expiresAt),
    renewedAt: d.renewedAt ? toIso(d.renewedAt) : null,
    updatedAt: toIso(d.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateListingOptions {
  userId: string;
  sellerName: string;
  sellerBase: string;
  sellerMemberSince: string;
  input: ListingInput;
}

export async function createListing(opts: CreateListingOptions): Promise<string> {
  const { userId, sellerName, sellerBase, sellerMemberSince, input } = opts;

  const verified = await isVerifiedCrew(userId);

  // Count active listings without compound query (avoids composite index)
  const allUserSnap = await adminDb
    .collection('listings')
    .where('userId', '==', userId)
    .get();
  const activeCount = allUserSnap.docs.filter((d) => d.data().status === 'active').length;
  if (activeCount >= MAX_ACTIVE_LISTINGS) {
    throw new Error(`You can have at most ${MAX_ACTIVE_LISTINGS} active listings.`);
  }

  const now      = Timestamp.now();
  const expiresAt = Timestamp.fromDate(addDays(now.toDate(), LISTING_EXPIRY_DAYS));

  const ref = await adminDb.collection('listings').add({
    userId,
    sellerName,
    sellerVerified: verified,
    sellerBase,
    sellerMemberSince,
    ...input,
    status: 'active' as ListingStatus,
    reportCount: 0,
    reportedBy: [],
    createdAt: now,
    expiresAt,
    renewedAt: null,
    updatedAt: now,
  });

  return ref.id;
}

// ---------------------------------------------------------------------------
// Read — index
// Fetches by createdAt only (single-field index, always available),
// then filters/sorts in JS — avoids needing composite Firestore indexes.
// ---------------------------------------------------------------------------

export interface GetListingsOptions {
  category?: string;
  sort?: 'newest' | 'price-asc' | 'price-desc';
  verifiedOnly?: boolean;
  limit?: number;
}

export async function getListings(opts: GetListingsOptions = {}): Promise<Listing[]> {
  const { category, sort = 'newest', verifiedOnly = false, limit: pageSize = 50 } = opts;

  // Single-field query — no composite index needed
  const snap = await adminDb
    .collection('listings')
    .orderBy('createdAt', 'desc')
    .limit(200) // fetch extra then filter in JS
    .get();

  let results = snap.docs
    .map((doc) => docToListing(doc.id, doc.data()))
    .filter((l) => l.status === 'active');

  if (category)     results = results.filter((l) => l.category === category);
  if (verifiedOnly) results = results.filter((l) => l.sellerVerified);

  if (sort === 'price-asc')  results.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') results.sort((a, b) => b.price - a.price);
  // 'newest' is already ordered by createdAt desc from Firestore

  return results.slice(0, pageSize);
}

// ---------------------------------------------------------------------------
// Read — single
// ---------------------------------------------------------------------------

export async function getListing(listingId: string): Promise<Listing> {
  const doc = await adminDb.collection('listings').doc(listingId).get();
  if (!doc.exists) throw new Error('Listing not found');
  return docToListing(doc.id, doc.data()!);
}

// ---------------------------------------------------------------------------
// Read — by user
// ---------------------------------------------------------------------------

export async function getUserListings(userId: string): Promise<Listing[]> {
  const snap = await adminDb
    .collection('listings')
    .where('userId', '==', userId)
    .get();
  return snap.docs
    .map((doc) => docToListing(doc.id, doc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateListing(
  listingId: string,
  userId: string,
  input: Partial<ListingInput>,
): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Listing not found');
  if (doc.data()!.userId !== userId) throw new Error('Not authorized');
  await ref.update({ ...input, updatedAt: Timestamp.now() });
}

// ---------------------------------------------------------------------------
// Status / delete
// ---------------------------------------------------------------------------

export async function setListingStatus(
  listingId: string,
  userId: string,
  status: ListingStatus,
): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Listing not found');
  if (doc.data()!.userId !== userId) throw new Error('Not authorized');
  await ref.update({ status, updatedAt: Timestamp.now() });
}

export async function deleteListing(listingId: string, userId: string): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Listing not found');
  if (doc.data()!.userId !== userId) throw new Error('Not authorized');
  await ref.delete();
}

// ---------------------------------------------------------------------------
// Renew
// ---------------------------------------------------------------------------

export async function renewListing(listingId: string, userId: string): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Listing not found');
  const data = doc.data()!;
  if (data.userId !== userId) throw new Error('Not authorized');
  if (data.status === 'sold') throw new Error('Cannot renew a sold listing');

  const now      = Timestamp.now();
  const expiresAt = Timestamp.fromDate(addDays(now.toDate(), LISTING_EXPIRY_DAYS));
  await ref.update({ status: 'active', renewedAt: now, expiresAt, updatedAt: now });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export async function reportListing(listingId: string, reportingUserId: string): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);

  await adminDb.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new Error('Listing not found');
    const data = doc.data()!;

    if ((data.reportedBy ?? []).includes(reportingUserId)) {
      throw new Error('You have already reported this listing');
    }

    const newCount  = (data.reportCount ?? 0) + 1;
    const shouldHide = newCount >= AUTO_HIDE_REPORT_THRESHOLD;

    tx.update(ref, {
      reportCount: newCount,
      reportedBy: FieldValue.arrayUnion(reportingUserId),
      ...(shouldHide ? { status: 'hidden' } : {}),
      updatedAt: Timestamp.now(),
    });
  });
}

// ---------------------------------------------------------------------------
// Admin — moderation queue
// ---------------------------------------------------------------------------

export async function getModQueue(): Promise<Listing[]> {
  const snap = await adminDb
    .collection('listings')
    .where('status', '==', 'hidden')
    .get();
  return snap.docs
    .map((doc) => docToListing(doc.id, doc.data()))
    .sort((a, b) => b.reportCount - a.reportCount);
}

export async function restoreListing(listingId: string): Promise<void> {
  await adminDb.collection('listings').doc(listingId).update({
    status: 'active',
    reportCount: 0,
    reportedBy: [],
    updatedAt: Timestamp.now(),
  });
}

// ---------------------------------------------------------------------------
// Admin — all listings (no auth check — server-only, called from admin pages)
// ---------------------------------------------------------------------------

export async function adminGetAllListings(): Promise<Listing[]> {
  const snap = await adminDb
    .collection('listings')
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((doc) => docToListing(doc.id, doc.data()));
}

export async function adminSetListingStatus(listingId: string, status: ListingStatus): Promise<void> {
  await adminDb.collection('listings').doc(listingId).update({
    status,
    updatedAt: Timestamp.now(),
  });
}

export async function adminDeleteListing(listingId: string): Promise<void> {
  await adminDb.collection('listings').doc(listingId).delete();
}

export async function adminUpdateListing(listingId: string, input: Partial<ListingInput>): Promise<void> {
  await adminDb.collection('listings').doc(listingId).update({
    ...input,
    updatedAt: Timestamp.now(),
  });
}
