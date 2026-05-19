import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // Trim unused locales from the bundle
  i18n: undefined,

  // Aggressive package-level tree-shaking for known heavy deps
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@firebase/firestore',
    ],
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
    ],
    // Keep narrow device widths to reduce unnecessary sizes
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

export default nextConfig;
