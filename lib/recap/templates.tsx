import React from 'react';
import { formatKilometers } from '../utils/format';
import { PATCH_IMAGE_MAP } from '../patches/patch-images';
import type { RecapData } from './types';

// ── Design tokens ─────────────────────────────────────────────────────────────
// Satori constraints (used by @vercel/og / ImageResponse):
//  • No repeating-linear-gradient → use dashed borders
//  • background shorthand for gradients → use backgroundImage + backgroundColor
//  • Every div with >1 child MUST have display: flex (no exceptions)
//  • Use backgroundColor not background for solid colours
const BG_GRAD    = 'linear-gradient(160deg, #0E1E30 0%, #0A1520 55%, #0D1A28 100%)';
const BG_SOLID   = '#0A1520';
const GOLD       = '#C8A84B';
const PARCHMENT  = '#F5EDD8';
const GOLD_DIM   = 'rgba(200,168,75,0.55)';
const GOLD_FAINT = 'rgba(200,168,75,0.22)';
const PARCHMENT_DIM   = 'rgba(245,237,216,0.5)';
const PARCHMENT_FAINT = 'rgba(245,237,216,0.35)';
const MONO = 'IBM Plex Mono';

// Satori-safe perforated line — 1.5 px dashed, expressed as explicit sub-properties
// to avoid any shorthand-parsing ambiguity
const PERF_DIV = (
  <div
    style={{
      display: 'flex',           // required: Satori needs explicit display on all elements
      width: '100%',
      height: 2,
      borderTopWidth: 1.5,
      borderTopStyle: 'dashed',
      borderTopColor: 'rgba(200,168,75,0.4)',
    }}
  />
);

// ── Patch medallion ───────────────────────────────────────────────────────────

function PatchMedallion({
  iata,
  size,
  baseUrl,
  labelSize,
}: {
  iata: string;
  size: number;
  baseUrl: string;
  labelSize: number;
}) {
  const filename = PATCH_IMAGE_MAP[iata];
  const patchUrl = filename && baseUrl ? `${baseUrl}/images/city_patches/${filename}` : null;
  const imgSize  = Math.round(size * 0.74);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderStyle: 'solid',
          borderColor: GOLD_DIM,
          backgroundColor: 'rgba(255,255,255,0.04)',
          overflow: 'hidden',
        }}
      >
        {patchUrl
          ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={patchUrl} alt="" width={imgSize} height={imgSize} style={{ objectFit: 'contain' }} />
          )
          : (
            <div style={{ display: 'flex', width: imgSize, height: imgSize }} />
          )}
      </div>
      <div style={{ display: 'flex', fontSize: labelSize, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.1em', fontFamily: MONO }}>
        {iata}
      </div>
    </div>
  );
}

// ── Stories template (1080 × 1920) ────────────────────────────────────────────

export function StoriesTemplate({
  data,
  watermark = true,
  baseUrl = '',
}: {
  data: RecapData;
  watermark?: boolean;
  baseUrl?: string;
}) {
  const { period, crewHandle, totalSectors, totalKm, topDestinations, superlative } = data;
  const top3      = topDestinations.slice(0, 3);
  const heroValue = period.type === 'month' ? String(totalSectors) : formatKilometers(totalKm);
  const heroLabel = period.type === 'month' ? 'Sectors Flown' : 'KM Flown';
  const periodTypeLabel = period.type === 'month' ? 'Monthly' : period.type === '6m' ? '6-Month' : 'Annual';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundImage: BG_GRAD,
        backgroundColor: BG_SOLID,
        color: PARCHMENT,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Top perf */}
      <div style={{ display: 'flex', padding: '56px 80px 0' }}>{PERF_DIV}</div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '40px 80px 36px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 800, color: GOLD_DIM, letterSpacing: '0.38em', textTransform: 'uppercase', fontFamily: MONO }}>
            Cemrosta
          </div>
          <div style={{ display: 'flex', fontSize: 42, fontWeight: 700, color: PARCHMENT }}>
            Crew Logbook
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: MONO }}>
            {periodTypeLabel}
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: PARCHMENT }}>
            {period.label}
          </div>
        </div>
      </div>

      {/* Mid perf */}
      <div style={{ display: 'flex', padding: '0 80px' }}>{PERF_DIV}</div>

      {/* Patch medallions */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, padding: '72px 80px 64px' }}>
        {top3.length > 0
          ? top3.map(({ iata }) => (
              <PatchMedallion key={iata} iata={iata} size={180} baseUrl={baseUrl} labelSize={20} />
            ))
          : (
            <>
              <div style={{ display: 'flex', width: 180, height: 180, borderRadius: 90, borderWidth: 1.5, borderStyle: 'solid', borderColor: GOLD_FAINT, backgroundColor: 'rgba(255,255,255,0.04)' }} />
              <div style={{ display: 'flex', width: 180, height: 180, borderRadius: 90, borderWidth: 1.5, borderStyle: 'solid', borderColor: GOLD_FAINT, backgroundColor: 'rgba(255,255,255,0.04)' }} />
              <div style={{ display: 'flex', width: 180, height: 180, borderRadius: 90, borderWidth: 1.5, borderStyle: 'solid', borderColor: GOLD_FAINT, backgroundColor: 'rgba(255,255,255,0.04)' }} />
            </>
          )}
      </div>

      {/* Mid perf */}
      <div style={{ display: 'flex', padding: '0 80px' }}>{PERF_DIV}</div>

      {/* Hero stat */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 80px 60px' }}>
        <div style={{ display: 'flex', fontSize: 220, fontWeight: 900, lineHeight: 1, color: PARCHMENT, letterSpacing: '-0.03em', fontFamily: MONO }}>
          {heroValue}
        </div>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: GOLD, letterSpacing: '0.35em', textTransform: 'uppercase', marginTop: 16, fontFamily: MONO }}>
          {heroLabel}
        </div>
      </div>

      {/* Secondary stats */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 80px 64px', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: GOLD_FAINT }}>
          <div style={{ display: 'flex', fontSize: 70, fontWeight: 800, color: PARCHMENT, fontFamily: MONO }}>{String(totalSectors)}</div>
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 8, fontFamily: MONO }}>Sectors</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 70, fontWeight: 800, color: PARCHMENT, fontFamily: MONO }}>{formatKilometers(totalKm)}</div>
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 8, fontFamily: MONO }}>KM Flown</div>
        </div>
      </div>

      {/* Mid perf */}
      <div style={{ display: 'flex', padding: '0 80px' }}>{PERF_DIV}</div>

      {/* Mission award */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 48, margin: '64px 80px', padding: '52px 56px', backgroundColor: 'rgba(200,168,75,0.08)', borderWidth: 1.5, borderStyle: 'solid', borderColor: GOLD_FAINT, borderRadius: 32 }}>
        {/* Seal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderStyle: 'solid', borderColor: GOLD, backgroundColor: 'rgba(200,168,75,0.12)', fontSize: 44, flexShrink: 0, color: GOLD, fontWeight: 700 }}>
          ✦
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 800, color: GOLD, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: MONO }}>
            {superlative.label}
          </div>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 900, color: PARCHMENT, lineHeight: 1.1 }}>
            {superlative.value}
          </div>
          <div style={{ display: 'flex', fontSize: 32, color: PARCHMENT_DIM, fontWeight: 500 }}>
            {superlative.subValue}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ display: 'flex', flex: 1 }} />

      {/* Bottom perf */}
      <div style={{ display: 'flex', padding: '0 80px' }}>{PERF_DIV}</div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 80px 56px' }}>
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: PARCHMENT }}>{crewHandle}</div>
        {watermark && (
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 600, color: 'rgba(200,168,75,0.35)', fontFamily: MONO }}>cemrosta.com</div>
        )}
      </div>
    </div>
  );
}

// ── Card template (1200 × 630) ────────────────────────────────────────────────

export function CardTemplate({
  data,
  watermark = true,
  baseUrl = '',
}: {
  data: RecapData;
  watermark?: boolean;
  baseUrl?: string;
}) {
  const { period, crewHandle, totalSectors, totalKm, topDestinations, superlative } = data;
  const top3 = topDestinations.slice(0, 3);

  const heroValue      = period.type === 'month' ? String(totalSectors) : formatKilometers(totalKm);
  const heroLabel      = period.type === 'month' ? 'Sectors Flown' : 'KM Flown';
  const periodTypeLabel = period.type === 'month' ? 'Monthly' : period.type === '6m' ? '6-Month' : 'Annual';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundImage: BG_GRAD,
        backgroundColor: BG_SOLID,
        color: PARCHMENT,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Top perf */}
      <div style={{ display: 'flex', padding: '28px 60px 0' }}>{PERF_DIV}</div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '20px 60px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', fontSize: 11, fontWeight: 800, color: GOLD_DIM, letterSpacing: '0.38em', textTransform: 'uppercase', fontFamily: MONO }}>
            Cemrosta
          </div>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: PARCHMENT }}>
            Crew Logbook
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: MONO }}>
            {periodTypeLabel}
          </div>
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 600, color: PARCHMENT }}>
            {period.label}
          </div>
        </div>
      </div>

      {/* Mid perf */}
      <div style={{ display: 'flex', padding: '0 60px' }}>{PERF_DIV}</div>

      {/* Main body — two columns */}
      <div style={{ display: 'flex', flex: 1, padding: '28px 60px', gap: 48 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 360, gap: 20 }}>

          {/* Patch medallions */}
          <div style={{ display: 'flex', gap: 14 }}>
            {top3.length > 0
              ? top3.map(({ iata }) => (
                  <PatchMedallion key={iata} iata={iata} size={96} baseUrl={baseUrl} labelSize={11} />
                ))
              : (
                <>
                  <div style={{ display: 'flex', width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderStyle: 'solid', borderColor: GOLD_FAINT, backgroundColor: 'rgba(255,255,255,0.04)' }} />
                  <div style={{ display: 'flex', width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderStyle: 'solid', borderColor: GOLD_FAINT, backgroundColor: 'rgba(255,255,255,0.04)' }} />
                  <div style={{ display: 'flex', width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderStyle: 'solid', borderColor: GOLD_FAINT, backgroundColor: 'rgba(255,255,255,0.04)' }} />
                </>
              )}
          </div>

          {/* Mission award card */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(200,168,75,0.08)', borderWidth: 1, borderStyle: 'solid', borderColor: GOLD_FAINT, borderRadius: 20, padding: '20px 22px', gap: 6, marginTop: 'auto' }}>
            {/* Seal + label row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderStyle: 'solid', borderColor: GOLD, backgroundColor: 'rgba(200,168,75,0.12)', fontSize: 16, flexShrink: 0, color: GOLD, fontWeight: 700 }}>
                ✦
              </div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: MONO }}>
                {superlative.label}
              </div>
            </div>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 900, color: PARCHMENT, lineHeight: 1.1 }}>
              {superlative.value}
            </div>
            <div style={{ display: 'flex', fontSize: 16, color: PARCHMENT_FAINT, fontWeight: 500 }}>
              {superlative.subValue}
            </div>
          </div>
        </div>

        {/* Vertical separator — dashed, Satori-safe */}
        <div style={{ display: 'flex', width: 0, alignSelf: 'stretch', borderLeftWidth: 1, borderLeftStyle: 'dashed', borderLeftColor: 'rgba(200,168,75,0.3)' }} />

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: 20 }}>

          {/* Hero number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', fontSize: 140, fontWeight: 900, lineHeight: 1, color: PARCHMENT, letterSpacing: '-0.03em', fontFamily: MONO }}>
              {heroValue}
            </div>
            <div style={{ display: 'flex', fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: '0.35em', textTransform: 'uppercase', fontFamily: MONO }}>
              {heroLabel}
            </div>
          </div>

          {/* Secondary stats */}
          <div style={{ display: 'flex', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 28, borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: GOLD_FAINT }}>
              <div style={{ display: 'flex', fontSize: 38, fontWeight: 800, color: PARCHMENT, fontFamily: MONO, letterSpacing: '-0.01em' }}>
                {formatKilometers(totalKm)}
              </div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: MONO }}>
                KM Flown
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', fontSize: 38, fontWeight: 800, color: PARCHMENT, fontFamily: MONO, letterSpacing: '-0.01em' }}>
                {String(topDestinations.length)}
              </div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: MONO }}>
                Cities
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom perf */}
      <div style={{ display: 'flex', padding: '0 60px' }}>{PERF_DIV}</div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 60px 22px' }}>
        <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: PARCHMENT }}>{crewHandle}</div>
        {watermark && (
          <div style={{ display: 'flex', fontSize: 14, fontWeight: 600, color: 'rgba(200,168,75,0.35)', fontFamily: MONO }}>cemrosta.com</div>
        )}
      </div>
    </div>
  );
}
