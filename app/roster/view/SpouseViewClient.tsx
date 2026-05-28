'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, PlaneTakeoff, PlaneLanding,
  Check, ChevronDown,
  AlertCircle, Loader2, X,
} from 'lucide-react';
import { getAirportMeta } from '@/lib/utils/destinations';
import type { DutyEvent } from '@/lib/types';

// ─── API types ────────────────────────────────────────────────────────────────

interface SharedRoster {
  month: string;
  year: string;
  events: DutyEvent[];
  airline?: string;
  uploadedAt: string;
}

interface PilotInfo {
  full_name: string;
  rank: string | null;
  airline: string | null;
  avatar_url: string | null;
  base: string;
}

// ─── Internal types ───────────────────────────────────────────────────────────

type DayType = 'flight' | 'standby' | 'off' | 'training' | 'rest';

interface Sector {
  id: string;
  flightNo: string;
  dep: string;
  arr: string;
  depTime: string;
  arrTime: string;
  aircraft: string;
}

interface RosterDay {
  date: number;
  dateStr: string;
  type: DayType;
  base: string;
  dutyStart?: string;
  dutyEnd?: string;
  crewStatus?: string;
  dutyCode?: string;
  sectors: Sector[];
  sectorCount: number;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

/** Calendar cell colours — one step darker than before (-100 not -50) */
const DUTY_CFG: Record<DayType, {
  bg: string; text: string; dot: string; pill: string; border: string;
}> = {
  flight:   { bg: 'bg-sky-100',   text: 'text-sky-700',   dot: 'bg-sky-500',   pill: 'bg-sky-100 text-sky-700',    border: 'border-sky-200' },
  standby:  { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', pill: 'bg-amber-100 text-amber-800', border: 'border-amber-200' },
  off:      { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', pill: 'bg-green-100 text-green-700', border: 'border-green-200' },
  training: { bg: 'bg-teal-100',  text: 'text-teal-700',  dot: 'bg-teal-500',  pill: 'bg-teal-100 text-teal-700',  border: 'border-teal-200' },
  rest:     { bg: '',             text: 'text-text-subtle', dot: '',            pill: 'bg-surface-2 text-text-subtle', border: 'border-border' },
};

/** Boarding-pass strip gradients */
const STRIP_GRADIENT: Record<DayType, string> = {
  flight:   'from-[#23a8df] via-[#0788c7] to-[#006fb5]',
  standby:  'from-[#f59e0b] via-[#d97706] to-[#b45309]',
  off:      'from-[#34d399] via-[#10b981] to-[#059669]',
  training: 'from-[#2dd4bf] via-[#14b8a6] to-[#0d9488]',
  rest:     'from-[#94a3b8] via-[#64748b] to-[#475569]',
};

/** Strip centre label for non-flight types */
const STRIP_LABEL: Record<DayType, string> = {
  flight:   '',
  standby:  'SBY',
  off:      'OFF',
  training: 'TRG',
  rest:     'REST',
};

/** Bottom-row status colours */
const STATUS_COLOR: Record<DayType, string> = {
  flight:   'text-[#0788c7]',
  standby:  'text-[#cf2434]',
  off:      'text-[#059669]',
  training: 'text-[#0d9488]',
  rest:     'text-[#94a3b8]',
};

/** Bottom-row status label */
const STATUS_LABEL: Record<DayType, string> = {
  flight:   'OPERATING',
  standby:  'STAND BY',
  off:      'DAY OFF',
  training: 'TRAINING',
  rest:     'REST',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cityName(iata?: string | null) {
  if (!iata) return '';
  return getAirportMeta(iata).city || iata;
}

function isOvernight(f: DutyEvent) {
  return !!(f.std && f.sta && f.sta < f.std);
}

/**
 * Parse a roster month/year pair into a Luxon DateTime.
 * Handles every format the MAS-AIMS parser emits:
 *   "MAY" / "APR"  — 3-letter uppercase (most common)
 *   "May" / "April" — already-cased or full month name
 */
function parseRosterMonth(month: string, year: string): DateTime {
  // Normalise to title-case so Luxon locale matching is unambiguous
  const m = month.trim();
  const cap = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
  // Try abbreviated first (MMM = Jan/Feb/Mar … Dec) — handles APR→Apr, MAY→May
  const short = DateTime.fromFormat(`${cap} ${year}`, 'MMM yyyy');
  if (short.isValid) return short;
  // Fallback for full names already stored correctly (January, February …)
  return DateTime.fromFormat(`${cap} ${year}`, 'MMMM yyyy');
}

function sortRostersChronologically(rosters: SharedRoster[]): SharedRoster[] {
  return [...rosters].sort((a, b) =>
    parseRosterMonth(a.month, a.year).toMillis() -
    parseRosterMonth(b.month, b.year).toMillis()
  );
}

// ─── Build RosterDay ──────────────────────────────────────────────────────────

function buildDay(dateStr: string, events: DutyEvent[], base: string): RosterDay {
  const dt       = DateTime.fromISO(dateStr);
  const flights  = events.filter(e => e.type === 'FLIGHT');
  const standby  = events.find(e => e.type === 'STANDBY');
  const layover  = events.find(e => e.type === 'LAYOVER');
  const off      = events.find(e => e.type === 'OFF');
  const training = events.find(e => e.type === 'TRAINING' || e.type === 'GROUND');

  if (flights.length > 0) {
    const first    = flights[0];
    const last     = flights[flights.length - 1];
    const overnight = isOvernight(last);
    const sectors: Sector[] = flights.map((f, i) => ({
      id:       f.id || `${dateStr}-${i}`,
      flightNo: f.item || f.flightNumber || '—',
      dep:      f.depPort || '—',
      arr:      f.arrPort || '—',
      depTime:  f.std     || f.signOn  || '—',
      arrTime:  `${f.sta  || f.signOff || '—'}${isOvernight(f) ? '+' : ''}`,
      aircraft: f.acType  || '—',
    }));
    return {
      date: dt.day, dateStr, type: 'flight', base,
      dutyStart:  first.std    || first.signOn,
      dutyEnd:    `${last.sta  || last.signOff || ''}${overnight ? '+' : ''}`,
      crewStatus: first.dutyCode === 'DH' ? 'DEADHEAD' : 'OPERATING',
      dutyCode:   first.dutyCode || '',
      sectors, sectorCount: flights.length,
    };
  }

  if (standby || layover) {
    const ev = standby || layover!;
    return {
      date: dt.day, dateStr, type: 'standby', base,
      dutyStart:  ev.signOn,
      dutyEnd:    ev.signOff,
      crewStatus: standby
        ? (ev.item?.startsWith('S4') ? 'AIRPORT SBY' : 'HOME SBY')
        : 'LAYOVER',
      dutyCode:   ev.item || ev.dutyCode || '',
      sectors: [], sectorCount: 0,
    };
  }

  if (training) {
    return {
      date: dt.day, dateStr, type: 'training', base,
      dutyStart:  training.signOn,
      dutyEnd:    training.signOff,
      crewStatus: training.description || 'GROUND DUTY',
      dutyCode:   training.dutyCode || training.item || '',
      sectors: [], sectorCount: 0,
    };
  }

  if (off) {
    return {
      date: dt.day, dateStr, type: 'off', base,
      crewStatus: 'DAY OFF',
      dutyCode:   off.item || off.dutyCode || 'DO',
      sectors: [], sectorCount: 0,
    };
  }

  return {
    date: dt.day, dateStr, type: 'rest', base,
    crewStatus: 'REST', dutyCode: '',
    sectors: [], sectorCount: 0,
  };
}

function buildRosterDays(roster: SharedRoster, base: string): RosterDay[] {
  const start = parseRosterMonth(roster.month, roster.year);
  if (!start.isValid) return [];
  const em = new Map<string, DutyEvent[]>();
  for (const e of roster.events ?? []) {
    const list = em.get(e.date) ?? [];
    list.push(e);
    em.set(e.date, list);
  }
  return Array.from({ length: start.daysInMonth ?? 30 }, (_, i) => {
    const d       = i + 1;
    const dateStr = start.set({ day: d }).toFormat('yyyy-MM-dd');
    return buildDay(dateStr, em.get(dateStr) ?? [], base);
  });
}

function buildCalendarMatrix(roster: SharedRoster): (number | null)[][] {
  const start = parseRosterMonth(roster.month, roster.year);
  if (!start.isValid) return [];
  const offset = start.weekday === 7 ? 6 : start.weekday - 1;
  const flat: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= (start.daysInMonth ?? 30); d++) flat.push(d);
  while (flat.length % 7 !== 0) flat.push(null);
  const out: (number | null)[][] = [];
  for (let i = 0; i < flat.length; i += 7) out.push(flat.slice(i, i + 7));
  return out;
}

// ─── DOW ──────────────────────────────────────────────────────────────────────

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── DayCell ─────────────────────────────────────────────────────────────────

function DayCell({
  day, rday, isToday, isActive, onHover, onClick,
}: {
  day: number | null;
  rday: RosterDay | null;
  isToday: boolean;
  isActive: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  if (!day) return <div />;

  const type    = rday?.type ?? 'rest';
  const cfg     = DUTY_CFG[type];
  const hasDuty = type !== 'rest';

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      className={[
        'relative flex flex-col items-center justify-center',
        'rounded-2xl aspect-square cursor-pointer select-none',
        'transition-all duration-100 hover:brightness-95',
        cfg.bg,
      ].join(' ')}
    >
      <span className={[
        'text-[13px] font-bold leading-none',
        hasDuty ? cfg.text : isToday ? 'text-accent font-extrabold' : 'text-text-subtle',
      ].join(' ')}>
        {day}
      </span>

      {hasDuty && (
        rday!.sectorCount > 1
          ? <span className={`mt-0.5 text-[7px] font-extrabold opacity-70 ${cfg.text}`}>{rday!.sectorCount}×</span>
          : <div className={`mt-1 h-1 w-1 rounded-full opacity-70 ${cfg.dot}`} />
      )}

      {isActive && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-accent" />
      )}
      {isToday && !isActive && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-accent/40" />
      )}
    </div>
  );
}

// ─── DutyCard — aviation boarding-pass style ─────────────────────────────────

function DutyCard({ rday }: { rday: RosterDay | null }) {

  /* ── Placeholder (nothing hovered / selected yet) ── */
  if (!rday) {
    return (
      <div className="overflow-hidden rounded-[18px] border border-[#d7dfe4] bg-gradient-to-b from-white via-[#f7fcff] to-[#d9eff8] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
        <div className="flex h-[96px] items-center justify-center rounded-[12px] bg-[#f1f5f9]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Hover a date to see details
          </p>
        </div>
      </div>
    );
  }

  const strip    = STRIP_GRADIENT[rday.type];
  const legs     = rday.sectors.slice(0, 3);
  const first    = rday.sectors[0];
  const last     = rday.sectors[rday.sectors.length - 1];
  const dateNum  = String(rday.date).padStart(2, '0');
  const isFlight = rday.type === 'flight';

  /* bottom-right location: last flight arr for flights, base otherwise */
  const locationCode = isFlight && last ? last.arr : rday.base;

  /* bottom-left label: crewStatus for flight, type label for others */
  const statusText = isFlight
    ? (rday.crewStatus ?? 'OPERATING')
    : STATUS_LABEL[rday.type];

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#d7dfe4] bg-gradient-to-b from-white via-[#f7fcff] to-[#d9eff8] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.10)]">

      {/* ── Coloured strip ── */}
      <div className={`relative h-[98px] rounded-[12px] bg-gradient-to-b ${strip} shadow-[0_4px_10px_rgba(0,0,0,0.22)]`}>

        {/* Date box */}
        <div className="absolute left-2 top-1/2 flex h-[66px] w-[70px] -translate-y-1/2 items-center justify-center rounded-[8px] border-[3px] border-[#3d3d3d] bg-white text-[38px] font-bold leading-none tracking-[0.02em] text-black shadow-[inset_0_0_0_1px_#d7d7d7]">
          {dateNum}
        </div>

        {/* Centre: plane icons for flight legs, or duty label */}
        {isFlight && legs.length > 0 ? (
          <div className="absolute left-[92px] right-[48px] top-1/2 flex -translate-y-1/2 items-center justify-center">
            {legs.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex h-11 w-10 items-center justify-center text-white">
                  <span className="text-[29px] leading-none">✈</span>
                </div>
                {i < legs.length - 1 && (
                  <div className="mx-1 h-12 border-l-2 border-dotted border-white/70" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="absolute left-[92px] right-[48px] top-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="text-[13px] font-bold uppercase tracking-[0.22em] text-white/85">
              {STRIP_LABEL[rday.type]}
            </span>
          </div>
        )}

        {/* Right chevron */}
        <div className="absolute right-4 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[14px] border-l-[14px] border-y-transparent border-l-white" />
      </div>

      {/* ══════════════════════════════════════════════════════ FLIGHT layout */}
      {isFlight && first && (
        <>
          {/* Route row */}
          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[#d7dfe4] pb-6">
            <span className="text-left text-[34px] font-normal leading-none tracking-[0.02em] text-black sm:text-[40px]">
              {first.dep}
            </span>
            <span className="text-center text-[26px] font-bold leading-none tracking-[0.05em] text-[#517630] sm:text-[30px]">
              {first.flightNo}
            </span>
            <span className="text-right text-[34px] font-normal leading-none tracking-[0.02em] text-black sm:text-[40px]">
              {last?.arr ?? first.arr}
            </span>
          </div>

          {/* Time row — large, emphasised */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 border-b border-[#d7dfe4] py-6">
            <div className="space-y-1.5 text-left">
              <div className="text-[34px] font-semibold leading-none tracking-[0.02em] text-black sm:text-[40px]">
                {rday.dutyStart || first.depTime || '—'}
              </div>
              <div className="text-[16px] font-normal leading-none tracking-[0.08em] text-text-muted">
                {rday.crewStatus === 'DEADHEAD' ? 'DH' : 'OP'}
              </div>
            </div>
            <div className="pt-1 text-center text-[32px] font-bold leading-none tracking-[0.22em] text-black sm:text-[38px]">
              ...
            </div>
            <div className="text-right text-[34px] font-semibold leading-none tracking-[0.02em] text-black sm:text-[40px]">
              {rday.dutyEnd || last?.arrTime || '—'}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════ NON-FLIGHT layout */}
      {!isFlight && (
        <>
          {/* Duty type + specific code */}
          <div className="mt-7 border-b border-[#d7dfe4] pb-6">
            <div className={`text-[30px] font-normal leading-none tracking-[0.03em] sm:text-[36px] ${STATUS_COLOR[rday.type]}`}>
              {rday.crewStatus || STATUS_LABEL[rday.type]}
            </div>
            {rday.dutyCode && (
              <div className="mt-2 text-[17px] font-normal tracking-[0.06em] text-text-muted">
                {rday.dutyCode}
              </div>
            )}
          </div>

          {/* Time row — only when times are known */}
          {(rday.dutyStart || rday.dutyEnd) && (
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 border-b border-[#d7dfe4] py-6">
              <div className="text-left text-[34px] font-semibold leading-none tracking-[0.02em] text-black sm:text-[40px]">
                {rday.dutyStart || '—'}
              </div>
              <div className="pt-1 text-center text-[32px] font-bold leading-none tracking-[0.22em] text-black">
                ...
              </div>
              <div className="text-right text-[34px] font-semibold leading-none tracking-[0.02em] text-black sm:text-[40px]">
                {rday.dutyEnd || '—'}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Status row (all types) ── */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 pt-6">
        <span className={`text-[26px] font-normal leading-none tracking-[0.04em] sm:text-[30px] ${STATUS_COLOR[rday.type]}`}>
          {statusText}
        </span>
        <span className="text-[30px] font-normal leading-none tracking-[0.03em] text-black sm:text-[36px]">
          {locationCode}
        </span>
      </div>
    </div>
  );
}

// ─── Sector detail modal ──────────────────────────────────────────────────────

function SectorModal({ rday, monthYear, onClose }: {
  rday: RosterDay; monthYear: string; onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-sky-400" />
        <div className="p-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-surface text-text-muted hover:bg-surface-2"
          >
            <X size={14} />
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-text-subtle">
            {monthYear} · Day {rday.date}
          </p>
          <p className="mt-0.5 text-lg font-extrabold text-text">Flight Duty</p>
          {rday.dutyStart && (
            <p className="mt-1 font-mono text-[12px] text-text-muted">
              Report {rday.dutyStart}
            </p>
          )}
          <div className="mt-4 space-y-3">
            {rday.sectors.map(s => (
              <div key={s.id} className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-bold text-sky-700">{s.flightNo}</span>
                  {s.aircraft !== '—' && (
                    <span className="text-[11px] text-text-subtle">{s.aircraft}</span>
                  )}
                </div>
                <div className="mt-3 flex items-center">
                  <div className="flex-1">
                    <p className="text-[26px] font-black leading-none text-text">{s.dep}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
                      <PlaneTakeoff size={10} className="text-sky-500" /> {s.depTime}
                    </p>
                    <p className="text-[10px] text-text-subtle">{cityName(s.dep)}</p>
                  </div>
                  <div className="flex flex-1 items-center justify-center gap-1 px-2">
                    <span className="h-px flex-1 bg-sky-200" />
                    <Plane size={12} className="rotate-45 text-sky-400" />
                    <span className="h-px flex-1 bg-sky-200" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[26px] font-black leading-none text-text">{s.arr}</p>
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-text-muted">
                      <PlaneLanding size={10} className="text-sky-500" /> {s.arrTime}
                    </p>
                    <p className="text-[10px] text-text-subtle">{cityName(s.arr)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-text-subtle">{label}</p>
      <p className="mt-1.5 text-2xl font-black text-text">{value}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [apiData, setApiData]         = useState<{ pilot: PilotInfo; rosters: SharedRoster[] } | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [now, setNow]                 = useState(() => DateTime.now());
  const [rosterIdx, setRosterIdx]     = useState(0);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [activeDate, setActiveDate]   = useState<string | null>(null); // tap/click (persists)
  const [modalDay, setModalDay]       = useState<RosterDay | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(DateTime.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); setError('no-token'); return; }
    fetch(`/api/roster/share?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load');
        const rosters = sortRostersChronologically(json.rosters ?? []);
        // Match by numeric month+year — immune to "APR" vs "April" casing
        const idx = rosters.findIndex(r => {
          const dt = parseRosterMonth(r.month, r.year);
          return dt.isValid && dt.month === now.month && dt.year === now.year;
        });
        setRosterIdx(idx >= 0 ? idx : rosters.length - 1);
        setApiData({ ...json, rosters });
      })
      .catch(err => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const rosters  = apiData?.rosters ?? [];
  const roster   = rosters[rosterIdx];
  const pilot    = apiData?.pilot;
  const todayStr = now.toFormat('yyyy-MM-dd');

  const rosterDays = useMemo(
    () => roster ? buildRosterDays(roster, pilot?.base ?? 'KUL') : [],
    [roster, pilot?.base],
  );

  const dayMap = useMemo(
    () => new Map(rosterDays.map(d => [d.date, d])),
    [rosterDays],
  );

  const weeks = useMemo(() => roster ? buildCalendarMatrix(roster) : [], [roster]);

  /**
   * Which day to show in the DutyCard:
   *   1. Currently hovered cell (live hover)
   *   2. Last tapped cell (mobile / click)
   *   3. Today if in current month
   *   4. First flight day of the month
   *   5. First non-rest day
   *   6. null → placeholder
   */
  const displayDay = useMemo((): RosterDay | null => {
    const rosterStart = roster ? parseRosterMonth(roster.month, roster.year) : null;

    const resolveDate = (dateStr: string | null): RosterDay | null => {
      if (!dateStr || !rosterStart?.isValid) return null;
      const dt = DateTime.fromISO(dateStr);
      if (dt.month !== rosterStart.month || dt.year !== rosterStart.year) return null;
      return dayMap.get(dt.day) ?? null;
    };

    return (
      resolveDate(hoveredDate) ??
      resolveDate(activeDate) ??
      (() => {
        if (!rosterStart?.isValid) return null;
        const todayDt = DateTime.fromISO(todayStr);
        if (todayDt.month === rosterStart.month && todayDt.year === rosterStart.year) {
          const t = dayMap.get(todayDt.day);
          if (t) return t;
        }
        return (
          rosterDays.find(d => d.type === 'flight') ??
          rosterDays.find(d => d.type !== 'rest') ??
          null
        );
      })()
    );
  }, [hoveredDate, activeDate, roster, dayMap, todayStr, rosterDays]);

  const stats = useMemo(() => ({
    flights: rosterDays.filter(d => d.type === 'flight').length,
    standby: rosterDays.filter(d => d.type === 'standby').length,
    sectors: rosterDays.reduce((n, d) => n + d.sectorCount, 0),
    off:     rosterDays.filter(d => d.type === 'off').length,
  }), [rosterDays]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface">
        <Loader2 size={26} className="animate-spin text-accent" />
        <p className="text-[12px] font-semibold uppercase tracking-[.25em] text-text-muted">Loading roster…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !apiData || !roster || !pilot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft">
          <AlertCircle size={30} className="text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">
            {error === 'no-token' ? 'Missing share link' : 'Link not found'}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-text-muted">
            {error === 'no-token'
              ? 'This page needs a share link from the pilot.'
              : 'This link may have expired or been reset. Ask the pilot to share a new one.'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full border border-border bg-white px-6 py-2.5 text-[13px] font-semibold text-text-muted shadow-sm hover:border-border-hover hover:text-text"
        >
          Try again
        </button>
      </div>
    );
  }

  const rosterDt  = parseRosterMonth(roster.month, roster.year);
  const monthYear = rosterDt.isValid ? rosterDt.toFormat('MMMM yyyy') : `${roster.month} ${roster.year}`;
  const monthAbbr = rosterDt.isValid ? rosterDt.toFormat('MMM yyyy').toUpperCase() : `${roster.month} ${roster.year}`;
  const initials  = pilot.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-surface px-4 py-6 sm:px-6 md:py-8">
      <div className="mx-auto w-full max-w-lg space-y-3">

        {/* ── Chrome bar ── */}
        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-surface-2 px-5 py-3">
          {/* Month dropdown */}
          <div className="relative flex items-center">
            <select
              value={rosterIdx}
              onChange={e => {
                setRosterIdx(Number(e.target.value));
                setHoveredDate(null);
                setActiveDate(null);
              }}
              className="appearance-none bg-transparent pr-6 font-mono text-[13px] font-extrabold uppercase tracking-[.2em] text-text outline-none cursor-pointer"
            >
              {rosters.map((r, i) => (
                <option key={i} value={i} className="font-mono font-bold normal-case tracking-normal">
                  {r.month.slice(0, 3).toUpperCase()} {r.year}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-0 text-text-muted" />
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[11px] font-extrabold text-success">
            <Check size={11} strokeWidth={3} /> Synced
          </span>
        </div>

        {/* ── Pilot info ── */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent text-[22px] font-extrabold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[22px] font-extrabold leading-tight text-text">
              {pilot.full_name}
            </p>
            {(pilot.rank || pilot.airline) && (
              <p className="mt-1 truncate text-[15px] font-medium leading-snug text-text-muted">
                {[pilot.rank, pilot.airline].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* ── Duty card (above calendar) — re-mounts on day change for fade-in ── */}
        <motion.div
          key={displayDay?.dateStr ?? 'empty'}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
        >
          <DutyCard rday={displayDay ?? null} />
        </motion.div>

        {/* View full details button — only for flight days */}
        {displayDay?.type === 'flight' && displayDay.sectors.length > 0 && (
          <button
            onClick={() => setModalDay(displayDay)}
            className="w-full rounded-2xl border border-sky-200 bg-sky-50 py-2.5 text-[12px] font-bold text-sky-600 transition-colors hover:bg-sky-100"
          >
            View full flight details
          </button>
        )}

        {/* ── Calendar grid ── */}
        <div className="rounded-2xl border border-border bg-white p-4">
          {/* DOW headers */}
          <div className="mb-1 grid grid-cols-7">
            {DOW.map(d => (
              <div key={d} className="py-2 text-center font-mono text-[9px] font-bold uppercase tracking-wide text-text-subtle/50">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells — onMouseLeave on grid clears hover */}
          <div
            className="grid grid-cols-7 gap-1"
            onMouseLeave={() => setHoveredDate(null)}
          >
            {weeks.map((week, wi) =>
              week.map((d, di) => {
                if (!d) return <div key={`pad-${wi}-${di}`} />;
                const dateStr = parseRosterMonth(roster.month, roster.year)
                  .set({ day: d }).toFormat('yyyy-MM-dd');
                const rday    = dayMap.get(d) ?? null;
                return (
                  <DayCell
                    key={dateStr}
                    day={d}
                    rday={rday}
                    isToday={dateStr === todayStr}
                    isActive={hoveredDate === dateStr || activeDate === dateStr}
                    onHover={() => setHoveredDate(dateStr)}
                    onClick={() => setActiveDate(prev => prev === dateStr ? null : dateStr)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="Flight days" value={stats.flights} />
          <StatCard label="Sectors"     value={stats.sectors} />
          <StatCard label="Standby"     value={stats.standby} />
          <StatCard label="Days off"    value={stats.off} />
        </div>

        {/* ── Legend ── */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold sm:grid-cols-4">
          {([
            ['bg-sky-500',   'text-sky-700',   'bg-sky-100',   'Flight'],
            ['bg-amber-500', 'text-amber-800', 'bg-amber-100', 'Standby'],
            ['bg-green-500', 'text-green-700', 'bg-green-100', 'Day off'],
            ['bg-teal-500',  'text-teal-700',  'bg-teal-100',  'Training'],
          ] as const).map(([dot, text, bg, label]) => (
            <div key={label} className={`flex items-center gap-2 rounded-xl ${bg} px-3 py-2.5`}>
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <span className={text}>{label}</span>
            </div>
          ))}
        </div>

        <p className="pb-2 text-center text-[11px] text-text-subtle">
          Otarosta · Shared roster · Live read-only view
        </p>
      </div>

      {/* ── Flight detail modal ── */}
      <AnimatePresence>
        {modalDay && (
          <SectorModal
            rday={modalDay}
            monthYear={monthYear}
            onClose={() => setModalDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
