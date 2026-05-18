import { ParsedRoster, UnsupportedAirlineError } from './types';
import { parseMasAims } from './airlines/mas-aims';
import type { ParseLogger } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Airline Router
//
// Inspects the extracted text, selects the appropriate airline-specific parser,
// and delegates. All parser calls are wrapped in fault-tolerant try-catch so
// that an unexpected crash inside a parser is attributed to the correct module
// and logged before re-throwing to the orchestrator.
// ─────────────────────────────────────────────────────────────────────────────

/** Detect MAS AIMS: airline name, MH flight numbers, or DD-MMM-YYYY dates */
function detectMasAims(upper: string): boolean {
  return (
    upper.includes('MALAYSIA AIRLINES') ||
    upper.includes('MALAYSIAN AIRLINES') ||
    upper.includes('AIMS') ||
    /\bMH\s*\d{1,4}\b/.test(upper) ||
    /\d{2}-[A-Z]{3}-\d{4}/.test(upper)
  );
}

export function parseRosterText(text: string, logger?: ParseLogger): ParsedRoster {
  const upper = text.toUpperCase();

  if (detectMasAims(upper)) {
    logger?.info('router', 'Detected airline: Malaysia Airlines AIMS', {
      signals: {
        hasAirlineName:  upper.includes('MALAYSIA AIRLINES') || upper.includes('MALAYSIAN AIRLINES'),
        hasAIMS:         upper.includes('AIMS'),
        hasMHFlights:    /\bMH\s*\d{1,4}\b/.test(upper),
        hasDatePattern:  /\d{2}-[A-Z]{3}-\d{4}/.test(upper),
      },
    });

    try {
      return parseMasAims(text, logger);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger?.error('router:mas-aims', 'MAS AIMS parser threw an unhandled exception', {
        error: message,
        textLength: text.length,
      });
      throw err; // Re-throw — let the orchestrator decide how to surface it
    }
  }

  // ── No airline matched ────────────────────────────────────────────────────
  logger?.warn('router', 'No supported airline detected', {
    textLength: text.length,
    preview: text.slice(0, 300),
  });

  throw new UnsupportedAirlineError(
    'This roster format is not yet supported. Currently only MAS AIMS rosters are accepted.',
  );
}

export * from './types';
