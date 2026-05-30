'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRoster } from '@/lib/contexts/RosterContext';
import { DESTINATION_CATALOG, CATALOG_SIZE } from '@/lib/data/destination-catalog';
import { getCoordinates } from '@/lib/utils/geo/haversine';
import { getLifetimeDestinations } from '@/lib/actions/destinations';
import type { Profile, PeriodData, Period, StampItem } from './RosterCard';
import RosterCard from './RosterCard';
import type { DutyEvent } from '@/lib/types';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MONTH_DAYS: Record<string, number> = {
  Jan:31, Feb:28, Mar:31, Apr:30, May:31, Jun:30,
  Jul:31, Aug:31, Sep:30, Oct:31, Nov:30, Dec:31,
};

const COUNTRY_ISO: Record<string, string> = {
  Malaysia:'MY', Singapore:'SG', Thailand:'TH', Indonesia:'ID',
  Philippines:'PH', Vietnam:'VN', Myanmar:'MM', Cambodia:'KH',
  Japan:'JP', 'South Korea':'KR', China:'CN', 'Hong Kong':'HK',
  Taiwan:'TW', Macau:'MO', India:'IN', 'Sri Lanka':'LK',
  Bangladesh:'BD', 'United Kingdom':'GB', France:'FR', Germany:'DE',
  Netherlands:'NL', Spain:'ES', Italy:'IT', Australia:'AU',
  'New Zealand':'NZ', 'United Arab Emirates':'AE', Qatar:'QA',
  'Saudi Arabia':'SA', Turkey:'TR', 'South Africa':'ZA',
  USA:'US', Canada:'CA', Brazil:'BR', Pakistan:'PK', Nepal:'NP', Egypt:'EG',
};

function isoToFlag(code: string): string {
  return code.toUpperCase().split('')
    .map((c) => String.fromCodePoint(0x1F1E0 - 65 + c.charCodeAt(0)))
    .join('');
}

function countryFlag(iata: string): string {
  const entry = DESTINATION_CATALOG.find((d) => d.iata === iata.toUpperCase());
  if (!entry) return '🌏';
  const iso = COUNTRY_ISO[entry.country];
  return iso ? isoToFlag(iso) : '🌏';
}

function iataToCity(iata: string): string {
  return DESTINATION_CATALOG.find((d) => d.iata === iata.toUpperCase())?.city ?? iata;
}

function iataToPin(iata: string): { x: number; y: number; code: string } | null {
  const coords = getCoordinates(iata);
  if (!coords) return null;
  const [lat, lng] = coords;
  return {
    x: Math.round((lng + 180) / 360 * 1000),
    y: Math.round((90 - lat) / 180 * 500),
    code: iata,
  };
}

function topRoute(events: DutyEvent[]): { from: string; to: string; count: number } {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'FLIGHT' && e.depPort && e.arrPort) {
      const key = `${e.depPort}>${e.arrPort}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return { from: 'KUL', to: 'KUL', count: 1 };
  const [pair, count] = top;
  const [from, to] = pair.split('>');
  return { from, to, count };
}

function topDestinations(events: DutyEvent[]) {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'FLIGHT' && e.arrPort && e.arrPort.toUpperCase() !== 'KUL') {
      const key = e.arrPort.toUpperCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([iata, visits]) => ({
      city: iataToCity(iata),
      code: iata,
      flag: countryFlag(iata),
      visits,
      hours: 0,
    }));
}

function uniqueCountries(events: DutyEvent[]): number {
  const countries = new Set(
    events
      .filter((e) => e.type === 'FLIGHT' && e.arrPort)
      .map((e) => {
        const entry = DESTINATION_CATALOG.find((d) => d.iata === e.arrPort!.toUpperCase());
        return entry?.country ?? '';
      })
      .filter(Boolean),
  );
  return countries.size || 1;
}

function mapPins(events: DutyEvent[]): { x: number; y: number; code: string }[] {
  const iatas = Array.from(
    new Set(
      events
        .filter((e) => e.type === 'FLIGHT')
        .flatMap((e) => [e.depPort?.toUpperCase(), e.arrPort?.toUpperCase()])
        .filter(Boolean) as string[],
    ),
  );
  return iatas.map(iataToPin).filter(Boolean) as { x: number; y: number; code: string }[];
}

function rankBadge(rank?: string): string {
  if (!rank) return 'CC';
  if (rank.startsWith('Captain'))        return 'CPT';
  if (rank.startsWith('Senior First'))   return 'SFO';
  if (rank.startsWith('First'))          return 'FO';
  if (rank.startsWith('Second'))         return 'SO';
  if (rank.startsWith('Purser'))         return 'PUR';
  if (rank.startsWith('Senior Cabin'))   return 'SCC';
  if (rank.includes('Cabin'))            return 'CC';
  if (rank.startsWith('Cadet'))          return 'CDT';
  return 'CC';
}

/* ── Build PeriodData from events (full detail) ──────────────────────────── */
function buildFromEvents(
  label: string,
  range: string,
  blockMinutes: number,
  prevBlockMinutes: number,
  events: DutyEvent[],
): PeriodData {
  const hours     = Math.round(blockMinutes / 60);
  const prevHours = Math.round(prevBlockMinutes / 60) || hours;
  const flights   = events.filter((e) => e.type === 'FLIGHT').length;
  const layovers  = events.filter((e) => e.type === 'FLIGHT' && e.hotel).length;
  const dests     = topDestinations(events);
  const top1      = dests[0];
  const top2      = dests[1] ?? top1;

  return {
    label, range, hours, prevHours, flights,
    countries:     uniqueCountries(events),
    layoverNights: layovers,
    nightStops:    layovers,
    topRoute:      topRoute(events),
    longest:       { city: top1?.city ?? 'KUL', code: top1?.code ?? 'KUL', hours: top1 ? top1.visits * 24 : undefined },
    favorite:      { city: top2?.city ?? 'KUL', code: top2?.code ?? 'KUL', rating: undefined },
    destinations:  dests,
    pins:          mapPins(events),
  };
}

/* ── Build PeriodData from summary stats only (no detailed events) ───────── */
function buildFromSummary(
  label: string,
  range: string,
  blockMinutes: number,
  prevBlockMinutes: number,
  totalSectors: number,
  totalUniqueDests: number,
  /* fall back to current-month event-derived data for visuals */
  fallbackEventData: Pick<PeriodData, 'topRoute' | 'destinations' | 'pins' | 'longest' | 'favorite'>,
): PeriodData {
  const hours     = Math.round(blockMinutes / 60);
  const prevHours = Math.round(prevBlockMinutes / 60) || hours;

  return {
    label, range, hours, prevHours,
    flights:       totalSectors,
    countries:     Math.max(1, Math.round(totalUniqueDests * 0.6)), // rough estimate
    layoverNights: Math.round(totalSectors * 0.4),
    nightStops:    Math.round(totalSectors * 0.25),
    topRoute:      fallbackEventData.topRoute,
    longest:       fallbackEventData.longest,
    favorite:      fallbackEventData.favorite,
    destinations:  fallbackEventData.destinations,
    pins:          fallbackEventData.pins,
  };
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function RosterCardWrapper() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { rosters, activeRoster, isLoading, isLoadingList } = useRoster();
  const [allStamps, setAllStamps] = useState<StampItem[]>([]);

  useEffect(() => {
    if (!user) return;
    getLifetimeDestinations(user.uid).then((dests) => {
      setAllStamps(dests.map((d) => ({ iata: d.iata, flag: countryFlag(d.iata) })));
    }).catch(() => {});
  }, [user]);

  const isSpinning = isAuthLoading || (!!user && (isLoadingList || isLoading));

  if (isSpinning) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (!user || !activeRoster) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center px-4">
        <div className="w-14 h-14 rounded-[1.25rem] bg-surface border border-border flex items-center justify-center">
          <UploadCloud size={24} className="text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-text mb-2">No roster yet.</h2>
          <p className="text-[14px] text-text-muted font-bold max-w-xs mx-auto leading-snug">
            Upload your roster PDF to generate your personal share card.
          </p>
        </div>
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-accent text-accent-fg text-[14px] font-black hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
        >
          Upload roster
        </Link>
      </div>
    );
  }

  /* ── Profile ── */
  const displayName = profile?.full_name ?? activeRoster.crewName ?? user.email?.split('@')[0] ?? 'Crew Member';
  const rank  = profile?.rank  ?? 'Cabin Crew';
  const fleet = profile?.fleet ?? profile?.airline ?? '';
  const badge = rankBadge(rank);
  const initials = displayName.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  const handle   = `@${displayName.toLowerCase().replace(/\s+/g, '.')}`;

  /* ── Month period (full events from active roster) ── */
  const events       = activeRoster.events;
  // totalBlockMinutes may live on the summary record since enrichRoster doesn't always set it
  const currentMinutes = activeRoster.totalBlockMinutes ?? rosters[0]?.totalBlockMinutes ?? 0;
  const prevMinutes    = rosters[1]?.totalBlockMinutes ?? currentMinutes;

  const monthIdx  = MONTH_NAMES.indexOf(activeRoster.month);
  const lastDay   = MONTH_DAYS[activeRoster.month] ?? 31;
  const monthLabel = `${activeRoster.month} ${activeRoster.year}`;
  const monthRange = `1 — ${lastDay} ${activeRoster.month} ${activeRoster.year}`;

  const monthPeriod = buildFromEvents(monthLabel, monthRange, currentMinutes, prevMinutes, events);

  /* ── Fallback visuals derived from current-month events ── */
  const fallback = {
    topRoute:     monthPeriod.topRoute,
    destinations: monthPeriod.destinations,
    pins:         monthPeriod.pins,
    longest:      monthPeriod.longest,
    favorite:     monthPeriod.favorite,
  };

  /* ── 6-month period (summary stats only) ── */
  const last6        = rosters.slice(0, 6);
  const last6Minutes = last6.reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0);
  const prev6Minutes = rosters.slice(6, 12).reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0) || last6Minutes;
  const last6Sectors = last6.reduce((s, r) => s + r.totalSectors, 0);
  const last6Dests   = last6.reduce((s, r) => s + r.uniqueDestinations, 0);

  const oldest6 = last6[last6.length - 1];
  const halfRange = last6.length >= 2
    ? `${oldest6.month} ${oldest6.year} — ${last6[0].month} ${last6[0].year}`
    : 'Last 6 months';

  /* ── 12-month period (summary stats only) ── */
  const last12        = rosters.slice(0, 12);
  const last12Minutes = last12.reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0);
  const prev12Minutes = rosters.slice(12, 24).reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0) || last12Minutes;
  const last12Sectors = last12.reduce((s, r) => s + r.totalSectors, 0);
  const last12Dests   = last12.reduce((s, r) => s + r.uniqueDestinations, 0);

  const oldest12 = last12[last12.length - 1];
  const yearRange = last12.length >= 2
    ? `${oldest12.month} ${oldest12.year} — ${last12[0].month} ${last12[0].year}`
    : 'Last 12 months';

  void monthIdx; // suppress unused-variable warning

  const realProfile: Profile = {
    name: displayName,
    handle,
    role:           `${rank}${fleet ? ' · ' + fleet : ''}`,
    badge,
    avatarInitials: initials,
    avatarFrom:     '#e5484d',
    avatarTo:       '#c73d40',
    periods: {
      month: monthPeriod,
      half:  buildFromSummary('Last 6 months',  halfRange,  last6Minutes,  prev6Minutes,  last6Sectors,  last6Dests,  fallback),
      year:  buildFromSummary('Last 12 months', yearRange,  last12Minutes, prev12Minutes, last12Sectors, last12Dests, fallback),
    },
  };

  const availablePeriods: Period[] = ['month'];
  if (rosters.length >= 2) availablePeriods.push('half');
  if (rosters.length >= 6) availablePeriods.push('year');

  return (
    <RosterCard
      profileOverride={realProfile}
      defaultPeriod="month"
      availablePeriods={availablePeriods}
      allStamps={allStamps}
      totalStamps={CATALOG_SIZE}
    />
  );
}
