import { ParsedRoster, ParsedDuty, ParsedFlight } from '../types';
import type { ParseLogger } from '../logger';

// ─────────────────────────────────────────────────────────────────────────────
// Malaysia Airlines — AIMS Roster Parser
//
// Fault-tolerance model:
//   • Every individual duty (flight / standby) is wrapped in its own try-catch.
//     A single malformed duty is skipped and logged; the rest of the roster
//     continues to parse.
//   • Every warning carries: date, character offset, and the raw chunk that
//     caused the issue — enough context to reproduce the failure from logs alone.
//   • The logger parameter is optional to preserve backwards compatibility with
//     direct unit-test calls.
// ─────────────────────────────────────────────────────────────────────────────

// AIMS column headers and abbreviations that are NOT airport IATA codes.
const AIMS_NON_PORT = new Set([
  'ACT', 'STD', 'STA', 'SGN', 'OBS', 'POS', 'REL', 'DEB', 'ETA', 'ETD',
  'ARR', 'DEP', 'CAB', 'CCR', 'CRT', 'OPT', 'DAY', 'OFF', 'MNT', 'TRN',
  'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT',
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]);

// ── Internal helpers ─────────────────────────────────────────────────────────

function extractPorts(flightChunk: string): [string, string] {
  // Primary: the two airports immediately after the flight number
  const direct = flightChunk.match(/MH\s*\d+\s+([A-Z]{3})\s+([A-Z]{3})/);
  if (direct) return [direct[1], direct[2]];

  // Fallback: any 3-letter token not in the exclusion list
  const filtered = (flightChunk.match(/\b[A-Z]{3}\b/g) ?? []).filter(
    (p) => !AIMS_NON_PORT.has(p),
  );
  return [filtered[0] ?? '', filtered[1] ?? ''];
}

const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

// ── Main parser ──────────────────────────────────────────────────────────────

export function parseMasAims(text: string, logger?: ParseLogger): ParsedRoster {
  const duties: ParsedDuty[] = [];
  let skippedDuties = 0;

  // ── Date blocks ───────────────────────────────────────────────────────────
  const dateRegex = /(\d{2})-([A-Z]{3})-(\d{4})/gi;
  const dateMatches = Array.from(text.matchAll(dateRegex));

  if (dateMatches.length === 0) {
    logger?.error('mas-aims:dates', 'No DD-MMM-YYYY date patterns found in text', {
      textLength: text.length,
      preview: text.slice(0, 200),
    });
    throw new Error(
      'No dates found in the roster. Please ensure this is a text-based AIMS roster PDF.',
    );
  }

  logger?.info('mas-aims:dates', `Found ${dateMatches.length} date block(s)`, {
    firstDate: dateMatches[0][0],
    lastDate: dateMatches[dateMatches.length - 1][0],
  });

  // ── Crew name ─────────────────────────────────────────────────────────────
  const crewNameMatch = text.match(/Name:\s*([A-Z][A-Z\s]+)/i);
  const crewName = crewNameMatch ? crewNameMatch[1].trim() : 'Crew Member';

  if (!crewNameMatch) {
    logger?.warn('mas-aims:crew', 'Could not find "Name:" field — defaulting to "Crew Member"', {
      textPreview: text.slice(0, 300),
    });
  } else {
    logger?.info('mas-aims:crew', `Crew name extracted: ${crewName}`);
  }

  // ── Per-date-block parsing ────────────────────────────────────────────────
  for (let i = 0; i < dateMatches.length; i++) {
    const match = dateMatches[i];
    const day       = match[1];
    const monthStr  = match[2].toUpperCase();
    const year      = match[3];
    const dateISO   = `${year}-${MONTH_MAP[monthStr] ?? '01'}-${day}`;
    const charOffset = match.index!;

    const chunkStart = charOffset + match[0].length;
    const chunkEnd   = dateMatches[i + 1] ? dateMatches[i + 1].index! : text.length;
    const chunk      = text.substring(chunkStart, chunkEnd);

    // All times in the chunk — standby fallback
    const chunkTimes = chunk.match(/\d{2}:\d{2}/g) ?? [];

    // ── Flights ──────────────────────────────────────────────────────────────
    const flightRegex = /MH\s*(\d+)/gi;
    const flightMatches = Array.from(chunk.matchAll(flightRegex));

    flightMatches.forEach((fMatch, fIdx) => {
      try {
        const flightNo   = fMatch[1];
        const flightChunk = chunk.substring(fMatch.index!);
        const times      = flightChunk.match(/\d{2}:\d{2}/g) ?? [];
        const [depPort, arrPort] = extractPorts(flightChunk);

        const flight: ParsedFlight = {
          flightNumber: `MH${flightNo}`,
          depPort,
          arrPort,
          std: times[0] ?? '00:00',
          sta: times[1] ?? '00:00',
        };

        // Sign-on / sign-off assignment based on how many times are present
        if (fIdx === 0 && times.length >= 4) {
          flight.signOn  = times[0] ?? '00:00';
          flight.std     = times[1] ?? '00:00';
          flight.sta     = times[2] ?? '00:00';
          flight.signOff = times[3] ?? '00:00';
        } else if (times.length >= 3) {
          flight.std     = times[0] ?? '00:00';
          flight.sta     = times[1] ?? '00:00';
          flight.signOff = times[2] ?? '00:00';
        }

        // ── Telemetry for incomplete data ──────────────────────────────────
        if (!depPort || !arrPort) {
          logger?.warn('mas-aims:flight', `Missing port code(s) on MH${flightNo}`, {
            date: dateISO,
            charOffset: charOffset + fMatch.index!,
            depPort: depPort || null,
            arrPort: arrPort || null,
            rawChunk: flightChunk.slice(0, 120),
          });
        }

        if (times.length < 2) {
          logger?.warn('mas-aims:flight', `Insufficient time fields on MH${flightNo}`, {
            date: dateISO,
            charOffset: charOffset + fMatch.index!,
            timesFound: times.length,
            rawChunk: flightChunk.slice(0, 120),
          });
        }

        duties.push({
          id: `MH${flightNo}-${dateISO}-${fIdx}`,
          type: 'FLIGHT',
          date: dateISO,
          flight,
        });

      } catch (err: unknown) {
        skippedDuties++;
        logger?.error('mas-aims:flight', `Unexpected error parsing flight in date block ${dateISO}`, {
          date: dateISO,
          charOffset,
          flightIndex: fIdx,
          error: err instanceof Error ? err.message : String(err),
          rawChunk: chunk.slice(0, 200),
        });
        // Continue to next flight — do not rethrow
      }
    });

    // ── Standbys ──────────────────────────────────────────────────────────────
    const standbyRegex = /(S\d+-\d+)/gi;
    const standbyMatches = Array.from(chunk.matchAll(standbyRegex));

    standbyMatches.forEach((sMatch) => {
      try {
        const code   = sMatch[1];
        const sChunk = chunk.substring(sMatch.index!);
        const sTimes = sChunk.match(/\d{2}:\d{2}/g)?.length
          ? sChunk.match(/\d{2}:\d{2}/g)!
          : chunkTimes;

        if (sTimes.length === 0) {
          logger?.warn('mas-aims:standby', `No times found for standby ${code}`, {
            date: dateISO,
            charOffset: charOffset + sMatch.index!,
            rawChunk: sChunk.slice(0, 120),
          });
        }

        duties.push({
          id: `${code}-${dateISO}`,
          type: 'STANDBY',
          date: dateISO,
          signOn:  sTimes[0] ?? undefined,
          signOff: sTimes[sTimes.length - 1] ?? undefined,
          description: `Standby ${code.toUpperCase()}`,
        });

      } catch (err: unknown) {
        skippedDuties++;
        logger?.error('mas-aims:standby', `Unexpected error parsing standby in date block ${dateISO}`, {
          date: dateISO,
          charOffset,
          error: err instanceof Error ? err.message : String(err),
        });
        // Continue — do not rethrow
      }
    });
  }

  if (skippedDuties > 0) {
    logger?.warn('mas-aims', `${skippedDuties} duty/duties skipped due to parse errors`, {
      skippedDuties,
      totalExtracted: duties.length,
    });
  }

  logger?.info('mas-aims', `Parse complete`, {
    dutiesExtracted: duties.length,
    flights: duties.filter((d) => d.type === 'FLIGHT').length,
    standbys: duties.filter((d) => d.type === 'STANDBY').length,
    skippedDuties,
  });

  return {
    crewName,
    month: dateMatches[0][2].toUpperCase(),
    year: dateMatches[0][3],
    airline: 'Malaysia Airlines',
    duties,
  };
}
