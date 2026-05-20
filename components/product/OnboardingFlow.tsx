'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, Calendar, Globe2, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import dynamic from 'next/dynamic';

const FileUploader = dynamic(
  () => import('@/components/product/FileUploader').then((m) => ({ default: m.FileUploader })),
);

/* ── Options (mirrors SettingsClient) ────────────────────────────────────────*/
const RANKS = [
  'Captain',
  'Senior First Officer',
  'First Officer',
  'Second Officer',
  'Purser',
  'Senior Cabin Crew',
  'Cabin Crew',
  'Cadet',
];

const FLEET = [
  'Airbus A350-900',
  'Airbus A330-300',
  'Airbus A330-200',
  'Boeing 737-800',
  'Boeing 737 MAX 8',
  'Boeing 777-200ER',
  'Boeing 787-9',
  'Mixed Fleet',
];

/* ── Step progress bar ───────────────────────────────────────────────────────*/
type StepId = 'welcome' | 'profile' | 'upload';
const STEPS: StepId[] = ['welcome', 'profile', 'upload'];

function ProgressDots({ current }: { current: StepId }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-[6px] mb-10">
      {STEPS.map((s, i) => (
        <motion.div
          key={s}
          animate={{
            width:   i === idx ? 28 : 7,
            opacity: i <= idx  ? 1  : 0.25,
          }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="h-[6px] rounded-full bg-accent"
        />
      ))}
    </div>
  );
}

/* ── Shared select wrapper ───────────────────────────────────────────────────*/
function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={14}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none"
      />
    </div>
  );
}

const selectCls =
  'w-full bg-surface-2 border border-border rounded-2xl px-4 py-3.5 text-[14px] text-text font-medium focus:outline-none focus:border-accent focus:bg-white transition-colors appearance-none';

const inputCls =
  'w-full bg-surface-2 border border-border rounded-2xl px-4 py-3.5 text-[14px] text-text font-medium placeholder:text-text-subtle focus:outline-none focus:border-accent focus:bg-white transition-colors';

/* ── Slide animation variants ────────────────────────────────────────────────*/
const slide = {
  enter:  { x: 32,  opacity: 0 },
  center: { x: 0,   opacity: 1 },
  exit:   { x: -32, opacity: 0 },
};
const transition = { duration: 0.22, ease: 'easeOut' as const };

/* ── Main component ──────────────────────────────────────────────────────────*/
interface OnboardingFlowProps {
  /** Called after the user's first roster upload completes. */
  onComplete?: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, profile, setProfile } = useAuth();
  const [step, setStep] = useState<StepId>('welcome');
  const [form, setForm] = useState({ rank: '', fleet: '', base: '' });
  const [saving, setSaving] = useState(false);

  const firstName =
    user?.displayName?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Crew';

  /* ── Handlers ─────────────────────────────────────────────────────────────*/

  const handleStart = () => {
    // Mark that this user has started onboarding so on next session without a
    // roster we show the plain upload screen instead of the full wizard again.
    if (user) {
      try { localStorage.setItem(`cemrosta-ob-${user.uid}`, '1'); } catch { /* */ }
    }
    setStep('profile');
  };

  const handleSaveProfile = async () => {
    if (!user) { setStep('upload'); return; }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rank:  form.rank  || undefined,
          fleet: form.fleet || undefined,
          base:  form.base  ? form.base.toUpperCase() : undefined,
        }),
      });
      // Mirror into context so the passport / recap cards update instantly
      if (form.rank || form.fleet || form.base) {
        setProfile({
          ...(profile ?? { id: user.uid }),
          ...(form.rank  && { rank:  form.rank }),
          ...(form.fleet && { fleet: form.fleet }),
          ...(form.base  && { base:  form.base.toUpperCase() }),
        });
      }
    } catch {
      // Non-critical — they can always set this in Settings later
    } finally {
      setSaving(false);
      setStep('upload');
    }
  };

  const handleUploadSuccess = () => {
    onComplete?.();
  };

  /* ── Render ───────────────────────────────────────────────────────────────*/
  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center px-4 pt-20 pb-16">
      <div className="w-full max-w-[480px]">
        <ProgressDots current={step} />

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Welcome ────────────────────────────────────────────*/}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="space-y-8"
            >
              {/* Eyebrow */}
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono text-center">
                {'// WELCOME CREW MEMBER'}
              </p>

              {/* Headline */}
              <div className="text-center space-y-3">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-text leading-none">
                  Hey, {firstName}.
                </h1>
                <p className="text-[16px] font-bold text-text-muted leading-snug">
                  Here&apos;s what happens when you upload<br className="hidden sm:block" /> your AIMS roster PDF.
                </p>
              </div>

              {/* Feature cards */}
              <div className="space-y-3">
                {[
                  {
                    icon: Calendar,
                    title: 'Synced calendar',
                    desc: 'Every duty imported into iPhone, Google, or any calendar app — automatically.',
                    color: 'bg-blue-50 text-blue-600',
                  },
                  {
                    icon: Globe2,
                    title: 'Destination passport',
                    desc: 'Every city you\'ve ever flown to, building up month by month for your lifetime.',
                    color: 'bg-green-50 text-green-600',
                  },
                  {
                    icon: BarChart3,
                    title: 'Monthly recap card',
                    desc: 'A shareable summary of your block hours, sectors, and destinations.',
                    color: 'bg-purple-50 text-purple-600',
                  },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <div
                    key={title}
                    className="flex items-start gap-4 bg-white border border-border rounded-2xl px-5 py-4 shadow-sm"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <Icon size={17} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-text leading-tight">{title}</p>
                      <p className="text-[12px] font-medium text-text-muted leading-snug mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleStart}
                className="w-full py-4 rounded-2xl bg-accent text-accent-fg text-[14px] font-black hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              >
                Get started
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>

              <p className="text-center text-[11px] font-bold text-text-subtle">
                Free forever for MAS crew · No credit card needed
              </p>
            </motion.div>
          )}

          {/* ── STEP 2: Profile ────────────────────────────────────────────*/}
          {step === 'profile' && (
            <motion.div
              key="profile"
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="space-y-8"
            >
              {/* Header */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
                  {'// STEP 1 OF 2 — YOUR PROFILE'}
                </p>
                <h2 className="text-4xl font-black tracking-tighter text-text leading-tight">
                  Tell us about yourself.
                </h2>
                <p className="text-[14px] font-bold text-text-muted leading-snug">
                  Your rank and base personalise your passport, recap cards, and dashboard.
                  You can update this any time in Settings.
                </p>
              </div>

              {/* Form */}
              <div className="bg-white border border-border rounded-[2rem] p-6 space-y-4 shadow-sm">
                {/* Rank */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
                    Rank
                  </label>
                  <SelectWrapper>
                    <select
                      value={form.rank}
                      onChange={(e) => setForm((p) => ({ ...p, rank: e.target.value }))}
                      className={selectCls}
                    >
                      <option value="">Select your rank…</option>
                      {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </SelectWrapper>
                </div>

                {/* Fleet */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
                    Fleet / Aircraft
                  </label>
                  <SelectWrapper>
                    <select
                      value={form.fleet}
                      onChange={(e) => setForm((p) => ({ ...p, fleet: e.target.value }))}
                      className={selectCls}
                    >
                      <option value="">Select your fleet…</option>
                      {FLEET.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </SelectWrapper>
                </div>

                {/* Base */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
                    Home base (IATA code)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KUL"
                    maxLength={3}
                    value={form.base}
                    onChange={(e) => setForm((p) => ({ ...p, base: e.target.value.toUpperCase() }))}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-4 rounded-2xl bg-accent text-accent-fg text-[14px] font-black hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
                >
                  {saving ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <>
                      Save &amp; continue
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep('upload')}
                  className="w-full py-3 rounded-2xl border border-border text-[13px] font-black text-text-muted hover:bg-surface-2 active:bg-surface-3 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Upload ─────────────────────────────────────────────*/}
          {step === 'upload' && (
            <motion.div
              key="upload"
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="space-y-6"
            >
              {/* Header */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
                  {'// STEP 2 OF 2 — YOUR ROSTER'}
                </p>
                <h2 className="text-4xl font-black tracking-tighter text-text leading-tight">
                  Drop your AIMS PDF.
                </h2>
                <p className="text-[14px] font-bold text-text-muted leading-snug">
                  Use your current or most recent monthly roster.
                  We&apos;ll parse it and have your calendar ready in seconds.
                </p>
              </div>

              {/* Tip chips */}
              <div className="flex flex-wrap gap-2">
                {['PDF only', 'MAS AIMS format', 'Max 10 MB', 'Data never shared'].map((tip) => (
                  <span
                    key={tip}
                    className="px-3 py-1 rounded-full bg-surface-2 border border-border text-[11px] font-black text-text-muted"
                  >
                    {tip}
                  </span>
                ))}
              </div>

              {/* Uploader */}
              <FileUploader onSuccess={handleUploadSuccess} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
