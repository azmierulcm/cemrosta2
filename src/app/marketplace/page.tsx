'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import CreateAdModal from '@/components/marketplace/CreateAdModal';
import ListingDetailModal from '@/components/marketplace/ListingDetailModal';
import { Search, SlidersHorizontal, Plus, Loader2, PackageOpen } from 'lucide-react';
import { supabase } from '@/utils/supabase';

const CATEGORIES = ["All", "Headsets", "Luggage", "Watches", "Uniforms", "Manuals"];

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('marketplace_listings')
        .select('*, profiles(full_name, avatar_url, rank)')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (activeCategory !== "All") {
        query = query.eq('category', activeCategory);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeCategory, searchQuery]);

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
            onClick={() => setIsCreateModalOpen(true)}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 pl-16 pr-8 py-5 rounded-full font-bold focus:outline-none focus:ring-2 focus:ring-rausch/10 focus:bg-white transition-all text-gray-900"
            />
          </div>
          <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
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
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
             <Loader2 className="w-12 h-12 animate-spin text-rausch mb-4" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Gear...</p>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {listings.map((item) => (
              <div key={item.id} onClick={() => setSelectedListing(item)}>
                <MarketplaceCard listing={{
                  ...item,
                  image: (item.image_urls && item.image_urls.length > 0) ? item.image_urls[0] : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
                  seller: item.profiles?.full_name || "Crew Member",
                  avatar: item.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${item.seller_id}`
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
             <PackageOpen className="w-16 h-16 text-gray-300 mb-6" />
             <h3 className="text-2xl font-black text-gray-900 mb-2">No items found</h3>
             <p className="text-gray-500 font-medium">Be the first to list your gear in this category.</p>
          </div>
        )}
      </div>

      <CreateAdModal isOpen={isCreateModalOpen} onClose={() => {
        setIsCreateModalOpen(false);
        fetchListings(); // Refresh list after closing sell modal
      }} />

      <ListingDetailModal 
        listing={selectedListing} 
        isOpen={!!selectedListing} 
        onClose={() => setSelectedListing(null)} 
      />
    </main>
  );
}
