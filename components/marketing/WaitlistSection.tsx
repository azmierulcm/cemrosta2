'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { joinWaitlist } from '@/lib/actions/waitlist';

const AIRLINES = ['AirAsia', 'Batik Air', 'SIA'] as const;
type Airline = typeof AIRLINES[number];

export const WaitlistSection = () => {
  const [selected, setSelected] = useState<Airline>('AirAsia');
  const [email,    setEmail]    = useState('');
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    try {
      await joinWaitlist(email, selected);
      setStatus('success');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <section className="py-10 md:py-16 px-4 bg-text relative overflow-hidden">
      {/* Subtle glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/20 blur-[120px] rounded-full" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/30 font-mono">
            {'// COMING SOON'}
          </div>

          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight mb-6">
            AirAsia crew, Batik crew —<br />
            <span style={{ color: '#FF385C' }}>we see you. We&apos;re coming.</span>
          </h2>

          <p className="text-white/60 font-bold text-lg leading-relaxed max-w-xl mx-auto mb-12">
            You&apos;ve been flying on vibes and WhatsApp group screenshots long enough.
            Drop your email and you&apos;ll be first to board when your airline goes live.
            No spam. Just one very satisfying notification.
          </p>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-400" />
              </div>
              <p className="text-white font-black text-xl tracking-tight">You&apos;re on the list.</p>
              <p className="text-white/50 font-bold">
                We&apos;ll ping you the moment {selected} goes live. Until then — smooth flights. 🛫
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
              {/* Airline selector */}
              <div className="flex gap-2 p-1 rounded-full bg-white/10 border border-white/10">
                {AIRLINES.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSelected(a)}
                    className={`px-5 py-2 rounded-full text-[12px] font-black transition-all ${
                      selected === a
                        ? 'bg-white text-text shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Email row */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <input
                  type="email"
                  required
                  placeholder="crew@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/15 rounded-full px-5 py-3.5 text-[14px] text-white placeholder:text-white/30 font-bold focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-black text-[13px] text-white shadow-lg transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap"
                  style={{ background: '#FF385C' }}
                >
                  {status === 'loading'
                    ? <Loader2 size={15} className="animate-spin" />
                    : <>Put me on the list <ArrowRight size={14} strokeWidth={3} /></>
                  }
                </button>
              </div>

              {status === 'error' && (
                <p className="text-red-400 text-[13px] font-bold">Something went wrong. Try again.</p>
              )}

              <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest font-mono">
                No spam. No catch. Unsubscribe any time.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};
