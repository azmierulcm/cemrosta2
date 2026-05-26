import { NextRequest, NextResponse } from 'next/server';

// Proxies Firebase Storage images so they are served same-origin.
// This prevents canvas taint when html-to-image captures the LiveRosterCard.
// Restricted to Firebase Storage URLs only.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse(null, { status: 400 });

  if (!url.startsWith('https://firebasestorage.googleapis.com/')) {
    return new NextResponse(null, { status: 403 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) return new NextResponse(null, { status: 502 });
    const blob = await upstream.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
