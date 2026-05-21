'use client';

import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2, Plane, Car, Home, Check, Moon } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import type { DutyEvent } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// FamilyCard — warm, magazine-style crew schedule for family members
//
// Design language
//   Font    → Inter throughout (Black 900 / Bold 700 / SemiBold 600)
//             Monospace only for duty-window times in standby chips
//   Palette → #FDF8F4 cream bg · #FF385C red · white sections
//   Spacing → 24px horizontal padding everywhere for alignment rhythm
// ─────────────────────────────────────────────────────────────────────────────

const CREAM = '#FDF8F4';
const RED   = '#FF385C';

const MONTH_NAMES: Record<string, string> = {
  JAN:'January', FEB:'February', MAR:'March',    APR:'April',
  MAY:'May',     JUN:'June',     JUL:'July',     AUG:'August',
  SEP:'September',OCT:'October', NOV:'November', DEC:'December',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function dom(iso: string) { return parseInt(iso.split('-')[2], 10); }

function formatDate(iso: string, day?: string) {
  const [, mm, dd] = iso.split('-');
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(dd,10)} ${months[parseInt(mm,10)]}${day ? ` · ${day.slice(0,3)}` : ''}`;
}

function addMin(time: string, mins: number): string {
  if (!time?.includes(':')) return time ?? '–';
  const [h, m] = time.split(':').map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60) % 24).padStart(2,'0')}:${String(t % 60).padStart(2,'0')}`;
}
function subMin(time: string, mins: number) { return addMin(time, -mins); }

// ── Data models ───────────────────────────────────────────────────────────────

interface Trip {
  id: string;
  departDate?: string; departDay?: string; departFlight?: string;
  departRoute?: string; departTime?: string;
  returnDate?: string; returnDay?: string; returnFlight?: string;
  returnRoute?: string; returnTime?: string;
  daysAway?: number;
}

interface StandbyDay { date: string; day?: string; dutyStart?: string; dutyEnd?: string; }
interface FreeDay    { date: string; day?: string; }

interface FlightCard {
  kind:       'sendoff' | 'pickup';
  badge:      string;       // "2 nights away" | "Same day" | ""
  flight?:    string;       // this leg's number, e.g. "MH4"
  companion?: string;       // paired leg's number, e.g. "MH1"
  date: string; day?: string;
  route?: string; time?: string;
}

// ── Derivation ────────────────────────────────────────────────────────────────

function deriveData(events: DutyEvent[], base = 'KUL') {
  const sorted = [...events].sort((a,b) => a.date.localeCompare(b.date));

  const sends   = sorted.filter(e => e.type === 'FLIGHT' && e.depPort === base);
  const picks   = sorted.filter(e => e.type === 'FLIGHT' && e.arrPort === base);
  const standby = sorted.filter(e => e.type === 'STANDBY');
  const off     = sorted.filter(e => e.type === 'OFF');

  const used  = new Set<string>();
  const trips: Trip[] = [];

  for (const s of sends) {
    const ret = picks.find(p => p.date >= s.date && !used.has(p.date));
    const trip: Trip = {
      id:           `${s.date}-${s.flightNumber ?? ''}`,
      departDate:   s.date,      departDay:    s.day,
      departFlight: s.flightNumber ?? s.item,
      departRoute:  s.depPort && s.arrPort ? `${s.depPort} → ${s.arrPort}` : undefined,
      departTime:   s.std,
    };
    if (ret) {
      used.add(ret.date);
      trip.returnDate   = ret.date;  trip.returnDay    = ret.day;
      trip.returnFlight = ret.flightNumber ?? ret.item;
      trip.returnRoute  = ret.depPort && ret.arrPort ? `${ret.depPort} → ${ret.arrPort}` : undefined;
      trip.returnTime   = ret.sta;
      trip.daysAway     = Math.round((new Date(ret.date).getTime() - new Date(s.date).getTime()) / 86_400_000);
    }
    trips.push(trip);
  }

  // Orphan pick-ups — crew departed last month
  for (const p of picks) {
    if (!used.has(p.date)) {
      trips.push({
        id: `ret-${p.date}`,
        returnDate: p.date, returnDay: p.day,
        returnFlight: p.flightNumber ?? p.item,
        returnRoute: p.depPort && p.arrPort ? `${p.depPort} → ${p.arrPort}` : undefined,
        returnTime: p.sta,
      });
    }
  }

  trips.sort((a,b) => (a.departDate ?? a.returnDate ?? '').localeCompare(b.departDate ?? b.returnDate ?? ''));

  // Flatten trips → individual flight cards, sorted chronologically
  const flightCards: FlightCard[] = [];
  for (const t of trips) {
    const nights = t.daysAway ?? 0;
    const badge  = t.daysAway != null
      ? nights === 0 ? 'Same day' : `${nights} night${nights !== 1 ? 's' : ''} away`
      : '';
    if (t.departDate)
      flightCards.push({
        kind: 'sendoff', badge,
        flight: t.departFlight, companion: t.returnFlight,
        date: t.departDate, day: t.departDay, route: t.departRoute, time: t.departTime,
      });
    if (t.returnDate)
      flightCards.push({
        kind: 'pickup', badge,
        flight: t.returnFlight, companion: t.departFlight,
        date: t.returnDate, day: t.returnDay, route: t.returnRoute, time: t.returnTime,
      });
  }
  flightCards.sort((a,b) => a.date.localeCompare(b.date));

  return {
    flightCards,
    standbyDays: standby.map(e => ({ date:e.date, day:e.day, dutyStart:e.signOn, dutyEnd:e.signOff })),
    freeDays:    off.map(e => ({ date:e.date, day:e.day })),
  };
}

// ── FlightCardTile ────────────────────────────────────────────────────────────
//
// Card hierarchy (top → bottom):
//   1. Badge row   — 🌙 "2 nights away"  |  MH4 · MH1 (small, contextual)
//   2. Kind label  — 🛫 SEND-OFF  (9px Inter Black, coloured)
//   3. Flight no.  — MH4  (26px Inter Black — THE star)
//   4. Date        — 6 May · Wed  (14px Inter Bold)
//   5. Route       — KUL → LHR  (12px Inter SemiBold, muted)
//   6. Time        — 09:53  (38px Inter Black)
//   7. Suggestion  — 🚗 Drop by 07:23  (10px Inter Bold, coloured pill)

function FlightCardTile({ card }: { card: FlightCard }) {
  const isSend     = card.kind === 'sendoff';
  const accentCls  = isSend ? 'text-sky-600'     : 'text-emerald-600';
  const bgPillCls  = isSend ? 'bg-sky-50'        : 'bg-emerald-50';
  const textPillCls= isSend ? 'text-sky-700'     : 'text-emerald-700';
  const carCls     = isSend ? 'text-sky-500'     : 'text-emerald-500';

  const suggestion = card.time
    ? isSend ? `Drop by ${subMin(card.time, 150)}` : `Pick up at ${addMin(card.time, 40)}`
    : null;

  const companionLine = card.companion ? `${card.flight ?? ''} · ${card.companion}` : (card.flight ?? '');

  return (
    <div className="w-full rounded-2xl bg-white border border-border/60 p-4 flex flex-col gap-2.5 shadow-sm">

      {/* 1 — Badge + flight pair */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-red-50 rounded-full px-2 py-0.5 shrink-0">
          <Moon size={9} style={{ color: RED }} />
          <span className="text-[8px] font-black uppercase tracking-[0.12em]" style={{ color: RED }}>
            {card.badge || 'Night Away'}
          </span>
        </div>
        {companionLine && (
          <span className="text-[9px] font-semibold text-text-subtle truncate text-right">
            {companionLine}
          </span>
        )}
      </div>

      {/* 2 — Kind label */}
      <div className={`flex items-center gap-1.5 ${accentCls}`}>
        <Plane
          size={11}
          style={{ transform: isSend ? 'rotate(45deg)' : 'rotate(225deg)' }}
          className="shrink-0"
        />
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">
          {isSend ? 'Send-off' : 'Pick-up'}
        </span>
      </div>

      {/* 3 — Flight number — prominent */}
      <div className="text-[26px] font-black text-text leading-none tracking-tight">
        {card.flight ?? '–'}
      </div>

      {/* 4 + 5 — Date and route */}
      <div className="flex flex-col gap-0.5">
        <div className="text-[13px] font-bold text-text leading-tight">
          {formatDate(card.date, card.day)}
        </div>
        <div className="text-[12px] font-semibold text-text-muted leading-tight">
          {card.route ?? '–'}
        </div>
      </div>

      {/* 6 — Time */}
      <div className="text-[38px] font-black text-text leading-none tracking-tight">
        {card.time ?? '–'}
      </div>

      {/* 7 — Suggestion pill */}
      {suggestion && (
        <div className={`flex items-center gap-1.5 rounded-xl px-3 py-2 ${bgPillCls}`}>
          <Car size={10} className={`${carCls} shrink-0`} />
          <span className={`text-[10px] font-bold leading-tight ${textPillCls}`}>
            {suggestion}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Standby Section ───────────────────────────────────────────────────────────

function StandbySection({ days }: { days: StandbyDay[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-6">
        <div className="flex items-center gap-2">
          <span className="text-[15px] leading-none">⏳</span>
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-900">
            Standby · {days.length} {days.length === 1 ? 'Day' : 'Days'}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-amber-500 italic">Keep plans flexible</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6">
        {days.map((d, i) => (
          <div key={i} className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-[22px] font-black text-amber-900 leading-none">{dom(d.date)}</span>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-wide">{d.day?.slice(0,3)}</span>
            </div>
            {d.dutyStart && (
              <div className="text-[10px] font-semibold text-amber-500 tabular-nums">
                {d.dutyStart}{d.dutyEnd ? `–${d.dutyEnd}` : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Free Days Section ─────────────────────────────────────────────────────────

function FreeDaysSection({ days }: { days: FreeDay[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-6">
        <div className="flex items-center gap-2">
          <Home size={14} className="text-emerald-600 shrink-0" />
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-900">
            Free Days · {days.length}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-500 italic">Plan something together ✨</span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 px-6">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center bg-emerald-50 border border-emerald-100 rounded-xl py-2.5">
            <span className="text-[18px] font-black text-emerald-800 leading-none">{dom(d.date)}</span>
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wide mt-0.5">
              {d.day?.slice(0,3)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PrintCard ─────────────────────────────────────────────────────────────────
//
// Captured off-screen by html-to-image. Uses inline styles only (no Tailwind)
// so the renderer gets guaranteed computed styles.
// Font: Inter via fontFamily stack — matches the web UI exactly.

interface PrintCardProps {
  crewName: string;
  rank?: string;
  month: string;
  year: string;
  flightCards: FlightCard[];
  standbyDays: StandbyDay[];
  freeDays: FreeDay[];
}

const PrintCard = React.forwardRef<HTMLDivElement, PrintCardProps>(
  ({ crewName, rank, month, year, flightCards, standbyDays, freeDays }, ref) => {
    const monthLabel = MONTH_NAMES[month] ?? month;
    const firstName  = crewName.split(' ').slice(0, 2).join(' ');

    const S: React.CSSProperties = { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' };

    return (
      <div ref={ref} style={{ ...S, width:440, background:CREAM, borderRadius:24, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.16)' }}>

        {/* Header */}
        <div style={{ padding:'28px 28px 22px', background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
            {/* Logo + label */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:RED, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff' }}>✈</div>
              <span style={{ ...S, fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'#9CA3AF' }}>Crew Family Hub</span>
            </div>
            {/* Month + year */}
            <div style={{ textAlign:'right' }}>
              <div style={{ ...S, fontSize:30, fontWeight:900, color:RED, letterSpacing:'-1px', lineHeight:1 }}>{monthLabel}</div>
              <div style={{ ...S, fontSize:15, fontWeight:700, color:'#6B7280', marginTop:2 }}>{year}</div>
            </div>
          </div>
          {/* Name */}
          <div style={{ ...S, fontSize:30, fontWeight:900, color:'#111', letterSpacing:'-1px', lineHeight:1.05 }}>{firstName}</div>
          {rank && <div style={{ ...S, fontSize:12, fontWeight:600, color:'#9CA3AF', marginTop:4 }}>{rank} · Malaysia Airlines</div>}
        </div>

        <div style={{ padding:'20px 0', display:'flex', flexDirection:'column', gap:24 }}>

          {/* Flight cards */}
          {flightCards.length > 0 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 24px', marginBottom:12 }}>
                <span style={{ ...S, fontSize:10, fontWeight:900, letterSpacing:'0.22em', textTransform:'uppercase', color:'#6B7280' }}>Flight Duties</span>
                <span style={{ ...S, fontSize:10, fontWeight:800, color:RED, background:'#FFF0F3', border:`1px solid #FFD6DE`, borderRadius:20, padding:'2px 10px' }}>
                  {flightCards.length} {flightCards.length === 1 ? 'Duty' : 'Duties'}
                </span>
              </div>
              <div style={{ display:'flex', gap:10, padding:'0 24px', flexWrap:'wrap' }}>
                {flightCards.map((card, i) => {
                  const isSend = card.kind === 'sendoff';
                  const sugg   = card.time ? (isSend ? `Drop by ${subMin(card.time,150)}` : `Pick up at ${addMin(card.time,40)}`) : null;
                  const pair   = card.companion ? `${card.flight ?? ''} · ${card.companion}` : (card.flight ?? '');
                  return (
                    <div key={i} style={{ width:182, borderRadius:16, background:'#fff', border:'1px solid #E5E7EB', padding:'14px', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:10 }}>
                      {/* Badge row */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4, background:'#FFF0F3', borderRadius:20, padding:'3px 8px' }}>
                          <span style={{ fontSize:8 }}>🌙</span>
                          <span style={{ ...S, fontSize:7, fontWeight:900, color:RED, letterSpacing:'0.12em', textTransform:'uppercase' }}>{card.badge || 'Night Away'}</span>
                        </div>
                        {pair && <span style={{ ...S, fontSize:8, fontWeight:600, color:'#9CA3AF' }}>{pair}</span>}
                      </div>
                      {/* Kind */}
                      <div style={{ display:'flex', alignItems:'center', gap:5, color: isSend ? '#0284C7' : '#059669' }}>
                        <span style={{ fontSize:10 }}>{isSend ? '🛫' : '🛬'}</span>
                        <span style={{ ...S, fontSize:8, fontWeight:900, letterSpacing:'0.18em', textTransform:'uppercase' }}>{isSend ? 'Send-off' : 'Pick-up'}</span>
                      </div>
                      {/* Flight number — big */}
                      <div style={{ ...S, fontSize:24, fontWeight:900, color:'#111', letterSpacing:'-0.5px', lineHeight:1 }}>{card.flight ?? '–'}</div>
                      {/* Date + route */}
                      <div>
                        <div style={{ ...S, fontSize:12, fontWeight:700, color:'#111', lineHeight:1.2 }}>{formatDate(card.date, card.day)}</div>
                        <div style={{ ...S, fontSize:11, fontWeight:600, color:'#6B7280' }}>{card.route}</div>
                      </div>
                      {/* Time */}
                      <div style={{ ...S, fontSize:32, fontWeight:900, color:'#111', letterSpacing:'-1px', lineHeight:1 }}>{card.time || '–'}</div>
                      {/* Suggestion */}
                      {sugg && (
                        <div style={{ background: isSend ? '#EFF6FF' : '#ECFDF5', borderRadius:10, padding:'6px 10px', display:'flex', alignItems:'center', gap:5 }}>
                          <span style={{ fontSize:9 }}>🚗</span>
                          <span style={{ ...S, fontSize:9, fontWeight:700, color: isSend ? '#1D4ED8' : '#065F46' }}>{sugg}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standby */}
          {standbyDays.length > 0 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 24px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:13 }}>⏳</span>
                  <span style={{ ...S, fontSize:10, fontWeight:900, letterSpacing:'0.22em', textTransform:'uppercase', color:'#92400E' }}>Standby · {standbyDays.length} {standbyDays.length === 1 ? 'Day' : 'Days'}</span>
                </div>
                <span style={{ ...S, fontSize:10, fontWeight:600, color:'#D97706', fontStyle:'italic' }}>Keep plans flexible</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, padding:'0 24px' }}>
                {standbyDays.map((d,i) => (
                  <div key={i} style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:14, padding:'10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:5, marginBottom:2 }}>
                      <span style={{ ...S, fontSize:20, fontWeight:900, color:'#92400E', lineHeight:1 }}>{dom(d.date)}</span>
                      <span style={{ ...S, fontSize:9, fontWeight:800, color:'#D97706', textTransform:'uppercase' }}>{d.day?.slice(0,3)}</span>
                    </div>
                    {d.dutyStart && (
                      <div style={{ ...S, fontSize:9, fontWeight:600, color:'#B45309' }}>
                        {d.dutyStart}{d.dutyEnd ? `–${d.dutyEnd}` : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Free days */}
          {freeDays.length > 0 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 24px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:13 }}>🏡</span>
                  <span style={{ ...S, fontSize:10, fontWeight:900, letterSpacing:'0.22em', textTransform:'uppercase', color:'#166534' }}>Free Days · {freeDays.length}</span>
                </div>
                <span style={{ ...S, fontSize:10, fontWeight:600, color:'#16A34A', fontStyle:'italic' }}>Plan something together ✨</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:6, padding:'0 24px' }}>
                {freeDays.map((d,i) => (
                  <div key={i} style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                    <div style={{ ...S, fontSize:16, fontWeight:900, color:'#15803D', lineHeight:1 }}>{dom(d.date)}</div>
                    <div style={{ ...S, fontSize:7, fontWeight:800, color:'#16A34A', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:2 }}>{d.day?.slice(0,3)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ borderTop:'1px solid rgba(0,0,0,0.06)', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
            <span style={{ fontSize:15, lineHeight:1, marginTop:2 }}>🩷</span>
            <div>
              <div style={{ ...S, fontSize:9, fontWeight:700, color:'#6B7280', lineHeight:1.6 }}>Thanks for keeping the skies safe.</div>
              <div style={{ ...S, fontSize:9, fontWeight:600, color:'#9CA3AF', lineHeight:1.5 }}>May your flights be smooth, your layovers short,</div>
              <div style={{ ...S, fontSize:9, fontWeight:600, color:'#9CA3AF' }}>and your hotel curtains actually blackout.</div>
            </div>
          </div>
          <div style={{ ...S, fontSize:8, fontWeight:900, letterSpacing:'0.25em', textTransform:'uppercase', color:'#D1D5DB', textAlign:'right', whiteSpace:'nowrap' }}>
            CEMROSTA.IO
          </div>
        </div>
      </div>
    );
  },
);
PrintCard.displayName = 'PrintCard';

// ── Main component ────────────────────────────────────────────────────────────

export function FamilyCard() {
  const { activeRoster } = useRoster();
  const cardRef            = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied,      setCopied]      = useState(false);

  const month      = activeRoster?.month ?? '';
  const year       = activeRoster?.year  ?? '';
  const crewName   = activeRoster?.crewName ?? 'Crew Member';
  const monthLabel = MONTH_NAMES[month] ?? month;

  const capture = useCallback(async () => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
  }, []);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const url = await capture();
      if (!url) return;
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `cemrosta-family-${month.toLowerCase()}-${year}.png`;
      a.click();
    } catch (e) { console.error(e); }
    finally     { setDownloading(false); }
  }, [capture, downloading, month, year]);

  const handleShare = useCallback(async () => {
    try {
      const url  = await capture();
      if (!url) return;
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `cemrosta-family-${month.toLowerCase()}.png`, { type:'image/png' });
      if (navigator.share && navigator.canShare?.({ files:[file] })) {
        await navigator.share({ files:[file], title:`${crewName} · ${monthLabel} Schedule` });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.error(e); }
  }, [capture, crewName, month, monthLabel]);

  if (!activeRoster) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ background: CREAM }}>
        <Plane size={24} className="text-text-subtle mb-3" />
        <p className="text-[13px] font-bold text-text-muted">Upload a roster to generate your Family Hub</p>
      </div>
    );
  }

  const { flightCards, standbyDays, freeDays } = deriveData(activeRoster.events ?? []);
  const firstName  = crewName.split(' ').slice(0, 2).join(' ');

  return (
    <div style={{ background: CREAM }}>

      {/* Off-screen print card */}
      <div className="absolute -left-[9999px] top-0 pointer-events-none" aria-hidden>
        <PrintCard
          ref={cardRef}
          crewName={crewName}
          month={month}
          year={year}
          flightCards={flightCards}
          standbyDays={standbyDays}
          freeDays={freeDays}
        />
      </div>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="bg-white px-6 pt-7 pb-6 border-b border-border/60">

        {/* Row 1: month+year left, buttons right */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-[28px] font-black leading-none tracking-tight" style={{ color: RED }}>
              {monthLabel}
            </div>
            <div className="text-[14px] font-bold text-text-muted mt-0.5">{year}</div>
          </div>
          <div className="flex gap-2 shrink-0 pt-1">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11px] font-bold text-text-muted hover:text-text hover:border-text-subtle transition-all"
            >
              {copied ? <Check size={11} className="text-green-500" /> : <Share2 size={11} />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-[11px] font-black shadow-md transition-all disabled:opacity-60 active:scale-95"
              style={{ background: RED }}
            >
              <Download size={11} />
              {downloading ? 'Saving…' : 'Download'}
            </button>
          </div>
        </div>

        {/* Row 2: name full width */}
        <h2 className="text-[34px] md:text-[40px] font-black tracking-tight text-text leading-none mb-5">
          {firstName}
        </h2>

        {/* Stats strip */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-red-50 border-red-100 text-[11px] font-bold" style={{ color: RED }}>
            <span className="font-black text-[13px]">{flightCards.length}</span>
            <span className="opacity-80">Flight Duties</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-amber-50 border-amber-100 text-[11px] font-bold text-amber-700">
            <span className="font-black text-[13px]">{standbyDays.length}</span>
            <span className="opacity-80">Standby Days</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-emerald-50 border-emerald-100 text-[11px] font-bold text-emerald-700">
            <span className="font-black text-[13px]">{freeDays.length}</span>
            <span className="opacity-80">Free Days</span>
          </div>
        </div>
      </div>

      {/* ── Flight cards ─────────────────────────────────────────────────────── */}
      {flightCards.length > 0 && (
        <div className="pt-6 pb-4">
          <div className="flex items-center justify-between px-6 mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-text-subtle">
              Flight Duties
            </span>
            <span className="text-[10px] font-black px-3 py-0.5 rounded-full border"
                  style={{ color: RED, background:'#FFF0F3', borderColor:'#FFD6DE' }}>
              {flightCards.length} {flightCards.length === 1 ? 'Duty' : 'Duties'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 px-6">
            {flightCards.map((card, i) => (
              <FlightCardTile key={i} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* ── Standby ──────────────────────────────────────────────────────────── */}
      {standbyDays.length > 0 && (
        <div className="py-6 border-t border-border/50">
          <StandbySection days={standbyDays} />
        </div>
      )}

      {/* ── Free Days ────────────────────────────────────────────────────────── */}
      {freeDays.length > 0 && (
        <div className="py-6 border-t border-border/50">
          <FreeDaysSection days={freeDays} />
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-border/60 px-6 py-5 flex items-start justify-between gap-6">
        <div className="flex items-start gap-3">
          <span className="text-[18px] leading-none mt-0.5">🩷</span>
          <div>
            <p className="text-[12px] font-bold text-text-muted leading-snug">
              Thanks for keeping the skies safe.
            </p>
            <p className="text-[11px] font-semibold text-text-subtle leading-relaxed max-w-xs">
              May your flights be smooth, your layovers short, and your hotel curtains actually blackout.
            </p>
          </div>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.22em] text-text-subtle shrink-0 mt-1">
          CEMROSTA.IO
        </p>
      </div>
    </div>
  );
}
