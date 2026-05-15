'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import PublicProfileGallery from '@/components/profile/PublicProfileGallery';
import PublicMissionMap from '@/components/profile/PublicMissionMap';
import StatsGrid from '@/components/profile/StatsGrid';
import DestinationPatch from '@/components/DestinationPatch';
import { useRosterStore } from '@/store/useRosterStore';

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  // In a real app, we would fetch the profile from Supabase by ID.
  // For now, we reuse our local roster data or sample data.
  const { roster, loadSampleRoster } = useRosterStore();

  // Load sample if nothing exists
  React.useEffect(() => {
    if (!roster) loadSampleRoster();
  }, [roster, loadSampleRoster]);

  if (!roster) return null;

  return (
    <main className="min-h-screen bg-white pb-32">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 pt-32">
        {/* Immersive 5-Photo Grid */}
        <PublicProfileGallery />

        {/* Profile Identity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <div className="mb-12 border-b border-gray-100 pb-12">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                {roster.crewName || 'Muhammad Azmierul'}
              </h1>
              <p className="text-xl font-bold text-rausch mb-6">Senior First Officer • A350 Fleet</p>
              <div className="prose prose-lg text-gray-500 font-medium leading-relaxed">
                <p>
                  Aviation enthusiast and long-haul pilot based in Kuala Lumpur. 
                  Passionate about capturing the world from 40,000 feet and exploring 
                  the hidden gems of every layover city.
                </p>
              </div>
            </div>

            {/* Monthly Flight Map */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Mission Operations</h3>
              <PublicMissionMap />
            </div>

            {/* Destinations Section */}
            {roster.destinations && (
              <section className="mb-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Destinations This Month</h3>
                <div className="flex gap-8 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide">
                  {roster.destinations.map((dest) => (
                    <DestinationPatch key={dest.iata} destination={dest} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-12">
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-card">
                <h4 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-widest text-[10px]">Monthly Record</h4>
                <div className="space-y-6">
                   <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                      <p className="text-gray-400 font-bold text-xs uppercase">Sectors</p>
                      <p className="text-2xl font-black text-gray-900">{roster.stats?.totalSectors || 0}</p>
                   </div>
                   <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                      <p className="text-gray-400 font-bold text-xs uppercase">Distance</p>
                      <p className="text-2xl font-black text-gray-900">{roster.stats?.totalMiles.toLocaleString() || 0} KM</p>
                   </div>
                   <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                      <p className="text-gray-400 font-bold text-xs uppercase">Air Time</p>
                      <p className="text-2xl font-black text-gray-900">{roster.stats?.totalBlockTime || '0h'}</p>
                   </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rausch/20 blur-[60px] -mr-16 -mt-16 rounded-full" />
                <h4 className="text-2xl font-black mb-4 leading-tight">Elite Crew Community</h4>
                <p className="text-gray-400 text-sm font-medium mb-8 leading-relaxed">
                  Join Cemrosta to share your digital logbook and unlock exclusive mission rewards.
                </p>
                <button className="w-full bg-rausch py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all">
                  Sign Up with Airline ID
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
