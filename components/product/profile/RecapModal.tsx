'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useRoster } from '@/lib/contexts/RosterContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { recentPeriodKeys } from '@/lib/recap/period';
import type { EarnedDestination } from '@/lib/actions/destinations';
import type { RosterSummary } from '@/lib/types/roster';

// ─────────────────────────────────────────────────────────────────────────────
// RecapModal — v3 card design · Instagram Stories 9:16 layout
// Real data from useRoster() + earnedDestinations.
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
  // New MAS destinations
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

// ── Distance from KUL (km) for longestRoute highlight ────────────────────────

// ── IATA code → city patch filename in /images/city_patches/ ─────────────────

const IATA_PATCH: Record<string, string> = {
  // Malaysia
  KUL: 'kuala_lumpur_patch.png', PEN: 'penang_patch.png',
  LGK: 'langkawi_patch.png',     JHB: 'johor_bahru_patch.png',
  KBR: 'kota_bharu_patch.png',   KUA: 'kuantan_patch.png',
  TGG: 'kuala_terengganu_patch.png',
  BKI: 'kota_kinabalu_patch.png', KCH: 'kuching_patch.png',
  MYY: 'miri_patch.png',          BTU: 'bintulu_patch.png',
  SDK: 'sandakan_patch.png',      TWU: 'tawau_patch.png',
  LBU: 'labuan_patch.png',        AOR: 'alor_setar_patch',
  // Southeast Asia
  SIN: 'singapore_patch.png',    BKK: 'bangkok_patch.png',
  HKT: 'phuket_patch.png',       CNX: 'chiang_mai_patch.png',
  MNL: 'manila_patch.png',       CGK: 'jakarta_patch.png',
  SUB: 'surabaya_patch.png',     DPS: 'bali_patch.png',
  JOG: 'yogyakarta_patch',       UPG: 'makassar_patch.png',
  BPN: 'balikpapan_patch.png',   PKU: 'pekanbaru_patch.png',
  KNO: 'medan_patch.png',        PNH: 'phnom_penh_patch.png',
  SGN: 'ho_chi_minh_city_patch.png', HAN: 'hanoi_patch.png',
  DAD: 'da_nang_patch.png',      RGN: 'yangon_patch.png',
  // East Asia
  HKG: 'hong_kong_patch.png',    TPE: 'taipei_patch.png',
  PEK: 'beijing_patch.png',      PVG: 'shanghai_patch.png',
  CSX: 'changsha_patch.png',     CTU: 'chengdu_patch.png',
  TFU: 'chengdu_patch.png',      XMN: 'xiamen_patch.png',
  CAN: 'guangzhou_patch.png',    SZX: 'shenzhen_patch.png',
  ICN: 'seoul_patch.png',        NRT: 'japan_patch.png',
  HND: 'japan_patch.png',        FUK: 'fukuoka_patch.png',
  KIX: 'osaka_patch.png',
  // South Asia
  DEL: 'delhi_patch.png',        BOM: 'mumbai_patch.png',
  MAA: 'chennai_patch.png',      CCU: 'kolkata_patch.png',
  BLR: 'bengaluru_patch.png',    HYD: 'hyderabad_patch.png',
  COK: 'kochi_patch.png',        AMD: 'ahmedabad_patch.png',
  ATQ: 'amritsar_patch.png',     TRV: 'thiruvananthapuram_patch.png',
  CMB: 'colombo_patch.png',      DAC: 'dhaka_patch.png',
  KTM: 'kathmandu_patch.png',
  // Middle East
  DOH: 'doha_patch.png',         JED: 'jeddah_patch.png',
  MED: 'medina_patch.png',
  // Maldives
  MLE: 'male_patch.png',
  // Europe
  LHR: 'london_patch.png',       LGW: 'london_patch.png',
  CDG: 'paris_patch.png',
  // Oceania
  SYD: 'sydney_patch.png',       MEL: 'melbourne_patch.png',
  BNE: 'brisbane_patch.png',     PER: 'perth_patch.png',
  ADL: 'adelaide_patch',         AKL: 'auckland_patch.png',
};

// ── Distance from KUL (km) for longestRoute highlight ────────────────────────

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

// ── Card data shape ───────────────────────────────────────────────────────────

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

  // Non-flight events split into rough standby / off estimates
  const nonFlightEvents = Math.max(0, totalEvents - totalSectors);
  const standbyDays     = Math.round(nonFlightEvents * 0.25);
  const offDays         = Math.round(nonFlightEvents * 0.45);

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

  // Show max 2 stamp patches — larger and more beautiful
  const topDests = nonHome.slice(0, 2).map((d) => ({
    city:     IATA_META[d.iata]?.city ?? d.iata,
    code:     d.iata,
    flag:     flag(IATA_META[d.iata]?.cc ?? 'XX'),
    visits:   d.visits,
    blockHrs: Math.round(d.visits * 7),
  }));

  // Longest route from KUL among earned destinations
  let longestRoute: CardData['longestRoute'] = null;
  if (nonHome.length > 0) {
    const farthest = nonHome.reduce((best, d) => {
      const km = KUL_DISTANCE_KM[d.iata] ?? 0;
      return km > (KUL_DISTANCE_KM[best.iata] ?? 0) ? d : best;
    }, nonHome[0]);
    const km = KUL_DISTANCE_KM[farthest.iata];
    if (km) longestRoute = { from: 'KUL', to: farthest.iata, km };
  }

  // Most visited
  const mostVisited: CardData['mostVisited'] = topDest
    ? { city: IATA_META[topDest.iata]?.city ?? topDest.iata, code: topDest.iata, count: topDest.visits }
    : null;

  // Top route
  const topRoute = topDest ? { from: 'KUL', to: topDest.iata, count: topDest.visits } : null;

  // More stamps (beyond the 2 shown)
  const moreStamps = Math.max(0, nonHome.length - 2);

  return {
    periodLabel,
    rangeLabel,
    hours:        blockHrs,
    prevHours,
    flights:      totalSectors,
    countries:    uniqueDests,
    standbyDays,
    offDays,
    blockHrs,
    totalKm,
    topRoute,
    longestRoute,
    mostVisited,
    topDests,
    moreStamps,
  };
}

// ── Download URL builder (for copy link — shares a web-accessible URL) ────────

type PeriodType = 'month' | '6m' | '1y';

function buildDownloadUrl(userId: string, periodType: PeriodType): string {
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

// ── Capture the card ref as a PNG blob ───────────────────────────────────────
// Avatar is proxied through /api/proxy-image (same-origin) so canvas stays clean.

async function captureCardBlob(el: HTMLElement): Promise<Blob> {
  // First pass warms up font/image cache; second pass produces the clean render.
  let dataUrl = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      dataUrl = await toPng(el, { pixelRatio: 3, cacheBust: false });
      if (dataUrl) break;
    } catch {
      if (attempt === 1) throw new Error('capture failed');
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  const res = await fetch(dataUrl);
  return res.blob();
}

// ── Tiny inline SVG icon ──────────────────────────────────────────────────────

const Ico = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICON = {
  plane:   'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-3 3-2-.5c-.4-.1-.8 0-1 .3l-.3.3c-.3.4-.3 1 .1 1.3L6 18l1.8 2.8c.3.4.9.4 1.3.1l.3-.3c.3-.2.4-.6.3-1l-.5-2 3-3 4.3 4.8c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1Z',
  globe:   'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.5 4-6 4-9s-1.5-6.5-4-9m0 18c-2.5-2.5-4-6-4-9s1.5-6.5 4-9M3.5 9h17M3.5 15h17',
  clock:   'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v4l3 3',
  standby: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 8v4l4 2',
  beach:   'M12 21V11M5 11h14M5 11a7 7 0 0 1 14 0M3 19c2-1 3-1 4.5 0s2.5 1 4.5 0 3-1 4.5 0 2.5 1 4.5 0',
  trend:   'M3 17l6-6 4 4 8-8M14 7h7v7',
  route:   'M5 21V7a3 3 0 0 1 6 0v10a3 3 0 0 0 6 0V3M9 7l-3-3-3 3M15 17l3 3 3-3',
  pin:     'M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12ZM12 9a2 2 0 1 0 .001 4.001A2 2 0 0 0 12 9Z',
  right:   'M5 12h14M13 6l6 6-6 6',
  share:   'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14',
};

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
  const { profile }  = useAuth();
  const [period, setPeriod]     = useState<PeriodType>('month');
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

  // Lock body scroll while open so the Leaflet map beneath can't intercept wheel events
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

  // Profile for the card header
  const cardProfile = useMemo(() => {
    const name     = profile?.full_name || 'Crew Member';
    const rankLine = [profile?.rank, profile?.fleet].filter(Boolean).join(' · ') || 'Malaysia Airlines';
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    return { name, rankLine, initials, avatarUrl: profile?.avatar_url ?? null };
  }, [profile]);

  const downloadUrl = buildDownloadUrl(userId, period);
  const cardRef     = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const blob      = await captureCardBlob(cardRef.current);
      const objectUrl = URL.createObjectURL(blob);
      const a         = document.createElement('a');
      a.href          = objectUrl;
      a.download      = `Mission-Recap-${data.periodLabel.replace(/\s/g, '-')}.png`;
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
      await navigator.clipboard.writeText(window.location.origin + downloadUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (!navigator.share || !cardRef.current) return;
    try {
      const blob = await captureCardBlob(cardRef.current);
      const file = new File([blob], `Mission-Recap-${data.periodLabel.replace(/\s/g, '-')}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My ${data.periodLabel} Roster Recap`,
          text: 'Check out my flight stats on Otarosta!',
        });
      } else {
        // Fallback: share URL if file sharing not supported
        await navigator.share({
          title: `My ${data.periodLabel} Roster Recap`,
          text: 'Check out my flight stats on Otarosta!',
          url: window.location.origin + downloadUrl,
        });
      }
    } catch { /* ignore */ }
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
            {/* ── Left: 9:16 card preview ───────────────────────────── */}
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

              {/* The 9:16 card — ref used for image capture */}
              <div ref={cardRef} className="inline-block">
                <LiveRosterCard data={data} profile={cardProfile} />
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

              {/* Stats snapshot (desktop only) */}
              <div className="hidden md:grid grid-cols-2 gap-2 mb-8">
                <MiniStat label="km in the sky"   value={data.totalKm.toLocaleString()} />
                <MiniStat label="sectors flown"   value={data.flights.toString()} />
                <MiniStat label="block hours"      value={data.blockHrs.toString()} />
                <MiniStat label="destinations"     value={data.countries.toString()} />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-4 md:mt-auto">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
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

// ─────────────────────────────────────────────────────────────────────────────
// LiveRosterCard — v3 9:16 card with real data
// ─────────────────────────────────────────────────────────────────────────────

interface CardProfile { name: string; rankLine: string; initials: string; avatarUrl: string | null }

function LiveRosterCard({ data, profile }: { data: CardData; profile: CardProfile }) {
  const delta      = data.prevHours > 0
    ? Math.round(((data.hours - data.prevHours) / data.prevHours) * 100)
    : 0;
  const positive   = delta >= 0;
  const fmt        = (n: number) => n.toLocaleString();
  const stampCount = data.topDests.length + data.moreStamps;

  return (
    <div
      className="relative w-full max-w-[300px] aspect-[9/16] overflow-hidden flex-shrink-0"
      style={{
        borderRadius: 28,
        background: '#FFFCF8',
        color: '#222222',
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.25), 0 8px 24px -12px rgba(0,0,0,0.15)',
        outline: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
           style={{ background: '#FF385C', opacity: 0.08 }} />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full blur-3xl"
           style={{ background: '#00A699', opacity: 0.08 }} />

      <div className="relative flex h-full flex-col p-4">

        {/* ── Header ── */}
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar served via same-origin proxy so canvas capture doesn't taint */}
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/proxy-image?url=${encodeURIComponent(profile.avatarUrl)}`}
                alt={profile.name}
                className="h-9 w-9 rounded-full object-cover shadow-md shrink-0"
              />
            ) : (
              <div
                className="grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold text-white shadow-md shrink-0"
                style={{ background: 'linear-gradient(135deg, #FF385C, #E61E4D)' }}
              >
                {profile.initials}
              </div>
            )}
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-[12px] font-bold tracking-tight truncate">{profile.name}</p>
                <span className="rounded-full px-1.5 py-[1px] text-[8px] font-bold tracking-wide text-white shrink-0"
                      style={{ background: '#222' }}>
                  MH
                </span>
              </div>
              <p className="text-[9px] truncate" style={{ color: '#717171' }}>{profile.rankLine}</p>
            </div>
          </div>
          {/* Period pill */}
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(255,56,92,0.1)', color: '#FF385C' }}
          >
            {data.periodLabel}
          </span>
        </header>

        {/* ── Passport stamps hero — 2 large patches ── */}
        <section className="mt-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: '#FF385C' }}>
              Stamps collected
            </p>
            {stampCount > 0 && (
              <p className="text-[8px] font-bold" style={{ color: '#717171' }}>
                {stampCount} total
              </p>
            )}
          </div>

          {data.topDests.length > 0 ? (
            <div className="flex-1 flex flex-col">
              {/* 2-column grid — large, borderless patches */}
              <div className="grid grid-cols-2 gap-2 flex-1">
                {data.topDests.slice(0, 2).map((d) => (
                  <div
                    key={d.code}
                    className="relative flex flex-col items-center justify-center"
                    style={{ minHeight: 100 }}
                  >
                    {/* eager loading ensures images are ready when html-to-image captures */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/images/city_patches/${IATA_PATCH[d.code] ?? `${d.code.toLowerCase()}_patch.png`}`}
                      alt={`${d.city} stamp`}
                      className="w-full h-full object-contain"
                      loading="eager"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                      }}
                    />
                    <div hidden className="flex flex-col items-center justify-center gap-1 p-3">
                      <span className="text-[28px]">{d.flag}</span>
                      <span className="text-[11px] font-bold" style={{ color: '#222' }}>{d.code}</span>
                      <span className="text-[8px]" style={{ color: '#717171' }}>{d.city}</span>
                    </div>
                    {/* City + visit count below the stamp */}
                    <div className="mt-1 text-center">
                      <p className="text-[8px] font-bold leading-tight" style={{ color: '#222' }}>
                        {d.city}
                      </p>
                      <p className="text-[7px]" style={{ color: '#717171' }}>
                        {d.visits} visit{d.visits !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {data.moreStamps > 0 && (
                <p className="mt-1.5 text-center text-[8px] font-bold" style={{ color: '#717171' }}>
                  +{data.moreStamps} more stamp{data.moreStamps !== 1 ? 's' : ''} this {data.periodLabel.toLowerCase().includes('month') ? 'month' : 'period'}
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 rounded-2xl ring-1 ring-black/5 flex flex-col items-center justify-center gap-2"
                 style={{ background: '#F7F5F0', minHeight: 100 }}>
              <span className="text-[24px]">✈️</span>
              <p className="text-[9px]" style={{ color: '#717171' }}>No destinations yet</p>
            </div>
          )}
        </section>

        {/* ── Stats grid: hours (featured) + 4 smaller ── */}
        <section className="mt-3 grid grid-cols-4 grid-rows-2 gap-1.5">
          {/* Hours — spans 2 cols × 2 rows */}
          <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-2xl bg-white px-3 py-2.5 ring-1 ring-black/5">
            <div>
              <div className="flex items-center gap-1" style={{ color: '#FF385C' }}>
                <Ico d={ICON.clock} size={11} />
                <span className="text-[8px] font-bold uppercase tracking-wider">Hours</span>
              </div>
              <p className="mt-1 flex items-baseline gap-1 text-[32px] font-bold leading-none tracking-tight">
                {fmt(data.hours)}
                <span className="text-[10px] font-medium" style={{ color: '#717171' }}>h</span>
              </p>
              <p className="mt-0.5 text-[8px]" style={{ color: '#717171' }}>{data.rangeLabel}</p>
            </div>
            <span
              className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-[2px] text-[8px] font-bold"
              style={{
                background: positive ? '#E8F5EF' : '#FBEAF0',
                color:      positive ? '#0F6E56' : '#993556',
              }}
            >
              <Ico d={positive ? ICON.trend : ICON.right} size={8} />
              {positive ? '+' : ''}{delta}% vs prev
            </span>
          </div>

          {/* 4 small stats */}
          <SmallStat icon={ICON.plane}   value={fmt(data.flights)}      label="Flights"  />
          <SmallStat icon={ICON.globe}   value={fmt(data.countries)}    label="Countries"/>
          <SmallStat icon={ICON.standby} value={`${data.standbyDays}d`} label="Standby"  />
          <SmallStat icon={ICON.beach}   value={`${data.offDays}d`}     label="Off days" />
        </section>

        {/* ── Highlights ── */}
        <section className="mt-3 grid grid-cols-2 gap-1.5">
          {/* Longest distance */}
          <div className="rounded-xl p-2 ring-1 ring-black/5" style={{ background: '#FFE9EE' }}>
            <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider"
                 style={{ color: '#FF385C' }}>
              <Ico d={ICON.route} size={9} />Longest
            </div>
            {data.longestRoute ? (
              <>
                <p className="mt-1 text-[11px] font-bold leading-tight" style={{ color: '#222' }}>
                  {data.longestRoute.from} → {data.longestRoute.to}
                </p>
                <p className="text-[9px] font-medium" style={{ color: '#FF385C' }}>
                  {data.longestRoute.km.toLocaleString()} km
                </p>
              </>
            ) : (
              <p className="mt-1 text-[9px]" style={{ color: '#717171' }}>—</p>
            )}
          </div>
          {/* Most visited */}
          <div className="rounded-xl p-2 ring-1 ring-black/5" style={{ background: '#E1F5EE' }}>
            <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider"
                 style={{ color: '#00A699' }}>
              <Ico d={ICON.pin} size={9} />Most visited
            </div>
            {data.mostVisited ? (
              <>
                <p className="mt-1 text-[11px] font-bold leading-tight" style={{ color: '#222' }}>
                  {data.mostVisited.city}
                </p>
                <p className="text-[9px] font-medium" style={{ color: '#00A699' }}>
                  {data.mostVisited.count} visits · {data.mostVisited.code}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[9px]" style={{ color: '#717171' }}>—</p>
            )}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="mt-2 flex items-center justify-center pt-1">
          <div className="flex items-center gap-1.5 text-[8px]" style={{ color: '#717171' }}>
            <span className="inline-grid h-4 w-4 place-items-center rounded-full text-white"
                  style={{ background: '#FF385C' }}>
              <Ico d={ICON.plane} size={8} />
            </span>
            <span className="font-bold tracking-tight" style={{ color: '#717171' }}>
              otarosta<span style={{ color: '#FF385C' }}>.com</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Small stat box for the stats grid ────────────────────────────────────────

function SmallStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-start rounded-xl bg-white px-2 py-1.5 ring-1 ring-black/5">
      <span style={{ color: '#FF385C' }}><Ico d={icon} size={10} /></span>
      <p className="mt-0.5 text-[13px] font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-0.5 text-[7px]" style={{ color: '#717171' }}>{label}</p>
    </div>
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
