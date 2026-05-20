'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Briefcase, PlaneTakeoff, Heart, Bell, MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

// ── Mini calendar visual — lives inside the Cabin Crew card ──────────────────

// May 2026: starts on Friday → 4 leading blanks (Mon–Thu), then days 1–31
const CC_CELLS: Array<number | null> = [
  null, null, null, null,  1,  2,  3,
     4,  5,  6,  7,  8,  9, 10,
    11, 12, 13, 14, 15, 16, 17,
    18, 19, 20, 21, 22, 23, 24,
    25, 26, 27, 28, 29, 30, 31,
];

type DutyType = 'flight' | 'standby' | 'rest';
const CC_DUTIES: Record<number, DutyType> = {
   4: 'flight',   5: 'flight',
   7: 'flight',   8: 'rest',    9: 'flight',
  12: 'standby',
  14: 'flight',  15: 'rest',   16: 'rest',   17: 'flight',
  21: 'flight',  22: 'rest',   23: 'flight',
  27: 'standby',
  28: 'flight',  29: 'rest',   30: 'flight',
};

const DUTY_STYLE: Record<DutyType, { cell: string; dot: string }> = {
  flight:  { cell: 'bg-sky-50 text-sky-700',     dot: 'bg-sky-400'     },
  standby: { cell: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400'   },
  rest:    { cell: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' },
};

function CabinCrewVisual() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden select-none">

      {/* Chrome bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-border">
        <span className="text-[10px] font-black font-mono text-text-subtle uppercase tracking-widest">
          May 2026
        </span>
        <span className="flex items-center gap-1.5 text-[9px] font-black text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Synced to calendar
        </span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 bg-surface-2 border-b border-border">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-center py-1.5 text-[9px] font-black text-text-subtle">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 bg-white p-1.5">
        {CC_CELLS.map((day, i) => {
          if (!day) return <div key={i} />;
          const duty = CC_DUTIES[day];
          const style = duty ? DUTY_STYLE[duty] : null;
          return (
            <div
              key={i}
              className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-[10px] font-bold leading-none ${
                style ? style.cell : 'text-text-subtle'
              }`}
            >
              {day}
              {style && (
                <span className={`mt-0.5 w-1 h-1 rounded-full ${style.dot}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend + share button */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-t border-border">
        <div className="flex items-center gap-3">
          {([
            ['bg-sky-400',     'Duty'],
            ['bg-amber-400',   'Standby'],
            ['bg-emerald-400', 'Rest'],
          ] as const).map(([color, label]) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
              <span className="text-[9px] font-bold text-text-subtle">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-black text-sky-600 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full">
          Share with family
          <ArrowRight size={9} strokeWidth={3} />
        </div>
      </div>

    </div>
  );
}

// ── Career logbook visual — lives inside the Flight Deck card ─────────────────

const FD_PATCHES = [
  { src: '/images/city_patches/london_patch.png',       alt: 'London' },
  { src: '/images/city_patches/paris_patch.png',        alt: 'Paris' },
  { src: '/images/city_patches/hong_kong_patch.png',    alt: 'Hong Kong' },
  { src: '/images/city_patches/sydney_patch.png',       alt: 'Sydney' },
  { src: '/images/city_patches/singapore_patch.png',    alt: 'Singapore' },
];

const FD_FLIGHTS = [
  { date: '14 May', from: 'KUL', to: 'LHR', flt: 'MH001', block: '13h 20m' },
  { date: '17 May', from: 'LHR', to: 'KUL', flt: 'MH002', block: '13h 50m' },
  { date: '21 May', from: 'KUL', to: 'SYD', flt: 'MH121', block: '7h 55m'  },
];

function FlightDeckVisual() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden select-none" style={{ background: '#FAFAFA' }}>

      {/* Chrome bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-border">
        <span className="text-[10px] font-black font-mono text-text-subtle uppercase tracking-widest">
          Career Logbook
        </span>
        <span className="flex items-center gap-1.5 text-[9px] font-black text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live
        </span>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 divide-x divide-border bg-white border-b border-border">
        {[
          { n: '14,200', label: 'Block hrs' },
          { n: '847',    label: 'Sectors'   },
          { n: '23',     label: 'Cities'    },
        ].map(({ n, label }) => (
          <div key={label} className="px-4 py-3">
            <div className="text-[20px] font-black text-text tabular-nums leading-none">{n}</div>
            <div className="text-[9px] font-bold text-text-subtle mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Flight log entries */}
      <div className="divide-y divide-border/50">
        {FD_FLIGHTS.map(({ date, from, to, flt, block }) => (
          <div key={flt} className="flex items-center px-4 py-2.5 gap-2 bg-white/70">
            <span className="text-[10px] font-bold text-text-subtle w-14 tabular-nums shrink-0">{date}</span>
            <span className="text-[12px] font-black text-text">{from}</span>
            <span className="text-[9px] text-text-subtle mx-0.5">→</span>
            <span className="text-[12px] font-black text-text">{to}</span>
            <span className="text-[9px] font-bold text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-full ml-1">{flt}</span>
            <span className="text-[10px] font-bold text-text-muted ml-auto tabular-nums">{block}</span>
          </div>
        ))}
      </div>

      {/* City patches strip */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-t border-border">
        <span className="text-[9px] font-black text-text-subtle uppercase tracking-widest shrink-0 font-mono">Earned</span>
        <div className="flex items-center gap-1.5">
          {FD_PATCHES.map(({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={alt} src={src} alt={`${alt} destination patch`} className="w-7 h-7 object-contain drop-shadow-sm" />
          ))}
          <span className="text-[9px] font-black text-text-subtle bg-surface-2 border border-border rounded-full w-7 h-7 flex items-center justify-center shrink-0">
            +17
          </span>
        </div>
      </div>

    </div>
  );
}

// ── Family shared-view visual ─────────────────────────────────────────────────

const UPCOMING = [
  { day: 'Tomorrow · Wed 18',  color: 'bg-emerald-400', label: 'Rest day',            detail: 'Free all day'              },
  { day: 'Thu 19 May',         color: 'bg-amber-400',   label: 'Standby',             detail: 'KUL Base · 06:00 – 18:00'  },
  { day: 'Fri 21 May',         color: 'bg-sky-400',     label: 'KUL → SYD  MH121',   detail: 'Departs 22:55'             },
];

function FamilyVisual() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden select-none bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
            AC
          </div>
          <div>
            <p className="text-[11px] font-black text-emerald-900 leading-none">Ahmad's Schedule</p>
            <p className="text-[9px] font-bold text-emerald-600 leading-none mt-0.5">Shared by crew member</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Today's flight — hero row */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-[9px] font-black uppercase tracking-widest text-text-subtle font-mono mb-3">Today · Tue 17 May</p>

        {/* Route */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-center">
            <p className="text-[22px] font-black text-text leading-none tabular-nums">KUL</p>
            <p className="text-[9px] font-bold text-text-subtle mt-0.5">23:50</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <p className="text-[9px] font-black text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-full font-mono">MH001</p>
            <div className="w-full flex items-center gap-1">
              <div className="h-px flex-1 bg-border" />
              <PlaneTakeoff size={12} className="text-text-subtle" />
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="text-[9px] font-bold text-text-subtle">13h 20m</p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-black text-text leading-none tabular-nums">LHR</p>
            <p className="text-[9px] font-bold text-text-subtle mt-0.5">06:10 +1</p>
          </div>
        </div>

        {/* Leave-home nudge */}
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          <Clock size={13} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-[11px] font-black text-amber-900 leading-none">Leave home by 21:30</p>
            <p className="text-[9px] font-bold text-amber-700 mt-0.5">~55 min to KLIA T1 · drop-off</p>
          </div>
        </div>
      </div>

      {/* Upcoming days */}
      <div className="divide-y divide-border/60">
        {UPCOMING.map(({ day, color, label, detail }) => (
          <div key={day} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-text leading-none truncate">{label}</p>
              <p className="text-[9px] font-bold text-text-subtle mt-0.5">{detail}</p>
            </div>
            <span className="text-[9px] font-bold text-text-subtle shrink-0 font-mono">{day.split('·')[0].trim()}</span>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-surface-2 border-t border-border">
        <Bell size={11} className="text-emerald-600 shrink-0" />
        <p className="text-[10px] font-black text-emerald-700 flex-1">Pick-up reminder set for Thu 18 · 05:30</p>
        <MapPin size={10} className="text-text-subtle" />
      </div>

    </div>
  );
}

const CYCLING_WORDS = ['whole crew', 'family', 'mom', 'driver'];

function CyclingWord() {
  const [index, setIndex] = useState(0);
  const [showStrike, setShowStrike] = useState(false);

  useEffect(() => {
    setShowStrike(false);
    const t1 = setTimeout(() => setShowStrike(true), 2000);
    const t2 = setTimeout(() => setIndex(i => (i + 1) % CYCLING_WORDS.length), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [index]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        className="relative inline-block text-accent"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.22 }}
      >
        {CYCLING_WORDS[index]}
        <motion.span
          aria-hidden
          className="absolute left-0 top-[62%] -translate-y-1/2 h-[3px] bg-black w-full origin-left block"
          animate={{ scaleX: showStrike ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        />
      </motion.span>
    </AnimatePresence>
  );
}

const fade = (i = 0) => ({
  initial:    { opacity: 0, y: 28 },
  whileInView:{ opacity: 1, y: 0  },
  viewport:   { once: true },
  transition: { delay: i * 0.1, duration: 0.55 },
});

export const AudienceSection = () => {
  const { openAuthModal } = useAuth();

  return (
    <section className="py-10 md:py-16 px-4 bg-surface-2">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 md:mb-20">
          <div className="flex items-center justify-center gap-2 mb-6 text-[11px] font-black uppercase tracking-[0.35em] text-text-muted font-mono">
            {'// FOR EVERY CREW MEMBER'}
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text leading-none">
            Built for the{' '}
            <CyclingWord />
            <span className="text-accent">.</span>
          </h2>
        </div>

        {/* Main crew cards — 2 col on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

          {/* ── Cabin Crew ── */}
          <motion.div {...fade(0)}
            className="bg-white border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-6 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500"
          >
            {/* Calendar visual */}
            <CabinCrewVisual />

            {/* Copy */}
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                  <Briefcase size={16} className="text-sky-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600">Cabin Crew</span>
              </div>
              <h3 className="text-2xl font-black text-text tracking-tight leading-tight">
                Your roster, in one link.<br />
                <span className="text-sky-600">No more WhatsApp forwards.</span>
              </h3>
              <p className="text-text-muted font-bold leading-relaxed text-[15px]">
                Drop your PDF, get a colour-coded calendar your family can actually read. Duty days,
                standby windows, rest days — all synced, all shareable. Mum stops asking.
                Partner stops guessing. You stop drawing diagrams on napkins.
              </p>
            </div>

            <button
              onClick={() => openAuthModal('signup')}
              className="flex items-center gap-3 self-start bg-sky-600 text-white px-7 py-3.5 rounded-full text-[13px] font-black shadow-lg shadow-sky-600/20 hover:bg-sky-700 hover:scale-[1.02] transition-all active:scale-95"
            >
              Upload my roster — it&apos;s free
              <ArrowRight size={15} strokeWidth={3} />
            </button>
          </motion.div>

          {/* ── Flight Deck ── */}
          <motion.div {...fade(0.1)}
            className="bg-white border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-6 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500"
          >
            {/* Career logbook visual */}
            <FlightDeckVisual />

            {/* Copy */}
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent/5 border border-accent/15 flex items-center justify-center shrink-0">
                  <PlaneTakeoff size={16} className="text-accent" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Flight Deck</span>
              </div>
              <h3 className="text-2xl font-black text-text tracking-tight leading-tight">
                Every hour you&apos;ve ever flown.<br />
                <span className="text-accent">Finally visible.</span>
              </h3>
              <p className="text-text-muted font-bold leading-relaxed text-[15px]">
                Block hours, sector counts, career destinations — pulled automatically from your roster
                and mapped into a verifiable career record. When you write that LinkedIn post about
                10,000 hours, you&apos;ll be able to back it up.
              </p>
            </div>

            <button
              onClick={() => openAuthModal('signup')}
              className="flex items-center gap-3 self-start bg-accent text-accent-fg px-7 py-3.5 rounded-full text-[13px] font-black shadow-lg shadow-accent/20 hover:bg-accent-hover hover:scale-[1.02] transition-all active:scale-95"
            >
              Upload my roster — it&apos;s free
              <ArrowRight size={15} strokeWidth={3} />
            </button>
          </motion.div>
        </div>

        {/* ── Family — full card matching the two above ── */}
        <motion.div {...fade(0.2)}
          className="bg-white border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500"
        >
          {/* Visual — left on desktop, top on mobile */}
          <div className="w-full md:w-[340px] shrink-0">
            <FamilyVisual />
          </div>

          {/* Copy — right on desktop, bottom on mobile */}
          <div className="flex flex-col gap-4 flex-1 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Heart size={16} className="text-emerald-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">For the Family</span>
            </div>
            <h3 className="text-2xl font-black text-text tracking-tight leading-tight">
              Know exactly when to leave.<br />
              <span className="text-emerald-600">No more guessing.</span>
            </h3>
            <div className="space-y-3">
              {[
                ['Drop-off & pick-up times', 'Departure and arrival shown clearly — no aviation jargon.'],
                ['Leave-home reminders',     "Calculates drive time to the airport so they're never late."],
                ['Free days at a glance',    'Rest days and standby windows visible in one shared link.'],
              ].map(([title, body]) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-[13px] font-black text-text leading-none mb-0.5">{title}</p>
                    <p className="text-[12px] font-bold text-text-muted leading-snug">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => openAuthModal('signup')}
              className="flex items-center gap-3 self-start bg-emerald-600 text-white px-7 py-3.5 rounded-full text-[13px] font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all active:scale-95 mt-2"
            >
              Share my schedule
              <ArrowRight size={15} strokeWidth={3} />
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
