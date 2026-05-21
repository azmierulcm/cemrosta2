'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Heart, Clock } from 'lucide-react';
import { WaitlistSheet } from './WaitlistSheet';
import { useAuth } from '@/lib/contexts/AuthContext';

// ── Calendar data ─────────────────────────────────────────────────────────────
const HERO_CALENDAR: Record<number, 'flight' | 'standby' | 'rest'> = {
   4: 'flight',  5: 'flight',
   7: 'flight',  8: 'rest',   9: 'flight',
  12: 'standby',
  14: 'flight', 15: 'rest',  16: 'rest',  17: 'flight',
  21: 'flight', 22: 'rest',  23: 'flight',
  27: 'standby', 28: 'flight', 29: 'rest', 30: 'flight',
};

const HERO_CELLS: Array<number | null> = [
  null, null, null, null, 1, 2, 3,
  4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31,
];

// ── Passport patches ──────────────────────────────────────────────────────────
const PASSPORT_PATCHES = [
  { src: '/images/city_patches/kuala_lumpur_patch.png', iata: 'KUL' },
  { src: '/images/city_patches/london_patch.png',       iata: 'LHR' },
  { src: '/images/city_patches/singapore_patch.png',    iata: 'SIN' },
  { src: '/images/city_patches/hong_kong_patch.png',    iata: 'HKG' },
  { src: '/images/city_patches/sydney_patch.png',       iata: 'SYD' },
  { src: '/images/city_patches/paris_patch.png',        iata: 'CDG' },
];

const FORMAT_PILLS = [
  { name: 'MAS', status: 'live' },
  { name: 'AirAsia',  status: 'soon' },
  { name: 'Batik Air',status: 'soon' },
  { name: 'SIA',      status: 'soon' },
];

// ── Hero showcase — all 4 product visuals compiled ───────────────────────────
function HeroShowcase() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0 select-none">
      <div className="grid grid-cols-2 gap-3">

        {/* ── 1. Roster Calendar — full width ─────────────────────────────── */}
        <div className="col-span-2 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          {/* Chrome */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-2 border-b border-border">
            <span className="text-[10px] font-black font-mono text-text-subtle uppercase tracking-widest">
              May 2026 · Roster
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Calendar synced
            </span>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-2">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className="text-center text-[8px] font-black text-text-subtle pb-1">{d}</div>
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-2.5">
            {HERO_CELLS.map((day, i) => {
              if (!day) return <div key={i} />;
              const duty = HERO_CALENDAR[day];
              const cls = duty === 'flight'  ? 'bg-sky-50 text-sky-700'
                        : duty === 'standby' ? 'bg-amber-50 text-amber-700'
                        : duty === 'rest'    ? 'bg-emerald-50 text-emerald-700'
                        :                      'text-text-subtle';
              const dot = duty === 'flight'  ? 'bg-sky-400'
                        : duty === 'standby' ? 'bg-amber-400'
                        : duty === 'rest'    ? 'bg-emerald-400' : '';
              return (
                <div key={i} className={`flex flex-col items-center justify-center rounded-lg py-1 text-[9px] font-bold leading-none ${cls}`}>
                  {day}
                  {dot && <span className={`mt-0.5 w-1 h-1 rounded-full ${dot}`} />}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-surface-2/50">
            {([['bg-sky-400','Duty'],['bg-amber-400','Standby'],['bg-emerald-400','Rest']] as const).map(([c, l]) => (
              <div key={l} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${c}`} />
                <span className="text-[8px] font-bold text-text-subtle">{l}</span>
              </div>
            ))}
            <span className="ml-auto text-[8px] font-black text-accent font-mono">Export .ics →</span>
          </div>
        </div>

        {/* ── 2. Destination Passport — left col ──────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="px-3 py-2.5 bg-surface-2 border-b border-border">
            <p className="text-[8px] font-black text-text-subtle uppercase tracking-widest font-mono">Passport</p>
            <p className="text-[14px] font-black text-text mt-0.5">47 cities</p>
          </div>
          <div className="grid grid-cols-3 gap-1 p-2 flex-1">
            {PASSPORT_PATCHES.map(({ src, iata }) => (
              <div key={iata} className="flex flex-col items-center gap-0.5 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${iata} destination patch`} className="w-full aspect-square object-contain" />
                <span className="text-[7px] font-black text-text-subtle font-mono">{iata}</span>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <span className="text-[8px] font-bold text-text-subtle">+35 more unlocked</span>
          </div>
        </div>

        {/* ── 3. Monthly Recap — right col ────────────────────────────────── */}
        <div
          className="rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col"
          style={{ background: '#FFFCF8', borderColor: 'rgba(0,0,0,0.06)' }}
        >
          <div className="px-3 py-2.5 bg-white border-b flex items-center justify-between"
               style={{ borderColor: '#F0EDE8' }}>
            <p className="text-[8px] font-black uppercase tracking-widest font-mono" style={{ color: '#B0ABA5' }}>
              Recap
            </p>
            <span className="text-[8px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,56,92,0.10)', color: '#FF385C' }}>
              May 26
            </span>
          </div>
          <div className="p-3 flex flex-col gap-2.5 flex-1">
            {/* Avatar */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                   style={{ background: 'linear-gradient(135deg,#FF385C,#E61E4D)' }}>
                AC
              </div>
              <div>
                <p className="text-[10px] font-black leading-none" style={{ color: '#222' }}>Ahmad Crew</p>
                <p className="text-[8px] leading-none mt-0.5" style={{ color: '#717171' }}>Captain · A350</p>
              </div>
            </div>
            {/* Big stat */}
            <div className="rounded-xl p-2.5" style={{ background: '#F7F5F0' }}>
              <p className="text-[28px] font-black leading-none tracking-tight" style={{ color: '#222' }}>
                147<span className="text-[11px] font-medium" style={{ color: '#717171' }}>h</span>
              </p>
              <p className="text-[8px] font-bold mt-0.5" style={{ color: '#717171' }}>Block hours · May</p>
            </div>
            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-1">
              {[['18','Flights'],['9','Cities']].map(([v, l]) => (
                <div key={l} className="rounded-lg p-2" style={{ background: '#F7F5F0' }}>
                  <p className="text-[14px] font-black leading-none" style={{ color: '#222' }}>{v}</p>
                  <p className="text-[7px]" style={{ color: '#717171' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="px-3 py-2 border-t text-center" style={{ borderColor: '#F0EDE8' }}>
            <span className="text-[7px] font-black tracking-widest uppercase font-mono" style={{ color: '#B0ABA5' }}>
              otarosta.com
            </span>
          </div>
        </div>

        {/* ── 4. Family notification — full width ─────────────────────────── */}
        <div className="col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              AC
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[12px] font-black text-emerald-900 leading-none">Ahmad lands in 3h 20m</p>
                <span className="text-[8px] font-bold text-emerald-600 bg-white border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  For family
                </span>
              </div>
              <p className="text-[10px] font-bold text-emerald-800">LHR → KUL · MH002 · Lands 08:20</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Clock size={10} className="text-amber-600 shrink-0" />
                <p className="text-[9px] font-black text-amber-700">Leave home by 06:30 · 55 min to KLIA</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main hero ─────────────────────────────────────────────────────────────────
export const LandingHero = () => {
  const shouldReduceMotion = useReducedMotion();
  const { openAuthModal } = useAuth();
  const [waitlistAirline, setWaitlistAirline] = useState<string | null>(null);

  const fade = (delay = 0) => shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay } };

  return (
    <section className="relative pt-16 md:pt-32 pb-16 md:pb-20 px-4 overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/3 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

          {/* ── Showcase — first on mobile (top), right on desktop ── */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative pb-4 lg:pb-0 w-full order-first lg:order-last"
          >
            <HeroShowcase />
          </motion.div>

          {/* ── Copy — second on mobile (bottom), left on desktop ── */}
          <div className="flex flex-col gap-6 lg:gap-8 order-last lg:order-first">
            <motion.div {...fade(0)}>
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.35em] text-text-muted font-mono mb-4 md:mb-6">
                {'// BUILT FOR CREW'}
              </div>
              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tighter text-text leading-[0.92] mb-4 md:mb-6">
                From PDF Roster to Shared Family Calendar.
              </h1>
              <p className="text-base md:text-xl text-text-muted font-bold leading-snug tracking-tight max-w-lg">
                Track your flights, sync with family, and look back at everywhere you&apos;ve been—all in one place.
              </p>
            </motion.div>

            <motion.div {...fade(0.15)} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => openAuthModal('signup')}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-accent text-accent-fg px-8 py-4 rounded-full text-[15px] font-black shadow-xl shadow-accent/20 hover:scale-[1.03] hover:bg-accent-hover transition-all active:scale-95"
                >
                  Upload my roster — it&apos;s free
                  <ArrowRight size={18} strokeWidth={3} />
                </button>
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 border border-border px-8 py-4 rounded-full text-[15px] font-black text-text-muted hover:text-text hover:border-text-subtle transition-all"
                >
                  Already crew? Sign in.
                </button>
              </div>
              <p className="text-[12px] text-text-subtle font-bold italic pl-1">
                Not crew? You&apos;re in the wrong place, but also welcome.
              </p>
            </motion.div>

            {/* Format pills */}
            <motion.div {...fade(0.25)} className="flex flex-wrap gap-2">
              {FORMAT_PILLS.map((pill) => (
                <button
                  key={pill.name}
                  onClick={() => pill.status === 'soon' && setWaitlistAirline(pill.name)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black border uppercase tracking-widest flex items-center gap-2 transition-all ${
                    pill.status === 'live'
                      ? 'bg-accent/5 border-accent/20 text-accent'
                      : 'bg-surface-2 border-border text-text-muted hover:border-text-subtle cursor-pointer'
                  }`}
                >
                  {pill.name}
                  {pill.status === 'live'
                    ? <CheckCircle2 size={11} strokeWidth={3} />
                    : <span className="opacity-40">· soon</span>}
                </button>
              ))}
            </motion.div>

            {/* Trust strip */}
            <motion.div {...fade(0.35)}
              className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-text-muted font-mono border-t border-border pt-6"
            >
              {[
                [CheckCircle2, 'Free forever'],
                [Zap,          'No credit card'],
                [ShieldCheck,  'Works with MAS'],
                [Heart,        "Your data stays yours — we're not your airline's IT dept"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-2">
                  {React.createElement(Icon as React.ElementType, { size: 13, className: 'text-accent' })}
                  <span>{label as string}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <WaitlistSheet
        isOpen={!!waitlistAirline}
        onClose={() => setWaitlistAirline(null)}
        airline={waitlistAirline || ''}
      />
    </section>
  );
};
