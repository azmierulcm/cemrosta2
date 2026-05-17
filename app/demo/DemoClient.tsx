'use client';

import React, { useState } from 'react';
import { DESTINATION_CATALOG, REGION_COLORS } from '@/lib/data/destination-catalog';
import { getPatchImageUrl } from '@/lib/patches/patch-images';
import { ILLUSTRATIONS } from '@/lib/patches/illustrations';
import { Lock, Sparkles, Globe, Award, Share2, Download } from 'lucide-react';

/* ── Rarity config ───────────────────────────────────────────────────────── */
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

/* ── Stats ───────────────────────────────────────────────────────────────── */
const DEMO_STATS = {
  sectors: 1240,
  cities: DESTINATION_CATALOG.length,
  km: 2847391,
  years: 8,
};

/* ── Patch card ──────────────────────────────────────────────────────────── */
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
      {/* Image area */}
      <div
        className="relative flex items-center justify-center"
        style={{
          background: 'var(--surface)',
          borderBottom: '0.5px solid var(--border)',
          paddingBlock: '28px',
          minHeight: '160px',
        }}
      >
        {/* Local script */}
        {entry.localName && (
          <span
            className="absolute top-2 left-2 text-[11px] font-[500] leading-none"
            dir="auto"
            style={{ color: regionColor, opacity: 0.6, maxWidth: 56, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
          >
            {entry.localName}
          </span>
        )}

        {/* Rarity pill */}
        <span
          className="absolute top-2 right-2 text-[9px] font-[800] uppercase tracking-widest px-1.5 py-0.5 rounded-full font-mono"
          style={{ color: rarity.color, background: rarity.bg }}
        >
          {rarity.label}
        </span>

        {/* Home badge */}
        {entry.isHome && (
          <span
            className="absolute bottom-2 left-2 text-[9px] font-[700] px-1.5 py-0.5 rounded-full uppercase tracking-widest"
            style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
          >
            home
          </span>
        )}

        {/* Artwork */}
        {patchUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={patchUrl} alt={`${entry.city} patch`} className="w-[100px] h-[100px] object-contain" />
        ) : (
          <div className="w-[64px] h-[64px]" style={{ color: regionColor }}>
            <Illustration size={64} />
          </div>
        )}
      </div>

      {/* Identity */}
      <div className="bg-bg px-3 py-2.5 flex flex-col gap-0.5">
        <p className="font-mono font-[600] text-[18px] leading-none" style={{ color: 'var(--text)', letterSpacing: '0.04em' }}>
          {entry.iata}
        </p>
        <p className="text-[12px] font-[500] truncate" style={{ color: 'var(--text)' }}>{entry.city}</p>
        <p className="text-[10px]" style={{ color: rarity.color, fontWeight: 700 }}>
          {visits >= 100 ? '100+ flights' : visits >= 25 ? `${visits} flights` : visits >= 5 ? `${visits} flights` : `${visits} flight${visits !== 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
}

/* ── Fake recap card ─────────────────────────────────────────────────────── */
function DemoRecapCard() {
  return (
    <div
      className="rounded-[2rem] overflow-hidden border border-border shadow-xl max-w-lg mx-auto"
      style={{ background: '#0f0f0f' }}
    >
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-white/10">
        <div>
          <p className="text-[10px] font-[800] uppercase tracking-[0.35em] font-mono" style={{ color: '#ffffff40' }}>Cemrosta</p>
          <p className="text-[22px] font-[700] text-white tracking-tight leading-none mt-0.5">Mission Recap</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-mono" style={{ color: '#ffffff50' }}>MAY 2026</p>
          <p className="text-[11px] font-mono" style={{ color: 'var(--accent)' }}>Monthly</p>
        </div>
      </div>

      {/* Hero stat */}
      <div className="px-8 py-8">
        <p className="font-mono font-[900] leading-none" style={{ fontSize: 96, color: 'white' }}>18</p>
        <p className="text-[13px] font-[800] uppercase tracking-[0.35em] font-mono mt-1" style={{ color: 'var(--accent)' }}>Sectors Flown</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 border-t border-white/10">
        {[
          { label: 'Block Hours', value: '147h' },
          { label: 'Cities', value: '9' },
          { label: 'KM Flown', value: '42,300' },
        ].map((stat) => (
          <div key={stat.label} className="px-6 py-5 border-r border-white/10 last:border-r-0">
            <p className="font-mono font-[700] text-white text-[20px] leading-none">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest font-mono mt-1" style={{ color: '#ffffff40' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Superlative */}
      <div className="px-8 py-6 border-t border-white/10">
        <p className="text-[10px] uppercase tracking-widest font-mono mb-1" style={{ color: '#ffffff40' }}>Mission Award</p>
        <p className="text-[18px] font-[700] text-white">🌍 Globe Trotter</p>
        <p className="text-[12px] mt-0.5" style={{ color: '#ffffff50' }}>Visited 5+ continents this month</p>
      </div>

      {/* Footer */}
      <div className="px-8 pb-8 pt-2 flex items-center justify-between">
        <p className="text-[13px] font-[700] text-white">Muhammad Azmierul</p>
        <p className="text-[11px] font-mono" style={{ color: '#ffffff30' }}>cemrosta.com</p>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function DemoClient() {
  const [activeTab, setActiveTab] = useState<'patches' | 'recap'>('patches');

  // Simulate visit counts for demo — vary by city for visual interest
  const demoVisits: Record<string, number> = {};
  DESTINATION_CATALOG.forEach((e, i) => {
    if (e.isHome) { demoVisits[e.iata] = 420; return; }
    const cycle = i % 4;
    demoVisits[e.iata] = cycle === 0 ? 1 : cycle === 1 ? 7 : cycle === 2 ? 30 : 105;
  });

  const withArtwork = DESTINATION_CATALOG.filter(e => !!getPatchImageUrl(e.iata));
  const withoutArtwork = DESTINATION_CATALOG.filter(e => !getPatchImageUrl(e.iata));

  return (
    <div className="max-w-7xl mx-auto px-4 pt-8 pb-32">

      {/* Hero banner */}
      <div className="mb-12 rounded-[2.5rem] overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1C1C1E 0%, #2d1a2e 100%)' }}>
        <div className="px-10 py-12 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-accent" />
            <span className="text-[10px] font-[800] uppercase tracking-[0.35em] font-mono text-accent">Preview Mode</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-[900] text-white tracking-tighter leading-none mb-4">
            This is what<br />
            <span style={{ color: 'var(--accent)' }}>you unlock.</span>
          </h1>
          <p className="text-[16px] text-white/60 font-[500] max-w-lg leading-snug mb-8">
            Every flight you take earns a city patch. Every month becomes a shareable recap card. Upload your roster and watch your passport fill up.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6">
            {[
              { icon: Globe, label: 'Cities in passport', value: `${DEMO_STATS.cities}` },
              { icon: Award, label: 'Rarity tiers', value: '4 tiers' },
              { icon: Share2, label: 'Shareable recap', value: 'Monthly · 6M · 1Y' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Icon size={16} className="text-white/60" />
                </div>
                <div>
                  <p className="text-white font-[700] text-[15px] leading-none">{value}</p>
                  <p className="text-white/40 text-[11px] mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative patch preview top-right */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex gap-3 opacity-20">
          {['kuala_lumpur_patch.png', 'london_patch.png', 'sydney_patch.png'].map(f => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f} src={`/images/city_patches/${f}`} alt="" className="w-24 h-24 object-contain" />
          ))}
        </div>
      </div>

      {/* Rarity legend */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <span className="text-[10px] font-[800] uppercase tracking-widest font-mono text-text-subtle mr-2">Rarity Tiers</span>
        {RARITY.map(r => (
          <span key={r.label} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-[700] font-mono"
            style={{ color: r.color, background: r.bg }}>
            {r.label} · {r.visits}+ flights
          </span>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-8 bg-surface-2 p-1 rounded-full w-fit border border-border">
        {([['patches', 'City Patches'], ['recap', 'Recap Card']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-6 py-2 rounded-full text-[12px] font-[700] uppercase tracking-widest transition-all font-mono"
            style={{
              background: activeTab === tab ? 'var(--text)' : 'transparent',
              color: activeTab === tab ? 'var(--bg)' : 'var(--text-muted)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* PATCHES TAB */}
      {activeTab === 'patches' && (
        <div>
          {/* With artwork */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-[700] text-text text-[18px]">City Patches</h2>
              <span className="text-[11px] font-mono font-[600] px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                {withArtwork.length} with artwork
              </span>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {withArtwork.map((entry) => (
                <PatchCard key={entry.iata} entry={entry} visits={demoVisits[entry.iata] ?? 1} />
              ))}
            </div>
          </div>

          {/* SVG illustration fallback */}
          {withoutArtwork.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-[700] text-text text-[18px]">Coming Soon</h2>
                <span className="text-[11px] font-mono font-[600] px-2.5 py-1 rounded-full bg-surface-2 text-text-subtle border border-border">
                  {withoutArtwork.length} artwork pending
                </span>
              </div>
              <div className="grid gap-3 opacity-60" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {withoutArtwork.map((entry) => {
                  const Illustration = ILLUSTRATIONS[entry.iata] ?? ILLUSTRATIONS['Generic'];
                  const regionColor = REGION_COLORS[entry.region];
                  return (
                    <div key={entry.iata} className="rounded-2xl overflow-hidden border border-border flex flex-col">
                      <div className="relative flex items-center justify-center bg-surface-2 py-6" style={{ minHeight: 120 }}>
                        <div className="w-12 h-12" style={{ color: regionColor }}>
                          <Illustration size={48} />
                        </div>
                      </div>
                      <div className="px-3 py-2 bg-bg">
                        <p className="font-mono font-[600] text-[16px]" style={{ color: 'var(--text-muted)' }}>{entry.iata}</p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--text-subtle)' }}>{entry.city}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RECAP TAB */}
      {activeTab === 'recap' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Recap card preview */}
            <div>
              <div className="text-[10px] font-[800] uppercase tracking-[0.35em] font-mono text-text-subtle mb-4">
                Monthly Recap Card
              </div>
              <DemoRecapCard />
              <div className="mt-6 flex gap-3">
                <button className="flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-[700] border border-border hover:bg-surface-2 transition-all"
                  style={{ color: 'var(--text)' }}>
                  <Download size={15} />
                  Download PNG
                </button>
                <button className="flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-[700] border border-border hover:bg-surface-2 transition-all"
                  style={{ color: 'var(--text)' }}>
                  <Share2 size={15} />
                  Share
                </button>
              </div>
            </div>

            {/* Explainer */}
            <div className="space-y-6 pt-2">
              <div className="text-[10px] font-[800] uppercase tracking-[0.35em] font-mono text-text-subtle mb-6">
                What you get every month
              </div>
              {[
                { title: 'Sectors flown', desc: 'Total number of flights operated that month — your mission count.' },
                { title: 'Block hours', desc: 'Cumulative time from engine start to shutdown across all sectors.' },
                { title: 'Cities visited', desc: 'Every arrival port becomes a destination on your passport.' },
                { title: 'KM flown', desc: 'Total great-circle distance across all routes.' },
                { title: 'Mission award', desc: 'A superlative badge based on your flying pattern — Globe Trotter, Endurance, Marathon Runner and more.' },
                { title: '3 formats', desc: 'Monthly, 6-month, and 1-year recaps. Stories format (9:16) and card format (1.91:1) for any platform.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                  <div>
                    <p className="font-[700] text-text text-[14px]">{item.title}</p>
                    <p className="text-[13px] text-text-muted mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}

              <div className="mt-8 p-6 rounded-[1.5rem] border border-border bg-surface-2">
                <p className="text-[11px] font-[800] uppercase tracking-widest font-mono text-text-subtle mb-2">Ready to start?</p>
                <p className="text-[14px] font-[500] text-text-muted mb-4 leading-snug">Upload your roster PDF and your first recap generates automatically.</p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[13px] font-[800] transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                  Create free account →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
