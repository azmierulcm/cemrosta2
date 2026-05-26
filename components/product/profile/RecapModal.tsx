'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import { recentPeriodKeys } from '@/lib/recap/period';
import type { EarnedDestination } from '@/lib/actions/destinations';
import type { RosterSummary } from '@/lib/types/roster';

// ─────────────────────────────────────────────────────────────────────────────
// RecapModal — shows the Satori-rendered /api/recap image (stories 9:16).
// Download, copy, and share all use the same API URL so they are consistent.
// ─────────────────────────────────────────────────────────────────────────────

// ── IATA metadata ────────────────────────────────────────────────────────────

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
  KNO: { city: 'Medan',        cc: 'ID' }, UPG: { city: 'Makassar',     cc: 'ID' },
  BPN: { city: 'Balikpapan',   cc: 'ID' }, PKU: { city: 'Pekanbaru',    cc: 'ID' },
  JOG: { city: 'Yogyakarta',   cc: 'ID' }, CNX: { city: 'Chiang Mai',   cc: 'TH' },
  HKT: { city: 'Phuket',       cc: 'TH' }, AMD: { city: 'Ahmedabad',    cc: 'IN' },
  CCU: { city: 'Kolkata',      cc: 'IN' }, CSX: { city: 'Changsha',     cc: 'CN' },
  CTU: { city: 'Chengdu',      cc: 'CN' }, TFU: { city: 'Chengdu',      cc: 'CN' },
  ADL: { city: 'Adelaide',     cc: 'AU' }, PNH: { city: 'Phnom Penh',   cc: 'KH' },
  AOR: { city: 'Alor Setar',   cc: 'MY' }, KUA: { city: 'Kuantan',      cc: 'MY' },
};

/** ISO 3166-1 alpha-2 → flag emoji */
function flag(cc: string): string {
  return [...cc.toUpperCase()].map(
    (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65),
  ).join('');
}

// ── Distance from KUL (km) ────────────────────────────────────────────────────

const KUL_DISTANCE_KM: Record<string, number> = {
  SIN: 316,   BKK: 1180,  CGK: 1160,  DPS: 2140,  KNO: 664,
  UPG: 2050,  BPN: 1545,  PKU: 600,   JOG: 1550,  PNH: 1002,
  HKT: 900,   CNX: 1600,  MNL: 2640,  HKG: 2680,  TPE: 3596,
  PVG: 4080,  PEK: 4355,  ICN: 4670,  NRT: 5330,  HND: 5340,
  MAA: 2847,  CMB: 2425,  BOM: 3865,  DEL: 4140,  KHI: 5040,
  AMD: 4200,  CCU: 3150,  CSX: 3800,  CTU: 3500,  TFU: 3500,
  DXB: 6340,  DOH: 6190,  AUH: 6395,  MCT: 5783,  JED: 7178,
  RUH: 6576,  IST: 8145,  CAI: 7663,  ADD: 6023,  NBO: 6566,
  JNB: 9050,  CPT: 10096, LHR: 10580, LGW: 10568, CDG: 10446,
  AMS: 10726, FRA: 9990,  MAD: 11077, FCO: 9700,  ZRH: 10197,
  VIE: 9638,  MUC: 9696,  SYD: 6641,  MEL: 6966,  BNE: 7006,
  PER: 3889,  AKL: 8158,  ZQN: 8500,  ADL: 6278,
  JFK: 15310, LAX: 13940, ORD: 14250, YYZ: 14980, GRU: 15980,
};

// ── Month label helper ────────────────────────────────────────────────────────

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

// ── Card data shape (used for desktop stats snapshot) ────────────────────────

interface CardData {
  periodLabel:   string;
  rangeLabel:    string;
  hours:         number;
  prevHours:     number;
  flights:       number;
  countries:     number;
  standbyDays:   number;
  offDays:       number;
  blockHrs:      number;
  totalKm:       number;
  topRoute:      { from: string; to: string; count: number } | null;
  longestRoute:  { from: string; to: string; km: number } | null;
  mostVisited:   { city: string; code: string; count: number } | null;
  topDests:      { city: string; code: string; flag: string; visits: number; blockHrs: number }[];
  moreStamps:    number;
}

function buildCardData(
  periodType: 'month' | '6m' | '1y',
  rosters: RosterSummary[],
  earnedDests: EarnedDestination[],
): CardData {
  const n       = periodType === 'month' ? 1 : periodType === '6m' ? 6 : 12;
  const current = rosters.slice(0, n);
  const prev    = rosters.slice(n, n * 2);

  const totalKm      = current.reduce((s, r) => s + r.totalKm, 0);
  const prevKm       = prev.reduce((s, r) => s + r.totalKm, 0);
  const totalSectors = current.reduce((s, r) => s + r.totalSectors, 0);
  const uniqueDests  = current.reduce((s, r) => s + r.uniqueDestinations, 0);
  const totalEvents  = current.reduce((s, r) => s + r.eventCount, 0);
  const blockHrs     = Math.round(totalKm / 850);
  const prevHours    = prevKm > 0 ? Math.round(prevKm / 850) : Math.max(1, Math.round(blockHrs * 0.92));

  const nonFlightEvents = Math.max(0, totalEvents - totalSectors);
  const standbyDays     = Math.round(nonFlightEvents * 0.25);
  const offDays         = Math.round(nonFlightEvents * 0.45);

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

  const nonHome = earnedDests.filter((d) => !d.isHome);
  const topDest = nonHome[0] ?? null;

  const topDests = nonHome.slice(0, 2).map((d) => ({
    city:     IATA_META[d.iata]?.city ?? d.iata,
    code:     d.iata,
    flag:     flag(IATA_META[d.iata]?.cc ?? 'XX'),
    visits:   d.visits,
    blockHrs: Math.round(d.visits * 7),
  }));

  let longestRoute: CardData['longestRoute'] = null;
  if (nonHome.length > 0) {
    const farthest = nonHome.reduce((best, d) => {
      const km = KUL_DISTANCE_KM[d.iata] ?? 0;
      return km > (KUL_DISTANCE_KM[best.iata] ?? 0) ? d : best;
    }, nonHome[0]);
    const km = KUL_DISTANCE_KM[farthest.iata];
    if (km) longestRoute = { from: 'KUL', to: farthest.iata, km };
  }

  const mostVisited: CardData['mostVisited'] = topDest
    ? { city: IATA_META[topDest.iata]?.city ?? topDest.iata, code: topDest.iata, count: topDest.visits }
    : null;

  const topRoute = topDest ? { from: 'KUL', to: topDest.iata, count: topDest.visits } : null;
  const moreStamps = Math.max(0, nonHome.length - 2);

  return {
    periodLabel, rangeLabel,
    hours: blockHrs, prevHours, flights: totalSectors, countries: uniqueDests,
    standbyDays, offDays, blockHrs, totalKm, topRoute, longestRoute, mostVisited, topDests, moreStamps,
  };
}

// ── API image URL builder ─────────────────────────────────────────────────────

type PeriodType = 'month' | '6m' | '1y';

function buildImageUrl(userId: string, periodType: PeriodType): string {
  const keys = recentPeriodKeys(periodType, 1);
  const key  = keys[0] ?? '';
  if (periodType === 'month') {
    const [year, month] = key.split('-');
    return `/api/recap/${userId}/${year}/${month}/stories`;
  }
  if (periodType === '6m') {
    const [year, half] = key.split('-H');
    return `/api/recap/${userId}/${year}/6m/${half}/stories`;
  }
  return `/api/recap/${userId}/${key}/1y/stories`;
}

// ── Focus-trap helper ─────────────────────────────────────────────────────────

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
// Main modal
// ─────────────────────────────────────────────────────────────────────────────

export function RecapModal({ isOpen, onClose, userId, earnedDestinations }: RecapModalProps) {
  const { rosters } = useRoster();
  const [period, setPeriod]         = useState<PeriodType>('month');
  const [isCopied, setIsCopied]     = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgState, setImgState]     = useState<'loading' | 'ok' | 'error'>('loading');

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

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const data = useMemo(
    () => buildCardData(period, rosters, earnedDestinations),
    [period, rosters, earnedDestinations],
  );

  const imageUrl = buildImageUrl(userId, period);

  // Reset loading state whenever the period changes
  useEffect(() => {
    setImgState('loading');
  }, [imageUrl]);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`${imageUrl}?download=1`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `Mission-Recap-${data.periodLabel.replace(/\s/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('[RecapModal] download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + imageUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${data.periodLabel} Roster Recap`,
          text: 'Check out my flight stats on Otarosta!',
          url: window.location.origin + imageUrl,
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
            {/* ── Left: API-rendered recap image ───────────────────────── */}
            <div className="flex-1 min-h-0 flex flex-col items-center gap-5 p-6 md:p-8
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
                        color:      active ? 'var(--accent-fg)' : 'var(--text-muted)',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Recap image — same source used for download and share */}
              <div
                className="relative rounded-[28px] overflow-hidden shadow-xl border border-border flex items-center justify-center bg-surface-2"
                style={{ aspectRatio: '9/16', height: 480 }}
              >
                {imgState === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    <p className="text-[11px] font-[600] text-text-muted uppercase tracking-widest">Rendering…</p>
                  </div>
                )}
                {imgState === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                    <p className="text-[13px] font-[700] text-text">Preview unavailable</p>
                    <p className="text-[11px] text-text-muted leading-snug">No roster data found for this period.</p>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt="Recap preview"
                  className="w-full h-full object-cover"
                  style={{ opacity: imgState === 'ok' ? 1 : 0 }}
                  loading="eager"
                  onLoad={() => setImgState('ok')}
                  onError={() => setImgState('error')}
                />
              </div>
            </div>

            {/* ── Right: actions ────────────────────────────────────── */}
            <div className="w-full md:w-[360px] shrink-0 flex flex-col bg-bg p-8 md:p-10 max-h-[48vh] md:max-h-none overflow-y-auto">
              {/* Close */}
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
              <div className="hidden md:flex flex-col gap-1.5 mb-8">
                <div style={{ width: 40, height: 5,  background: 'var(--accent)', opacity: 0.18 }} />
                <div style={{ width: 40, height: 9,  background: 'var(--accent)', opacity: 0.5  }} />
                <div style={{ width: 40, height: 20, background: 'var(--accent)' }} />
              </div>

              <h2 className="text-[28px] font-black text-text leading-tight tracking-tighter mb-2">
                Share your mission.
              </h2>
              <p className="text-[14px] text-text-muted font-bold leading-snug mb-8">
                Your {data.periodLabel} summary is ready — download or share with your crew.
              </p>

              {/* Stats snapshot (desktop only — card already shows this on mobile) */}
              <div className="hidden md:grid grid-cols-2 gap-2 mb-8">
                <MiniStat label="km in the sky"  value={data.totalKm.toLocaleString()} />
                <MiniStat label="sectors flown"  value={data.flights.toString()} />
                <MiniStat label="block hours"     value={data.blockHrs.toString()} />
                <MiniStat label="destinations"    value={data.countries.toString()} />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-4 md:mt-auto">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading || imgState !== 'ok'}
                  className="flex items-center justify-center gap-3 rounded-full font-bold transition-all active:scale-95 text-[15px] py-4 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                  {isDownloading
                    ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Downloading…</>
                    : <><Download size={18} strokeWidth={2.5} /> Download PNG</>
                  }
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-3 rounded-full font-bold border border-border transition-all active:scale-95 hover:bg-surface-2 text-[14px] py-3.5"
                  style={{ color: 'var(--text)' }}
                >
                  {isCopied
                    ? <><Check size={16} className="text-success" strokeWidth={2.5} /> Link copied!</>
                    : <><Copy size={16} /> Copy link</>}
                </button>

                {typeof navigator !== 'undefined' && !!navigator.share && (
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-3 rounded-full font-bold border border-border transition-all active:scale-95 hover:bg-surface-2 text-[14px] py-3.5"
                    style={{ color: 'var(--text)' }}
                  >
                    <Share2 size={16} />
                    Share directly
                  </button>
                )}
              </div>

              <p className="text-center font-mono font-black uppercase tracking-widest mt-8 text-[10px] text-text-subtle">
                {"// Mission Recap · Otarosta"}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Right-panel mini stat ─────────────────────────────────────────────────────

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[var(--radius-md)] bg-surface border border-border px-3 py-2.5">
      <p className="text-[18px] font-bold tracking-tight text-text font-mono">{value}</p>
      <p className="text-[10px] text-text-muted">{label}</p>
    </div>
  );
}

export default RecapModal;
