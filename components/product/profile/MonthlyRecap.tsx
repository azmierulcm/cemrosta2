'use client';

import React, { useState } from 'react';
import { formatBlockHours } from '@/lib/utils/format';
import { Sparkles, Calendar } from 'lucide-react';
import RecapCardModal from './RecapCardModal';

interface MonthlyRecapProps {
  recap: {
    month: string;
    year: string;
    sectors: number;
    blockMinutes: number;
    newCity: string | null;
  };
}

const MonthlyRecap = ({ recap }: MonthlyRecapProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-surface-2 border border-border rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent opacity-30" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle mb-4 font-mono">
              <Calendar size={12} className="text-accent" />
              Monthly Mission Recap
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-text">
              {recap.month} <span className="text-text-subtle">{recap.year}</span>
            </h2>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-accent text-accent-fg px-8 py-4 rounded-2xl font-bold hover:bg-accent-hover transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-accent/20"
          >
            Generate Card
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-border/50">
          <div>
            <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-2 font-mono">Sectors Flown</p>
            <p className="text-3xl font-bold text-text font-mono">{recap.sectors}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-2 font-mono">Air Time</p>
            <p className="text-3xl font-bold text-text font-mono">{formatBlockHours(recap.blockMinutes)} <span className="text-xs uppercase">hrs</span></p>
          </div>
          {recap.newCity && (
            <div>
              <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-2 font-mono">New Frontier</p>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-text font-mono">{recap.newCity}</p>
                <div className="bg-accent text-accent-fg text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                  <Sparkles size={8} fill="currentColor" />
                  New
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <RecapCardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userId="demo-user" // placeholder
        month={recap.month}
        year={recap.year}
      />
    </>
  );
};

export default MonthlyRecap;
