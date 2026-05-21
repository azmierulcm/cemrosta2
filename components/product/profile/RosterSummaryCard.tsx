'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import type { EarnedDestination } from '@/lib/actions/destinations';
import type { RosterSummary } from '@/lib/types/roster';
import { TopDestinations, earnedToTopDest } from '@/components/product/TopDestinations';

const SummaryMapLeaflet = dynamic(() => import('./SummaryMapLeaflet'), { ssr: false });

// ─────────────────────────────────────────────────────────────────────────────
// RosterSummaryCard — visual language matches LiveRosterCard exactly
// ─────────────────────────────────────────────────────────────────────────────

// ── IATA metadata ─────────────────────────────────────────────────────────────

const IATA_META: Record<string, { city: string; cc: string }> = {
  KUL: { city: 'Kuala Lumpur',  cc: 'MY' }, SIN: { city: 'Singapore',    cc: 'SG' },
  BKK: { city: 'Bangkok',       cc: 'TH' }, HKG: { city: 'Hong Kong',    cc: 'HK' },
  ICN: { city: 'Seoul',         cc: 'KR' }, NRT: { city: 'Tokyo',        cc: 'JP' },
  HND: { city: 'Tokyo',         cc: 'JP' }, PEK: { city: 'Beijing',      cc: 'CN' },
  PVG: { city: 'Shanghai',      cc: 'CN' }, TPE: { city: 'Taipei',       cc: 'TW' },
  MNL: { city: 'Manila',        cc: 'PH' }, CGK: { city: 'Jakarta',      cc: 'ID' },
  DPS: { city: 'Bali',          cc: 'ID' }, DEL: { city: 'New Delhi',    cc: 'IN' },
  BOM: { city: 'Mumbai',        cc: 'IN' }, MAA: { city: 'Chennai',      cc: 'IN' },
  CMB: { city: 'Colombo',       cc: 'LK' }, KHI: { city: 'Karachi',      cc: 'PK' },
  DXB: { city: 'Dubai',         cc: 'AE' }, DOH: { city: 'Doha',         cc: 'QA' },
  AUH: { city: 'Abu Dhabi',     cc: 'AE' }, MCT: { city: 'Muscat',       cc: 'OM' },
  RUH: { city: 'Riyadh',        cc: 'SA' }, JED: { city: 'Jeddah',       cc: 'SA' },
  IST: { city: 'Istanbul',      cc: 'TR' }, CAI: { city: 'Cairo',        cc: 'EG' },
  ADD: { city: 'Addis Ababa',   cc: 'ET' }, NBO: { city: 'Nairobi',      cc: 'KE' },
  JNB: { city: 'Johannesburg',  cc: 'ZA' }, CPT: { city: 'Cape Town',    cc: 'ZA' },
  LHR: { city: 'London',        cc: 'GB' }, LGW: { city: 'London',       cc: 'GB' },
  CDG: { city: 'Paris',         cc: 'FR' }, AMS: { city: 'Amsterdam',    cc: 'NL' },
  FRA: { city: 'Frankfurt',     cc: 'DE' }, MAD: { city: 'Madrid',       cc: 'ES' },
  FCO: { city: 'Rome',          cc: 'IT' }, ZRH: { city: 'Zurich',       cc: 'CH' },
  VIE: { city: 'Vienna',        cc: 'AT' }, MUC: { city: 'Munich',       cc: 'DE' },
  SYD: { city: 'Sydney',        cc: 'AU' }, MEL: { city: 'Melbourne',    cc: 'AU' },
  BNE: { city: 'Brisbane',      cc: 'AU' }, PER: { city: 'Perth',        cc: 'AU' },
  AKL: { city: 'Auckland',      cc: 'NZ' }, ZQN: { city: 'Queenstown',   cc: 'NZ' },
  JFK: { city: 'New York',      cc: 'US' }, LAX: { city: 'Los Angeles',  cc: 'US' },
  ORD: { city: 'Chicago',       cc: 'US' }, YYZ: { city: 'Toronto',      cc: 'CA' },
  GRU: { city: 'São Paulo',     cc: 'BR' },
  KNO: { city: 'Medan',         cc: 'ID' }, UPG: { city: 'Makassar',     cc: 'ID' },
  BPN: { city: 'Balikpapan',    cc: 'ID' }, PKU: { city: 'Pekanbaru',    cc: 'ID' },
  JOG: { city: 'Yogyakarta',    cc: 'ID' }, CNX: { city: 'Chiang Mai',   cc: 'TH' },
  HKT: { city: 'Phuket',        cc: 'TH' }, AMD: { city: 'Ahmedabad',    cc: 'IN' },
  CCU: { city: 'Kolkata',       cc: 'IN' }, CSX: { city: 'Changsha',     cc: 'CN' },
  CTU: { city: 'Chengdu',       cc: 'CN' }, TFU: { city: 'Chengdu',      cc: 'CN' },
  ADL: { city: 'Adelaide',      cc: 'AU' }, PNH: { city: 'Phnom Penh',   cc: 'KH' },
  AOR: { city: 'Alor Setar',    cc: 'MY' }, KUA: { city: 'Kuantan',      cc: 'MY' },
  PEN: { city: 'Penang',        cc: 'MY' }, SGN: { city: 'Ho Chi Minh',  cc: 'VN' },
  HAN: { city: 'Hanoi',         cc: 'VN' }, RGN: { city: 'Yangon',       cc: 'MM' },
  DAC: { city: 'Dhaka',         cc: 'BD' }, KTM: { city: 'Kathmandu',    cc: 'NP' },
  MLE: { city: 'Male',          cc: 'MV' }, MED: { city: 'Medina',       cc: 'SA' },
  FUK: { city: 'Fukuoka',       cc: 'JP' }, KIX: { city: 'Osaka',        cc: 'JP' },
  BKI: { city: 'Kota Kinabalu', cc: 'MY' }, KCH: { city: 'Kuching',      cc: 'MY' },
};

/** ISO 3166-1 alpha-2 → flag emoji */
function flagEmoji(cc: string): string {
  return [...cc.toUpperCase()].map(
    (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65),
  ).join('');
}

// ── IATA lon/lat for react-simple-maps ────────────────────────────────────────

const IATA_COORDS: Record<string, [number, number]> = {
  KUL: [101.71, 2.74],   SIN: [103.99, 1.35],   BKK: [100.75, 13.69],
  HKG: [113.91, 22.31],  ICN: [126.44, 37.46],  NRT: [140.39, 35.76],
  HND: [139.78, 35.55],  PEK: [116.58, 40.08],  PVG: [121.81, 31.14],
  TPE: [121.23, 25.08],  MNL: [121.01, 14.51],  CGK: [106.66, -6.12],
  DPS: [115.17, -8.74],  DEL: [77.10, 28.56],   BOM: [72.87, 19.09],
  MAA: [80.17, 12.99],   CMB: [79.89, 7.18],    KHI: [67.16, 24.91],
  DXB: [55.36, 25.25],   DOH: [51.61, 25.27],   AUH: [54.65, 24.43],
  MCT: [58.28, 23.59],   RUH: [46.70, 24.96],   JED: [39.16, 21.68],
  IST: [28.82, 40.98],   CAI: [31.41, 30.12],   ADD: [38.80, 8.98],
  NBO: [36.93, -1.32],   JNB: [28.24, -26.13],  CPT: [18.60, -33.96],
  LHR: [-0.45, 51.47],   LGW: [-0.19, 51.15],   CDG: [2.55, 49.01],
  AMS: [4.76, 52.31],    FRA: [8.57, 50.03],    MAD: [-3.57, 40.47],
  FCO: [12.25, 41.80],   ZRH: [8.55, 47.46],    VIE: [16.57, 48.11],
  MUC: [11.79, 48.35],   SYD: [151.18, -33.94], MEL: [144.84, -37.67],
  BNE: [153.12, -27.38], PER: [115.97, -31.94], AKL: [174.79, -37.01],
  ZQN: [168.74, -45.02], JFK: [-73.78, 40.64],  LAX: [-118.41, 33.94],
  ORD: [-87.90, 41.98],  YYZ: [-79.63, 43.68],  GRU: [-46.47, -23.43],
  KNO: [98.88, 3.64],    UPG: [119.55, -5.06],  BPN: [116.89, -1.27],
  PKU: [101.44, 0.46],   JOG: [110.43, -7.79],  CNX: [98.97, 18.77],
  HKT: [98.30, 8.11],    AMD: [72.63, 23.08],   CCU: [88.45, 22.65],
  CSX: [113.22, 28.19],  CTU: [103.95, 30.58],  TFU: [103.89, 30.54],
  ADL: [138.53, -34.94], PNH: [104.84, 11.55],  AOR: [100.40, 6.19],
  KUA: [103.21, 3.78],   PEN: [100.28, 5.30],   SGN: [106.81, 10.82],
  HAN: [105.80, 21.22],  RGN: [96.13, 16.91],   DAC: [90.40, 23.84],
  KTM: [85.36, 27.70],   MLE: [73.53, 4.19],    MED: [39.70, 24.55],
  FUK: [130.45, 33.58],  KIX: [135.24, 34.43],  BKI: [116.05, 5.94],
  KCH: [110.34, 1.49],
};

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
  PEN: 310,   SGN: 1143,  HAN: 2681,  MLE: 2977,
  FUK: 5010,  KIX: 5210,  BKI: 1628,  KCH: 1402,
};

// ── Month helpers ─────────────────────────────────────────────────────────────

const MONTH_IDX: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function rosterLabel(r: RosterSummary): string {
  const key = r.month.trim().toUpperCase();
  const idx = MONTH_IDX[key] ?? Math.max(0, parseInt(r.month, 10) - 1);
  return `${MONTH_SHORT[idx] ?? r.month} ${r.year}`;
}

// ── Inline icon ───────────────────────────────────────────────────────────────

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
};

// ── Period ────────────────────────────────────────────────────────────────────

type Period = 'month' | '6m' | '1y';

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: 'month', label: 'This month' },
  { id: '6m',   label: '6 months' },
  { id: '1y',   label: 'Year' },
];

// ── Aggregation ───────────────────────────────────────────────────────────────

interface Stats {
  totalKm: number; prevKm: number;
  totalSectors: number; uniqueDestinations: number;
  blockHours: number; rosterCount: number;
  standbyDays: number; offDays: number;
  periodLabel: string; rangeLabel: string;
  longestRoute: { from: string; to: string; km: number } | null;
  mostVisited:  { city: string; code: string; flag: string; count: number } | null;
  topRoute:     { from: string; to: string; count: number } | null;
  mapCoords:    { code: string; coords: [number, number] }[];
}

function buildStats(
  period: Period,
  rosters: RosterSummary[],
  earnedDests: EarnedDestination[],
): Stats {
  const n       = period === 'month' ? 1 : period === '6m' ? 6 : 12;
  const current = rosters.slice(0, n);
  const prev    = rosters.slice(n, n * 2);

  const totalKm         = current.reduce((s, r) => s + r.totalKm, 0);
  const prevKm          = prev.reduce((s, r) => s + r.totalKm, 0);
  const totalSectors    = current.reduce((s, r) => s + r.totalSectors, 0);
  const uniqueDestinations = current.reduce((s, r) => s + r.uniqueDestinations, 0);
  const totalEvents     = current.reduce((s, r) => s + r.eventCount, 0);
  const blockHours      = Math.round(totalKm / 850);
  const nonFlightEvents = Math.max(0, totalEvents - totalSectors);
  const standbyDays     = Math.round(nonFlightEvents * 0.25);
  const offDays         = Math.round(nonFlightEvents * 0.45);

  let periodLabel = '—', rangeLabel = '';
  if (current.length > 0) {
    const newest = current[0];
    const oldest = current[current.length - 1];
    if (period === 'month') {
      periodLabel = rosterLabel(newest);
      rangeLabel  = `${newest.month} ${newest.year}`;
    } else {
      periodLabel = period === '6m' ? 'Last 6 months' : 'Last 12 months';
      rangeLabel  = `${rosterLabel(oldest)} — ${rosterLabel(newest)}`;
    }
  }

  const nonHome  = earnedDests.filter((d) => !d.isHome);
  const topDest  = nonHome[0] ?? null;

  // Longest route
  let longestRoute: Stats['longestRoute'] = null;
  if (nonHome.length > 0) {
    const farthest = nonHome.reduce((best, d) =>
      (KUL_DISTANCE_KM[d.iata] ?? 0) > (KUL_DISTANCE_KM[best.iata] ?? 0) ? d : best, nonHome[0]);
    const km = KUL_DISTANCE_KM[farthest.iata];
    if (km) longestRoute = { from: 'KUL', to: farthest.iata, km };
  }

  // Most visited
  const mostVisited: Stats['mostVisited'] = topDest
    ? {
        city:  IATA_META[topDest.iata]?.city ?? topDest.iata,
        code:  topDest.iata,
        flag:  flagEmoji(IATA_META[topDest.iata]?.cc ?? 'XX'),
        count: topDest.visits,
      }
    : null;

  const topRoute = topDest
    ? { from: 'KUL', to: topDest.iata, count: topDest.visits }
    : null;

  // Map coords: KUL + all earned destinations that have coords
  const mapCoords: Stats['mapCoords'] = [
    { code: 'KUL', coords: IATA_COORDS['KUL'] },
    ...nonHome.flatMap((d) => {
      const coords = IATA_COORDS[d.iata];
      return coords ? [{ code: d.iata, coords }] : [];
    }),
  ];

  return {
    totalKm, prevKm, totalSectors, uniqueDestinations,
    blockHours, rosterCount: current.length,
    standbyDays, offDays,
    periodLabel, rangeLabel,
    longestRoute, mostVisited, topRoute, mapCoords,
  };
}

function deltaPercent(cur: number, prv: number): number | null {
  if (!prv) return null;
  return Math.round(((cur - prv) / prv) * 100);
}

const fmtKm  = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const fmtNum = (n: number) => n.toLocaleString();

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface RosterSummaryCardProps {
  earnedDestinations: EarnedDestination[];
  onGenerateCard?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function RosterSummaryCard({ earnedDestinations, onGenerateCard }: RosterSummaryCardProps) {
  const { rosters } = useRoster();
  const [period, setPeriod] = useState<Period>('month');

  const stats = useMemo(
    () => buildStats(period, rosters, earnedDestinations),
    [period, rosters, earnedDestinations],
  );

  const delta    = deltaPercent(stats.totalKm, stats.prevKm);
  const positive = (delta ?? 0) >= 0;

  if (!rosters.length) return null;

  return (
    <div className="bg-bg border border-border rounded-[var(--radius-xl)] overflow-hidden"
         style={{ boxShadow: 'var(--shadow-md)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-border">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
          {`// Roster Summary`}
        </p>
        <div className="flex items-center gap-0.5 bg-surface rounded-full p-1 border border-border">
          {PERIOD_TABS.map((tab) => {
            const active = tab.id === period;
            return (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
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
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border">

        {/* ── Left: stats panel ────────────────────────────────────────────── */}
        <div className="p-6 flex flex-col gap-5">

          {/* Period pill */}
          <span
            className="self-start rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {stats.periodLabel}
          </span>

          {/* Hero: hours featured + 4 small stats (same 2×2+4 grid as card) */}
          <div className="grid grid-cols-4 grid-rows-2 gap-2">
            {/* Hours — 2×2 featured */}
            <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-[var(--radius-lg)] border border-border px-4 py-4"
                 style={{ background: 'var(--surface)' }}>
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                     style={{ color: 'var(--accent)' }}>
                  <Ico d={ICON.clock} size={13} />
                  <span>Block hours</span>
                </div>
                <p className="mt-2 flex items-baseline gap-1 text-[44px] font-black leading-none tracking-tighter text-text font-mono">
                  {fmtNum(stats.blockHours)}
                  <span className="text-[13px] font-bold text-text-muted">h</span>
                </p>
                <p className="mt-1 text-[11px] font-bold text-text-muted">{stats.rangeLabel}</p>
              </div>
              {/* Delta badge */}
              {delta !== null && (
                <span
                  className="self-start inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold mt-3"
                  style={{
                    background: positive ? 'var(--success-soft)' : 'var(--danger-soft)',
                    color:      positive ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {positive
                    ? <TrendingUp  size={12} strokeWidth={2.5} />
                    : <TrendingDown size={12} strokeWidth={2.5} />}
                  {positive ? '+' : ''}{delta}% vs prev
                </span>
              )}
            </div>

            {/* 4 small stats */}
            <SmallStat icon={ICON.plane}   value={fmtNum(stats.totalSectors)}       label="Flights"   />
            <SmallStat icon={ICON.globe}   value={fmtNum(stats.uniqueDestinations)} label="Countries" />
            <SmallStat icon={ICON.standby} value={`${stats.standbyDays}d`}          label="Standby"   />
            <SmallStat icon={ICON.beach}   value={`${stats.offDays}d`}              label="Off days"  />
          </div>

          {/* km in the sky sub-line */}
          <p className="text-[13px] font-bold text-text-muted -mt-2">
            <span className="text-text font-black font-mono">{fmtKm(stats.totalKm)}k</span> km in the sky
          </p>

          {/* Highlights: longest + most visited — same card style */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-lg)] p-3" style={{ background: 'var(--danger-soft)' }}>
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
                   style={{ color: 'var(--accent)' }}>
                <Ico d={ICON.route} size={10} />Longest
              </div>
              {stats.longestRoute ? (
                <>
                  <p className="mt-1.5 text-[14px] font-black leading-tight text-text">
                    {stats.longestRoute.from} → {stats.longestRoute.to}
                  </p>
                  <p className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
                    {stats.longestRoute.km.toLocaleString()} km
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[11px] text-text-muted">—</p>
              )}
            </div>
            <div className="rounded-[var(--radius-lg)] p-3" style={{ background: 'var(--success-soft)' }}>
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
                   style={{ color: 'var(--success)' }}>
                <Ico d={ICON.pin} size={10} />Most visited
              </div>
              {stats.mostVisited ? (
                <>
                  <p className="mt-1.5 text-[14px] font-black leading-tight text-text">
                    {stats.mostVisited.flag} {stats.mostVisited.city}
                  </p>
                  <p className="text-[11px] font-bold" style={{ color: 'var(--success)' }}>
                    {stats.mostVisited.count} visit{stats.mostVisited.count !== 1 ? 's' : ''} · {stats.mostVisited.code}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[11px] text-text-muted">—</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: react-simple-maps + destinations ───────────────────────── */}
        <div className="flex flex-col">

          {/* Map */}
          <div className="flex-1 overflow-hidden border-b border-border" style={{ minHeight: 300 }}>
            <SummaryMapLeaflet mapCoords={stats.mapCoords} topRoute={stats.topRoute} />
          </div>

          {/* Top destinations */}
          {earnedDestinations.length > 0 && (
            <div className="p-4 border-t border-border">
              <TopDestinations destinations={earnedToTopDest(earnedDestinations)} />
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      {onGenerateCard && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
            {`// Mission Recap`}
          </p>
          <button
            onClick={onGenerateCard}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-[12px] font-bold text-text hover:bg-surface hover:border-accent hover:text-accent transition-all"
          >
            Generate card
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Small stat box — matches LiveRosterCard SmallStat exactly ─────────────────

function SmallStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-start rounded-[var(--radius-lg)] border border-border px-2.5 py-2.5"
         style={{ background: 'var(--surface)' }}>
      <span style={{ color: 'var(--accent)' }}><Ico d={icon} size={13} /></span>
      <p className="mt-1 text-[18px] font-black leading-none tracking-tight text-text font-mono">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold text-text-muted">{label}</p>
    </div>
  );
}

// ── react-simple-maps world map with zoom/pan ─────────────────────────────────

