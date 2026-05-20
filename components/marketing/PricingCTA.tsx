'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export const PricingCTA = () => {
  const { openAuthModal } = useAuth();

  return (
    <section className="py-48 px-4 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/3 blur-[120px] rounded-full -z-10" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-8 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
            {'// FINAL BOARDING CALL'}
          </div>

          <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-text mb-8 leading-none">
            Your next flight is already<br />in the system.
            <br />
            <span className="text-accent italic font-serif font-light">
              Your calendar just doesn&apos;t know it yet.
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-text-muted font-bold leading-snug tracking-tight mb-16 max-w-2xl mx-auto">
            Join crew who&apos;ve synced their roster, collected their cities, and stopped explaining their schedule to their families using hand gestures.
          </p>

          <button
            onClick={() => openAuthModal('signup')}
            className="bg-accent text-accent-fg px-14 py-7 rounded-full text-xl font-black shadow-2xl shadow-accent/20 hover:scale-[1.05] hover:bg-accent-hover transition-all active:scale-95 flex items-center gap-4 mx-auto"
          >
            Create my free account. Boarding now.
            <ArrowRight size={24} strokeWidth={3} />
          </button>

          <p className="mt-8 text-[13px] text-text-subtle font-bold italic">
            No credit card. No catch. No PDF screenshots. Ever again.
          </p>

          <div className="mt-24 pt-12 border-t border-border">
            <div className="text-[11px] font-black text-text-subtle uppercase tracking-[0.5em] font-mono bg-surface-2 inline-block px-6 py-2 rounded-full border border-border">
              {'// FREE FOREVER FOR INDIVIDUAL CREW'}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
