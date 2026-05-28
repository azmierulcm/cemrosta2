import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { crypto } from 'next/dist/compiled/@edge-runtime/primitives';

// Use standard Web Crypto API for UUID generation
function uuidv4() {
  return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, (c) => {
    const val = parseInt(c, 10);
    return (val ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> val / 4).toString(16);
  });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const newToken = uuidv4();

    await adminDb.collection('profiles').doc(uid).set(
      { spouse_share_token: newToken },
      { merge: true }
    );

    return NextResponse.json({ token: newToken });
  } catch (error) {
    console.error('Error resetting share token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
