import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable React Compiler for automatic optimizations (Next.js 15+)
  experimental: {
    optimizePackageImports: [
      '@/components',
      '@/lib',
      '@/utils',
      'react-instantsearch',
      'react-instantsearch-nextjs',
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

    // Note: Security headers are also set in `src/proxy.ts` (Proxy/Middleware).
    // Keeping a compatible CSP here avoids surprising behavior if one path skips the proxy.
    const cspScriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://*.algolia.net",
      "https://*.algolianet.com",
      "https://js.stripe.com",
      "https://accounts.google.com",
      "https://www.googletagmanager.com",
      "https://www.clarity.ms",
      "https://c.bing.com",
    ].join(" ");

    return [
      // PREVENT CSS CACHING IN DEVELOPMENT
      // This prevents the "creamy background" bug from returning
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
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
      // Cache static assets aggressively (1 year) - BUT NOT CSS
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
      // Cache images
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
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
          // Preconnect to critical external services
          {
            key: 'Link',
            // Wildcard hosts aren't valid for preconnect; keep it to known concrete origins.
            value: '<https://imagedelivery.net>; rel=preconnect',
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
            value: [
              "default-src 'self'",
              `script-src ${cspScriptSrc}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http: https://www.clarity.ms https://c.bing.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.algolia.net https://*.algolianet.com https://api.stripe.com https://*.upstash.io https://accounts.google.com https://www.clarity.ms https://c.bing.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
              "frame-ancestors 'self'",
              "form-action 'self' https://accounts.google.com",
              "base-uri 'self'",
              "object-src 'none'",
            ]
              .concat(isProd ? ["upgrade-insecure-requests"] : [])
              .join('; '),
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
