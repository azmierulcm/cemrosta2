'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ProfileHeader } from '@/components/product/profile/ProfileHeader';
import { StatsStrip } from '@/components/product/profile/StatsStrip';
import { SAMPLE_PROFILE } from '@/lib/fixtures/sample-profile';
import {
  DESTINATION_CATALOG,
  type CatalogEntry,
} from '@/lib/data/destination-catalog';
import { getPatchImageUrl } from '@/lib/patches/patch-images';
import { getRarityTier, RARITY_CSS } from '@/lib/patches/rules';
import type { EarnedDestination } from '@/lib/actions/destinations';

// ---------------------------------------------------------------------------
// Mini patch card — stripped-down version for the teaser (no modal, no motion)
// ---------------------------------------------------------------------------

const TEASER_EARNED = SAMPLE_PROFILE.earnedDestinations;
const EARNED_MAP = new Map<string, EarnedDestination>(
  TEASER_EARNED.map((e) => [e.iata, e]),
);

// Show the first 12 catalog entries that have illustrations, blur the rest
const CATALOG_PREVIEW = DESTINATION_CATALOG.slice(0, 18);

function MiniPatch({ entry, earned, index }: { entry: CatalogEntry; earned?: EarnedDestination; index: number }) {
  const isUnlocked = !!earned;
  const rarity = isUnlocked ? getRarityTier(earned.visits) : null;
  const rarityBorder = rarity ? RARITY_CSS[rarity] : null;
  const patchUrl = getPatchImageUrl(entry.iata);

  const isHidden = index >= 12;

  return (
    <div
      className={`rounded-xl overflow-hidden flex flex-col transition-all ${isHidden ? 'opacity-25 blur-[1.5px]' : ''}`}
      style={{
        border: '0.5px solid var(--border)',
        boxShadow: rarityBorder ? `0 0 0 1.5px ${rarityBorder}` : undefined,
      }}
    >
      {/* Artwork area */}
      <div
        className="relative flex items-center justify-center"
        style={{
          background: isUnlocked ? 'var(--surface)' : 'var(--surface-2)',
          borderBottom: '0.5px solid var(--border)',
          paddingBlock: '20px',
          minHeight: '110px',
        }}
      >
        {isUnlocked && patchUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={patchUrl} alt={entry.city} className="w-16 h-16 object-contain drop-shadow-sm" />
        ) : (
          <Lock size={20} className="text-text-subtle opacity-30" />
        )}
        {earned?.isNew && (
          <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-widest text-accent font-mono">
            NEW
          </span>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-2.5 py-2"
        style={{ background: isUnlocked ? 'var(--bg)' : 'var(--surface-2)' }}
      >
        <p className="font-mono font-semibold text-[11px] leading-none truncate" style={{ color: isUnlocked ? 'var(--text)' : 'var(--text-subtle)' }}>
          {entry.iata}
        </p>
        <p className="text-[10px] truncate mt-0.5" style={{ color: isUnlocked ? 'var(--text-muted)' : 'var(--text-subtle)' }}>
          {entry.city}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function PassportTeaser() {
  const { openAuthModal } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-24 px-4 bg-white border-t border-border overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Heading */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
            <Sparkles size={12} className="text-accent" />
            Digital Passport
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text leading-[0.95]">
            Every flight.<br />
            <span className="text-accent">Every city. Collected.</span>
          </h2>
          <p className="text-lg text-text-muted font-bold tracking-tight max-w-xl mx-auto leading-snug">
            Upload your roster and watch your lifetime destination passport build itself — automatically.
          </p>
        </motion.div>

        {/* Mock passport — rendered with SAMPLE_PROFILE data */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          {/* Passport chrome */}
          <div className="rounded-[var(--radius-xl)] border border-border bg-surface-2 overflow-hidden shadow-[var(--shadow-lg)]">
            {/* Demo banner */}
            <div className="flex items-center gap-2 px-4 py-2 bg-accent-soft border-b border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-accent font-mono">
                Live Demo — This could be yours
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* Header */}
              <ProfileHeader
                displayName={SAMPLE_PROFILE.displayName}
                rank={SAMPLE_PROFILE.rank}
                base={SAMPLE_PROFILE.base}
                aircraft={SAMPLE_PROFILE.aircraft}
              />

              {/* Stats */}
              <StatsStrip stats={SAMPLE_PROFILE.lifetimeStats} />

              {/* Destination grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-[500] text-text-muted">
                    Destinations Collected
                    <span className="ml-2 font-mono text-text">
                      {SAMPLE_PROFILE.lifetimeStats.citiesCollected}
                      <span className="text-text-subtle">/{SAMPLE_PROFILE.lifetimeStats.citiesAvailable}</span>
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-6 gap-2">
                  {CATALOG_PREVIEW.map((entry, i) => (
                    <MiniPatch
                      key={entry.iata}
                      entry={entry}
                      earned={EARNED_MAP.get(entry.iata)}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fade-out gradient at bottom so grid bleeds into CTA */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center gap-4 -mt-4"
        >
          <button
            onClick={() => openAuthModal('signup')}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-accent text-accent-fg text-lg font-black shadow-2xl shadow-accent/20 hover:scale-[1.03] hover:bg-accent-hover transition-all active:scale-95"
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
}
