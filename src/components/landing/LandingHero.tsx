'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRosterStore } from '@/store/useRosterStore';
import { useAuthStore } from '@/store/useAuthStore';

const LandingHero = () => {
  const loadSampleRoster = useRosterStore((state) => state.loadSampleRoster);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  return (
    <section className="pt-40 pb-24 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-rausch font-bold uppercase tracking-[0.2em] text-sm mb-6"
        >
          Stop fighting your airline&apos;s IT department.
        </motion.p>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 mb-8 leading-[0.9]"
        >
          Your PDF roster, <br />
          <span className="text-gray-400 italic font-serif font-light">transformed.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-500 mb-12 max-w-3xl mx-auto font-medium leading-relaxed"
        >
          Drop your monthly roster PDF. We automatically extract your flights, 
          sync them to your calendar in local time, and build a beautiful &apos;passport&apos; 
          of the cities you&apos;ve flown to. <span className="text-gray-900 font-bold">Ready in 10 seconds.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <button 
            onClick={() => openAuthModal('signup')}
            className="bg-rausch text-white px-10 py-5 rounded-2xl text-lg font-black shadow-2xl shadow-rausch/30 hover:scale-105 active:scale-95 transition-all w-full md:w-auto text-center"
          >
            Sign Up Now →
          </button>
          <button 
            onClick={loadSampleRoster}
            className="bg-white text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-2xl text-lg font-black hover:bg-gray-50 active:scale-95 transition-all w-full md:w-auto"
          >
            View Sample Profile
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingHero;
