'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, PlaneTakeoff, PlaneLanding, Clock, MapPin,
  ChevronLeft, ChevronRight, Check, Moon, Bed,
  ShieldAlert, GraduationCap, CalendarDays, X,
  ArrowRight, Gauge, Layers, Sparkles, Loader2, AlertCircle,
} from 'lucide-react';
import { getAirportMeta } from '@/lib/utils/destinations';
import type { DutyEvent } from '@/lib/types';

// ─── API types (unchanged from share route) ───────────────────────────────────

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
  at?: string;          // layover destination IATA
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
  firstFlightDay: number; // day-of-month for modal link
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
  daysAway: number; // 0 = today, 1 = tomorrow, etc.
  layoverNights: number;
}

// ─── Country flag helper (common MH destinations) ─────────────────────────────

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

// ─── Data helpers ─────────────────────────────────────────────────────────────

/** Sum blockHrs strings across FLIGHT events → "HH:MM" or "—" */
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
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** Build a DayDuty record from all DutyEvents on a single day */
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
    const overnight = last.sta && last.std ? last.sta < last.std : false;
    const sectors: Sector[] = flights.map(f => ({
      no:   f.item || f.flightNumber || '—',
      from: f.depPort || '—',
      to:   f.arrPort || '—',
      dep:  f.std     || f.signOn   || '—',
      arr:  `${f.sta || f.signOff || '—'}${(f.sta && f.std && f.sta < f.std) ? '⁺¹' : ''}`,
      ac:   f.acType  || '—',
    }));
    return {
      type: 'flight',
      note: first.signOn ? `Report ${first.signOn}` : undefined,
      sectors,
      dutyStart: first.std || first.signOn,
      dutyEnd:   `${last.sta || last.signOff || ''}${overnight ? '⁺¹' : ''}`,
    };
  }

  if (layover && !standby) {
    // Layover day (no outbound flight today — crew is away from base)
    const prev = layover.depPort || layover.arrPort;
    return { type: 'layover', at: prev || '?' };
  }

  if (standby) {
    return {
      type: 'standby',
      note: standby.description || standby.item || 'Standby',
      dutyStart: standby.signOn,
      dutyEnd:   standby.signOff,
    };
  }

  if (training) {
    return {
      type: 'training',
      note: training.description || training.item || 'Ground duty',
      dutyStart: training.signOn,
      dutyEnd:   training.signOff,
    };
  }

  if (off) {
    return {
      type: 'off',
      note: off.item === 'DO' ? 'Day off' : (off.description || 'Off'),
    };
  }

  return null;
}

/** Group consecutive flight+layover days into trip pairings */
function buildTrips(
  roster: SharedRoster,
  base: string,
): Trip[] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];

  // Build a sorted list of [dateStr, events[]] pairs
  const eventMap = new Map<string, DutyEvent[]>();
  for (const e of roster.events ?? []) {
    const list = eventMap.get(e.date) ?? [];
    list.push(e);
    eventMap.set(e.date, list);
  }

  const allDays: Array<{ dateStr: string; day: number; duty: DayDuty | null }> = [];
  for (let d = 1; d <= (start.daysInMonth ?? 30); d++) {
    const dateStr = start.set({ day: d }).toFormat('yyyy-MM-dd');
    allDays.push({ dateStr, day: d, duty: buildDayDuty(eventMap.get(dateStr) ?? []) });
  }

  const trips: Trip[] = [];
  let i = 0;

  while (i < allDays.length) {
    const { duty, day, dateStr } = allDays[i];
    if (!duty || duty.type !== 'flight' || !duty.sectors?.length) { i++; continue; }

    const firstSector = duty.sectors[0];
    // Only start a trip when departing from base (or first flight of any chain)
    // We'll collect all consecutive flight/layover days regardless
    const tripDays: typeof allDays[number][] = [allDays[i]];
    let j = i + 1;

    while (j < allDays.length) {
      const next = allDays[j];
      if (!next.duty || (next.duty.type !== 'flight' && next.duty.type !== 'layover')) break;
      tripDays.push(next);
      j++;
    }

    // Derive destination: first non-base arrival IATA
    let destCode = '';
    const allSectors = tripDays.flatMap(d => d.duty?.sectors ?? []);
    for (const s of allSectors) {
      if (s.to && s.to !== base && s.to !== '—') { destCode = s.to; break; }
    }
    if (!destCode && firstSector.to !== '—') destCode = firstSector.to;
    if (!destCode) { i = j; continue; }

    const nights = tripDays.filter(d => d.duty?.type === 'layover').length;
    const flightDays = tripDays.filter(d => d.duty?.type === 'flight');
    const sectors = allSectors.length;
    const flightNos = allSectors.map(s => s.no).filter(Boolean).join(' / ');

    // Date range label
    const firstDate = DateTime.fromISO(dateStr);
    const lastDay   = tripDays[tripDays.length - 1];
    const lastDate  = DateTime.fromISO(lastDay.dateStr);
    const rangeLabel = firstDate.day === lastDate.day
      ? firstDate.toFormat('MMM d')
      : `${firstDate.toFormat('MMM d')} – ${lastDate.toFormat('d')}`;

    trips.push({
      destCode,
      destCity: cityName(destCode),
      destFlag: airportFlag(destCode),
      range: rangeLabel,
      nights,
      sectors,
      sched: flightNos,
      type: nights > 0 ? 'Long-haul' : 'Turnaround',
      firstFlightDay: day,
    });

    i = j;
  }

  return trips;
}

/** Find the next upcoming flight from today */
function findUpNext(rosters: SharedRoster[], now: DateTime, base: string): UpNext | null {
  const todayStr = now.toFormat('yyyy-MM-dd');
  const allEvents = rosters.flatMap(r => r.events ?? []);

  // Check if currently on layover
  const todayLayover = allEvents.find(e => e.date === todayStr && e.type === 'LAYOVER');
  if (todayLayover) {
    // Find the return flight
    const returnFlight = allEvents.find(e =>
      e.date > todayStr && e.type === 'FLIGHT' && (e.depPort !== base || true),
    );
    if (returnFlight) {
      const daysAway = Math.round(DateTime.fromISO(returnFlight.date).diff(now, 'days').days);
      return {
        fromCode: returnFlight.depPort || '—',
        fromCity: cityName(returnFlight.depPort),
        toCode:   returnFlight.arrPort || '—',
        toCity:   cityName(returnFlight.arrPort),
        flightNo: returnFlight.item || returnFlight.flightNumber || '—',
        report:   returnFlight.signOn || '—',
        std:      returnFlight.std || '—',
        arr:      returnFlight.sta || '—',
        ac:       returnFlight.acType || '—',
        overnight: !!(returnFlight.sta && returnFlight.std && returnFlight.sta < returnFlight.std),
        daysAway,
        layoverNights: 0,
      };
    }
  }

  // Next upcoming flight from today or tomorrow
  const upcoming = allEvents
    .filter(e => e.type === 'FLIGHT' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!upcoming.length) return null;

  const next = upcoming[0];
  const daysAway = Math.round(DateTime.fromISO(next.date).diff(now, 'days').days);

  // Count layover nights after this flight
  const layoverNights = allEvents.filter(e =>
    e.type === 'LAYOVER' && e.date > next.date,
  ).length;

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
    daysAway,
    layoverNights,
  };
}

/** Sort rosters chronologically (oldest first) */
function sortRostersChronologically(rosters: SharedRoster[]): SharedRoster[] {
  return [...rosters].sort((a, b) => {
    const dtA = DateTime.fromFormat(`${a.month} ${a.year}`, 'MMMM yyyy');
    const dtB = DateTime.fromFormat(`${b.month} ${b.year}`, 'MMMM yyyy');
    return dtA.toMillis() - dtB.toMillis();
  });
}

// ─── Calendar grid builder ────────────────────────────────────────────────────

function buildCalendarMatrix(roster: SharedRoster): (number | null)[][] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];
  const offset = start.weekday === 7 ? 6 : start.weekday - 1;
  const flat: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= (start.daysInMonth ?? 30); d++) flat.push(d);
  while (flat.length % 7 !== 0) flat.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < flat.length; i += 7) weeks.push(flat.slice(i, i + 7));
  return weeks;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function NavBtn({
  children, onClick, disabled,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-white/10 bg-white/5 text-board-muted transition-colors hover:text-board-text disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function MetaPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="font-jb text-[10px] tracking-[.14em] text-board-faint">{label}</div>
      <div className={`mt-[3px] font-jb text-[18px] font-bold ${accent ? 'text-board-gold' : 'text-board-text'}`}>
        {value}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, value, label, sub, color,
}: { icon: React.ElementType; value: React.ReactNode; label: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-[14px] border border-white/7 bg-white/[.03] px-3 pb-3 pt-3.5 transition-transform hover:-translate-y-0.5">
      <Icon size={15} className={color ?? 'text-board-muted'} />
      <div className={`mt-2.5 font-jb text-[22px] font-bold leading-none ${color ?? 'text-board-text'}`}>
        {value}
      </div>
      <div className="mt-1.5 font-jb text-[10px] tracking-[.12em] text-board-muted">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-board-faint">{sub}</div>}
    </div>
  );
}

function DutyTag({
  children, className,
}: { children: React.ReactNode; className: string }) {
  return (
    <div className={`mt-auto inline-flex max-w-max items-center gap-1.5 rounded-lg px-2 py-[5px] font-jb text-[10px] font-semibold tracking-[.06em] ${className}`}>
      {children}
    </div>
  );
}

function DayCell({
  day, duty, isToday, onClick,
}: {
  day: number | null;
  duty: DayDuty | null;
  isToday: boolean;
  onClick: () => void;
}) {
  if (!day) return <div className="min-h-[80px] rounded-[12px] sm:min-h-[96px]" />;

  const isFlight  = duty?.type === 'flight';
  const hasAction = !!duty && duty.type !== 'rest';

  return (
    <div
      onClick={hasAction ? onClick : undefined}
      style={isToday ? { boxShadow: '0 0 0 1.5px #F5B544, 0 6px 24px rgba(245,181,68,.2)' } : undefined}
      className={[
        'flex min-h-[80px] flex-col rounded-[12px] border bg-white/[.02] p-[7px] transition-all sm:min-h-[96px] sm:p-[9px]',
        isToday ? 'border-board-gold' : 'border-white/7',
        hasAction
          ? 'cursor-pointer hover:-translate-y-[2px] hover:border-white/20 hover:bg-white/[.04]'
          : 'cursor-default',
        isFlight ? 'hover:border-board-flight/40 hover:shadow-[0_8px_24px_rgba(56,189,248,.12)]' : '',
      ].join(' ')}
    >
      {/* Day number */}
      <div className="flex items-center justify-between">
        <span className={`font-jb text-[12px] font-semibold sm:text-[13px] ${isToday ? 'text-board-gold' : 'text-board-muted'}`}>
          {day}
        </span>
        {isToday && (
          <span className="rounded-[4px] bg-board-gold px-[4px] py-0.5 font-jb text-[7px] font-bold tracking-[.1em] text-board-ink sm:text-[8.5px]">
            TODAY
          </span>
        )}
      </div>

      {/* Flight rows */}
      {isFlight && duty?.sectors && (
        <div className="mt-auto flex flex-col gap-[3px]">
          {duty.sectors.map((s, i) => (
            <div key={i} className="flex flex-col gap-px border-l-2 border-board-flight pl-[6px]">
              <div className="font-jb text-[10px] font-bold tracking-[.02em] text-board-flight sm:text-[11px]">
                {s.no}
              </div>
              <div className="flex gap-[2px] font-jb text-[10px] text-board-text sm:text-[11px]">
                {s.from}<span className="text-board-faint">→</span>{s.to}
              </div>
              <div className="hidden font-jb text-[9px] text-board-muted sm:block">
                {s.dep.replace('⁺¹', '')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Layover tag */}
      {duty?.type === 'layover' && (
        <DutyTag className="bg-board-flight/[.08] text-board-flight/70">
          <Moon size={10} /> LAYOVER{duty.at ? ` ${duty.at}` : ''}
        </DutyTag>
      )}

      {/* Standby tag */}
      {duty?.type === 'standby' && (
        <DutyTag className="bg-board-standby/[.08] text-board-standby">
          <ShieldAlert size={10} /> SBY
        </DutyTag>
      )}

      {/* Training tag */}
      {duty?.type === 'training' && (
        <DutyTag className="bg-board-training/10 text-board-training">
          <GraduationCap size={10} /> TRN
        </DutyTag>
      )}

      {/* Off tag */}
      {duty?.type === 'off' && (
        <DutyTag className="bg-board-dayoff/[.07] text-board-dayoff">
          <Bed size={10} /> OFF
        </DutyTag>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[.06] px-1 pb-1 pt-4">
      {([
        ['bg-board-flight',   'Flight'],
        ['bg-board-standby',  'Standby'],
        ['bg-board-dayoff',   'Day off'],
        ['bg-board-training', 'Training'],
      ] as const).map(([bg, label]) => (
        <span key={label} className="inline-flex items-center gap-[7px] font-jb text-[11px] text-board-muted">
          <i className={`h-[8px] w-[8px] rounded-[2px] ${bg}`} /> {label}
        </span>
      ))}
      <span className="inline-flex items-center gap-[7px] font-jb text-[11px] text-board-muted">
        <i className="h-[8px] w-[8px] rounded-[2px] bg-board-flight opacity-40" /> Layover
      </span>
    </div>
  );
}

// ─── Day detail modal ─────────────────────────────────────────────────────────

function DayModal({
  dateLabel, duty, onClose,
}: { dateLabel: string; duty: DayDuty; onClose: () => void }) {
  const typeLabel: Record<DutyType, string> = {
    flight: 'Flight Duty', standby: 'Standby', off: 'Day Off',
    training: 'Training', layover: 'Layover', rest: 'Rest',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(4,7,14,.76)] p-5 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative w-full max-w-[460px] overflow-hidden rounded-[20px] border border-white/10 bg-[#0c1120] p-6"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-white/6 text-board-muted hover:text-board-text"
        >
          <X size={15} />
        </button>

        <div className="font-jb text-[11px] tracking-[.14em] text-board-gold">{dateLabel}</div>
        <div className="mt-1 font-display text-2xl font-extrabold text-board-text">
          {typeLabel[duty.type]}
        </div>

        {duty.note && (
          <div className="mt-2.5 inline-flex items-center gap-2 font-jb text-[12px] text-board-muted">
            <Clock size={12} /> {duty.note}
          </div>
        )}

        {/* Duty times for non-flight */}
        {duty.type !== 'flight' && duty.dutyStart && (
          <div className="mt-2 font-jb text-[12px] text-board-muted">
            {duty.dutyStart} – {duty.dutyEnd || '?'}
          </div>
        )}

        {/* Layover location */}
        {duty.type === 'layover' && duty.at && (
          <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-board-flight/20 bg-board-flight/[.05] px-4 py-3">
            <Moon size={18} className="text-board-flight/60" />
            <div>
              <div className="font-jb text-[11px] text-board-muted">LAYOVER DESTINATION</div>
              <div className="mt-0.5 font-display text-xl font-extrabold text-board-text">{duty.at}</div>
              <div className="font-jb text-[11px] text-board-muted">{cityName(duty.at)}</div>
            </div>
          </div>
        )}

        {/* Sector cards for flights */}
        {duty.type === 'flight' && duty.sectors && (
          <div className="mt-5 flex flex-col gap-3">
            {duty.sectors.map((s, i) => (
              <div key={i} className="rounded-[14px] border border-board-flight/[.18] bg-board-flight/[.05] px-4 py-3.5">
                <div className="font-jb text-[14px] font-bold text-board-flight">
                  {s.no} <span className="ml-1.5 font-medium text-board-faint">{s.ac !== '—' ? s.ac : ''}</span>
                </div>
                <div className="mt-3 flex items-center">
                  {/* DEP */}
                  <div className="flex-1">
                    <div className="font-display text-[26px] font-extrabold leading-none text-board-text">{s.from}</div>
                    <div className="mt-1 flex items-center gap-1.5 font-jb text-[12px] text-board-text">
                      <PlaneTakeoff size={11} className="text-board-flight" /> {s.dep}
                    </div>
                    <div className="mt-0.5 font-jb text-[11px] text-board-muted">{cityName(s.from)}</div>
                  </div>
                  {/* arc */}
                  <div className="flex flex-1 items-center justify-center gap-1.5 px-2">
                    <span className="h-[1.5px] flex-1 rounded bg-[repeating-linear-gradient(90deg,rgba(56,189,248,.4)_0_5px,transparent_5px_10px)]" />
                    <Plane size={13} className="rotate-45 text-board-flight" />
                  </div>
                  {/* ARR */}
                  <div className="flex-1 text-right">
                    <div className="font-display text-[26px] font-extrabold leading-none text-board-text">{s.to}</div>
                    <div className="mt-1 flex items-center justify-end gap-1.5 font-jb text-[12px] text-board-text">
                      <PlaneLanding size={11} className="text-board-flight" /> {s.arr}
                    </div>
                    <div className="mt-0.5 font-jb text-[11px] text-board-muted">{cityName(s.to)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [apiData, setApiData]   = useState<{ pilot: PilotInfo; rosters: SharedRoster[] } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [now, setNow]           = useState(() => DateTime.now());
  const [rosterIdx, setRosterIdx] = useState(0);
  const [view, setView]         = useState<'grid' | 'trips'>('grid');
  const [openDay, setOpenDay]   = useState<{ dateLabel: string; duty: DayDuty } | null>(null);

  // Keep "now" ticking
  useEffect(() => {
    const t = setInterval(() => setNow(DateTime.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch share data
  useEffect(() => {
    if (!token) { setLoading(false); setError('no-token'); return; }
    fetch(`/api/roster/share?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load');
        const rosters = sortRostersChronologically(json.rosters ?? []);
        // Default to current month if available
        const todayFmt = now.toFormat('MMMM yyyy');
        const idx = rosters.findIndex(r => `${r.month} ${r.year}` === todayFmt);
        if (idx >= 0) setRosterIdx(idx);
        setApiData({ ...json, rosters });
      })
      .catch(err => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const rosters = apiData?.rosters ?? [];
  const roster  = rosters[rosterIdx];
  const pilot   = apiData?.pilot;
  const todayStr = now.toFormat('yyyy-MM-dd');

  // Event map for current month
  const eventMap = useMemo(() => {
    const m = new Map<string, DutyEvent[]>();
    for (const e of roster?.events ?? []) {
      const list = m.get(e.date) ?? [];
      list.push(e);
      m.set(e.date, list);
    }
    return m;
  }, [roster]);

  // Calendar matrix
  const weeks = useMemo(() => roster ? buildCalendarMatrix(roster) : [], [roster]);

  // Stats
  const stats = useMemo(() => {
    const events = roster?.events ?? [];
    let fd = 0, sb = 0, sec = 0, off = 0;
    const destSet = new Set<string>();
    for (const e of events) {
      if (e.type === 'FLIGHT') {
        fd++;
        sec++;
        if (e.arrPort && e.arrPort !== pilot?.base) destSet.add(e.arrPort);
      } else if (e.type === 'STANDBY') sb++;
      else if (e.type === 'OFF') off++;
    }
    // Flight days = unique dates with FLIGHT events
    const flightDates = new Set(events.filter(e => e.type === 'FLIGHT').map(e => e.date));
    return {
      blockHours: sumBlockHours(events),
      flightDays: flightDates.size,
      sectors: sec,
      standby: sb,
      daysOff: off,
      destinations: destSet.size,
    };
  }, [roster, pilot?.base]);

  // Trips
  const trips = useMemo(
    () => roster && pilot ? buildTrips(roster, pilot.base) : [],
    [roster, pilot],
  );

  // Destinations (unique non-base arrival airports)
  const destinations = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ code: string; city: string; flag: string }> = [];
    for (const e of roster?.events ?? []) {
      if (e.type === 'FLIGHT' && e.arrPort && e.arrPort !== pilot?.base && !seen.has(e.arrPort)) {
        seen.add(e.arrPort);
        result.push({ code: e.arrPort, city: cityName(e.arrPort), flag: airportFlag(e.arrPort) });
      }
    }
    return result;
  }, [roster, pilot?.base]);

  // UP NEXT (based on all rosters)
  const upNext = useMemo(
    () => apiData ? findUpNext(apiData.rosters, now, apiData.pilot.base) : null,
    [apiData, now],
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-board-ink">
        <Loader2 size={28} className="animate-spin text-board-flight" />
        <p className="font-jb text-[12px] uppercase tracking-[0.3em] text-board-muted">Loading roster…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !apiData || !roster || !pilot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-board-ink p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-red-500/10">
          <AlertCircle size={36} className="text-red-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-extrabold text-board-text">
            {error === 'no-token' ? 'Missing link' : 'Link not found'}
          </h1>
          <p className="mx-auto mt-2 max-w-xs font-jb text-[13px] leading-relaxed text-board-muted">
            {error === 'no-token'
              ? 'This page needs a share link from the pilot.'
              : 'This link may have expired or been reset. Ask the pilot to share a new one.'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full border border-white/12 px-6 py-3 font-jb text-[13px] text-board-muted hover:text-board-text"
        >
          Try again
        </button>
      </div>
    );
  }

  const monthLabel = `${roster.month.toUpperCase()} ${roster.year}`;
  const initials   = pilot.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const upNextLabel = upNext
    ? upNext.daysAway === 0 ? 'DEPARTS TODAY'
    : upNext.daysAway === 1 ? 'DEPARTS TOMORROW'
    : `DEPARTS IN ${upNext.daysAway} DAYS`
    : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-board-ink px-4 py-7 font-display text-board-text sm:px-6 md:py-10">
      {/* Atmospheric glows */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: [
            'radial-gradient(900px 600px at 12% -8%, rgba(56,189,248,.14), transparent 60%)',
            'radial-gradient(800px 500px at 92% 0%, rgba(245,181,68,.10), transparent 55%)',
            'radial-gradient(600px 600px at 80% 100%, rgba(192,132,252,.07), transparent 60%)',
          ].join(', '),
        }}
      />
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 mix-blend-overlay"
        style={{
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-[1080px]">

        {/* ── Ribbon ── */}
        <div className="mb-4 flex items-center justify-between font-jb text-[11px] tracking-[.08em] text-board-muted">
          <span className="inline-flex items-center gap-2 font-semibold text-board-dayoff">
            <span className="h-[7px] w-[7px] rounded-full bg-board-dayoff shadow-[0_0_10px_#34D399]" />
            LIVE · READ-ONLY VIEW
          </span>
          <span className="text-board-faint">
            Shared via <b className="font-bold text-board-text">Otarosta</b>
          </span>
        </div>

        {/* ── Header ── */}
        <header className="mb-5 flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="font-jb text-[11px] font-semibold tracking-[.22em] text-board-gold">
              CREW ROSTER · {pilot.base} BASE
            </div>
            <div className="-ml-[6px] mt-1.5 flex items-center gap-1">
              <NavBtn disabled={rosterIdx <= 0} onClick={() => setRosterIdx(i => i - 1)}>
                <ChevronLeft size={16} />
              </NavBtn>
              <h1 className="m-0 font-display text-[36px] font-extrabold leading-none tracking-[-.02em] sm:text-[48px]">
                {monthLabel}
              </h1>
              <NavBtn disabled={rosterIdx >= rosters.length - 1} onClick={() => setRosterIdx(i => i + 1)}>
                <ChevronRight size={16} />
              </NavBtn>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-[36px] w-[36px] place-items-center rounded-xl border border-board-gold/30 bg-gradient-to-br from-[#1c2438] to-[#0e1424] font-jb text-[13px] font-bold text-board-gold">
                {initials}
              </span>
              <div>
                <div className="text-[15px] font-bold text-board-text">{pilot.full_name}</div>
                {(pilot.rank || pilot.airline) && (
                  <div className="font-jb text-[12px] text-board-muted">
                    {[pilot.rank, pilot.airline].filter(Boolean).join(' · ').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-board-dayoff/25 bg-board-dayoff/10 px-3 py-[7px] font-jb text-[11px] font-semibold tracking-[.05em] text-board-dayoff">
              <Check size={12} strokeWidth={3} /> SYNCED
            </span>
          </div>
        </header>

        {/* ── UP NEXT hero ── */}
        {upNext && upNextLabel && (
          <section className="relative mb-5 overflow-hidden rounded-[20px] border border-white/7 bg-gradient-to-br from-[rgba(20,28,46,.9)] to-[rgba(12,17,30,.7)] px-6 py-6">
            {/* Gold glow */}
            <div
              className="pointer-events-none absolute -right-10 -top-16 h-[260px] w-[260px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(245,181,68,.2), transparent 65%)' }}
            />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 font-jb text-[11px] font-semibold tracking-[.14em] text-board-gold">
                <Moon size={12} /> UP NEXT · {upNextLabel}
              </div>
              {/* Route */}
              <div className="flex max-w-[520px] items-center justify-between">
                <div>
                  <div className="font-display text-[40px] font-extrabold leading-none tracking-[-.02em] sm:text-[46px]">
                    {upNext.fromCode}
                  </div>
                  <div className="mt-1 font-jb text-[12px] text-board-muted">{upNext.fromCity}</div>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1 px-4">
                  <span
                    className="h-0.5 w-full rounded"
                    style={{ background: 'repeating-linear-gradient(90deg,rgba(245,181,68,.5) 0 6px,transparent 6px 12px)' }}
                  />
                  <Plane size={16} className="rotate-45 text-board-gold" />
                  <span className="font-jb text-[10px] tracking-[.1em] text-board-faint">{upNext.ac}</span>
                </div>
                <div className="text-right">
                  <div className="font-display text-[40px] font-extrabold leading-none tracking-[-.02em] sm:text-[46px]">
                    {upNext.toCode}
                  </div>
                  <div className="mt-1 font-jb text-[12px] text-board-muted">{upNext.toCity}</div>
                </div>
              </div>
              {/* Meta row */}
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                <MetaPill label="FLIGHT"  value={upNext.flightNo} />
                {upNext.report !== '—' && <MetaPill label="REPORT"  value={upNext.report} />}
                {upNext.std    !== '—' && <MetaPill label="STD"     value={upNext.std} />}
                {upNext.arr    !== '—' && <MetaPill label="ARR"     value={upNext.arr} />}
                {upNext.layoverNights > 0 && (
                  <MetaPill label="LAYOVER" value={`${upNext.layoverNights} night${upNext.layoverNights > 1 ? 's' : ''}`} accent />
                )}
                {upNext.overnight && upNext.layoverNights === 0 && (
                  <MetaPill label="RETURN" value="Next day" accent />
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Stats snapshot ── */}
        <section className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <StatCard icon={Gauge}       value={stats.blockHours} label="BLOCK HRS"   sub="this month" />
          <StatCard icon={PlaneTakeoff} value={stats.flightDays} label="FLIGHT DAYS" color="text-board-flight" />
          <StatCard icon={Layers}      value={stats.sectors}    label="SECTORS"     color="text-board-flight" />
          <StatCard icon={ShieldAlert} value={stats.standby}    label="STANDBY"     color="text-board-standby" />
          <StatCard icon={Bed}         value={stats.daysOff}    label="DAYS OFF"    color="text-board-dayoff" />
          <StatCard icon={MapPin}      value={stats.destinations} label="DEST."     color="text-board-gold" />
        </section>

        {/* ── Calendar / Trips toggle ── */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex gap-1 rounded-[12px] border border-white/7 bg-white/[.04] p-1">
            {(['grid', 'trips'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={[
                  'inline-flex items-center gap-[7px] rounded-[9px] px-4 py-[8px] font-jb text-[13px] transition-colors',
                  view === v ? 'bg-board-text font-bold text-board-ink' : 'font-semibold text-board-muted hover:text-board-text',
                ].join(' ')}
              >
                {v === 'grid' ? <><CalendarDays size={13} /> Calendar</> : <><Plane size={13} /> Trips</>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Calendar grid ── */}
        {view === 'grid' && (
          <section className="rounded-[20px] border border-white/7 bg-white/[.015] p-3 sm:p-4">
            {/* DOW headers */}
            <div className="mb-2 grid grid-cols-7 gap-1.5 px-0.5">
              {DOW.map((d, i) => (
                <div
                  key={d}
                  className={`pl-1 font-jb text-[9px] tracking-[.12em] sm:text-[10.5px] ${i >= 5 ? 'text-board-gold' : 'text-board-faint'}`}
                >
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
                  const isToday = dateStr === todayStr;
                  const dateLabel = d
                    ? DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy')
                        .set({ day: d }).toFormat('MMM d · yyyy').toUpperCase()
                    : '';
                  return (
                    <DayCell
                      key={di}
                      day={d}
                      duty={duty}
                      isToday={isToday}
                      onClick={() => {
                        if (d && duty) setOpenDay({ dateLabel, duty });
                      }}
                    />
                  );
                })}
              </div>
            ))}
            <Legend />
          </section>
        )}

        {/* ── Trips view ── */}
        {view === 'trips' && (
          <section className="flex flex-col gap-2.5">
            {trips.length === 0 ? (
              <div className="rounded-[20px] border border-white/7 p-8 text-center font-jb text-[13px] text-board-muted">
                No trips found for {roster.month} {roster.year}
              </div>
            ) : trips.map((t, i) => (
              <button
                key={i}
                onClick={() => {
                  // Open modal for the first flight day of this trip
                  const dateStr = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy')
                    .set({ day: t.firstFlightDay }).toFormat('yyyy-MM-dd');
                  const duty = buildDayDuty(eventMap.get(dateStr) ?? []);
                  const dateLabel = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy')
                    .set({ day: t.firstFlightDay }).toFormat('MMM d · yyyy').toUpperCase();
                  if (duty) setOpenDay({ dateLabel, duty });
                }}
                className="flex w-full items-center gap-4 overflow-hidden rounded-[18px] border border-white/7 bg-white/[.02] pr-4 text-left transition-all hover:translate-x-0.5 hover:border-board-flight/30"
              >
                {/* Coloured left bar */}
                <span className="w-[4px] self-stretch bg-board-flight rounded-l-[18px]" />
                {/* Destination stub */}
                <div className="min-w-[110px] border-r border-dashed border-white/10 py-4 pr-4 sm:min-w-[130px]">
                  <div className="font-display text-xl font-extrabold sm:text-2xl">
                    {t.destFlag} {t.destCode}
                  </div>
                  <div className="mt-0.5 font-jb text-[11px] text-board-muted">{t.destCity}</div>
                </div>
                {/* Range + schedule */}
                <div className="min-w-[120px]">
                  <div className="font-jb text-[13px] font-semibold text-board-text">{t.range}</div>
                  <div className="mt-[3px] font-jb text-[11px] text-board-faint">{t.sched}</div>
                </div>
                {/* Tags */}
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {([
                    t.type,
                    `${t.sectors} sector${t.sectors > 1 ? 's' : ''}`,
                  ]).map(tag => (
                    <span key={tag} className="rounded-lg border border-white/10 px-[9px] py-[5px] font-jb text-[10px] text-board-muted">
                      {tag}
                    </span>
                  ))}
                  {t.nights > 0
                    ? <span className="rounded-lg border border-board-gold/30 px-[9px] py-[5px] font-jb text-[10px] text-board-gold">{t.nights}N layover</span>
                    : <span className="rounded-lg border border-board-dayoff/25 px-[9px] py-[5px] font-jb text-[10px] text-board-dayoff">Same-day</span>
                  }
                </div>
                <ArrowRight size={16} className="shrink-0 text-board-faint" />
              </button>
            ))}
          </section>
        )}

        {/* ── Destinations passport ── */}
        {destinations.length > 0 && (
          <section className="mt-5 rounded-[20px] border border-white/7 bg-white/[.015] px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-jb text-[12px] font-semibold tracking-[.1em] text-board-text">
                <Sparkles size={14} className="text-board-gold" /> DESTINATIONS THIS MONTH
              </span>
              <span className="font-jb text-[11px] text-board-faint">
                {destinations.length} {destinations.length === 1 ? 'CITY' : 'CITIES'}
              </span>
            </div>
            <div className={`grid gap-3 ${destinations.length <= 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'}`}>
              {destinations.map(d => (
                <div
                  key={d.code}
                  className="rounded-[14px] border border-dashed border-board-gold/25 bg-board-gold/[.03] px-2 py-4 text-center"
                >
                  <div className="text-[24px] sm:text-[26px]">{d.flag}</div>
                  <div className="mt-1.5 font-display text-lg font-extrabold sm:text-xl">{d.code}</div>
                  <div className="mt-0.5 font-jb text-[10px] text-board-muted">{d.city}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-white/[.06] pt-4 font-jb text-[11px] text-board-muted">
          <span>Otarosta · Your roster, transformed.</span>
          <span className="text-board-faint">Live read-only view</span>
        </footer>
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
