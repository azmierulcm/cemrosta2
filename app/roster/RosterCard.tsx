"use client";

import { useState } from "react";

/* ============================================================================
 * RosterCard — Instagram Stories-style summary card for pilots & cabin crew
 * 9:16 aspect ratio · Airbnb-inspired aesthetic
 *
 * Usage:
 *   <RosterCard defaultRole="pilot" />
 *   <RosterCard defaultRole="cabin" defaultPeriod="year" />
 * ============================================================================ */

// ---------- types ------------------------------------------------------------

type Role   = "pilot" | "cabin";
type Period = "month" | "half" | "year";

export interface StampItem { iata: string; flag: string }

export interface RosterCardProps {
  defaultRole?:      Role;
  defaultPeriod?:    Period;
  /** When provided, real user data replaces the demo profile and the role toggle is hidden. */
  profileOverride?:  Profile;
  /** Restrict which period tabs are shown. Defaults to all three. */
  availablePeriods?: Period[];
  /** Lifetime earned stamp destinations — shows second stamps card when provided. */
  allStamps?:        StampItem[];
  /** Total stamps in the catalog (denominator). */
  totalStamps?:      number;
}

export type { Profile, PeriodData, Period };

interface Pin       { x: number; y: number; code: string }
interface TopRoute  { from: string; to: string; count: number }
interface Dest      { city: string; code: string; flag: string; visits: number; hours: number }
interface Highlight { city: string; code: string; hours?: number; rating?: number }

interface PeriodData {
  label:         string;
  range:         string;
  hours:         number;
  prevHours:     number;
  flights:       number;
  countries:     number;
  layoverNights: number;
  nightStops:    number;
  topRoute:      TopRoute;
  longest:       Highlight;
  favorite:      Highlight;
  destinations:  Dest[];
  pins:          Pin[];
}

interface Profile {
  name:           string;
  handle:         string;
  role:           string;
  badge:          string;
  avatarInitials: string;
  avatarFrom:     string;
  avatarTo:       string;
  periods:        Record<Period, PeriodData>;
}

// ---------- demo data --------------------------------------------------------

const PROFILES: Record<Role, Profile> = {
  pilot: {
    name: "Capt. Aiman Tan",
    handle: "@aiman.flies",
    role: "Captain · A350-900",
    badge: "PIC",
    avatarInitials: "AT",
    avatarFrom: "#FF385C",
    avatarTo: "#E61E4D",
    periods: {
      month: {
        label: "May 2026",
        range: "1 — 31 May",
        hours: 92,
        prevHours: 82,
        flights: 18,
        countries: 7,
        layoverNights: 11,
        nightStops: 6,
        topRoute: { from: "KUL", to: "NRT", count: 4 },
        longest:  { city: "Tokyo",     code: "NRT", hours: 42 },
        favorite: { city: "Reykjavik", code: "KEF", rating: 4.9 },
        destinations: [
          { city: "Tokyo",  code: "NRT", flag: "JP", visits: 4, hours: 28 },
          { city: "London", code: "LHR", flag: "GB", visits: 2, hours: 24 },
          { city: "Sydney", code: "SYD", flag: "AU", visits: 2, hours: 18 },
        ],
        pins: [
          { x: 745, y: 270, code: "KUL" },
          { x: 800, y: 195, code: "NRT" },
          { x: 500, y: 155, code: "LHR" },
          { x: 855, y: 400, code: "SYD" },
        ],
      },
      half: {
        label: "Last 6 months",
        range: "Dec 2025 — May 2026",
        hours: 512,
        prevHours: 474,
        flights: 102,
        countries: 18,
        layoverNights: 64,
        nightStops: 38,
        topRoute: { from: "KUL", to: "LHR", count: 12 },
        longest:  { city: "London",    code: "LHR", hours: 78 },
        favorite: { city: "Cape Town", code: "CPT", rating: 4.9 },
        destinations: [
          { city: "London", code: "LHR", flag: "GB", visits: 12, hours: 144 },
          { city: "Tokyo",  code: "NRT", flag: "JP", visits: 10, hours: 72 },
          { city: "Sydney", code: "SYD", flag: "AU", visits: 9,  hours: 81 },
        ],
        pins: [
          { x: 745, y: 270, code: "KUL" },
          { x: 500, y: 155, code: "LHR" },
          { x: 800, y: 195, code: "NRT" },
          { x: 855, y: 400, code: "SYD" },
          { x: 615, y: 235, code: "DXB" },
          { x: 525, y: 360, code: "CPT" },
        ],
      },
      year: {
        label: "Last 12 months",
        range: "Jun 2025 — May 2026",
        hours: 982,
        prevHours: 861,
        flights: 198,
        countries: 27,
        layoverNights: 124,
        nightStops: 71,
        topRoute: { from: "KUL", to: "LHR", count: 24 },
        longest:  { city: "Paris",      code: "CDG", hours: 96 },
        favorite: { city: "Queenstown", code: "ZQN", rating: 5.0 },
        destinations: [
          { city: "London", code: "LHR", flag: "GB", visits: 24, hours: 288 },
          { city: "Tokyo",  code: "NRT", flag: "JP", visits: 18, hours: 132 },
          { city: "Paris",  code: "CDG", flag: "FR", visits: 16, hours: 176 },
        ],
        pins: [
          { x: 745, y: 270, code: "KUL" },
          { x: 500, y: 155, code: "LHR" },
          { x: 800, y: 195, code: "NRT" },
          { x: 505, y: 165, code: "CDG" },
          { x: 855, y: 400, code: "SYD" },
          { x: 270, y: 195, code: "JFK" },
          { x: 175, y: 215, code: "LAX" },
          { x: 920, y: 415, code: "ZQN" },
        ],
      },
    },
  },
  cabin: {
    name: "Mei Lin",
    handle: "@meiintheair",
    role: "Senior Cabin Crew · A350",
    badge: "CSS",
    avatarInitials: "ML",
    avatarFrom: "#00A699",
    avatarTo: "#008489",
    periods: {
      month: {
        label: "May 2026",
        range: "1 — 31 May",
        hours: 78,
        prevHours: 71,
        flights: 16,
        countries: 6,
        layoverNights: 10,
        nightStops: 5,
        topRoute: { from: "KUL", to: "DXB", count: 3 },
        longest:  { city: "Dubai",     code: "DXB", hours: 36 },
        favorite: { city: "Melbourne", code: "MEL", rating: 4.8 },
        destinations: [
          { city: "Dubai",     code: "DXB", flag: "AE", visits: 3, hours: 21 },
          { city: "Sydney",    code: "SYD", flag: "AU", visits: 2, hours: 16 },
          { city: "Melbourne", code: "MEL", flag: "AU", visits: 2, hours: 16 },
        ],
        pins: [
          { x: 745, y: 270, code: "KUL" },
          { x: 615, y: 235, code: "DXB" },
          { x: 855, y: 400, code: "SYD" },
          { x: 850, y: 415, code: "MEL" },
        ],
      },
      half: {
        label: "Last 6 months",
        range: "Dec 2025 — May 2026",
        hours: 445,
        prevHours: 412,
        flights: 90,
        countries: 17,
        layoverNights: 58,
        nightStops: 32,
        topRoute: { from: "KUL", to: "DXB", count: 14 },
        longest:  { city: "Istanbul", code: "IST", hours: 68 },
        favorite: { city: "Auckland", code: "AKL", rating: 4.9 },
        destinations: [
          { city: "Dubai",    code: "DXB", flag: "AE", visits: 14, hours: 98 },
          { city: "Sydney",   code: "SYD", flag: "AU", visits: 11, hours: 99 },
          { city: "Istanbul", code: "IST", flag: "TR", visits: 9,  hours: 90 },
        ],
        pins: [
          { x: 745, y: 270, code: "KUL" },
          { x: 615, y: 235, code: "DXB" },
          { x: 855, y: 400, code: "SYD" },
          { x: 555, y: 195, code: "IST" },
          { x: 925, y: 410, code: "AKL" },
        ],
      },
      year: {
        label: "Last 12 months",
        range: "Jun 2025 — May 2026",
        hours: 860,
        prevHours: 786,
        flights: 176,
        countries: 25,
        layoverNights: 115,
        nightStops: 64,
        topRoute: { from: "KUL", to: "DXB", count: 26 },
        longest:  { city: "Paris",     code: "CDG", hours: 84 },
        favorite: { city: "Reykjavik", code: "KEF", rating: 5.0 },
        destinations: [
          { city: "Dubai",  code: "DXB", flag: "AE", visits: 26, hours: 182 },
          { city: "Sydney", code: "SYD", flag: "AU", visits: 19, hours: 171 },
          { city: "Paris",  code: "CDG", flag: "FR", visits: 14, hours: 126 },
        ],
        pins: [
          { x: 745, y: 270, code: "KUL" },
          { x: 615, y: 235, code: "DXB" },
          { x: 855, y: 400, code: "SYD" },
          { x: 505, y: 165, code: "CDG" },
          { x: 470, y: 115, code: "KEF" },
          { x: 270, y: 195, code: "JFK" },
        ],
      },
    },
  },
};

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "half",  label: "6 months" },
  { id: "year",  label: "Year" },
];

// ---------- tiny icons (inline so it's drop-in) ------------------------------

const Icon = ({ d, className = "h-4 w-4" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const ICONS = {
  plane:      "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-3 3-2-.5c-.4-.1-.8 0-1 .3l-.3.3c-.3.4-.3 1 .1 1.3L6 18l1.8 2.8c.3.4.9.4 1.3.1l.3-.3c.3-.2.4-.6.3-1l-.5-2 3-3 4.3 4.8c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1Z",
  pin:        "M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  moon:       "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  bed:        "M3 18v-4a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4M3 18h18M3 18v2M21 18v2M7 11V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3",
  globe:      "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.5 4-6 4-9s-1.5-6.5-4-9m0 18c-2.5-2.5-4-6-4-9s1.5-6.5 4-9M3.5 9h17M3.5 15h17",
  trend:      "M3 17l6-6 4 4 8-8M14 7h7v7",
  heart:      "M20.8 7.6a5 5 0 0 0-8.8-2.7 5 5 0 1 0-7.6 6.4l7.6 8 7.6-8a5 5 0 0 0 1.2-3.7Z",
  star:       "M12 2.5 14.6 8 21 8.9l-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 8.9 9.4 8 12 2.5Z",
  share:      "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  sparkle:    "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8",
};

// ---------- helpers ----------------------------------------------------------

const fmt = (n: number) => n.toLocaleString();
const pctDelta = (now: number, prev: number) => Math.round(((now - prev) / prev) * 100);

// ---------- component --------------------------------------------------------

const MAX_STAMPS_GRID = 32; // 4 cols × 8 rows

function handleShare() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'My Roster Card', url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).catch(() => {});
  }
}

export default function RosterCard({ defaultRole = "pilot", defaultPeriod = "month", profileOverride, availablePeriods, allStamps, totalStamps = 72 }: RosterCardProps) {
  const [role, setRole]     = useState<Role>(defaultRole);
  const [period, setPeriod] = useState<Period>(defaultPeriod);

  const tabs    = availablePeriods ? PERIOD_TABS.filter((t) => availablePeriods.includes(t.id)) : PERIOD_TABS;
  const profile = profileOverride ?? PROFILES[role];
  const data    = profile.periods[period];
  const delta    = pctDelta(data.hours, data.prevHours);
  const positive = delta >= 0;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Role toggle only shown in demo mode */}
      {!profileOverride && (
        <div className="flex items-center gap-2 text-[13px]">
          <RoleToggle role={role} setRole={setRole} />
        </div>
      )}

      {/* The story card — locked to 9:16 (Instagram Stories) */}
      <div
        className="relative w-full max-w-[420px] aspect-[9/16] overflow-hidden rounded-[36px] bg-[#FFFCF8] text-[#222222]
                   shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25),0_8px_24px_-12px_rgba(0,0,0,0.15)]
                   ring-1 ring-black/5"
        style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" }}
      >
        {/* soft background flourish */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#FF385C]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#00A699]/10 blur-3xl" />

        <div className="relative flex h-full flex-col p-6">
          {/* ---------- Header ---------- */}
          <header className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-full text-[15px] font-semibold text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${profile.avatarFrom}, ${profile.avatarTo})` }}
              >
                {profile.avatarInitials}
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <p className="text-[15px] font-semibold tracking-tight">{profile.name}</p>
                  <span className="rounded-full bg-[#222222] px-1.5 py-[1px] text-[9px] font-semibold tracking-wide text-white">
                    {profile.badge}
                  </span>
                </div>
                <p className="text-[12px] text-[#717171]">{profile.role}</p>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-[#222] ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
              aria-label="Share"
            >
              <Icon d={ICONS.share} className="h-4 w-4" />
            </button>
          </header>

          {/* ---------- Period tabs (segmented) ---------- */}
          {tabs.length > 1 && (
            <div className="mt-5 flex rounded-full bg-[#F1EFE8] p-1 text-[12px] font-medium">
              {tabs.map((t) => {
                const active = t.id === period;
                return (
                  <button
                    key={t.id}
                    onClick={() => setPeriod(t.id)}
                    className={[
                      "flex-1 rounded-full py-2 transition",
                      active ? "bg-white text-[#222] shadow-sm" : "text-[#717171] hover:text-[#222]",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ---------- Hero stat ---------- */}
          <section className="mt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#FF385C]">
              {data.label}
            </p>
            <div className="mt-1 flex items-end gap-2">
              <h1 className="text-[64px] font-semibold leading-none tracking-tight">
                {fmt(data.hours)}
              </h1>
              <span className="mb-2 text-[14px] font-medium text-[#717171]">hrs in the air</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={[
                  "inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-semibold",
                  positive ? "bg-[#E8F5EF] text-[#0F6E56]" : "bg-[#FBEAF0] text-[#993556]",
                ].join(" ")}
              >
                <Icon d={positive ? ICONS.trend : ICONS.arrowRight} className="h-3 w-3" />
                {positive ? "+" : ""}{delta}% vs prev
              </span>
              <span className="text-[11px] text-[#717171]">· {data.range}</span>
            </div>
          </section>

          {/* ---------- 4-up stats ---------- */}
          <section className="mt-4 grid grid-cols-4 gap-2">
            <Stat icon={ICONS.plane}  value={fmt(data.flights)}       label="Flights" />
            <Stat icon={ICONS.globe}  value={fmt(data.countries)}     label="Countries" />
            <Stat icon={ICONS.bed}    value={fmt(data.layoverNights)} label="Layovers" />
            <Stat icon={ICONS.moon}   value={fmt(data.nightStops)}    label="Night stops" />
          </section>

          {/* ---------- Map module ---------- */}
          <section className="mt-4 overflow-hidden rounded-2xl bg-[#F7F5F0] ring-1 ring-black/5">
            <div className="flex items-center justify-between px-3 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#222]">
                Where you flew
              </p>
              <span className="rounded-full bg-white px-2 py-[2px] text-[10px] font-semibold text-[#222] ring-1 ring-black/5">
                {data.topRoute.from} → {data.topRoute.to} · {data.topRoute.count}×
              </span>
            </div>
            <WorldMap pins={data.pins} topRoute={data.topRoute} />
          </section>

          {/* ---------- Top destinations list ---------- */}
          <section className="mt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#717171]">
              Top destinations
            </p>
            <ul className="space-y-1">
              {data.destinations.map((d, i) => (
                <li
                  key={d.code}
                  className="flex items-center justify-between rounded-xl bg-white px-2.5 py-1.5 ring-1 ring-black/5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFE9EE] text-[10px] font-bold tracking-tight text-[#FF385C]">
                      {d.flag}
                    </span>
                    <div className="leading-tight">
                      <p className="text-[12px] font-semibold">
                        {d.city} <span className="text-[#717171] font-normal">· {d.code}</span>
                      </p>
                      <p className="text-[10px] text-[#717171]">{d.visits} visits · {d.hours}h</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#717171]">#{i + 1}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ---------- Highlights ---------- */}
          <section className="mt-3 grid grid-cols-2 gap-2">
            <HighlightCard
              accent="#FF385C" bg="#FFE9EE"
              icon={ICONS.bed}   label="Longest layover"
              title={data.longest.city}
              value={data.longest.hours != null ? `${data.longest.hours}h` : data.longest.code}
            />
            <HighlightCard
              accent="#00A699" bg="#E1F5EE"
              icon={ICONS.pin} label="Most visited city"
              title={data.destinations[0]?.city ?? '—'}
              value={data.destinations[0] ? `${data.destinations[0].visits} visits · ${data.destinations[0].code}` : '—'}
            />
          </section>

          {/* ---------- Footer ---------- */}
          <footer className="mt-auto flex items-center justify-between pt-4">
            <div className="flex items-center gap-1.5 text-[11px] text-[#717171]">
              <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-[#FF385C] text-white">
                <Icon d={ICONS.plane} className="h-3 w-3" />
              </span>
              <span className="font-semibold tracking-tight text-[#222]">
                otarosta<span className="text-[#FF385C]">.com</span>
              </span>
              <span className="text-[#DDDDDD]">|</span>
              <span>{profile.handle}</span>
            </div>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-full bg-[#222] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-black"
            >
              Share story <Icon d={ICONS.arrowRight} className="h-3 w-3" />
            </button>
          </footer>
        </div>
      </div>

      {/* ── Second card: Stamps collection ── */}
      {allStamps && allStamps.length > 0 && (
        <div
          className="relative w-full max-w-[420px] aspect-[9/16] overflow-hidden rounded-[36px] bg-[#0E1E30] text-white
                     shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35),0_8px_24px_-12px_rgba(0,0,0,0.2)]
                     ring-1 ring-white/10"
          style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" }}
        >
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#C8A84B]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#C8A84B]/8 blur-3xl" />

          <div className="relative flex h-full flex-col p-6">
            {/* Header */}
            <header className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C8A84B]/70 mb-1">Otarosta</p>
                <h2 className="text-[22px] font-semibold tracking-tight leading-tight">Stamp Collection</h2>
              </div>
              <div className="text-right">
                <p className="text-[28px] font-bold leading-none tracking-tight text-[#C8A84B]">{allStamps.length}</p>
                <p className="text-[11px] text-white/50 font-medium">/ {totalStamps} stamps</p>
              </div>
            </header>

            {/* Dashed divider */}
            <div className="w-full border-t border-dashed border-[#C8A84B]/30 mb-4" />

            {/* Stamps grid or count fallback */}
            {allStamps.length <= MAX_STAMPS_GRID ? (
              <div className="grid grid-cols-4 gap-2 flex-1 content-start">
                {allStamps.map(({ iata, flag }) => (
                  <div
                    key={iata}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-white/5 ring-1 ring-white/10 py-2.5 px-1"
                  >
                    <span className="text-[18px] leading-none">{flag}</span>
                    <span className="text-[9px] font-bold tracking-wider text-white/80 mt-0.5">{iata}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <div className="flex flex-col items-center justify-center w-44 h-44 rounded-full border-2 border-dashed border-[#C8A84B]/40 bg-[#C8A84B]/5">
                  <p className="text-[64px] font-bold leading-none tracking-tight text-[#C8A84B]">{allStamps.length}</p>
                  <p className="text-[13px] font-medium text-white/50">stamps</p>
                </div>
                <p className="text-[14px] text-white/40 font-medium">out of {totalStamps} collected</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 flex items-center justify-between border-t border-dashed border-[#C8A84B]/20">
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-[#FF385C] text-white">
                  <Icon d={ICONS.plane} className="h-3 w-3" />
                </span>
                <span className="font-semibold tracking-tight text-white/70">
                  otarosta<span className="text-[#FF385C]">.com</span>
                </span>
              </div>
              <span className="text-[11px] text-white/30">{profile.handle}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- sub-components ---------------------------------------------------

function RoleToggle({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  return (
    <div className="inline-flex rounded-full bg-[#F1EFE8] p-1 text-[12px] font-medium">
      {(["pilot", "cabin"] as Role[]).map((r) => {
        const active = r === role;
        return (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={[
              "rounded-full px-3 py-1.5 transition",
              active ? "bg-white text-[#222] shadow-sm" : "text-[#717171]",
            ].join(" ")}
          >
            {r === "pilot" ? "Pilot" : "Cabin crew"}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-start rounded-xl bg-white px-2 py-2 ring-1 ring-black/5">
      <span className="text-[#FF385C]">
        <Icon d={icon} className="h-3.5 w-3.5" />
      </span>
      <p className="mt-1 text-[18px] font-semibold leading-none tracking-tight">{value}</p>
      <p className="mt-0.5 text-[10px] text-[#717171]">{label}</p>
    </div>
  );
}

function HighlightCard({
  accent, bg, icon, label, title, value,
}: {
  accent: string; bg: string; icon: string;
  label: string; title: string; value: string | undefined;
}) {
  return (
    <div className="rounded-2xl p-3 ring-1 ring-black/5" style={{ background: bg }}>
      <div
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: accent }}
      >
        <Icon d={icon} className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-[14px] font-semibold leading-tight text-[#222]">{title}</p>
      <p className="text-[12px] font-medium" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function WorldMap({ pins, topRoute }: { pins: Pin[]; topRoute: TopRoute }) {
  const continents = [
    { cx: 190, cy: 180, rx: 90,  ry: 55 }, // N. America
    { cx: 270, cy: 320, rx: 42,  ry: 78 }, // S. America
    { cx: 505, cy: 165, rx: 60,  ry: 42 }, // Europe
    { cx: 525, cy: 305, rx: 60,  ry: 85 }, // Africa
    { cx: 720, cy: 210, rx: 120, ry: 65 }, // Asia
    { cx: 855, cy: 405, rx: 55,  ry: 32 }, // Australia
  ];

  const from = pins.find((p) => p.code === topRoute.from);
  const to   = pins.find((p) => p.code === topRoute.to);
  let arcPath = "";
  if (from && to) {
    const mx = (from.x + to.x) / 2;
    const my = Math.min(from.y, to.y) - 60;
    arcPath = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
  }

  return (
    <div className="px-3 pb-3 pt-2">
      <svg viewBox="0 0 1000 500" className="w-full">
        <defs>
          <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#222" opacity="0.06" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1000" height="500" fill="url(#dots)" />

        <g fill="#222" opacity="0.08">
          {continents.map((c, i) => (
            <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} />
          ))}
        </g>

        <g stroke="#222" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="4 6">
          <line x1="0" y1="250" x2="1000" y2="250" />
        </g>

        {arcPath && (
          <path
            d={arcPath} fill="none"
            stroke="#FF385C" strokeWidth="3"
            strokeLinecap="round" strokeDasharray="2 8" opacity="0.9"
          />
        )}

        {pins.map((p) => (
          <g key={p.code}>
            <circle cx={p.x} cy={p.y} r="14" fill="#FF385C" opacity="0.18" />
            <circle cx={p.x} cy={p.y} r="6.5" fill="#FF385C" stroke="white" strokeWidth="2.5" />
          </g>
        ))}

        {to && (
          <circle cx={to.x} cy={to.y} r="22" fill="none" stroke="#FF385C" strokeWidth="1.5" opacity="0.35" />
        )}
      </svg>
    </div>
  );
}
