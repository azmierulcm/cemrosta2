'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share2, Check, Calendar, MapPinned, BarChart3, ArrowRight } from 'lucide-react';
import { getPatchImageUrl } from '@/lib/patches/patch-images';

// ─── Data ────────────────────────────────────────────────────────────────────

type DutyKind = 'flight' | 'layover' | 'standby';

const MAY_DUTIES: Record<number, { kind: DutyKind; from?: string; to?: string; flight?: string; time?: string; label?: string }> = {
  4:  { kind: 'flight',  from: 'KUL', to: 'SIN', flight: 'MH610', time: '08:00 → 10:20' },
  5:  { kind: 'flight',  from: 'SIN', to: 'KUL', flight: 'MH611', time: '11:30 → 13:50' },
  7:  { kind: 'flight',  from: 'KUL', to: 'HKG', flight: 'MH070', time: '07:55 → 11:55' },
  8:  { kind: 'layover', label: 'Layover · Hong Kong' },
  9:  { kind: 'flight',  from: 'HKG', to: 'KUL', flight: 'MH071', time: '12:45 → 17:10' },
  12: { kind: 'standby', label: 'Standby · KUL Base' },
  14: { kind: 'flight',  from: 'KUL', to: 'LHR', flight: 'MH001', time: '23:50 → 06:10+' },
  15: { kind: 'layover', label: 'Layover · London' },
  16: { kind: 'layover', label: 'Layover · London' },
  17: { kind: 'flight',  from: 'LHR', to: 'KUL', flight: 'MH002', time: '13:30 → 08:20+' },
  21: { kind: 'flight',  from: 'KUL', to: 'SYD', flight: 'MH121', time: '22:55 → 10:50+' },
  22: { kind: 'layover', label: 'Layover · Sydney' },
  23: { kind: 'flight',  from: 'SYD', to: 'KUL', flight: 'MH120', time: '12:30 → 18:50' },
  27: { kind: 'standby', label: 'Standby · KUL Base' },
  28: { kind: 'flight',  from: 'KUL', to: 'CDG', flight: 'MH098', time: '01:00 → 07:30' },
  29: { kind: 'layover', label: 'Layover · Paris' },
  30: { kind: 'flight',  from: 'CDG', to: 'KUL', flight: 'MH099', time: '10:30 → 06:30+' },
};

const DUTY_STYLE: Record<DutyKind, { cell: string; dot: string; badge: string }> = {
  flight:  { cell: 'bg-sky-50 text-sky-700',     dot: 'bg-sky-400',    badge: 'bg-sky-100 text-sky-700'     },
  layover: { cell: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700' },
  standby: { cell: 'bg-yellow-50 text-yellow-800', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
};

const CELLS: Array<number | null> = [
  null, null, null, null, 1, 2, 3,
  4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31,
];

const PASSPORT_PATCHES = [
  { iata: 'KUL', visits: 420, city: 'Kuala Lumpur' },
  { iata: 'LHR', visits: 4,   city: 'London'       },
  { iata: 'SIN', visits: 7,   city: 'Singapore'    },
  { iata: 'HKG', visits: 3,   city: 'Hong Kong'    },
  { iata: 'SYD', visits: 2,   city: 'Sydney'       },
  { iata: 'CDG', visits: 2,   city: 'Paris'        },
  { iata: 'BKK', visits: 5,   city: 'Bangkok'      },
  { iata: 'NRT', visits: 1,   city: 'Tokyo'        },
  { iata: 'PEN', visits: 3,   city: 'Penang'       },
];

function rarityFor(v: number) {
  if (v >= 100) return { label: 'Platinum', color: '#7c3aed', bg: '#f5f3ff' };
  if (v >= 25)  return { label: 'Gold',     color: '#d97706', bg: '#fffbeb' };
  if (v >= 5)   return { label: 'Silver',   color: '#6b7280', bg: '#f3f4f6' };
  return               { label: 'Bronze',   color: '#b45309', bg: '#fef3c7' };
}

// ─── Feature selector items ───────────────────────────────────────────────────

const FEATURES = [
  {
    id:       'calendar' as const,
    num:      '01',
    Icon:     Calendar,
    label:    'Calendar Sync',
    headline: 'Your schedule, in every calendar app.',
    desc:     'Every flight, standby, and rest day extracted and pushed to Google, Apple, or any .ics app. Your family can subscribe and see your month in real time.',
    bullets:  ['Google · Apple · Outlook · Any .ics app', 'Shareable link your family can subscribe to', 'Updates automatically every month'],
  },
  {
    id:       'passport' as const,
    num:      '02',
    Icon:     MapPinned,
    label:    'Destination Passport',
    headline: 'Every city you land becomes a collectible.',
    desc:     'A lifetime passport of every destination you\'ve operated to. Four rarity tiers based on visits — Bronze, Silver, Gold, Platinum. Shareable public profile.',
    bullets:  ['60+ destinations with unique artwork', 'Bronze → Silver → Gold → Platinum tiers', 'Shareable public profile page'],
  },
  {
    id:       'recap' as const,
    num:      '03',
    Icon:     BarChart3,
    label:    'Monthly Recap Card',
    headline: 'A stat card worth sharing every month.',
    desc:     'Auto-generated every month — block hours, sectors, cities, and a mission award based on your flying pattern. Download as PNG or share directly to WhatsApp.',
    bullets:  ['Monthly · 6-month · 1-year periods', 'Mission awards: Globe Trotter, Endurance & more', 'Download PNG · Share to WhatsApp'],
  },
] as const;

type FeatureId = typeof FEATURES[number]['id'];

// ─── Right-panel previews ─────────────────────────────────────────────────────

function CalendarPreview() {
  const [hovered, setHovered] = useState<number | null>(null);
  const duty = hovered ? MAY_DUTIES[hovered] ?? null : null;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Chrome */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-2 rounded-2xl border border-border">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black font-mono text-text uppercase tracking-widest">May 2026</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-black text-success">
          <Check size={12} strokeWidth={3} />
          Synced
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 bg-white rounded-2xl border border-border p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
            <div key={d} className="text-center text-[10px] font-black text-text-subtle pb-2">{d}</div>
          ))}
        </div>
        {/* Cells */}
        <div className="grid grid-cols-7 gap-1">
          {CELLS.map((day, i) => {
            if (!day) return <div key={i} />;
            const d = MAY_DUTIES[day];
            const s = d ? DUTY_STYLE[d.kind] : null;
            const isHov = hovered === day;
            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${
                  s ? `${s.cell} ${isHov ? 'ring-2 ring-accent/40 scale-110 shadow-md z-10' : ''}` : 'hover:bg-surface-2 text-text-subtle'
                }`}
              >
                <span className="text-[11px] font-black leading-none">{day}</span>
                {s && <span className={`w-1 h-1 rounded-full mt-0.5 ${s.dot}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover detail */}
      <div className="bg-white rounded-2xl border border-border px-4 py-3 min-h-[64px] flex items-center">
        <AnimatePresence mode="wait">
          {duty && hovered ? (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 w-full"
            >
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${DUTY_STYLE[duty.kind].badge}`}>
                May {hovered}
              </span>
              {duty.flight ? (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[13px] font-black text-text">{duty.from}</span>
                  <ArrowRight size={12} className="text-text-subtle" />
                  <span className="text-[13px] font-black text-text">{duty.to}</span>
                  <span className="text-[11px] font-black text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-full ml-1">{duty.flight}</span>
                  <span className="text-[11px] font-bold text-text-muted ml-auto tabular-nums">{duty.time}</span>
                </div>
              ) : (
                <span className="text-[13px] font-black text-text">{duty.label}</span>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[12px] text-text-subtle font-bold italic"
            >
              Hover any duty day to see flight details
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Export strip */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 flex-1 justify-center py-3 rounded-2xl bg-accent text-accent-fg text-[13px] font-black hover:bg-accent-hover transition-colors">
          <Download size={14} strokeWidth={2.5} />
          Export .ics
        </button>
        <div className="flex items-center gap-4 text-[12px] font-bold text-text-muted">
          <div className="flex items-center gap-1.5"><Check size={12} className="text-success" strokeWidth={3} />Google</div>
          <div className="flex items-center gap-1.5"><Check size={12} className="text-success" strokeWidth={3} />Apple</div>
          <div className="flex items-center gap-1.5"><Check size={12} className="text-success" strokeWidth={3} />Outlook</div>
        </div>
      </div>
    </div>
  );
}

function PassportPreview() {
  const [hov, setHov] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stats header */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { n: '47',    l: 'Cities collected' },
          { n: '3',     l: 'Continents'       },
          { n: '1,240', l: 'Sectors flown'    },
        ].map(({ n, l }) => (
          <div key={l} className="bg-white border border-border rounded-2xl px-4 py-3 text-center">
            <div className="text-[22px] font-black text-text tabular-nums leading-none">{n}</div>
            <div className="text-[10px] font-bold text-text-subtle mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* Rarity legend */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Bronze',   color: '#b45309', bg: '#fef3c7', visits: 1   },
          { label: 'Silver',   color: '#6b7280', bg: '#f3f4f6', visits: 5   },
          { label: 'Gold',     color: '#d97706', bg: '#fffbeb', visits: 25  },
          { label: 'Platinum', color: '#7c3aed', bg: '#f5f3ff', visits: 100 },
        ].map(r => (
          <span key={r.label} className="text-[10px] font-black font-mono px-2.5 py-1 rounded-full"
                style={{ color: r.color, background: r.bg }}>
            {r.label} · {r.visits}+ visits
          </span>
        ))}
      </div>

      {/* Patch grid */}
      <div className="flex-1 grid grid-cols-3 gap-3">
        {PASSPORT_PATCHES.map(({ iata, visits, city }) => {
          const url = getPatchImageUrl(iata);
          const rarity = rarityFor(visits);
          const isHov = hov === iata;
          return (
            <div
              key={iata}
              onMouseEnter={() => setHov(iata)}
              onMouseLeave={() => setHov(null)}
              className="rounded-2xl border overflow-hidden flex flex-col cursor-pointer transition-all duration-200"
              style={{
                borderColor: isHov ? rarity.color : 'var(--border)',
                boxShadow: isHov ? `0 0 0 1.5px ${rarity.color}` : undefined,
                transform: isHov ? 'translateY(-2px)' : undefined,
              }}
            >
              <div className="relative flex items-center justify-center bg-surface py-4" style={{ minHeight: 100 }}>
                <span className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full font-mono"
                      style={{ color: rarity.color, background: rarity.bg }}>
                  {rarity.label}
                </span>
                {iata === 'KUL' && (
                  <span className="absolute bottom-1 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                    home
                  </span>
                )}
                {url
                  ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`${city} destination patch`} className="w-16 h-16 object-contain drop-shadow-sm" />
                  )
                  : <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-[11px] font-black text-accent font-mono">{iata}</div>
                }
              </div>
              <div className="bg-bg px-2.5 py-2 border-t border-border">
                <p className="font-mono font-bold text-[13px] text-text leading-none">{iata}</p>
                <p className="text-[10px] text-text-muted truncate mt-0.5">{city}</p>
                <p className="text-[9px] font-bold mt-0.5" style={{ color: rarity.color }}>
                  {visits >= 100 ? '100+ visits' : `${visits} visit${visits !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-[12px] font-bold text-text-subtle text-center">
        +35 more destinations in your passport · unlocked as you fly
      </p>
    </div>
  );
}

function RecapPreview() {
  const LHR = getPatchImageUrl('LHR');
  const CDG = getPatchImageUrl('CDG');
  const SIN = getPatchImageUrl('SIN');

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Card centered in a tinted frame */}
      <div className="flex-1 flex items-center justify-center rounded-2xl bg-surface-2 border border-border p-6 relative overflow-hidden">
        {/* Subtle glows */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
             style={{ background: '#FF385C', opacity: 0.07 }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
             style={{ background: '#00A699', opacity: 0.06 }} />

        {/* Recap card */}
        <div
          className="relative w-full max-w-[280px] rounded-[1.5rem] overflow-hidden"
          style={{ background: '#FFFCF8', outline: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
        >
          <div className="p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                     style={{ background: 'linear-gradient(135deg,#FF385C,#E61E4D)' }}>AC</div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-bold" style={{ color: '#222' }}>Ahmad Crew</p>
                    <span className="rounded-full px-1.5 py-[1px] text-[7px] font-bold text-white" style={{ background: '#222' }}>MH</span>
                  </div>
                  <p className="text-[10px]" style={{ color: '#717171' }}>Captain · A350</p>
                </div>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest"
                    style={{ background: 'rgba(255,56,92,0.10)', color: '#FF385C' }}>
                May 2026
              </span>
            </div>

            {/* Stamps */}
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: '#FF385C' }}>
                Stamps collected
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[{ patch: LHR, city: 'London', v: 4 }, { patch: CDG, city: 'Paris', v: 2 }, { patch: SIN, city: 'Singapore', v: 3 }].map(d => (
                  <div key={d.city} className="flex flex-col items-center">
                    {d.patch && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.patch} alt={`${d.city} destination patch`} className="w-full aspect-square object-contain" />
                    )}
                    <p className="text-[8px] font-bold text-center mt-0.5" style={{ color: '#222' }}>{d.city}</p>
                    <p className="text-[7px]" style={{ color: '#717171' }}>{d.v} visits</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-[8px] font-bold mt-1.5" style={{ color: '#717171' }}>+6 more stamps this month</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 grid-rows-2 gap-1.5">
              <div className="col-span-2 row-span-2 rounded-2xl px-3 py-2.5 flex flex-col justify-between"
                   style={{ background: '#fff', outline: '1px solid rgba(0,0,0,0.07)' }}>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: '#FF385C' }}>Hours</p>
                  <p className="text-[28px] font-bold leading-none tracking-tight mt-1" style={{ color: '#222' }}>
                    147<span className="text-[10px] font-medium" style={{ color: '#717171' }}>h</span>
                  </p>
                  <p className="text-[8px] mt-0.5" style={{ color: '#717171' }}>May 2026</p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full px-2 py-[2px] text-[8px] font-bold"
                      style={{ background: '#E8F5EF', color: '#0F6E56' }}>+12% vs prev</span>
              </div>
              {[{ l: 'Flights', v: '18' }, { l: 'Cities', v: '9' }, { l: 'Standby', v: '3d' }, { l: 'Off', v: '12d' }].map(s => (
                <div key={s.l} className="rounded-xl px-2 py-2 flex flex-col gap-0.5" style={{ background: '#F7F5F0' }}>
                  <p className="text-[12px] font-bold leading-none" style={{ color: '#222' }}>{s.v}</p>
                  <p className="text-[7px]" style={{ color: '#717171' }}>{s.l}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-[8px] font-black uppercase tracking-widest font-mono" style={{ color: '#B0ABA5' }}>
              otarosta.com
            </p>
          </div>
        </div>
      </div>

      {/* Share actions */}
      <div className="flex items-center gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-black text-white"
                style={{ background: '#25D366' }}>
          Share to WhatsApp
        </button>
        <button className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-border text-[13px] font-black text-text-muted hover:bg-surface-2 transition-colors">
          <Download size={14} />
          PNG
        </button>
        <button className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center hover:bg-surface-2 transition-colors">
          <Share2 size={15} className="text-text-muted" />
        </button>
      </div>

      {/* Periods */}
      <div className="flex items-center justify-center gap-6 text-[11px] font-bold text-text-subtle">
        {['Monthly recap', '6-month recap', '1-year recap'].map(p => (
          <div key={p} className="flex items-center gap-1.5">
            <Check size={11} className="text-success" strokeWidth={3} />
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

const PREVIEW: Record<FeatureId, React.ReactNode> = {
  calendar: <CalendarPreview />,
  passport: <PassportPreview />,
  recap:    <RecapPreview />,
};

// ─── Main section ─────────────────────────────────────────────────────────────

export const ComparisonSection = () => {
  const [active, setActive] = useState<FeatureId>('calendar');
  const feature = FEATURES.find(f => f.id === active)!;

  return (
    <section className="py-10 md:py-16 px-4 bg-surface-2">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 md:mb-16"
        >
          <div className="flex items-center gap-2 mb-4 text-[11px] font-black uppercase tracking-[0.35em] text-text-muted font-mono">
            {'// WHAT YOU GET'}
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text leading-none mb-4">
            Three things. One upload.
          </h2>
          <p className="text-[16px] md:text-[17px] text-text-muted font-bold max-w-xl leading-snug tracking-tight">
            Drop your Roster PDF and walk away with a synced calendar, a lifetime destination passport, and a monthly recap card worth sharing.
          </p>
        </motion.div>

        {/* ── SHARED: preview panel + desktop selector ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 lg:gap-8 items-start">

          {/* Desktop selector (hidden on mobile) */}
          <div className="hidden lg:flex flex-col gap-3">
            {FEATURES.map((f, i) => {
              const isActive = active === f.id;
              return (
                <motion.button
                  key={f.id}
                  onClick={() => setActive(f.id)}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  className={`w-full text-left rounded-2xl p-5 border transition-all duration-300 ${
                    isActive
                      ? 'bg-white border-accent/20 shadow-lg shadow-black/5'
                      : 'bg-white/50 border-border hover:bg-white hover:shadow-md hover:shadow-black/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-text-subtle border border-border'
                    }`}>
                      <f.Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black font-mono ${isActive ? 'text-accent' : 'text-text-subtle'}`}>{f.num}</span>
                        <span className={`text-[14px] font-black tracking-tight ${isActive ? 'text-text' : 'text-text-muted'}`}>{f.label}</span>
                      </div>
                      <p className={`text-[13px] font-bold leading-snug transition-all ${
                        isActive ? 'text-text-muted' : 'text-text-subtle line-clamp-1'
                      }`}>
                        {f.desc}
                      </p>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 space-y-1.5"
                        >
                          {f.bullets.map(b => (
                            <div key={b} className="flex items-start gap-2">
                              <Check size={12} className="text-accent mt-0.5 shrink-0" strokeWidth={3} />
                              <span className="text-[12px] font-bold text-text-muted">{b}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Preview panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-24"
          >
            <div className="bg-white border border-border rounded-[2rem] p-5 md:p-8 shadow-sm flex flex-col" style={{ minHeight: 'clamp(440px, 60vw, 580px)' }}>
              {/* Panel eyebrow */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
                <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <feature.Icon size={16} className="text-accent-fg" />
                </div>
                <div>
                  <p className="text-[10px] font-black font-mono text-text-subtle uppercase tracking-widest">{feature.num}</p>
                  <p className="text-[14px] font-black text-text tracking-tight leading-none">{feature.headline}</p>
                </div>
              </div>

              {/* Animated content swap */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="h-full"
                  >
                    {PREVIEW[active]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

        </div>

        {/* ── MOBILE: icon tab bar (hidden on desktop) ── */}
        <div className="flex lg:hidden gap-1.5 mt-4">
          {FEATURES.map(f => {
            const isActive = active === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border text-[11px] font-black transition-all ${
                  isActive
                    ? 'bg-white border-accent/20 text-accent shadow-sm'
                    : 'bg-white/60 border-border text-text-subtle'
                }`}
              >
                <f.Icon size={18} className={isActive ? 'text-accent' : 'text-text-subtle'} />
                <span className="leading-none text-center">{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── MOBILE: feature description (hidden on desktop) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`mob-desc-${active}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden bg-white border border-border rounded-2xl p-4 mt-4"
          >
            <p className="text-[14px] font-black text-text tracking-tight mb-1">{feature.headline}</p>
            <p className="text-[13px] font-bold text-text-muted leading-snug mb-3">{feature.desc}</p>
            <div className="space-y-1.5">
              {feature.bullets.map(b => (
                <div key={b} className="flex items-start gap-2">
                  <Check size={11} className="text-accent mt-0.5 shrink-0" strokeWidth={3} />
                  <span className="text-[12px] font-bold text-text-muted">{b}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
