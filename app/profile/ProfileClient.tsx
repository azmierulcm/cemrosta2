'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import ProfileGallery from '@/components/product/profile/ProfileGallery';
import StatsGrid from '@/components/product/profile/StatsGrid';
import ShareableRecapCard from '@/components/product/profile/ShareableRecapCard';
import ExportButton from '@/components/product/profile/ExportButton';
import DestinationPatch from '@/components/product/DestinationPatch';
import EditProfileModal from '@/components/product/profile/EditProfileModal';
import { useRoster } from '@/lib/contexts/RosterContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/utils/supabase';
import { Settings, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ProfileClient() {
  const { roster } = useRoster();
  const { user, profile, setProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch real profile from Supabase on load
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        setProfile(data);
      }
    };
    fetchProfile();
  }, [user, setProfile]);

  if (!roster) {
    return (
      <main className="min-h-screen bg-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-surface border border-border rounded-[2.5rem] flex items-center justify-center mb-12 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <UserIcon className="text-text-subtle w-12 h-12 relative z-10" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold text-text tracking-tighter mb-4">Passport Inactive.</h2>
            <p className="text-text-muted max-w-md mx-auto leading-relaxed mb-12">
              Your destination stats, collectible patches, and career milestones will appear here once you upload your first roster.
            </p>
            
            <Link 
              href="/"
              className="bg-accent text-accent-fg px-10 py-4 rounded-2xl font-bold hover:bg-accent-hover transition-all active:scale-95 inline-flex items-center gap-2 shadow-xl shadow-accent/10"
            >
              Upload Roster <Settings size={18} />
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  // Use profile data if available, fallback to roster data
  const displayName = profile?.full_name || roster.crewName || 'Crew Member';
  const displayRank = profile?.rank || 'First Officer';
  const displayAirline = profile?.airline || 'Malaysia Airlines';

  return (
    <main className="min-h-screen bg-bg pb-32">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 pt-32 relative">
        {/* Gallery Section */}
        <ProfileGallery 
          name={displayName} 
          photos={profile?.gallery_urls} 
          isOwner={!!user}
          onEdit={() => setIsEditModalOpen(true)}
        />

        <div className="mt-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-extrabold text-text tracking-tight mb-2">{displayName}</h1>
            <p className="text-xl font-bold text-accent">{displayRank} • {displayAirline}</p>
            {profile?.bio && <p className="mt-4 text-text-muted font-medium max-w-2xl leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-bold text-text mb-8">Monthly Performance</h3>
          <StatsGrid stats={roster.stats!} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left: Patch Collection */}
          <div className="lg:col-span-7">
             <h3 className="text-2xl font-bold text-text mb-8">Lifetime Collection</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                {roster.destinations?.map(dest => (
                  <DestinationPatch key={dest.iata} destination={dest} />
                ))}
             </div>
          </div>

          {/* Right: Social Recap & Export */}
          <div className="lg:col-span-5">
            <h3 className="text-2xl font-bold text-text mb-8">Monthly Recap</h3>
            <div className="flex flex-col items-center gap-10">
               <div className="scale-75 md:scale-100 origin-top">
                  <ShareableRecapCard roster={roster} />
               </div>
               <ExportButton targetId="shareable-recap" filename={`Recap-${roster.month}-${roster.year}`} />
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </main>
  );
}
