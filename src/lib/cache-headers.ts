/**
 * Cache header utilities for ISR and static content
 * Implements cache-control headers for optimal browser + CDN caching
 */

export const CACHE_HEADERS = {
  // Static assets that rarely change (1 year)
  STATIC_ASSET: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },

  // HTML pages that regenerate (10 minutes)
  ISR_FAST: {
    "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
  },

  // Homepage and key pages (1 hour)
  ISR_MEDIUM: {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=604800",
  },

  // Slow-changing content like dealer pages (24 hours)
  ISR_SLOW: {
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=2592000",
  },

  // Dynamic content that changes frequently
  NO_CACHE: {
    "Cache-Control": "public, max-age=0, must-revalidate",
  },

  // API responses (1 hour)
  API_CACHE: {
    "Cache-Control": "public, max-age=3600",
  },

  // User-specific content (no cache)
  PRIVATE: {
    "Cache-Control": "private, no-store, must-revalidate",
  },
};

/**
 * Generate revalidation tags for ISR
 */
export function generateRevalidateTags(type: string, id?: string): string[] {
  const tags = [type];
  if (id) {
    tags.push(`${type}-${id}`);
  }
  return tags;
}

/**
 * ISR time in seconds (for next.revalidate)
 */
export const ISR_REVALIDATE = {
  REALTIME: 1, // 1 second (effective no cache)
  FAST: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  STANDARD: 600, // 10 minutes
  SLOW: 3600, // 1 hour
  VERY_SLOW: 86400, // 24 hours
  INDEFINITE: false, // Don't revalidate (static)
} as const;
