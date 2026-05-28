import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // 1. Find the user with this token
    const profilesRef = adminDb.collection('profiles');
    const querySnapshot = await profilesRef.where('spouse_share_token', '==', token).limit(1).get();

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const profileDoc = querySnapshot.docs[0];
    const userId = profileDoc.id;
    const profileData = profileDoc.data();

    // 2. Fetch the active roster for this user — sort in JS to avoid needing a composite index
    const rostersRef = adminDb.collection('rosters');
    const rosterSnapshot = await rostersRef
      .where('userId', '==', userId)
      .get();

    if (rosterSnapshot.empty) {
      return NextResponse.json({ error: 'No roster found' }, { status: 404 });
    }

    const rosterData = rosterSnapshot.docs
      .map(d => d.data())
      .sort((a, b) => {
        const aTime = a.uploadedAt?.toMillis?.() ?? 0;
        const bTime = b.uploadedAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      })[0];

    return NextResponse.json({
      pilot: {
        full_name:  profileData.full_name || 'Pilot',
        rank:       profileData.rank,
        airline:    profileData.airline,
        avatar_url: profileData.avatar_url ?? null,
        base:       profileData.base ?? 'KUL',
      },
      roster: rosterData,
    });
  } catch (error) {
    console.error('Error fetching shared roster:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
