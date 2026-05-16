'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RosterData } from '@/lib/types';
import type { RosterSummary } from '@/lib/types/roster';
import { extractDestinations } from '@/lib/utils/destinations';
import { calculateKilometers, formatBlockHours } from '@/lib/utils/geo/haversine';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getUserRosters, getRoster, deleteRoster as deleteRosterAction } from '@/lib/actions/rosters';

interface RosterContextType {
  rosters: RosterSummary[];
  activeRoster: RosterData | null;
  activeRosterId: string | null;
  isLoading: boolean;
  isLoadingList: boolean;
  error: string | null;
  setRoster: (roster: RosterData, rosterId: string) => void;
  selectRoster: (rosterId: string) => Promise<void>;
  deleteRoster: (rosterId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  loadSampleRoster: () => void;
}

const RosterContext = createContext<RosterContextType | undefined>(undefined);

function enrichRoster(raw: RosterData): RosterData {
  const destinations = extractDestinations(raw.events);
  const totalSectors = raw.events.filter((e) => e.type === 'FLIGHT').length;
  const totalMiles = raw.events.reduce((acc, e) => {
    if (e.type === 'FLIGHT' && e.depPort && e.arrPort) {
      return acc + calculateKilometers(e.depPort, e.arrPort);
    }
    return acc;
  }, 0);
  const totalBlockTime = formatBlockHours(raw.events);
  return {
    ...raw,
    destinations,
    stats: { totalSectors, totalMiles, totalBlockTime, uniqueDestinations: destinations.length },
  };
}

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [rosters, setRosters] = useState<RosterSummary[]>([]);
  const [activeRoster, setActiveRoster] = useState<RosterData | null>(null);
  const [activeRosterId, setActiveRosterId] = useState<string | null>(null);
  const [isLoading, setIsLoadingState] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const selectRoster = useCallback(async (rosterId: string) => {
    setIsLoadingState(true);
    setActiveRosterId(rosterId);
    setErrorState(null);
    try {
      const raw = await getRoster(rosterId);
      setActiveRoster(enrichRoster(raw));
    } catch {
      setErrorState('Failed to load roster.');
    } finally {
      setIsLoadingState(false);
    }
  }, []);

  // Fetch roster list whenever the logged-in user changes
  useEffect(() => {
    if (!user) {
      setRosters(prev => prev.length === 0 ? prev : []);
      setActiveRoster(prev => prev === null ? null : null);
      setActiveRosterId(prev => prev === null ? null : null);
      return;
    }

    let cancelled = false;
    setIsLoadingList(true);

    getUserRosters(user.uid)
      .then((list) => {
        if (cancelled) return;
        setRosters(list);
        // Auto-select most recent roster if none is active
        if (list.length > 0) {
          selectRoster(list[0].id).catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setErrorState('Failed to load your rosters.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingList(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, selectRoster]);

  const setRoster = useCallback((roster: RosterData, rosterId: string) => {
    setActiveRoster(enrichRoster(roster));
    setActiveRosterId(rosterId);
    setIsLoadingState(false);
    setErrorState(null);
    // Prepend to rosters list (optimistic)
    const summary: RosterSummary = {
      id: rosterId,
      month: roster.month,
      year: roster.year,
      crewName: roster.crewName ?? null,
      airline: 'MH',
      uploadedAt: new Date().toISOString(),
      eventCount: roster.events.length,
      totalSectors: roster.events.filter((e) => e.type === 'FLIGHT').length,
      totalKm: roster.events.reduce((acc, e) => {
        if (e.type === 'FLIGHT' && e.depPort && e.arrPort) {
          return acc + calculateKilometers(e.depPort, e.arrPort);
        }
        return acc;
      }, 0),
      uniqueDestinations: extractDestinations(roster.events).length,
    };
    setRosters((prev) => [summary, ...prev.filter((r) => r.id !== rosterId)]);
  }, []);

  const deleteRoster = useCallback(async (rosterId: string) => {
    // Fire the Firestore delete in the background
    deleteRosterAction(rosterId).catch(console.error);

    // Optimistically remove from the list and handle active-roster switching
    setRosters((prev) => {
      const next = prev.filter((r) => r.id !== rosterId);

      // If the deleted one was active, auto-select the next best
      setActiveRosterId((currentId) => {
        if (currentId !== rosterId) return currentId;
        if (next.length > 0) {
          selectRoster(next[0].id).catch(console.error);
          return next[0].id;
        }
        // No rosters left — clear the dashboard
        setActiveRoster(null);
        return null;
      });

      return next;
    });
  }, [selectRoster]);

  const setLoading = useCallback((loading: boolean) => setIsLoadingState(loading), []);
  const setError = useCallback((err: string | null) => {
    setErrorState(err);
    setIsLoadingState(false);
  }, []);

  const reset = useCallback(() => {
    setActiveRoster(null);
    setActiveRosterId(null);
    setIsLoadingState(false);
    setErrorState(null);
  }, []);

  const loadSampleRoster = useCallback(() => {
    const sampleData: RosterData = {
      month: 'May',
      year: '2026',
      crewName: 'Muhammad Azmierul',
      events: [
        { id: 'S4-353-02', type: 'STANDBY', date: '2026-05-02', signOn: '16:00', signOff: '23:59', description: 'A353 STANDBY DUTY 4' },
        { id: 'MH4-06', type: 'FLIGHT', date: '2026-05-06', flightNumber: 'MH 4', depPort: 'KUL', arrPort: 'LHR', signOn: '08:35', std: '09:53', sta: '16:33', signOff: '17:18', hotel: 'London Heathrow Hilton' },
        { id: 'MH1-07', type: 'FLIGHT', date: '2026-05-07', flightNumber: 'MH 1', depPort: 'LHR', arrPort: 'KUL', signOn: '20:35', std: '21:31', sta: '16:52', signOff: '17:37' },
        { id: 'MH376-18', type: 'FLIGHT', date: '2026-05-18', flightNumber: 'MH 376', depPort: 'KUL', arrPort: 'CAN', signOn: '07:45', std: '09:00', sta: '13:10', signOff: '14:00' },
        { id: 'MH377-18', type: 'FLIGHT', date: '2026-05-18', flightNumber: 'MH 377', depPort: 'CAN', arrPort: 'KUL', signOn: '14:25', sta: '18:30', signOff: '19:15' },
        { id: 'S2-353-28', type: 'STANDBY', date: '2026-05-28', signOn: '06:00', signOff: '16:00', description: 'A353 STANDBY DUTY 2' },
      ],
    };
    setActiveRoster(enrichRoster(sampleData));
    setActiveRosterId(null); // no Firestore backing — demo only
    setIsLoadingState(false);
    setErrorState(null);
  }, []);

  return (
    <RosterContext.Provider
      value={{
        rosters,
        activeRoster,
        activeRosterId,
        isLoading,
        isLoadingList,
        error,
        setRoster,
        selectRoster,
        deleteRoster,
        setLoading,
        setError,
        reset,
        loadSampleRoster,
      }}
    >
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error('useRoster must be used within RosterProvider');
  return ctx;
}
