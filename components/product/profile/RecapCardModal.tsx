'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Check, Smartphone, Monitor } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapFocus(container: HTMLElement, e: KeyboardEvent) {
  const els = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (!els.length) return;
  if (e.key !== 'Tab') return;
  if (e.shiftKey) {
    if (document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
  } else {
    if (document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
  }
}
import { recentPeriodKeys, parsePeriodKey } from '@/lib/recap/period';
import type { RecapPeriod } from '@/lib/recap/types';

interface RecapCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

type RecapFormat = 'stories' | 'card';

const PERIOD_TABS: { type: RecapPeriod; label: string }[] = [
  { type: 'month', label: 'Monthly' },
  { type: '6m', label: '6 Months' },
  { type: '1y', label: '1 Year' },
];

/** Build the image API URL for a given period + format */
function buildUrl(userId: string, period: RecapPeriod, key: string, format: RecapFormat): string {
  if (period === 'month') {
    const [year, month] = key.split('-');
    return `/api/recap/${userId}/${year}/${month}/${format}`;
  }
  if (period === '6m') {
    const [year, half] = key.split('-H');
    return `/api/recap/${userId}/${year}/6m/${half}/${format}`;
  }
  // 1y
  return `/api/recap/${userId}/${key}/1y/${format}`;
}

const RECAP_TITLE_ID = 'recap-modal-title';

export function RecapCardModal({ isOpen, onClose, userId }: RecapCardModalProps) {
  const [periodType, setPeriodType] = useState<RecapPeriod>('month');
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      });
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (panelRef.current) trapFocus(panelRef.current, e);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);
  const [format, setFormat] = useState<RecapFormat>('stories');
  const [isCopied, setIsCopied] = useState(false);
  const [imgState, setImgState] = useState<'loading' | 'ok' | 'error'>('loading');

  const periodKeys = recentPeriodKeys(periodType, 6);
  const [selectedKey, setSelectedKey] = useState<string>(periodKeys[0] ?? '');

  // Reset selected key when period type changes
  const handlePeriodChange = (type: RecapPeriod) => {
    setPeriodType(type);
    setSelectedKey(recentPeriodKeys(type, 6)[0] ?? '');
  };

  const currentPeriodKeys = recentPeriodKeys(periodType, 6);
  const effectiveKey = currentPeriodKeys.includes(selectedKey) ? selectedKey : currentPeriodKeys[0] ?? '';
  const imageUrl = buildUrl(userId, periodType, effectiveKey, format);

  // Reset image state whenever the URL changes (period, format, key switch)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImgState('loading');
  }, [imageUrl]);

  const periodLabel = effectiveKey
    ? parsePeriodKey(periodType, effectiveKey).label
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + imageUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${periodLabel} Mission Recap`,
          text: 'Check out my flight stats on Cemrosta!',
          url: window.location.origin + imageUrl,
        });
      } catch {
        /* ignore */
      }
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`${imageUrl}?download=1`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `Recap-${effectiveKey}-${format === 'card' ? 'Card' : 'Stories'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('[RecapCardModal] download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/80 backdrop-blur-md"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={RECAP_TITLE_ID}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="w-full max-w-5xl bg-white border border-border rounded-[3rem] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
          >
            {/* ── Left: Preview ── */}
            <div className="flex-1 bg-surface-2 p-8 md:p-12 flex flex-col items-center border-b md:border-b-0 md:border-r border-border overflow-y-auto">

              {/* Period type tabs */}
              <div className="flex items-center gap-1 mb-6 bg-white p-1 rounded-full border border-border shadow-sm self-stretch justify-center">
                {PERIOD_TABS.map((tab) => (
                  <button
                    key={tab.type}
                    onClick={() => handlePeriodChange(tab.type)}
                    className="flex-1 px-4 py-2 rounded-full text-[11px] font-[700] uppercase tracking-widest transition-all"
                    style={{
                      background: periodType === tab.type ? 'var(--accent)' : 'transparent',
                      color: periodType === tab.type ? 'var(--accent-fg)' : 'var(--text-muted)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Period key picker */}
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {currentPeriodKeys.map((key) => {
                  const cfg = parsePeriodKey(periodType, key);
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedKey(key)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-[600] border transition-all"
                      style={{
                        background: effectiveKey === key ? 'var(--text)' : 'transparent',
                        color: effectiveKey === key ? 'var(--bg)' : 'var(--text-muted)',
                        borderColor: effectiveKey === key ? 'var(--text)' : 'var(--border)',
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Format toggle */}
              <div className="flex items-center gap-2 mb-8 bg-white p-1 rounded-full border border-border shadow-sm">
                <button
                  onClick={() => setFormat('stories')}
                  className="flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-[800] uppercase tracking-widest transition-all"
                  style={{
                    background: format === 'stories' ? 'var(--accent)' : 'transparent',
                    color: format === 'stories' ? 'var(--accent-fg)' : 'var(--text-muted)',
                  }}
                >
                  <Smartphone size={13} /> Stories
                </button>
                <button
                  onClick={() => setFormat('card')}
                  className="flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-[800] uppercase tracking-widest transition-all"
                  style={{
                    background: format === 'card' ? 'var(--accent)' : 'transparent',
                    color: format === 'card' ? 'var(--accent-fg)' : 'var(--text-muted)',
                  }}
                >
                  <Monitor size={13} /> Card
                </button>
              </div>

              {/* Image preview */}
              <div
                className="relative bg-surface-2 rounded-2xl overflow-hidden shadow-xl border border-border transition-all duration-500 flex items-center justify-center"
                style={
                  format === 'stories'
                    ? { aspectRatio: '9/16', height: 480 }
                    : { aspectRatio: '1.91/1', width: '100%', maxWidth: 440 }
                }
              >
                {/* Loading spinner */}
                {imgState === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    <p className="text-[11px] font-[600] text-text-muted uppercase tracking-widest">Rendering…</p>
                  </div>
                )}

                {/* Error state */}
                {imgState === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center z-10">
                    <p className="text-[13px] font-[700] text-text">Preview unavailable</p>
                    <p className="text-[11px] text-text-muted leading-snug">No roster data found for this period. Upload a roster first.</p>
                  </div>
                )}

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt="Recap preview"
                  className="w-full h-full object-cover"
                  style={{ opacity: imgState === 'ok' ? 1 : 0 }}
                  loading="eager"
                  onLoad={() => setImgState('ok')}
                  onError={() => setImgState('error')}
                />
              </div>
            </div>

            {/* ── Right: Actions ── */}
            <div className="w-full md:w-[400px] p-8 md:p-12 flex flex-col bg-white shrink-0">
              <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col gap-1.5 mt-1">
                  <div style={{ width: 40, height: 6, background: 'var(--accent)', opacity: 0.2 }} />
                  <div style={{ width: 40, height: 10, background: 'var(--accent)', opacity: 0.5 }} />
                  <div style={{ width: 40, height: 20, background: 'var(--accent)' }} />
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close mission recap"
                  className="p-2.5 hover:bg-surface-2 rounded-full transition-colors text-text-muted hover:text-text"
                >
                  <X size={24} aria-hidden="true" />
                </button>
              </div>

              <h2 id={RECAP_TITLE_ID} className="font-[700] text-text leading-tight mb-3" style={{ fontSize: 32 }}>
                Share your mission.
              </h2>
              <p className="text-text-muted font-[500] leading-snug mb-8" style={{ fontSize: 15 }}>
                Your {periodLabel} highlights are ready. Download or share with your crew.
              </p>

              <div className="flex flex-col gap-3 mt-auto">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading || imgState !== 'ok'}
                  className="flex items-center justify-center gap-3 rounded-[var(--radius-pill)] font-[700] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-fg)',
                    fontSize: 16,
                    padding: '16px 24px',
                  }}
                >
                  {isDownloading
                    ? <><div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Downloading…</>
                    : <><Download size={20} strokeWidth={2.5} /> Download PNG</>
                  }
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-3 rounded-[var(--radius-pill)] font-[600] border border-border transition-all active:scale-95 hover:bg-surface-2"
                  style={{ fontSize: 15, padding: '14px 24px', color: 'var(--text)' }}
                >
                  {isCopied
                    ? <Check size={18} className="text-success" strokeWidth={2.5} />
                    : <Copy size={18} />}
                  {isCopied ? 'Link copied!' : 'Copy link'}
                </button>

                {typeof navigator !== 'undefined' && !!navigator.share && (
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-3 rounded-[var(--radius-pill)] font-[600] border border-border transition-all active:scale-95 hover:bg-surface-2"
                    style={{ fontSize: 15, padding: '14px 24px', color: 'var(--text)' }}
                  >
                    <Share2 size={18} />
                    Share directly
                  </button>
                )}
              </div>

              <p
                className="text-center font-mono font-[700] uppercase tracking-widest mt-8"
                style={{ fontSize: 10, color: 'var(--text-subtle)' }}
              >
                {"// MISSION RECAP ENGINE"}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default RecapCardModal;
