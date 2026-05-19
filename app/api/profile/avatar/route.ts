import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { adminAuth, adminDb, adminBucket } from '@/lib/firebase/admin';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // ── File ───────────────────────────────────────────────────────────────
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ALLOWED.includes(file.type))
      return NextResponse.json({ error: 'Only JPG, PNG or WebP allowed' }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });

    // ── Upload to Firebase Storage (server-side, bypasses Storage rules) ───
    const buffer   = Buffer.from(await file.arrayBuffer());
    const ext      = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filePath = `avatars/${uid}/profile.${ext}`;
    const fileRef  = adminBucket.file(filePath);

    // Generate a stable download token so the URL works regardless of bucket ACL settings
    const downloadToken = randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
        // Embed the token in custom metadata — Firebase Storage honours this
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });

    // Build the standard Firebase Storage download URL (token-based, no ACL required).
    // The serving bucket name for the URL is always the firebasestorage.app domain.
    const servingBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? adminBucket.name;
    const encodedPath   = encodeURIComponent(filePath);
    const downloadUrl   = `https://firebasestorage.googleapis.com/v0/b/${servingBucket}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    // ── Persist URL to Firestore profile ───────────────────────────────────
    await adminDb.collection('profiles').doc(uid).set(
      { avatar_url: downloadUrl },
      { merge: true },
    );

    return NextResponse.json({ url: downloadUrl });
  } catch (err) {
    console.error('[POST /api/profile/avatar]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
