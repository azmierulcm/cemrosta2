'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

const PricingCTA = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-40 px-4 bg-bg relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 blur-[100px] rounded-full -z-10" />
      
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter text-text mb-8">
            Ready for <br /> <span className="text-accent italic font-serif font-light">takeoff.</span>
          </h2>
          <p className="text-xl text-text-muted mb-12 max-w-2xl mx-auto font-medium">
            Join the Malaysia Airlines crew members already using Cemrosta to own their flight data.
          </p>
          
          <button 
            onClick={scrollToTop}
            className="bg-accent text-accent-fg px-12 py-6 rounded-[2rem] text-xl font-bold shadow-2xl shadow-accent/20 hover:scale-[1.02] hover:bg-accent-hover transition-all active:scale-95 flex items-center gap-3 mx-auto"
          >
            <Upload size={24} strokeWidth={3} />
            Upload your roster
          </button>

          <div className="mt-12 space-y-6">
            <p className="text-text-muted font-medium italic">
              Crew members get access to a verified marketplace for headsets, luggage, manuals, and uniforms.
            </p>
            <div className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.4em] font-mono">
              // FREE FOREVER FOR INDIVIDUAL CREW
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingCTA;
