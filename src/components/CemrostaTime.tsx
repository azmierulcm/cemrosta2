'use client';

import React from 'react';
import { DateTime } from 'luxon';
import { DutyEvent } from '@/types';

interface TimeProps {
  isoUtc?: string;
  format?: string;
  className?: string;
}

/**
 * Cemrosta Standard Time Component
 * Strictly handles timezone conversions using Luxon.
 * Defaults to Local Time for UI display.
 */
const CemrostaTime = ({ isoUtc, format = 'HH:mm', className }: TimeProps) => {
  if (!isoUtc) return <span className={className}>--:--</span>;

  try {
    // 1. Parse UTC strictly
    const utcTime = DateTime.fromISO(isoUtc, { zone: 'utc' });
    
    // 2. Convert to User's Local Time (or specific airport TZ)
    const localTime = utcTime.toLocal();

    return (
      <span className={className}>
        {localTime.toFormat(format)}
      </span>
    );
  } catch (err) {
    console.error('Timezone conversion error:', err);
    return <span className={className}>Error</span>;
  }
};

export default CemrostaTime;
