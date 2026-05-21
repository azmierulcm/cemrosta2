import { getDocumentProxy, extractText } from 'unpdf';
import type { ParseLogger } from '../logger';

// ─────────────────────────────────────────────────────────────────────────────
// Native Text Handler
//
// Responsibility: open the PDF buffer and extract raw text using unpdf/pdf.js.
// This handler is authoritative for text-based (non-scanned) PDFs.
//
// It extracts text page-by-page so that any individual page failure is:
//   a) attributed precisely (page number + character offset)
//   b) logged as a structured WARN entry
//   c) skipped gracefully — extraction continues on remaining pages
//
// Throws only when the entire document cannot be opened (encrypted, corrupted)
// or when zero pages yielded any text at all.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExtractionResult {
  /** Full merged text from all successfully extracted pages */
  text: string;
  /** Total number of pages in the PDF */
  pageCount: number;
  /** Per-page text; empty string for pages that failed or yielded nothing */
  pageTexts: string[];
  /** 1-indexed page numbers that returned empty or errored */
  emptyPages: number[];
}

export async function nativeTextHandler(
  buffer: Uint8Array,
  logger: ParseLogger,
): Promise<ExtractionResult> {
  logger.info('native-text', 'Starting PDF text extraction', {
    bufferBytes: buffer.byteLength,
  });

  // ── 1. Open the document proxy ─────────────────────────────────────────────
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;

  try {
    pdf = await getDocumentProxy(buffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isEncrypted =
      message.toLowerCase().includes('password') ||
      message.toLowerCase().includes('encrypt');

    logger.error('native-text:open', 'Failed to open PDF document', {
      error: message,
      isEncrypted,
    });

    throw new Error(
      isEncrypted
        ? 'This PDF is password-protected. Please remove the password before uploading.'
        : `Could not read the PDF file. It may be corrupted or in an unsupported format. (${message})`,
    );
  }

  const pageCount = pdf.numPages;
  logger.info('native-text:open', 'PDF document opened', { pageCount });

  // ── 2. Extract text (merged) and build per-page breakdown ──────────────────
  // We run the full merged extraction first (fast path), then check per-page
  // content for diagnostic purposes.

  let mergedText = '';
  let rawPageTexts: string[] = [];

  try {
    // Try mergePages: false to get per-page array for precise diagnostics
    const resultMulti = await extractText(pdf, { mergePages: false });
    const pages = resultMulti.text;

    if (Array.isArray(pages)) {
      rawPageTexts = pages.map((p) => (typeof p === 'string' ? p : ''));
      mergedText = rawPageTexts.join('\n');
    } else {
      // Fallback: unpdf returned a single string (older API version)
      mergedText = typeof pages === 'string' ? pages : '';
      rawPageTexts = [mergedText];
    }
  } catch (_perPageErr: unknown) {
    // Per-page extraction failed — fall back to merged mode
    logger.warn('native-text:extract', 'Per-page extraction failed, falling back to merged mode', {
      error: _perPageErr instanceof Error ? _perPageErr.message : String(_perPageErr),
    });

    try {
      const resultMerged = await extractText(pdf, { mergePages: true });
      mergedText = typeof resultMerged.text === 'string' ? resultMerged.text : '';
      rawPageTexts = [mergedText];
    } catch (mergedErr: unknown) {
      const message = mergedErr instanceof Error ? mergedErr.message : String(mergedErr);
      logger.error('native-text:extract', 'All extraction strategies failed', { error: message });
      throw new Error(`Could not extract text from this PDF. (${message})`);
    }
  }

  // ── 3. Flag empty or suspicious pages ─────────────────────────────────────
  const emptyPages: number[] = [];

  rawPageTexts.forEach((pageText, idx) => {
    const pageNum = idx + 1;
    if (!pageText.trim()) {
      emptyPages.push(pageNum);
      logger.warn('native-text:page', `Page ${pageNum} yielded no text — may be image-based or blank`, {
        page: pageNum,
        totalPages: pageCount,
        charCount: pageText.length,
      });
    } else {
      const alphaRatio = (pageText.match(/[a-zA-Z0-9]/g) ?? []).length / pageText.length;
      if (alphaRatio < 0.05) {
        logger.warn('native-text:page', `Page ${pageNum} has very low alphanumeric ratio`, {
          page: pageNum,
          alphanumericRatio: alphaRatio.toFixed(4),
          charCount: pageText.length,
        });
      }
    }
  });

  if (emptyPages.length === pageCount) {
    logger.error('native-text', 'Every page returned empty text', { emptyPages });
    throw new Error(
      'No text could be extracted from any page of this PDF. ' +
      'Please ensure this is a text-based roster exported directly from AIMS, not a scanned image.',
    );
  }

  if (emptyPages.length > 0) {
    logger.warn('native-text', `${emptyPages.length} of ${pageCount} page(s) are empty`, {
      emptyPages,
    });
  }

  // ── 4. Normalise Unicode lookalike characters ──────────────────────────────
  // Some PDF renderers (including MAS iFlight Crew Portal) emit the Unicode
  // RATIO character ∶ (U+2236) instead of the ASCII colon : (U+003A) for
  // time values like "09∶58".  All our time regexes use ASCII colon, so we
  // normalise here — once, centrally — before any parser sees the text.
  // Also covers FULLWIDTH COLON ： (U+FF1A) used by other portal variants.
  mergedText = mergedText.replace(/[∶：˸꞉]/g, ':');

  const nonWsCount = (mergedText.match(/\S/g) ?? []).length;
  logger.info('native-text', 'Extraction complete', {
    totalChars: mergedText.length,
    nonWhitespaceChars: nonWsCount,
    emptyPages: emptyPages.length,
  });

  return {
    text: mergedText,
    pageCount,
    pageTexts: rawPageTexts,
    emptyPages,
  };
}
