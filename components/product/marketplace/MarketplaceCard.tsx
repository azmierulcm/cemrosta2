'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  image: string;
  seller: string;
  avatar: string;
  isVerified?: boolean;
  airline?: string;
}

const MarketplaceCard = ({ listing }: { listing: Listing }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? {} : { y: -8 }}
      className="group cursor-pointer"
    >
      <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 relative shadow-sm border border-border">
        <img 
          src={listing.image} 
          alt={listing.title} 
          className={`w-full h-full object-cover transition-transform duration-500 ${shouldReduceMotion ? '' : 'group-hover:scale-110'}`}
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           <div className="bg-bg/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-text shadow-sm border border-border">
             {listing.condition}
           </div>
           {listing.isVerified && (
             <div className="bg-success/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-sm flex items-center gap-1">
                <ShieldCheck size={10} strokeWidth={3} />
                Verified
             </div>
           )}
        </div>
      </div>
      <div className="px-2">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-text truncate flex-1 pr-4">{listing.title}</h4>
          <span className="font-black text-text text-lg">RM{listing.price}</span>
        </div>
        <p className="text-text-subtle text-xs font-bold uppercase tracking-tighter mb-4">{listing.category}</p>
        <div className="flex items-center gap-2 border-t border-border pt-4">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-2 border border-border">
            <img src={listing.avatar} alt={listing.seller} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-text truncate max-w-[120px]">{listing.seller}</span>
            {listing.isVerified ? (
              <span className="text-[8px] font-black text-success uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck size={8} strokeWidth={3} />
                {listing.airline || 'Verified Crew'}
              </span>
            ) : (
              <span className="text-[8px] font-bold text-text-subtle uppercase tracking-widest flex items-center gap-1">
                <AlertCircle size={8} strokeWidth={3} />
                Unverified Seller
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceCard;
