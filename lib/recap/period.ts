import type { PeriodConfig, RecapPeriod } from './types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parse a period key into a PeriodConfig.
 *
 * period = 'month', key = '2025-01'  → January 2025
 * period = '6m',    key = '2025-H1'  → Jan–Jun 2025
 * period = '6m',    key = '2025-H2'  → Jul–Dec 2025
 * period = '1y',    key = '2025'     → 2025
 */
export function parsePeriodKey(period: RecapPeriod, key: string): PeriodConfig {
  if (period === 'month') {
    const [year, month] = key.split('-');
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    return {
      type: 'month',
      label: `${MONTH_NAMES[m - 1]} ${year}`,
      startDate,
      endDate,
      months: [month.padStart(2, '0')],
      year,
    };
  }

  if (period === '6m') {
    const [year, half] = key.split('-');
    const y = parseInt(year, 10);
    const isH1 = half === 'H1';
    const startMonth = isH1 ? 1 : 7;
    const endMonth = isH1 ? 6 : 12;
    const startDate = new Date(Date.UTC(y, startMonth - 1, 1));
    const endDate = new Date(Date.UTC(y, endMonth, 0, 23, 59, 59));
    const months = Array.from({ length: 6 }, (_, i) =>
      String(startMonth + i).padStart(2, '0'),
    );
    return {
      type: '6m',
      label: `${SHORT_MONTH[startMonth - 1]}–${SHORT_MONTH[endMonth - 1]} ${year}`,
      startDate,
      endDate,
      months,
      year,
    };
  }

  // '1y'
  const year = key;
  const y = parseInt(year, 10);
  const startDate = new Date(Date.UTC(y, 0, 1));
  const endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  return {
    type: '1y',
    label: year,
    startDate,
    endDate,
    months,
    year,
  };
}

/**
 * Build the current period key for a given period type (defaults to "most recently completed").
 */
export function currentPeriodKey(period: RecapPeriod): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-based

  if (period === 'month') {
    // Previous completed month
    const prev = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return `${prevYear}-${String(prev).padStart(2, '0')}`;
  }
  if (period === '6m') {
    // Previous completed half-year
    if (month <= 6) return `${year - 1}-H2`;
    return `${year}-H1`;
  }
  // '1y' — previous completed year
  return String(year - 1);
}

/**
 * List all available period keys for a given period type, going back N units.
 * Used to populate the period picker.
 */
export function recentPeriodKeys(period: RecapPeriod, count = 6): string[] {
  const keys: string[] = [];
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;

  if (period === 'month') {
    // Start from the current month (inclusive) so the active roster month is always available.
    for (let i = 0; i < count; i++) {
      keys.push(`${year}-${String(month).padStart(2, '0')}`);
      month--;
      if (month === 0) { month = 12; year--; }
    }
    return keys;
  }

  if (period === '6m') {
    // Start from the current half-year (inclusive).
    let half = month <= 6 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      keys.push(`${year}-H${half}`);
      half--;
      if (half === 0) { half = 2; year--; }
    }
    return keys;
  }

  // '1y' — include the current year so in-progress yearly stats are visible.
  for (let i = 0; i < count; i++) {
    keys.push(String(year - i));
  }
  return keys;
}
