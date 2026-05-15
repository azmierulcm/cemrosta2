'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Zap, Heart } from 'lucide-react';
import HeroAnimation from './HeroAnimation';
import FileUploader from '../product/FileUploader';
import WaitlistSheet from './WaitlistSheet';

const FORMAT_PILLS = [
  { name: 'MAS AIMS', status: 'live' },
  { name: 'AirAsia', status: 'soon' },
  { name: 'Batik Air', status: 'soon' },
  { name: 'SIA', status: 'soon' },
];

const LandingHero = () => {
  const shouldReduceMotion = useReducedMotion();
  const [waitlistAirline, setWaitlistAirline] = useState<string | null>(null);
  const rostersProcessed = 1242; // Seeded constant + real count logic would go here

  return (
    <section className="pt-32 pb-24 px-4 min-h-[100svh] flex flex-col items-center bg-bg relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-5xl mx-auto text-center flex-1 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <HeroAnimation />
          
          <h1 className="text-4xl md:text-7xl font-bold tracking-tighter text-text mb-6 mt-8 max-w-4xl mx-auto leading-[1.1]">
            Your roster, <span className="text-accent italic font-serif font-light">transformed.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-muted mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Drop your Malaysia Airlines roster PDF. Get a synced calendar and a digital passport of every city you&apos;ve flown to.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full max-w-2xl mb-12"
        >
          <FileUploader />
          
          {/* Format Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
             {FORMAT_PILLS.map((pill) => (
               <button
                 key={pill.name}
                 onClick={() => pill.status === 'soon' && setWaitlistAirline(pill.name)}
                 className={`
                   px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border
                   ${pill.status === 'live' 
                     ? 'bg-accent/10 border-accent/20 text-accent' 
                     : 'bg-surface border-border text-text-subtle hover:border-accent/30 hover:text-text'}
                 `}
               >
                 {pill.name}
                 {pill.status === 'live' ? <CheckCircle2 size={12} strokeWidth={3} /> : <span className="opacity-50">· soon</span>}
               </button>
             ))}
          </div>
        </motion.div>
      </div>

      {/* Trust Strip */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-7xl mx-auto mt-auto pt-12 border-t border-border flex flex-wrap justify-center md:justify-between items-center gap-8 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-text-subtle font-mono"
      >
        <div className="flex items-center gap-3">
          <Zap size={14} className="text-accent" />
          <span>Built for Malaysia Airlines Crew</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 size={14} className="text-success" />
          <span>{rostersProcessed.toLocaleString()} Rosters Processed</span>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck size={14} className="text-accent" />
          <span>Data never leaves your browser</span>
        </div>
        <div className="flex items-center gap-3">
          <Heart size={14} className="text-danger" />
          <span>Free Forever for individual crew</span>
        </div>
      </motion.div>

      <WaitlistSheet 
        isOpen={!!waitlistAirline} 
        onClose={() => setWaitlistAirline(null)} 
        airline={waitlistAirline || ''} 
      />
    </section>
  );
};

export default LandingHero;
