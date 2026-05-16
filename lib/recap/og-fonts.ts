import fs from 'fs';
import path from 'path';

type FontResult = { name: string; data: ArrayBuffer; weight: 400 | 700 | 800 | 900; style: 'normal' };

/**
 * Geist Regular ships inside next/dist — guaranteed to exist on any
 * deployment that has Next.js installed. Used as a hard fallback so
 * Satori always has at least one font (it throws if fonts: [] is passed).
 */
function loadGeistFallback(): FontResult | null {
  try {
    const geistPath = path.join(
      path.dirname(require.resolve('next/package.json')),
      'dist/compiled/@vercel/og/Geist-Regular.ttf',
    );
    const data = fs.readFileSync(geistPath).buffer as ArrayBuffer;
    return { name: 'Inter', data, weight: 400, style: 'normal' };
  } catch {
    return null;
  }
}

/**
 * Fetch a single Google Font as an ArrayBuffer for Satori / ImageResponse.
 * Returns null on any failure so the caller can fall back gracefully.
 */
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
      {
        headers: {
          // Old iOS UA — Google Fonts returns TTF instead of WOFF2.
        // Satori only accepts TTF/OTF; WOFF2 throws "Unsupported OpenType signature wOF2".
        'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 ' +
            '(KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        },
        signal: AbortSignal.timeout(8_000),
      },
    ).then((r) => r.text());

    const url = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];
    if (!url) {
      console.warn(`[og-fonts] No font URL in CSS for ${family} ${weight}`);
      return null;
    }
    return fetch(url, { signal: AbortSignal.timeout(8_000) }).then((r) => r.arrayBuffer());
  } catch (err) {
    console.warn(`[og-fonts] Failed to load ${family} ${weight}:`, err);
    return null;
  }
}

/**
 * Returns the font options array for ImageResponse.
 * Loads Inter + IBM Plex Mono from Google Fonts.
 * Always returns at least one font — falls back to the Geist Regular
 * that ships with Next.js so Satori never throws "No fonts loaded".
 */
export async function getRecapFonts(): Promise<FontResult[]> {
  const [interReg, interBold, interBlack, monoMed] = await Promise.all([
    loadGoogleFont('Inter', 400),
    loadGoogleFont('Inter', 700),
    loadGoogleFont('Inter', 900),
    loadGoogleFont('IBM Plex Mono', 500),
  ]);

  const fonts: FontResult[] = [];
  if (interReg)   fonts.push({ name: 'Inter', data: interReg,   weight: 400, style: 'normal' });
  if (interBold)  fonts.push({ name: 'Inter', data: interBold,  weight: 700, style: 'normal' });
  if (interBlack) fonts.push({ name: 'Inter', data: interBlack, weight: 900, style: 'normal' });
  if (monoMed)    fonts.push({ name: 'IBM Plex Mono', data: monoMed, weight: 400, style: 'normal' });

  // Satori requires at least one font — guarantee that with the bundled Geist fallback.
  if (fonts.length === 0) {
    const fallback = loadGeistFallback();
    if (fallback) fonts.push(fallback);
  }

  return fonts;
}
