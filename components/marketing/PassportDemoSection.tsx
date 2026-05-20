'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Award, Share2, Download, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DESTINATION_CATALOG, REGION_COLORS } from '@/lib/data/destination-catalog';
import { getPatchImageUrl } from '@/lib/patches/patch-images';
import { ILLUSTRATIONS } from '@/lib/patches/illustrations';

// ── Rarity config (mirrors DemoClient) ───────────────────────────────────────

const RARITY = [
  { label: 'Bronze',   visits: 1,   color: '#b45309', bg: '#fef3c7' },
  { label: 'Silver',   visits: 5,   color: '#6b7280', bg: '#f3f4f6' },
  { label: 'Gold',     visits: 25,  color: '#d97706', bg: '#fffbeb' },
  { label: 'Platinum', visits: 100, color: '#7c3aed', bg: '#f5f3ff' },
];

function getRarity(visits: number) {
  if (visits >= 100) return RARITY[3];
  if (visits >= 25)  return RARITY[2];
  if (visits >= 5)   return RARITY[1];
  return RARITY[0];
}

// Demo visit counts — cycle through rarity tiers for visual variety
const DEMO_VISITS: Record<string, number> = {};
DESTINATION_CATALOG.forEach((e, i) => {
  if (e.isHome) { DEMO_VISITS[e.iata] = 420; return; }
  const cycle = i % 4;
  DEMO_VISITS[e.iata] = cycle === 0 ? 1 : cycle === 1 ? 7 : cycle === 2 ? 30 : 105;
});

// Only show destinations that have patch artwork — cap at 24 for the landing page
const WITH_ARTWORK = DESTINATION_CATALOG.filter(e => !!getPatchImageUrl(e.iata));
const PREVIEW_PATCHES = WITH_ARTWORK.slice(0, 24);

// ── Patch card ───────────────────────────────────────────────────────────────

function PatchCard({ entry, visits }: { entry: typeof DESTINATION_CATALOG[0]; visits: number }) {
  const [hovered, setHovered] = useState(false);
  const patchUrl = getPatchImageUrl(entry.iata);
  const Illustration = ILLUSTRATIONS[entry.iata] ?? ILLUSTRATIONS['Generic'];
  const regionColor = REGION_COLORS[entry.region];
  const rarity = getRarity(visits);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col border transition-all duration-200 cursor-pointer"
      style={{
        borderColor: hovered ? rarity.color : 'var(--border)',
        boxShadow: hovered ? `0 0 0 1.5px ${rarity.color}` : undefined,
        transform: hovered ? 'translateY(-2px)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          background: 'var(--surface)',
          borderBottom: '0.5px solid var(--border)',
          paddingBlock: '20px',
          minHeight: '130px',
        }}
      >
        {entry.localName && (
          <span
            className="absolute top-2 left-2 text-[11px] font-[500] leading-none"
            dir="auto"
            style={{ color: regionColor, opacity: 0.6, maxWidth: 52, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
          >
            {entry.localName}
          </span>
        )}
        <span
          className="absolute top-2 right-2 text-[9px] font-[800] uppercase tracking-widest px-1.5 py-0.5 rounded-full font-mono"
          style={{ color: rarity.color, background: rarity.bg }}
        >
          {rarity.label}
        </span>
        {entry.isHome && (
          <span
            className="absolute bottom-2 left-2 text-[9px] font-[700] px-1.5 py-0.5 rounded-full uppercase tracking-widest"
            style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
          >
            home
          </span>
        )}
        {patchUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={patchUrl} alt={`${entry.city} destination patch`} className="w-[88px] h-[88px] object-contain" />
        ) : (
          <div className="w-[56px] h-[56px]" style={{ color: regionColor }}>
            <Illustration size={56} />
          </div>
        )}
      </div>
      <div className="bg-bg px-3 py-2 flex flex-col gap-0.5">
        <p className="font-mono font-[600] text-[16px] leading-none" style={{ color: 'var(--text)', letterSpacing: '0.04em' }}>
          {entry.iata}
        </p>
        <p className="text-[11px] font-[500] truncate" style={{ color: 'var(--text)' }}>{entry.city}</p>
        <p className="text-[10px]" style={{ color: rarity.color, fontWeight: 700 }}>
          {visits >= 100 ? '100+ flights' : `${visits} flight${visits !== 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
}

// ── Monthly recap card (static demo) ─────────────────────────────────────────

function RecapCard() {
  const LHR = getPatchImageUrl('LHR');
  const CDG = getPatchImageUrl('CDG');
  const SIN = getPatchImageUrl('SIN');

  return (
    <div
      className="relative w-full max-w-[300px] mx-auto rounded-[1.75rem] overflow-hidden"
      style={{
        background: '#FFFCF8',
        outline: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 24px 72px rgba(0,0,0,0.15)',
      }}
    >
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none"
           style={{ background: '#FF385C', opacity: 0.09 }} />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full blur-3xl pointer-events-none"
           style={{ background: '#00A699', opacity: 0.07 }} />

      <div className="relative p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                 style={{ background: 'linear-gradient(135deg, #FF385C, #E61E4D)' }}>AC</div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-bold" style={{ color: '#222' }}>Ahmad Crew</p>
                <span className="rounded-full px-1.5 py-[1px] text-[8px] font-bold text-white"
                      style={{ background: '#222' }}>MH</span>
              </div>
              <p className="text-[10px]" style={{ color: '#717171' }}>Captain · A350</p>
            </div>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest"
                style={{ background: 'rgba(255,56,92,0.10)', color: '#FF385C' }}>May 2026</span>
        </div>

        {/* Stamps */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: '#FF385C' }}>
            Stamps collected
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { patch: LHR, city: 'London',    visits: 4 },
              { patch: CDG, city: 'Paris',     visits: 2 },
              { patch: SIN, city: 'Singapore', visits: 3 },
            ].map((d) => (
              <div key={d.city} className="flex flex-col items-center">
                {d.patch && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.patch} alt={`${d.city} destination patch`} className="w-full aspect-square object-contain" />
                )}
                <p className="text-[8px] font-bold text-center mt-0.5" style={{ color: '#222' }}>{d.city}</p>
                <p className="text-[7px]" style={{ color: '#717171' }}>{d.visits} visits</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[8px] font-bold mt-1.5" style={{ color: '#717171' }}>
            +6 more stamps this month
          </p>
        </div>

        {/* Stats grid */}
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
          {[
            { label: 'Flights',  value: '18' },
            { label: 'Cities',   value: '9'  },
            { label: 'Standby',  value: '3d' },
            { label: 'Off days', value: '12d'},
          ].map((s) => (
            <div key={s.label} className="rounded-xl px-2 py-2 flex flex-col gap-0.5"
                 style={{ background: '#F7F5F0', outline: '1px solid rgba(0,0,0,0.04)' }}>
              <p className="text-[12px] font-bold leading-none" style={{ color: '#222' }}>{s.value}</p>
              <p className="text-[7px]" style={{ color: '#717171' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[8px] font-black uppercase tracking-widest font-mono"
           style={{ color: '#B0ABA5' }}>cemrosta.io</p>
      </div>
    </div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────

export const PassportDemoSection = () => {
  const { openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'patches' | 'recap'>('patches');

  return (
    <section className="py-10 md:py-16 px-4 bg-white border-t border-border overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-12"
        >
          <div className="flex items-center gap-2 mb-4 text-[11px] font-black uppercase tracking-[0.35em] text-text-muted font-mono">
            <Sparkles size={12} className="text-accent" />
            Digital Passport
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text leading-none">
              Every flight.<br />
              <span className="text-accent">Every city. Collected.</span>
            </h2>
            <p className="text-[16px] text-text-muted font-bold leading-snug max-w-sm">
              Upload your roster and watch your lifetime destination passport build itself — automatically.
            </p>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex flex-wrap gap-2 mb-6 md:mb-10"
        >
          {[
            { icon: Globe,  label: 'Cities in passport',  value: `${WITH_ARTWORK.length}` },
            { icon: Award,  label: 'Rarity tiers',        value: '4 tiers'                },
            { icon: Share2, label: 'Shareable recap card', value: 'Monthly · 6M · 1Y'     },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 bg-surface-2 border border-border rounded-full px-4 py-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white border border-border shrink-0">
                <Icon size={14} className="text-accent" />
              </div>
              <span className="font-black text-text text-[14px]">{value}</span>
              <span className="text-text-subtle text-[11px] font-bold">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Rarity legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap items-center gap-2 mb-8"
        >
          <span className="text-[10px] font-black uppercase tracking-widest font-mono text-text-subtle mr-1">Rarity</span>
          {RARITY.map(r => (
            <span
              key={r.label}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-[700] font-mono"
              style={{ color: r.color, background: r.bg }}
            >
              {r.label} · {r.visits}+ flights
            </span>
          ))}
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="flex items-center gap-1 mb-8 bg-surface-2 p-1 rounded-full w-fit border border-border"
        >
          {([['patches', 'City Patches'], ['recap', 'Recap Card']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest transition-all font-mono"
              style={{
                background: activeTab === tab ? 'var(--text)' : 'transparent',
                color:      activeTab === tab ? 'var(--bg)'   : 'var(--text-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {/* ── PATCHES TAB ── */}
        {activeTab === 'patches' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div
              className="grid gap-3 mb-8"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
            >
              {PREVIEW_PATCHES.map((entry) => (
                <PatchCard key={entry.iata} entry={entry} visits={DEMO_VISITS[entry.iata] ?? 1} />
              ))}
            </div>
            {WITH_ARTWORK.length > 24 && (
              <p className="text-center text-[13px] font-bold text-text-subtle">
                Showing 24 of {WITH_ARTWORK.length} destinations ·{' '}
                <a href="/demo" className="text-accent hover:underline">
                  See the full passport →
                </a>
              </p>
            )}
          </motion.div>
        )}

        {/* ── RECAP TAB ── */}
        {activeTab === 'recap' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
          >
            {/* Card preview */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.35em] font-mono text-text-subtle mb-6">
                Monthly Recap Card
              </div>
              <RecapCard />
              <div className="mt-6 flex gap-3">
                <div className="flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold border border-border text-text-muted cursor-default select-none">
                  <Download size={14} />
                  Download PNG
                </div>
                <div className="flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold border border-border text-text-muted cursor-default select-none">
                  <Share2 size={14} />
                  Share
                </div>
              </div>
            </div>

            {/* Feature explainer */}
            <div className="space-y-5 pt-2">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] font-mono text-text-subtle mb-4">
                What you get every month
              </div>
              {[
                { title: 'Sectors flown',  desc: 'Total number of flights operated that month — your mission count.' },
                { title: 'Block hours',    desc: 'Cumulative time from engine start to shutdown across all sectors.' },
                { title: 'Cities visited', desc: 'Every arrival port becomes a destination on your passport.' },
                { title: 'KM flown',       desc: 'Total great-circle distance across all routes.' },
                { title: 'Mission award',  desc: 'A superlative badge based on your flying pattern — Globe Trotter, Endurance, Marathon Runner and more.' },
                { title: '3 formats',      desc: 'Monthly, 6-month, and 1-year recaps. Stories (9:16) and card (1.91:1) for any platform.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                  <div>
                    <p className="font-black text-text text-[14px]">{item.title}</p>
                    <p className="text-[13px] text-text-muted mt-0.5 leading-snug font-bold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center gap-4 mt-10 md:mt-16 pt-10 md:pt-12 border-t border-border"
        >
          <button
            onClick={() => openAuthModal('signup')}
            className="inline-flex items-center gap-3 px-7 py-4 md:px-10 md:py-5 rounded-full bg-accent text-accent-fg text-base md:text-lg font-black shadow-2xl shadow-accent/20 hover:scale-[1.03] hover:bg-accent-hover transition-all active:scale-95 w-full sm:w-auto justify-center"
          >
            Upload my roster — it&apos;s free
            <ArrowRight size={20} strokeWidth={3} />
          </button>
          <p className="text-[13px] text-text-subtle font-bold">
            Free forever · No credit card needed
          </p>
        </motion.div>

      </div>
    </section>
  );
};
