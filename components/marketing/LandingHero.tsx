'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Heart } from 'lucide-react';
import { WaitlistSheet } from './WaitlistSheet';
import { useAuth } from '@/lib/contexts/AuthContext';

// ── Real patch images for the hero preview ────────────────────────────────────
const HERO_PATCHES = [
  { src: '/images/city_patches/kuala_lumpur_patch.png', city: 'Kuala Lumpur', iata: 'KUL' },
  { src: '/images/city_patches/london_patch.png',       city: 'London',       iata: 'LHR' },
  { src: '/images/city_patches/singapore_patch.png',    city: 'Singapore',    iata: 'SIN' },
  { src: '/images/city_patches/hong_kong_patch.png',    city: 'Hong Kong',    iata: 'HKG' },
];

const FORMAT_PILLS = [
  { name: 'MAS AIMS', status: 'live' },
  { name: 'AirAsia',  status: 'soon' },
  { name: 'Batik Air',status: 'soon' },
  { name: 'SIA',      status: 'soon' },
];

// ── Mini roster tile ──────────────────────────────────────────────────────────
function MiniTile({
  date, status, from, to, flightNo, time, type,
}: {
  date: string; status: string; from: string; to: string;
  flightNo: string; time: string; type: 'flight' | 'off' | 'standby';
}) {
  const band = type === 'flight'  ? 'bg-sky-50 text-sky-700'
             : type === 'standby' ? 'bg-yellow-50 text-yellow-800'
             :                      'bg-green-50 text-green-700';
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm text-[11px]">
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 ${band}`}>
        <span className="font-bold text-[13px] tabular-nums">{date}</span>
        <span className="font-bold uppercase tracking-wide text-[9px]">{status}</span>
      </div>
      {type === 'flight' ? (
        <>
          <div className="flex items-center justify-between px-2.5 py-1">
            <span className="font-semibold text-neutral-700">{from}</span>
            <span className="font-bold text-green-700 text-[10px]">{flightNo}</span>
            <span className="font-semibold text-neutral-700">{to}</span>
          </div>
          <div className="flex items-center justify-between px-2.5 pb-1.5 text-neutral-500">
            <span>{time}</span>
          </div>
        </>
      ) : (
        <div className="px-2.5 py-2 text-center text-neutral-400 font-medium uppercase tracking-wider text-[9px]">
          {status}
        </div>
      )}
    </div>
  );
}

// ── Mini LiveRosterCard ───────────────────────────────────────────────────────
function MiniRosterCard() {
  return (
    <div
      className="w-[120px] rounded-[16px] overflow-hidden flex flex-col shadow-2xl shadow-black/20"
      style={{ background: '#FFFCF8', border: '1px solid rgba(0,0,0,0.06)' }}
    >
      {/* Glow */}
      <div className="relative p-2.5 flex flex-col gap-1.5" style={{ minHeight: 190 }}>
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl"
             style={{ background: '#FF385C', opacity: 0.12 }} />
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[7px] font-bold shrink-0"
               style={{ background: 'linear-gradient(135deg,#FF385C,#E61E4D)' }}>
            AC
          </div>
          <div>
            <div className="text-[7px] font-bold text-[#222] leading-none">Ahmad Crew</div>
            <div className="text-[6px] text-[#717171] leading-none mt-0.5">Captain · A350</div>
          </div>
        </div>
        {/* Eyebrow */}
        <div className="text-[6px] font-black uppercase tracking-widest mt-1"
             style={{ color: '#FF385C' }}>
          Stamps collected
        </div>
        {/* 2 patch images */}
        <div className="grid grid-cols-2 gap-1">
          {[
            '/images/city_patches/london_patch.png',
            '/images/city_patches/paris_patch.png',
          ].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full aspect-square object-contain" />
          ))}
        </div>
        {/* Stats */}
        <div className="mt-auto grid grid-cols-2 gap-1">
          {[['14h', 'Block hrs'], ['2', 'Sectors']].map(([val, label]) => (
            <div key={label} className="rounded-lg p-1.5" style={{ background: '#F7F5F0' }}>
              <div className="text-[9px] font-black text-[#222]">{val}</div>
              <div className="text-[6px] text-[#717171]">{label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <div className="px-2.5 py-1.5 text-center border-t" style={{ borderColor: '#F0EDE8' }}>
        <span className="text-[6px] font-black tracking-widest text-[#B0ABA5] uppercase font-mono">
          cemrosta.io
        </span>
      </div>
    </div>
  );
}

// ── Product preview panel ─────────────────────────────────────────────────────
function ProductPreview() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0 select-none">

      {/* Main app window */}
      <div className="rounded-[1.5rem] border border-border bg-white shadow-2xl shadow-black/10 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-2 border-b border-border">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="flex-1 mx-3 bg-white border border-border rounded-full px-3 py-1 text-[10px] text-text-subtle font-mono">
            cemrosta.vercel.app
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Recent Stamps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase italic tracking-tight text-text">Recent Stamps.</span>
              <span className="text-[9px] font-black font-mono text-text-subtle bg-surface-2 border border-border px-2 py-0.5 rounded-full">
                4 Unlocked
              </span>
            </div>
            <div className="flex gap-3 overflow-hidden">
              {HERO_PATCHES.map((p) => (
                <div key={p.iata} className="flex flex-col items-center shrink-0 gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.city} className="w-14 h-14 object-contain drop-shadow-sm" />
                  <span className="text-[8px] font-black text-text truncate w-14 text-center">{p.city}</span>
                  <span className="text-[8px] font-black text-text-muted font-mono">1×</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Roster Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase italic tracking-tight text-text">Roster Details.</span>
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-[8px] font-black text-text-subtle font-mono uppercase tracking-widest">Tap to edit</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniTile date="14" status="Duty" from="KUL" to="LHR" flightNo="MH001" time="23:50 → 06:10+" type="flight" />
              <MiniTile date="15" status="Layover" from="" to="" flightNo="" time="" type="standby" />
              <MiniTile date="16" status="Duty" from="LHR" to="KUL" flightNo="MH002" time="13:30 → 08:20+" type="flight" />
              <MiniTile date="17" status="Rest" from="" to="" flightNo="" time="" type="off" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating LiveRosterCard */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute -right-4 -bottom-6 lg:-right-10"
      >
        <MiniRosterCard />
      </motion.div>

      {/* Floating badge: "Synced" */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute -top-3 -left-4 flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1.5 shadow-lg text-[10px] font-black text-success"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        Calendar synced
      </motion.div>
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

          {/* ── Product preview — first on mobile (top), right on desktop ── */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative pb-10 lg:pb-0 w-full order-first lg:order-last"
          >
            <ProductPreview />
          </motion.div>

          {/* ── Copy — second on mobile (bottom), left on desktop ── */}
          <div className="flex flex-col gap-6 lg:gap-8 order-last lg:order-first">
            <motion.div {...fade(0)}>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono mb-4 md:mb-6">
                {'// BUILT FOR CREW'}
              </div>
              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tighter text-text leading-[0.92] mb-4 md:mb-6">
                Your roster PDF has been holding you hostage{' '}
                <span className="text-accent italic">since 2009.</span>
                <br />Today, we negotiate.
              </h1>
              <p className="text-base md:text-xl text-text-muted font-bold leading-snug tracking-tight max-w-lg">
                Drop your AIMS PDF. Get a synced calendar, a lifetime destination passport, and the ability to explain your schedule to your family without drawing a diagram on a napkin.
              </p>
            </motion.div>

            <motion.div {...fade(0.15)} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => openAuthModal('signup')}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-accent text-accent-fg px-8 py-4 rounded-full text-[15px] font-black shadow-xl shadow-accent/20 hover:scale-[1.03] hover:bg-accent-hover transition-all active:scale-95"
                >
                  Ditch the PDF. It&apos;s free.
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
              className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-black uppercase tracking-[0.2em] text-text-muted font-mono border-t border-border pt-6"
            >
              {[
                [CheckCircle2, 'Free forever'],
                [Zap,          'No credit card'],
                [ShieldCheck,  'Works with MAS AIMS'],
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
