'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQS = [
  {
    q: 'Is it really free? Will it stay free?',
    a: 'Yes. Otarosta is free forever for individual crew. We may offer optional paid features in future, but the core roster sync and destination passport will always be free.',
  },
  {
    q: 'Who can see my roster data?',
    a: 'Only you. We do not share your schedule with your airline, any third party, or anyone else.',
  },
  {
    q: 'Will my airline find out I\'m using this?',
    a: 'No. Otarosta is an independent tool with no connection to any carrier. We have no relationship with MAS, AirAsia, or any airline.',
  },
  {
    q: 'Which airlines are supported?',
    a: 'Malaysia Airlines (MAS) is fully supported now. AirAsia, Batik Air, and SIA are coming soon — drop your email in the waitlist section to get notified the moment your airline goes live.',
  },
];

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-6 py-6 text-left group"
      >
        <span className="text-[16px] font-black text-text tracking-tight group-hover:text-accent transition-colors">
          {q}
        </span>
        <span className="shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center text-text-subtle group-hover:border-accent group-hover:text-accent transition-all">
          {isOpen ? <Minus size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[15px] font-bold text-text-muted leading-relaxed max-w-2xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="py-12 md:py-24 px-4 bg-surface-2">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-4 text-[11px] font-black uppercase tracking-[0.35em] text-text-muted font-mono">
            {'// FAQ'}
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text leading-none">
            Questions from the crew.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border border-border rounded-[2rem] px-5 md:px-8 py-2"
        >
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
