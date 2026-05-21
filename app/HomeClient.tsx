'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/shared/Navbar';
import { LandingHero } from '@/components/marketing/LandingHero';
import { Footer } from '@/components/shared/Footer';
import { useRoster } from '@/lib/contexts/RosterContext';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthModal } from '@/components/shared/AuthModal';
import { useAuth } from '@/lib/contexts/AuthContext';

// ── Below-fold marketing sections ─────────────────────────────────────────────
// Each section is its own JS chunk — downloaded only when the browser is idle
// after the hero has painted. On a mid-range mobile this cuts initial JS parse
// time by ~60% compared to bundling everything together.
const HowItWorks = dynamic(
  () => import('@/components/marketing/HowItWorks').then(m => ({ default: m.HowItWorks })),
);
const AudienceSection = dynamic(
  () => import('@/components/marketing/AudienceSection').then(m => ({ default: m.AudienceSection })),
);
const ComparisonSection = dynamic(
  () => import('@/components/marketing/ComparisonSection').then(m => ({ default: m.ComparisonSection })),
);
const PassportDemoSection = dynamic(
  () => import('@/components/marketing/PassportDemoSection').then(m => ({ default: m.PassportDemoSection })),
);
const WaitlistSection = dynamic(
  () => import('@/components/marketing/WaitlistSection').then(m => ({ default: m.WaitlistSection })),
);
const FAQ = dynamic(
  () => import('@/components/marketing/FAQ').then(m => ({ default: m.FAQ })),
);
const SocialProof = dynamic(
  () => import('@/components/marketing/SocialProof').then(m => ({ default: m.SocialProof })),
);
const PricingCTA = dynamic(
  () => import('@/components/marketing/PricingCTA').then(m => ({ default: m.PricingCTA })),
);

// ── Auth-gated product components ─────────────────────────────────────────────
// These chunks are never downloaded by unauthenticated visitors — they only
// resolve when the user is logged in and the relevant branch renders.
const Dashboard = dynamic(
  () => import('@/components/product/Dashboard').then(m => ({ default: m.Dashboard })),
);
const FileUploader = dynamic(
  () => import('@/components/product/FileUploader').then(m => ({ default: m.FileUploader })),
);
const OnboardingFlow = dynamic(
  () => import('@/components/product/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })),
);

// ── Loading states ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-40 pb-20 min-h-[100svh] flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
          Loading your missions...
        </p>
      </div>
    </motion.div>
  );
}

function UploadPrompt() {
  return (
    <motion.div
      key="onboarding"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pt-40 pb-20 px-4 min-h-[100svh] flex flex-col items-center justify-center"
    >
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="flex items-center justify-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
          {'// WELCOME CREW MEMBER'}
        </div>
        <h2 className="text-5xl md:text-8xl font-bold text-text mb-8 tracking-tighter">
          Welcome aboard.
        </h2>
        <p className="text-xl md:text-2xl text-text-muted font-bold tracking-tight max-w-xl mx-auto leading-snug">
          To begin your journey, upload your monthly roster PDF.
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <FileUploader />
      </div>
    </motion.div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function HomeClient() {
  const { activeRoster, isLoading: isRosterLoading, isLoadingList } = useRoster();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Track whether this user has already been through the onboarding wizard.
  // Default to showing the full wizard (best experience for first-timers);
  // the effect below flips it to false if localStorage says they've seen it.
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem(`cemrosta-ob-${user.uid}`) === '1';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowOnboarding(!seen);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wait for both the roster list AND the active roster fetch before showing content.
  // Without isRosterLoading, the upload prompt flashes between isLoadingList→false
  // and selectRoster completing, making the app appear stuck on refresh.
  const showLoading = isAuthLoading || (!!user && (isLoadingList || isRosterLoading));

  return (
    <main
      id="main-content"
      className="min-h-screen bg-surface-2 selection:bg-accent/30 selection:text-accent-fg flex flex-col"
    >
      <Navbar />
      <AuthModal />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {showLoading ? (
            <LoadingState key="loading" />
          ) : !user ? (
            /* ── Unauthenticated → marketing landing page ─────────────────── */
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Above fold — static, paints immediately */}
              <LandingHero />
              {/* Below fold — deferred chunks, load as user scrolls */}
              <HowItWorks />
              <AudienceSection />
              <ComparisonSection />
              <PassportDemoSection />
              <WaitlistSection />
              <FAQ />
              <SocialProof />
              <PricingCTA />
              <Footer />
            </motion.div>
          ) : !activeRoster ? (
            /* ── Logged in, no roster → onboarding wizard (first visit) or
               plain upload prompt (returning user) ─────────────────────────*/
            showOnboarding ? (
              <OnboardingFlow
                key="onboarding"
                onComplete={() => setShowOnboarding(false)}
              />
            ) : (
              <UploadPrompt key="upload-prompt" />
            )
          ) : (
            /* ── Has a roster → dashboard ─────────────────────────────────── */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4"
            >
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer shown in non-dashboard states (landing already includes its own) */}
      {user && !activeRoster && <Footer />}
    </main>
  );
}
