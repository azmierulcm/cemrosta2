import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';

type FontOptions = ConstructorParameters<typeof ImageResponse>[1]['fonts'];

/**
 * Renders a Satori JSX tree to a PNG Response, forcing eager evaluation so
 * any rendering error is thrown synchronously inside the caller's try/catch.
 *
 * Background: ImageResponse renders lazily as a ReadableStream. If Satori
 * crashes during rendering the error escapes the route's try/catch because
 * it happens after the Response object has already been returned. Calling
 * arrayBuffer() here forces the full render before we hand back the Response,
 * so the catch block can intercept and return a proper JSON error instead.
 */
export async function renderImage(
  element: ReactElement,
  options: { width: number; height: number; fonts: FontOptions; filename?: string },
): Promise<Response> {
  const ir = new ImageResponse(element, {
    width: options.width,
    height: options.height,
    fonts: options.fonts,
  });

  // Force eager render — this is what makes errors catchable.
  const buffer = await ir.arrayBuffer();

  const headers = new Headers({ 'Content-Type': 'image/png' });
  if (options.filename) {
    headers.set('Content-Disposition', `attachment; filename="${options.filename}"`);
  }

  return new Response(buffer, { status: 200, headers });
}
