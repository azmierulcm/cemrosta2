'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, Share2, Plane, Car, Home, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import type { DutyEvent } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// FamilyCard — shareable crew schedule view for family members
//
// Surfaces the month as three compact sections:
//   • Trips      — send-off + pick-up PAIRED per flight rotation
//   • Standby    — on-call days shown as compact chips
//   • Free Days  — off days shown as a number grid
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, string> = {
  JAN:'January', FEB:'February', MAR:'March',    APR:'April',
  MAY:'May',     JUN:'June',     JUL:'July',     AUG:'August',
  SEP:'September',OCT:'October', NOV:'November', DEC:'December',
};

function dom(iso: string): number {
  return parseInt(iso.split('-')[2], 10);
}

function formatDate(iso: string, day?: string): string {
  const parts = iso.split('-');
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = parseInt(parts[2], 10);
  const m = months[parseInt(parts[1], 10)];
  const dayLabel = day ? day.slice(0, 3) : '';
  return dayLabel ? `${d} ${m} · ${dayLabel}` : `${d} ${m}`;
}

function addMinutes(time: string, mins: number): string {
  if (!time || !time.includes(':')) return time;
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function subMinutes(time: string, mins: number): string {
  return addMinutes(time, -mins);
}

// ── Data model ────────────────────────────────────────────────────────────────

interface Trip {
  id: string;
  // Outbound (departs base)
  departDate?: string;
  departDay?: string;
  departFlight?: string;
  departRoute?: string;   // "KUL → LHR"
  departTime?: string;    // STD
  // Inbound (arrives base)
  returnDate?: string;
  returnDay?: string;
  returnFlight?: string;
  returnRoute?: string;   // "LHR → KUL"
  returnTime?: string;    // STA
  // Computed
  daysAway?: number;
}

interface StandbyDay {
  date: string;
  day?: string;
  description?: string;
  dutyStart?: string;
  dutyEnd?: string;
}

interface FreeDay {
  date: string;
  day?: string;
}

interface FamilyData {
  trips: Trip[];
  standbyDays: StandbyDay[];
  freeDays: FreeDay[];
}

// ── Derivation ────────────────────────────────────────────────────────────────

function deriveFamily(events: DutyEvent[], base = 'KUL'): FamilyData {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  const sendoffs = sorted.filter(e => e.type === 'FLIGHT' && e.depPort === base);
  const pickups  = sorted.filter(e => e.type === 'FLIGHT' && e.arrPort === base);
  const standby  = sorted.filter(e => e.type === 'STANDBY');
  const off      = sorted.filter(e => e.type === 'OFF');

  // Pair send-offs with their next pick-up greedily
  const usedPickup = new Set<string>();
  const trips: Trip[] = [];

  for (const s of sendoffs) {
    const ret = pickups.find(p => p.date >= s.date && !usedPickup.has(p.date));

    const trip: Trip = {
      id: `trip-${s.date}-${s.flightNumber ?? s.item ?? ''}`,
      departDate:   s.date,
      departDay:    s.day,
      departFlight: s.flightNumber ?? s.item,
      departRoute:  s.depPort && s.arrPort ? `${s.depPort} → ${s.arrPort}` : undefined,
      departTime:   s.std,
    };

    if (ret) {
      usedPickup.add(ret.date);
      trip.returnDate   = ret.date;
      trip.returnDay    = ret.day;
      trip.returnFlight = ret.flightNumber ?? ret.item;
      trip.returnRoute  = ret.depPort && ret.arrPort ? `${ret.depPort} → ${ret.arrPort}` : undefined;
      trip.returnTime   = ret.sta;
      trip.daysAway     = Math.round(
        (new Date(ret.date).getTime() - new Date(s.date).getTime()) / 86_400_000,
      );
    }

    trips.push(trip);
  }

  // Orphan pick-ups (crew departed last month, arrives this month)
  for (const p of pickups) {
    if (!usedPickup.has(p.date)) {
      trips.push({
        id: `ret-${p.date}`,
        returnDate:   p.date,
        returnDay:    p.day,
        returnFlight: p.flightNumber ?? p.item,
        returnRoute:  p.depPort && p.arrPort ? `${p.depPort} → ${p.arrPort}` : undefined,
        returnTime:   p.sta,
      });
    }
  }

  trips.sort((a, b) =>
    (a.departDate ?? a.returnDate ?? '').localeCompare(b.departDate ?? b.returnDate ?? ''),
  );

  return {
    trips,
    standbyDays: standby.map(e => ({
      date: e.date, day: e.day,
      description: e.item,
      dutyStart: e.signOn,
      dutyEnd:   e.signOff,
    })),
    freeDays: off.map(e => ({ date: e.date, day: e.day })),
  };
}

// ── Trip Tile ─────────────────────────────────────────────────────────────────

function TripTile({ trip }: { trip: Trip }) {
  const nightsLabel =
    trip.daysAway != null
      ? `${trip.daysAway} night${trip.daysAway !== 1 ? 's' : ''} away`
      : trip.returnDate && !trip.departDate
        ? 'Returning this month'
        : 'No return this month';

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-white">
      {/* Header strip */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-border">
        <Plane size={11} className="text-slate-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono flex-1">
          {nightsLabel}
        </span>
        {trip.departFlight && trip.returnFlight && trip.departFlight !== trip.returnFlight && (
          <span className="text-[9px] font-bold text-slate-400 font-mono">
            {trip.departFlight} · {trip.returnFlight}
          </span>
        )}
        {(trip.departFlight === trip.returnFlight || (!trip.returnFlight && trip.departFlight)) && (
          <span className="text-[9px] font-bold text-slate-400 font-mono">{trip.departFlight}</span>
        )}
      </div>

      {/* Two halves */}
      <div className="grid grid-cols-2 divide-x divide-border">

        {/* ── Send-off ── */}
        {trip.departDate ? (
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-sky-50 flex items-center justify-center">
                <Plane size={10} className="text-sky-500" style={{ transform: 'rotate(45deg)' }} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-sky-600">Send-off</span>
            </div>
            <div>
              <div className="text-[13px] font-black text-text leading-tight">
                {formatDate(trip.departDate, trip.departDay)}
              </div>
              <div className="text-[11px] font-bold text-text-muted font-mono mt-0.5">
                {trip.departRoute}
              </div>
            </div>
            {trip.departTime && (
              <div className="text-[20px] font-black text-text font-mono leading-none">
                {trip.departTime}
              </div>
            )}
            {trip.departTime && (
              <div className="flex items-center gap-1.5 bg-sky-50 rounded-xl px-2.5 py-1.5">
                <Car size={10} className="text-sky-500 shrink-0" />
                <span className="text-[10px] font-bold text-sky-700 leading-tight">
                  Drop by{' '}
                  <strong className="font-black">{subMinutes(trip.departTime, 150)}</strong>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 flex items-center justify-center">
            <p className="text-[10px] font-bold text-text-subtle text-center italic leading-snug">
              Departed<br />last month
            </p>
          </div>
        )}

        {/* ── Pick-up ── */}
        {trip.returnDate ? (
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-green-50 flex items-center justify-center">
                <Plane size={10} className="text-green-500" style={{ transform: 'rotate(225deg)' }} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Pick-up</span>
            </div>
            <div>
              <div className="text-[13px] font-black text-text leading-tight">
                {formatDate(trip.returnDate, trip.returnDay)}
              </div>
              <div className="text-[11px] font-bold text-text-muted font-mono mt-0.5">
                {trip.returnRoute}
              </div>
            </div>
            {trip.returnTime && (
              <div className="text-[20px] font-black text-text font-mono leading-none">
                {trip.returnTime}
              </div>
            )}
            {trip.returnTime && (
              <div className="flex items-center gap-1.5 bg-green-50 rounded-xl px-2.5 py-1.5">
                <Car size={10} className="text-green-500 shrink-0" />
                <span className="text-[10px] font-bold text-green-700 leading-tight">
                  Pick up at{' '}
                  <strong className="font-black">{addMinutes(trip.returnTime, 40)}</strong>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 flex items-center justify-center">
            <p className="text-[10px] font-bold text-text-subtle text-center italic leading-snug">
              Returns<br />next month
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Standby Section ───────────────────────────────────────────────────────────

function StandbySection({ days }: { days: StandbyDay[] }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-amber-100">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
        <AlertCircle size={11} className="text-amber-500" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700 font-mono">
          Standby · {days.length} {days.length === 1 ? 'day' : 'days'}
        </span>
        <span className="ml-auto text-[9px] font-bold text-amber-500 italic">
          may get called anytime
        </span>
      </div>
      <div className="px-4 py-3 bg-white flex flex-wrap gap-2">
        {days.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 border border-amber-100 bg-amber-50 rounded-xl px-3 py-1.5"
          >
            <span className="text-[14px] font-black text-amber-900 leading-none">{dom(d.date)}</span>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-amber-600 uppercase leading-none">{d.day?.slice(0, 3)}</span>
              {d.dutyStart && (
                <span className="text-[8px] font-mono text-amber-500 leading-none mt-0.5">
                  {d.dutyStart}{d.dutyEnd ? `–${d.dutyEnd}` : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Free Days Section ─────────────────────────────────────────────────────────

function FreeDaysSection({ days }: { days: FreeDay[] }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-green-100">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-b border-green-100">
        <Home size={11} className="text-green-500" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-700 font-mono">
          Free Days · {days.length}
        </span>
        <span className="ml-auto text-[9px] font-bold text-green-500 italic">
          plan something together ✨
        </span>
      </div>
      <div className="px-4 py-3 bg-white flex flex-wrap gap-2">
        {days.map((d, i) => (
          <div
            key={i}
            className="flex flex-col items-center bg-green-50 border border-green-100 rounded-xl px-3 py-2 min-w-[42px]"
          >
            <span className="text-[17px] font-black text-green-800 leading-none">{dom(d.date)}</span>
            <span className="text-[8px] font-bold text-green-500 uppercase mt-0.5 tracking-wide">
              {d.day?.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Check size={16} className="text-text-subtle mb-2" />
      <p className="text-[12px] text-text-muted font-bold">{label}</p>
    </div>
  );
}

// ── Printable card (captured by html-to-image) ────────────────────────────────

interface PrintCardProps {
  crewName: string;
  rank?: string;
  month: string;
  year: string;
  trips: Trip[];
  standbyDays: StandbyDay[];
  freeDays: FreeDay[];
}

const PrintCard = React.forwardRef<HTMLDivElement, PrintCardProps>(
  ({ crewName, rank, month, year, trips, standbyDays, freeDays }, ref) => {
    const monthLabel = MONTH_NAMES[month] ?? month;

    return (
      <div
        ref={ref}
        style={{
          width: 420,
          background: '#FFFCF8',
          fontFamily: 'Inter, -apple-system, sans-serif',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#FF385C,#E61E4D)', padding: '22px 24px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 5 }}>
                Crew Family Hub
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                {crewName.split(' ').slice(0, 2).join(' ')}
              </div>
              {rank && (
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700, marginTop: 3 }}>
                  {rank} · Malaysia Airlines
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Schedule</div>
              <div style={{ color: '#fff', fontSize: 17, fontWeight: 900, letterSpacing: '-0.5px' }}>{monthLabel}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700 }}>{year}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Trips */}
          {trips.map((trip, i) => (
            <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              {/* Trip header */}
              <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace', flex: 1 }}>
                  {trip.daysAway != null ? `${trip.daysAway} night${trip.daysAway !== 1 ? 's' : ''} away` : 'Flight'}
                </span>
                {trip.departFlight && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', fontFamily: 'monospace' }}>
                    {trip.departFlight}{trip.returnFlight && trip.returnFlight !== trip.departFlight ? ` · ${trip.returnFlight}` : ''}
                  </span>
                )}
              </div>

              {/* Two halves */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fff' }}>

                {/* Send-off */}
                {trip.departDate ? (
                  <div style={{ padding: '12px', borderRight: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 8, fontWeight: 900, color: '#0EA5E9', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>🛫 SEND-OFF</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#111', lineHeight: 1.2 }}>{formatDate(trip.departDate, trip.departDay)}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', fontFamily: 'monospace', marginTop: 2 }}>{trip.departRoute}</div>
                    {trip.departTime && (
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#111', fontFamily: 'monospace', marginTop: 6, lineHeight: 1 }}>{trip.departTime}</div>
                    )}
                    {trip.departTime && (
                      <div style={{ marginTop: 8, background: '#EFF6FF', borderRadius: 8, padding: '5px 8px', fontSize: 9, fontWeight: 700, color: '#1D4ED8' }}>
                        🚗 Drop by {subMinutes(trip.departTime, 150)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '12px', borderRight: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, color: '#9CA3AF', fontStyle: 'italic' }}>Departed last month</span>
                  </div>
                )}

                {/* Pick-up */}
                {trip.returnDate ? (
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: 8, fontWeight: 900, color: '#10B981', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>🛬 PICK-UP</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#111', lineHeight: 1.2 }}>{formatDate(trip.returnDate, trip.returnDay)}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', fontFamily: 'monospace', marginTop: 2 }}>{trip.returnRoute}</div>
                    {trip.returnTime && (
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#111', fontFamily: 'monospace', marginTop: 6, lineHeight: 1 }}>{trip.returnTime}</div>
                    )}
                    {trip.returnTime && (
                      <div style={{ marginTop: 8, background: '#ECFDF5', borderRadius: 8, padding: '5px 8px', fontSize: 9, fontWeight: 700, color: '#065F46' }}>
                        🚗 Pick up at {addMinutes(trip.returnTime, 40)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, color: '#9CA3AF', fontStyle: 'italic' }}>Returns next month</span>
                  </div>
                )}

              </div>
            </div>
          ))}

          {/* Standby */}
          {standbyDays.length > 0 && (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #FDE68A' }}>
              <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  ⏳ Standby · {standbyDays.length} days — keep plans flexible
                </span>
              </div>
              <div style={{ background: '#fff', padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {standbyDays.map((d, i) => (
                  <div key={i} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#92400E' }}>{dom(d.date)}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>{d.day?.slice(0, 3)}</span>
                    {d.dutyStart && (
                      <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#B45309' }}>{d.dutyStart}{d.dutyEnd ? `–${d.dutyEnd}` : ''}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Free days */}
          {freeDays.length > 0 && (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #BBF7D0' }}>
              <div style={{ background: '#F0FDF4', borderBottom: '1px solid #BBF7D0', padding: '6px 12px' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#16A34A', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  🏡 Free Days · {freeDays.length} — plan something together ✨
                </span>
              </div>
              <div style={{ background: '#fff', padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {freeDays.map((d, i) => (
                  <div key={i} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '5px 9px', textAlign: 'center', minWidth: 36 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#15803D', lineHeight: 1 }}>{dom(d.date)}</div>
                    <div style={{ fontSize: 7, fontWeight: 700, color: '#16A34A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{d.day?.slice(0, 3)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F7F5F0' }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#B0ABA5', fontFamily: 'monospace' }}>
            cemrosta.io
          </span>
          <span style={{ fontSize: 8, color: '#B0ABA5', fontWeight: 600 }}>
            Generated from official iFlight roster
          </span>
        </div>
      </div>
    );
  },
);
PrintCard.displayName = 'PrintCard';

// ── Main component ────────────────────────────────────────────────────────────

export function FamilyCard() {
  const { activeRoster } = useRoster();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!activeRoster) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
          <Plane size={20} className="text-text-subtle" />
        </div>
        <p className="text-text-muted font-bold text-sm">Upload a roster to generate your Family Hub</p>
      </div>
    );
  }

  const { trips, standbyDays, freeDays } = deriveFamily(activeRoster.events ?? []);

  const crewName   = activeRoster.crewName ?? 'Crew Member';
  const month      = activeRoster.month ?? '';
  const year       = activeRoster.year ?? '';
  const monthLabel = MONTH_NAMES[month] ?? month;

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `cemrosta-family-${month.toLowerCase()}-${year}.png`;
      a.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, month, year]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      if (navigator.share) {
        const blob  = await (await fetch(dataUrl)).blob();
        const file  = new File([blob], `cemrosta-family-${month.toLowerCase()}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `${crewName} · ${monthLabel} Schedule` });
          return;
        }
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Share failed:', err);
    }
  }, [crewName, month, monthLabel]);

  return (
    <div className="space-y-5">

      {/* Hidden printable card */}
      <div className="absolute -left-[9999px] top-0 pointer-events-none" aria-hidden>
        <PrintCard
          ref={cardRef}
          crewName={crewName}
          month={month}
          year={year}
          trips={trips}
          standbyDays={standbyDays}
          freeDays={freeDays}
        />
      </div>

      {/* Card header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono mb-1">
            Family Hub
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-text leading-none">
            {monthLabel} {year}
          </h2>
          <p className="text-[12px] text-text-muted font-bold mt-1">{crewName}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border text-[11px] font-black text-text-muted hover:text-text hover:border-text-subtle transition-all"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Share2 size={12} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-accent-fg text-[11px] font-black shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all disabled:opacity-60"
          >
            <Download size={12} />
            {isDownloading ? 'Saving…' : 'Download Card'}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Rotations', value: trips.length, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'Standby', value: standbyDays.length, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Free Days', value: freeDays.length, color: 'text-green-600 bg-green-50 border-green-100' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black ${s.color}`}>
            <span className="text-[15px] font-black leading-none">{s.value}</span>
            <span className="opacity-70">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Trips */}
      {trips.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-subtle font-mono">Rotations</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <AnimatePresence>
            {trips.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <TripTile trip={trip} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Empty label="No flights departing or arriving base this month" />
      )}

      {/* Standby */}
      {standbyDays.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-subtle font-mono">Standby</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <StandbySection days={standbyDays} />
        </div>
      )}

      {/* Free days */}
      {freeDays.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-subtle font-mono">Free Days</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <FreeDaysSection days={freeDays} />
        </div>
      )}

    </div>
  );
}
