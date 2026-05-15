'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import MarketplaceCard from '@/components/product/marketplace/MarketplaceCard';
import CreateAdModal from '@/components/product/marketplace/CreateAdModal';
import ListingDetailModal from '@/components/product/marketplace/ListingDetailModal';
import { Search, Plus, Loader2, PackageOpen, ShieldCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/utils/supabase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const CATEGORIES = ["All", "Headsets", "Luggage", "Watches", "Uniforms", "Manuals", "Other"];
const CONDITIONS = ["All", "New", "Lightly used", "Well used", "For parts"];

export default function MarketplaceClient() {
  const { user, openAuthModal, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCondition, setActiveCondition] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?auth=required&returnTo=/marketplace');
    }
  }, [user, authLoading, router]);

  const fetchListings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('marketplace_listings')
        .select('*, profiles(full_name, avatar_url, rank, airline, verified_at)')
        .eq('status', 'available')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (activeCategory !== "All") {
        query = query.eq('category', activeCategory);
      }

      if (activeCondition !== "All") {
        query = query.eq('condition', activeCondition);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];
      if (verifiedOnly) {
        filteredData = filteredData.filter(item => item.profiles?.verified_at);
      }

      setListings(filteredData);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeCategory, activeCondition, searchQuery, verifiedOnly, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-32">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle mb-4 font-mono">
              // CREW EXCLUSIVE ACCESS
            </div>
            <h1 className="text-5xl font-bold text-text tracking-tighter mb-4">Marketplace</h1>
            <p className="text-xl text-text-muted font-medium italic">Verified gear for aviation professionals.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-accent text-accent-fg px-10 py-5 rounded-2xl font-bold shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
          >
            <Plus size={20} strokeWidth={3} />
            Sell an Item
          </button>
        </div>

        {/* Disclaimer Strip */}
        <div className="bg-warning/10 border border-warning/20 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 mb-12">
           <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="text-warning" size={24} />
           </div>
           <div className="flex-1 text-center md:text-left">
              <p className="text-sm font-bold text-text mb-1 uppercase tracking-wider">Buyer Protection Disclaimer</p>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                Cemrosta does not process payments or hold items in escrow. Arrange directly with the seller. Meet in a safe public location. Verify the item&apos;s authenticity before exchanging cash.
              </p>
           </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-6 mb-16">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-subtle" size={20} />
              <input 
                type="text" 
                placeholder="Search headsets, luggage, watches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border pl-16 pr-8 py-5 rounded-full font-bold focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all text-text"
              />
            </div>
            
            <div className="flex items-center gap-4 bg-surface px-6 py-4 rounded-full border border-border">
               <span className="text-xs font-bold text-text-muted uppercase tracking-widest font-mono">Verified Only</span>
               <button 
                 onClick={() => setVerifiedOnly(!verifiedOnly)}
                 className={`w-12 h-6 rounded-full transition-colors relative ${verifiedOnly ? 'bg-accent' : 'bg-border'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${verifiedOnly ? 'left-7' : 'left-1'}`} />
               </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <span className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mr-2 font-mono">Category:</span>
             {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    px-5 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition-all
                    ${activeCategory === cat 
                      ? 'bg-accent border-accent text-accent-fg' 
                      : 'bg-bg border-border text-text-muted hover:border-text'}
                  `}
                >
                  {cat}
                </button>
             ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <span className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mr-2 font-mono">Condition:</span>
             {CONDITIONS.map((cond) => (
                <button
                  key={cond}
                  onClick={() => setActiveCondition(cond)}
                  className={`
                    px-5 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition-all
                    ${activeCondition === cond 
                      ? 'bg-text border-text text-bg' 
                      : 'bg-bg border-border text-text-muted hover:border-text'}
                  `}
                >
                  {cond}
                </button>
             ))}
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
             <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
             <p className="text-text-subtle font-bold uppercase tracking-widest text-xs font-mono">Scanning Inventory...</p>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {listings.map((item) => (
              <div key={item.id} onClick={() => setSelectedListing(item)} className="cursor-pointer">
                <MarketplaceCard listing={{
                  ...item,
                  image: (item.image_urls && item.image_urls.length > 0) ? item.image_urls[0] : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
                  seller: item.profiles?.full_name || "Crew Member",
                  avatar: item.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${item.seller_id}`,
                  isVerified: !!item.profiles?.verified_at,
                  airline: item.profiles?.airline
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-surface/30 rounded-[3rem] border border-dashed border-border">
             <PackageOpen className="w-16 h-16 text-text-subtle mb-6" />
             <h3 className="text-2xl font-bold text-text mb-2">No items found</h3>
             <p className="text-text-muted font-medium">Be the first to list your gear in this category.</p>
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
