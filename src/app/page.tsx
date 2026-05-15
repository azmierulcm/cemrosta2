'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import LandingHero from '@/components/landing/LandingHero';
import ComparisonSection from '@/components/landing/ComparisonSection';
import HowItWorks from '@/components/landing/HowItWorks';
import AudienceSection from '@/components/landing/AudienceSection';
import PricingCTA from '@/components/landing/PricingCTA';
import Dashboard from '@/components/Dashboard';
import FileUploader from '@/components/FileUploader';
import { useRosterStore } from '@/store/useRosterStore';
import { AnimatePresence, motion } from 'framer-motion';

import AuthModal from '@/components/AuthModal';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/utils/supabase';

export default function Home() {
  const { roster } = useRosterStore();
  const { user, setUser } = useAuthStore();

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
    <main className="min-h-screen bg-white">
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

            <footer className="py-12 border-t border-gray-100 text-center">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                © 2026 Cemrosta • Built for the Crew
              </p>
            </footer>
          </motion.div>
        ) : !roster ? (
          /* Scenario 2: User is logged in but has NO roster - Show Upload Zone */
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-40 pb-20"
          >
            <div className="max-w-4xl mx-auto text-center mb-12">
               <h2 className="text-4xl font-black text-gray-900 mb-4">Welcome aboard.</h2>
               <p className="text-xl text-gray-500 font-medium">To begin your journey, please upload your monthly roster PDF.</p>
            </div>
            <FileUploader />
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
