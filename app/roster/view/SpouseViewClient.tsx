'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import {
  Plane, Clock, Calendar, AlertCircle, Loader2,
  ChevronRight, Building2, User2,
} from 'lucide-react';
import type { RosterData } from '@/lib/types';

interface PilotInfo {
  full_name: string;
  rank?: string;
  airline?: string;
}

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [data, setData] = useState<{ pilot: PilotInfo, roster: RosterData } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(DateTime.now());

  // Update clock every minute for status calculations
  useEffect(() => {
    const timer = setInterval(() => setNow(DateTime.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      setError('Missing share token');
      return;
    }

    fetch(`/api/roster/share?token=${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load roster');
        setData(json);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Status calculation logic
  const currentStatus = useMemo(() => {
    if (!data?.roster?.events) return null;

    const events = data.roster.events;
    const currentTime = now.toFormat('HH:mm');
    const currentDate = now.toFormat('yyyy-MM-dd');

    // Find if there's an event happening right now
    const todayEvents = events.filter(e => e.date === currentDate);

    // 1. Check for Active Flight
    const activeFlight = todayEvents.find(e => {
      if (e.type !== 'FLIGHT' || !e.std || !e.sta) return false;
      return currentTime >= e.std && currentTime <= e.sta;
    });

    if (activeFlight) {
      return {
        type: 'FLIGHT',
        label: 'CURRENT FLIGHT',
        title: `${activeFlight.item || activeFlight.flightNumber} (${activeFlight.depPort} → ${activeFlight.arrPort})`,
        detail: `Arr: ${activeFlight.sta} local`,
        icon: Plane,
        color: 'bg-accent text-accent-fg',
      };
    }

    // 2. Check for Layover
    const activeLayover = todayEvents.find(e => e.type === 'LAYOVER');
    if (activeLayover) {
      return {
        type: 'LAYOVER',
        label: 'ON LAYOVER',
        title: `${activeLayover.arrPort || 'Away Base'}`,
        detail: activeLayover.hotel ? `at ${activeLayover.hotel}` : 'In hotel',
        icon: Building2,
        color: 'bg-indigo-600 text-white',
      };
    }

    // 3. Check for Standby
    const activeStandby = todayEvents.find(e => {
      if (e.type !== 'STANDBY' || !e.signOn || !e.signOff) return false;
      return currentTime >= e.signOn && currentTime <= e.signOff;
    });
    if (activeStandby) {
      return {
        type: 'STANDBY',
        label: 'ON STANDBY',
        title: activeStandby.item || 'Standby Duty',
        detail: `${activeStandby.signOn} - ${activeStandby.signOff}`,
        icon: AlertCircle,
        color: 'bg-amber-500 text-white',
      };
    }

    // 4. Default to Off Duty
    return {
      type: 'OFF',
      label: 'OFF DUTY',
      title: 'At Home Base',
      detail: 'Enjoying some rest',
      icon: Clock,
      color: 'bg-success text-white',
    };
  }, [data, now]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-1 p-6 text-center">
        <Loader2 size={32} className="animate-spin text-accent mb-4" />
        <p className="text-[14px] font-black text-text uppercase tracking-widest">Loading Roster...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-1 p-8 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-danger/10 flex items-center justify-center mb-6">
          <AlertCircle size={40} className="text-danger" />
        </div>
        <h1 className="text-2xl font-black text-text mb-2">Oops! Link invalid</h1>
        <p className="text-[14px] text-text-muted font-bold leading-relaxed max-w-xs mb-8">
          This share link may have expired or been reset by the pilot.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 rounded-full bg-accent text-accent-fg text-[14px] font-black shadow-lg shadow-accent/20"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-1 pb-20">
      {/* ── Header Status Banner ── */}
      {currentStatus && (
        <div className={`${currentStatus.color} px-6 pt-16 pb-8 rounded-b-[3rem] shadow-xl relative overflow-hidden`}>
          {/* Decorative background icon */}
          <currentStatus.icon size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black tracking-widest uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {currentStatus.label}
            </div>
            <h2 className="text-3xl font-black tracking-tighter leading-none mb-1">
              {currentStatus.title}
            </h2>
            <p className="text-[15px] font-bold opacity-90">
              {currentStatus.detail}
            </p>
          </div>
        </div>
      )}

      <div className="px-6 -mt-6">
        {/* ── Pilot Info ── */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-border flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent/5 flex items-center justify-center">
            <User2 className="text-accent" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-subtle leading-none mb-1">
              Active Roster for
            </p>
            <h1 className="text-lg font-black text-text leading-tight">
              {data.pilot.full_name}
            </h1>
            <p className="text-[12px] font-bold text-text-muted">
              {data.pilot.rank} · {data.pilot.airline}
            </p>
          </div>
        </div>

        {/* ── Roster Timeline ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-subtle">
              Upcoming Schedule
            </h3>
            <div className="text-[11px] font-black text-accent uppercase tracking-widest flex items-center gap-1">
              <Calendar size={12} />
              {data.roster.month} {data.roster.year}
            </div>
          </div>

          <div className="space-y-3">
            {data.roster.events.map((event, idx) => {
              const eventDate = DateTime.fromISO(event.date);
              const isPast = eventDate < now.startOf('day');
              const isToday = eventDate.hasSame(now, 'day');

              return (
                <div
                  key={event.id || idx}
                  className={`bg-white rounded-[1.5rem] p-5 border transition-all ${
                    isToday ? 'border-accent shadow-md ring-4 ring-accent/5' : 'border-border'
                  } ${isPast ? 'opacity-50 grayscale-[0.5]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      {/* Date Bubble */}
                      <div className={`shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${
                        isToday ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-text-muted'
                      }`}>
                        <span className="text-[10px] font-black uppercase leading-none mb-0.5">
                          {eventDate.toFormat('ccc')}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {eventDate.toFormat('d')}
                        </span>
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md tracking-widest uppercase ${
                            event.type === 'FLIGHT' ? 'bg-accent/10 text-accent' :
                            event.type === 'LAYOVER' ? 'bg-indigo-100 text-indigo-700' :
                            event.type === 'STANDBY' ? 'bg-amber-100 text-amber-700' :
                            'bg-surface-2 text-text-subtle'
                          }`}>
                            {event.type}
                          </span>
                          {event.item && (
                            <span className="text-[13px] font-black text-text">
                              {event.item}
                            </span>
                          )}
                        </div>

                        <div className="text-[14px] font-bold text-text leading-snug">
                          {event.type === 'FLIGHT' ? (
                            <div className="flex items-center gap-1.5">
                              {event.depPort} <ChevronRight size={12} className="text-text-subtle" /> {event.arrPort}
                            </div>
                          ) : event.type === 'LAYOVER' ? (
                            event.hotel || event.arrPort || 'Layover'
                          ) : event.type === 'STANDBY' ? (
                            event.description || 'Standby Duty'
                          ) : (
                            event.description || event.type
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-text-muted">
                          {(event.std || event.signOn) && (
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              {event.std || event.signOn}
                            </div>
                          )}
                          {(event.sta || event.signOff) && (
                            <div className="flex items-center gap-1">
                              <ChevronRight size={10} className="text-text-subtle" />
                              {event.sta || event.signOff}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side tag */}
                    <div className="flex flex-col items-end gap-1.5">
                      {isToday && (
                        <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer Info ── */}
      <div className="mt-12 px-8 text-center">
        <p className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em] mb-2">
          Shared via SkySchedule
        </p>
        <p className="text-[10px] text-text-subtle font-bold leading-relaxed max-w-[200px] mx-auto">
          Raw data exactly as parsed from the roster. Times are shown in local time.
        </p>
      </div>
    </div>
  );
}
