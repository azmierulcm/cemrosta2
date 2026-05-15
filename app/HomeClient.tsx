'use client';

import React from 'react';
import Navbar from '@/components/shared/Navbar';
import LandingHero from '@/components/marketing/LandingHero';
import ComparisonSection from '@/components/marketing/ComparisonSection';
import HowItWorks from '@/components/marketing/HowItWorks';
import AudienceSection from '@/components/marketing/AudienceSection';
import PricingCTA from '@/components/marketing/PricingCTA';
import Dashboard from '@/components/product/Dashboard';
import FileUploader from '@/components/product/FileUploader';
import { useRoster } from '@/lib/contexts/RosterContext';
import { AnimatePresence, motion } from 'framer-motion';

import AuthModal from '@/components/shared/AuthModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/utils/supabase';

export default function HomeClient() {
  const { roster } = useRoster();
  const { user, setUser } = useAuth();

  React.useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <main className="min-h-screen bg-bg selection:bg-accent/30 selection:text-accent-fg">
      <Navbar />
      <AuthModal />
      
      <AnimatePresence mode="wait">
        {/* Scenario 1: User is not logged in - Show Landing Page */}
        {!user && !roster ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <LandingHero />
            <ComparisonSection />
            <HowItWorks />
            <AudienceSection />
            <PricingCTA />

            <footer className="py-20 border-t border-border text-center">
              <p className="text-text-subtle text-xs font-bold uppercase tracking-[0.4em]">
                © 2026 Cemrosta • Digital Crew Passport
              </p>
            </footer>
          </motion.div>
        ) : !roster ? (
          /* Scenario 2: User is logged in but has NO roster - Show Upload Zone */
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-40 pb-20 px-4 min-h-screen flex flex-col items-center justify-center"
          >
            <div className="max-w-4xl mx-auto text-center mb-12">
               <h2 className="text-4xl md:text-6xl font-bold text-text mb-6 tracking-tighter">Welcome aboard.</h2>
               <p className="text-xl text-text-muted font-medium">To begin your journey, please upload your monthly roster PDF.</p>
            </div>
            <div className="w-full max-w-2xl">
              <FileUploader />
            </div>
          </motion.div>
        ) : (
          /* Scenario 3: Roster exists - Show Dashboard */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-32"
          >
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
