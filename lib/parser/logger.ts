import { randomUUID } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// ParseLogger — structured JSON telemetry for the roster parse pipeline.
//
// Every log entry is immediately emitted to stdout as a single JSON line so
// Vercel / serverless log drains pick it up without buffering. Entries are
// also accumulated in-memory so the report builder can summarise them at the
// end of the run.
// ─────────────────────────────────────────────────────────────────────────────

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface ParseLogEntry {
  level: LogLevel;
  timestamp: string;
  runId: string;
  /** Dot-delimited phase identifier, e.g. "native-text:page" or "mas-aims:flight" */
  phase: string;
  message: string;
  /** Optional machine-readable context — coordinates, offsets, code snippets, etc. */
  context?: Record<string, unknown>;
}

export class ParseLogger {
  readonly runId: string;
  private entries: ParseLogEntry[] = [];

  constructor(runId?: string) {
    this.runId = runId ?? randomUUID();
  }

  // ── Core emitter ────────────────────────────────────────────────────────────

  private emit(
    level: LogLevel,
    phase: string,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const entry: ParseLogEntry = {
      level,
      timestamp: new Date().toISOString(),
      runId: this.runId,
      phase,
      message,
      ...(context !== undefined ? { context } : {}),
    };
    this.entries.push(entry);

    // Structured log → one JSON line per entry (Vercel log drain friendly)
    const fn = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
    fn(JSON.stringify(entry));
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  info(phase: string, message: string, context?: Record<string, unknown>): void {
    this.emit('INFO', phase, message, context);
  }

  warn(phase: string, message: string, context?: Record<string, unknown>): void {
    this.emit('WARN', phase, message, context);
  }

  error(phase: string, message: string, context?: Record<string, unknown>): void {
    this.emit('ERROR', phase, message, context);
  }

  // ── Accessors ───────────────────────────────────────────────────────────────

  getEntries(): ParseLogEntry[] {
    return [...this.entries];
  }

  getWarnings(): ParseLogEntry[] {
    return this.entries.filter((e) => e.level === 'WARN');
  }

  getErrors(): ParseLogEntry[] {
    return this.entries.filter((e) => e.level === 'ERROR');
  }
}
