import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import type { Bucket } from '@google-cloud/storage'

// ── Lazy initialisation ───────────────────────────────────────────────────────
// Do NOT call getFirestore / getAuth / getStorage at module-load time.
// Next.js evaluates server modules during static-page generation (build phase),
// and Firebase throws "Service not available" when invoked without a live
// request context.  Instead we initialise on first property access via Proxy.

function ensureApp(): App {
  if (getApps().length) return getApps()[0]!;
  return initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // .env stores \n as literal \\n — restore actual newlines
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    // Admin SDK needs the real GCS bucket name (*.appspot.com), not the
    // client-facing *.firebasestorage.app URL.
    storageBucket:
      process.env.FIREBASE_ADMIN_STORAGE_BUCKET ??
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

function makeLazy<T extends object>(factory: () => T): T {
  let instance: T | undefined;
  return new Proxy({} as T, {
    get(_, prop) {
      if (!instance) instance = factory();
      return (instance as Record<string | symbol, unknown>)[prop as string | symbol];
    },
  });
}

export const adminDb: Firestore = makeLazy(() => {
  ensureApp();
  return getFirestore();
});

export const adminAuth: Auth = makeLazy(() => {
  ensureApp();
  return getAuth();
});

export const adminBucket: Bucket = makeLazy(() => {
  ensureApp();
  return getStorage().bucket();
});
