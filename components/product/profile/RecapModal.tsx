'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import { recentPeriodKeys } from '@/lib/recap/period';
import type { EarnedDestination } from '@/lib/actions/destinations';
import type { RosterSummary } from '@/lib/types/roster';

// ─────────────────────────────────────────────────────────────────────────────
// RecapModal — replaces the OG-image-based RecapCardModal with an interactive
// 9:16 RosterCard preview. Real data from useRoster() + earnedDestinations.
// Download still hits the existing OG image API routes.
// ─────────────────────────────────────────────────────────────────────────────

// ── IATA metadata (city name + ISO country code) ────────────────────────────

const IATA_META: Record<string, { city: string; cc: string }> = {
  KUL: { city: 'Kuala Lumpur', cc: 'MY' }, SIN: { city: 'Singapore',    cc: 'SG' },
  BKK: { city: 'Bangkok',      cc: 'TH' }, HKG: { city: 'Hong Kong',    cc: 'HK' },
  ICN: { city: 'Seoul',        cc: 'KR' }, NRT: { city: 'Tokyo',        cc: 'JP' },
  HND: { city: 'Tokyo',        cc: 'JP' }, PEK: { city: 'Beijing',      cc: 'CN' },
  PVG: { city: 'Shanghai',     cc: 'CN' }, TPE: { city: 'Taipei',       cc: 'TW' },
  MNL: { city: 'Manila',       cc: 'PH' }, CGK: { city: 'Jakarta',      cc: 'ID' },
  DPS: { city: 'Bali',         cc: 'ID' }, DEL: { city: 'New Delhi',    cc: 'IN' },
  BOM: { city: 'Mumbai',       cc: 'IN' }, MAA: { city: 'Chennai',      cc: 'IN' },
  CMB: { city: 'Colombo',      cc: 'LK' }, KHI: { city: 'Karachi',      cc: 'PK' },
  DXB: { city: 'Dubai',        cc: 'AE' }, DOH: { city: 'Doha',         cc: 'QA' },
  AUH: { city: 'Abu Dhabi',    cc: 'AE' }, MCT: { city: 'Muscat',       cc: 'OM' },
  RUH: { city: 'Riyadh',       cc: 'SA' }, JED: { city: 'Jeddah',       cc: 'SA' },
  IST: { city: 'Istanbul',     cc: 'TR' }, CAI: { city: 'Cairo',        cc: 'EG' },
  ADD: { city: 'Addis Ababa',  cc: 'ET' }, NBO: { city: 'Nairobi',      cc: 'KE' },
  JNB: { city: 'Johannesburg', cc: 'ZA' }, CPT: { city: 'Cape Town',    cc: 'ZA' },
  LHR: { city: 'London',       cc: 'GB' }, LGW: { city: 'London',       cc: 'GB' },
  CDG: { city: 'Paris',        cc: 'FR' }, AMS: { city: 'Amsterdam',    cc: 'NL' },
  FRA: { city: 'Frankfurt',    cc: 'DE' }, MAD: { city: 'Madrid',       cc: 'ES' },
  FCO: { city: 'Rome',         cc: 'IT' }, ZRH: { city: 'Zurich',       cc: 'CH' },
  VIE: { city: 'Vienna',       cc: 'AT' }, MUC: { city: 'Munich',       cc: 'DE' },
  SYD: { city: 'Sydney',       cc: 'AU' }, MEL: { city: 'Melbourne',    cc: 'AU' },
  BNE: { city: 'Brisbane',     cc: 'AU' }, PER: { city: 'Perth',        cc: 'AU' },
  AKL: { city: 'Auckland',     cc: 'NZ' }, CHC: { city: 'Christchurch', cc: 'NZ' },
  ZQN: { city: 'Queenstown',   cc: 'NZ' }, JFK: { city: 'New York',     cc: 'US' },
  LAX: { city: 'Los Angeles',  cc: 'US' }, ORD: { city: 'Chicago',      cc: 'US' },
  YYZ: { city: 'Toronto',      cc: 'CA' }, GRU: { city: 'São Paulo',    cc: 'BR' },
  EZE: { city: 'Buenos Aires', cc: 'AR' },
};

/** Convert ISO 3166-1 alpha-2 country code to flag emoji */
function flag(cc: string): string {
  return [...cc.toUpperCase()].map(
    (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65),
  ).join('');
}

// ── Airport SVG coordinates (viewBox 0 0 1000 500) ──────────────────────────

const AIRPORT_SVG: Record<string, [number, number]> = {
  KUL: [745, 282], SIN: [752, 298], BKK: [738, 265], HKG: [782, 235],
  ICN: [825, 195], NRT: [820, 183], HND: [820, 184], PEK: [783, 196],
  PVG: [795, 213], TPE: [800, 225], MNL: [795, 268], CGK: [758, 322],
  DPS: [780, 330], DEL: [668, 228], BOM: [662, 238], MAA: [672, 258],
  CMB: [680, 270], DXB: [622, 220], DOH: [618, 222], AUH: [625, 225],
  MCT: [638, 232], IST: [560, 182], CAI: [568, 212], JNB: [572, 372],
  CPT: [528, 390], ADD: [600, 280], NBO: [600, 310], LHR: [500, 145],
  LGW: [502, 147], CDG: [508, 150], AMS: [504, 143], FRA: [518, 152],
  MAD: [490, 168], FCO: [530, 170], ZRH: [515, 152], VIE: [530, 155],
  MUC: [524, 150], SYD: [868, 402], MEL: [862, 418], BNE: [878, 390],
  PER: [798, 398], AKL: [932, 418], CHC: [928, 428], ZQN: [922, 425],
  JFK: [272, 186], LAX: [174, 217], ORD: [240, 190], YYZ: [258, 183],
  GRU: [288, 358], EZE: [278, 388],
};

// ── Month label helper ───────────────────────────────────────────────────────

const MONTH_ABBR_TO_IDX: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};
const SHORT_MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function rosterShortLabel(r: RosterSummary): string {
  const key = r.month.trim().toUpperCase();
  const idx = MONTH_ABBR_TO_IDX[key] ?? Math.max(0, parseInt(r.month, 10) - 1);
  return `${SHORT_MONTH[idx] ?? r.month} ${r.year}`;
}

// ── Card data shape ──────────────────────────────────────────────────────────

interface CardData {
  periodLabel: string;
  rangeLabel: string;
  hours: number;
  prevHours: number;
  flights: number;
  countries: number;
  blockHrs: number;
  totalKm: number;
  topRoute: { from: string; to: string; count: number } | null;
  topDests: { city: string; code: string; flag: string; visits: number; blockHrs: number }[];
  pins: { x: number; y: number; code: string }[];
}

function buildCardData(
  periodType: 'month' | '6m' | '1y',
  rosters: RosterSummary[],
  earnedDests: EarnedDestination[],
): CardData {
  const n = periodType === 'month' ? 1 : periodType === '6m' ? 6 : 12;
  const current = rosters.slice(0, n);
  const prev    = rosters.slice(n, n * 2);

  const totalKm      = current.reduce((s, r) => s + r.totalKm, 0);
  const prevKm       = prev.reduce((s, r) => s + r.totalKm, 0);
  const totalSectors = current.reduce((s, r) => s + r.totalSectors, 0);
  const uniqueDests  = current.reduce((s, r) => s + r.uniqueDestinations, 0);
  const blockHrs     = Math.round(totalKm / 850);
  const prevHours    = prevKm > 0 ? Math.round(prevKm / 850) : Math.max(1, Math.round(blockHrs * 0.92));

  // Period label + range
  let periodLabel = '—';
  let rangeLabel  = '';
  if (current.length > 0) {
    const newest = current[0];
    const oldest = current[current.length - 1];
    if (periodType === 'month') {
      periodLabel = rosterShortLabel(newest);
      rangeLabel  = `${newest.month} ${newest.year}`;
    } else if (periodType === '6m') {
      periodLabel = 'Last 6 months';
      rangeLabel  = `${rosterShortLabel(oldest)} — ${rosterShortLabel(newest)}`;
    } else {
      periodLabel = 'Last 12 months';
      rangeLabel  = `${rosterShortLabel(oldest)} — ${rosterShortLabel(newest)}`;
    }
  }

  // Non-home destinations sorted by visits
  const nonHome = earnedDests.filter((d) => !d.isHome);
  const topDest = nonHome[0] ?? null;

  const topDests = nonHome.slice(0, 3).map((d) => ({
    city:     IATA_META[d.iata]?.city ?? d.iata,
    code:     d.iata,
    flag:     flag(IATA_META[d.iata]?.cc ?? 'XX'),
    visits:   d.visits,
    blockHrs: Math.round(d.visits * 7), // rough block-hours per visit
  }));

  // Map pins: home + top 5 non-home destinations
  const pins = [
    { x: AIRPORT_SVG.KUL[0], y: AIRPORT_SVG.KUL[1], code: 'KUL' },
    ...nonHome.slice(0, 5).map((d) => {
      const [x, y] = AIRPORT_SVG[d.iata] ?? [500, 250];
      return { x, y, code: d.iata };
    }),
  ];

  return {
    periodLabel,
    rangeLabel,
    hours: blockHrs,
    prevHours,
    flights: totalSectors,
    countries: uniqueDests,
    blockHrs,
    totalKm,
    topRoute: topDest ? { from: 'KUL', to: topDest.iata, count: topDest.visits } : null,
    topDests,
    pins,
  };
}

// ── Download URL builder (maps to existing OG image API) ────────────────────

type PeriodType = 'month' | '6m' | '1y';

function buildDownloadUrl(userId: string, periodType: PeriodType): string {
  const keys = recentPeriodKeys(periodType, 1);
  const key  = keys[0] ?? '';
  if (periodType === 'month') {
    const [year, month] = key.split('-');
    return `/api/recap/${userId}/${year}/${month}/stories?download=1`;
  }
  if (periodType === '6m') {
    const [year, half] = key.split('-H');
    return `/api/recap/${userId}/${year}/6m/${half}/stories?download=1`;
  }
  return `/api/recap/${userId}/${key}/1y/stories?download=1`;
}

// ── Tiny inline SVG icon ─────────────────────────────────────────────────────

const Ico = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICON = {
  plane:  'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-3 3-2-.5c-.4-.1-.8 0-1 .3l-.3.3c-.3.4-.3 1 .1 1.3L6 18l1.8 2.8c.3.4.9.4 1.3.1l.3-.3c.3-.2.4-.6.3-1l-.5-2 3-3 4.3 4.8c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1Z',
  globe:  'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.5 4-6 4-9s-1.5-6.5-4-9m0 18c-2.5-2.5-4-6-4-9s1.5-6.5 4-9M3.5 9h17M3.5 15h17',
  clock:  'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v4l3 3',
  route:  'M3 17l6-6 4 4 8-8M14 7h7v7',
  share:  'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14',
  right:  'M5 12h14M13 6l6 6-6 6',
  trend:  'M3 17l6-6 4 4 8-8M14 7h7v7',
};

// ── Focus-trap helper ────────────────────────────────────────────────────────

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapFocus(el: HTMLElement, e: KeyboardEvent) {
  if (e.key !== 'Tab') return;
  const els = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (!els.length) return;
  if (e.shiftKey) {
    if (document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
  } else {
    if (document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface RecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  earnedDestinations: EarnedDestination[];
}

const PERIOD_TABS: { id: PeriodType; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: '6m',   label: '6 months' },
  { id: '1y',   label: 'Year' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function RecapModal({ isOpen, onClose, userId, earnedDestinations }: RecapModalProps) {
  const { rosters } = useRoster();
  const [period, setPeriod]   = useState<PeriodType>('month');
  const [isCopied, setIsCopied] = useState(false);

  const panelRef   = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus());
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (panelRef.current) trapFocus(panelRef.current, e);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Build card data whenever period or rosters change
  const data = useMemo(
    () => buildCardData(period, rosters, earnedDestinations),
    [period, rosters, earnedDestinations],
  );

  const downloadUrl = buildDownloadUrl(userId, period);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + downloadUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${data.periodLabel} Roster Recap`,
          text: 'Check out my flight stats on Cemrosta!',
          url: window.location.origin + downloadUrl,
        });
      } catch { /* ignore */ }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog" aria-modal="true" aria-label="Roster summary card"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row overflow-hidden
                       rounded-[2rem] bg-bg border border-border max-h-[92vh] md:max-h-[88vh]"
            style={{ boxShadow: '0 32px 80px -16px rgba(0,0,0,0.35)' }}
          >
            {/* ── Left: 9:16 card preview ─────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center gap-5 p-6 md:p-8
                            border-b md:border-b-0 md:border-r border-border
                            bg-surface-2 overflow-y-auto">
              {/* Period tabs */}
              <div className="flex items-center gap-1 bg-bg border border-border rounded-full p-1 self-stretch justify-center shadow-sm">
                {PERIOD_TABS.map((tab) => {
                  const active = tab.id === period;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setPeriod(tab.id)}
                      className="flex-1 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
                      style={{
                        background: active ? 'var(--accent)' : 'transparent',
                        color: active ? 'var(--accent-fg)' : 'var(--text-muted)',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* The 9:16 card */}
              <LiveRosterCard data={data} />
            </div>

            {/* ── Right: actions ──────────────────────────────────────── */}
            <div className="w-full md:w-[360px] shrink-0 flex flex-col bg-bg p-8 md:p-10">
              {/* Close button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-2 rounded-full hover:bg-surface-2 transition-colors text-text-muted hover:text-text"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Accent bars */}
              <div className="flex flex-col gap-1.5 mb-8">
                <div style={{ width: 40, height: 5,  background: 'var(--accent)', opacity: 0.18 }} />
                <div style={{ width: 40, height: 9,  background: 'var(--accent)', opacity: 0.5  }} />
                <div style={{ width: 40, height: 20, background: 'var(--accent)' }} />
              </div>

              <h2 className="text-[28px] font-bold text-text leading-tight mb-2">
                Share your mission.
              </h2>
              <p className="text-[14px] text-text-muted font-medium leading-snug mb-8">
                Your {data.periodLabel} summary is ready — download or share with your crew.
              </p>

              {/* Stats snapshot */}
              <div className="grid grid-cols-2 gap-2 mb-8">
                <MiniStat label="km in the sky"    value={data.totalKm.toLocaleString()} />
                <MiniStat label="sectors flown"    value={data.flights.toString()} />
                <MiniStat label="block hours"      value={data.blockHrs.toString()} />
                <MiniStat label="destinations"     value={data.countries.toString()} />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-auto">
                <a
                  href={downloadUrl}
                  className="flex items-center justify-center gap-3 rounded-full font-bold transition-all active:scale-95 text-[15px] py-4"
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                  <Download size={18} strokeWidth={2.5} />
                  Download PNG
                </a>

                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-3 rounded-full font-semibold border border-border transition-all active:scale-95 hover:bg-surface-2 text-[14px] py-3.5"
                  style={{ color: 'var(--text)' }}
                >
                  {isCopied
                    ? <><Check size={16} className="text-success" strokeWidth={2.5} /> Link copied!</>
                    : <><Copy size={16} /> Copy link</>}
                </button>

                {typeof navigator !== 'undefined' && !!navigator.share && (
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-3 rounded-full font-semibold border border-border transition-all active:scale-95 hover:bg-surface-2 text-[14px] py-3.5"
                    style={{ color: 'var(--text)' }}
                  >
                    <Share2 size={16} />
                    Share directly
                  </button>
                )}
              </div>

              <p className="text-center font-mono font-black uppercase tracking-widest mt-8 text-[10px] text-text-subtle">
                {"// Mission Recap · Cemrosta"}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LiveRosterCard — the 9:16 card, styled with real data
// ─────────────────────────────────────────────────────────────────────────────

function LiveRosterCard({ data }: { data: CardData }) {
  const delta    = data.prevHours > 0
    ? Math.round(((data.hours - data.prevHours) / data.prevHours) * 100)
    : 0;
  const positive = delta >= 0;
  const fmt      = (n: number) => n.toLocaleString();

  return (
    <div
      className="relative w-full max-w-[300px] aspect-[9/16] overflow-hidden flex-shrink-0
                 bg-[#FFFCF8] text-[#222222] ring-1 ring-black/8"
      style={{
        borderRadius: 28,
        boxShadow: '0 24px 60px -12px rgba(0,0,0,0.22), 0 6px 20px -8px rgba(0,0,0,0.14)',
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-10 blur-3xl"
           style={{ background: 'var(--accent)' }} />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-[#00A699]/10 blur-3xl" />

      <div className="relative flex h-full flex-col p-5">
        {/* Header: period label + top route pill */}
        <header className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-0.5"
               style={{ color: 'var(--accent)' }}>
              // Mission Recap
            </p>
            <p className="text-[11px] font-semibold text-[#717171]">{data.rangeLabel || data.periodLabel}</p>
          </div>
          {data.topRoute && (
            <span className="rounded-full bg-[#222]/8 px-2 py-[3px] text-[9px] font-bold text-[#222] ring-1 ring-black/5">
              {data.topRoute.from} → {data.topRoute.to}
            </span>
          )}
        </header>

        {/* Period tabs strip */}
        <div className="mt-3 flex rounded-full bg-[#F1EFE8] p-[3px] text-[9px] font-semibold">
          {PERIOD_TABS.map((t) => (
            <div key={t.id} className="flex-1 text-center rounded-full py-1.5 text-[#717171]">
              {t.label}
            </div>
          ))}
        </div>

        {/* Hero stat */}
        <section className="mt-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em]"
             style={{ color: 'var(--accent)' }}>
            {data.periodLabel}
          </p>
          <div className="flex items-end gap-1.5 mt-0.5">
            <span className="text-[44px] font-bold leading-none tracking-tighter">{fmt(data.hours)}</span>
            <span className="mb-1 text-[11px] font-medium text-[#717171]">hrs in the air</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[9px] font-bold"
              style={{
                background: positive ? '#E8F5EF' : '#FBEAF0',
                color:      positive ? '#0F6E56' : '#993556',
              }}
            >
              <Ico d={positive ? ICON.trend : ICON.right} size={9} />
              {positive ? '+' : ''}{delta}% vs prev
            </span>
            {data.topRoute && (
              <span className="text-[9px] text-[#717171]">· top route {data.topRoute.from}→{data.topRoute.to}</span>
            )}
          </div>
        </section>

        {/* 4-up stat boxes */}
        <section className="mt-3 grid grid-cols-4 gap-1.5">
          <MiniStatBox icon={ICON.plane} value={fmt(data.flights)} label="Flights" />
          <MiniStatBox icon={ICON.globe} value={fmt(data.countries)} label="Dests" />
          <MiniStatBox icon={ICON.clock} value={fmt(data.blockHrs)} label="Hrs" />
          <MiniStatBox icon={ICON.route} value={`${(data.totalKm/1000).toFixed(0)}k`} label="km" />
        </section>

        {/* World map */}
        <section className="mt-3 overflow-hidden rounded-xl bg-[#F7F5F0] ring-1 ring-black/5">
          <div className="flex items-center justify-between px-2.5 pt-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#222]">Where you flew</p>
          </div>
          <CardWorldMap pins={data.pins} topRoute={data.topRoute} />
        </section>

        {/* Top destinations */}
        {data.topDests.length > 0 && (
          <section className="mt-2.5">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#717171]">Top destinations</p>
            <ul className="space-y-1">
              {data.topDests.map((d, i) => (
                <li key={d.code}
                    className="flex items-center justify-between rounded-lg bg-white px-2 py-1.5 ring-1 ring-black/5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-md text-[10px]"
                          style={{ background: 'var(--accent)' }}>
                      <span className="text-white font-bold text-[8px]">{d.flag}</span>
                    </span>
                    <div className="leading-tight">
                      <p className="text-[10px] font-semibold">
                        {d.city} <span className="text-[#717171] font-normal">· {d.code}</span>
                      </p>
                      <p className="text-[8px] text-[#717171]">{d.visits} visits · {d.blockHrs}h</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-[#717171]">#{i + 1}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-1 text-[9px] text-[#717171]">
            <span className="inline-grid h-4 w-4 place-items-center rounded-full text-white"
                  style={{ background: 'var(--accent)' }}>
              <Ico d={ICON.plane} size={8} />
            </span>
            <span className="font-bold tracking-tight text-[#222]">
              cemrosta
            </span>
          </div>
          <button className="inline-flex items-center gap-1 rounded-full bg-[#222] px-2.5 py-1 text-[9px] font-bold text-white">
            Share story <Ico d={ICON.right} size={8} />
          </button>
        </footer>
      </div>
    </div>
  );
}

// ── Sub-components for the 9:16 card ────────────────────────────────────────

function MiniStatBox({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-start rounded-lg bg-white px-1.5 py-1.5 ring-1 ring-black/5">
      <span style={{ color: 'var(--accent)' }}><Ico d={icon} size={11} /></span>
      <p className="mt-0.5 text-[14px] font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-0.5 text-[8px] text-[#717171]">{label}</p>
    </div>
  );
}

interface CardPin { x: number; y: number; code: string }

function CardWorldMap({ pins, topRoute }: {
  pins: CardPin[];
  topRoute: { from: string; to: string; count: number } | null;
}) {
  const continents = [
    { cx: 190, cy: 180, rx: 90,  ry: 55 },
    { cx: 270, cy: 320, rx: 42,  ry: 78 },
    { cx: 505, cy: 165, rx: 60,  ry: 42 },
    { cx: 525, cy: 305, rx: 60,  ry: 85 },
    { cx: 720, cy: 210, rx: 120, ry: 65 },
    { cx: 855, cy: 405, rx: 55,  ry: 32 },
  ];

  const from = topRoute ? pins.find((p) => p.code === topRoute.from) : null;
  const to   = topRoute ? pins.find((p) => p.code === topRoute.to)   : null;
  let arcPath = '';
  if (from && to) {
    const mx = (from.x + to.x) / 2;
    const my = Math.min(from.y, to.y) - 60;
    arcPath = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
  }

  return (
    <div className="px-2.5 pb-2.5 pt-1.5">
      <svg viewBox="0 0 1000 500" className="w-full">
        <defs>
          <pattern id="rm-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#222" opacity="0.06" />
          </pattern>
        </defs>
        <rect width="1000" height="500" fill="url(#rm-dots)" />
        <g fill="#222" opacity="0.08">
          {continents.map((c, i) => (
            <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} />
          ))}
        </g>
        <line x1="0" y1="250" x2="1000" y2="250"
              stroke="#222" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="4 6" />
        {arcPath && (
          <path d={arcPath} fill="none" stroke="var(--accent)"
                strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" opacity="0.85" />
        )}
        {pins.map((p) => (
          <g key={p.code}>
            <circle cx={p.x} cy={p.y} r="14" fill="var(--accent)" opacity="0.18" />
            <circle cx={p.x} cy={p.y} r="6.5" fill="var(--accent)" stroke="white" strokeWidth="2.5" />
          </g>
        ))}
        {to && (
          <circle cx={to.x} cy={to.y} r="22" fill="none"
                  stroke="var(--accent)" strokeWidth="1.5" opacity="0.35" />
        )}
      </svg>
    </div>
  );
}

// ── Right-panel mini stat ────────────────────────────────────────────────────

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[var(--radius-md)] bg-surface border border-border px-3 py-2.5">
      <p className="text-[18px] font-bold tracking-tight text-text font-mono">{value}</p>
      <p className="text-[10px] text-text-muted">{label}</p>
    </div>
  );
}

export default RecapModal;
