import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";
import { buildCspHeader } from "./src/lib/security/csp";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Keep global Cache Components/PPR off until Vercel's Next builder supports
  // Next 16 `next-resume` static-PPR packaging without missing lambdas.
  cacheComponents: false,

  // Support both localhost aliases during development so HMR works
  // even if the browser opens the app via 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // Keep local visual QA screenshots free of the framework dev overlay.
  devIndicators: false,

  turbopack: {
    root: process.cwd(),
  },

  // Enable React Compiler for automatic optimizations (Next.js 15+)
  experimental: {
    optimizePackageImports: [
      '@/components',
      '@/lib',
      '@/utils',
      'react-instantsearch',
      'next-intl',
      'clsx',
      'tailwind-merge',
    ],
  },

  // Suppress verbose request logging in dev
  logging: false,

  // Compression
  compress: true,

  // Generate ETags for static resources
  generateEtags: true,

  // PoweredByHeader - security
  poweredByHeader: false,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
      // OAuth avatars (Google)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
      },
    ],
    // Modern formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Minimize layout shift
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  webpack(config, { dev }) {
    if (dev) {
      const ignored = [
        "**/.tmp/**",
        "**/.playwright-cli/**",
        "**/output/**",
        "**/report/**",
        "**/test-results/**",
      ];
      const existingIgnored = config.watchOptions?.ignored;
      const normalizedExistingIgnored = Array.isArray(existingIgnored)
        ? existingIgnored.filter(
            (entry): entry is string => typeof entry === "string" && entry.length > 0,
          )
        : typeof existingIgnored === "string"
          ? existingIgnored.length > 0
            ? [existingIgnored]
            : []
          : [];

      config.watchOptions = {
        ...config.watchOptions,
        ignored: [...normalizedExistingIgnored, ...ignored],
      };
    }

    return config;
  },

  async rewrites() {
    return [
      {
        source: '/prihlasenie',
        destination: '/auth/login',
      },
      {
        source: '/registracia',
        destination: '/auth/register',
      },
    ];
  },

  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const isProd = process.env.NODE_ENV === 'production';
    const googleOneTapEnabled =
      process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP === "true";
    const vercelLiveFeedbackEnabled = process.env.VERCEL_ENV === "preview";
    const csp = buildCspHeader({
      isDev,
      enableGoogleOneTap: googleOneTapEnabled,
      enableVercelLiveFeedback: vercelLiveFeedbackEnabled,
      includeUpgradeInsecureRequests: isProd,
    });

    return [
      // Don't cache HTML pages - always get fresh content
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Cache individual car pages (1 hour)
      {
        source: '/auto/:id',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Cache dealer pages (30 minutes)
      {
        source: '/predajca/:slug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=604800',
          },
        ],
      },
      // Cache fonts
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Never cache sensitive auth/account/payment API responses
      {
        source: '/api/account/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/stripe/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, must-revalidate',
          },
        ],
      },
      // Apply to all routes
      {
        source: '/(.*)',
        headers: [
          // DNS prefetch for faster external requests
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
