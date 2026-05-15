import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: { route: string } }
) {
  const { route } = params;

  // approved visual tokens
  const bg = '#0A0B0F';
  const accent = '#00D4FF';
  const text = '#F4F5F7';
  const textMuted = '#9CA0AD';

  const runwayMark = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ width: '40px', height: '12px', background: accent, opacity: 0.3 }} />
      <div style={{ width: '40px', height: '24px', background: accent, opacity: 0.6 }} />
      <div style={{ width: '40px', height: '48px', background: accent }} />
    </div>
  );

  let content;
  if (route === 'marketplace') {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          {runwayMark}
          <div style={{ fontSize: 60, fontWeight: 900, color: text, letterSpacing: '-0.05em' }}>Marketplace</div>
        </div>
        <div style={{ fontSize: 32, color: textMuted, fontWeight: 500 }}>Elite gear. Verified Malaysia Airlines crew sellers only.</div>
        <div style={{ display: 'flex', marginTop: 'auto', gap: '20px' }}>
          <div style={{ background: '#1C1F27', border: '1px solid #262A35', padding: '20px 40px', borderRadius: '20px', color: accent, fontSize: 24, fontWeight: 700 }}>Headsets</div>
          <div style={{ background: '#1C1F27', border: '1px solid #262A35', padding: '20px 40px', borderRadius: '20px', color: accent, fontSize: 24, fontWeight: 700 }}>Luggage</div>
          <div style={{ background: '#1C1F27', border: '1px solid #262A35', padding: '20px 40px', borderRadius: '20px', color: accent, fontSize: 24, fontWeight: 700 }}>Watches</div>
        </div>
      </div>
    );
  } else if (route === 'profile') {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          {runwayMark}
          <div style={{ fontSize: 60, fontWeight: 900, color: text, letterSpacing: '-0.05em' }}>Your Passport</div>
        </div>
        <div style={{ fontSize: 32, color: textMuted, fontWeight: 500 }}>Lifetime stats, sectors, and collectible destination patches.</div>
        <div style={{ display: 'flex', marginTop: 'auto', gap: '40px' }}>
          <div style={{ width: 120, height: 120, borderRadius: '60px', border: `4px solid ${accent}`, background: '#14161C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: text, fontSize: 32, fontWeight: 900 }}>KUL</div>
          <div style={{ width: 120, height: 120, borderRadius: '60px', border: `4px solid ${accent}`, background: '#14161C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: text, fontSize: 32, fontWeight: 900 }}>LHR</div>
          <div style={{ width: 120, height: 120, borderRadius: '60px', border: `4px solid ${accent}`, background: '#14161C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: text, fontSize: 32, fontWeight: 900 }}>SYD</div>
        </div>
      </div>
    );
  } else {
    // default/home
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          {runwayMark}
          <div style={{ fontSize: 80, fontWeight: 900, color: text, letterSpacing: '-0.05em' }}>Cemrosta</div>
        </div>
        <div style={{ fontSize: 40, color: textMuted, fontWeight: 500, maxWidth: '800px' }}>Your roster, transformed. PDF to Calendar in 10 seconds. Built for Malaysian crew.</div>
        <div style={{ display: 'flex', marginTop: 'auto', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: accent, fontSize: 24, fontWeight: 700, fontStyle: 'mono' }}>[ ROSTER ]</div>
          <div style={{ width: 60, height: 2, background: accent, opacity: 0.3 }} />
          <div style={{ color: accent, fontSize: 24, fontWeight: 700, fontStyle: 'mono' }}>[ PASSPORT ]</div>
        </div>
      </div>
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: bg,
          backgroundImage: 'radial-gradient(circle at 25px 25px, #1C1F27 2%, transparent 0%)',
          backgroundSize: '50px 50px',
        }}
      >
        {content}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
