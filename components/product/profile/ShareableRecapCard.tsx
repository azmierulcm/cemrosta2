'use client';

import React from 'react';
import { RosterData } from '@/lib/types';
import { Plane } from 'lucide-react';

const ShareableRecapCard = ({ roster }: { roster: RosterData }) => {
  if (!roster || !roster.stats) return null;

  const topDestinations = roster.destinations?.slice(0, 3) || [];

  return (
    <div 
      id="shareable-recap"
      className="w-[360px] h-[640px] bg-bg p-10 flex flex-col relative overflow-hidden"
      style={{ boxShadow: '0 0 40px rgba(0,0,0,0.1)' }}
    >
      {/* Aviation Theme Background */}
      <div className="absolute top-0 right-0 p-8 text-gray-100 -rotate-12 pointer-events-none">
        <Plane size={200} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b-2 border-gray-900 pb-6 mb-10">
        <p className="text-[10px] font-black tracking-[0.3em] text-text-subtle uppercase mb-2">
          Official Digital Logbook
        </p>
        <h2 className="text-4xl font-black text-text leading-tight">
          {roster.month.toUpperCase()} {roster.year} <br />
          <span className="text-accent italic">MISSION RECAP</span>
        </h2>
      </div>

      {/* Simplified Route Line Visual */}
      <div className="mb-12">
        <svg viewBox="0 0 200 60" className="w-full h-12 text-gray-200">
          <path d="M0 30 Q 50 0, 100 30 T 200 30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="0" cy="30" r="3" fill="#FF5A5F" />
          <circle cx="200" cy="30" r="3" fill="#FF5A5F" />
        </svg>
      </div>

      {/* Stats Section */}
      <div className="space-y-8 flex-1 relative z-10">
        <div>
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-1">Total Distance</p>
          <p className="text-5xl font-black text-text tracking-tighter">
            {roster.stats.totalMiles.toLocaleString()} <span className="text-sm font-bold text-accent italic">KM</span>
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-1">Sectors</p>
            <p className="text-4xl font-black text-text tracking-tighter">{roster.stats.totalSectors}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-1">In The Air</p>
            <p className="text-4xl font-black text-text tracking-tighter">{roster.stats.totalBlockTime.split(' ')[0]}</p>
          </div>
        </div>
      </div>

      {/* Bottom Section with Patches & QR */}
      <div className="mt-auto relative z-10">
        <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-6">Unlocked Stamps</p>
        <div className="flex gap-4 mb-10">
          {topDestinations.map((dest) => (
            <div key={dest.iata} className={`w-12 h-12 rounded-xl border-2 ${dest.colorTheme} flex items-center justify-center text-[10px] font-black`}>
              {dest.iata}
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between border-t-2 border-border pt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center p-2">
              {/* QR Placeholder */}
              <div className="w-full h-full bg-bg grid grid-cols-2 gap-0.5 p-0.5">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-black" />)}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text">SKY-SCHEDULE.COM</p>
              <p className="text-[8px] font-medium text-text-subtle">@muhammad.azmierul</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-accent">CERTIFIED</p>
             <p className="text-[8px] font-medium text-text-subtle tracking-tight">MA-ID: 2112524</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareableRecapCard;
