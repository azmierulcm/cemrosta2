'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProfileGallery from '@/components/profile/ProfileGallery';
import StatsGrid from '@/components/profile/StatsGrid';
import ShareableRecapCard from '@/components/profile/ShareableRecapCard';
import ExportButton from '@/components/profile/ExportButton';
import DestinationPatch from '@/components/DestinationPatch';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { useRosterStore } from '@/store/useRosterStore';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/utils/supabase';
import { Settings, User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
  const { roster } = useRosterStore();
  const { user, profile, setProfile } = useAuthStore();
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
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-40 text-center px-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <UserIcon className="text-gray-300 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No Roster Found</h2>
          <p className="text-gray-500 mt-2">Please upload your roster to Cemrosta first.</p>
        </div>
      </main>
    );
  }

  // Use profile data if available, fallback to roster data
  const displayName = profile?.full_name || roster.crewName || 'Crew Member';
  const displayRank = profile?.rank || 'First Officer';
  const displayAirline = profile?.airline || 'Malaysia Airlines';

  return (
    <main className="min-h-screen bg-white pb-32">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 pt-32 relative">
        {/* Gallery Section */}
        <div className="relative group">
          <ProfileGallery name={displayName} photos={profile?.gallery_urls} />
          {user && (
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur-md border border-gray-100 p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 font-bold text-sm text-gray-900"
            >
              <Settings size={18} />
              Edit Profile
            </button>
          )}
        </div>

        <div className="mt-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{displayName}</h1>
            <p className="text-xl font-bold text-rausch">{displayRank} • {displayAirline}</p>
            {profile?.bio && <p className="mt-4 text-gray-500 font-medium max-w-2xl leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Monthly Performance</h3>
          <StatsGrid stats={roster.stats!} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left: Patch Collection */}
          <div className="lg:col-span-7">
             <h3 className="text-2xl font-bold text-gray-900 mb-8">Lifetime Collection</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                {roster.destinations?.map(dest => (
                  <DestinationPatch key={dest.iata} destination={dest} />
                ))}
             </div>
          </div>

          {/* Right: Social Recap & Export */}
          <div className="lg:col-span-5">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Monthly Recap</h3>
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
