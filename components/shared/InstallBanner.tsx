'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share } from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────────
 * PWA Install Banner
 *
 * Android/Chrome — listens for `beforeinstallprompt`, shows a bottom sheet
 *   with a one-tap "Add to Home Screen" button.
 * iOS/Safari     — `beforeinstallprompt` never fires; shows a step-by-step
 *   Share → Add to Home Screen instruction instead.
 *
 * Dismissal is stored in localStorage for 30 days.
 * The banner only appears on mobile viewports (md:hidden).
 * ────────────────────────────────────────────────────────────────────────────*/

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY  = 'cemrosta-install-dismissed';
const DISMISS_DAYS = 30;

function wasDismissed(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < DISMISS_DAYS * 86_400_000;
  } catch { return false; }
}

function markDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
}

function detectIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallBanner() {
  const [prompt, setPrompt]       = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS]         = useState(false);
  const [visible, setVisible]     = useState(false);

  useEffect(() => {
    if (isInstalled() || wasDismissed()) return;

    const ios = detectIOS();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIOS(ios);

    if (ios) {
      // iOS: no native event — show instructions after a short delay
      const t = setTimeout(() => setVisible(true), 5000);
      return () => clearTimeout(t);
    }

    // Android/Chrome: wait for the browser to decide the app is installable
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 4000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    markDismissed();
    setVisible(false);
  };

  // Only show when there's something to act on
  const show = visible && (!!prompt || isIOS);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed bottom-0 inset-x-0 z-[60] px-4 pb-6 md:hidden"
          role="dialog"
          aria-label="Install Cemrosta"
        >
          <div className="bg-white rounded-[1.5rem] shadow-2xl shadow-black/25 border border-border overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                {/* App icon (mirrors the logo in the Navbar) */}
                <div className="w-11 h-11 rounded-[14px] bg-accent flex items-center justify-center shadow-md shadow-accent/30">
                  <div className="flex flex-col gap-[3px]">
                    <div className="w-[14px] h-[2px] bg-white/40 rounded-full" />
                    <div className="w-[14px] h-[4px] bg-white/65 rounded-full" />
                    <div className="w-[14px] h-[7px] bg-white rounded-full" />
                  </div>
                </div>
                <div className="leading-tight">
                  <p className="text-[14px] font-black text-text tracking-tight">Cemrosta</p>
                  <p className="text-[11px] font-bold text-text-muted">Add to Home Screen</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-subtle active:bg-surface-3 transition-colors"
                aria-label="Dismiss install prompt"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {isIOS ? (
                /* iOS — manual Share → Add to Home Screen guide */
                <>
                  <p className="text-[13px] font-bold text-text-muted leading-snug mb-1">
                    Access your roster anytime — even offline. No App Store needed.
                  </p>
                  <div className="flex items-start gap-3 bg-surface-2 rounded-xl px-4 py-3 mb-4 mt-3">
                    <span className="text-[11px] font-black text-text-subtle font-mono mt-0.5">1</span>
                    <p className="text-[12px] font-bold text-text-muted leading-snug">
                      Tap the{' '}
                      <span className="inline-flex items-center gap-1 text-accent font-black">
                        <Share size={12} strokeWidth={2.5} />
                        Share
                      </span>
                      {' '}button at the bottom of Safari
                    </p>
                  </div>
                  <div className="flex items-start gap-3 bg-surface-2 rounded-xl px-4 py-3 mb-4">
                    <span className="text-[11px] font-black text-text-subtle font-mono mt-0.5">2</span>
                    <p className="text-[12px] font-bold text-text-muted leading-snug">
                      Scroll down and tap{' '}
                      <span className="font-black text-text">Add to Home Screen</span>
                    </p>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="w-full py-3.5 rounded-xl bg-accent text-accent-fg text-[13px] font-black hover:bg-accent-hover active:scale-[0.98] transition-all"
                  >
                    Got it
                  </button>
                </>
              ) : (
                /* Android — one-tap install */
                <>
                  <p className="text-[13px] font-bold text-text-muted leading-snug mb-4">
                    Instant access to your roster — loads in under a second, works offline, no browser bar.
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleDismiss}
                      className="flex-1 py-3.5 rounded-xl border border-border text-[13px] font-black text-text-muted active:bg-surface-2 transition-colors"
                    >
                      Later
                    </button>
                    <button
                      onClick={handleInstall}
                      className="flex-[2] py-3.5 rounded-xl bg-accent text-accent-fg text-[13px] font-black hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={15} strokeWidth={2.5} />
                      Add to Home Screen
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
