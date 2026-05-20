'use client';

// ─────────────────────────────────────────────────────────────────────────────
// RosterTile — "Hairline" variant (recommended, per design handoff)
//
// A single calendar cell that represents one duty day.  Displays all data
// points from the AIMS roster: date, leg count, pairing continuation, route
// codes, flight number, STD/STA, next-day flag, work-type chip, crew status,
// and pairing activity.
//
// The component accepts two data shapes:
//   1. A `Duty` object (canonical — preferred for new code)
//   2. A `DutyEvent` + dom number (adapter path — used by DutyCalendar)
//
// Responsive narrowing is handled entirely via CSS container queries defined
// in globals.css — no JS breakpoints needed.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import type { DutyEvent } from '@/lib/types';

// ── Public types ──────────────────────────────────────────────────────────────

export type DutyStatus =
  | 'flight'
  | 'standby'
  | 'training'
  | 'office'
  | 'off'
  | 'annual'
  | 'medical';

export interface TileFlight {
  flightNo: string;
  from: string;
  to: string;
  startTime: string;
  endTime: string;
  endsNextDay?: boolean;
  hasMoreItems?: boolean;
}

export interface Duty {
  date: string;
  dom: number;
  status: DutyStatus;
  workType: string;
  isHoliday?: boolean;
  pairingContinues?: boolean;
  // Flight days — preferred: array; legacy: top-level fields
  flights?: TileFlight[];
  flightNo?: string;
  from?: string;
  to?: string;
  startTime?: string;
  endTime?: string;
  endsNextDay?: boolean;
  hasMoreItems?: boolean;
  // Non-flight days
  legs?: number;
  crewStatus?: string;
  pairingActivity?: string;
  description?: string;  // human-readable label from parser (e.g. "A330 Simulator — OPC Session 31")
}

// ── Adapter: DutyEvent[] → Duty ──────────────────────────────────────────────

const EVENT_STATUS: Record<string, DutyStatus> = {
  FLIGHT:   'flight',
  STANDBY:  'standby',
  LAYOVER:  'standby',
  OFF:      'off',
  TRAINING: 'training',
  GROUND:   'training',
  OTHER:    'off',
};

const EVENT_WORK_TYPE: Record<string, string> = {
  FLIGHT:   'OP',
  STANDBY:  'SBY',
  LAYOVER:  'OP',
  OFF:      'RP',
  TRAINING: 'TR',
  GROUND:   'TR',
  OTHER:    'OFC',
};

const CREW_STATUS_LABEL: Record<string, string> = {
  STANDBY:  'STAND BY',
  LAYOVER:  'LAYOVER',
  TRAINING: 'GRND',
  GROUND:   'GRND',
  OFF:      'REST',
};

/**
 * Convert a group of DutyEvents that all share the same date into a single
 * `Duty` object.  Multiple FLIGHT events on the same date become a multi-leg
 * duty with an explicit `flights` array.
 */
export function dayEventsToDuty(date: string, dom: number, events: DutyEvent[]): Duty {
  const flightEvents = events.filter((e) => e.type === 'FLIGHT');
  const primaryEvent = flightEvents[0] ?? events[0];

  if (!primaryEvent) {
    return { date, dom, status: 'off', workType: 'RP', legs: 0 };
  }

  // ── Flight day ─────────────────────────────────────────────────────────────
  if (flightEvents.length > 0) {
    const flights: TileFlight[] = flightEvents.map((e) => ({
      flightNo:  e.flightNumber ?? '',
      from:      e.depPort      ?? '',
      to:        e.arrPort      ?? '',
      startTime: e.std          ?? '',
      endTime:   e.sta          ?? '',
    }));

    // Detect pairing continuation: last flight doesn't end at the same port as first departed
    const firstDep  = flights[0]?.from;
    const lastArr   = flights[flights.length - 1]?.to;
    const continues = firstDep && lastArr ? firstDep !== lastArr : false;

    return {
      date,
      dom,
      status:           'flight',
      workType:         'OP',
      flights,
      legs:             flights.length,
      pairingContinues: continues,
    };
  }

  // ── Non-flight day ─────────────────────────────────────────────────────────
  const status    = EVENT_STATUS[primaryEvent.type]    ?? 'off';
  const workType  = EVENT_WORK_TYPE[primaryEvent.type] ?? 'OFC';
  const crewStatus = CREW_STATUS_LABEL[primaryEvent.type];

  // For standby/training, show signOn–signOff (duty times)
  const startTime = primaryEvent.signOn  ?? primaryEvent.std  ?? undefined;
  const endTime   = primaryEvent.signOff ?? primaryEvent.sta  ?? undefined;

  // Base port for standby label: no depPort on standby usually, use description
  const from = primaryEvent.depPort ?? undefined;

  return {
    date,
    dom,
    status,
    workType,
    startTime,
    endTime,
    from,
    crewStatus,
    description: primaryEvent.description,
    legs: 0,
  };
}

// ── Status metadata ───────────────────────────────────────────────────────────
// Legacy palette preserved: flight=blue, standby=yellow, off=green, leave=maroon.
// Office shares blue with flight; training gets teal (new, distinct from off).

const STATUS_META: Record<DutyStatus, {
  band: string;
  label: string;
  chipTone: string;
}> = {
  flight:   { band: 'bg-sky-50 text-sky-700',       label: 'Duty',    chipTone: 'sky'    },
  office:   { band: 'bg-sky-50 text-sky-700',        label: 'Office',  chipTone: 'sky'    },
  standby:  { band: 'bg-yellow-50 text-yellow-800',  label: 'Standby', chipTone: 'yellow' },
  off:      { band: 'bg-green-50 text-green-700',    label: 'Off',     chipTone: 'green'  },
  medical:  { band: 'bg-red-50 text-red-900',        label: 'Medical', chipTone: 'maroon' },
  annual:   { band: 'bg-red-50 text-red-900',        label: 'Leave',   chipTone: 'maroon' },
  training: { band: 'bg-teal-50 text-teal-700',      label: 'Sim',     chipTone: 'teal'   },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function LegDots({ count }: { count: number }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      ))}
    </div>
  );
}

function PairingArrow({ on }: { on?: boolean }) {
  if (!on) return null;
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" className="text-current opacity-60" aria-hidden>
      <path
        d="M2 1l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WorkChip({ children, tone }: { children: React.ReactNode; tone: string }) {
  const tones: Record<string, string> = {
    neutral: 'bg-ink-100 text-ink-700',
    sky:     'bg-sky-50 text-sky-700',
    yellow:  'bg-yellow-50 text-yellow-800',
    green:   'bg-green-50 text-green-700',
    teal:    'bg-teal-50 text-teal-700',
    maroon:  'bg-red-50 text-red-900',
  };
  return (
    <span className={`tile-workchip inline-flex items-center rounded px-1.5 py-0.5 text-[12px] font-bold tracking-wider tabular-nums ${tones[tone] ?? tones.neutral}`}>
      {children}
    </span>
  );
}

function MoreDots() {
  return (
    <span className="text-ink-300 tabular-nums text-[14px] leading-none tracking-[0.2em]">···</span>
  );
}

function FlightRows({ f, compact }: { f: TileFlight; compact: boolean }) {
  const py = compact ? 'py-1' : 'py-2';
  return (
    <>
      {/* Route row: KUL · MH786 · HKT */}
      <div className={`tile-route-row tile-pad flex items-center gap-2 px-3 ${py}`}>
        <span className="tile-airport tabular-nums text-[14px] font-semibold text-ink-700">
          {f.from}
        </span>
        <span className="tile-flight-no flex-1 text-center tabular-nums text-[15px] font-bold text-green-700 tracking-tight">
          {f.flightNo}
        </span>
        <span className="tile-airport tabular-nums text-[14px] font-semibold text-ink-700">
          {f.to}
        </span>
      </div>
      {/* Times row: 09:30 → 13:15 */}
      <div className={`tile-pad flex items-center gap-1.5 px-3 ${py}`}>
        <span className="tile-time tabular-nums text-[15px] font-semibold text-ink-900">
          {f.startTime || '—'}
        </span>
        <span className="tile-arrow flex-1 text-center">
          {f.hasMoreItems
            ? <MoreDots />
            : <span className="text-ink-300 tabular-nums text-[13px]">→</span>
          }
        </span>
        <span className="tile-time tabular-nums text-[15px] font-semibold text-ink-900">
          {f.endTime || '—'}
          {f.endsNextDay && <span className="text-brand-600 font-bold">+</span>}
        </span>
      </div>
    </>
  );
}

/** Centred label for non-flight duty body. */
function restLabel(d: Duty): string {
  switch (d.status) {
    case 'standby':  return `Standby · ${d.from ?? 'KUL'}`;
    case 'training': return d.description ?? 'Simulator';
    case 'office':   return `Office · ${d.from ?? 'KUL'}`;
    case 'annual':   return 'Annual leave';
    case 'medical':  return 'Medical leave';
    case 'off':      return 'Rest day';
    default:         return '—';
  }
}

/** Normalize legacy single-flight fields into a `flights` array. */
function getFlights(d: Duty): TileFlight[] | null {
  if (Array.isArray(d.flights) && d.flights.length > 0) return d.flights;
  if (d.flightNo) {
    return [{
      flightNo:    d.flightNo,
      from:        d.from        ?? '',
      to:          d.to          ?? '',
      startTime:   d.startTime   ?? '',
      endTime:     d.endTime     ?? '',
      endsNextDay: d.endsNextDay,
      hasMoreItems: d.hasMoreItems,
    }];
  }
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export interface RosterTileProps {
  duty: Duty;
  onClick?: () => void;
}

export function RosterTile({ duty: d, onClick }: RosterTileProps) {
  const flights  = getFlights(d);
  const multi    = flights !== null && flights.length > 1;
  const legCount = d.legs ?? (flights ? flights.length : 0);
  const m        = STATUS_META[d.status] ?? STATUS_META.flight;
  const isStandby = d.status === 'standby';

  return (
    <article
      className="
        tile-cq
        group relative overflow-hidden bg-white
        border border-neutral-200 rounded-[var(--radius-tile)]
        shadow-[var(--shadow-card)]
        transition-all duration-150
        hover:shadow-[var(--shadow-card-hover)] hover:border-neutral-300
        focus-within:shadow-[var(--shadow-card-hover)] focus-within:border-neutral-300
      "
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* ── Header band — fully tinted with status colour ─────────────────── */}
      <header className={`tile-pad flex items-center gap-2 px-3 pt-2.5 pb-2 ${m.band}`}>
        {/* Date number */}
        <span
          className={`tile-date tabular-nums text-[26px] font-bold leading-none tracking-tight ${
            d.isHoliday ? 'text-brand-700' : 'text-ink-900'
          }`}
        >
          {String(d.dom).padStart(2, '0')}
        </span>

        {/* Status label — hides at narrow widths via container query */}
        <span className="tile-statuslabel text-[11px] font-bold tracking-[0.08em] uppercase">
          {m.label}
        </span>

        {/* Holiday tag */}
        {d.isHoliday && (
          <span className="tile-statuslabel text-[10px] font-bold tracking-[0.1em] uppercase text-brand-700">
            · Hol
          </span>
        )}

        <div className="flex-1" />

        {/* Leg dots */}
        <LegDots count={legCount} />

        {/* Pairing-continues chevron */}
        <PairingArrow on={d.pairingContinues} />
      </header>

      {/* Hairline divider */}
      <div className="tile-route-row-divider border-t border-neutral-100" />

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      {flights ? (
        // Flight day — one FlightRows block per leg, dashed divider between
        flights.map((f, i) => (
          <React.Fragment key={i}>
            <FlightRows f={f} compact={multi} />
            {i < flights.length - 1 && (
              <div className="border-t border-dashed border-neutral-200/70 mx-3" />
            )}
          </React.Fragment>
        ))
      ) : (
        // Non-flight day — centred label
        <div className="tile-route-row tile-pad px-3 py-2">
          <div className="tile-route-label text-center text-[13px] font-semibold text-ink-500 uppercase tracking-wider">
            {restLabel(d)}
          </div>
        </div>
      )}

      {/* Times row — only for non-flight duties that have a clock-in time.
          Annual / medical leave skip this entirely. */}
      {!flights && d.startTime && (
        <>
          <div className="border-t border-neutral-100" />
          <div className="tile-pad flex items-center gap-1.5 px-3 py-2">
            <span className="tile-time tabular-nums text-[15px] font-semibold text-ink-900">
              {d.startTime}
            </span>
            <span className="tile-arrow flex-1 text-center">
              {d.hasMoreItems
                ? <MoreDots />
                : <span className="text-ink-300 tabular-nums text-[13px]">→</span>
              }
            </span>
            <span className="tile-time tabular-nums text-[15px] font-semibold text-ink-900">
              {d.endTime || '—'}
              {d.endsNextDay && <span className="text-brand-600 font-bold">+</span>}
            </span>
          </div>
        </>
      )}

      {/* Hairline divider */}
      <div className="border-t border-neutral-100" />

      {/* ── Footer — work chip + crew status / pairing activity ───────────── */}
      <footer className="tile-pad flex items-center gap-2 px-3 py-2">
        <span className="tile-workchip">
          <WorkChip tone={m.chipTone}>{d.workType}</WorkChip>
        </span>
        <div className="flex-1" />
        {d.crewStatus && (
          <span
            className={`tile-status text-[12.5px] font-bold tracking-[0.08em] uppercase ${
              isStandby ? 'text-brand-600' : 'text-ink-500'
            }`}
          >
            {d.crewStatus}
          </span>
        )}
        {d.pairingActivity && (
          <span className="tile-pairing tabular-nums text-[12.5px] font-semibold text-ink-500 tracking-wider">
            {d.pairingActivity}
          </span>
        )}
      </footer>
    </article>
  );
}
