'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

// ── Step 1 preview: PDF upload drop zone ──────────────────────────────────────
function UploadPreview() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/3 p-8 flex flex-col items-center justify-center gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
        <Upload size={24} className="text-accent" />
      </div>
      <div>
        <p className="text-[13px] font-black text-text mb-1">Drop your Roster PDF here</p>
        <p className="text-[11px] text-text-muted font-bold">or click to browse</p>
      </div>
      {/* Fake progress bar */}
      <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: '0%' }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, delay: 0.3, ease: 'easeInOut' }}
        />
      </div>
      <p className="text-[10px] font-black font-mono text-accent uppercase tracking-widest">
        Parsing roster...
      </p>
    </div>
  );
}

// ── Step 2 preview: Duty tile cards ──────────────────────────────────────────
function RosterPreview() {
  const tiles = [
    { date: '14', band: 'bg-sky-50 text-sky-700',    label: 'Duty',    from: 'KUL', to: 'LHR', flight: 'MH001', time: '23:50 → 06:10+' },
    { date: '15', band: 'bg-amber-50 text-amber-700', label: 'Layover', from: '',    to: '',     flight: '',      time: 'London Heathrow' },
    { date: '16', band: 'bg-sky-50 text-sky-700',    label: 'Duty',    from: 'LHR', to: 'KUL', flight: 'MH002', time: '13:30 → 08:20+' },
    { date: '17', band: 'bg-green-50 text-green-700', label: 'Rest',   from: '',    to: '',     flight: '',      time: 'Rest day' },
  ];

  return (
    <div className="space-y-2">
      {tiles.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.35 }}
          className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm"
        >
          <div className={`flex items-center gap-2 px-3 py-1.5 ${t.band}`}>
            <span className="text-[15px] font-bold tabular-nums">{t.date}</span>
            <span className="text-[10px] font-black uppercase tracking-wide">{t.label}</span>
          </div>
          <div className="px-3 py-2">
            {t.flight ? (
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-neutral-700">{t.from}</span>
                <div className="text-center">
                  <div className="text-[11px] font-bold text-green-700">{t.flight}</div>
                  <div className="text-[10px] text-neutral-400">{t.time}</div>
                </div>
                <span className="text-[12px] font-semibold text-neutral-700">{t.to}</span>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 font-medium text-center">{t.time}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Step 3 preview: City patch grid ──────────────────────────────────────────
const STEP3_PATCHES = [
  { src: '/images/city_patches/kuala_lumpur_patch.png', city: 'KUL', count: 12 },
  { src: '/images/city_patches/london_patch.png',       city: 'LHR', count: 4  },
  { src: '/images/city_patches/singapore_patch.png',    city: 'SIN', count: 7  },
  { src: '/images/city_patches/hong_kong_patch.png',    city: 'HKG', count: 3  },
  { src: '/images/city_patches/bangkok_patch.png',      city: 'BKK', count: 5  },
  { src: '/images/city_patches/paris_patch.png',        city: 'CDG', count: 2  },
  { src: '/images/city_patches/sydney_patch.png',       city: 'SYD', count: 2  },
  { src: '/images/city_patches/seoul_patch.png',        city: 'ICN', count: 1  },
];

function PassportPreview() {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-black uppercase italic tracking-tight text-text">Destinations</span>
        <span className="text-[9px] font-black font-mono text-text-subtle bg-surface-2 border border-border px-2 py-0.5 rounded-full">
          8 / 60 collected
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {STEP3_PATCHES.map((p, i) => (
          <motion.div
            key={p.city}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="relative w-full aspect-square">
              <Image src={p.src} alt={p.city} fill sizes="80px" className="object-contain drop-shadow-sm" />
            </div>
            <span className="text-[8px] font-black font-mono text-text-muted">{p.city}</span>
            <span className="text-[7px] font-black text-text-subtle">{p.count}×</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: '01',
    title: 'Drop your roster',
    desc:  'Drag your Roster PDF in. We extract every flight, standby, and rest day instantly — no manual entry.',
    preview: <UploadPreview />,
  },
  {
    n: '02',
    title: 'Your duties, beautifully organised',
    desc:  'Every duty tile shows your flight number, route, and times. Tap any tile to edit or add notes.',
    preview: <RosterPreview />,
  },
  {
    n: '03',
    title: 'Collect every city you fly to',
    desc:  'Each destination earns a city patch in your digital passport. Watch your collection grow with every mission.',
    preview: <PassportPreview />,
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-10 md:py-16 px-4 bg-surface-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 md:mb-20">
          <div className="flex items-center gap-2 mb-5 text-[11px] font-black uppercase tracking-[0.35em] text-text-muted font-mono">
            {'// HOW IT WORKS'}
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text leading-none">
            Three steps.<br />
            <span className="text-accent">Ready in seconds.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="flex flex-col gap-5"
            >
              {/* Product UI preview */}
              <div className="flex-1">
                {step.preview}
              </div>

              {/* Step label */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[11px] font-black font-mono text-accent bg-accent/5 border border-accent/15 px-2.5 py-1 rounded-full">
                    {step.n}
                  </span>
                  <h3 className="text-xl font-black text-text tracking-tight">{step.title}</h3>
                </div>
                <p className="text-[14px] text-text-muted font-bold leading-snug">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
