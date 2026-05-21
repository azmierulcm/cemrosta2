'use client';

import { PlaneTakeoff } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import { TopDestinations, earnedToTopDest } from '@/components/product/TopDestinations';

export default function PassportClient() {
  const { activeRoster, isLoading } = useRoster();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted text-[15px]">
        Loading…
      </div>
    );
  }

  if (!activeRoster) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted text-[15px]">
        Upload a roster to see your passport.
      </div>
    );
  }

  const topDests = earnedToTopDest(
    (activeRoster.destinations ?? []).map((d) => ({
      iata:   d.iata,
      visits: d.count,
      isNew:  d.count === 1,
      isHome: d.iata === 'KUL',
    }))
  );

  return (
    <div className="min-h-screen bg-surface px-4 py-8 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-bg rounded-2xl border border-border shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black tracking-tight text-text">Top Destinations</h2>
            <div className="bg-surface p-2 rounded-xl border border-border text-text-muted shrink-0">
              <PlaneTakeoff className="w-4 h-4" />
            </div>
          </div>
          <TopDestinations destinations={topDests} />
        </div>
      </div>
    </div>
  );
}
