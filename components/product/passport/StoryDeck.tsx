'use client';

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRoster } from '@/lib/contexts/RosterContext';
import { getLifetimeDestinations, type EarnedDestination } from '@/lib/actions/destinations';
import { computeLifetimeStats } from '@/lib/utils/stats';
import { formatKilometers } from '@/lib/utils/format';
import { DESTINATION_CATALOG, CATALOG_SIZE } from '@/lib/data/destination-catalog';
import type { DutyEvent } from '@/lib/types';

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  coral:      '#FF385C', coralSoft:    '#FFF1F3',
  teal:       '#00A699', tealSoft:     '#E7F8F6',
  deepTeal:   '#008489', deepTealSoft: '#E6F6F6',
  plum:       '#914669', plumSoft:     '#F7EEF3',
  amber:      '#FFB400', amberSoft:    '#FFF7DF',
  ink:        '#222222', muted:        '#717171',
};
const DURATIONS: Record<SlideType, number> = {
  intro: 6000, stat: 6200, route: 6200, reveal: 6500, achievement: 6500, finale: 9000,
};

// ── Types ──────────────────────────────────────────────────────────────────────
type SlideType = 'intro' | 'stat' | 'route' | 'reveal' | 'achievement' | 'finale';

interface SlideData {
  id: number;
  type: SlideType;
  eyebrow?: string;
  icon?: string;
  title?: string;
  subtitle?: string;
  meta?: string;
  accent?: string;
  soft?: string;
  sky?: string;
  bg?: string;
  route?: [string, string];
  // stat
  kicker?: string;
  value?: number;
  unit?: string;
  sub?: string;
  chips?: string[];
  avatars?: number;
  // route
  from?: string;
  to?: string;
  big?: string;
  bigUnit?: string;
  // reveal
  valueLabel?: string;
  // finale
  summary?: { k: string; v: string }[];
  handle?: string;
  year?: string;
}

// ── Catalog helpers ────────────────────────────────────────────────────────────
function catalogCity(iata: string): string {
  return DESTINATION_CATALOG.find(d => d.iata === iata)?.city ?? iata;
}

function computeTopRoute(events: DutyEvent[]): { from: string; to: string; count: number } | null {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'FLIGHT' && e.depPort && e.arrPort) {
      const key = `${e.depPort}>${e.arrPort}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const [pair, count] = top;
  const [from, to] = pair.split('>');
  return { from, to, count };
}

function pickAchievement(km: number, sectors: number, cities: number, hours: number) {
  if (km > 100_000) return { title: 'World\nCircler',    subtitle: `Flying ${(km / 40_075).toFixed(1)}× around the Earth — a feat reserved for the few.`, meta: 'Top 5% of all crew' };
  if (cities > 20)  return { title: 'Global\nExplorer',  subtitle: `Touching down in ${cities} cities makes you a true citizen of the sky.`,             meta: `${cities} cities explored` };
  if (hours > 500)  return { title: 'Marathon\nFlyer',   subtitle: 'Half a thousand block hours — dedication written in altitude.',                        meta: `${hours} block hours` };
  if (sectors > 80) return { title: 'Frequent\nFlyer',   subtitle: `${sectors} sectors, each one a story of its own.`,                                    meta: `${sectors} sectors` };
  return               { title: 'Sky\nWorker',     subtitle: 'Every sector you fly is part of a bigger journey. Keep going.',                         meta: `${sectors} sectors flown` };
}

function buildSlides(
  displayName: string,
  rank: string,
  handle: string,
  km: number,
  sectors: number,
  blockMinutes: number,
  earned: EarnedDestination[],
  topRoute: { from: string; to: string; count: number } | null,
): SlideData[] {
  const year       = new Date().getFullYear();
  const firstName  = displayName.split(' ')[0];
  const earthLaps  = (km / 40_075).toFixed(1);
  const blockHours = Math.round(blockMinutes / 60);
  const daysInAir  = Math.round(blockMinutes / 1_440);
  const nonHome    = earned.filter(d => !d.isHome).sort((a, b) => b.visits - a.visits);
  const cities     = nonHome.length;
  const cityChips  = nonHome.slice(0, 10).map(d => d.iata);
  const tr         = topRoute ?? { from: 'KUL', to: nonHome[0]?.iata ?? 'LHR', count: 1 };
  const fromCity   = tr.from === 'KUL' ? 'Kuala Lumpur' : catalogCity(tr.from);
  const toCity     = catalogCity(tr.to);
  const ach        = pickAchievement(km, sectors, cities, blockHours);

  const summary: { k: string; v: string }[] = [
    { k: 'Distance',   v: `${formatKilometers(km)} km` },
    { k: 'Cities',     v: String(cities) },
    { k: 'Block hrs',  v: String(blockHours) },
    { k: 'Sectors',    v: String(sectors) },
    { k: 'Top route',  v: `${tr.from} ⇄ ${tr.to}` },
    { k: 'Collection', v: `${cities}/${CATALOG_SIZE}` },
  ];

  const slides: SlideData[] = [];

  // 1 — Intro
  slides.push({
    id: 1, type: 'intro', icon: 'passport',
    eyebrow: `Flight Passport · ${year}`,
    title: 'Your year,\nstamped in\nthe sky.',
    subtitle: `Welcome back, ${rank} ${firstName}. A warm recap of everywhere your roster took you.`,
    accent: C.coral, soft: C.coralSoft,
    bg: 'linear-gradient(160deg,#FF4E6E 0%,#FF385C 46%,#E11D48 100%)',
    route: [tr.from, tr.to],
  });

  // 2 — Distance
  if (km > 0) {
    slides.push({
      id: 2, type: 'stat', icon: 'distance',
      eyebrow: 'Total Distance', kicker: 'You flew',
      value: Math.round(km), unit: 'kilometres',
      meta: 'Logged across long-haul sectors, repositioning legs and the odd dawn diversion.',
      accent: C.teal, soft: C.tealSoft,
      sky: 'linear-gradient(150deg,#00C2B2 0%,#00A699 60%,#008489 100%)',
      route: [tr.from, tr.to],
    });

    // 3 — Earth laps
    slides.push({
      id: 3, type: 'reveal', icon: 'globe',
      eyebrow: 'Let that land',
      title: `${earthLaps}×`,
      subtitle: `That much distance would wrap you right around planet Earth ${earthLaps} times.`,
      meta: 'Equator: 40,075 km',
      accent: C.deepTeal, soft: C.deepTealSoft,
      bg: 'linear-gradient(165deg,#0C3B3A 0%,#0B5C57 45%,#008489 100%)',
    });
  }

  // 4 — Cities
  if (cities > 0) {
    slides.push({
      id: 4, type: 'stat', icon: 'city',
      eyebrow: 'Mission Hubs', kicker: 'You touched down in',
      value: cities, unit: 'cities',
      meta: 'Your roster quietly became a pocket-sized atlas of the world.',
      accent: C.plum, soft: C.plumSoft,
      sky: 'linear-gradient(150deg,#B05683 0%,#914669 60%,#6E3450 100%)',
      chips: cityChips,
      route: [tr.from, tr.to],
    });
  }

  // 5 — Top route
  if (tr.count > 0 && tr.from !== tr.to) {
    slides.push({
      id: 5, type: 'route', icon: 'route',
      eyebrow: 'Most Flown Route',
      title: `${fromCity}\nto ${toCity}`,
      from: tr.from, to: tr.to,
      big: String(tr.count), bigUnit: tr.count === 1 ? 'time this year' : 'times this year',
      meta: 'Your signature sector — you could brief it in your sleep.',
      accent: C.coral, soft: C.coralSoft,
      sky: 'linear-gradient(150deg,#FF5C78 0%,#FF385C 60%,#D11842 100%)',
    });
  }

  // 6 — Block hours
  if (blockHours > 0) {
    slides.push({
      id: 6, type: 'stat', icon: 'clock',
      eyebrow: 'Time in the Air', kicker: 'You spent',
      value: blockHours, unit: 'block hours aloft',
      meta: 'A long-haul chapter written in checklists, cabin chimes and quiet cruise.',
      accent: C.deepTeal, soft: C.deepTealSoft,
      sky: 'linear-gradient(150deg,#00B0A2 0%,#008489 60%,#045E62 100%)',
      sub: `≈ ${daysInAir} full days`,
      route: [tr.from, tr.to],
    });
  }

  // 7 — Achievement
  slides.push({
    id: 7, type: 'achievement', icon: 'award',
    eyebrow: 'Achievement Unlocked',
    title: ach.title, subtitle: ach.subtitle, meta: ach.meta,
    accent: C.amber, soft: C.amberSoft,
    bg: 'linear-gradient(160deg,#3A1E37 0%,#914669 48%,#C9821E 100%)',
  });

  // 8 — Finale
  slides.push({
    id: 8, type: 'finale', icon: 'sparkles',
    eyebrow: 'Next Departure',
    title: `Ready for\n${year + 1}?`,
    subtitle: `Your next chapter is already boarding, ${rank} ${firstName}.`,
    accent: C.coral, soft: C.coralSoft,
    bg: 'linear-gradient(160deg,#FF4E6E 0%,#FF385C 50%,#C81E45 100%)',
    route: [tr.from, tr.to],
    summary, handle, year: String(year),
  });

  return slides;
}

const DEMO_SLIDES: SlideData[] = [
  { id: 1, type: 'intro', icon: 'passport',
    eyebrow: 'Flight Passport', title: 'Your year,\nstamped in\nthe sky.',
    subtitle: 'Upload a roster to unlock your personal story.',
    accent: C.coral, soft: C.coralSoft,
    bg: 'linear-gradient(160deg,#FF4E6E 0%,#FF385C 46%,#E11D48 100%)',
    route: ['KUL', 'LHR'] },
  { id: 2, type: 'finale', icon: 'sparkles',
    eyebrow: 'First Boarding Call',
    title: 'Ready to\nbegin?',
    subtitle: 'Your passport is waiting, crew.',
    accent: C.coral, soft: C.coralSoft,
    bg: 'linear-gradient(160deg,#FF4E6E 0%,#FF385C 50%,#C81E45 100%)',
    route: ['KUL', 'LHR'],
    summary: [], handle: 'otarosta', year: String(new Date().getFullYear()) },
];

// ── Lo-fi audio engine ─────────────────────────────────────────────────────────
type LofiEngine = { start(): void; stop(): void; blip(kind?: string): void; dispose(): void };

function createLofiEngine(): LofiEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let warmth: BiquadFilterNode | null = null;
  let crackleNode: AudioBufferSourceNode | null = null;
  let clock: ReturnType<typeof setInterval> | null = null;
  let step = 0;
  let running = false;
  let noiseBuf: AudioBuffer | null = null;

  const A4 = 440;
  const mtof = (m: number) => A4 * Math.pow(2, (m - 69) / 12);

  const CHORDS = [[62,65,69,72],[60,64,67,70],[60,64,65,69],[62,65,69,72]];
  const BASS   = [43, 36, 41, 38];
  const MELODY = [77,79,81,84,81,79,76,72];

  const getCtx = () => {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx      = new AC();
      master   = ctx.createGain(); master.gain.value = 0;
      warmth   = ctx.createBiquadFilter(); warmth.type = 'lowpass'; warmth.frequency.value = 2100; warmth.Q.value = 0.4;
      musicBus = ctx.createGain(); musicBus.gain.value = 1;
      musicBus.connect(warmth!); warmth!.connect(master!); master!.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  const voice = (freq: number, t: number, dur: number, opts: { type?: OscillatorType; vol?: number; detune?: number; bus?: AudioNode; attack?: number } = {}) => {
    if (!ctx || !musicBus) return;
    const { type = 'sine', vol = 0.06, detune = 0, bus = musicBus, attack = 0.02 } = opts;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus as AudioNode);
    o.start(t); o.stop(t + dur + 0.05);
  };

  const rhodes = (midi: number, t: number, dur: number, vol: number) => {
    if (!ctx) return;
    const f = mtof(midi);
    voice(f, t, dur, { type: 'sine', vol, detune: -4, attack: 0.03 });
    voice(f, t, dur, { type: 'sine', vol: vol * 0.8, detune: +5, attack: 0.03 });
    voice(f * 2, t, dur * 0.6, { type: 'triangle', vol: vol * 0.18, attack: 0.04 });
  };

  const getNoise = () => {
    if (noiseBuf || !ctx) return noiseBuf;
    const len = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  };

  const kick = (t: number) => {
    if (!ctx || !musicBus) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.13);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.26);
  };

  const hat = (t: number, vol = 0.03) => {
    if (!ctx || !musicBus) return;
    const buf = getNoise(); if (!buf) return;
    const s = ctx.createBufferSource(); s.buffer = buf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(hp); hp.connect(g); g.connect(musicBus); s.start(t); s.stop(t + 0.08);
  };

  const startCrackle = () => {
    if (crackleNode || !ctx || !master) return;
    const buf = getNoise(); if (!buf) return;
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 0.012;
    s.connect(bp); bp.connect(g); g.connect(master); s.start();
    crackleNode = s;
  };

  const BPM = 74; const stepDur = (60 / BPM) / 2;

  const scheduleStep = () => {
    if (!ctx) return;
    const now = ctx.currentTime + 0.06;
    const bar = Math.floor(step / 8) % 4; const inBar = step % 8;
    const swing = inBar % 2 === 1 ? stepDur * 0.18 : 0; const t = now + swing;
    if (inBar === 0) { CHORDS[bar].forEach((m, i) => rhodes(m, t, stepDur * 7.4, 0.05 - i * 0.004)); voice(mtof(BASS[bar]), t, stepDur * 6.6, { type: 'sine', vol: 0.11, attack: 0.03 }); }
    if (inBar === 4) CHORDS[bar].forEach((m) => rhodes(m, t, stepDur * 3.4, 0.022));
    if (inBar === 0 || inBar === 5) kick(t);
    if (inBar % 2 === 1) hat(t, 0.026);
    if (inBar === 2 || inBar === 6) hat(t, 0.016);
    if (bar % 2 === 0 && (inBar === 2 || inBar === 6)) { const note = MELODY[(step >> 1) % MELODY.length]; voice(mtof(note), t, stepDur * 2.2, { type: 'triangle', vol: 0.03, attack: 0.05 }); }
    step++;
  };

  const fade = (target: number, secs: number) => {
    if (!master || !ctx) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t); master.gain.linearRampToValueAtTime(target, t + secs);
  };

  return {
    start() { if (!getCtx()) return; startCrackle(); fade(0.85, 1.4); if (running) return; running = true; scheduleStep(); clock = setInterval(scheduleStep, stepDur * 1000); },
    stop()  { fade(0, 0.7); if (clock) { clearInterval(clock); clock = null; } running = false; },
    blip(kind = 'tap') {
      if (!getCtx() || !ctx) return;
      const t = ctx.currentTime + 0.01;
      if (kind === 'achieve') { [76,81,88].forEach((m,i) => voice(mtof(m), t + i * 0.08, 0.22, { type: 'triangle', vol: 0.05 })); }
      else if (kind === 'route') { [69,76].forEach((m,i) => voice(mtof(m), t + i * 0.07, 0.16, { type: 'triangle', vol: 0.035 })); }
      else voice(mtof(84), t, 0.09, { type: 'sine', vol: 0.03 });
    },
    dispose() { this.stop(); if (ctx) { ctx.close(); ctx = null; } },
  };
}

// ── CountUp ────────────────────────────────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(target); return; }
    let raf: number; let start: number | undefined;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (ts: number) => {
      if (start == null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(target * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return val;
}

function CountUp({ value, duration = 1500, decimals = 0, active = true }: { value: number; duration?: number; decimals?: number; active?: boolean }) {
  const v = useCountUp(value, active, duration);
  return <>{v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

// ── ParallaxSky ────────────────────────────────────────────────────────────────
function ParallaxSky({ tint = 'rgba(255,255,255,0.9)', clouds = 3, dense = false }: { tint?: string; clouds?: number; dense?: boolean }) {
  const stars = useMemo(() => Array.from({ length: dense ? 26 : 14 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100,
    s: 1 + Math.random() * 2, d: Math.random() * 3, dur: 2.4 + Math.random() * 2.6,
  })), [dense]);
  const cloudRows = useMemo(() => Array.from({ length: clouds }, (_, i) => ({
    top: 12 + i * 26 + Math.random() * 8, dur: 26 + i * 9 + Math.random() * 8,
    delay: -Math.random() * 30, scale: 0.7 + Math.random() * 0.6, op: 0.10 + Math.random() * 0.10,
  })), [clouds]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((st, i) => (
        <span key={i} className="absolute rounded-full" style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, background: tint, animation: `twinkle ${st.dur}s ease-in-out ${st.d}s infinite` }} />
      ))}
      {cloudRows.map((cl, i) => (
        <div key={i} className="absolute" style={{ top: `${cl.top}%`, left: 0, width: '40%', animation: `driftXslow ${cl.dur}s linear ${cl.delay}s infinite` }}>
          <div style={{ width: 120 * cl.scale, height: 34 * cl.scale, borderRadius: 999, background: tint, opacity: cl.op, filter: 'blur(8px)' }} />
        </div>
      ))}
    </div>
  );
}

// ── RouteMap ───────────────────────────────────────────────────────────────────
function RouteMap({ from = 'KUL', to = 'LHR', loopKey = 0, stroke = 'rgba(255,255,255,0.9)', faint = 'rgba(255,255,255,0.28)', label = true }: { from?: string; to?: string; loopKey?: number; stroke?: string; faint?: string; label?: boolean }) {
  const pathRef  = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const cities   = useMemo(() => Array.from({ length: 9 }, () => ({ x: 24 + Math.random() * 252, y: 22 + Math.random() * 116, r: 0.8 + Math.random() * 1.4 })), [loopKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const path = pathRef.current; const plane = planeRef.current; if (!path || !plane) return;
    const total = path.getTotalLength();
    if (trailRef.current) { trailRef.current.style.strokeDasharray = String(total); trailRef.current.style.strokeDashoffset = String(total); }
    let raf: number; let start: number | undefined;
    const DUR = 5200; const HOLD = 900;
    const run = (ts: number) => {
      if (start == null) start = ts;
      const cycle = DUR + HOLD; const e = (ts - start) % cycle; const p = Math.min(e / DUR, 1);
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const pt  = path.getPointAtLength(ease * total);
      const pt2 = path.getPointAtLength(Math.min(ease * total + 1, total));
      const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
      plane.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang})`);
      if (trailRef.current) trailRef.current.style.strokeDashoffset = String(total * (1 - ease));
      raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [loopKey, from, to]);

  const A = { x: 44, y: 122 }; const B = { x: 256, y: 52 }; const ctrl = { x: 150, y: -14 };
  const d = `M ${A.x} ${A.y} Q ${ctrl.x} ${ctrl.y} ${B.x} ${B.y}`;

  return (
    <svg viewBox="0 0 300 160" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <g stroke={faint} strokeWidth="0.7" fill="none" opacity="0.7">
        <ellipse cx="150" cy="80" rx="138" ry="62" /><ellipse cx="150" cy="80" rx="138" ry="30" />
        <ellipse cx="150" cy="80" rx="92" ry="62" /><ellipse cx="150" cy="80" rx="46" ry="62" />
        <line x1="12" y1="80" x2="288" y2="80" />
      </g>
      {cities.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={faint} />)}
      <path d={d} stroke={faint} strokeWidth="1.4" fill="none" strokeDasharray="2 5" strokeLinecap="round" />
      <path ref={trailRef} d={d} stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
      {([A, B] as const).map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r="7" fill="none" stroke={stroke} strokeWidth="1" opacity="0.4">
            <animate attributeName="r" values="5;11;5" dur="2.6s" repeatCount="indefinite" begin={`${i * 0.6}s`} />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2.6s" repeatCount="indefinite" begin={`${i * 0.6}s`} />
          </circle>
          <circle cx={pt.x} cy={pt.y} r="3.4" fill={stroke} />
          {label && <text x={pt.x} y={pt.y + (i === 0 ? 16 : -12)} fill={stroke} fontSize="9.5" fontWeight="800" textAnchor={i === 0 ? 'start' : 'end'} style={{ letterSpacing: '0.06em', fontFamily: 'Inter' }}>{i === 0 ? from : to}</text>}
        </g>
      ))}
      <g ref={planeRef}>
        <g transform="translate(-9 -9)">
          <circle cx="9" cy="9" r="9" fill={stroke} opacity="0.16" />
          <path d="M10.8 11.2 6 16l-.7-.7 3.4-5.8L5 7l.7-.7 5.8 3.4L15.5 5.4c.6-.6 1.5-.6 1.9 0 .5.5.4 1.3 0 1.9l-4.8 4.8 3.4 5.8-.7.7-3.4-3.4L11 16.5l-.7-.7 4.8-4.8Z" fill="#fff" stroke="rgba(0,0,0,0.06)" strokeWidth="0.4" />
        </g>
      </g>
    </svg>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function Icon({ name, className = '', style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const p = { className, style, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'award':     return <svg {...p}><path d="M12 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" /><path d="m9.7 14.6-1.1 6 3.4-2 3.4 2-1.1-6" /><path d="m9.7 8.8 1.5 1.5 3.1-3.3" /></svg>;
    case 'chevronRight': return <svg {...p}><path d="m9 5 7 7-7 7" /></svg>;
    case 'city':      return <svg {...p}><path d="M4 21V8.5L10 5v16" /><path d="M10 21V3h10v18" /><path d="M7 11h.01M7 15h.01M14 7h2M14 11h2M14 15h2" /></svg>;
    case 'clock':     return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3.2 2" /></svg>;
    case 'distance':  return <svg {...p}><path d="M5.5 17.5c-1.4 0-2.5-1.1-2.5-2.5 0-2.6 2.5-4.5 5.2-4.5h7.6c2.7 0 5.2-1.9 5.2-4.5 0-1.4-1.1-2.5-2.5-2.5" /><path d="M6 21s3-2.2 3-5a3 3 0 1 0-6 0c0 2.8 3 5 3 5Z" /><path d="M18 8s3-2.2 3-5a3 3 0 1 0-6 0c0 2.8 3 5 3 5Z" /></svg>;
    case 'globe':     return <svg {...p}><circle cx="12" cy="12" r="8.8" /><path d="M3.2 12h17.6" /><path d="M12 3.2c2.3 2.4 3.5 5.3 3.5 8.8s-1.2 6.4-3.5 8.8c-2.3-2.4-3.5-5.3-3.5-8.8S9.7 5.6 12 3.2Z" /></svg>;
    case 'passport':  return <svg {...p}><path d="M7 3.5h8.8c1.2 0 2.2 1 2.2 2.2v12.6c0 1.2-1 2.2-2.2 2.2H7c-1.2 0-2.2-1-2.2-2.2V5.7c0-1.2 1-2.2 2.2-2.2Z" /><circle cx="11.5" cy="10.5" r="3" /><path d="M8.7 15.8h5.6M9 10.5h5M11.5 7.5c1 1 1.5 2 1.5 3s-.5 2-1.5 3c-1-1-1.5-2-1.5-3s.5-2 1.5-3Z" /></svg>;
    case 'pause':     return <svg {...p}><path d="M8.5 5.5v13M15.5 5.5v13" /></svg>;
    case 'play':      return <svg {...p}><path d="M8 5.5v13l10-6.5-10-6.5Z" /></svg>;
    case 'route':     return <svg {...p}><path d="M6 18.5h2.7c1.8 0 3.3-1.5 3.3-3.3S10.5 12 8.7 12H6.8A3.3 3.3 0 0 1 3.5 8.7C3.5 6.9 5 5.5 6.8 5.5H9" /><path d="M15 5.5h2.2c1.8 0 3.3 1.5 3.3 3.3 0 1.1-.5 2.1-1.4 2.7" /><circle cx="6" cy="18.5" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="12" cy="5.5" r="2" /></svg>;
    case 'send':      return <svg {...p}><path d="M21 3 10.5 13.5" /><path d="M21 3 14.5 21l-4-8-8-4L21 3Z" /></svg>;
    case 'sparkles':  return <svg {...p}><path d="M12 3.5 13.7 8l4.8 1.7-4.8 1.8L12 16l-1.7-4.5-4.8-1.8L10.3 8 12 3.5Z" /><path d="M5.5 15.5 6.3 18l2.2.8-2.2.9-.8 2.3-.9-2.3-2.1-.9 2.1-.8.9-2.5Z" /></svg>;
    case 'sunrise':   return <svg {...p}><path d="M3 18h18M6 14a6 6 0 0 1 12 0M12 3v3M4.9 6.9 7 9M19.1 6.9 17 9" /><path d="M8 21h8" /></svg>;
    case 'users':     return <svg {...p}><path d="M16.5 19.5c0-2.2-2-4-4.5-4s-4.5 1.8-4.5 4" /><circle cx="12" cy="9" r="3" /><path d="M4.5 18c0-1.5 1.2-2.8 3-3.3M16.5 14.7c1.8.5 3 1.8 3 3.3" /><path d="M6.8 11.2a2.4 2.4 0 1 1 .7-4.7M16.5 6.5a2.4 2.4 0 1 1 .7 4.7" /></svg>;
    case 'volume':    return <svg {...p}><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" /></svg>;
    case 'volumeOff': return <svg {...p}><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M17 9l4 4m0-4-4 4" /></svg>;
    case 'x':         return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    default: return null;
  }
}

// ── Shared chrome ──────────────────────────────────────────────────────────────
function Eyebrow({ children, color = 'rgba(255,255,255,0.92)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="anim-riseIn flex items-center gap-2 no-select" style={{ color }}>
      <span style={{ width: 22, height: 2, borderRadius: 2, background: 'currentColor', opacity: 0.8 }} />
      <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{children}</span>
    </div>
  );
}

function IconBadge({ name, light }: { name?: string; light?: boolean }) {
  return (
    <div className="anim-popIn no-select" style={{
      width: 54, height: 54, borderRadius: 17, display: 'grid', placeItems: 'center',
      background: light ? 'rgba(255,255,255,0.16)' : '#fff',
      border: light ? '1px solid rgba(255,255,255,0.28)' : '1px solid #ebebeb',
      boxShadow: light ? 'inset 0 1px 0 rgba(255,255,255,0.25)' : '0 10px 24px rgba(0,0,0,0.08)',
      color: light ? '#fff' : C.coral, backdropFilter: 'blur(8px)',
    }}>
      <Icon name={name ?? 'passport'} className="w-7 h-7" />
    </div>
  );
}

// ── Slide renderers ────────────────────────────────────────────────────────────
function IntroSlide({ slide, active }: { slide: SlideData; active: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden no-select" style={{ background: slide.bg }}>
      <ParallaxSky tint="rgba(255,255,255,0.85)" clouds={3} dense />
      <div className="absolute inset-x-0" style={{ top: '13%', height: '34%', opacity: 0.85 }}>
        <RouteMap from={slide.route?.[0]} to={slide.route?.[1]} stroke="rgba(255,255,255,0.95)" faint="rgba(255,255,255,0.30)" loopKey={active ? 1 : 0} />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 px-7 pb-14" style={{ paddingTop: 40 }}>
        <div className="anim-popIn"><IconBadge name={slide.icon} light /></div>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <h1 className="anim-riseIn anim-delay-2 tracking-tightest no-select" style={{ color: '#fff', fontSize: 52, lineHeight: 0.98, fontWeight: 800, whiteSpace: 'pre-line', textShadow: '0 4px 30px rgba(0,0,0,0.18)' }}>{slide.title}</h1>
        <p className="anim-riseIn anim-delay-3 no-select" style={{ color: 'rgba(255,255,255,0.94)', fontSize: 16, lineHeight: 1.5, fontWeight: 450, maxWidth: 320 }}>{slide.subtitle}</p>
        <div className="anim-fadeIn anim-delay-5 flex items-center gap-2 no-select" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
          <span>Tap to begin</span><Icon name="chevronRight" className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function StatSlide({ slide, active }: { slide: SlideData; active: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden no-select" style={{ background: '#fff' }}>
      <div className="relative overflow-hidden" style={{ height: '42%', background: slide.sky }}>
        <ParallaxSky tint="rgba(255,255,255,0.8)" clouds={3} />
        <div className="absolute inset-0 grid place-items-center">
          <div className="anim-floatYbig" style={{ width: '78%', height: '70%', opacity: 0.9 }}>
            <RouteMap from={slide.route?.[0] ?? 'KUL'} to={slide.route?.[1] ?? 'LHR'} stroke="rgba(255,255,255,0.95)" faint="rgba(255,255,255,0.3)" label={false} loopKey={active ? 1 : 0} />
          </div>
        </div>
        <div className="absolute left-7 top-7"><IconBadge name={slide.icon} light /></div>
        <div className="absolute left-7 bottom-5"><Eyebrow>{slide.eyebrow}</Eyebrow></div>
      </div>
      <div className="flex flex-col gap-3 px-7" style={{ paddingTop: 30 }}>
        <p className="anim-riseIn" style={{ color: C.muted, fontSize: 15, fontWeight: 600 }}>{slide.kicker}</p>
        <div className="anim-popIn anim-delay-1 flex items-end gap-2 tracking-tightest" style={{ color: slide.accent }}>
          <span style={{ fontSize: 76, fontWeight: 800, lineHeight: 0.86 }}>
            {active && slide.value != null ? <CountUp value={slide.value} duration={1600} active={active} /> : slide.value?.toLocaleString('en-US')}
          </span>
        </div>
        <p className="anim-riseIn anim-delay-2" style={{ color: C.ink, fontSize: 21, fontWeight: 700, marginTop: -4 }}>{slide.unit}</p>
        {slide.sub && (
          <span className="anim-popIn anim-delay-3 self-start" style={{ background: slide.soft, color: slide.accent, fontSize: 13.5, fontWeight: 700, padding: '6px 12px', borderRadius: 999 }}>{slide.sub}</span>
        )}
        {slide.chips && (
          <div className="anim-fadeIn anim-delay-3 flex flex-wrap gap-2" style={{ marginTop: 4 }}>
            {slide.chips.map((c, i) => (
              <span key={c} className="anim-popIn" style={{ animationDelay: `${0.3 + i * 0.05}s`, background: slide.soft, color: slide.accent, fontSize: 12.5, fontWeight: 700, padding: '5px 11px', borderRadius: 999, letterSpacing: '0.04em' }}>{c}</span>
            ))}
          </div>
        )}
        <p className="anim-riseIn anim-delay-4" style={{ color: C.muted, fontSize: 14.5, lineHeight: 1.5, marginTop: 6, maxWidth: 330 }}>{slide.meta}</p>
      </div>
    </div>
  );
}

function RouteSlide({ slide, active }: { slide: SlideData; active: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden no-select" style={{ background: slide.sky }}>
      <ParallaxSky tint="rgba(255,255,255,0.85)" clouds={4} dense />
      <div className="absolute left-7 top-9"><IconBadge name={slide.icon} light /></div>
      <div className="absolute left-7" style={{ top: 96 }}><Eyebrow>{slide.eyebrow}</Eyebrow></div>
      <div className="absolute inset-x-0 flex items-center justify-center" style={{ top: '30%', height: '34%' }}>
        <div style={{ width: '90%', height: '100%' }}>
          <RouteMap from={slide.from} to={slide.to} stroke="#fff" faint="rgba(255,255,255,0.34)" loopKey={active ? 1 : 0} />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-7 pb-14">
        <h2 className="anim-riseIn tracking-tightest" style={{ color: '#fff', fontSize: 38, lineHeight: 1.0, fontWeight: 800, whiteSpace: 'pre-line', textShadow: '0 4px 24px rgba(0,0,0,0.16)' }}>{slide.title}</h2>
        <div className="anim-popIn anim-delay-2 flex items-baseline gap-3" style={{ marginTop: 2 }}>
          <span className="tracking-tightest" style={{ color: '#fff', fontSize: 56, fontWeight: 800, lineHeight: 0.9 }}>{slide.big}</span>
          <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: 600, maxWidth: 130 }}>{slide.bigUnit}</span>
        </div>
        <p className="anim-riseIn anim-delay-3" style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 1.5, maxWidth: 320 }}>{slide.meta}</p>
      </div>
    </div>
  );
}

function RevealSlide({ slide, active }: { slide: SlideData; active: boolean }) {
  const isSunrise = slide.icon === 'sunrise';
  return (
    <div className="relative h-full w-full overflow-hidden no-select" style={{ background: slide.bg }}>
      <ParallaxSky tint={isSunrise ? 'rgba(255,235,200,0.95)' : 'rgba(255,255,255,0.8)'} clouds={2} dense />
      {isSunrise && (
        <div className="absolute left-1/2" style={{ bottom: '8%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,#FFE08A 0%,#FFB400 55%,rgba(255,138,76,0) 72%)', filter: 'blur(2px)', animation: 'sunRise 1.6s ease both, floatYbig 6s ease-in-out 1.6s infinite' }} />
        </div>
      )}
      <div className="absolute left-1/2 top-1/2 pointer-events-none" style={{ transform: 'translate(-50%,-50%)' }}>
        {[0,1,2].map(i => (
          <span key={i} className="absolute rounded-full" style={{ left: '50%', top: '50%', width: 200, height: 200, marginLeft: -100, marginTop: -100, border: `1px solid ${isSunrise ? 'rgba(255,220,150,0.5)' : 'rgba(255,255,255,0.45)'}`, animation: `pulseRing 3.4s ease-out ${i * 1.1}s infinite` }} />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center" style={{ paddingBottom: '8%' }}>
        <div className="anim-popIn"><IconBadge name={slide.icon} light /></div>
        <div style={{ height: 8 }} />
        <div className="anim-popIn anim-delay-1 tracking-tightest" style={{ color: '#fff', fontSize: slide.valueLabel ? 120 : 96, fontWeight: 800, lineHeight: 0.84, textShadow: '0 6px 40px rgba(0,0,0,0.22)' }}>
          {active && slide.title && /^[\d.]+/.test(slide.title) ? <CountUp value={parseFloat(slide.title)} decimals={slide.title.includes('.') ? 1 : 0} duration={1500} active={active} /> : slide.title}
        </div>
        {slide.valueLabel && <div className="anim-riseIn anim-delay-2 shine-text" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.02em' }}>{slide.valueLabel}</div>}
        <p className="anim-riseIn anim-delay-3" style={{ color: 'rgba(255,255,255,0.95)', fontSize: 17, lineHeight: 1.5, fontWeight: 450, maxWidth: 320, marginTop: 6 }}>{slide.subtitle}</p>
        {slide.meta && <div className="anim-popIn anim-delay-4" style={{ marginTop: 8, color: 'rgba(255,255,255,0.92)', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '7px 14px' }}>{slide.meta}</div>}
      </div>
    </div>
  );
}

function AchievementSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="relative h-full w-full overflow-hidden no-select" style={{ background: slide.bg }}>
      <ParallaxSky tint="rgba(255,240,210,0.9)" clouds={2} dense />
      <div className="absolute left-1/2" style={{ top: '30%', transform: 'translate(-50%,-50%)' }}>
        <div className="anim-spinSlow" style={{ width: 360, height: 360, background: 'repeating-conic-gradient(rgba(255,220,150,0.16) 0deg 8deg, transparent 8deg 16deg)', borderRadius: '50%' }} />
      </div>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: '13%' }}>
        <div className="anim-popIn" style={{ position: 'relative' }}>
          {[0,1,2].map(i => <span key={i} className="absolute rounded-full" style={{ left: '50%', top: '50%', width: 150, height: 150, marginLeft: -75, marginTop: -75, border: '1px solid rgba(255,220,150,0.5)', animation: `pulseRing 3s ease-out ${i}s infinite` }} />)}
          <div className="anim-floatYbig" style={{ width: 132, height: 132, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 38% 30%,#FFE9A8,#FFB400 60%,#C9821E 100%)', boxShadow: '0 20px 50px rgba(201,130,30,0.5),inset 0 2px 6px rgba(255,255,255,0.6)', color: '#7A4A12' }}>
            <Icon name="award" style={{ width: 66, height: 66 }} />
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-8 pb-16 text-center">
        <Eyebrow color="rgba(255,236,200,0.95)">{slide.eyebrow}</Eyebrow>
        <h2 className="anim-riseIn anim-delay-1 tracking-tightest" style={{ color: '#fff', fontSize: 50, lineHeight: 0.96, fontWeight: 800, whiteSpace: 'pre-line', textShadow: '0 4px 30px rgba(0,0,0,0.22)' }}>{slide.title}</h2>
        <p className="anim-riseIn anim-delay-2" style={{ color: 'rgba(255,255,255,0.94)', fontSize: 16, lineHeight: 1.5, maxWidth: 320 }}>{slide.subtitle}</p>
        <div className="anim-popIn anim-delay-3 flex items-center gap-2" style={{ marginTop: 4, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.32)', borderRadius: 999, padding: '8px 16px', color: '#fff', fontSize: 13.5, fontWeight: 700, backdropFilter: 'blur(8px)' }}>
          <Icon name="sparkles" className="w-4 h-4" />{slide.meta}
        </div>
      </div>
    </div>
  );
}

function FinaleSlide({ slide, active, onShare }: { slide: SlideData; active: boolean; onShare(): void }) {
  return (
    <div className="relative h-full w-full overflow-hidden no-select" style={{ background: slide.bg }}>
      <ParallaxSky tint="rgba(255,255,255,0.85)" clouds={3} dense />
      <div className="absolute inset-x-0" style={{ top: '8%', height: '26%', opacity: 0.85 }}>
        <RouteMap from={slide.route?.[0]} to={slide.route?.[1]} stroke="rgba(255,255,255,0.95)" faint="rgba(255,255,255,0.3)" loopKey={active ? 1 : 0} />
      </div>
      <div className="absolute inset-x-0" style={{ top: '34%' }}>
        <div className="flex flex-col items-center gap-3 px-7 text-center">
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <h2 className="anim-riseIn anim-delay-1 tracking-tightest" style={{ color: '#fff', fontSize: 50, lineHeight: 0.96, fontWeight: 800, whiteSpace: 'pre-line', textShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>{slide.title}</h2>
          <p className="anim-riseIn anim-delay-2" style={{ color: 'rgba(255,255,255,0.95)', fontSize: 16, lineHeight: 1.5, maxWidth: 300 }}>{slide.subtitle}</p>
        </div>
      </div>
      {slide.summary && slide.summary.length > 0 && (
        <div className="absolute inset-x-5 anim-popIn anim-delay-3" style={{ bottom: 96 }}>
          <div style={{ background: 'rgba(255,255,255,0.96)', borderRadius: 22, padding: '16px 18px', boxShadow: '0 20px 50px rgba(0,0,0,0.22)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="flex items-center gap-2">
                <div style={{ width: 30, height: 30, borderRadius: 9, background: C.coral, display: 'grid', placeItems: 'center', color: '#fff' }}><Icon name="passport" className="w-4 h-4" /></div>
                <div style={{ lineHeight: 1.05 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>@{slide.handle}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: C.muted }}>Flight Passport · {slide.year}</div>
                </div>
              </div>
              <Icon name="sparkles" className="w-5 h-5" style={{ color: C.amber }} />
            </div>
            <div className="grid grid-cols-3 gap-y-3 gap-x-2">
              {slide.summary.map(s => (
                <div key={s.k}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>{s.v}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <button onClick={e => { e.stopPropagation(); onShare(); }} className="absolute inset-x-7 anim-riseIn anim-delay-4" style={{ bottom: 40, height: 50, borderRadius: 999, border: 'none', cursor: 'pointer', background: '#fff', color: C.coral, fontSize: 15.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 12px 30px rgba(0,0,0,0.18)' }}>
        <Icon name="send" className="w-5 h-5" />Share my passport
      </button>
    </div>
  );
}

function SlideView({ slide, active, onShare }: { slide: SlideData; active: boolean; onShare(): void }) {
  switch (slide.type) {
    case 'intro':       return <IntroSlide       slide={slide} active={active} />;
    case 'stat':        return <StatSlide        slide={slide} active={active} />;
    case 'route':       return <RouteSlide       slide={slide} active={active} />;
    case 'reveal':      return <RevealSlide      slide={slide} active={active} />;
    case 'achievement': return <AchievementSlide slide={slide} />;
    case 'finale':      return <FinaleSlide      slide={slide} active={active} onShare={onShare} />;
    default: return null;
  }
}

// ── Story chrome ───────────────────────────────────────────────────────────────
function ProgressBars({ count, index, progress }: { count: number; index: number; progress: number }) {
  return (
    <div className="flex gap-1.5 px-3.5" style={{ paddingTop: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.34)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, background: '#fff', width: `${i < index ? 100 : i === index ? progress * 100 : 0}%`, transition: i === index ? 'width 60ms linear' : 'none' }} />
        </div>
      ))}
    </div>
  );
}

function StoryHeader({ paused, muted, handle, year, onToggleSound, onClose }: { paused: boolean; muted: boolean; handle: string; year: string; onToggleSound(): void; onClose(): void }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 no-select" style={{ paddingTop: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 999, padding: 2, background: 'linear-gradient(135deg,#FFB400,#FF385C 55%,#914669)' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 999, background: C.coral, display: 'grid', placeItems: 'center', color: '#fff', border: '2px solid rgba(0,0,0,0.05)' }}>
          <Icon name="passport" className="w-4 h-4" />
        </div>
      </div>
      <div style={{ lineHeight: 1.1, flex: 1 }}>
        <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
          {handle} <span style={{ opacity: 0.7, fontWeight: 500 }}>· passport</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>{year} · Year in review</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onToggleSound(); }} aria-label="toggle sound" style={{ width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.16)', color: '#fff', display: 'grid', placeItems: 'center', backdropFilter: 'blur(6px)' }}>
        <Icon name={muted ? 'volumeOff' : 'volume'} className="w-[18px] h-[18px]" />
      </button>
      {paused && (
        <div style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff', display: 'grid', placeItems: 'center', backdropFilter: 'blur(6px)' }}>
          <Icon name="play" className="w-[18px] h-[18px]" />
        </div>
      )}
      <button onClick={e => { e.stopPropagation(); onClose(); }} aria-label="close" style={{ width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.16)', color: '#fff', display: 'grid', placeItems: 'center', backdropFilter: 'blur(6px)' }}>
        <Icon name="x" className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
}

function ShareSheet({ open, onClose, onNativeShare }: { open: boolean; onClose(): void; onNativeShare(): void }) {
  if (!open) return null;
  return (
    <div onClick={onClose} className="absolute inset-0 z-30 flex items-end" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.25s ease' }}>
      <div onClick={e => e.stopPropagation()} className="anim-riseIn" style={{ width: '100%', background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '18px 18px 30px' }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: '#ebebeb', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Share your passport</div>
        <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 16 }}>Post your year in the sky to your story.</div>
        <div className="grid grid-cols-4 gap-3" style={{ marginBottom: 18 }}>
          {([['send','Share',C.coral],['globe','Copy link',C.teal],['sparkles','Repost',C.amber]] as [string,string,string][]).map(([ic,label,col]) => (
            <div key={label} className="flex flex-col items-center gap-1.5" onClick={() => { onNativeShare(); onClose(); }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: col, color: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 8px 18px rgba(0,0,0,0.12)', cursor: 'pointer' }}><Icon name={ic} className="w-6 h-6" /></div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.ink }}>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', height: 48, borderRadius: 999, border: '1.5px solid #ebebeb', background: '#fff', color: C.ink, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
}

// ── Main StoryDeck ─────────────────────────────────────────────────────────────
export default function StoryDeck() {
  const router = useRouter();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { rosters, activeRoster, isLoadingList } = useRoster();

  const [slides, setSlides]       = useState<SlideData[]>([]);
  const [isDataLoading, setLoad]  = useState(true);
  const [index, setIndex]         = useState(0);
  const [progress, setProgress]   = useState(0);
  const [paused, setPaused]       = useState(false);
  const [muted, setMuted]         = useState(false);
  const [started, setStarted]     = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const engineRef   = useRef<LofiEngine | null>(null);
  const rafRef      = useRef<number | null>(null);
  const startTsRef  = useRef<number | null>(null);
  const holdTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef     = useRef(false);
  const indexRef    = useRef(0);   // shadow for stable callbacks

  // ── Auth redirect ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) router.replace('/passport');
  }, [isAuthLoading, user, router]);

  // ── Data fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthLoading || isLoadingList || !user) return;
    (async () => {
      try {
        const earned       = await getLifetimeDestinations(user.uid);
        const stats        = computeLifetimeStats(rosters, earned.filter(d => !d.isHome).length);
        const blockMinutes = rosters.reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0);
        const name         = profile?.full_name || user.displayName || user.email?.split('@')[0] || 'Crew';
        const rank         = profile?.rank ?? 'First Officer';
        const handle       = `@${name.toLowerCase().replace(/\s+/g, '.')}`;
        const topRoute     = activeRoster ? computeTopRoute(activeRoster.events as DutyEvent[]) : null;

        const built = stats.sectors > 0 || stats.km > 0
          ? buildSlides(name, rank, handle, stats.km, stats.sectors, blockMinutes, earned, topRoute)
          : DEMO_SLIDES;

        setSlides(built);
      } finally {
        setLoad(false);
      }
    })();
  }, [isAuthLoading, isLoadingList, user, profile, rosters, activeRoster]);

  // ── Audio ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    engineRef.current = createLofiEngine();
    return () => { engineRef.current?.dispose(); };
  }, []);

  // ── Progress rAF loop ────────────────────────────────────────────────────────
  const total = slides.length;
  const advance = useCallback((dir: number) => {
    setProgress(0); startTsRef.current = null;
    setIndex(i => {
      const n = Math.max(0, Math.min(i + dir, total - 1));
      indexRef.current = n;
      const t = slides[n]?.type;
      engineRef.current?.blip(t === 'achievement' ? 'achieve' : t === 'route' ? 'route' : 'tap');
      return n;
    });
  }, [total, slides]);

  useEffect(() => {
    if (!started || paused || shareOpen || slides.length === 0) return;
    const slide = slides[index];
    const dur = DURATIONS[slide?.type ?? 'stat'] ?? 6000;
    startTsRef.current = null;
    const tick = (ts: number) => {
      if (startTsRef.current == null) startTsRef.current = ts - progress * dur;
      const p = Math.min((ts - startTsRef.current) / dur, 1);
      setProgress(p);
      if (p >= 1) { advance(1); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [started, paused, shareOpen, index, slides]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle sound ─────────────────────────────────────────────────────────────
  const toggleSound = useCallback(() => {
    setMuted(m => {
      const next = !m;
      if (engineRef.current) next ? engineRef.current.stop() : engineRef.current.start();
      return next;
    });
  }, []);

  // ── First tap: start audio + story ──────────────────────────────────────────
  const handleStart = useCallback(() => {
    setStarted(true);
    if (!muted) engineRef.current?.start();
  }, [muted]);

  // ── Tap zones with hold-to-pause ─────────────────────────────────────────────
  const onPointerDown = useCallback(() => {
    heldRef.current = false;
    holdTimer.current = setTimeout(() => { heldRef.current = true; setPaused(true); }, 220);
  }, []);
  const onPointerUp = useCallback((zone: 'left' | 'right') => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (heldRef.current) { setPaused(false); heldRef.current = false; return; }
    if (!started) { handleStart(); return; }
    if (zone === 'left') advance(-1); else advance(1);
  }, [started, advance, handleStart]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight')           { if (!started) handleStart(); else advance(1); }
      else if (e.key === 'ArrowLeft')       advance(-1);
      else if (e.key === ' ')               { e.preventDefault(); setPaused(p => !p); }
      else if (e.key.toLowerCase() === 'm') toggleSound();
      else if (e.key === 'Escape')          router.push('/passport');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, advance, handleStart, toggleSound, router]);

  // ── Share ─────────────────────────────────────────────────────────────────────
  const handleNativeShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: 'My Flight Passport', url }); return; } catch { /* fall through */ } }
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isDataLoading || slides.length === 0) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: '#111' }}>
        <div className="flex flex-col items-center gap-4">
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid rgba(255,56,92,0.3)`, borderTopColor: C.coral, animation: 'spinSlow 0.8s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Loading story…</p>
        </div>
      </div>
    );
  }

  const slide  = slides[index];
  const handle = slides[slides.length - 1]?.handle ?? 'otarosta';
  const year   = slides[slides.length - 1]?.year ?? String(new Date().getFullYear());

  return (
    <div className="fixed inset-0 z-[500] overflow-hidden" style={{ background: '#000', fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      {/* Slides — crossfade */}
      {slides.map((s, i) => (
        <div key={s.id} className="absolute inset-0" style={{ opacity: i === index ? 1 : 0, transition: 'opacity 0.45s ease', pointerEvents: i === index ? 'auto' : 'none', zIndex: i === index ? 1 : 0 }}>
          <SlideView slide={s} active={i === index && started} onShare={() => setShareOpen(true)} />
        </div>
      ))}

      {/* Top gradient scrim */}
      <div className="absolute inset-x-0 top-0 z-10 pointer-events-none" style={{ height: 160, background: 'linear-gradient(180deg,rgba(0,0,0,0.30) 0%,rgba(0,0,0,0.12) 50%,transparent 100%)' }} />

      {/* Chrome */}
      <div className="absolute inset-x-0 top-0 z-20" style={{ paddingTop: 44 }}>
        <ProgressBars count={total} index={index} progress={progress} />
        <StoryHeader paused={paused} muted={muted} handle={handle} year={year} onToggleSound={toggleSound} onClose={() => router.push('/passport')} />
      </div>

      {/* Tap zones */}
      <div className="absolute inset-0 z-10 flex" style={{ touchAction: 'none' }}>
        <div style={{ width: '32%' }} onPointerDown={onPointerDown} onPointerUp={() => onPointerUp('left')} onPointerLeave={() => holdTimer.current && clearTimeout(holdTimer.current)} />
        <div style={{ width: '68%' }} onPointerDown={onPointerDown} onPointerUp={() => onPointerUp('right')} onPointerLeave={() => holdTimer.current && clearTimeout(holdTimer.current)} />
      </div>

      {/* Start veil */}
      {!started && (
        <div className="absolute inset-0 z-20 flex items-end justify-center pointer-events-none" style={{ paddingBottom: 26 }}>
          <div className="anim-fadeIn" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.22)', padding: '8px 14px', borderRadius: 999, backdropFilter: 'blur(6px)' }}>
            <Icon name="play" className="w-4 h-4" /> Tap anywhere · hold to pause
          </div>
        </div>
      )}

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} onNativeShare={handleNativeShare} />
    </div>
  );
}
