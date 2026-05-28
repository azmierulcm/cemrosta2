'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plane, PlaneTakeoff, PlaneLanding, Clock, MapPin,
  ChevronLeft, ChevronRight, Check, Moon, Bed,
  ShieldAlert, GraduationCap, CalendarDays, X,
  ArrowRight, Gauge, Layers, Sparkles, Loader2, AlertCircle,
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

type DutyType = 'flight' | 'standby' | 'off' | 'training' | 'layover' | 'rest';

interface Sector {
  no: string;
  from: string;
  to: string;
  dep: string;
  arr: string;
  ac: string;
}

interface DayDuty {
  type: DutyType;
  note?: string;
  at?: string;
  sectors?: Sector[];
  dutyStart?: string;
  dutyEnd?: string;
}

interface Trip {
  destCode: string;
  destCity: string;
  destFlag: string;
  range: string;
  nights: number;
  sectors: number;
  sched: string;
  type: 'Long-haul' | 'Turnaround';
  firstFlightDay: number;
}

interface UpNext {
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  flightNo: string;
  report: string;
  std: string;
  arr: string;
  ac: string;
  overnight: boolean;
  daysAway: number;
  layoverNights: number;
}

// ─── Duty colour tokens ───────────────────────────────────────────────────────
// Follows the existing project palette (Tailwind colour classes only)

const DUTY_CELL: Record<DutyType, string> = {
  flight:   'bg-sky-50   border-sky-200   hover:bg-sky-100',
  standby:  'bg-amber-50  border-amber-200  hover:bg-amber-100',
  off:      'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  training: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
  layover:  'bg-sky-50/60 border-sky-100   hover:bg-sky-100/60',
  rest:     'bg-white     border-border',
};

const DUTY_TAG: Record<DutyType, string> = {
  flight:   'bg-sky-100   text-sky-700',
  standby:  'bg-amber-100  text-amber-700',
  off:      'bg-emerald-100 text-emerald-700',
  training: 'bg-violet-100 text-violet-700',
  layover:  'bg-sky-100/60 text-sky-500',
  rest:     '',
};

const DUTY_TEXT: Record<DutyType, string> = {
  flight:   'text-sky-700',
  standby:  'text-amber-700',
  off:      'text-emerald-700',
  training: 'text-violet-700',
  layover:  'text-sky-500',
  rest:     'text-text-subtle',
};

const DUTY_BORDER_LEFT: Record<DutyType, string> = {
  flight:   'border-sky-400',
  standby:  'border-amber-400',
  off:      'border-emerald-400',
  training: 'border-violet-400',
  layover:  'border-sky-300',
  rest:     'border-border',
};

// ─── Flag / city helpers ──────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
  MY: '🇲🇾', GB: '🇬🇧', JP: '🇯🇵', ID: '🇮🇩', HK: '🇭🇰', AU: '🇦🇺',
  SG: '🇸🇬', AE: '🇦🇪', CN: '🇨🇳', TH: '🇹🇭', VN: '🇻🇳', IN: '🇮🇳',
  DE: '🇩🇪', FR: '🇫🇷', NL: '🇳🇱', TR: '🇹🇷', SA: '🇸🇦', QA: '🇶🇦',
  KR: '🇰🇷', PH: '🇵🇭', BD: '🇧🇩', PK: '🇵🇰', NZ: '🇳🇿', ZA: '🇿🇦',
  LK: '🇱🇰', MV: '🇲🇻', OM: '🇴🇲', KW: '🇰🇼', BH: '🇧🇭', MM: '🇲🇲',
  KH: '🇰🇭', LA: '🇱🇦', TW: '🇹🇼', US: '🇺🇸', CA: '🇨🇦',
};

const COUNTRY_CODE: Record<string, string> = {
  Malaysia: 'MY', 'United Kingdom': 'GB', Japan: 'JP', Indonesia: 'ID',
  'Hong Kong': 'HK', Australia: 'AU', Singapore: 'SG', 'United Arab Emirates': 'AE',
  China: 'CN', Thailand: 'TH', Vietnam: 'VN', India: 'IN', Germany: 'DE',
  France: 'FR', Netherlands: 'NL', Turkey: 'TR', 'Saudi Arabia': 'SA', Qatar: 'QA',
  'South Korea': 'KR', Philippines: 'PH', Bangladesh: 'BD', Pakistan: 'PK',
  'New Zealand': 'NZ', 'South Africa': 'ZA', 'Sri Lanka': 'LK', Maldives: 'MV',
  Oman: 'OM', Kuwait: 'KW', Bahrain: 'BH', Myanmar: 'MM', Cambodia: 'KH',
  Laos: 'LA', Taiwan: 'TW', 'United States': 'US', Canada: 'CA',
};

function airportFlag(iata: string): string {
  const meta = getAirportMeta(iata);
  const cc   = COUNTRY_CODE[meta.country ?? ''] ?? '';
  return FLAG[cc] ?? '✈️';
}

function cityName(iata?: string | null): string {
  if (!iata) return iata ?? '';
  return getAirportMeta(iata).city || iata;
}

// ─── Data helpers (logic unchanged) ──────────────────────────────────────────

function sumBlockHours(events: DutyEvent[]): string {
  let mins = 0;
  let found = false;
  for (const e of events) {
    if (e.type === 'FLIGHT' && e.blockHrs) {
      const [h, m] = e.blockHrs.split(':').map(Number);
      mins += (h * 60) + (m || 0);
      found = true;
    }
  }
  if (!found) return '—';
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
}

function buildDayDuty(events: DutyEvent[]): DayDuty | null {
  if (!events.length) return null;
  const flights  = events.filter(e => e.type === 'FLIGHT');
  const standby  = events.find(e => e.type === 'STANDBY');
  const layover  = events.find(e => e.type === 'LAYOVER');
  const off      = events.find(e => e.type === 'OFF');
  const training = events.find(e => e.type === 'TRAINING' || e.type === 'GROUND');

  if (flights.length > 0) {
    const first = flights[0];
    const last  = flights[flights.length - 1];
    const overnight = !!(last.sta && last.std && last.sta < last.std);
    return {
      type: 'flight',
      note: first.signOn ? `Report ${first.signOn}` : undefined,
      sectors: flights.map(f => ({
        no:   f.item || f.flightNumber || '—',
        from: f.depPort || '—',
        to:   f.arrPort || '—',
        dep:  f.std || f.signOn || '—',
        arr:  `${f.sta || f.signOff || '—'}${(f.sta && f.std && f.sta < f.std) ? '⁺¹' : ''}`,
        ac:   f.acType || '—',
      })),
      dutyStart: first.std || first.signOn,
      dutyEnd:   `${last.sta || last.signOff || ''}${overnight ? '⁺¹' : ''}`,
    };
  }
  if (layover && !standby) {
    return { type: 'layover', at: layover.depPort || layover.arrPort || '?' };
  }
  if (standby) {
    return { type: 'standby', note: standby.description || standby.item || 'Standby', dutyStart: standby.signOn, dutyEnd: standby.signOff };
  }
  if (training) {
    return { type: 'training', note: training.description || training.item || 'Ground duty', dutyStart: training.signOn, dutyEnd: training.signOff };
  }
  if (off) {
    return { type: 'off', note: off.item === 'DO' ? 'Day off' : (off.description || 'Off') };
  }
  return null;
}

function buildTrips(roster: SharedRoster, base: string): Trip[] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];

  const eventMap = new Map<string, DutyEvent[]>();
  for (const e of roster.events ?? []) {
    const list = eventMap.get(e.date) ?? [];
    list.push(e);
    eventMap.set(e.date, list);
  }

  const allDays = Array.from({ length: start.daysInMonth ?? 30 }, (_, i) => {
    const d       = i + 1;
    const dateStr = start.set({ day: d }).toFormat('yyyy-MM-dd');
    return { dateStr, day: d, duty: buildDayDuty(eventMap.get(dateStr) ?? []) };
  });

  const trips: Trip[] = [];
  let i = 0;
  while (i < allDays.length) {
    const { duty, day, dateStr } = allDays[i];
    if (!duty || duty.type !== 'flight' || !duty.sectors?.length) { i++; continue; }

    const tripDays = [allDays[i]];
    let j = i + 1;
    while (j < allDays.length) {
      const next = allDays[j];
      if (!next.duty || (next.duty.type !== 'flight' && next.duty.type !== 'layover')) break;
      tripDays.push(next);
      j++;
    }

    const allSectors = tripDays.flatMap(d => d.duty?.sectors ?? []);
    let destCode = '';
    for (const s of allSectors) {
      if (s.to && s.to !== base && s.to !== '—') { destCode = s.to; break; }
    }
    if (!destCode) { i = j; continue; }

    const nights = tripDays.filter(d => d.duty?.type === 'layover').length;
    const firstDate = DateTime.fromISO(dateStr);
    const lastDate  = DateTime.fromISO(tripDays[tripDays.length - 1].dateStr);
    const rangeLabel = firstDate.day === lastDate.day
      ? firstDate.toFormat('MMM d')
      : `${firstDate.toFormat('MMM d')} – ${lastDate.toFormat('d')}`;

    trips.push({
      destCode,
      destCity: cityName(destCode),
      destFlag: airportFlag(destCode),
      range: rangeLabel,
      nights,
      sectors: allSectors.length,
      sched: allSectors.map(s => s.no).filter(Boolean).join(' / '),
      type: nights > 0 ? 'Long-haul' : 'Turnaround',
      firstFlightDay: day,
    });
    i = j;
  }
  return trips;
}

function findUpNext(rosters: SharedRoster[], now: DateTime, base: string): UpNext | null {
  const todayStr  = now.toFormat('yyyy-MM-dd');
  const allEvents = rosters.flatMap(r => r.events ?? []);

  const upcoming = allEvents
    .filter(e => e.type === 'FLIGHT' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!upcoming.length) return null;
  const next = upcoming[0];
  const layoverNights = allEvents.filter(e => e.type === 'LAYOVER' && e.date > next.date).length;

  return {
    fromCode: next.depPort || '—',
    fromCity: cityName(next.depPort),
    toCode:   next.arrPort || '—',
    toCity:   cityName(next.arrPort),
    flightNo: next.item || next.flightNumber || '—',
    report:   next.signOn || '—',
    std:      next.std || '—',
    arr:      next.sta || '—',
    ac:       next.acType || '—',
    overnight: !!(next.sta && next.std && next.sta < next.std),
    daysAway: Math.max(0, Math.round(DateTime.fromISO(next.date).diff(now, 'days').days)),
    layoverNights,
  };
}

function sortRostersChronologically(rosters: SharedRoster[]): SharedRoster[] {
  return [...rosters].sort((a, b) => {
    const dtA = DateTime.fromFormat(`${a.month} ${a.year}`, 'MMMM yyyy');
    const dtB = DateTime.fromFormat(`${b.month} ${b.year}`, 'MMMM yyyy');
    return dtA.toMillis() - dtB.toMillis();
  });
}

function buildCalendarMatrix(roster: SharedRoster): (number | null)[][] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];
  const offset = start.weekday === 7 ? 6 : start.weekday - 1;
  const flat: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= (start.daysInMonth ?? 30); d++) flat.push(d);
  while (flat.length % 7 !== 0) flat.push(null);
  const out: (number | null)[][] = [];
  for (let i = 0; i < flat.length; i += 7) out.push(flat.slice(i, i + 7));
  return out;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function NavBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-full border border-border bg-white text-text-muted shadow-sm transition hover:border-border-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** One stat tile in the 6-up snapshot */
function StatCard({
  icon: Icon, value, label, sub, color,
}: { icon: React.ElementType; value: React.ReactNode; label: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-3 pb-3 pt-3.5 shadow-sm">
      <Icon size={15} className={color ?? 'text-text-subtle'} />
      <div className={`mt-2.5 text-[22px] font-bold leading-none tracking-tight ${color ?? 'text-text'}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[.1em] text-text-subtle">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-text-subtle">{sub}</div>}
    </div>
  );
}

/** Inline meta item inside the UP NEXT card */
function MetaItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-text-subtle">{label}</div>
      <div className={`mt-0.5 text-[15px] font-bold ${highlight ? 'text-accent' : 'text-text'}`}>{value}</div>
    </div>
  );
}

/** Calendar day cell */
function DayCell({
  day, duty, isToday, onClick,
}: { day: number | null; duty: DayDuty | null; isToday: boolean; onClick: () => void }) {
  if (!day) return <div className="min-h-[72px] rounded-xl sm:min-h-[90px]" />;

  const type      = duty?.type ?? 'rest';
  const hasDuty   = !!duty && type !== 'rest';
  const isFlight  = type === 'flight';
  const cellStyle = hasDuty ? DUTY_CELL[type] : DUTY_CELL.rest;

  return (
    <div
      onClick={hasDuty ? onClick : undefined}
      className={[
        'flex min-h-[72px] flex-col rounded-xl border p-[7px] transition-all sm:min-h-[90px] sm:p-2',
        cellStyle,
        hasDuty ? 'cursor-pointer' : 'cursor-default',
        isToday ? 'ring-2 ring-accent ring-offset-1' : '',
      ].join(' ')}
    >
      {/* Date number */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold sm:text-[13px] ${isToday ? 'text-accent' : hasDuty ? DUTY_TEXT[type] : 'text-text-subtle'}`}>
          {day}
        </span>
        {isToday && (
          <span className="rounded-[4px] bg-accent px-[4px] py-0.5 text-[7px] font-bold uppercase tracking-[.08em] text-white sm:text-[8px]">
            Today
          </span>
        )}
      </div>

      {/* Flight rows — flight number + route + time inside the cell */}
      {isFlight && duty?.sectors && (
        <div className="mt-auto flex flex-col gap-[3px]">
          {duty.sectors.map((s, i) => (
            <div key={i} className={`flex flex-col gap-px border-l-2 pl-1.5 ${DUTY_BORDER_LEFT.flight}`}>
              <div className="text-[9px] font-bold text-sky-700 sm:text-[10px]">{s.no}</div>
              <div className="flex gap-[2px] text-[9px] text-sky-600 sm:text-[10px]">
                {s.from}<span className="text-sky-400">→</span>{s.to}
              </div>
              <div className="hidden text-[8px] text-sky-500/80 sm:block">{s.dep.replace('⁺¹', '')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Non-flight duty tags */}
      {!isFlight && hasDuty && (
        <div className={`mt-auto inline-flex max-w-max items-center gap-1 rounded-md px-1.5 py-[3px] text-[8px] font-bold uppercase tracking-[.06em] sm:text-[9px] ${DUTY_TAG[type]}`}>
          {type === 'layover'  && <><Moon size={8} /> Layover{duty.at ? ` ${duty.at}` : ''}</>}
          {type === 'standby'  && <><ShieldAlert size={8} /> Standby</>}
          {type === 'training' && <><GraduationCap size={8} /> Training</>}
          {type === 'off'      && <><Bed size={8} /> Day off</>}
        </div>
      )}
    </div>
  );
}

/** Legend strip at bottom of calendar */
function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
      {([
        ['bg-sky-400',    'Flight'],
        ['bg-amber-400',  'Standby'],
        ['bg-emerald-400','Day off'],
        ['bg-violet-400', 'Training'],
        ['bg-sky-300',    'Layover'],
      ] as const).map(([bg, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
          <span className={`h-2 w-2 rounded-sm ${bg}`} /> {label}
        </span>
      ))}
    </div>
  );
}

// ─── Day detail modal ─────────────────────────────────────────────────────────

function DayModal({ dateLabel, duty, onClose }: { dateLabel: string; duty: DayDuty; onClose: () => void }) {
  const typeLabel: Record<DutyType, string> = {
    flight: 'Flight Duty', standby: 'Standby', off: 'Day Off',
    training: 'Training', layover: 'Layover', rest: 'Rest day',
  };

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
        className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header strip */}
        <div className={`h-1.5 w-full ${duty.type === 'flight' ? 'bg-sky-400' : duty.type === 'standby' ? 'bg-amber-400' : duty.type === 'off' ? 'bg-emerald-400' : duty.type === 'training' ? 'bg-violet-400' : duty.type === 'layover' ? 'bg-sky-300' : 'bg-border'}`} />

        <div className="p-6">
          <button onClick={onClose} className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-surface text-text-muted hover:bg-surface-2 hover:text-text">
            <X size={14} />
          </button>

          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-text-subtle">{dateLabel}</p>
          <h2 className={`mt-1 text-xl font-bold ${duty.type !== 'rest' ? DUTY_TEXT[duty.type] : 'text-text'}`}>
            {typeLabel[duty.type]}
          </h2>

          {duty.note && (
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-text-muted">
              <Clock size={12} /> {duty.note}
            </p>
          )}

          {duty.type !== 'flight' && duty.dutyStart && (
            <p className="mt-1 text-[13px] font-medium text-text-muted">
              {duty.dutyStart}{duty.dutyEnd ? ` – ${duty.dutyEnd}` : ''}
            </p>
          )}

          {/* Layover location */}
          {duty.type === 'layover' && duty.at && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
              <Moon size={16} className="text-sky-500" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-sky-400">Layover destination</p>
                <p className="mt-0.5 text-lg font-bold text-sky-700">{duty.at} — {cityName(duty.at)}</p>
              </div>
            </div>
          )}

          {/* Sector cards for flights */}
          {duty.type === 'flight' && duty.sectors && (
            <div className="mt-4 flex flex-col gap-3">
              {duty.sectors.map((s, i) => (
                <div key={i} className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-sky-700">{s.no}</span>
                    {s.ac !== '—' && <span className="text-[11px] text-text-subtle">{s.ac}</span>}
                  </div>
                  <div className="mt-3 flex items-center">
                    {/* DEP */}
                    <div className="flex-1">
                      <p className="text-[28px] font-black leading-none tracking-tight text-text">{s.from}</p>
                      <p className="mt-1 flex items-center gap-1 text-[12px] text-text-muted">
                        <PlaneTakeoff size={11} className="text-sky-500" /> {s.dep}
                      </p>
                      <p className="text-[11px] text-text-subtle">{cityName(s.from)}</p>
                    </div>
                    {/* Arc */}
                    <div className="flex flex-1 items-center justify-center gap-1.5 px-2">
                      <span className="h-px flex-1 bg-sky-200" />
                      <Plane size={13} className="rotate-45 text-sky-400" />
                      <span className="h-px flex-1 bg-sky-200" />
                    </div>
                    {/* ARR */}
                    <div className="flex-1 text-right">
                      <p className="text-[28px] font-black leading-none tracking-tight text-text">{s.to}</p>
                      <p className="mt-1 flex items-center justify-end gap-1 text-[12px] text-text-muted">
                        <PlaneLanding size={11} className="text-sky-500" /> {s.arr}
                      </p>
                      <p className="text-[11px] text-text-subtle">{cityName(s.to)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [apiData, setApiData]     = useState<{ pilot: PilotInfo; rosters: SharedRoster[] } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [now, setNow]             = useState(() => DateTime.now());
  const [rosterIdx, setRosterIdx] = useState(0);
  const [view, setView]           = useState<'grid' | 'trips'>('grid');
  const [openDay, setOpenDay]     = useState<{ dateLabel: string; duty: DayDuty } | null>(null);

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
        const todayFmt = now.toFormat('MMMM yyyy');
        const idx = rosters.findIndex(r => `${r.month} ${r.year}` === todayFmt);
        if (idx >= 0) setRosterIdx(idx);
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

  const eventMap = useMemo(() => {
    const m = new Map<string, DutyEvent[]>();
    for (const e of roster?.events ?? []) {
      const list = m.get(e.date) ?? [];
      list.push(e);
      m.set(e.date, list);
    }
    return m;
  }, [roster]);

  const weeks = useMemo(() => roster ? buildCalendarMatrix(roster) : [], [roster]);

  const stats = useMemo(() => {
    const events = roster?.events ?? [];
    const flightDates = new Set(events.filter(e => e.type === 'FLIGHT').map(e => e.date));
    const destSet = new Set(events.filter(e => e.type === 'FLIGHT' && e.arrPort && e.arrPort !== pilot?.base).map(e => e.arrPort!));
    return {
      blockHours: sumBlockHours(events),
      flightDays: flightDates.size,
      sectors:    events.filter(e => e.type === 'FLIGHT').length,
      standby:    new Set(events.filter(e => e.type === 'STANDBY').map(e => e.date)).size,
      daysOff:    new Set(events.filter(e => e.type === 'OFF').map(e => e.date)).size,
      destinations: destSet.size,
    };
  }, [roster, pilot?.base]);

  const trips = useMemo(
    () => roster && pilot ? buildTrips(roster, pilot.base) : [],
    [roster, pilot],
  );

  const destinations = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ code: string; city: string; flag: string }> = [];
    for (const e of roster?.events ?? []) {
      if (e.type === 'FLIGHT' && e.arrPort && e.arrPort !== pilot?.base && !seen.has(e.arrPort)) {
        seen.add(e.arrPort);
        out.push({ code: e.arrPort, city: cityName(e.arrPort), flag: airportFlag(e.arrPort) });
      }
    }
    return out;
  }, [roster, pilot?.base]);

  const upNext = useMemo(
    () => apiData ? findUpNext(apiData.rosters, now, apiData.pilot.base) : null,
    [apiData, now],
  );

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

  const monthLabel = `${roster.month} ${roster.year}`;
  const initials   = pilot.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const upNextLabel = upNext
    ? upNext.daysAway === 0 ? 'Departs today'
    : upNext.daysAway === 1 ? 'Departs tomorrow'
    : `Departs in ${upNext.daysAway} days`
    : null;

  return (
    <div className="min-h-screen bg-surface px-4 py-6 text-text sm:px-6 md:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-4">

        {/* ── Header card ── */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Left: crew info + month nav */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-accent">
                Crew Roster · {pilot.base} Base
              </p>
              <div className="mt-1 flex items-center gap-1">
                <NavBtn disabled={rosterIdx <= 0} onClick={() => setRosterIdx(i => i - 1)}>
                  <ChevronLeft size={14} />
                </NavBtn>
                <h1 className="mx-1 text-2xl font-black tracking-tight text-text sm:text-3xl">
                  {monthLabel}
                </h1>
                <NavBtn disabled={rosterIdx >= rosters.length - 1} onClick={() => setRosterIdx(i => i + 1)}>
                  <ChevronRight size={14} />
                </NavBtn>
              </div>
              <div className="mt-3 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-sm font-bold text-white">
                  {initials}
                </span>
                <div>
                  <p className="text-[14px] font-bold text-text">{pilot.full_name}</p>
                  {(pilot.rank || pilot.airline) && (
                    <p className="text-[12px] text-text-muted">
                      {[pilot.rank, pilot.airline].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: synced badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-3 py-1.5 text-[11px] font-semibold text-success">
              <Check size={12} strokeWidth={3} /> Synced
            </span>
          </div>
        </div>

        {/* ── UP NEXT ── */}
        {upNext && upNextLabel && (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            {/* Accent top bar */}
            <div className="h-1 w-full bg-accent" />
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-accent">{upNextLabel}</p>

              {/* Route row */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-[36px] font-black leading-none tracking-tight sm:text-[44px]">
                    {upNext.fromCode}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-muted">{upNext.fromCity}</p>
                </div>
                <div className="flex flex-col items-center gap-1 px-2">
                  <span className="h-px w-12 bg-border sm:w-20" />
                  <Plane size={16} className="rotate-45 text-accent" />
                  <span className="h-px w-12 bg-border sm:w-20" />
                  {upNext.ac !== '—' && (
                    <span className="text-[10px] text-text-subtle">{upNext.ac}</span>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[36px] font-black leading-none tracking-tight sm:text-[44px]">
                    {upNext.toCode}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-muted">{upNext.toCity}</p>
                </div>
              </div>

              {/* Meta pills */}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4">
                <MetaItem label="Flight"  value={upNext.flightNo} />
                {upNext.report !== '—' && <MetaItem label="Report"  value={upNext.report} />}
                {upNext.std    !== '—' && <MetaItem label="STD"     value={upNext.std} />}
                {upNext.arr    !== '—' && <MetaItem label="Arrives" value={upNext.arr} />}
                {upNext.layoverNights > 0 && (
                  <MetaItem label="Layover" value={`${upNext.layoverNights} night${upNext.layoverNights > 1 ? 's' : ''}`} highlight />
                )}
                {upNext.overnight && upNext.layoverNights === 0 && (
                  <MetaItem label="Return" value="Next day" highlight />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Stats snapshot ── */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <StatCard icon={Gauge}        value={stats.blockHours}   label="Block Hrs"   sub="this month" />
          <StatCard icon={PlaneTakeoff} value={stats.flightDays}   label="Flight Days" color="text-sky-600" />
          <StatCard icon={Layers}       value={stats.sectors}      label="Sectors"     color="text-sky-500" />
          <StatCard icon={ShieldAlert}  value={stats.standby}      label="Standby"     color="text-amber-600" />
          <StatCard icon={Bed}          value={stats.daysOff}      label="Days Off"    color="text-emerald-600" />
          <StatCard icon={MapPin}       value={stats.destinations} label="Dest."       color="text-violet-600" />
        </div>

        {/* ── Calendar / Trips toggle ── */}
        <div className="flex justify-center">
          <div className="inline-flex gap-1 rounded-full border border-border bg-white p-1 shadow-sm">
            {(['grid', 'trips'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
                  view === v
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text',
                ].join(' ')}
              >
                {v === 'grid'
                  ? <><CalendarDays size={13} /> Calendar</>
                  : <><Plane size={13} /> Trips</>
                }
              </button>
            ))}
          </div>
        </div>

        {/* ── Calendar grid ── */}
        {view === 'grid' && (
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
            {/* DOW headers */}
            <div className="mb-2 grid grid-cols-7 gap-1.5">
              {DOW.map((d, i) => (
                <div key={d} className={`text-center text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${i >= 5 ? 'text-accent' : 'text-text-subtle'}`}>
                  {d}
                </div>
              ))}
            </div>
            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="mb-1.5 grid grid-cols-7 gap-1.5">
                {week.map((d, di) => {
                  const dateStr = d
                    ? DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy')
                        .set({ day: d }).toFormat('yyyy-MM-dd')
                    : '';
                  const duty    = d ? buildDayDuty(eventMap.get(dateStr) ?? []) : null;
                  const dateLabel = d
                    ? DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy')
                        .set({ day: d }).toFormat('d MMM yyyy').toUpperCase()
                    : '';
                  return (
                    <DayCell
                      key={di}
                      day={d}
                      duty={duty}
                      isToday={dateStr === todayStr}
                      onClick={() => duty && setOpenDay({ dateLabel, duty })}
                    />
                  );
                })}
              </div>
            ))}
            <Legend />
          </div>
        )}

        {/* ── Trips view ── */}
        {view === 'trips' && (
          <div className="space-y-2">
            {trips.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white p-8 text-center text-[13px] text-text-muted shadow-sm">
                No trips found for {roster.month} {roster.year}
              </div>
            ) : trips.map((t, i) => (
              <button
                key={i}
                onClick={() => {
                  const dateStr = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy')
                    .set({ day: t.firstFlightDay }).toFormat('yyyy-MM-dd');
                  const duty = buildDayDuty(eventMap.get(dateStr) ?? []);
                  const dateLabel = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy')
                    .set({ day: t.firstFlightDay }).toFormat('d MMM yyyy').toUpperCase();
                  if (duty) setOpenDay({ dateLabel, duty });
                }}
                className="flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-white text-left shadow-sm transition hover:border-border-hover hover:shadow-md"
              >
                {/* Sky left bar */}
                <span className="w-1 self-stretch rounded-l-2xl bg-sky-400" />
                {/* Destination stub */}
                <div className="min-w-[100px] border-r border-border py-4 pr-4 sm:min-w-[120px]">
                  <p className="text-xl font-black tracking-tight sm:text-2xl">{t.destFlag} {t.destCode}</p>
                  <p className="mt-0.5 text-[11px] text-text-muted">{t.destCity}</p>
                </div>
                {/* Range + schedule */}
                <div className="min-w-[110px]">
                  <p className="text-[13px] font-bold text-text">{t.range}</p>
                  <p className="mt-0.5 text-[11px] text-text-subtle">{t.sched}</p>
                </div>
                {/* Tags */}
                <div className="flex flex-1 flex-wrap gap-1.5 py-4">
                  {[t.type, `${t.sectors} sector${t.sectors > 1 ? 's' : ''}`].map(tag => (
                    <span key={tag} className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-text-muted">
                      {tag}
                    </span>
                  ))}
                  {t.nights > 0
                    ? <span className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent">{t.nights}N layover</span>
                    : <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Same-day</span>
                  }
                </div>
                <ArrowRight size={15} className="mr-4 shrink-0 text-text-subtle" />
              </button>
            ))}
          </div>
        )}

        {/* ── Destinations passport ── */}
        {destinations.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[.12em] text-text">
                <Sparkles size={13} className="text-accent" /> Destinations this month
              </p>
              <p className="text-[11px] text-text-subtle">
                {destinations.length} {destinations.length === 1 ? 'city' : 'cities'}
              </p>
            </div>
            <div className={`grid gap-2 ${destinations.length <= 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'}`}>
              {destinations.map(d => (
                <div key={d.code} className="rounded-xl border border-dashed border-accent/30 bg-accent-soft/40 px-2 py-4 text-center">
                  <p className="text-2xl">{d.flag}</p>
                  <p className="mt-1 text-base font-black tracking-tight">{d.code}</p>
                  <p className="mt-0.5 text-[10px] text-text-muted leading-tight">{d.city}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <p className="pb-2 text-center text-[11px] text-text-subtle">
          Otarosta · Shared roster · Live read-only view
        </p>

      </div>

      {/* ── Day detail modal ── */}
      <AnimatePresence>
        {openDay && (
          <DayModal
            dateLabel={openDay.dateLabel}
            duty={openDay.duty}
            onClose={() => setOpenDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
