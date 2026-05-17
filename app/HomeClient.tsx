'use client';

import React from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { LandingHero } from '@/components/marketing/LandingHero';
import { ComparisonSection } from '@/components/marketing/ComparisonSection';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { PassportTeaser } from '@/components/marketing/PassportTeaser';
import { AudienceSection } from '@/components/marketing/AudienceSection';
import { PricingCTA } from '@/components/marketing/PricingCTA';
import { Dashboard } from '@/components/product/Dashboard';
import { FileUploader } from '@/components/product/FileUploader';
import { Footer } from '@/components/shared/Footer';
import { useRoster } from '@/lib/contexts/RosterContext';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthModal } from '@/components/shared/AuthModal';
import { useAuth } from '@/lib/contexts/AuthContext';

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
          {"// WELCOME CREW MEMBER"}
        </div>
        <h2 className="text-5xl md:text-8xl font-bold text-text mb-8 tracking-tighter">Welcome aboard.</h2>
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

export default function HomeClient() {
  const { activeRoster, isLoading: isRosterLoading, isLoadingList } = useRoster();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Wait for both the roster list AND the active roster fetch before showing content.
  // Without isRosterLoading, the upload prompt flashes between isLoadingList→false
  // and selectRoster completing, making the app appear stuck on refresh.
  const showLoading = isAuthLoading || (!!user && (isLoadingList || isRosterLoading));

  return (
    <main id="main-content" className="min-h-screen bg-surface-2 selection:bg-accent/30 selection:text-accent-fg flex flex-col">
      <Navbar />
      <AuthModal />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {showLoading ? (
            <LoadingState key="loading" />
          ) : !user ? (
            /* Unauthenticated → full marketing landing page */
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LandingHero />
              <ComparisonSection />
              <HowItWorks />
              <PassportTeaser />
              <AudienceSection />
              <PricingCTA />
              <Footer />
            </motion.div>
          ) : !activeRoster ? (
            /* Logged in but no rosters yet → upload prompt */
            <UploadPrompt key="onboarding" />
          ) : (
            /* Has a roster → dashboard */
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

      {/* Footer only shown in non-dashboard states (landing already includes it) */}
      {user && !activeRoster && <Footer />}
    </main>
  );
}
