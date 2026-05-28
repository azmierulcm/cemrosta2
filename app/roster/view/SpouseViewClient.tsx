'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Check, ChevronRight, ChevronLeft,
  Clock3, MapPin, CalendarDays, BadgeCheck,
  Moon, Sun, AlertCircle, Loader2,
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

// ─── Internal card types ──────────────────────────────────────────────────────

type DayType = 'flight' | 'standby' | 'off' | 'training' | 'rest';

interface Sector {
  id: string;
  flightNo: string;
  dep: string;
  arr: string;
  depTime: string;
  arrTime: string;
  aircraft: string;
  workType: string;
}

interface RosterDay {
  date: number;
  dateStr: string;
  type: DayType;
  label: string;
  base: string;
  dutyStart?: string;
  dutyEnd?: string;
  crewStatus?: string;
  continuesNextDay: boolean;
  sectors: Sector[];
}

// ─── Colour system (vivid, not the pale bg-*-50 from the original design) ─────

// Un-selected duty cell — vivid but not blinding
const CELL_IDLE: Record<DayType, string> = {
  flight:   'bg-sky-300   text-sky-900   ring-1 ring-sky-400   hover:bg-sky-400',
  standby:  'bg-amber-300 text-amber-900 ring-1 ring-amber-400 hover:bg-amber-400',
  off:      'bg-emerald-300 text-emerald-900 ring-1 ring-emerald-400 hover:bg-emerald-400',
  training: 'bg-fuchsia-300 text-fuchsia-900 ring-1 ring-fuchsia-400 hover:bg-fuchsia-400',
  rest:     'bg-zinc-200   text-zinc-500   ring-1 ring-zinc-300   hover:bg-zinc-300',
};

// Active / selected cell — solid saturated colour
const CELL_ACTIVE: Record<DayType, string> = {
  flight:   'bg-sky-600   text-white ring-2 ring-sky-700   shadow-lg shadow-sky-300/50',
  standby:  'bg-amber-500 text-white ring-2 ring-amber-600 shadow-lg shadow-amber-300/50',
  off:      'bg-emerald-600 text-white ring-2 ring-emerald-700 shadow-lg shadow-emerald-300/50',
  training: 'bg-fuchsia-600 text-white ring-2 ring-fuchsia-700 shadow-lg shadow-fuchsia-300/50',
  rest:     'bg-zinc-400   text-white ring-2 ring-zinc-500',
};

// Dot inside the compact cell
const DOT: Record<DayType, string> = {
  flight:   'bg-sky-600',
  standby:  'bg-amber-600',
  off:      'bg-emerald-700',
  training: 'bg-fuchsia-700',
  rest:     'bg-zinc-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...parts: (string | boolean | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

function cityName(iata?: string | null) {
  if (!iata) return iata ?? '';
  return getAirportMeta(iata).city || iata;
}

function isOvernight(f: DutyEvent) {
  return !!(f.std && f.sta && f.sta < f.std);
}

// ─── Build one RosterDay from the DutyEvent[] for a date ─────────────────────

function buildDay(dateStr: string, events: DutyEvent[], base: string): RosterDay {
  const dt = DateTime.fromISO(dateStr);

  const flights  = events.filter(e => e.type === 'FLIGHT');
  const standby  = events.find(e => e.type === 'STANDBY');
  const layover  = events.find(e => e.type === 'LAYOVER');
  const off      = events.find(e => e.type === 'OFF');
  const training = events.find(e => e.type === 'TRAINING' || e.type === 'GROUND');

  // Flight day
  if (flights.length > 0) {
    const first    = flights[0];
    const last     = flights[flights.length - 1];
    const overnight = isOvernight(last);
    const continues = overnight || !!layover;

    const sectors: Sector[] = flights.map((f, i) => ({
      id:       f.id || `${dateStr}-${i}`,
      flightNo: f.item || f.flightNumber || '—',
      dep:      f.depPort || '—',
      arr:      f.arrPort || '—',
      depTime:  f.std || f.signOn || '—',
      arrTime:  `${f.sta || f.signOff || '—'}${isOvernight(f) ? '+' : ''}`,
      aircraft: f.acType || '—',
      workType: f.dutyCode || 'OP',
    }));

    return {
      date: dt.day, dateStr,
      type: 'flight',
      label: `${flights.length}x`,
      base,
      dutyStart: first.std || first.signOn,
      dutyEnd:   `${last.sta || last.signOff || ''}${overnight ? '+' : ''}`,
      crewStatus: first.dutyCode === 'DH' ? 'Deadheading' : 'Operating',
      continuesNextDay: continues,
      sectors,
    };
  }

  // Standby (includes LAYOVER-only)
  if (standby || layover) {
    const ev = standby || layover!;
    const sector: Sector | null = ev.depPort && ev.arrPort ? {
      id:       `${dateStr}-sby`,
      flightNo: ev.item || '—',
      dep:      ev.depPort,
      arr:      ev.arrPort,
      depTime:  ev.signOn || '—',
      arrTime:  ev.signOff || '—',
      aircraft: '—',
      workType: 'SBY',
    } : null;

    return {
      date: dt.day, dateStr,
      type: 'standby',
      label: ev.item || 'SBY',
      base,
      dutyStart: ev.signOn,
      dutyEnd:   ev.signOff,
      crewStatus: standby ? (ev.item?.startsWith('S4') ? 'Airport standby' : 'Home standby') : 'On layover',
      continuesNextDay: false,
      sectors: sector ? [sector] : [],
    };
  }

  // Training / ground
  if (training) {
    return {
      date: dt.day, dateStr,
      type: 'training',
      label: training.item || 'TRN',
      base,
      dutyStart: training.signOn,
      dutyEnd:   training.signOff,
      crewStatus: training.description || 'Ground duty',
      continuesNextDay: false,
      sectors: [],
    };
  }

  // Off
  if (off) {
    return {
      date: dt.day, dateStr,
      type: 'off',
      label: off.item || 'D',
      base,
      crewStatus: off.item === 'DO' ? 'Day off' : 'Off at base',
      continuesNextDay: false,
      sectors: [],
    };
  }

  // Rest / blank
  return {
    date: dt.day, dateStr,
    type: 'rest',
    label: '—',
    base,
    crewStatus: 'Rest day',
    continuesNextDay: false,
    sectors: [],
  };
}

// Build all 28–31 days for the month
function buildRosterDays(roster: SharedRoster, base: string): RosterDay[] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];

  const eventMap = new Map<string, DutyEvent[]>();
  for (const e of roster.events ?? []) {
    const list = eventMap.get(e.date) ?? [];
    list.push(e);
    eventMap.set(e.date, list);
  }

  const days: RosterDay[] = [];
  for (let d = 1; d <= (start.daysInMonth ?? 30); d++) {
    const dt      = start.set({ day: d });
    const dateStr = dt.toFormat('yyyy-MM-dd');
    days.push(buildDay(dateStr, eventMap.get(dateStr) ?? [], base));
  }
  return days;
}

// Build calendar cells (null = empty pad)
function buildCalendarCells(roster: SharedRoster): (number | null)[] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];
  const offset = start.weekday === 7 ? 6 : start.weekday - 1; // Mon-first
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= (start.daysInMonth ?? 30); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur">
      <div className="mb-1 flex items-center gap-1.5 text-white/45">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="truncate text-xs font-black text-white">{value}</p>
    </div>
  );
}

function AirportBlock({ code, time, align }: { code: string; time: string; align: 'left' | 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <p className="text-2xl font-black tracking-tight text-slate-950 leading-none">{code}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{cityName(code)}</p>
      <p className="mt-1 text-[13px] font-black text-slate-600">{time}</p>
    </div>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-zinc-100">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">{label}</p>
      <p className="mt-1 text-lg font-black text-zinc-800">{value}</p>
    </div>
  );
}

function RosterDetailCard({
  day,
  monthYear,
  todayStr,
}: {
  day: RosterDay;
  monthYear: string;
  todayStr: string;
}) {
  const isToday    = day.dateStr === todayStr;
  const sectorCount = day.sectors.length;

  return (
    <motion.aside
      key={day.dateStr}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.04]"
    >
      {/* Dark gradient header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'grid h-14 w-14 place-items-center rounded-2xl shadow-lg',
              isToday ? 'bg-accent' : 'bg-white',
            )}>
              <span className={cn('text-2xl font-black tracking-tight', isToday ? 'text-white' : 'text-slate-950')}>
                {day.date}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">{monthYear}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{day.label}</h2>
              {isToday && (
                <span className="mt-1 inline-block rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-black text-white">
                  Today
                </span>
              )}
            </div>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/80 ring-1 ring-white/10 shrink-0">
            {sectorCount > 0 ? `${sectorCount} leg${sectorCount > 1 ? 's' : ''}` : 'No sector'}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <InfoPill icon={<MapPin className="h-3.5 w-3.5" />} label="Base" value={day.base} />
          <InfoPill
            icon={<Clock3 className="h-3.5 w-3.5" />}
            label="Duty"
            value={day.dutyStart && day.dutyEnd ? `${day.dutyStart} – ${day.dutyEnd}` : '—'}
          />
          <InfoPill
            icon={day.continuesNextDay ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            label="Return"
            value={day.continuesNextDay ? 'Next day' : 'Same day'}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Crew status</p>
            <p className="mt-1 text-lg font-black text-slate-900">{day.crewStatus ?? 'Operating'}</p>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">
            <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />Synced
          </div>
        </div>

        {sectorCount > 0 ? (
          <div className="space-y-3">
            {day.sectors.map((s, i) => (
              <div key={s.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[11px] font-black text-slate-500 shadow-sm ring-1 ring-slate-100">
                      {i + 1}
                    </span>
                    <span className="text-[14px] font-black text-emerald-700">{s.flightNo}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-400 ring-1 ring-slate-100">
                      {s.workType}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">{s.aircraft !== '—' ? s.aircraft : ''}</span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <AirportBlock code={s.dep} time={s.depTime} align="left" />
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="h-px w-4 bg-slate-200" />
                    <Plane className="h-4 w-4 text-sky-500" />
                    <span className="h-px w-4 bg-slate-200" />
                  </div>
                  <AirportBlock code={s.arr} time={s.arrTime} align="right" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
            <p className="text-[13px] font-bold text-slate-600">
              {day.type === 'off'      ? `Day off at ${day.base}` :
               day.type === 'training' ? `Ground / training duty at ${day.base}` :
               day.type === 'standby'  ? `Standby at ${day.base}` :
               'No duty scheduled'}
            </p>
            {day.dutyStart && (
              <p className="mt-1 text-[11px] text-slate-400 font-bold">
                {day.dutyStart} – {day.dutyEnd}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}

// ─── Hero / today status label ────────────────────────────────────────────────

function getTodayLabel(rosters: SharedRoster[], now: DateTime, base: string): string {
  const todayStr = now.toFormat('yyyy-MM-dd');
  const nowTime  = now.toFormat('HH:mm');
  const all      = rosters.flatMap(r => r.events ?? []);
  const today    = all.filter(e => e.date === todayStr);

  const flying = today.find(e =>
    e.type === 'FLIGHT' && e.std && e.sta && nowTime >= e.std && nowTime <= e.sta,
  );
  if (flying) return `In the air · ${cityName(flying.depPort)} → ${cityName(flying.arrPort)}`;

  if (today.find(e => e.type === 'LAYOVER')) return 'On layover';

  const sby = today.find(e =>
    e.type === 'STANDBY' && e.signOn && e.signOff && nowTime >= e.signOn! && nowTime <= e.signOff!,
  );
  if (sby) return `On standby until ${sby.signOff}`;

  const next = Array.from(new Set(all.map(e => e.date)))
    .sort()
    .find(d => d > todayStr && ['FLIGHT', 'STANDBY', 'LAYOVER'].includes(
      all.find(e => e.date === d)?.type ?? '',
    ));
  const daysTo = next ? Math.ceil(DateTime.fromISO(next).diff(now, 'days').days) : null;
  return daysTo != null
    ? daysTo <= 1 ? 'At home · Next trip tomorrow' : `At home · Next trip in ${daysTo} days`
    : `At home · ${cityName(base) || base}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [apiData, setApiData]         = useState<{ pilot: PilotInfo; rosters: SharedRoster[] } | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [now, setNow]                 = useState(() => DateTime.now());
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeDate, setActiveDate]   = useState<number | null>(null);

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
        // Auto-select today's month if available
        const rosters: SharedRoster[] = json.rosters ?? [];
        const todayMonth = now.toFormat('MMMM');
        const todayYear  = now.toFormat('yyyy');
        const todayIdx   = rosters.findIndex(r => r.month === todayMonth && r.year === todayYear);
        if (todayIdx >= 0) setSelectedIdx(todayIdx);
        setApiData(json);
      })
      .catch(err => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const roster   = apiData?.rosters[selectedIdx];
  const todayStr = now.toFormat('yyyy-MM-dd');

  const rosterDays = useMemo(
    () => roster ? buildRosterDays(roster, apiData?.pilot.base ?? 'KUL') : [],
    [roster, apiData?.pilot.base],
  );

  const dayMap = useMemo(
    () => new Map(rosterDays.map(d => [d.date, d])),
    [rosterDays],
  );

  const calCells = useMemo(
    () => roster ? buildCalendarCells(roster) : [],
    [roster],
  );

  const activeDay = useMemo(() => {
    if (activeDate) return dayMap.get(activeDate) ?? null;
    // Default to today if today is in this month, else first duty day
    const todayDay = now.day;
    const inThisMonth = roster
      ? now.toFormat('MMMM yyyy') === `${roster.month} ${roster.year}`
      : false;
    if (inThisMonth && dayMap.has(todayDay)) return dayMap.get(todayDay)!;
    return rosterDays.find(d => d.type !== 'rest') ?? rosterDays[0] ?? null;
  }, [activeDate, dayMap, rosterDays, roster, now]);

  const stats = useMemo(() => ({
    flights:  rosterDays.filter(d => d.type === 'flight').length,
    standby:  rosterDays.filter(d => d.type === 'standby').length,
    sectors:  rosterDays.reduce((n, d) => n + d.sectors.length, 0),
  }), [rosterDays]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#ededed] gap-3">
        <Loader2 size={28} className="animate-spin text-sky-600" />
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500">Loading roster…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !apiData || !roster) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#ededed] p-8 text-center gap-4">
        <div className="w-20 h-20 rounded-[2rem] bg-red-50 flex items-center justify-center">
          <AlertCircle size={36} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-950 mb-2">
            {error === 'no-token' ? 'Missing link' : 'Link not found'}
          </h1>
          <p className="text-[13px] text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
            {error === 'no-token'
              ? 'This page needs a share link from the pilot.'
              : 'This link may have expired or been reset. Ask the pilot to share a new one.'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-full border border-slate-200 bg-white text-[13px] font-black text-slate-500 hover:text-slate-900"
        >
          Try again
        </button>
      </div>
    );
  }

  const { pilot, rosters } = apiData;
  const monthYear = `${roster.month} ${roster.year}`;
  const todayLabel = getTodayLabel(rosters, now, pilot.base);

  return (
    <main className="min-h-screen bg-[#ededed] px-3 py-6 text-slate-950">
      <div className="mx-auto w-full max-w-7xl space-y-4">

        {/* ── Top header ── */}
        <header className="rounded-[2rem] border border-black/10 bg-[#f7f7f7] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-slate-400">Crew roster</p>
              <h1 className="mt-1 text-2xl font-black tracking-[0.12em] text-zinc-800 sm:text-3xl uppercase">
                {monthYear}
              </h1>
              <p className="mt-1 text-[12px] font-bold text-slate-400">{pilot.full_name}{pilot.rank ? ` · ${pilot.rank}` : ''} · {todayLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Month picker */}
              {rosters.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={selectedIdx >= rosters.length - 1}
                    onClick={() => { setSelectedIdx(i => i + 1); setActiveDate(null); }}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30 shadow-sm"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={selectedIdx <= 0}
                    onClick={() => { setSelectedIdx(i => i - 1); setActiveDate(null); }}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30 shadow-sm"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-[12px] font-black text-green-700">
                <Check className="h-4 w-4" /> Synced
              </div>
            </div>
          </div>
        </header>

        {/* ── Two-column layout ── */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">

          {/* LEFT — calendar + stats */}
          <div className="space-y-4">

            {/* Calendar grid */}
            <section className="rounded-[2rem] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
              {/* DOW headers */}
              <div className="mb-3 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
                {DOW.map(d => (
                  <div key={d} className="text-[9px] font-black uppercase tracking-widest text-zinc-300 sm:text-[10px] py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calCells.map((date, idx) => {
                  if (!date) return <div key={`pad-${idx}`} className="aspect-square" />;

                  const day   = dayMap.get(date);
                  const type  = day?.type ?? 'rest';
                  const hasDuty = !!day && type !== 'rest';
                  const isActive = activeDate === date || (!activeDate && activeDay?.date === date);
                  const dateStr  = roster
                    ? DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy')
                        .set({ day: date }).toFormat('yyyy-MM-dd')
                    : '';
                  const isToday = dateStr === todayStr;

                  return (
                    <motion.button
                      key={date}
                      type="button"
                      onMouseEnter={() => setActiveDate(date)}
                      onClick={() => setActiveDate(prev => prev === date ? null : date)}
                      whileHover={{ y: -2 }}
                      className={cn(
                        'group relative aspect-square rounded-[1.2rem] transition-all sm:rounded-[1.5rem]',
                        hasDuty
                          ? isActive ? CELL_ACTIVE[type] : CELL_IDLE[type]
                          : isToday
                            ? 'bg-accent/15 ring-1 ring-accent text-accent hover:bg-accent/25'
                            : 'bg-transparent text-zinc-300 hover:bg-zinc-100',
                        isActive && hasDuty ? 'scale-105 z-10' : '',
                      )}
                    >
                      <div className="flex h-full flex-col items-center justify-center gap-0.5">
                        <span className="text-[14px] font-black tracking-tight sm:text-[18px] leading-none">
                          {date}
                        </span>
                        {hasDuty ? (
                          <>
                            <span className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-white/70' : DOT[type])} />
                            <span className="hidden text-[8px] font-black uppercase tracking-wider opacity-70 sm:block leading-none">
                              {day?.sectors.length && day.sectors.length > 0 ? `${day.sectors.length}×` : day?.label}
                            </span>
                          </>
                        ) : (
                          isToday && <span className="h-1.5 w-1.5 rounded-full bg-accent/50" />
                        )}
                      </div>
                      {day?.continuesNextDay && (
                        <span className="absolute bottom-1 right-1 rounded-full bg-white/80 p-0.5 text-slate-500 shadow-sm">
                          <ChevronRight className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* Stats */}
            <section className="rounded-[2rem] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Summary icon={<CalendarDays className="h-4 w-4" />} label="Month"       value={monthYear} />
                <Summary icon={<Plane className="h-4 w-4" />}        label="Flight days"  value={String(stats.flights)} />
                <Summary icon={<Clock3 className="h-4 w-4" />}       label="Standby"      value={String(stats.standby)} />
                <Summary icon={<MapPin className="h-4 w-4" />}       label="Sectors"      value={String(stats.sectors)} />
              </div>
            </section>

            {/* Legend */}
            <section className="rounded-[2rem] border border-black/10 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-[11px] font-bold text-slate-600">
                <div className="flex items-center gap-2 rounded-2xl bg-sky-100 px-3 py-2">
                  <span className="h-3 w-3 rounded-full bg-sky-500 shrink-0" />Blue = Flight
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-amber-100 px-3 py-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />Yellow = Standby
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-100 px-3 py-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />Green = Day off
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-fuchsia-100 px-3 py-2">
                  <span className="h-3 w-3 rounded-full bg-fuchsia-500 shrink-0" />Purple = Training
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT — sticky detail card */}
          <div className="lg:sticky lg:top-6">
            <AnimatePresence mode="wait">
              {activeDay && (
                <RosterDetailCard
                  key={activeDay.dateStr}
                  day={activeDay}
                  monthYear={monthYear}
                  todayStr={todayStr}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-[11px] font-bold text-slate-400 pb-2">
          Shared via Otarosta · Live read-only view
        </p>
      </div>
    </main>
  );
}
