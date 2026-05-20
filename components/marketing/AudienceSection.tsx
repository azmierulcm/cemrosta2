'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, PlaneTakeoff, Heart } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

const fade = (i = 0) => ({
  initial:    { opacity: 0, y: 28 },
  whileInView:{ opacity: 1, y: 0  },
  viewport:   { once: true },
  transition: { delay: i * 0.1, duration: 0.55 },
});

export const AudienceSection = () => {
  const { openAuthModal } = useAuth();

  return (
    <section className="py-32 px-4 bg-surface-2">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
            {'// FOR EVERY CREW MEMBER'}
          </div>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-text leading-none">
            Built for the <span className="text-accent">whole crew.</span>
          </h2>
        </div>

        {/* Main crew cards — 2 col on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

          {/* ── Cabin Crew ── */}
          <motion.div {...fade(0)}
            className="bg-white border border-border rounded-[2.5rem] p-10 md:p-12 flex flex-col gap-8 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-3xl bg-sky-50 border border-sky-100 flex items-center justify-center">
              <Briefcase size={26} className="text-sky-600" />
            </div>
            <div className="flex flex-col gap-5 flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600">
                Cabin Crew
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-text tracking-tight leading-tight">
                For cabin crew who have &quot;replied all&quot; to a group roster chat more than once this week.
              </h3>
              <div className="space-y-3 text-text-muted font-bold leading-relaxed text-[15px]">
                <p>
                  You&apos;ve photographed your roster. Screenshotted the screenshot. Forwarded it to mum.
                  Mum forwarded it back asking &quot;which one is your off day?&quot; You&apos;ve explained
                  standby to your partner three times and they <em>still</em> think you&apos;re lying about
                  having to work Christmas.
                </p>
                <p>
                  Cemrosta converts your roster into a real calendar, tracks every city you&apos;ve ever
                  landed, and generates a monthly card that makes it look like you&apos;re living the dream.
                  (You are. You just couldn&apos;t prove it before.)
                </p>
              </div>
            </div>
            <button
              onClick={() => openAuthModal('signup')}
              className="flex items-center gap-3 self-start bg-sky-600 text-white px-7 py-3.5 rounded-full text-[13px] font-black shadow-lg shadow-sky-600/20 hover:bg-sky-700 hover:scale-[1.02] transition-all active:scale-95"
            >
              I am cabin crew and I deserve better
              <ArrowRight size={15} strokeWidth={3} />
            </button>
          </motion.div>

          {/* ── Flight Deck ── */}
          <motion.div {...fade(0.1)}
            className="bg-white border border-border rounded-[2.5rem] p-10 md:p-12 flex flex-col gap-8 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-3xl bg-accent/5 border border-accent/15 flex items-center justify-center">
              <PlaneTakeoff size={26} className="text-accent" />
            </div>
            <div className="flex flex-col gap-5 flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                Flight Deck
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-text tracking-tight leading-tight">
                Your logbook is a masterpiece. It&apos;s also locked inside a PDF nobody can read.
              </h3>
              <div className="space-y-3 text-text-muted font-bold leading-relaxed text-[15px]">
                <p>
                  Sector counts. Block hours. Career destinations. You&apos;ve flown a million kilometres
                  and the only record of it is a roster PDF buried in your downloads folder from 2019.
                </p>
                <p>
                  Cemrosta builds a verifiable map of your career missions — automatically. Every flight
                  synced, every city earned, every sector counted. Because when you finally write that
                  LinkedIn post about 10,000 hours, you should be able to back it up.
                </p>
              </div>
            </div>
            <button
              onClick={() => openAuthModal('signup')}
              className="flex items-center gap-3 self-start bg-accent text-accent-fg px-7 py-3.5 rounded-full text-[13px] font-black shadow-lg shadow-accent/20 hover:bg-accent-hover hover:scale-[1.02] transition-all active:scale-95"
            >
              Track my career. Finally.
              <ArrowRight size={15} strokeWidth={3} />
            </button>
          </motion.div>
        </div>

        {/* ── Family — smaller full-width card ── */}
        <motion.div {...fade(0.2)}
          className="bg-white border border-border rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-xl hover:shadow-black/5 transition-all duration-500"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Heart size={20} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-2">
              Family
            </div>
            <h3 className="text-xl font-black text-text tracking-tight mb-2">
              Know exactly when to drop off and pick up.
            </h3>
            <p className="text-text-muted font-bold leading-snug text-[14px]">
              View shared crew schedules in the Family Hub — departure times, arrival times, standby
              windows, and free days. No more guessing. No more group chats.
            </p>
          </div>
          <button
            onClick={() => openAuthModal('signup')}
            className="flex items-center gap-2 shrink-0 border border-border px-6 py-2.5 rounded-full text-[12px] font-black text-text-muted hover:text-text hover:border-text-subtle transition-all whitespace-nowrap"
          >
            Share with family
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </motion.div>

      </div>
    </section>
  );
};
