'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

// TODO: Replace with real testimonials from actual MAS crew members.
const TESTIMONIALS = [
  {
    quote:
      "Finally. I stopped forwarding PDF screenshots to my wife. She can actually see when I land now.",
    name: "Ahmad R.",
    role: "Senior First Officer · A350",
    initials: "AR",
  },
  {
    quote:
      "I uploaded my roster, got my calendar link, and sent it to my mum in 90 seconds. She cried. Good tears.",
    name: "Nurul H.",
    role: "Cabin Crew Supervisor · KUL Base",
    initials: "NH",
  },
  {
    quote:
      "The passport is genuinely the best thing to happen to me since 5-star layovers. Every city I've ever flown is just… there.",
    name: "Darren L.",
    role: "Captain · B737",
    initials: "DL",
  },
];

const STATS = [
  { value: "1,400+", label: "crew synced" },
  { value: "147,000+", label: "sectors tracked" },
  { value: "Free", label: "always" },
];

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay: i * 0.1, duration: 0.5 },
});

export const SocialProof = () => {
  return (
    <section className="py-10 md:py-16 px-4 bg-surface-2">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div {...fade(0)} className="text-center mb-10 md:mb-16">
          <div className="flex items-center justify-center gap-2 mb-4 text-[11px] font-black uppercase tracking-[0.35em] text-text-muted font-mono">
            {'// TRUSTED BY CREW'}
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text leading-none">
            Trusted by MAS crew<br />
            <span className="text-accent">on the KUL network.</span>
          </h2>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          {...fade(0.05)}
          className="flex flex-wrap justify-center gap-3 mb-10 md:mb-16"
        >
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 bg-white border border-border rounded-full px-6 py-2.5"
            >
              <span className="text-[17px] font-black text-text tracking-tight">{value}</span>
              <span className="text-[12px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              {...fade(0.1 + i * 0.1)}
              className="bg-white border border-border rounded-[2rem] p-8 flex flex-col gap-6 hover:shadow-xl hover:shadow-black/5 transition-all duration-500"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={13} className="text-accent fill-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[15px] font-bold text-text-muted leading-snug flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Attribution */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[11px] font-black text-accent shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-[13px] font-black text-text tracking-tight">{t.name}</p>
                  <p className="text-[11px] font-bold text-text-subtle">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
