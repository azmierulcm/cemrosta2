'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Globe, Award, Calendar, ChevronRight, Play } from 'lucide-react';
import { CrewStats } from '@/types/passport';
import ShareModal from './ShareModal';
import AchievementBadge from './AchievementBadge';
import { ACHIEVEMENT_CATALOG } from '@/lib/achievements/definitions';
import { useAuthStore } from '@/store/useAuthStore';

interface DashboardProps {
  stats: CrewStats;
  earnedAchievements?: string[];
}

const StatCard = ({ label, value, sub, icon: Icon }: any) => (
  <div className="bg-passport-surface p-8 rounded-[2rem] border border-passport-border hover:border-passport-gold/30 transition-all group shadow-sm">
    <div className="flex justify-between items-start mb-6">
      <div className="w-10 h-10 rounded-xl bg-passport-bg flex items-center justify-center border border-passport-border group-hover:border-passport-gold/20 transition-colors shadow-inner">
        <Icon size={20} className="text-passport-secondary group-hover:text-passport-gold transition-colors" />
      </div>
      <p className="text-[10px] font-bold text-passport-secondary uppercase tracking-[0.3em]">{label}</p>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-black text-passport-text tracking-tighter">{value}</span>
      {sub && <span className="text-[10px] font-bold text-passport-gold-soft uppercase tracking-wider">{sub}</span>}
    </div>
  </div>
);

import Link from 'next/link';

import CrewCard from './CrewCard';

const PassportDashboard = ({ stats, earnedAchievements = [] }: DashboardProps) => {
  const { user } = useAuthStore();
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const earnedSet = new Set(earnedAchievements);

  const mockProfile = {
    id: 'demo',
    user_id: 'demo',
    display_name: 'Muhammad Azmierul',
    rank: 'First Officer' as any,
    base_iata: 'KUL',
    airline_code: 'MH',
    aircraft_types: ['A350', 'A330'],
    handle: 'azmierul.fo',
    avatar_url: null,
    hire_date: '2020-05-15',
    birthday: null,
    privacy_mode: 'public' as any,
    created_at: new Date().toISOString()
  };

  return (
    <div className="bg-passport-bg min-h-screen text-passport-text p-10 font-sans selection:bg-passport-gold/30">
      <div className="max-w-7xl mx-auto pt-20 pb-20">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <p className="text-passport-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-4">Official Digital Passport</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
              Mission <br />
              <span className="text-passport-secondary italic font-serif font-light">Summary.</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/passport/story/year-in-air"
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-white/20 transition-all shadow-xl"
            >
              Watch 2026 Story
              <Play size={20} fill="currentColor" />
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsShareModalOpen(true)}
              className="bg-passport-gold text-passport-bg px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-passport-gold/20 flex items-center gap-3 transition-all"
            >
              Share Passport
              <ChevronRight size={20} strokeWidth={3} />
            </motion.button>
          </div>
        </div>

        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          crewId={user?.id || 'demo'} 
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <StatCard label="Distance" value={stats.total_km.toLocaleString()} sub="KM" icon={Globe} />
          <StatCard label="Sectors" value={stats.total_sectors} sub="Flights" icon={Plane} />
          <StatCard label="In Air" value={Math.floor(stats.total_block_minutes / 60)} sub="Hours" icon={Award} />
          <StatCard label="Stamps" value={stats.unique_destinations} sub="Cities" icon={Calendar} />
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left: Achievement Collection */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-10 border-b border-passport-border pb-6">
              <h3 className="text-[10px] font-bold text-passport-secondary uppercase tracking-[0.4em]">
                Achievement Collection
              </h3>
              <div className="text-[10px] font-bold text-passport-gold-soft uppercase tracking-widest">
                {earnedSet.size} of {ACHIEVEMENT_CATALOG.length} Unlocked
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
               {ACHIEVEMENT_CATALOG.map((def) => (
                 <AchievementBadge 
                   key={def.key} 
                   definition={def} 
                   earned={earnedSet.has(def.key)} 
                 />
               ))}
            </div>

            {/* Crew Trading Card Feature */}
            <div className="bg-passport-surface/20 rounded-[3rem] p-12 border border-passport-border/40 flex flex-col md:flex-row items-center gap-12 mt-20">
               <div className="scale-75 md:scale-100 origin-center shrink-0">
                  <CrewCard profile={mockProfile as any} stats={stats} />
               </div>
               <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-black mb-4 tracking-tight text-white uppercase italic">Your Digital Asset.</h3>
                  <p className="text-passport-secondary text-lg font-medium leading-relaxed mb-10 opacity-80">
                     A persistent, shareable identity card that carries your career stats. 
                     Exchange with colleagues to build your global aviation network.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                     <button className="bg-passport-gold text-passport-bg px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-passport-gold/20">
                        Exchange Card
                     </button>
                     <button className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-white/20 transition-all">
                        Download PNG
                     </button>
                  </div>
               </div>
            </div>
          </div>

          {/* Right: Sidebar Content */}
          <div className="lg:col-span-4 space-y-16">
            {/* Recent Missions */}
            <div>
              <h3 className="text-[10px] font-bold text-passport-secondary uppercase tracking-[0.4em] mb-10 border-b border-passport-border pb-6">
                Recent Missions
              </h3>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-passport-surface/20 rounded-2xl border border-passport-border/40 hover:border-passport-gold/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-6">
                      <div className="font-mono text-[10px] text-passport-secondary">MH 004</div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-sm tracking-tight text-white uppercase">KUL</span>
                        <ChevronRight size={14} className="text-passport-border" />
                        <span className="font-black text-sm tracking-tight text-white uppercase">LHR</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rare Milestone Highlight */}
            <div>
               <h3 className="text-[10px] font-bold text-passport-secondary uppercase tracking-[0.4em] mb-10 border-b border-passport-border pb-6">
                Elite Milestone
              </h3>
              <div className="bg-gradient-to-br from-passport-surface to-passport-bg-secondary p-8 rounded-[2.5rem] border border-passport-border relative overflow-hidden group shadow-2xl">
                  <Award className="absolute -top-10 -right-10 w-48 h-48 text-passport-gold/5 group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10">
                     <div className="w-14 h-14 rounded-2xl bg-passport-gold/10 border border-passport-gold/20 flex items-center justify-center mb-8 shadow-inner">
                        <Award className="text-passport-gold" size={28} />
                     </div>
                     <h4 className="text-2xl font-black mb-3 tracking-tight">Equator Bound</h4>
                     <p className="text-passport-secondary text-sm font-medium leading-relaxed mb-10 opacity-80">
                        Earned for your first crossing of the earth&apos;s center line. A true navigator&apos;s landmark.
                     </p>
                     <div className="bg-passport-bg/80 px-5 py-2.5 rounded-full border border-passport-border inline-block text-[10px] font-black text-passport-gold uppercase tracking-[0.2em] shadow-xl">
                        Rare Badge
                     </div>
                  </div>
              </div>
            </div>

            {/* Final Flight / Retirement CTA */}
            <div>
               <h3 className="text-[10px] font-bold text-passport-secondary uppercase tracking-[0.4em] mb-10 border-b border-passport-border pb-6">
                Career Horizon
              </h3>
              <div className="bg-black p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-passport-gold opacity-30" />
                  <h4 className="text-xl font-black text-white mb-4 italic">The Final Sector.</h4>
                  <p className="text-passport-text-tertiary text-xs font-medium leading-relaxed mb-8">
                     Unlock the ceremonial black-and-gold card to commemorate your retirement mission.
                  </p>
                  <button className="text-passport-gold font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                     Request Certificate <ChevronRight size={14} />
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
