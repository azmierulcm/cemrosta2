'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Listing {
  id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  image: string;
  seller: string;
  avatar: string;
}

const MarketplaceCard = ({ listing }: { listing: Listing }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group cursor-pointer"
    >
      <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 relative shadow-sm border border-gray-100">
        <img 
          src={listing.image} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm border border-white">
          {listing.condition}
        </div>
      </div>
      <div className="px-2">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-gray-900 truncate flex-1 pr-4">{listing.title}</h4>
          <span className="font-black text-gray-900 text-lg">RM{listing.price}</span>
        </div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter mb-4">{listing.category}</p>
        <div className="flex items-center gap-2 border-t border-gray-50 pt-4">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
            <img src={listing.avatar} alt={listing.seller} className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-bold text-gray-600">Sold by {listing.seller}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceCard;
