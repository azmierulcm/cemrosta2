'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Globe, Award, Calendar, ChevronRight, Play } from 'lucide-react';
import { CrewStats, CrewRank, PrivacyMode } from '@/lib/types/passport';
import ShareModal from './ShareModal';
import AchievementBadge from './AchievementBadge';
import { ACHIEVEMENT_CATALOG } from '@/lib/achievements/definitions';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import CrewCard from './CrewCard';

interface DashboardProps {
  stats: CrewStats;
  earnedAchievements?: string[];
}

const StatCard = ({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: React.ElementType }) => (
  <div className="bg-surface p-8 rounded-[2rem] border border-border hover:border-accent/30 transition-all group shadow-xl">
    <div className="flex justify-between items-start mb-6">
      <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center border border-border group-hover:border-accent/20 transition-colors shadow-inner">
        <Icon size={20} className="text-text-muted group-hover:text-accent transition-colors" />
      </div>
      <p className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.4em] font-mono">{label}</p>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-bold text-text tracking-tighter font-mono">{value}</span>
      {sub && <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">{sub}</span>}
    </div>
  </div>
);

const PassportDashboard = ({ stats, earnedAchievements = [] }: DashboardProps) => {
  const { user } = useAuth();
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const earnedSet = new Set(earnedAchievements);

  const mockProfile = {
    id: 'demo',
    user_id: 'demo',
    display_name: 'Muhammad Azmierul',
    rank: 'First Officer' as CrewRank,
    base_iata: 'KUL',
    airline_code: 'MH',
    aircraft_types: ['A350', 'A330'],
    handle: 'azmierul.fo',
    avatar_url: null,
    hire_date: '2020-05-15',
    birthday: null,
    privacy_mode: 'public' as PrivacyMode,
    created_at: new Date().toISOString()
  };

  return (
    <div className="bg-bg min-h-screen text-text p-10 font-sans selection:bg-accent/30 selection:text-accent-fg">
      <div className="max-w-7xl mx-auto pt-20 pb-20">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <div>
            <p className="text-accent font-bold uppercase tracking-[0.5em] text-[10px] mb-4 font-mono">{`// OFFICIAL DIGITAL PASSPORT`}</p>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-none mb-4">
              Mission <br />
              <span className="text-text-subtle italic font-serif font-light">Summary.</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/passport/story/year-in-air"
              className="bg-surface border border-border text-text px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-surface-2 transition-all shadow-xl"
            >
              Watch 2026 Story
              <Play size={20} fill="currentColor" />
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsShareModalOpen(true)}
              className="bg-accent text-accent-fg px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-accent/20 flex items-center gap-3 transition-all"
            >
              Share Passport
              <ChevronRight size={20} strokeWidth={3} />
            </motion.button>
          </div>
        </div>

        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          crewId={user?.uid || 'demo'}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          <StatCard label="Distance" value={stats.total_km.toLocaleString()} sub="KM" icon={Globe} />
          <StatCard label="Sectors" value={stats.total_sectors} sub="Flights" icon={Plane} />
          <StatCard label="In Air" value={Math.floor(stats.total_block_minutes / 60)} sub="Hours" icon={Award} />
          <StatCard label="Stamps" value={stats.unique_destinations} sub="Cities" icon={Calendar} />
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
          {/* Left: Achievement Collection */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-12 border-b border-border pb-8">
              <h3 className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.5em] font-mono">
                Achievement Collection
              </h3>
              <div className="text-[10px] font-bold text-accent uppercase tracking-widest font-mono">
                {earnedSet.size} / {ACHIEVEMENT_CATALOG.length} UNLOCKED
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
               {ACHIEVEMENT_CATALOG.map((def) => (
                 <AchievementBadge 
                   key={def.key} 
                   definition={def} 
                   earned={earnedSet.has(def.key)} 
                 />
               ))}
            </div>

            {/* Crew Trading Card Feature */}
            <div className="bg-surface/30 rounded-[3rem] p-12 border border-border flex flex-col md:flex-row items-center gap-16 mt-24">
               <div className="scale-75 md:scale-100 origin-center shrink-0">
                  <CrewCard profile={mockProfile} stats={stats} />
               </div>
               <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-bold mb-6 tracking-tight text-text uppercase italic">Your Digital Asset.</h3>
                  <p className="text-text-muted text-lg font-medium leading-relaxed mb-10">
                     A persistent, shareable identity card that carries your career stats. 
                     Exchange with colleagues to build your global aviation network.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                     <button className="bg-accent text-accent-fg px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-accent/20">
                        Exchange Card
                     </button>
                     <button className="bg-surface-2 text-text border border-border px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-border transition-all">
                        Download PNG
                     </button>
                  </div>
               </div>
            </div>
          </div>

          {/* Right: Sidebar Content */}
          <div className="lg:col-span-4 space-y-24">
            {/* Recent Missions */}
            <div>
              <h3 className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.5em] mb-12 border-b border-border pb-8 font-mono">
                Recent Missions
              </h3>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-surface/30 rounded-2xl border border-border hover:border-accent/40 transition-all cursor-pointer group">
                    <div className="flex items-center gap-6">
                      <div className="font-mono text-[10px] text-text-subtle">MH 004</div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm tracking-tight text-text uppercase font-mono">KUL</span>
                        <ChevronRight size={14} className="text-border" />
                        <span className="font-bold text-sm tracking-tight text-text uppercase font-mono">LHR</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rare Milestone Highlight */}
            <div>
               <h3 className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.5em] mb-12 border-b border-border pb-8 font-mono">
                Elite Milestone
              </h3>
              <div className="bg-gradient-to-br from-surface to-bg p-8 rounded-[2.5rem] border border-border relative overflow-hidden group shadow-2xl">
                  <Award className="absolute -top-10 -right-10 w-48 h-48 text-accent/5 group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10">
                     <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-8 shadow-inner">
                        <Award className="text-accent" size={28} />
                     </div>
                     <h4 className="text-2xl font-bold mb-3 tracking-tight">Equator Bound</h4>
                     <p className="text-text-muted text-sm font-medium leading-relaxed mb-10">
                        Earned for your first crossing of the earth&apos;s center line. A true navigator&apos;s landmark.
                     </p>
                     <div className="bg-bg/80 px-5 py-2.5 rounded-full border border-border inline-block text-[10px] font-bold text-accent uppercase tracking-[0.2em] font-mono shadow-xl">
                        RARE BADGE
                     </div>
                  </div>
              </div>
            </div>

            {/* Final Flight / Retirement CTA */}
            <div>
               <h3 className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.5em] mb-12 border-b border-border pb-8 font-mono">
                Career Horizon
              </h3>
              <div className="bg-surface-2 p-8 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent opacity-30" />
                  <h4 className="text-xl font-bold text-text mb-4 italic">The Final Sector.</h4>
                  <p className="text-text-subtle text-xs font-medium leading-relaxed mb-8">
                     Unlock the ceremonial black-and-gold card to commemorate your retirement mission.
                  </p>
                  <button className="text-accent font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all font-mono">
                     REQUEST CERTIFICATE <ChevronRight size={14} />
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportDashboard;
