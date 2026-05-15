import React from 'react';
import { CrewProfile, CrewStats } from '@/types/passport';

interface FinalFlightProps {
  profile: CrewProfile;
  stats: CrewStats;
  finalRoute: { origin: string; dest: string };
  retirementDate: string;
}

const FinalFlightCard = ({ profile, stats, finalRoute, retirementDate }: FinalFlightProps) => {
  return (
    <div className="w-[360px] h-[640px] bg-black rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl border border-white/10">
      {/* Luxurious Gold Accents */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-passport-gold to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-passport-gold to-transparent" />

      {/* Header */}
      <div className="text-center mb-10 relative z-10 pt-4">
        <p className="text-passport-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-4">Official Retirement Certificate</p>
        <h2 className="text-4xl font-serif italic text-white mb-2 leading-tight">The Final <br /> Sector.</h2>
      </div>

      {/* Final Route Display */}
      <div className="bg-white/5 p-8 rounded-3xl border border-white/10 mb-10 text-center relative z-10">
        <div className="flex justify-center items-center gap-6 mb-4">
           <span className="text-3xl font-black text-white">{finalRoute.origin}</span>
           <div className="flex-1 h-px bg-passport-gold opacity-50 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-passport-gold shadow-[0_0_10px_#D4AF37]" />
           </div>
           <span className="text-3xl font-black text-white">{finalRoute.dest}</span>
        </div>
        <p className="text-xs font-bold text-passport-gold uppercase tracking-widest">{retirementDate}</p>
      </div>

      {/* Career Summary */}
      <div className="space-y-8 mb-12 relative z-10">
        <div>
           <p className="text-[10px] font-bold text-passport-text-tertiary uppercase tracking-widest mb-1">Total Career Time</p>
           <p className="text-4xl font-black text-white tracking-tighter">
             {Math.floor(stats.total_block_minutes / 60).toLocaleString()} <span className="text-sm font-bold text-passport-gold-soft italic underline">Hours</span>
           </p>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-bold text-passport-text-tertiary uppercase tracking-widest mb-1">Missions</p>
            <p className="text-3xl font-black text-white tracking-tighter">{stats.total_sectors.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-passport-text-tertiary uppercase tracking-widest mb-1">Destinations</p>
            <p className="text-3xl font-black text-white tracking-tighter">{stats.unique_destinations}</p>
          </div>
        </div>
      </div>

      {/* Tribute Area Placeholder */}
      <div className="relative z-10 flex-1 border-t border-white/10 pt-8 italic text-passport-text-secondary text-sm text-center leading-relaxed">
        &ldquo;A career defined by precision, pride, and the boundless horizon. Thank you for your service to the skies.&rdquo;
      </div>

      {/* Crew Identity Footer */}
      <div className="mt-auto relative z-10 flex items-center justify-between pt-6 border-t border-white/10">
         <div>
            <p className="text-xs font-black text-white uppercase tracking-tight">{profile.display_name}</p>
            <p className="text-[10px] font-bold text-passport-gold uppercase tracking-widest">{profile.rank}</p>
         </div>
         <div className="text-passport-gold font-black text-sm tracking-tighter">
            CEMROSTA
         </div>
      </div>

      {/* Background Starfield */}
      <div className="absolute inset-0 opacity-20">
         {[...Array(20)].map((_, i) => (
           <div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }} />
         ))}
      </div>
    </div>
  );
};

export default FinalFlightCard;
