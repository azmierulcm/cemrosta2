import { NextRequest, NextResponse } from 'next/server';
import { StampsTemplate } from '@/lib/recap/templates';
import { getRecapFonts } from '@/lib/recap/og-fonts';
import { renderImage } from '@/lib/recap/render';
import { adminDb } from '@/lib/firebase/admin';
import { CATALOG_SIZE } from '@/lib/data/destination-catalog';
import type { DutyEvent } from '@/lib/types';
import type { FirestoreRoster } from '@/lib/types/roster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const download = new URL(req.url).searchParams.get('download') === '1';

    const [snap, profileSnap, fonts] = await Promise.all([
      adminDb.collection('rosters').where('userId', '==', userId).get(),
      adminDb.collection('profiles').doc(userId).get(),
      getRecapFonts(),
    ]);

    // Collect all unique arrival ports across lifetime rosters
    const destSet = new Set<string>();
    for (const doc of snap.docs) {
      const roster = { id: doc.id, ...doc.data() } as FirestoreRoster;
      for (const ev of (roster.events ?? []) as DutyEvent[]) {
        if (ev.type === 'FLIGHT' && ev.arrPort) {
          destSet.add(ev.arrPort.toUpperCase());
        }
      }
    }

    const earnedIata = [...destSet].sort();
    const profileName = (profileSnap.data()?.full_name as string | undefined)?.trim();
    const crewHandle = profileName || snap.docs[0]?.data()?.crewName || 'Crew';

    const baseUrl = new URL(req.url).origin;
    return await renderImage(
      <StampsTemplate
        earnedIata={earnedIata}
        totalCatalog={CATALOG_SIZE}
        crewHandle={crewHandle}
        baseUrl={baseUrl}
      />,
      {
        width: 1080,
        height: 1920,
        fonts,
        filename: download ? `Stamps-Collection.png` : undefined,
      },
    );
  } catch (err) {
    console.error('[recap/stamps/stories] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate stamps card' },
      { status: 500 },
    );
  }
}
