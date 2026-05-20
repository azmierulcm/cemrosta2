'use client';

import React, { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import { DutyEvent } from '@/lib/types';

/* ── Duty config ──────────────────────────────────────────────────────────── */
const DUTY_CONFIG = {
  FLIGHT: {
    label: 'Flight',
    bg:     'bg-sky-50',
    text:   'text-sky-700',
    dot:    'bg-sky-400',
    pill:   'bg-sky-100 text-sky-700',
    border: 'border-sky-200/60',
  },
  LAYOVER: {
    label: 'Layover',
    bg:     'bg-amber-50',
    text:   'text-amber-800',
    dot:    'bg-amber-400',
    pill:   'bg-amber-100 text-amber-800',
    border: 'border-amber-200/60',
  },
  STANDBY: {
    label: 'Standby',
    bg:     'bg-amber-50',
    text:   'text-amber-800',
    dot:    'bg-amber-400',
    pill:   'bg-amber-100 text-amber-800',
    border: 'border-amber-200/60',
  },
  OFF: {
    label: 'Off',
    bg:     'bg-green-50',
    text:   'text-green-700',
    dot:    'bg-green-400',
    pill:   'bg-green-100 text-green-700',
    border: 'border-green-200/40',
  },
  TRAINING: {
    label: 'Training',
    bg:     'bg-teal-50',
    text:   'text-teal-700',
    dot:    'bg-teal-400',
    pill:   'bg-teal-100 text-teal-700',
    border: 'border-teal-200/60',
  },
  GROUND: {
    label: 'Ground',
    bg:     'bg-teal-50',
    text:   'text-teal-700',
    dot:    'bg-teal-400',
    pill:   'bg-teal-100 text-teal-700',
    border: 'border-teal-200/60',
  },
  OTHER: {
    label: 'Duty',
    bg:     'bg-surface-2',
    text:   'text-text-muted',
    dot:    'bg-text-muted',
    pill:   'bg-surface-2 text-text-muted',
    border: 'border-border',
  },
} as const;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function primaryEvent(events: DutyEvent[]): DutyEvent | undefined {
  return (
    events.find(e => e.type === 'FLIGHT') ??
    events.find(e => e.type !== 'OFF') ??
    events[0]
  );
}

/* ── Day cell ─────────────────────────────────────────────────────────────── */
function DayCell({
  dayNum,
  events,
  isToday,
  isSelected,
  onSelect,
}: {
  dayNum: number;
  events: DutyEvent[];
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const primary = primaryEvent(events);
  const cfg     = primary ? (DUTY_CONFIG[primary.type] ?? DUTY_CONFIG.OTHER) : null;
  const isOff   = primary?.type === 'OFF';
  const sectors = events.filter(e => e.type === 'FLIGHT').length;

  return (
    <div
      onClick={onSelect}
      className={`
        relative flex flex-col items-center justify-center
        rounded-2xl aspect-square cursor-pointer select-none
        transition-all duration-150 hover:opacity-75
        ${cfg && !isOff ? cfg.bg : ''}
      `}
    >
      <span className={`
        text-[13px] font-[700] leading-none font-mono
        ${cfg && !isOff ? cfg.text : isToday ? 'text-accent font-[800]' : 'text-text-subtle'}
      `}>
        {dayNum}
      </span>

      {cfg && !isOff && (
        sectors > 1
          ? <span className={`mt-0.5 text-[7px] font-[800] font-mono opacity-70 ${cfg.text}`}>{sectors}×</span>
          : <div className={`mt-1 w-1 h-1 rounded-full ${cfg.dot} opacity-70`} />
      )}

      {/* Selected ring */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-accent pointer-events-none" />
      )}
      {/* Today ring (unfocused) */}
      {isToday && !isSelected && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-accent/30 pointer-events-none" />
      )}
    </div>
  );
}

/* ── Main calendar ────────────────────────────────────────────────────────── */
export const DutyCalendar = ({ onExport }: { onExport?: () => void } = {}) => {
  const { activeRoster: roster } = useRoster();

  const today    = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  if (!roster) return null;

  const eventsByDate = roster.events.reduce((acc: Record<string, DutyEvent[]>, ev: DutyEvent) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const [firstEvent] = roster.events;
  const dateObj = new Date(firstEvent?.date || `${roster.year}-${roster.month}-01`);
  const year    = dateObj.getFullYear();
  const month   = dateObj.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first: JS getDay() 0=Sun → offset 6, 1=Mon → 0, …
  const firstDayJS = new Date(year, month, 1).getDay();
  const offset     = firstDayJS === 0 ? 6 : firstDayJS - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d       = String(i + 1).padStart(2, '0');
    const m       = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    return { date: dateStr, dayNum: i + 1, events: eventsByDate[dateStr] ?? [] };
  });

  /* ── Selected day detail ── */
  const selEvents  = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];
  const selPrimary = selEvents.length > 0 ? primaryEvent(selEvents) : null;
  const selCfg     = selPrimary ? (DUTY_CONFIG[selPrimary.type] ?? DUTY_CONFIG.OTHER) : null;
  const selFlights = selEvents.filter(e => e.type === 'FLIGHT');
  const selDayNum  = selectedDate ? parseInt(selectedDate.split('-')[2], 10) : null;
  const selLabel   = selDayNum ? `${MONTHS[month].slice(0, 3).toUpperCase()} ${selDayNum}` : null;

  return (
    <div className="space-y-3">

      {/* ── Chrome bar ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface-2 rounded-2xl border border-black/12">
        <span className="text-[13px] font-[800] uppercase tracking-[0.2em] font-mono text-text">
          {MONTHS[month].slice(0, 3).toUpperCase()} {year}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-[800] text-success bg-success/10 px-3 py-1.5 rounded-full">
          <Check size={11} strokeWidth={3} />
          Synced
        </span>
      </div>

      {/* ── Calendar grid ── */}
      <div className="bg-white rounded-2xl border border-border p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[9px] font-[700] text-text-subtle/50 uppercase tracking-wide py-2 font-mono">
              {d}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => (
            <DayCell
              key={day.date}
              dayNum={day.dayNum}
              events={day.events}
              isToday={day.date === todayStr}
              isSelected={day.date === selectedDate}
              onSelect={() => setSelectedDate(day.date)}
            />
          ))}
        </div>
      </div>

      {/* ── Selected day detail ── */}
      {selLabel && (
        <div className="bg-white rounded-2xl border border-border px-4 py-3 flex items-center gap-3 min-h-[52px]">
          {selCfg ? (
            <>
              <span className={`text-[11px] font-[800] font-mono px-3 py-1.5 rounded-full shrink-0 ${selCfg.pill}`}>
                {selLabel}
              </span>

              {selFlights.length > 0 ? (
                <>
                  <span className="text-[14px] font-[800] text-text">
                    {selFlights[0].depPort} → {selFlights[0].arrPort}
                  </span>
                  {selFlights[0].flightNumber && (
                    <span className="text-[11px] font-[800] border border-accent text-accent px-2.5 py-1 rounded-full font-mono shrink-0">
                      {selFlights[0].flightNumber}
                    </span>
                  )}
                  {selFlights[0].std && (
                    <span className="ml-auto text-[12px] font-[600] text-text-muted font-mono shrink-0">
                      {selFlights[0].std}{selFlights[0].sta ? ` → ${selFlights[0].sta}` : ''}
                    </span>
                  )}
                  {selFlights.length > 1 && (
                    <span className="text-[10px] font-[800] text-text-subtle font-mono shrink-0 ml-1">
                      +{selFlights.length - 1}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className={`text-[14px] font-[700] ${selCfg.text}`}>
                    {selPrimary?.description ?? selCfg.label}
                  </span>
                  {(selPrimary?.signOn || selPrimary?.signOff) && (
                    <span className="ml-auto text-[12px] font-[600] text-text-muted font-mono shrink-0">
                      {selPrimary.signOn}{selPrimary.signOff ? ` → ${selPrimary.signOff}` : ''}
                    </span>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <span className="text-[11px] font-[800] font-mono px-3 py-1.5 rounded-full shrink-0 bg-surface-2 text-text-subtle border border-border">
                {selLabel}
              </span>
              <span className="text-[14px] font-[600] text-text-subtle">Rest day</span>
            </>
          )}
        </div>
      )}

      {/* ── Export ── */}
      {onExport && (
        <div className="flex items-center gap-4">
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-2.5 bg-accent text-accent-fg py-4 rounded-2xl font-[800] text-[14px] hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            <Download size={16} strokeWidth={2.5} />
            Export .ics
          </button>
          <div className="flex flex-col gap-1.5 shrink-0">
            {['Google', 'Apple', 'Outlook'].map(name => (
              <span key={name} className="flex items-center gap-1.5 text-[11px] font-[700] text-text-muted">
                <Check size={11} strokeWidth={3} className="text-success" />
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
