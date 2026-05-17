'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPinned, Share2, Download, Check } from 'lucide-react';

/* ── Calendar week data ────────────────────────────────────────────────────── */
type DutyType = 'flight' | 'layover' | 'standby';
const WEEK: { d: string; dt: string; ev: { label: string; sub: string; type: DutyType } | null }[] = [
  { d: 'Mon', dt: '13', ev: null },
  { d: 'Tue', dt: '14', ev: { label: 'MH001', sub: 'KUL → LHR', type: 'flight' } },
  { d: 'Wed', dt: '15', ev: { label: 'Layover', sub: 'London', type: 'layover' } },
  { d: 'Thu', dt: '16', ev: { label: 'Layover', sub: 'London', type: 'layover' } },
  { d: 'Fri', dt: '17', ev: { label: 'MH002', sub: 'LHR → KUL', type: 'flight' } },
  { d: 'Sat', dt: '18', ev: null },
  { d: 'Sun', dt: '19', ev: { label: 'Standby', sub: 'KUL Base', type: 'standby' } },
];
const EV_STYLE: Record<DutyType, string> = {
  flight:  'bg-accent/10 border border-accent/20 text-accent',
  layover: 'bg-amber-50 border border-amber-200 text-amber-700',
  standby: 'bg-slate-100 border border-slate-200 text-slate-500',
};

/* ── Passport stamp data ───────────────────────────────────────────────────── */
type StampSize = 'lg' | 'md' | 'sm';
const STAMPS: { code: string; size: StampSize }[] = [
  { code: 'KUL', size: 'lg' }, { code: 'LHR', size: 'md' }, { code: 'SIN', size: 'md' },
  { code: 'SYD', size: 'md' }, { code: 'CDG', size: 'sm' }, { code: 'DOH', size: 'sm' },
  { code: 'NRT', size: 'sm' }, { code: 'DXB', size: 'sm' }, { code: 'MEL', size: 'sm' },
  { code: 'HKG', size: 'sm' }, { code: 'BKK', size: 'sm' }, { code: 'FRA', size: 'sm' },
];
const STAMP_SIZE: Record<StampSize, string> = {
  lg: 'w-16 h-16 text-[11px]',
  md: 'w-12 h-12 text-[10px]',
  sm: 'w-10 h-10 text-[9px]',
};

/* ── Sub-components ────────────────────────────────────────────────────────── */
function CalendarCard() {
  return (
    <div className="bg-white border border-border rounded-[2rem] p-6 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-accent font-mono mb-1.5">01 · Calendar Sync</div>
          <div className="text-xl font-black text-text tracking-tight leading-none">Your roster, live<br/>in any calendar.</div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center shrink-0">
          <CalendarDays size={18} className="text-accent" />
        </div>
      </div>

      {/* Week view mock */}
      <div className="rounded-2xl overflow-hidden border border-border flex-1">
        <div className="bg-surface-2 px-4 py-2.5 flex items-center justify-between border-b border-border">
          <span className="text-[10px] font-black text-text-muted font-mono uppercase tracking-widest">May 2026</span>
          <span className="text-[10px] text-text-subtle font-bold">Week view</span>
        </div>
        <div className="divide-y divide-border/60">
          {WEEK.map((day) => (
            <div key={day.d} className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 text-center shrink-0">
                <div className="text-[8px] font-bold text-text-subtle uppercase tracking-wide">{day.d}</div>
                <div className="text-[13px] font-black text-text leading-none">{day.dt}</div>
              </div>
              {day.ev ? (
                <div className={`flex-1 px-2.5 py-1.5 rounded-lg ${EV_STYLE[day.ev.type]}`}>
                  <div className="text-[10px] font-black leading-none">{day.ev.label}</div>
                  <div className="text-[9px] font-bold opacity-70 mt-0.5">{day.ev.sub}</div>
                </div>
              ) : (
                <div className="flex-1 text-[10px] text-text-subtle font-bold opacity-40 px-2.5">Rest</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export strip */}
      <div className="flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-accent-fg text-[11px] font-black">
          <Download size={12} strokeWidth={3} />
          Export .ics
        </button>
        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold px-1">
          <Check size={11} className="text-success shrink-0" strokeWidth={3} />
          Google
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold px-1">
          <Check size={11} className="text-success shrink-0" strokeWidth={3} />
          Apple
        </div>
      </div>
    </div>
  );
}

function PassportCard() {
  return (
    <div className="bg-white border border-border rounded-[2rem] p-6 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-accent font-mono mb-1.5">02 · Destination Passport</div>
          <div className="text-xl font-black text-text tracking-tight leading-none">Every city<br/>you&apos;ve ever landed.</div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center shrink-0">
          <MapPinned size={18} className="text-accent" />
        </div>
      </div>

      {/* Stamp grid */}
      <div className="flex-1 flex flex-wrap gap-2 content-start">
        {STAMPS.map(({ code, size }) => (
          <div
            key={code}
            className={`${STAMP_SIZE[size]} rounded-full border-2 border-accent/25 flex items-center justify-center font-black font-mono text-accent bg-accent/5 shrink-0`}
          >
            {code}
          </div>
        ))}
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center text-[9px] font-black text-text-subtle font-mono shrink-0">
          +35
        </div>
      </div>

      {/* Stats */}
      <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
        {[
          { val: '47', label: 'Cities' },
          { val: '3', label: 'Continents' },
          { val: '1,240', label: 'Sectors' },
        ].map(({ val, label }) => (
          <div key={label}>
            <div className="text-xl font-black text-text tracking-tighter">{val}</div>
            <div className="text-[8px] font-black text-text-subtle uppercase tracking-widest font-mono mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecapCard() {
  return (
    <div className="bg-white border border-border rounded-[2rem] p-6 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-accent font-mono mb-1.5">03 · Recap Card</div>
          <div className="text-xl font-black text-text tracking-tight leading-none">Share the mission.<br/>Look great doing it.</div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center shrink-0">
          <Share2 size={18} className="text-accent" />
        </div>
      </div>

      {/* Card preview */}
      <div className="flex-1 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white relative overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-accent opacity-20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-blue-500 opacity-15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full gap-4">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col gap-[2px]">
              <div className="w-3 h-[2px] bg-accent/40 rounded-sm" />
              <div className="w-3 h-[3px] bg-accent/65 rounded-sm" />
              <div className="w-3 h-[5px] bg-accent rounded-sm" />
            </div>
            <span className="text-[9px] font-bold text-white/50 tracking-widest uppercase font-mono">Cemrosta</span>
          </div>

          {/* Route */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black tracking-tighter">KUL</span>
              <div className="flex-1 flex items-center gap-1 px-1">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-white/35 text-base">✈</span>
                <div className="flex-1 h-px bg-white/15" />
              </div>
              <span className="text-4xl font-black tracking-tighter">LHR</span>
            </div>
            <div className="text-[9px] text-white/35 font-bold uppercase tracking-widest mt-1">
              Kuala Lumpur · London Heathrow
            </div>
          </div>

          {/* Meta */}
          <div className="flex gap-5 mt-auto">
            {[
              { lbl: 'Flight',    val: 'MH001'    },
              { lbl: 'Duration',  val: '13h 05m'  },
              { lbl: 'Date',      val: '14 May 26' },
            ].map(({ lbl, val }) => (
              <div key={lbl}>
                <div className="text-[8px] text-white/35 uppercase tracking-widest font-bold mb-0.5">{lbl}</div>
                <div className="text-[11px] text-white font-black">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share strip */}
      <div className="flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] text-white text-[11px] font-black">
          Share to WhatsApp
        </button>
        <button className="w-10 h-10 rounded-xl border border-border flex items-center justify-center shrink-0 hover:bg-surface-2 transition-colors">
          <Share2 size={14} className="text-text-muted" />
        </button>
      </div>
    </div>
  );
}

/* ── Section ───────────────────────────────────────────────────────────────── */
export const ComparisonSection = () => {
  return (
    <section className="py-40 px-4 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">

        {/* Heading */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
            {"// WHAT YOU GET"}
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-text mb-8 leading-none">
            Stop fighting <br /> your roster PDF.
          </h2>
          <p className="text-xl md:text-2xl text-text-muted font-bold max-w-xl mx-auto leading-snug tracking-tight">
            We&apos;ve automated the manual tasks so you can focus on what matters—your next mission.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {[CalendarCard, PassportCard, RecapCard].map((Card, i) => (
            <motion.div
              key={i}
              className="flex"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
