'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Unlink, Trash2 } from 'lucide-react';

const POINTS = [
  {
    icon: ShieldCheck,
    label: 'Stays on your device.',
    sub: 'PDF parsed in your browser. Never uploaded.',
  },
  {
    icon: Unlink,
    label: 'Zero airline ties.',
    sub: 'Independent from MAS, AirAsia, or any carrier.',
  },
  {
    icon: Trash2,
    label: 'Delete anytime.',
    sub: 'One tap. Account and data gone. No forms.',
  },
];

export const DataPrivacy = () => {
  return (
    <section className="py-12 md:py-20 px-4" style={{ background: '#0F0F0F' }}>
      <div className="max-w-5xl mx-auto">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-3 mb-8 md:mb-12"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
               style={{ background: 'rgba(255,56,92,0.15)' }}>
            <ShieldCheck size={16} style={{ color: '#FF385C' }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono"
                style={{ color: '#FF385C' }}>
            Privacy Promise
          </span>
        </motion.div>

        {/* Three trust points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {POINTS.map(({ icon: Icon, label, sub }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="flex flex-col gap-4 px-6 py-8 md:px-8 md:py-10"
              style={{ background: '#0F0F0F' }}
            >
              <Icon size={28} style={{ color: '#FF385C', opacity: 0.85 }} strokeWidth={1.75} />
              <div>
                <p className="text-[18px] md:text-[20px] font-black tracking-tight leading-tight mb-1.5"
                   style={{ color: '#F5F5F5' }}>
                  {label}
                </p>
                <p className="text-[13px] font-bold leading-snug"
                   style={{ color: '#888' }}>
                  {sub}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
