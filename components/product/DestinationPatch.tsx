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
      className="group flex flex-col items-center shrink-0 w-36 gap-2"
    >
      {/* Stamp artwork — no card wrapper */}
      {patchImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={patchImageUrl}
          alt={`${city} patch`}
          className="w-28 h-28 object-contain drop-shadow-sm"
        />
      ) : (
        /* Fallback monogram for cities without artwork */
        <div className="w-24 h-24 rounded-full bg-surface-2 border-2 border-border/60 flex items-center justify-center">
          <span className="font-mono font-[700] text-[16px] text-text-muted tracking-wide">{iata}</span>
        </div>
      )}

      {/* City label */}
      <div className="text-center leading-tight">
        <p className="text-[13px] font-black text-text truncate max-w-[130px] tracking-tight">{city}</p>
        <p className="text-[10px] font-black text-text-muted/50 uppercase tracking-[0.2em] font-mono">{country}</p>
      </div>

      {/* Trip count pill */}
      <span className="text-[10px] font-black text-text-muted px-3 py-1 rounded-full border border-border bg-surface-2 uppercase tracking-widest font-mono">
        {count}×
      </span>
    </motion.div>
  );
};
