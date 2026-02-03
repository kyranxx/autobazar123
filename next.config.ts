import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable React Compiler for automatic optimizations (Next.js 15+)
  experimental: {
    optimizePackageImports: [
      '@/components',
      'react-instantsearch',
      'react-instantsearch-nextjs',
      'lucide-react',
      'clsx',
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

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
    ],
    // Modern formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Minimize layout shift
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  async headers() {
    return [
      // Cache static assets aggressively (1 year)
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
            value: '<https://imagedelivery.net>; rel=preconnect, <https://*.algolia.net>; rel=preconnect, <https://*.algolianet.com>; rel=preconnect',
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
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
