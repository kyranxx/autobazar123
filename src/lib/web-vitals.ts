/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals: LCP, FID, CLS
 */

export interface WebVitals {
  id: string;
  name: string;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
  navigationType: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Report a Web Vital metric
 * Can be sent to analytics service (Vercel Analytics, Sentry, etc.)
 */
export function reportWebVital(metric: WebVitals): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', {
      name: metric.name,
      value: metric.value.toFixed(2),
      rating: metric.rating,
    });
  }

  // Send to analytics endpoint
  if (typeof window !== 'undefined') {
    // Queue metric for batch sending
    if ('sendBeacon' in navigator) {
      const body = JSON.stringify(metric);
      navigator.sendBeacon('/api/vitals', body);
    }
  }
}

/**
 * Thresholds for rating classification
 */
export const VITAL_THRESHOLDS = {
  LCP: {
    good: 2500,
    'needs-improvement': 4000,
  },
  FID: {
    good: 100,
    'needs-improvement': 300,
  },
  CLS: {
    good: 0.1,
    'needs-improvement': 0.25,
  },
  TTFB: {
    good: 600,
    'needs-improvement': 1200,
  },
} as const;

/**
 * Get rating for a metric
 */
export function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds =
    VITAL_THRESHOLDS[name as keyof typeof VITAL_THRESHOLDS];

  if (!thresholds) return 'poor';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds['needs-improvement']) return 'needs-improvement';
  return 'poor';
}
