import { calculateKilometers } from '../utils/geo/haversine';
import { formatKilometers } from '../utils/format';
import type { DutyEvent } from '../types';
import type { RecapPeriod, Superlative } from './types';

interface ScoredSuperlative extends Superlative {
  score: number;
}

/**
 * Derive the single most impressive superlative from a set of duty events.
 * Period-type awareness lets us pick richer stats for longer windows.
 */
export function getTopSuperlative(
  events: DutyEvent[],
  homeBase = 'KUL',
  period: RecapPeriod = 'month',
): Superlative {
  const flights = events.filter(
    (e) => e.type === 'FLIGHT' && e.depPort && e.arrPort,
  );

  if (flights.length === 0) return fallback();

  const candidates: ScoredSuperlative[] = [];

  // ── 1. Marathon — Longest single sector by distance ──────────────────────
  const sorted = [...flights].sort((a, b) => {
    const da = calculateKilometers(a.depPort!, a.arrPort!);
    const db = calculateKilometers(b.depPort!, b.arrPort!);
    return db - da;
  });
  const longest = sorted[0];
  const longestKm = calculateKilometers(longest.depPort!, longest.arrPort!);
  if (longestKm > 0) {
    candidates.push({
      key: 'marathon',
      label: 'Longest Sector',
      value: `${longest.depPort} → ${longest.arrPort}`,
      subValue: `${formatKilometers(longestKm)} km · ${longest.flightNumber ?? 'MH'}`,
      score: longestKm >= 10_000 ? 100 : longestKm >= 6_000 ? 75 : 40,
    });
  }

  // ── 2. Globe Trotter — Total km across the period (6m / 1y focus) ────────
  if (period !== 'month') {
    const totalKm = flights.reduce(
      (s, f) => s + calculateKilometers(f.depPort!, f.arrPort!),
      0,
    );
    const earthCircumference = 40_075;
    const laps = totalKm / earthCircumference;
    if (totalKm > 0) {
      candidates.push({
        key: 'globe',
        label: period === '1y' ? 'Year in the Air' : 'Half-Year Distance',
        value: `${formatKilometers(totalKm)} km`,
        subValue:
          laps >= 1
            ? `${laps.toFixed(1)}× around the Earth`
            : `${Math.round((laps * 100))}% of Earth's circumference`,
        score: laps >= 3 ? 95 : laps >= 1 ? 70 : 45,
      });
    }
  }

  // ── 3. Endurance — Most sectors in a single day ───────────────────────────
  const sectorsByDay = flights.reduce<Record<string, number>>((acc, f) => {
    acc[f.date] = (acc[f.date] ?? 0) + 1;
    return acc;
  }, {});
  const busiestDay = Object.entries(sectorsByDay).sort((a, b) => b[1] - a[1])[0];
  if (busiestDay && busiestDay[1] >= 3) {
    candidates.push({
      key: 'endurance',
      label: 'Busiest Day',
      value: `${busiestDay[1]} sectors`,
      subValue: formatDate(busiestDay[0]),
      score: busiestDay[1] >= 6 ? 85 : busiestDay[1] >= 4 ? 60 : 35,
    });
  }

  // ── 4. Commuter — Most frequent route ────────────────────────────────────
  const routeCounts = flights.reduce<Record<string, number>>((acc, f) => {
    const route = `${f.depPort}-${f.arrPort}`;
    acc[route] = (acc[route] ?? 0) + 1;
    return acc;
  }, {});
  const topRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];
  if (topRoute && topRoute[1] >= 4) {
    const [dep, arr] = topRoute[0].split('-');
    candidates.push({
      key: 'commuter',
      label: 'Favourite Route',
      value: `${dep} ↔ ${arr}`,
      subValue: `${topRoute[1]} times this period`,
      score: topRoute[1] >= 10 ? 80 : topRoute[1] >= 6 ? 55 : 30,
    });
  }

  // ── 5. Frontier — Farthest destination from home ────────────────────────
  const homeFlights = flights.filter(
    (f) => f.depPort?.toUpperCase() === homeBase.toUpperCase(),
  );
  if (homeFlights.length > 0) {
    const farthest = homeFlights.sort((a, b) => {
      return (
        calculateKilometers(b.depPort!, b.arrPort!) -
        calculateKilometers(a.depPort!, a.arrPort!)
      );
    })[0];
    const dist = calculateKilometers(farthest.depPort!, farthest.arrPort!);
    if (dist > 0) {
      candidates.push({
        key: 'frontier',
        label: 'Farthest From Home',
        value: farthest.arrPort!,
        subValue: `${formatKilometers(dist)} km from ${homeBase}`,
        score: dist >= 10_000 ? 90 : dist >= 5_000 ? 65 : 30,
      });
    }
  }

  if (candidates.length === 0) return fallback();

  // Return the highest-scoring superlative
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { score: _score, ...best } = candidates.sort((a, b) => b.score - a.score)[0];
  return best;
}

function fallback(): Superlative {
  return {
    key: 'workhorse',
    label: 'On Duty',
    value: 'Ready for Takeoff',
    subValue: 'Keep flying — your stats are building.',
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
