'use client';

import React, { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SEL = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';

const ComposableMap = dynamic(() => import('react-simple-maps').then(m => m.ComposableMap), { ssr: false });
const Geographies = dynamic(() => import('react-simple-maps').then(m => m.Geographies), { ssr: false });
const Geography = dynamic(() => import('react-simple-maps').then(m => m.Geography), { ssr: false });
const Marker = dynamic(() => import('react-simple-maps').then(m => m.Marker), { ssr: false });
import { ILLUSTRATIONS } from '@/lib/patches/illustrations';
import { REGION_PATCH_VAR, RARITY_CSS, getRarityTier } from '@/lib/patches/rules';
import { getPatchImageUrl } from '@/lib/patches/patch-images';
import { formatVisitCount } from '@/lib/utils/format';
import type { CatalogEntry } from '@/lib/data/destination-catalog';
import type { EarnedDestination } from '@/lib/actions/destinations';

const GEO_URL =
  'https://raw.githubusercontent.com/lotusms/world-map-data/main/world-110m.json';

/** [longitude, latitude] for the dot on the mini-map */
const COORDS: Record<string, [number, number]> = {
  // Malaysia domestic
  KUL: [101.7, 3.1],  JHB: [103.7, 1.5],  PEN: [100.3, 5.4],  BKI: [116.1, 6.0],
  KCH: [110.3, 1.5],  LGK: [99.7, 6.3],   BTU: [113.0, 3.2],  TWU: [118.1, 4.3],
  // Southeast Asia
  SIN: [103.8, 1.4],  BKK: [100.7, 13.7], CGK: [107.1, -6.1], DPS: [115.2, -8.7],
  MNL: [121.0, 14.5], HAN: [105.8, 21.0], SGN: [106.7, 10.8], RGN: [96.1, 16.9],
  PNH: [104.9, 11.6], HKT: [98.3, 8.1],   CNX: [99.0, 18.8],  DAD: [108.2, 16.0],
  // East Asia
  HKG: [114.2, 22.3], NRT: [140.4, 35.8], ICN: [126.5, 37.5], KIX: [135.2, 34.4],
  FUK: [130.5, 33.6], TPE: [121.2, 25.1], PVG: [121.8, 31.1], CAN: [113.3, 23.1],
  PKX: [116.4, 39.9], SZX: [113.8, 22.6], XMN: [118.1, 24.5], CSX: [112.9, 28.2],
  TFU: [103.9, 30.6],
  // Oceania
  SYD: [151.2, -33.9], MEL: [145.0, -37.8], BNE: [153.1, -27.4],
  PER: [115.9, -31.9], AKL: [174.8, -36.9], ADL: [138.5, -34.9],
  // Middle East
  DOH: [51.6, 25.3], JED: [39.2, 21.5], MED: [39.6, 24.5],
  // Europe
  LHR: [-0.4, 51.5], CDG: [2.5, 49.0],
  // South Asia
  DEL: [77.1, 28.6],  BOM: [72.9, 19.1],  BLR: [77.6, 12.9],
  MAA: [80.3, 13.1],  HYD: [78.5, 17.4],  CCU: [88.4, 22.6],
  COK: [76.3, 10.0],  AMD: [72.6, 23.0],  ATQ: [74.9, 31.6],
  TRV: [76.9, 8.5],   DAC: [90.4, 23.7],  CMB: [79.9, 6.9],
  MLE: [73.5, 4.2],   KTM: [85.3, 27.7],
};

interface PatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: CatalogEntry | null;
  earned: EarnedDestination | null;
}

export function PatchDetailModal({ isOpen, onClose, entry, earned }: PatchDetailModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Store trigger + return focus on close
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      closeRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Escape + Tab trap
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Tab' && panelRef.current) {
      const els = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SEL));
      if (!els.length) return;
      if (e.shiftKey) {
        if (document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
      } else {
        if (document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleKey]);

  if (!entry) return null;

  const Illustration = ILLUSTRATIONS[entry.iata] ?? ILLUSTRATIONS['Generic'];
  const patchImageUrl = getPatchImageUrl(entry.iata);
  const regionColor = REGION_PATCH_VAR[entry.region];
  const visits = earned?.visits ?? 0;
  const rarity = getRarityTier(visits);
  const rarityColor = RARITY_CSS[rarity];
  const coords = COORDS[entry.iata] ?? [101.7, 3.1];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="patch-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full overflow-y-auto"
            style={{
              maxWidth: '480px',
              maxHeight: '90vh',
              background: 'var(--bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Close button */}
            <button
              ref={closeRef}
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full transition-colors"
              style={{
                width: '36px', height: '36px',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
              }}
              aria-label="Close patch details"
            >
              <X size={18} />
            </button>

            {/* Illustration hero */}
            <div
              className="flex flex-col items-center pt-10 pb-6 px-6"
              style={{ background: 'var(--surface-2)' }}
            >
              <div
                className="flex items-center justify-center mb-4"
                style={{
                  width: '200px',
                  height: '200px',
                  color: regionColor,
                  boxShadow: earned ? `0 0 0 1.5px ${rarityColor}` : undefined,
                  borderRadius: 'var(--radius-lg)',
                  background: patchImageUrl ? 'transparent' : 'var(--bg)',
                }}
              >
                {patchImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={patchImageUrl}
                    alt={`${entry.city} city patch`}
                    style={{
                      width: '200px',
                      height: '200px',
                      objectFit: 'contain',
                      filter: earned ? undefined : 'grayscale(1) opacity(0.35)',
                    }}
                  />
                ) : (
                  <Illustration size={160} />
                )}
              </div>

              {/* Rarity pill */}
              {earned && (
                <span
                  className="text-[10px] font-[700] font-mono uppercase tracking-[0.12em] px-3 py-1 rounded-full"
                  style={{ color: rarityColor, background: 'var(--bg)', border: `1px solid ${rarityColor}` }}
                >
                  {rarity}
                </span>
              )}
              {!earned && (
                <span
                  className="text-[10px] font-[700] font-mono uppercase tracking-[0.12em] px-3 py-1 rounded-full"
                  style={{ color: 'var(--text-subtle)', background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  Locked
                </span>
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* City / country */}
              <div>
                <h2
                  id="patch-modal-title"
                  className="font-[600] leading-tight"
                  style={{ fontSize: '24px', color: 'var(--text)' }}
                >
                  {entry.city}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {entry.country}
                </p>
                <p
                  className="font-mono font-[500] mt-1"
                  style={{ fontSize: '13px', color: regionColor }}
                >
                  {entry.iata}
                </p>
              </div>

              {/* Stats row */}
              {earned ? (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-[var(--radius-md)] px-4 py-3"
                    style={{ background: 'var(--surface)' }}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-subtle)' }}>
                      Total visits
                    </p>
                    <p className="font-mono font-[600] text-[22px] leading-tight" style={{ color: 'var(--text)' }}>
                      {visits}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatVisitCount(visits)}
                    </p>
                  </div>
                  <div
                    className="rounded-[var(--radius-md)] px-4 py-3"
                    style={{ background: 'var(--surface)' }}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-subtle)' }}>
                      Status
                    </p>
                    <p className="font-[600] text-[15px] leading-tight mt-1" style={{ color: 'var(--text)' }}>
                      {earned.isHome ? 'Home Base' : rarity}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {earned.isNew ? 'Earned this month' : 'Lifetime'}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-[var(--radius-md)] px-4 py-3 text-center"
                  style={{ background: 'var(--surface)' }}
                >
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Fly to {entry.city} to unlock this patch.
                  </p>
                </div>
              )}

              {/* Mini map */}
              <div
                className="overflow-hidden"
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '0.5px solid var(--border)',
                  height: '140px',
                }}
              >
                <ComposableMap
                  projectionConfig={{ scale: 120 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="var(--surface)"
                          stroke="var(--border)"
                          strokeWidth={0.5}
                        />
                      ))
                    }
                  </Geographies>
                  <Marker coordinates={coords}>
                    <circle r={5} fill={regionColor} />
                    <circle r={10} fill={regionColor} opacity={0.25} />
                  </Marker>
                </ComposableMap>
              </div>

              {/* Badge note for home base */}
              {earned?.isHome && (
                <p
                  className="text-center text-[12px]"
                  style={{ color: 'var(--text-subtle)', paddingBottom: '4px' }}
                >
                  Your home base — Platinum tier at{' '}
                  <span className="font-mono">100+</span> landings.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
