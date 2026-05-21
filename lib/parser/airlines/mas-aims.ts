import { ParsedRoster, ParsedDuty, ParsedMonthlyStats } from '../types';
import type { ParseLogger } from '../logger';

// ─────────────────────────────────────────────────────────────────────────────
// Malaysia Airlines — AIMS Roster Parser  (v3)
//
// Rewritten from scratch based on a real iFlight Crew Portal PDF.
//
// AIMS table columns (as printed):
//   Date | Day | Duty Start | Item | Overd Rank | Dep/Start | Arr/End |
//   Duty End | Work Type | Actual Block Hrs | Duty Hrs | DutyCode | Ac Type
//
// Key behaviours observed in real PDFs
// ─────────────────────────────────────────────────────────────────────────────
//  • Long-haul flights (e.g. MH1 LHR→KUL) span two calendar rows:
//      Row 1 (departure date): has Duty Start, Item, DepPort, DepTime, WorkType,
//                              Block Hrs, Duty Hrs, DutyCode, AcType.
//                              No ArrPort/ArrTime in this row.
//      Row 2 (arrival date):   has ONLY ArrPort, ArrTime, DutyEnd. No Item.
//    → detected as "continuation" rows and merged into the preceding flight.
//
//  • Short-haul turnarounds (e.g. MH376+MH377 on same day) appear as two
//    consecutive flight lines within the same date block.
//
//  • Standby rows (S4-353, S2-353): the last two HH:MM values in the chunk
//    are Block Hrs (always 00:00) and Duty Hrs, NOT clock times for sign-off.
//
//  • Off codes in this roster: D (Day Off), DO (Earned Day Off), MC1/MC2/MC3
//    (Medical Leave). These do NOT appear in the old OFF_REGEX.
//
//  • Monthly stats: PDF prints "Actual Block\nHours 61:07" so regex must
//    match "Block Hours", not just "BLK HRS".
//
//  • All times in the PDF are LOCAL to each port (KUL times = MYT UTC+8,
//    LHR times = BST UTC+1, etc.). Stored as-is from the PDF.
// ─────────────────────────────────────────────────────────────────────────────

// ── 3-letter token exclusion list (not IATA port codes) ──────────────────────
const NON_PORT = new Set([
  'ACT','STD','STA','SGN','SFI','OBS','POS','REL','DEB','ETA','ETD',
  'ARR','DEP','CAB','CCR','CRT','OPT','DAY','OFF','MNT','TRN','MAS',
  'IBS','AOP','OPC','TRG','CBT','GND','CRM','LPC','SIM',
  'SUN','MON','TUE','WED','THU','FRI','SAT',
  'JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC',
  'ASB','SBY',
]);

// ── Off / leave day codes (from AIMS code legend) ────────────────────────────
const OFF_CODES: Record<string, string> = {
  D:    'Day Off',
  DO:   'Earned Day Off',
  DO1:  'Request Day Off',
  DO2:  'Request Day Off',
  DO3:  'Request Day Off',
  OFF:  'Day Off',
  REST: 'Day Off',
  AL:   'Annual Leave',
  SL:   'Sick Leave',
  ML:   'Maternity Leave',
  HL:   'Home Leave',
  PH:   'Public Holiday',
  EL:   'Emergency Leave',
  CMP:  'Compensatory Off',
  COMP: 'Compensatory Off',
  MC1:  'Medical Leave (1–2 days)',
  MC2:  'Medical Leave (1–2 days)',
  MC3:  'Medical Leave (3+ days)',
  MC4:  'Medical Leave (extended)',
};

// ── Training / simulator codes ────────────────────────────────────────────────
const TRAINING_CODES: Record<string, string> = {
  'SIM/TRN': 'Simulator Training',
  SIM:       'Simulator',
  TRN:       'Training',
  GND:       'Ground Training',
  LPC:       'Line Proficiency Check',
  OPC:       'Operator Proficiency Check',
  CRM:       'Crew Resource Management',
  TRAINING:  'Training',
  TRAINER:   'Trainer Duty',
  CBT:       'Computer-Based Training',
  RECURRENT: 'Recurrent Training',
  TRG:       'Training',
  TDC:       'Trainers Development Course',
  TDC1:      'Trainers Development Course',
  TDC2:      'Trainers Development Course — Refresher',
  TDC3:      'Trainers Development Course',
};

// Resolve friendly names for AIMS alphanumeric simulator session codes
// e.g. "330AOP31" → "A330 Simulator — OPC Session 31"
const SIM_SESSION_MAP: Record<string, string> = {
  AOP: 'OPC', BLP: 'LPC', OPC: 'OPC', LPC: 'LPC',
  SIM: 'SIM', ETP: 'ETP', UPR: 'Upgrade', REC: 'Recurrent',
  CFF: 'FFS',   // Full Flight Simulator (CAE)
  CED: 'EDTO',  // Extended Diversion Time Operations
};
function resolveSimCode(code: string): string {
  if (TRAINING_CODES[code]) return TRAINING_CODES[code];
  // Allow optional trailing letter suffix (e.g. 330CFF1C, 330CED1E, 330AOP23, 350AOP1Z)
  const m = code.match(/^(\d{3})([A-Z]{2,4})(\d+)([A-Z]*)$/);
  if (m) {
    const sessType = SIM_SESSION_MAP[m[2]] ?? m[2];
    // In AIMS, a 'Z' suffix denotes the CBT (Computer-Based Training) ground phase
    // that precedes the actual simulator sessions (e.g. 350AOP1Z = OPC DAY-1 CBT).
    // Numeric-only session IDs (e.g. 350AOP22, 350AOP35) are true simulator sessions.
    if (m[4] === 'Z') {
      return `Ground Training (CBT) — ${sessType} Day ${m[3]}`;
    }
    const suffix = m[4] ? ` — Part ${m[4]}` : '';
    return `A${m[1]} Simulator — ${sessType} Session ${m[3]}${suffix}`;
  }
  // CRM/SMS class codes: letter + digits + 2+letters + digits (e.g. C17SMSC1)
  // These are ground training classes, not simulator sessions.
  if (/^[A-Z]\d+[A-Z]{2,}\d+[A-Z]*$/.test(code)) {
    return `Ground Training — ${code}`;
  }
  // Generic fallback for any other unrecognised training code
  return `Training — ${code}`;
}

const MONTH_MAP: Record<string, string> = {
  JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
  JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12',
};

const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'] as const;
function getDayOfWeek(iso: string): string {
  return DOW[new Date(`${iso}T12:00:00Z`).getUTCDay()];
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly stats extraction
// ─────────────────────────────────────────────────────────────────────────────
function extractMonthlyStats(text: string, logger?: ParseLogger): ParsedMonthlyStats {
  const stats: ParsedMonthlyStats = {};

  // "Actual Block\nHours 61:07"  → pdf.js merges to "Actual Block Hours 61:07"
  // Also handles "ACT BLK HRS 74:25", "TOTAL BLOCK HRS", etc.
  const blkPatterns = [
    /ACT(?:UAL)?\s+BLK(?:OCK)?\s+(?:HRS?|HOURS?)\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /(?:ACTUAL\s+)?BLOCK\s+(?:HRS?|HOURS?)\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /TOTAL\s+BLOCK(?:\s+(?:HRS?|HOURS?))?\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /BLK\s+(?:HRS?|HOURS?)\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
  ];
  for (const pat of blkPatterns) {
    const m = text.match(pat);
    if (m) { stats.actualBlockHours = m[1]; break; }
  }

  // "Duty Hours 148:08" or "DUTY HRS 89:10"
  const dhrPatterns = [
    /DUTY\s+(?:HRS?|HOURS?)\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /TOTAL\s+DUTY(?:\s+(?:HRS?|HOURS?))?\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
    /DHR\s*[:\-]?\s*(\d{1,4}:\d{2})/i,
  ];
  for (const pat of dhrPatterns) {
    const m = text.match(pat);
    if (m) { stats.dutyHours = m[1]; break; }
  }

  // "OFF Days At Base 14"
  const offAtBasePatterns = [
    /OFF\s+DAYS?\s+AT\s+BASE\s+[:\-]?\s*(\d{1,2})/i,
    /(?:NO\s+OF\s+)?OFF\s+DAYS?\s*[:\-]?\s*(\d{1,2})/i,
    /DAYS?\s+OFF\s*[:\-]?\s*(\d{1,2})/i,
  ];
  for (const pat of offAtBasePatterns) {
    const m = text.match(pat);
    if (m) { stats.offDaysAtBase = parseInt(m[1], 10); break; }
  }

  // "OFF Days Away From Base" (may be blank in the roster)
  const awayM = text.match(/OFF\s+DAYS?\s+AWAY\s+(?:FROM\s+)?BASE\s*[:\-]?\s*(\d{1,2})/i);
  if (awayM) stats.offDaysAwayFromBase = parseInt(awayM[1], 10);

  logger?.info('mas-aims:monthly-stats', 'Monthly stats extracted', {
    actualBlockHours:    stats.actualBlockHours ?? null,
    dutyHours:           stats.dutyHours ?? null,
    offDaysAtBase:       stats.offDaysAtBase ?? null,
    offDaysAwayFromBase: stats.offDaysAwayFromBase ?? null,
  });
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Crew info extraction
// ─────────────────────────────────────────────────────────────────────────────
function extractCrewInfo(text: string): { name: string } {
  // AIMS format: "Name :MUHAMMAD AZMIERUL\nBIN CHE MAT"
  const m = text.match(/Name\s*[:\-]\s*([A-Z][A-Z\s]+?)(?=\s*(?:Staff\s*Number|Rank|Base|Direct|\d{6,}))/i);
  const name = m ? m[1].replace(/\s+/g, ' ').trim() : 'Crew Member';
  return { name };
}

// ─────────────────────────────────────────────────────────────────────────────
// Roster period inference  (mode of all DD-MMM-YYYY matches)
// ─────────────────────────────────────────────────────────────────────────────
function inferRosterPeriod(matches: RegExpMatchArray[]): { month: string; year: string } {
  const counts = new Map<string, number>();
  for (const m of matches) {
    const key = `${m[2].toUpperCase()}-${m[3]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = `${matches[0][2].toUpperCase()}-${matches[0][3]}`;
  let bestN = 0;
  for (const [k, n] of counts) { if (n > bestN) { bestN = n; best = k; } }
  const [month, year] = best.split('-') as [string, string];
  return { month, year };
}

// ─────────────────────────────────────────────────────────────────────────────
// Flight-row tokenizer
//
// Scans the text AFTER "MH \d+" and classifies each word:
//   port     — 3-letter IATA (not in NON_PORT), only BEFORE the OP token
//   time     — HH:MM  (clock or duration)
//   op       — the literal "OP" work-type marker
//   dutycode — 2-letter code after OP (e.g. "BA", "BB")
//   actype   — 3-digit aircraft type (e.g. "359")
// ─────────────────────────────────────────────────────────────────────────────
type FlightToken =
  | { t: 'port';     v: string }
  | { t: 'time';     v: string }
  | { t: 'op';       v: string }   // work type: 'OP' | 'SFP' | …
  | { t: 'dutycode'; v: string }
  | { t: 'actype';   v: string };

// Work type codes that sit between the route and the block/duty hours columns.
// Treating these like 'OP' ensures subsequent numeric fields are correctly parsed.
const WORK_TYPE_CODES = new Set(['OP', 'SFP', 'PS']);

function tokenizeFlightChunk(raw: string): FlightToken[] {
  const tokens: FlightToken[] = [];
  let seenOP = false;
  // Match: HH:MM | 3-letter words | 2-letter words | 3-digit numbers
  const RE = /\b([A-Z]{2,4}|\d{2}:\d{2}|\d{3})\b/g;
  for (const m of raw.matchAll(RE)) {
    const w = m[1];
    if (/^\d{2}:\d{2}$/.test(w)) {
      tokens.push({ t: 'time', v: w });
    } else if (WORK_TYPE_CODES.has(w)) {
      // 'OP', 'SFP' etc. — marks the boundary before block/duty hours columns
      tokens.push({ t: 'op', v: w });
      seenOP = true;
    } else if (!seenOP && /^[A-Z]{3}$/.test(w) && !NON_PORT.has(w)) {
      tokens.push({ t: 'port', v: w });
    } else if (seenOP && /^[A-Z]{2,3}$/.test(w) && !WORK_TYPE_CODES.has(w) && !['MC','FO','CA','DC','SG'].includes(w)) {
      // Accept 2- or 3-letter duty codes (e.g. 'BA', 'TRI')
      tokens.push({ t: 'dutycode', v: w });
    } else if (/^\d{3}$/.test(w)) {
      tokens.push({ t: 'actype', v: w });
    }
  }
  return tokens;
}

// Parse the token stream into structured flight fields.
// Expected order: depPort, depTime, [arrPort, arrTime], [dutyEnd], [OP],
//                 [blockHrs], [dutyHrs], [dutyCode], [acType]
interface FlightFields {
  depPort:   string;
  depTime:   string;
  arrPort?:  string;
  arrTime?:  string;
  dutyEnd?:  string;
  workType?: string;
  blockHrs?: string;
  dutyHrs?:  string;
  dutyCode?: string;
  acType?:   string;
}

function parseFlightTokens(tokens: FlightToken[]): FlightFields {
  let i = 0;
  const peek = (kind: FlightToken['t']) => i < tokens.length && tokens[i].t === kind;
  const take = <T extends FlightToken['t']>(kind: T) =>
    (peek(kind) ? (tokens[i++] as Extract<FlightToken, { t: T }>) : null);

  const depPort = take('port')?.v ?? '';
  const depTime = take('time')?.v ?? '00:00';

  let arrPort: string | undefined;
  let arrTime: string | undefined;
  if (peek('port')) {
    arrPort = take('port')!.v;
    if (peek('time')) arrTime = take('time')!.v;
  }

  // A time that appears before the 'op' token is the duty end
  let dutyEnd: string | undefined;
  if (peek('time')) dutyEnd = take('time')!.v;

  let workType: string | undefined;
  if (peek('op')) { workType = take('op')!.v; }

  const blockHrs = take('time')?.v;
  const dutyHrs  = take('time')?.v;
  const dutyCode = take('dutycode')?.v;
  const acType   = take('actype')?.v;

  return { depPort, depTime, arrPort, arrTime, dutyEnd, workType, blockHrs, dutyHrs, dutyCode, acType };
}

// ─────────────────────────────────────────────────────────────────────────────
// Classify and parse one date block
// ─────────────────────────────────────────────────────────────────────────────
function parseDayChunk(
  chunk: string,
  dateISO: string,
  day: string,
  logger?: ParseLogger,
): ParsedDuty[] {
  const duties: ParsedDuty[] = [];

  // ── 1. Flight(s) ─────────────────────────────────────────────────────────
  const mhRe      = /MH\s*(\d{1,4})/gi;
  const mhMatches = [...chunk.matchAll(mhRe)];

  if (mhMatches.length > 0) {
    // Duty start = last HH:MM BEFORE the first MH in the chunk
    const beforeFirst   = chunk.substring(0, mhMatches[0].index!);
    const dutyStartTimes = beforeFirst.match(/(\d{2}:\d{2})/g);
    const dutyStart     = dutyStartTimes?.at(-1);

    mhMatches.forEach((mhM, idx) => {
      try {
        const flightNo    = `MH${mhM[1]}`;
        const nextMHStart = mhMatches[idx + 1]?.index ?? chunk.length;
        const flightChunk = chunk.substring(mhM.index! + mhM[0].length, nextMHStart);

        const tokens = tokenizeFlightChunk(flightChunk);
        const f      = parseFlightTokens(tokens);
        const isFirst = idx === 0;

        if (!f.depPort) {
          logger?.warn('mas-aims:flight', `Missing dep port for ${flightNo} at ${dateISO}`, {
            rawChunk: flightChunk.slice(0, 120),
          });
        }

        duties.push({
          id:       `${flightNo}-${dateISO}-${idx}`,
          type:     'FLIGHT',
          date:     dateISO,
          day,
          item:     flightNo,
          signOn:   isFirst ? dutyStart : undefined,
          signOff:  f.dutyEnd,
          blockHrs: f.blockHrs,
          dutyHrs:  f.dutyHrs,
          dutyCode: f.dutyCode,
          acType:   f.acType,
          flight: {
            flightNumber: flightNo,
            depPort: f.depPort,
            arrPort: f.arrPort ?? '',  // filled later by linkContinuationArrivals if empty
            std:     f.depTime,
            sta:     f.arrTime ?? '',
            signOn:  isFirst ? dutyStart : undefined,
            signOff: f.dutyEnd,
          },
        });
      } catch (err) {
        logger?.error('mas-aims:flight', `Failed to parse flight at ${dateISO}`, {
          error: String(err), chunk: chunk.slice(0, 200),
        });
      }
    });
    return duties;
  }

  // ── 1b. Non-MH positioning / deadhead flight ─────────────────────────────
  // Catches rows like "14:20 BA 422 LHR 15:20 AGP 19:05 19:35 PS 04:15 BA"
  // The lookahead requires the flight number to be immediately followed by
  // an IATA port code + time — this cleanly distinguishes "BA 422 LHR 15:20"
  // (flight item column) from a bare "BA" duty-code suffix at the row end.
  {
    const posFlightRe = /\b([A-Z]{2})\s+(\d{1,4})\b(?=\s+[A-Z]{3}\s+\d{2}:\d{2})/g;
    const posMatches  = [...chunk.matchAll(posFlightRe)].filter((m) => m[1] !== 'MH');

    if (posMatches.length > 0) {
      const beforeFirst    = chunk.substring(0, posMatches[0].index!);
      const dutyStartTimes = beforeFirst.match(/(\d{2}:\d{2})/g);
      const dutyStart      = dutyStartTimes?.at(-1);

      posMatches.forEach((posM, idx) => {
        try {
          const flightNo    = `${posM[1]}${posM[2]}`;
          const nextStart   = posMatches[idx + 1]?.index ?? chunk.length;
          const flightChunk = chunk.substring(posM.index! + posM[0].length, nextStart);

          const tokens  = tokenizeFlightChunk(flightChunk);
          const f       = parseFlightTokens(tokens);
          const isFirst = idx === 0;

          duties.push({
            id:       `${flightNo}-${dateISO}-${idx}`,
            type:     'FLIGHT',
            date:     dateISO,
            day,
            item:     flightNo,
            signOn:   isFirst ? dutyStart : undefined,
            signOff:  f.dutyEnd,
            blockHrs: f.blockHrs,
            dutyHrs:  f.dutyHrs,
            dutyCode: f.dutyCode,
            acType:   f.acType,
            flight: {
              flightNumber: flightNo,
              depPort:      f.depPort,
              arrPort:      f.arrPort ?? '',
              std:          f.depTime,
              sta:          f.arrTime ?? '',
              signOn:       isFirst ? dutyStart : undefined,
              signOff:      f.dutyEnd,
            },
          });
        } catch (err) {
          logger?.error('mas-aims:pos-flight',
            `Failed to parse positioning flight at ${dateISO}`, {
              error: String(err), chunk: chunk.slice(0, 200),
            });
        }
      });

      if (duties.length > 0) return duties;
    }
  }

  // ── 2. Standby ───────────────────────────────────────────────────────────
  const standbyRe = /\b(S\d+-\d+|SBY|ASB|STBY|SB|SA|SH)\b/i;
  const standbyM  = chunk.match(standbyRe);
  if (standbyM) {
    const code  = standbyM[1].toUpperCase();
    const times = chunk.match(/\d{2}:\d{2}/g) ?? [];
    // Standby chunk layout (6 times):
    //   times[0] = duty start
    //   times[1] = dep time (= duty start, duplicated)
    //   times[2] = arr time
    //   times[3] = duty end  (= arr time, duplicated)
    //   times[4] = block hrs (always 00:00)
    //   times[5] = duty hrs
    const dutyStart = times[0];
    const dutyEnd   = times.length >= 4 ? times[times.length - 3] : times[1];
    const blockHrs  = times.length >= 2 ? times[times.length - 2] : undefined;
    const dutyHrs   = times.at(-1);

    duties.push({
      id:          `${code}-${dateISO}`,
      type:        'STANDBY',
      date:        dateISO,
      day,
      item:        code,
      signOn:      dutyStart,
      signOff:     dutyEnd,
      blockHrs:    blockHrs === '00:00' ? blockHrs : undefined,
      dutyHrs,
      description: `Standby — ${code}`,
    });
    return duties;
  }

  // ── 2b. Early continuation check (must run BEFORE training) ─────────────
  // The last date block in the PDF extends to end of text and includes the
  // code-legend section (e.g. "330BLP35 A330 LPC DAY-3 SESSION-5"), which
  // contains training keywords that would trigger the training step falsely.
  // A genuine continuation row starts with an airport code immediately after
  // the optional day-of-week — there is NO duty-start time before the port.
  // Anchoring to the start of the chunk catches only true continuation rows.
  const contEarlyRe = /^\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?\s*([A-Z]{3})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})/;
  const contEarlyM  = chunk.match(contEarlyRe);
  if (contEarlyM && !NON_PORT.has(contEarlyM[1])) {
    duties.push({
      id:              `CONT-${dateISO}`,
      type:            'FLIGHT',
      date:            dateISO,
      day,
      item:            '__continuation__',
      signOff:         contEarlyM[3],
      _isContinuation: true,
      flight: {
        flightNumber: '',
        depPort:      '',
        arrPort:      contEarlyM[1],
        std:          '00:00',
        sta:          contEarlyM[2],
        signOff:      contEarlyM[3],
      },
    });
    return duties;
  }

  // ── 2c. Off / leave / medical (checked BEFORE standby) ───────────────────
  // Must run before the standby check so that an explicit off code (D, DO,
  // MC1 …) on the LAST date of the month is not shadowed by standby codes
  // (S4-353, S2-353 …) that bleed in from the code-legend page when the
  // footer truncation cannot exclude them.  Off codes are authoritative:
  // a day cannot be both "D" (off) and a standby.
  // Longer codes first so "DO" is not partially matched before bare "D".
  {
    const offRe = /\b(DO[1-9]?|MC[1-4]|COMP|CMP|OFF|REST|AL|SL|ML|HL|PH|EL|D)\b/;
    const offM  = chunk.match(offRe);
    if (offM) {
      const code = offM[1].toUpperCase();
      duties.push({
        id:          `${code}-${dateISO}`,
        type:        'OFF',
        date:        dateISO,
        day,
        item:        code,
        description: OFF_CODES[code] ?? `Off — ${code}`,
      });
      return duties;
    }
  }

  // ── 3. Training / simulator ──────────────────────────────────────────────
  // AIMS simulator session codes: 3-digit AC type + 2-4 letter session type + digits + optional letter suffix
  // e.g. "330AOP31", "330CFF1C" (FFS), "330CED1E" (EDTO), "330BLP35"
  const aimsSimRe  = /\b(\d{3}[A-Z]{2,4}\d+[A-Z]*)\b/;
  // CRM/SMS class codes: letter + digits + 2+ letters + digits (e.g. "C17SMSC1")
  const crmStyleRe = /\b([A-Z]\d+[A-Z]{2,}\d+[A-Z]*)\b/;
  // Long AIMS alphanumeric training codes (e.g. "A353UPRR", "A353ETPR", "353RRCYA")
  const trnLongRe  = /\b([A-Z0-9]{5,}(?:OPC|SIM|TRN|UPR|ETP|REC|UPRR|ETPR|RRCYA)[A-Z0-9]*)\b/i;
  // Keyword fallback — includes TRAINER for days where only the duty-code col has training info
  const trnShortRe = /\b(SIM\/TRN|RECURRENT|TRAINING|TRAINER|SIM|TRN|GND|LPC|OPC|CRM|CBT|TRG|TDC\d*)\b/i;
  // Try most-specific patterns first so e.g. "330AOP23" wins over a bare "OPC" keyword
  const trnM = chunk.match(aimsSimRe) ?? chunk.match(crmStyleRe) ?? chunk.match(trnLongRe) ?? chunk.match(trnShortRe);
  if (trnM) {
    const code  = trnM[1].toUpperCase();
    const times = chunk.match(/\d{2}:\d{2}/g) ?? [];
    // AIMS sim/course layout: [signOn, simStart, simEnd?, dutyEnd?, blockHrs(00:00), dutyHrs]
    // Last two HH:MM values are block hours and duty hours; third-from-last is duty end.
    const blockHrs = times.length >= 2 ? times[times.length - 2] : undefined;
    const dutyHrs  = times.length >= 1 ? times.at(-1)            : undefined;
    const signOff  = times.length >= 3 ? times[times.length - 3] : undefined;
    // Capture instructor/examiner role duty code (TRI, TRE, SFE, DEC, IRE etc.)
    const dcMatch  = chunk.match(/\b(TRI|TRE|SFE|DEC|IRE)\b/);
    duties.push({
      id:          `TRN-${dateISO}`,
      type:        'TRAINING',
      date:        dateISO,
      day,
      item:        code,
      signOn:      times[0],
      signOff,
      blockHrs,
      dutyHrs,
      dutyCode:    dcMatch?.[1],
      description: resolveSimCode(code),
    });
    return duties;
  }

  // ── 5. Continuation arrival (arrival day of a long-haul) ─────────────────
  // Pattern: ArrPort ArrTime DutyEnd — no Item, no MH, no standby code.
  // Example: "KUL 16:52 17:37" on the day after a LHR departure.
  const contRe = /\b([A-Z]{3})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})/;
  const contM  = chunk.match(contRe);
  if (contM && !NON_PORT.has(contM[1])) {
    const placeholder: ParsedDuty = {
      id:              `CONT-${dateISO}`,
      type:            'FLIGHT',
      date:            dateISO,
      day,
      item:            '__continuation__',
      signOff:         contM[3],
      _isContinuation: true,
      flight: {
        flightNumber: '',
        depPort:      '',
        arrPort:      contM[1],
        std:          '00:00',
        sta:          contM[2],
        signOff:      contM[3],
      },
    };
    duties.push(placeholder);
    return duties;
  }

  // ── 6. Blank / day-of-week-only rows ────────────────────────────────────
  // Some rosters omit the "D" code on the first day of the month.
  // The chunk may contain only a day-of-week abbreviation (e.g. " Fri\n").
  // Strip weekday tokens and check if anything meaningful remains.
  const strippedChunk = chunk.replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi, '').trim();
  if (strippedChunk.length === 0) {
    duties.push({
      id:          `D-${dateISO}`,
      type:        'OFF',
      date:        dateISO,
      day,
      item:        'D',
      description: 'Day Off',
    });
    return duties;
  }

  // Unrecognised content — log and skip to avoid phantom duties
  logger?.warn('mas-aims:day', `Unclassified chunk at ${dateISO}`, {
    preview: chunk.slice(0, 80),
  });
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Post-processing: link continuation arrival rows to preceding flights
//
// A continuation row has _isContinuation = true.  We find the most recent
// FLIGHT duty with an empty arrPort and fill it in from the continuation,
// then remove the placeholder.
// ─────────────────────────────────────────────────────────────────────────────
function linkContinuationArrivals(duties: ParsedDuty[], logger?: ParseLogger): void {
  const contIndices: number[] = [];
  duties.forEach((d, i) => { if (d._isContinuation) contIndices.push(i); });

  // Work in reverse so splicing doesn't shift earlier indices
  for (let ci = contIndices.length - 1; ci >= 0; ci--) {
    const contIdx  = contIndices[ci];
    const contDuty = duties[contIdx];

    // Find the most recent FLIGHT that hasn't been filled with an arrPort yet
    let targetIdx = -1;
    for (let j = contIdx - 1; j >= 0; j--) {
      const d = duties[j];
      if (d.type === 'FLIGHT' && !d._isContinuation && !d.flight?.arrPort) {
        targetIdx = j;
        break;
      }
    }

    if (targetIdx >= 0) {
      const target = duties[targetIdx];
      if (target.flight && contDuty.flight) {
        target.flight.arrPort = contDuty.flight.arrPort;
        target.flight.sta     = contDuty.flight.sta;
        target.flight.signOff = contDuty.flight.signOff;
        target.signOff        = contDuty.signOff;
        logger?.info('mas-aims:link',
          `Linked continuation ${contDuty.flight.arrPort} ${contDuty.flight.sta} → ${target.item} on ${target.date}`);
      }
    } else {
      logger?.warn('mas-aims:link', `No unmatched flight found for continuation at ${contDuty.date}`);
    }

    // Replace the continuation placeholder with a LAYOVER entry so the
    // arrival day appears in the calendar as "Night Stop · [PORT]" rather
    // than as a blank / rest day.
    const layoverPort = contDuty.flight?.arrPort ?? '';
    duties.splice(contIdx, 1, {
      id:          `LAYOVER-${contDuty.date}`,
      type:        'LAYOVER',
      date:        contDuty.date,
      day:         contDuty.day,
      item:        layoverPort,
      signOff:     contDuty.signOff,
      description: layoverPort ? `Night Stop — ${layoverPort}` : 'Night Stop',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export function parseMasAims(text: string, logger?: ParseLogger): ParsedRoster {
  let skipped = 0;

  // ── Monthly stats ──────────────────────────────────────────────────────────
  const monthlyStats = extractMonthlyStats(text, logger);

  // ── Crew info ──────────────────────────────────────────────────────────────
  const { name: crewName } = extractCrewInfo(text);
  if (crewName === 'Crew Member') {
    logger?.warn('mas-aims:crew', 'Could not extract crew name', { preview: text.slice(0, 300) });
  } else {
    logger?.info('mas-aims:crew', `Crew name: ${crewName}`);
  }

  // ── Date blocks ────────────────────────────────────────────────────────────
  // Truncate at the monthly-stats / code-legend footer so the last date's chunk
  // doesn't bleed into "Monthly Statistics", "Actual Block Hours", the code
  // description table, etc.  Stats are extracted above from the full text.
  // Match any of:
  //  • "Monthly Statistics" — standard footer header
  //  • "Code Code Description" — code-legend page header
  //  • "Block Hours <time>" — stats value row (pdf.js sometimes streams numeric
  //    cell values before their row labels, so this catches the block-hours
  //    figure even when it precedes the "Monthly Statistics" label in the text
  //    stream).  The \d{1,4}:\d{2} suffix distinguishes it from the roster
  //    table-header "Actual Block Hours" which is followed by a word, not a digit.
  const footerIdx = text.search(
    /\bMonthly[\s\S]{0,15}Statistics\b|\bCode\s+Code\s+Description\b|\bBlock\s+Hours\s+\d{1,4}:\d{2}/i,
  );
  const textForChunks = footerIdx > 0 ? text.substring(0, footerIdx) : text;

  const dateRe      = /(\d{2})-([A-Z]{3})-(\d{4})/gi;
  const dateMatches = [...textForChunks.matchAll(dateRe)];

  if (dateMatches.length === 0) {
    logger?.error('mas-aims:dates', 'No DD-MMM-YYYY patterns found', { preview: text.slice(0, 200) });
    throw new Error('No dates found in the roster. Please ensure this is a text-based AIMS roster PDF.');
  }

  logger?.info('mas-aims:dates', `Found ${dateMatches.length} date(s)`, {
    first: dateMatches[0][0],
    last:  dateMatches.at(-1)![0],
  });

  const { month, year } = inferRosterPeriod(dateMatches);
  logger?.info('mas-aims:period', `Roster period: ${month} ${year}`);

  // ── Parse each date block ──────────────────────────────────────────────────
  const duties: ParsedDuty[] = [];

  for (let i = 0; i < dateMatches.length; i++) {
    const m       = dateMatches[i];
    const dateISO = `${m[3]}-${MONTH_MAP[m[2].toUpperCase()] ?? '01'}-${m[1]}`;
    const dayOfW  = getDayOfWeek(dateISO);

    const chunkStart = m.index! + m[0].length;
    const chunkEnd   = dateMatches[i + 1]?.index ?? textForChunks.length;
    const chunk      = textForChunks.substring(chunkStart, chunkEnd);

    try {
      duties.push(...parseDayChunk(chunk, dateISO, dayOfW, logger));
    } catch (err) {
      skipped++;
      logger?.error('mas-aims:day', `Error at ${dateISO}`, {
        error: String(err), chunk: chunk.slice(0, 200),
      });
    }
  }

  // ── Link long-haul continuation arrivals ───────────────────────────────────
  linkContinuationArrivals(duties, logger);

  if (skipped > 0) {
    logger?.warn('mas-aims', `${skipped} date block(s) skipped due to errors`);
  }

  logger?.info('mas-aims', 'Parse complete', {
    duties:   duties.length,
    flights:  duties.filter(d => d.type === 'FLIGHT').length,
    standby:  duties.filter(d => d.type === 'STANDBY').length,
    off:      duties.filter(d => d.type === 'OFF').length,
    training: duties.filter(d => d.type === 'TRAINING').length,
    skipped,
    monthlyStats,
  });

  return { crewName, month, year, airline: 'Malaysia Airlines', duties, monthlyStats };
}
