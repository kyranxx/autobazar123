/**
 * Dynamic imports for heavy libraries to reduce initial bundle size
 * These are loaded on-demand when specific features are used
 */

import dynamic from 'next/dynamic';

// Leaflet map - only loaded when map page is visited
export const DynamicMap = dynamic(
  () => import('@/components/map/Map').then(mod => mod.default),
  {
    loading: () => <MapSkeleton />,
    ssr: false, // Maps don't work well with SSR
  }
);

// Leasing Calculator - loaded on demand
export const DynamicLeasingCalculator = dynamic(
  () => import('@/components/calculator/LeasingCalculator').then(mod => mod.default),
  {
    loading: () => <CalculatorSkeleton />,
  }
);

// Search components - lazy load heavy Algolia UI
export const DynamicSearch = dynamic(
  () => import('@/components/search/Search').then(mod => mod.default),
  {
    loading: () => <SearchSkeleton />,
  }
);

// Skeletons for loading states
function MapSkeleton() {
  return (
    <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse" />
  );
}

function CalculatorSkeleton() {
  return (
    <div className="w-full space-y-4 p-4">
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="w-full space-y-2">
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
