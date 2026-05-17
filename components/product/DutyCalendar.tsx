'use client';

import React, { useState } from 'react';
import { useRoster } from '@/lib/contexts/RosterContext';
import { DutyEvent } from '@/lib/types';

/* ── Duty type config ─────────────────────────────────────────────────────── */
const DUTY_CONFIG = {
  FLIGHT: {
    label: 'Flight',
    bg: 'bg-[#1C1C1E]',
    text: 'text-white',
    dot: 'bg-[#1C1C1E]',
    pill: 'bg-[#1C1C1E] text-white',
  },
  LAYOVER: {
    label: 'Layover',
    bg: 'bg-accent/10',
    text: 'text-accent',
    dot: 'bg-accent',
    pill: 'bg-accent text-white',
  },
  STANDBY: {
    label: 'Standby',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-400',
    pill: 'bg-amber-100 text-amber-700',
  },
  OFF: {
    label: 'Off',
    bg: '',
    text: 'text-text-subtle',
    dot: '',
    pill: '',
  },
  OTHER: {
    label: 'Duty',
    bg: 'bg-surface-2',
    text: 'text-text-muted',
    dot: 'bg-text-muted',
    pill: 'bg-surface-2 text-text-muted',
  },
} as const;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* ── Tooltip ──────────────────────────────────────────────────────────────── */
function EventTooltip({ event }: { event: DutyEvent }) {
  const cfg = DUTY_CONFIG[event.type] ?? DUTY_CONFIG.OTHER;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
      <div className="bg-[#1C1C1E] text-white rounded-xl px-3 py-2 text-left shadow-xl min-w-[140px] max-w-[180px]">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="text-[9px] font-[800] uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            {cfg.label}
          </span>
          {event.flightNumber && (
            <span className="text-[11px] font-mono font-[600] text-white/80">{event.flightNumber}</span>
          )}
        </div>
        {event.depPort && event.arrPort && (
          <div className="flex items-center gap-1 text-[13px] font-[700] font-mono tracking-wider">
            <span>{event.depPort}</span>
            <span className="text-white/40 mx-0.5">→</span>
            <span>{event.arrPort}</span>
          </div>
        )}
        {event.std && (
          <div className="text-[10px] text-white/50 mt-0.5 font-mono">
            {event.std}{event.sta ? ` – ${event.sta}` : ''}
          </div>
        )}
        {event.hotel && (
          <div className="text-[10px] text-white/50 mt-0.5 truncate">{event.hotel}</div>
        )}
        {event.description && !event.depPort && (
          <div className="text-[11px] text-white/70 mt-0.5 truncate">{event.description}</div>
        )}
      </div>
      {/* Arrow */}
      <div className="flex justify-center -mt-px">
        <div className="w-2 h-2 bg-[#1C1C1E] rotate-45 translate-y-[-4px]" />
      </div>
    </div>
  );
}

/* ── Day cell ─────────────────────────────────────────────────────────────── */
function DayCell({
  dayNum,
  event,
  isToday,
}: {
  dayNum: number;
  event?: DutyEvent;
  isToday: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = event ? (DUTY_CONFIG[event.type] ?? DUTY_CONFIG.OTHER) : null;
  const hasDetail = event && (event.depPort || event.flightNumber || event.description || event.hotel);

  const isFlight = event?.type === 'FLIGHT';
  const isLayover = event?.type === 'LAYOVER';
  const isStandby = event?.type === 'STANDBY';

  return (
    <div
      className="relative flex flex-col"
      onMouseEnter={() => hasDetail && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`
          relative flex flex-col items-center justify-center
          rounded-xl aspect-square transition-all duration-150 select-none
          ${hasDetail ? 'cursor-pointer' : 'cursor-default'}
          ${isFlight
            ? 'bg-[#1C1C1E] shadow-sm'
            : isLayover
              ? 'bg-accent/8 border border-accent/15'
              : isStandby
                ? 'bg-amber-50 border border-amber-200/60'
                : 'border border-transparent'
          }
          ${hovered && hasDetail ? 'scale-105' : ''}
        `}
      >
        <span
          className={`
            text-[13px] font-[600] leading-none font-mono tracking-tight
            ${isFlight ? 'text-white' : isLayover ? 'text-accent' : isStandby ? 'text-amber-600' : isToday ? 'text-accent font-[800]' : 'text-text-muted'}
          `}
        >
          {dayNum}
        </span>

        {/* Type indicator dot */}
        {cfg && event?.type !== 'OFF' && (
          <div
            className={`
              absolute bottom-1.5 w-1 h-1 rounded-full
              ${isFlight ? 'bg-white/40' : isLayover ? 'bg-accent/60' : isStandby ? 'bg-amber-400' : 'bg-text-subtle/40'}
            `}
          />
        )}

        {/* Today ring */}
        {isToday && !event && (
          <div className="absolute inset-0 rounded-xl ring-1 ring-accent/40" />
        )}
      </div>

      {/* Tooltip */}
      {hovered && hasDetail && event && (
        <EventTooltip event={event} />
      )}
    </div>
  );
}

/* ── Main calendar ────────────────────────────────────────────────────────── */
export const DutyCalendar = () => {
  const { activeRoster: roster } = useRoster();
  if (!roster) return null;

  const eventsByDate = roster.events.reduce((acc: Record<string, DutyEvent>, event: DutyEvent) => {
    acc[event.date] = event;
    return acc;
  }, {});

  const [firstEvent] = roster.events;
  const dateObj = new Date(firstEvent?.date || `${roster.year}-${roster.month}-01`);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    return { date: dateStr, dayNum: i + 1, event: eventsByDate[dateStr] };
  });

  // Stats
  const flights = roster.events.filter(e => e.type === 'FLIGHT').length;
  const standby = roster.events.filter(e => e.type === 'STANDBY').length;
  const layovers = roster.events.filter(e => e.type === 'LAYOVER').length;

  return (
    <div className="bg-white rounded-[2rem] border border-border overflow-hidden">

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-[800] uppercase tracking-[0.35em] text-text-subtle font-mono mb-1">
              Duty Map
            </p>
            <h3 className="text-[22px] font-[700] text-text tracking-tight leading-none">
              {MONTHS[month]} {year}
            </h3>
          </div>
          {/* Stat pills */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {flights > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1C1C1E] text-white text-[10px] font-[700] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 inline-block" />
                {flights} flight{flights !== 1 ? 's' : ''}
              </span>
            )}
            {layovers > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-[700] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                {layovers} layover{layovers !== 1 ? 's' : ''}
              </span>
            )}
            {standby > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-[700] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                {standby} standby
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="px-6 py-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div
              key={d}
              className="text-center text-[10px] font-[700] text-text-subtle/60 uppercase tracking-[0.12em] py-2 font-mono"
            >
              {d.charAt(0)}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map(day => (
            <DayCell
              key={day.date}
              dayNum={day.dayNum}
              event={day.event}
              isToday={day.date === todayStr}
            />
          ))}
        </div>
      </div>

      {/* Legend footer */}
      <div className="px-6 pb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] font-[600] text-text-subtle font-mono">
          <div className="w-3 h-3 rounded-sm bg-[#1C1C1E]" />
          Flight
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-[600] text-text-subtle font-mono">
          <div className="w-3 h-3 rounded-sm bg-accent/15 border border-accent/20" />
          Layover
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-[600] text-text-subtle font-mono">
          <div className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200/60" />
          Standby
        </div>
        <div className="ml-auto text-[10px] text-text-subtle/50 font-mono">
          Hover for details
        </div>
      </div>
    </div>
  );
};
