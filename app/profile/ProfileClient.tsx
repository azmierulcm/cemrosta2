'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { ProfileFilled } from '@/components/product/profile/ProfileFilled';
import { ProfileEmptyState } from '@/components/product/profile/ProfileEmptyState';
import { RecapModal } from '@/components/product/profile/RecapModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRoster } from '@/lib/contexts/RosterContext';
import { getLifetimeDestinations, type EarnedDestination } from '@/lib/actions/destinations';
import { computeLifetimeStats } from '@/lib/utils/stats';

function LoadingShell() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-28 pb-24 space-y-4 animate-pulse">
      <div className="h-20 bg-surface rounded-[var(--radius-lg)]" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 bg-surface rounded-[var(--radius-md)]" />
        ))}
      </div>
      <div className="h-40 bg-surface rounded-[var(--radius-lg)]" />
    </div>
  );
}

export default function ProfileClient() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { rosters, activeRosterId, isLoading: isRosterLoading, isLoadingList } = useRoster();

  const [earnedDestinations, setEarnedDestinations] = useState<EarnedDestination[]>([]);
  const [isLoadingDests, setIsLoadingDests] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);

  // Fetch lifetime destinations whenever the user's roster set changes
  useEffect(() => {
    if (!user) {
      setEarnedDestinations(prev => prev.length === 0 ? prev : []);
      return;
    }
    if (isLoadingList) return; // wait for roster list to settle

    setIsLoadingDests(true);
    getLifetimeDestinations(user.uid, activeRosterId ?? undefined)
      .then(setEarnedDestinations)
      .catch(() => setEarnedDestinations([]))
      .finally(() => setIsLoadingDests(false));
  }, [user, isLoadingList, activeRosterId]);

  const hasRosters = rosters.length > 0;
  const isLoading = isAuthLoading || (!!user && (isLoadingList || isRosterLoading || isLoadingDests));

  // Build display name: prefer Firestore profile, fall back to Firebase displayName, then email prefix
  const displayName =
    profile?.full_name ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Crew Member';

  const lifetimeStats = computeLifetimeStats(rosters, earnedDestinations.length);

  // Use most recent roster for monthly recap
  const latestRoster = rosters[0] ?? null;
  const monthlyRecap = latestRoster
    ? {
        month: latestRoster.month,
        year: latestRoster.year,
        sectors: latestRoster.totalSectors,
        blockMinutes: 0, // not stored in summary — shown as "—" via MonthlyRecap
        newCity: earnedDestinations.find((d) => d.isNew && !d.isHome)?.iata ?? null,
      }
    : null;

  return (
    <main id="main-content" className="min-h-screen bg-surface-2 flex flex-col">
      <Navbar />

      <div className="flex-1">
        {isLoading ? (
          <LoadingShell />
        ) : !user || !hasRosters ? (
          <ProfileEmptyState />
        ) : (
          <ProfileFilled
            displayName={displayName}
            rank={profile?.rank || 'Crew Member'}
            base={profile?.base || 'KUL'}
            aircraft={profile?.fleet || 'A350'}
            avatarUrl={profile?.avatar_url}
            lifetimeStats={lifetimeStats}
            monthlyRecap={monthlyRecap}
            earnedDestinations={earnedDestinations}
            onShare={() => setIsRecapOpen(true)}
          />
        )}
      </div>

      {hasRosters && <Footer />}

      {user && (
        <RecapModal
          isOpen={isRecapOpen}
          onClose={() => setIsRecapOpen(false)}
          userId={user.uid}
          earnedDestinations={earnedDestinations}
        />
      )}
    </main>
  );
}
