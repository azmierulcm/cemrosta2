import * as ics from 'ics';
import { RosterData, DutyEvent } from '@/lib/types';

/** Parse "HH:MM" or "--:--" safely. Returns { h, m } defaulting to 0. */
function parseTime(timeStr?: string): { h: number; m: number } {
  if (!timeStr) return { h: 0, m: 0 };
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  return {
    h: isNaN(parts[0]) ? 0 : parts[0],
    m: isNaN(parts[1]) ? 0 : parts[1],
  };
}

/** Advance date by one day if duty crosses midnight. */
function nextDay(year: number, month: number, day: number) {
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function buildEventTitle(event: DutyEvent): string {
  switch (event.type) {
    case 'FLIGHT':
      return [
        event.flightNumber,
        event.depPort && event.arrPort ? `(${event.depPort}–${event.arrPort})` : null,
      ]
        .filter(Boolean)
        .join(' ') || 'Flight';
    case 'LAYOVER':
      return event.hotel ? `Layover — ${event.hotel}` : `Layover${event.arrPort ? ` (${event.arrPort})` : ''}`;
    case 'STANDBY':
      return `Standby${event.description ? ` — ${event.description}` : ''}`;
    case 'OFF':
      return 'Day Off';
    default:
      return event.description || 'Duty';
  }
}

function buildDescription(event: DutyEvent): string {
  const lines: string[] = [];
  if (event.flightNumber) lines.push(`Flight: ${event.flightNumber}`);
  if (event.depPort && event.arrPort) lines.push(`Route: ${event.depPort} → ${event.arrPort}`);
  if (event.std) lines.push(`Departure: ${event.std}`);
  if (event.sta) lines.push(`Arrival: ${event.sta}`);
  if (event.signOn) lines.push(`Sign-on: ${event.signOn}`);
  if (event.signOff) lines.push(`Sign-off: ${event.signOff}`);
  if (event.hotel) lines.push(`Hotel: ${event.hotel}`);
  if (event.description && event.type !== 'FLIGHT') lines.push(event.description);
  return lines.join('\n') || event.type;
}

export function generateICS(roster: RosterData): string | null {
  // Skip OFF days — they clutter the calendar and have no actionable info
  const relevantEvents = roster.events.filter((e) => e.type !== 'OFF');

  if (relevantEvents.length === 0) return null;

  const icsEvents: ics.EventAttributes[] = relevantEvents.map((event) => {
    const dateParts = event.date.split('-').map(Number);
    const year = dateParts[0] ?? new Date().getFullYear();
    const month = dateParts[1] ?? 1;
    const day = dateParts[2] ?? 1;

    const startTimeStr = event.signOn || event.std;
    const endTimeStr = event.signOff || event.sta;

    // All-day event if no time info available
    if (!startTimeStr && !endTimeStr) {
      return {
        start: [year, month, day] as ics.DateArray,
        end: [year, month, day] as ics.DateArray,
        title: buildEventTitle(event),
        description: buildDescription(event),
        status: 'CONFIRMED' as const,
        busyStatus: event.type === 'OFF' ? ('FREE' as const) : ('BUSY' as const),
        categories: [event.type],
      };
    }

    const { h: startH, m: startM } = parseTime(startTimeStr);
    const { h: endH, m: endM } = parseTime(endTimeStr);

    // Handle midnight crossover
    let endYear = year, endMonth = month, endDay = day;
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    if (endMins > 0 && endMins < startMins) {
      ({ year: endYear, month: endMonth, day: endDay } = nextDay(year, month, day));
    }

    return {
      start: [year, month, day, startH, startM] as ics.DateArray,
      end: [endYear, endMonth, endDay, endH, endM] as ics.DateArray,
      title: buildEventTitle(event),
      description: buildDescription(event),
      location: event.arrPort || (event.hotel ?? undefined),
      status: 'CONFIRMED' as const,
      busyStatus: 'BUSY' as const,
      categories: [event.type],
    };
  });

  console.log('[generateICS] events to create:', JSON.stringify(icsEvents, null, 2));

  const { error, value } = ics.createEvents(icsEvents);

  if (error) {
    console.error('[generateICS] ICS validation error message:', (error as Error).message ?? JSON.stringify(error));
    console.error('[generateICS] ICS error full:', error);
    // Still try to use the value if it was produced despite validation warnings
    if (!value) return null;
  }

  console.log('[generateICS] success, value length:', value?.length);
  return value || null;
}

export function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
