'use client';

import React from 'react';
import { motion } from 'framer-motion';

const PublicProfileGallery = () => {
  const photos = [
    "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=1200", // Featured
    "https://images.unsplash.com/photo-1540339832862-474599807836?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=600",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[500px] md:h-[600px] mb-12 rounded-3xl overflow-hidden">
      {/* 1 Large Photo (Left) */}
      <div className="md:col-span-2 md:row-span-2 relative overflow-hidden group">
        <img 
          src={photos[0]} 
          alt="Featured" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors pointer-events-none" />
      </div>

      {/* 4 Small Photos (Right Grid) */}
      {photos.slice(1).map((src, i) => (
        <div key={i} className="relative overflow-hidden group hidden md:block">
          <img 
            src={src} 
            alt={`Gallery ${i + 1}`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors pointer-events-none" />
        </div>
      ))}
    </div>
  );
};

export default PublicProfileGallery;
