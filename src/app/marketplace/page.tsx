'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import CreateAdModal from '@/components/marketplace/CreateAdModal';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ["All", "Headsets", "Luggage", "Watches", "Uniforms", "Manuals"];

const MOCK_LISTINGS = [
  {
    id: '1',
    title: "Bose A20 Aviation Headset",
    price: 3800,
    condition: "Lightly Used",
    category: "Headsets",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
    seller: "Capt. Sarah",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    id: '2',
    title: "Rimowa Original Cabin Silver",
    price: 4200,
    condition: "Well Used",
    category: "Luggage",
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=800",
    seller: "FO James",
    avatar: "https://i.pravatar.cc/150?u=james"
  },
  {
    id: '3',
    title: "Garmin D2 Mach 1 Aviator Watch",
    price: 5500,
    condition: "New",
    category: "Watches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
    seller: "Muhammad Azmierul",
    avatar: "https://i.pravatar.cc/150?u=azmierul"
  },
  {
    id: '4',
    title: "Sennheiser S1 Digital Headset",
    price: 1200,
    condition: "Well Used",
    category: "Headsets",
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800",
    seller: "Sarah Jenkins",
    avatar: "https://i.pravatar.cc/150?u=sarahj"
  },
  {
    id: '5',
    title: "Travelpro Platinum Elite",
    price: 950,
    condition: "Lightly Used",
    category: "Luggage",
    image: "https://images.unsplash.com/photo-1581553670339-6142a9dd289a?auto=format&fit=crop&q=80&w=800",
    seller: "Capt. Ahmad",
    avatar: "https://i.pravatar.cc/150?u=ahmad"
  },
  {
    id: '6',
    title: "A350 Quick Reference Handbook",
    price: 450,
    condition: "New",
    category: "Manuals",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
    seller: "Capt. Sarah",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  }
];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white pb-32">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-4">Marketplace</h1>
            <p className="text-xl text-gray-500 font-medium italic">Elite gear for elite crew.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-rausch text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-rausch/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
          >
            <Plus size={20} strokeWidth={3} />
            Sell an Item
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-16">
          <div className="w-full md:flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search headsets, luggage, watches..."
              className="w-full bg-gray-50 border border-gray-100 pl-16 pr-8 py-5 rounded-full font-bold focus:outline-none focus:ring-2 focus:ring-rausch/10 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto no-scrollbar">
             {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    px-6 py-3 rounded-full text-sm font-bold border whitespace-nowrap transition-all
                    ${activeCategory === cat 
                      ? 'bg-black border-black text-white shadow-lg' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-900'}
                  `}
                >
                  {cat}
                </button>
             ))}
             <button className="p-4 bg-white border border-gray-200 rounded-full hover:border-gray-900 transition-colors">
                <SlidersHorizontal size={20} className="text-gray-900" />
             </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
          {MOCK_LISTINGS.filter(l => activeCategory === "All" || l.category === activeCategory).map((item) => (
            <MarketplaceCard key={item.id} listing={item} />
          ))}
        </div>
      </div>

      <CreateAdModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
