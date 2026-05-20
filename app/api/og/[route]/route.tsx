import React from 'react'
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const W = 1200
const H = 630
const FOOTER_H = 48

// Illustration stroke uses --patch-east for visual punch
const ILL = '#A8290C'
const TEXT = '#222222'
const MUTED = '#717171'
const SUBTLE = '#B0B0B0'
const SURFACE = '#F7F7F7'

async function loadFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }
  ).then((r) => r.text())

  const url = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1]
  if (!url) throw new Error(`No font URL found for ${family} ${weight}`)
  return fetch(url).then((r) => r.arrayBuffer())
}

function Footer() {
  return (
    <div
      style={{
        height: FOOTER_H,
        width: W,
        background: SURFACE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 52,
        paddingRight: 52,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: '"IBM Plex Mono"',
          fontWeight: 500,
          fontSize: 20,
          color: TEXT,
          letterSpacing: '-0.01em',
        }}
      >
        Cemrosta
      </span>
      <span
        style={{
          fontFamily: '"IBM Plex Mono"',
          fontWeight: 500,
          fontSize: 16,
          color: SUBTLE,
        }}
      >
        cemrosta.io
      </span>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────
// Illustration: PDF → Calendar → Passport transformation chain

function HomeIllustration() {
  return (
    <svg viewBox="0 0 230 380" width={230} height={380}>
      {/* PDF Document */}
      <rect
        x="55" y="8" width="102" height="80" rx="5"
        stroke={ILL} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Folded corner */}
      <path
        d="M131 8 L157 8 L157 34 L131 34 Z"
        stroke={ILL} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Text lines */}
      <line x1="70" y1="49" x2="118" y2="49" stroke={ILL} strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="61" x2="112" y2="61" stroke={ILL} strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="73" x2="102" y2="73" stroke={ILL} strokeWidth="2" strokeLinecap="round" />

      {/* Connector ↓ */}
      <line
        x1="106" y1="93" x2="106" y2="125"
        stroke={ILL} strokeWidth="1.5" strokeDasharray="4,5"
        strokeLinecap="round" opacity="0.4"
      />
      <path
        d="M100 122 L106 130 L112 122"
        stroke={ILL} strokeWidth="1.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.4"
      />

      {/* Calendar */}
      <rect
        x="40" y="133" width="132" height="98" rx="7"
        stroke={ILL} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="40" y1="160" x2="172" y2="160" stroke={ILL} strokeWidth="2" />
      {/* Tab nubs */}
      <line x1="72" y1="126" x2="72" y2="137" stroke={ILL} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="140" y1="126" x2="140" y2="137" stroke={ILL} strokeWidth="2.5" strokeLinecap="round" />
      {/* Grid lines */}
      <line x1="82" y1="160" x2="82" y2="231" stroke={ILL} strokeWidth="1" opacity="0.18" />
      <line x1="123" y1="160" x2="123" y2="231" stroke={ILL} strokeWidth="1" opacity="0.18" />
      <line x1="40" y1="187" x2="172" y2="187" stroke={ILL} strokeWidth="1" opacity="0.18" />
      <line x1="40" y1="210" x2="172" y2="210" stroke={ILL} strokeWidth="1" opacity="0.18" />
      {/* Event cell */}
      <rect x="43" y="163" width="37" height="23" rx="3" fill={ILL} opacity="0.10" />
      <rect
        x="43" y="163" width="37" height="23" rx="3"
        stroke={ILL} strokeWidth="1.5" fill="none"
      />

      {/* Connector ↓ */}
      <line
        x1="106" y1="236" x2="106" y2="266"
        stroke={ILL} strokeWidth="1.5" strokeDasharray="4,5"
        strokeLinecap="round" opacity="0.4"
      />
      <path
        d="M100 263 L106 271 L112 263"
        stroke={ILL} strokeWidth="1.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.4"
      />

      {/* Passport — open book */}
      <rect
        x="8" y="275" width="90" height="66" rx="5"
        stroke={ILL} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <rect
        x="106" y="275" width="90" height="66" rx="5"
        stroke={ILL} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Spine fold */}
      <path d="M98 278 Q102 308 98 339" stroke={ILL} strokeWidth="1" opacity="0.2" />
      {/* Passport stamp — concentric rings */}
      <circle cx="53" cy="308" r="19" stroke={ILL} strokeWidth="2" fill="none" opacity="0.7" />
      <circle cx="53" cy="308" r="11" stroke={ILL} strokeWidth="1.5" fill="none" opacity="0.38" />
      {/* Data lines on right page */}
      <line x1="118" y1="291" x2="184" y2="291" stroke={ILL} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="118" y1="305" x2="176" y2="305" stroke={ILL} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <line x1="118" y1="319" x2="166" y2="319" stroke={ILL} strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
      {/* Secondary stamp on right page */}
      <circle cx="176" cy="326" r="10" stroke={ILL} strokeWidth="1.5" fill="none" opacity="0.45" />
    </svg>
  )
}

function HomeOG() {
  return (
    <div
      style={{
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        fontFamily: '"Plus Jakarta Sans"',
      }}
    >
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left — illustration */}
        <div
          style={{
            width: 480,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <HomeIllustration />
        </div>

        {/* Right — text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingRight: 72,
            gap: 0,
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 600,
              color: TEXT,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Today,</span>
            <span>we negotiate.</span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: MUTED,
              marginTop: 28,
              lineHeight: 1.45,
            }}
          >
            Drop your PDF. Own your career.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

// ─── Marketplace ──────────────────────────────────────────────────────────────
// Illustration: headset + suitcase, stacked with slight offset

function MarketplaceIllustration() {
  return (
    <svg viewBox="0 0 240 310" width={240} height={310}>
      {/* Suitcase */}
      {/* Handle */}
      <path
        d="M86 62 L86 52 Q86 42 96 42 L144 42 Q154 42 154 52 L154 62"
        stroke={ILL} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Body */}
      <rect
        x="52" y="64" width="136" height="108" rx="12"
        stroke={ILL} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Center seam */}
      <line x1="52" y1="118" x2="188" y2="118" stroke={ILL} strokeWidth="2" />
      {/* Handle straps */}
      <rect
        x="104" y="64" width="32" height="8" rx="2"
        stroke={ILL} strokeWidth="1.5" fill="none" opacity="0.4"
      />
      {/* Wheels */}
      <circle cx="80" cy="178" r="8" stroke={ILL} strokeWidth="2" fill="none" />
      <circle cx="160" cy="178" r="8" stroke={ILL} strokeWidth="2" fill="none" />
      {/* Luggage tag */}
      <rect
        x="108" y="80" width="28" height="18" rx="3"
        stroke={ILL} strokeWidth="1.5" fill="none" opacity="0.5"
      />
      <line x1="116" y1="80" x2="116" y2="75" stroke={ILL} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

      {/* Headset */}
      {/* Headband arc */}
      <path
        d="M38 228 Q120 180 202 228"
        stroke={ILL} strokeWidth="2" fill="none" strokeLinecap="round"
      />
      {/* Left ear cup */}
      <rect
        x="22" y="226" width="28" height="24" rx="7"
        stroke={ILL} strokeWidth="2" fill="none"
      />
      {/* Right ear cup */}
      <rect
        x="190" y="226" width="28" height="24" rx="7"
        stroke={ILL} strokeWidth="2" fill="none"
      />
      {/* Mic boom */}
      <path
        d="M205 242 Q222 250 226 265"
        stroke={ILL} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"
      />
      <circle cx="228" cy="267" r="4" stroke={ILL} strokeWidth="1.5" fill="none" opacity="0.8" />
    </svg>
  )
}

function MarketplaceOG() {
  return (
    <div
      style={{
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        fontFamily: '"Plus Jakarta Sans"',
      }}
    >
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left — illustration */}
        <div
          style={{
            width: 480,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MarketplaceIllustration />
        </div>

        {/* Right — text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingRight: 72,
          }}
        >
          <div
            style={{
              fontSize: 74,
              fontWeight: 600,
              color: TEXT,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>The crew</span>
            <span>marketplace.</span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: MUTED,
              marginTop: 28,
              lineHeight: 1.45,
            }}
          >
            Verified crew sellers only
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

// ─── Profile ──────────────────────────────────────────────────────────────────
// Illustration: open passport spread with three city stamps (KUL, SIN, SYD)

function ProfileIllustration() {
  return (
    <svg viewBox="0 0 280 240" width={280} height={240}>
      {/* Left page */}
      <rect
        x="4" y="16" width="126" height="208" rx="6"
        stroke={ILL} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Right page */}
      <rect
        x="150" y="16" width="126" height="208" rx="6"
        stroke={ILL} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Spine */}
      <path d="M130 20 Q140 120 130 220" stroke={ILL} strokeWidth="1.5" opacity="0.22" />

      {/* Left page — photo placeholder + name lines */}
      <rect
        x="18" y="34" width="48" height="58" rx="3"
        stroke={ILL} strokeWidth="1.5" fill="none" opacity="0.38"
      />
      {/* Photo cross-lines */}
      <line x1="18" y1="70" x2="66" y2="44" stroke={ILL} strokeWidth="1" opacity="0.2" />
      {/* Name lines */}
      <line x1="76" y1="46" x2="118" y2="46" stroke={ILL} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="76" y1="60" x2="114" y2="60" stroke={ILL} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <line x1="76" y1="74" x2="108" y2="74" stroke={ILL} strokeWidth="1.5" strokeLinecap="round" opacity="0.28" />

      {/* KUL stamp — left page, prominent */}
      <circle cx="67" cy="158" r="46" stroke={ILL} strokeWidth="2" fill="none" opacity="0.75" />
      <circle cx="67" cy="158" r="33" stroke={ILL} strokeWidth="1" fill="none" opacity="0.35" />
      {/* KUL text inside stamp */}
      <text
        x="67" y="162"
        textAnchor="middle"
        fontSize="18"
        fontWeight="500"
        fill={ILL}
        opacity="0.65"
        fontFamily="monospace"
      >
        KUL
      </text>

      {/* SIN stamp — right page, upper */}
      <circle cx="200" cy="80" r="38" stroke={ILL} strokeWidth="2" fill="none" opacity="0.65" />
      <circle cx="200" cy="80" r="26" stroke={ILL} strokeWidth="1" fill="none" opacity="0.3" />
      <text
        x="200" y="84"
        textAnchor="middle"
        fontSize="15"
        fontWeight="500"
        fill={ILL}
        opacity="0.6"
        fontFamily="monospace"
      >
        SIN
      </text>

      {/* SYD stamp — right page, lower-right */}
      <circle cx="238" cy="172" r="30" stroke={ILL} strokeWidth="2" fill="none" opacity="0.55" />
      <circle cx="238" cy="172" r="20" stroke={ILL} strokeWidth="1" fill="none" opacity="0.28" />
      <text
        x="238" y="176"
        textAnchor="middle"
        fontSize="13"
        fontWeight="500"
        fill={ILL}
        opacity="0.52"
        fontFamily="monospace"
      >
        SYD
      </text>

      {/* Partial fourth stamp — partially clipped by right page edge */}
      <circle cx="155" cy="190" r="22" stroke={ILL} strokeWidth="1.5" fill="none" opacity="0.38" />
    </svg>
  )
}

function ProfileOG() {
  return (
    <div
      style={{
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        fontFamily: '"Plus Jakarta Sans"',
      }}
    >
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left — illustration */}
        <div
          style={{
            width: 520,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ProfileIllustration />
        </div>

        {/* Right — text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingRight: 72,
          }}
        >
          <div
            style={{
              fontSize: 74,
              fontWeight: 600,
              color: TEXT,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Your lifetime</span>
            <span>in the air.</span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: MUTED,
              marginTop: 28,
              lineHeight: 1.45,
            }}
          >
            Every city. Every sector. Every sunrise.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ route: string }> }
) {
  const { route } = await params

  const [jakartaSemibold, jakartaMedium, plexMono] = await Promise.all([
    loadFont('Plus Jakarta Sans', 600),
    loadFont('Plus Jakarta Sans', 500),
    loadFont('IBM Plex Mono', 500),
  ])

  const fonts = [
    { name: 'Plus Jakarta Sans', data: jakartaSemibold, weight: 600 as const },
    { name: 'Plus Jakarta Sans', data: jakartaMedium, weight: 500 as const },
    { name: 'IBM Plex Mono', data: plexMono, weight: 500 as const },
  ]

  let content: React.ReactElement
  if (route === 'home') {
    content = <HomeOG />
  } else if (route === 'marketplace') {
    content = <MarketplaceOG />
  } else if (route === 'profile') {
    content = <ProfileOG />
  } else {
    return new Response('Not found', { status: 404 })
  }

  return new ImageResponse(content, { width: W, height: H, fonts })
}
