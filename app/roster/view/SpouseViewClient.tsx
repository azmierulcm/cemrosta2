'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import { Plane, Clock, Home, AlertCircle, Loader2, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { getAirportMeta } from '@/lib/utils/destinations';
import type { DutyEvent, RosterData } from '@/lib/types';

interface PilotInfo {
  full_name: string;
  rank?: string;
  airline?: string;
  avatar_url?: string;
  base?: string;
}

type DayStatus = 'HOME' | 'FLIGHT' | 'LAYOVER' | 'STANDBY' | 'DUTY';

function cityName(iata?: string): string {
  if (!iata) return '';
  return getAirportMeta(iata).city;
}

function getDayStatus(dayEvents: DutyEvent[]): DayStatus {
  if (dayEvents.some(e => e.type === 'FLIGHT')) return 'FLIGHT';
  if (dayEvents.some(e => e.type === 'LAYOVER')) return 'LAYOVER';
  if (dayEvents.some(e => e.type === 'STANDBY')) return 'STANDBY';
  if (dayEvents.some(e => e.type === 'TRAINING' || e.type === 'GROUND')) return 'DUTY';
  return 'HOME';
}

function dayStatusColor(status: DayStatus, isToday: boolean): string {
  if (isToday) {
    const base: Record<DayStatus, string> = {
      FLIGHT:  'bg-sky-500 text-white ring-4 ring-sky-200',
      LAYOVER: 'bg-indigo-500 text-white ring-4 ring-indigo-200',
      STANDBY: 'bg-amber-500 text-white ring-4 ring-amber-200',
      DUTY:    'bg-purple-500 text-white ring-4 ring-purple-200',
      HOME:    'bg-emerald-500 text-white ring-4 ring-emerald-200',
    };
    return base[status];
  }
  const base: Record<DayStatus, string> = {
    FLIGHT:  'bg-sky-100 text-sky-700',
    LAYOVER: 'bg-indigo-100 text-indigo-700',
    STANDBY: 'bg-amber-100 text-amber-700',
    DUTY:    'bg-purple-100 text-purple-700',
    HOME:    'bg-emerald-50 text-emerald-700',
  };
  return base[status];
}

interface Trip {
  startDate: DateTime;
  endDate: DateTime;
  cities: string[];
}

function groupUpcomingTrips(events: DutyEvent[], now: DateTime): Trip[] {
  const eventsByDate = new Map<string, DutyEvent[]>();
  for (const e of events) {
    const list = eventsByDate.get(e.date) ?? [];
    list.push(e);
    eventsByDate.set(e.date, list);
  }

  const trips: Trip[] = [];
  let current: Trip | null = null;

  const dates = Array.from(new Set(events.map(e => e.date))).sort();

  for (const dateStr of dates) {
    const dt = DateTime.fromISO(dateStr);
    if (dt < now.startOf('day')) continue;

    const dayEvts = eventsByDate.get(dateStr) ?? [];
    const status = getDayStatus(dayEvts);

    if (status === 'HOME') {
      if (current) { trips.push(current); current = null; }
      continue;
    }

    const awayCities = dayEvts
      .filter(e => e.type === 'FLIGHT' || e.type === 'LAYOVER')
      .flatMap(e => [e.arrPort].filter(Boolean) as string[])
      .filter(c => c !== 'KUL')
      .map(cityName)
      .filter(Boolean);

    if (!current) {
      current = { startDate: dt, endDate: dt, cities: [...new Set(awayCities)] };
    } else {
      current.endDate = dt;
      for (const c of awayCities) {
        if (!current.cities.includes(c)) current.cities.push(c);
      }
    }
  }
  if (current) trips.push(current);
  return trips.slice(0, 3);
}

function getDayDescription(dayEvents: DutyEvent[]): string {
  const flights = dayEvents.filter(e => e.type === 'FLIGHT');
  const layover = dayEvents.find(e => e.type === 'LAYOVER');
  const standby = dayEvents.find(e => e.type === 'STANDBY');

  if (flights.length > 0) {
    const legs = flights.map(f => {
      const from = cityName(f.depPort) || f.depPort || '?';
      const to   = cityName(f.arrPort) || f.arrPort || '?';
      const dep  = f.std ? ` · Departs ${f.std}` : '';
      return `${from} → ${to}${dep}`;
    });
    return legs.join('\n');
  }
  if (layover) {
    const city = cityName(layover.arrPort) || layover.arrPort;
    const hotel = layover.hotel ? ` · ${layover.hotel}` : '';
    return `Layover in ${city}${hotel}`;
  }
  if (standby) {
    const times = standby.signOn && standby.signOff ? ` · ${standby.signOn}–${standby.signOff}` : '';
    return `On standby${times}`;
  }
  return 'Day off · At home';
}

interface HeroStatus {
  label: string;
  subtitle: string;
  tag: string;
  bg: string;
  icon: React.ElementType;
}

function computeHeroStatus(
  events: DutyEvent[],
  now: DateTime,
  homeBase: string,
): HeroStatus {
  const todayStr = now.toFormat('yyyy-MM-dd');
  const todayEvents = events.filter(e => e.date === todayStr);
  const nowTime = now.toFormat('HH:mm');

  const activeFlight = todayEvents.find(e => {
    if (e.type !== 'FLIGHT' || !e.std || !e.sta) return false;
    return nowTime >= e.std && nowTime <= e.sta;
  });

  if (activeFlight) {
    const from = cityName(activeFlight.depPort) || activeFlight.depPort || '';
    const to   = cityName(activeFlight.arrPort) || activeFlight.arrPort || '';
    return {
      label:    'In the Air',
      subtitle: `${from} → ${to}`,
      tag:      activeFlight.sta ? `Lands at ${activeFlight.sta} local` : 'Currently flying',
      bg:       'from-sky-500 to-sky-600',
      icon:     Plane,
    };
  }

  const activeLayover = todayEvents.find(e => e.type === 'LAYOVER');
  if (activeLayover) {
    const city = cityName(activeLayover.arrPort) || activeLayover.arrPort || 'Away';
    const nextHomeDay = findNextHomeDay(events, now);
    const homeIn = nextHomeDay
      ? nextHomeDay.hasSame(now.plus({ days: 1 }), 'day')
        ? 'Back tomorrow'
        : `Back in ${Math.ceil(nextHomeDay.diff(now, 'days').days)} days`
      : '';
    return {
      label:    `On Layover`,
      subtitle: city,
      tag:      homeIn,
      bg:       'from-indigo-500 to-indigo-600',
      icon:     MapPin,
    };
  }

  const activeStandby = todayEvents.find(e => {
    if (e.type !== 'STANDBY' || !e.signOn || !e.signOff) return false;
    return nowTime >= e.signOn && nowTime <= e.signOff;
  });

  if (activeStandby) {
    return {
      label:    'On Standby',
      subtitle: `Available until ${activeStandby.signOff}`,
      tag:      'May be called for a flight',
      bg:       'from-amber-500 to-amber-600',
      icon:     Clock,
    };
  }

  const nextTrip = findNextTripDay(events, now);
  const nextTripLabel = nextTrip
    ? nextTrip.hasSame(now.plus({ days: 1 }), 'day')
      ? 'Next trip tomorrow'
      : `Next trip in ${Math.ceil(nextTrip.diff(now, 'days').days)} days`
    : 'No upcoming trips';

  const base = homeBase ? cityName(homeBase) || homeBase : 'Home Base';
  return {
    label:    'At Home',
    subtitle: base,
    tag:      nextTripLabel,
    bg:       'from-emerald-500 to-emerald-600',
    icon:     Home,
  };
}

function findNextHomeDay(events: DutyEvent[], now: DateTime): DateTime | null {
  const dates = Array.from(new Set(events.map(e => e.date))).sort();
  const eventsByDate = new Map<string, DutyEvent[]>();
  for (const e of events) {
    const list = eventsByDate.get(e.date) ?? [];
    list.push(e);
    eventsByDate.set(e.date, list);
  }
  for (const dateStr of dates) {
    const dt = DateTime.fromISO(dateStr);
    if (dt <= now.startOf('day')) continue;
    const status = getDayStatus(eventsByDate.get(dateStr) ?? []);
    if (status === 'HOME') return dt;
  }
  return null;
}

function findNextTripDay(events: DutyEvent[], now: DateTime): DateTime | null {
  const dates = Array.from(new Set(events.map(e => e.date))).sort();
  const eventsByDate = new Map<string, DutyEvent[]>();
  for (const e of events) {
    const list = eventsByDate.get(e.date) ?? [];
    list.push(e);
    eventsByDate.set(e.date, list);
  }
  for (const dateStr of dates) {
    const dt = DateTime.fromISO(dateStr);
    if (dt <= now.startOf('day')) continue;
    const status = getDayStatus(eventsByDate.get(dateStr) ?? []);
    if (status !== 'HOME') return dt;
  }
  return null;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [data, setData] = useState<{ pilot: PilotInfo; roster: RosterData } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(DateTime.now());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(DateTime.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); setError('Missing share token'); return; }
    fetch(`/api/roster/share?token=${token}`)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load roster');
        setData(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const eventsByDate = useMemo(() => {
    if (!data) return new Map<string, DutyEvent[]>();
    const map = new Map<string, DutyEvent[]>();
    for (const e of data.roster.events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [data]);

  const heroStatus = useMemo(() => {
    if (!data) return null;
    return computeHeroStatus(data.roster.events, now, data.pilot.base ?? 'KUL');
  }, [data, now]);

  const calendarDays = useMemo(() => {
    if (!data) return [];
    const { month, year } = data.roster;
    const start = DateTime.fromFormat(`${month} ${year}`, 'MMMM yyyy');
    if (!start.isValid) return [];
    const daysInMonth = start.daysInMonth ?? 30;
    const firstDow = start.weekday % 7; // 0 = Sun

    const days: Array<{ date: string; dayNum: number; status: DayStatus; isToday: boolean; isFuture: boolean } | null> = [];
    for (let i = 0; i < firstDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = start.set({ day: d });
      const dateStr = dt.toFormat('yyyy-MM-dd');
      const dayEvts = eventsByDate.get(dateStr) ?? [];
      const status = getDayStatus(dayEvts);
      days.push({
        date: dateStr,
        dayNum: d,
        status,
        isToday: dt.hasSame(now, 'day'),
        isFuture: dt > now,
      });
    }
    return days;
  }, [data, eventsByDate, now]);

  const upcomingTrips = useMemo(() => {
    if (!data) return [];
    return groupUpcomingTrips(data.roster.events, now);
  }, [data, now]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-1">
        <Loader2 size={32} className="animate-spin text-accent mb-3" />
        <p className="text-[13px] font-black text-text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (error || !data || !heroStatus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-1 p-8 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-danger/10 flex items-center justify-center mb-6">
          <AlertCircle size={40} className="text-danger" />
        </div>
        <h1 className="text-2xl font-black text-text mb-2">Link not found</h1>
        <p className="text-[14px] text-text-muted font-bold leading-relaxed max-w-xs">
          This link may have expired or been reset. Ask the pilot to share a new one.
        </p>
      </div>
    );
  }

  const { pilot, roster } = data;
  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="min-h-screen bg-surface-1 pb-24">

      {/* ── Hero ── */}
      <div className={`bg-gradient-to-br ${heroStatus.bg} px-6 pt-14 pb-10 rounded-b-[3rem] shadow-xl relative overflow-hidden`}>
        <heroStatus.icon size={140} className="absolute -right-10 -bottom-6 opacity-[0.08]" strokeWidth={1} />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-3">
            {pilot.full_name} · {pilot.rank}
          </p>
          <h1 className="text-4xl font-black tracking-tighter text-white leading-none mb-1">
            {heroStatus.label}
          </h1>
          <p className="text-[18px] font-black text-white/90 mb-4">
            {heroStatus.subtitle}
          </p>
          {heroStatus.tag ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
              <span className="text-[11px] font-black text-white tracking-wide">{heroStatus.tag}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">

        {/* ── Calendar ── */}
        <div className="bg-white rounded-[2rem] p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-subtle">
              {roster.month} {roster.year}
            </h2>
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-text-subtle">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-200 inline-block" />Flying</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-200 inline-block" />Away</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-200 inline-block" />Standby</span>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-text-subtle py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const isSelected = selectedDate === day.date;
              const opacity = !day.isFuture && !day.isToday ? 'opacity-40' : '';
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(isSelected ? null : day.date)}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center
                    text-[12px] font-black transition-all
                    ${dayStatusColor(day.status, day.isToday)}
                    ${opacity}
                    ${isSelected ? 'scale-110 shadow-md' : ''}
                  `}
                >
                  {day.dayNum}
                </button>
              );
            })}
          </div>

          {/* Day detail panel */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-text-subtle">
                  {DateTime.fromISO(selectedDate).toFormat('EEEE, d MMMM')}
                </p>
                <button onClick={() => setSelectedDate(null)} className="text-text-subtle hover:text-text transition-colors">
                  <ChevronUp size={16} />
                </button>
              </div>
              {getDayDescription(selectedEvents).split('\n').map((line, i) => (
                <p key={i} className="text-[14px] font-bold text-text leading-relaxed">{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* ── Upcoming Trips ── */}
        {upcomingTrips.length > 0 && (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-subtle mb-3 px-1">
              Upcoming Trips
            </h2>
            <div className="space-y-3">
              {upcomingTrips.map((trip, i) => {
                const sameMonth = trip.startDate.hasSame(trip.endDate, 'month');
                const dateRange = sameMonth
                  ? `${trip.startDate.toFormat('d')}–${trip.endDate.toFormat('d MMM')}`
                  : `${trip.startDate.toFormat('d MMM')} – ${trip.endDate.toFormat('d MMM')}`;
                const nights = Math.ceil(trip.endDate.diff(trip.startDate, 'days').days);

                return (
                  <div key={i} className="bg-white rounded-[1.75rem] p-5 border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/8 flex items-center justify-center shrink-0">
                      <Plane size={20} className="text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-black text-text leading-tight">
                        {trip.cities.length > 0 ? trip.cities.join(', ') : 'Away'}
                      </p>
                      <p className="text-[12px] font-bold text-text-muted mt-0.5">
                        {dateRange}
                        {nights > 0 ? ` · ${nights} night${nights !== 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="text-center pt-2">
          <p className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em]">
            Shared via Otarosta
          </p>
          <p className="text-[10px] text-text-subtle/60 font-bold mt-1">
            Live read-only view · Updates automatically
          </p>
        </div>

      </div>
    </div>
  );
}
