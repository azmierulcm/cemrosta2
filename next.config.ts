import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // Packages that use native Node.js modules — must not be bundled by Turbopack
  serverExternalPackages: ['web-push'],

  // Trim unused locales from the bundle
  i18n: undefined,

  // Tree-shake icon/animation libraries — safe for SSR
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
    ],
    serverActions: {
      // Roster PDFs can exceed the default 1 MB server-action body limit.
      // 10 MB matches the MAX_FILE_BYTES guard in parseRosterPreview.
      bodySizeLimit: '10mb',
    },
  },

  images: {
    // Use modern formats by default — AVIF is ~50% smaller than WebP
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
    ],
    // Keep narrow device widths to reduce unnecessary sizes
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // ── Security headers ────────────────────────────────────────────────────────
  // Applied to every response from the Next.js server.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          // Block clickjacking — allow same-origin framing (needed for OG image previews)
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          // Enforce HTTPS for one year including sub-domains
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Restrict referrer info to same-origin for privacy
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // Lock down browser feature access
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // apis.google.com needed for Firebase Auth Google Sign-In popup (api.js)
              // accounts.google.com needed for the OAuth iframe
              `script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://storage.googleapis.com https://lh3.googleusercontent.com https://flagcdn.com https://*.cartocdn.com https://*.basemaps.cartocdn.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://cdn.jsdelivr.net https://apis.google.com",
              // accounts.google.com iframe is required for Google Sign-In popup flow
              "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  telemetry: false,
  disableLogger: true,
});
