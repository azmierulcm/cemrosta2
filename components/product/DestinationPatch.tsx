import React from 'react';
import { motion } from 'framer-motion';
import { Destination } from '@/lib/types';
import { getPatchImageUrl } from '@/lib/patches/patch-images';

export const DestinationPatch = ({ destination }: { destination: Destination }) => {
  const { city, country, iata, count } = destination;
  const patchImageUrl = getPatchImageUrl(iata);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="group flex flex-col items-center justify-center shrink-0 w-48"
    >
      <div className="
        rounded-[2rem] border border-border bg-white p-6 aspect-square
        flex flex-col items-center justify-center gap-3
        shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all duration-500
        w-full
      ">
        {patchImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={patchImageUrl}
            alt={`${city} patch`}
            className="w-28 h-28 object-contain"
          />
        ) : (
          /* Fallback: monogram circle for cities without artwork yet */
          <div className="w-20 h-20 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <span className="font-mono font-[700] text-[18px] text-text-muted tracking-wide">{iata}</span>
          </div>
        )}
        <div className="text-center">
          <p className="text-[14px] font-black text-text truncate max-w-[140px] tracking-tight">{city}</p>
          <p className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] font-mono">{country}</p>
        </div>
      </div>
      <div className="mt-4 text-center">
        <span className="bg-white text-text-muted text-[10px] font-black px-4 py-1.5 rounded-full border border-border shadow-sm uppercase tracking-widest font-mono">
          {count} {count === 1 ? 'Trip' : 'Trips'}
        </span>
      </div>
    </motion.div>
  );
};
