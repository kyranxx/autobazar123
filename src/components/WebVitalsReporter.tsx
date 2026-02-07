'use client';

import { useEffect } from 'react';
import { reportWebVital, getRating } from '@/lib/web-vitals';

/**
 * Reports Web Vitals to analytics
 * Place this in root layout
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Import web-vitals dynamically (client-side only)
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportWebVitalMetric);
      onINP(reportWebVitalMetric);
      onFCP(reportWebVitalMetric);
      onLCP(reportWebVitalMetric);
      onTTFB(reportWebVitalMetric);
    }).catch(err => {
      console.warn('Failed to load web-vitals:', err);
    });
  }, []);

  return null;
}

function reportWebVitalMetric(metric: any) {
  // Get rating for this metric
  const rating = getRating(metric.name, metric.value);

  // Report to analytics
  reportWebVital({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    entries: metric.entries || [],
    navigationType: metric.navigationType,
    rating,
  });
}
