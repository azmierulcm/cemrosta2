'use client';

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useReducedMotion, motion } from 'framer-motion';
import {
  DESTINATION_CATALOG,
  REGION_COLORS,
  type CatalogEntry,
} from '@/lib/data/destination-catalog';
import type { EarnedDestination } from '@/lib/actions/destinations';
import { formatVisitCount } from '@/lib/utils/format';
import { ILLUSTRATIONS } from '@/lib/patches/illustrations';
import { getRarityTier, RARITY_CSS } from '@/lib/patches/rules';
import { getPatchImageUrl } from '@/lib/patches/patch-images';
import { PatchDetailModal } from './PatchDetailModal';

interface PatchCardProps {
  entry: CatalogEntry;
  earned?: EarnedDestination;
  index: number;
  reduceMotion: boolean;
  onClick: () => void;
}

function PatchCard({ entry, earned, index, reduceMotion, onClick }: PatchCardProps) {
  const isUnlocked = !!earned;
  const regionColor = REGION_COLORS[entry.region];

  const rarity = isUnlocked ? getRarityTier(earned.visits) : null;
  const rarityBorder = rarity ? RARITY_CSS[rarity] : null;

  const Illustration = ILLUSTRATIONS[entry.iata] ?? ILLUSTRATIONS['Generic'];
  const patchImageUrl = getPatchImageUrl(entry.iata);

  const label = isUnlocked
    ? `${entry.city} (${entry.iata}) — visited ${earned!.visits} time${earned!.visits !== 1 ? 's' : ''}`
    : `${entry.city} (${entry.iata}) — locked`;

  return (
    <motion.button
      type="button"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.5) }}
      onClick={onClick}
      aria-label={label}
      className="rounded-[var(--radius-lg)] overflow-hidden flex flex-col cursor-pointer text-left w-full"
      style={{
        border: '0.5px solid var(--border)',
        boxShadow: rarityBorder ? `0 0 0 1px ${rarityBorder}` : undefined,
      }}
    >
      {/* Top section — illustration */}
      <div
        className="relative flex items-center justify-center"
        style={{
          background: isUnlocked ? 'var(--surface)' : 'var(--surface-2)',
          borderBottom: '0.5px solid var(--border)',
          paddingBlock: '33px',
          minHeight: '180px',
        }}
      >
        {/* Local script name — top-left, stamp-style */}
        {entry.localName && (
          <span
            className="absolute top-2.5 left-2.5 leading-none font-[500]"
            dir="auto"
            style={{
              fontSize: '14px',
              color: isUnlocked ? regionColor : 'var(--text-subtle)',
              opacity: isUnlocked ? 0.7 : 0.4,
              maxWidth: '60px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.localName}
          </span>
        )}

        {/* Home / New badge — top-right */}
        {isUnlocked && earned.isHome && (
          <span
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-[600] leading-none"
            style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
          >
            home
          </span>
        )}
        {isUnlocked && earned.isNew && !earned.isHome && (
          <span
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-[600] leading-none"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            new
          </span>
        )}

        {/* Illustration or lock */}
        {isUnlocked ? (
          patchImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={patchImageUrl}
              alt={`${entry.city} patch`}
              aria-hidden="true"
              className="w-[120px] h-[120px] object-contain"
            />
          ) : (
            <div
              className="w-[72px] h-[72px]"
              style={{ color: regionColor }}
              aria-hidden="true"
            >
              <Illustration size={72} />
            </div>
          )
        ) : (
          <Lock
            size={33}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{ color: 'var(--text-subtle)', opacity: 0.35 }}
          />
        )}

      </div>

      {/* Bottom section — identity */}
      <div className="bg-bg px-3.5 py-3 flex-1 flex flex-col gap-0.5">
        <p
          className="font-mono font-[500] leading-none"
          style={{
            fontSize: '22px',
            color: isUnlocked ? 'var(--text)' : 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          {entry.iata}
        </p>
        <p
          className="font-[500] leading-snug truncate"
          style={{
            fontSize: '13px',
            color: isUnlocked ? 'var(--text)' : 'var(--text-muted)',
          }}
        >
          {entry.city}
        </p>
        <p
          className="leading-snug truncate"
          style={{ fontSize: '11px', color: 'var(--text-subtle)' }}
        >
          {isUnlocked
            ? earned.isHome
              ? entry.country
              : formatVisitCount(earned.visits)
            : 'Locked'}
        </p>
      </div>
    </motion.button>
  );
}

interface DestinationsGridProps {
  earnedDestinations: EarnedDestination[];
}

export function DestinationsGrid({ earnedDestinations }: DestinationsGridProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const earnedMap = new Map(earnedDestinations.map((d) => [d.iata, d]));
  const collected = earnedDestinations.length;

  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null);

  return (
    <section>
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-[600] text-text" style={{ fontSize: '18px' }}>
          Destinations
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          <span className="font-[500] text-text">{collected}</span> collected
          {' · '}
          <span>{DESTINATION_CATALOG.length - collected}</span> to unlock
        </p>
      </div>

      {/* Patch grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
      >
        {DESTINATION_CATALOG.map((entry, i) => (
          <PatchCard
            key={entry.iata}
            entry={entry}
            earned={earnedMap.get(entry.iata)}
            index={i}
            reduceMotion={reduceMotion}
            onClick={() => setSelectedEntry(entry)}
          />
        ))}
      </div>

      {/* Patch detail modal */}
      <PatchDetailModal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
        earned={selectedEntry ? (earnedMap.get(selectedEntry.iata) ?? null) : null}
      />
    </section>
  );
}
