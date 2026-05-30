'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play, Volume2, VolumeX, Globe, Award, Plane, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRoster } from '@/lib/contexts/RosterContext';
import { getLifetimeDestinations } from '@/lib/actions/destinations';
import { computeLifetimeStats } from '@/lib/utils/stats';
import { formatKilometers, formatBlockHours } from '@/lib/utils/format';

// Drop an ambient audio file at /public/audio/story-ambient.mp3 to enable music
const MUSIC_SRC = '/audio/story-ambient.mp3';
const SLIDE_MS = 4500;

type SlideType = 'intro' | 'stat' | 'quote' | 'highlight' | 'achievement' | 'outro';

interface Slide {
  id: number;
  type: SlideType;
  label?: string;
  title?: string;
  sub?: string;
  value?: string;
  unit?: string;
  meta?: string;
  icon?: React.ElementType;
}

function buildSlides(
  displayName: string,
  km: number,
  sectors: number,
  blockMinutes: number,
  cities: number,
): Slide[] {
  const firstName = displayName.split(' ')[0];
  const year = new Date().getFullYear();
  const earthLaps = (km / 40075).toFixed(1);

  const slides: Slide[] = [
    { id: 0, type: 'intro', title: `Your ${year}\nin the air.`, sub: `Welcome back, ${firstName}.` },
  ];

  if (km > 0) {
    slides.push(
      { id: slides.length, type: 'stat', label: 'Total Distance', value: formatKilometers(km), unit: 'KM', icon: Globe },
      { id: slides.length, type: 'quote', title: `That's ${earthLaps}× around the earth.`, sub: km > 100_000 ? 'An incredible year of missions.' : 'A solid year of operations.' },
    );
  }

  if (sectors > 0) {
    slides.push({ id: slides.length, type: 'stat', label: 'Sectors Flown', value: sectors.toLocaleString(), unit: 'Flights', icon: Plane });
  }

  if (blockMinutes > 0) {
    slides.push({ id: slides.length, type: 'stat', label: 'Time in the Air', value: formatBlockHours(blockMinutes), unit: 'Block Hours', icon: Clock });
  }

  if (cities > 0) {
    slides.push({
      id: slides.length,
      type: 'highlight',
      title: 'Cities Collected',
      sub: `${cities} destinations in your passport`,
      icon: Star,
    });
  }

  slides.push({ id: slides.length, type: 'outro', title: 'Ready for next year?', sub: `See you in ${year + 1}, ${firstName}.` });

  return slides;
}

const DEMO_SLIDES: Slide[] = [
  { id: 0, type: 'intro', title: 'Your year\nin the air.', sub: 'Upload a roster to see your real stats.' },
  { id: 1, type: 'stat', label: 'Total Distance', value: '—', unit: 'KM', icon: Globe },
  { id: 2, type: 'stat', label: 'Sectors Flown', value: '—', unit: 'Flights', icon: Plane },
  { id: 3, type: 'outro', title: 'Ready to begin?', sub: 'Upload your first roster.' },
];

/* ── Slide renderers ─────────────────────────────────────────────────────── */

function IntroSlide({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6 tracking-tighter whitespace-pre-line">{title}</h2>
      <p className="text-xl text-passport-gold-soft font-medium italic">{sub}</p>
    </div>
  );
}

function StatSlide({ label, value, unit, icon: Icon }: Pick<Slide, 'label' | 'value' | 'unit' | 'icon'>) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-passport-secondary mb-8">{label}</p>
      {Icon && <Icon className="w-8 h-8 text-passport-gold/40 mb-6" />}
      <h2 className="text-8xl font-serif text-white mb-4 tracking-tighter tabular-nums">{value}</h2>
      <p className="text-2xl font-black text-passport-gold uppercase tracking-widest italic">{unit}</p>
    </div>
  );
}

function QuoteSlide({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-4xl font-serif italic text-white leading-relaxed mb-8">&ldquo;{title}&rdquo;</h2>
      <p className="text-lg text-passport-secondary font-medium">{sub}</p>
    </div>
  );
}

function HighlightSlide({ title, sub, icon: Icon = Star }: Pick<Slide, 'title' | 'sub' | 'icon'>) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-passport-secondary mb-10">{title}</p>
      <div className="w-28 h-28 rounded-3xl bg-passport-gold/10 border border-passport-gold/20 flex items-center justify-center mb-10">
        <Icon className="text-passport-gold w-14 h-14" />
      </div>
      <h2 className="text-3xl font-black text-white mb-2">{sub}</h2>
    </div>
  );
}

function AchievementSlide({ title, sub, meta }: Pick<Slide, 'title' | 'sub' | 'meta'>) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-passport-secondary mb-10">Achievement Unlocked</p>
      <div className="w-32 h-32 rounded-full bg-passport-gold/10 border border-passport-gold/20 flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
        <Award className="text-passport-gold w-16 h-16" />
      </div>
      <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{title}</h2>
      {sub && <p className="text-lg text-passport-gold-soft italic mb-2">{sub}</p>}
      {meta && <p className="text-sm font-bold text-passport-gold-soft uppercase tracking-[0.2em]">{meta}</p>}
    </div>
  );
}

function OutroSlide({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-5xl font-black text-white leading-tight mb-6 tracking-tighter">{title}</h2>
      <p className="text-xl text-passport-gold-soft font-medium italic">{sub}</p>
      <Link
        href="/passport"
        className="mt-12 px-8 py-3 rounded-full bg-passport-gold text-passport-bg text-sm font-black hover:opacity-90 transition-opacity"
      >
        Back to Passport
      </Link>
    </div>
  );
}

function renderSlide(slide: Slide) {
  switch (slide.type) {
    case 'intro':  return <IntroSlide title={slide.title!} sub={slide.sub!} />;
    case 'stat':   return <StatSlide label={slide.label} value={slide.value} unit={slide.unit} icon={slide.icon} />;
    case 'quote':  return <QuoteSlide title={slide.title!} sub={slide.sub!} />;
    case 'highlight': return <HighlightSlide title={slide.title} sub={slide.sub} icon={slide.icon} />;
    case 'achievement': return <AchievementSlide title={slide.title} sub={slide.sub} meta={slide.meta} />;
    case 'outro':  return <OutroSlide title={slide.title!} sub={slide.sub!} />;
    default:       return null;
  }
}

/* ── Main component ──────────────────────────────────────────────────────── */

export default function StoryDeck() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { rosters } = useRoster();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Refs to avoid stale closures in rAF loop
  const currentRef = useRef(0);
  const slidesLenRef = useRef(0);
  const isPausedRef = useRef(false);
  const progressRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep refs in sync
  isPausedRef.current = isPaused;
  slidesLenRef.current = slides.length;

  /* ── Data fetch ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isAuthLoading) return;

    async function load() {
      try {
        const destinations = user ? await getLifetimeDestinations(user.uid) : [];
        const stats = computeLifetimeStats(rosters, destinations.length);
        const blockMinutes = rosters.reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0);
        const displayName =
          profile?.full_name || user?.displayName || user?.email?.split('@')[0] || 'Crew Member';

        const built = stats.sectors > 0 || stats.km > 0
          ? buildSlides(displayName, stats.km, stats.sectors, blockMinutes, stats.citiesCollected)
          : DEMO_SLIDES;

        setSlides(built);
      } finally {
        setIsDataLoading(false);
      }
    }

    load();
  }, [isAuthLoading, user, profile, rosters]);

  /* ── Audio setup ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    audio.play().catch(() => {
      // Autoplay blocked — user can unmute manually
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  /* ── rAF progress ticker ───────────────────────────────────────────────── */
  const tick = useCallback((timestamp: number) => {
    if (isPausedRef.current) {
      lastTickRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    if (lastTickRef.current === null) {
      lastTickRef.current = timestamp;
    }

    const delta = timestamp - lastTickRef.current;
    lastTickRef.current = timestamp;

    const next = progressRef.current + (delta / SLIDE_MS) * 100;

    if (next >= 100) {
      progressRef.current = 0;
      setProgress(0);

      if (currentRef.current < slidesLenRef.current - 1) {
        currentRef.current += 1;
        setCurrent(currentRef.current);
      } else {
        // Reached last slide — stop ticking
        setProgress(100);
        return;
      }
    } else {
      progressRef.current = next;
      setProgress(next);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [slides.length, tick]);

  /* ── Navigation helpers ────────────────────────────────────────────────── */
  const goNext = useCallback(() => {
    if (currentRef.current >= slidesLenRef.current - 1) return;
    currentRef.current += 1;
    progressRef.current = 0;
    lastTickRef.current = null;
    setCurrent(currentRef.current);
    setProgress(0);
  }, []);

  const goPrev = useCallback(() => {
    if (currentRef.current <= 0) return;
    currentRef.current -= 1;
    progressRef.current = 0;
    lastTickRef.current = null;
    setCurrent(currentRef.current);
    setProgress(0);
  }, []);

  /* ── Keyboard navigation ───────────────────────────────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'l') goNext();
      if (e.key === 'ArrowLeft'  || e.key === 'j') goPrev();
      if (e.key === ' ') { e.preventDefault(); setIsPaused(p => !p); }
      if (e.key === 'm') setIsMuted(m => !m);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  /* ── Long-press to pause ───────────────────────────────────────────────── */
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onPointerDown() {
    longPressRef.current = setTimeout(() => setIsPaused(true), 180);
  }
  function onPointerUp() {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    setIsPaused(false);
  }

  /* ── Touch swipe ───────────────────────────────────────────────────────── */
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    onPointerDown();
  }

  function onTouchEnd(e: React.TouchEvent) {
    onPointerUp();
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Swipe left/right only if horizontal intent
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dx < 0 ? goNext() : goPrev();
    }
  }

  /* ── Loading state ─────────────────────────────────────────────────────── */
  if (isDataLoading || slides.length === 0) {
    return (
      <div className="fixed inset-0 z-[500] bg-passport-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-passport-gold/30 border-t-passport-gold animate-spin" />
          <p className="text-passport-secondary text-sm font-bold uppercase tracking-widest">Loading story…</p>
        </div>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div
      className="fixed inset-0 z-[500] bg-passport-bg flex flex-col items-center justify-center select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Progress bars ── */}
      <div className="absolute top-6 left-0 right-0 px-5 flex gap-1 z-50 pointer-events-none">
        {slides.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 bg-white/15 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-passport-gold"
              animate={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
              transition={{ duration: 0.05 }}
            />
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="absolute top-12 left-5 right-5 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-passport-gold text-passport-bg flex items-center justify-center font-black text-[11px]">
            {(profile?.full_name || user?.displayName || 'MA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-black text-white leading-none">OTAROSTA</p>
            <p className="text-[10px] font-bold text-passport-gold-soft uppercase tracking-widest mt-0.5">
              Passport &apos;{new Date().getFullYear().toString().slice(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={e => { e.stopPropagation(); setIsMuted(m => !m); }}
            className="p-2 text-white/50 hover:text-white transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIsPaused(p => !p); }}
            className="p-2 text-white/50 hover:text-white transition-colors"
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <Link
            href="/passport"
            onClick={e => e.stopPropagation()}
            className="p-2 text-white/50 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </Link>
        </div>
      </div>

      {/* ── Slide content ── */}
      <div className="relative w-full max-w-sm px-10 flex flex-col items-center justify-center text-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 1.02 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full"
          >
            {renderSlide(slide)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Invisible tap zones ── */}
      <div className="absolute inset-0 flex z-40">
        <div
          className="w-1/3 h-full cursor-w-resize"
          onClick={e => { e.stopPropagation(); goPrev(); }}
        />
        <div
          className="w-2/3 h-full cursor-e-resize"
          onClick={e => { e.stopPropagation(); goNext(); }}
        />
      </div>

      {/* ── Pause overlay ── */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-[45] pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Pause size={28} className="text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <div className="absolute bottom-10 flex flex-col items-center gap-3 z-50 pointer-events-none">
        <p className="text-[10px] font-bold text-passport-secondary uppercase tracking-[0.4em]">
          {current + 1} / {slides.length}
        </p>
        <p className="text-[10px] font-bold text-passport-secondary/50 uppercase tracking-[0.3em]">Otarosta.com</p>
      </div>
    </div>
  );
}
