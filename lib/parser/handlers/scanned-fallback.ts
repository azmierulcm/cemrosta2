import type { ParseLogger } from '../logger';

// ─────────────────────────────────────────────────────────────────────────────
// Scanned Image Fallback Handler
//
// Responsibility: detect image-based (scanned) PDFs and log a precise,
// actionable diagnostic before throwing so the failure is never silent.
//
// A scanned PDF typically produces either:
//   • Completely empty text (already handled by nativeTextHandler)
//   • A handful of garbled characters from embedded metadata (< 5 % alpha ratio)
//
// OCR is not available in this environment (browser/Edge runtime) — the handler
// documents the failure in structured telemetry for future integration with a
// cloud OCR service (e.g. Google Cloud Vision, AWS Textract).
//
// FUTURE INTEGRATION POINT:
//   Replace the throw below with a call to your OCR service and return its text.
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum ratio of alphanumeric chars to total chars for a text-based PDF. */
const SCANNED_THRESHOLD = 0.05;

/** Returns true when the extracted text looks like a scanned/image-based PDF. */
export function isLikelyScanned(text: string): boolean {
  if (!text.trim()) return true;
  const alphaNum = (text.match(/[a-zA-Z0-9]/g) ?? []).length;
  return alphaNum / text.length < SCANNED_THRESHOLD;
}

/**
 * Log a structured failure and throw a user-friendly error.
 * Never silently continues — scanned PDFs require human action or OCR.
 */
export function scannedFallbackHandler(text: string, logger: ParseLogger): never {
  const totalChars = text.length;
  const alphaNum = (text.match(/[a-zA-Z0-9]/g) ?? []).length;
  const ratio = totalChars > 0 ? alphaNum / totalChars : 0;

  logger.error('scanned-fallback', 'PDF identified as image/scanned — text extraction yielded insufficient content', {
    totalChars,
    alphanumericChars: alphaNum,
    alphanumericRatio: ratio.toFixed(4),
    threshold: SCANNED_THRESHOLD,
    ocrAvailable: false,
    // Integration hint surfaced in logs for observability tooling
    futureIntegrationHint: 'Route to OCR service (e.g. Google Cloud Vision) when ocrAvailable = true',
    actionRequired: 'User must export roster as digital text PDF from AIMS, not a printed/scanned copy',
  });

  throw new Error(
    'This PDF appears to be a scanned image rather than a digital text document. ' +
    'Please export your roster directly from the AIMS portal as a PDF — ' +
    'do not scan a printed copy.',
  );
}
