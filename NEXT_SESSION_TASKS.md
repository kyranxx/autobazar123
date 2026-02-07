# 📋 Next Session Tasks (Feb 8, 2026)

## 🎯 Priority 1: Image Lazy Loading (3-4 hours)

### What to Do
1. Create new component: `src/components/OptimizedImage.tsx`
   - Wrapper around `<Image />` component
   - Add `loading="lazy"` by default
   - Add blur placeholder support
   - Add `sizes` prop for responsive loading

### Code Template
```tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // false = lazy load
  blurDataURL?: string; // Base64 placeholder
  sizes?: string;
}

export function OptimizedImage({
  src,
  priority = false,
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Image
      src={src}
      loading={priority ? 'eager' : 'lazy'}
      placeholder={blurDataURL ? 'blur' : 'empty'}
      blurDataURL={blurDataURL}
      onLoadingComplete={() => setIsLoading(false)}
      className={`transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'} ${props.className}`}
      {...props}
    />
  );
}
```

2. Update key image usage:
   - CarCard.tsx
   - Search results
   - Featured cars
   - Dealer dashboard

3. Add blur placeholders (low-quality image strings)

### Verification
```bash
# Check that images have loading="lazy"
grep -r "loading=\"lazy\"" src/

# Should see results in CarCard, Search, FeaturedCars
```

---

## 🎯 Priority 2: Bundle Size Analysis (2 hours)

### What to Do
1. Run bundle analyzer:
```bash
npm run analyze
```

2. Identify top 10 largest dependencies:
   - react-leaflet (map)
   - react-instantsearch (search)
   - algoliasearch (API client)
   - stripe (payments)

3. Create dynamic import strategy:
   - Map: Only load on `/map` routes
   - Algolia: Only load on search pages
   - Stripe: Only load on payment pages

4. Implement in routes:

```tsx
// app/[brand]/[model]/page.tsx
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/map'), {
  loading: () => <MapSkeleton />,
  ssr: false,
});

export default function Page() {
  return (
    <>
      {/* Always loaded */}
      <CarListings />
      
      {/* Only loaded when needed */}
      <Suspense fallback={<MapSkeleton />}>
        <Map />
      </Suspense>
    </>
  );
}
```

### Verification
```bash
# Before: ~450KB
# After: ~350KB (target)
npm run build | grep "page.*javascript"
```

---

## 🎯 Priority 3: ISR & Caching (3 hours)

### What to Do

1. Enable ISR for product pages:

```tsx
// src/app/[brand]/[model]/[city]/page.tsx

export const revalidate = 3600; // Revalidate every hour

// Or on-demand:
export const dynamicParams = true; // Allow new params
```

2. Add cache headers to key routes:

```tsx
// next.config.ts - Add to headers() function
{
  source: '/auto/:id',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  ],
},
{
  source: '/predajca/:slug',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=1800, s-maxage=3600',
    },
  ],
},
```

3. Add Redis caching for expensive queries:

```tsx
// src/lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export async function getCachedDealerData(dealerId: string) {
  const cached = await redis.get(`dealer:${dealerId}`);
  if (cached) return cached;

  const data = await fetchDealerData(dealerId);
  await redis.setex(`dealer:${dealerId}`, 3600, JSON.stringify(data));
  
  return data;
}
```

### Verification
```bash
# Check cache headers in response
curl -I https://autobazar123.sk/auto/12345 | grep Cache-Control

# Should see max-age and s-maxage
```

---

## 🎯 Priority 4: Performance Testing (2-3 hours)

### What to Do

1. Test with PageSpeed Insights:
```
https://pagespeed.web.dev/?url=https://autobazar123.sk
```

2. Check metrics:
   - Mobile score (target: 80+)
   - Desktop score (target: 90+)
   - LCP < 2.5s
   - CLS < 0.1
   - FID < 100ms

3. Test on slow network:
   - DevTools → Network → Slow 3G
   - Page should still load in <5s
   - Service worker should cache assets

4. Load testing:
```bash
# Install autocannon
npm install -g autocannon

# Test with 10 concurrent connections
autocannon -c 10 -d 30 http://localhost:3000
```

### Expected Results (After All Optimizations)
- First visit: ~2s
- Repeat visit: ~0.5s (from cache)
- Offline: Works fine
- Mobile PageSpeed: 85+
- Desktop PageSpeed: 90+

---

## 🎯 Priority 5: Monitoring Setup (2-3 hours)

### What to Do

1. Add error logging (Sentry):

```bash
npm install @sentry/nextjs
```

```tsx
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.Replay()],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
});
```

2. Add to layout.tsx:

```tsx
import { ErrorBoundary } from '@sentry/nextjs';

export default function RootLayout() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      {/* app */}
    </ErrorBoundary>
  );
}
```

3. Create dashboard link in README:
   - Add Sentry project link
   - Add health check: /api/health
   - Add monitoring service link

---

## ✅ Checklist for This Session

- [ ] Create OptimizedImage component
- [ ] Update CarCard to use OptimizedImage
- [ ] Update Search results to lazy load
- [ ] Update FeaturedCars to lazy load
- [ ] Run bundle analyzer
- [ ] Identify top 5 large dependencies
- [ ] Add dynamic imports for map
- [ ] Add dynamic imports for search
- [ ] Enable ISR on product pages
- [ ] Add Cache-Control headers
- [ ] Test with PageSpeed Insights
- [ ] Test offline mode (DevTools)
- [ ] Test slow 3G network
- [ ] Document results
- [ ] Update PROJECT_STATUS_DASHBOARD.txt

---

## Commands to Run

```bash
# Verify build still passes
npm run build

# Run bundle analyzer
npm run analyze

# Start dev server
npm run dev

# Test health check
curl http://localhost:3000/api/health

# Test TypeScript
npx tsc --noEmit

# Lint
npm run lint
```

---

## Estimated Time

- Image lazy loading: 1.5 hours
- Bundle analysis: 1 hour
- Dynamic imports: 1.5 hours
- ISR/Caching: 1.5 hours
- Performance testing: 2 hours
- Monitoring: 1.5 hours

**Total: 9 hours** (full work day)

---

## Success Criteria

After completing these tasks:

✅ PageSpeed Insights score 85+ (mobile), 90+ (desktop)  
✅ LCP < 2.5s on first visit  
✅ Repeat visit < 0.8s (cached)  
✅ Bundle size < 350KB (was 450KB)  
✅ Zero TypeScript errors  
✅ All tests passing  
✅ Error logging configured  
✅ Health check working  
✅ Service worker caching assets  
✅ Offline page shown when offline  

---

## If You Get Stuck

Check these files:
- SESSION_2_SUMMARY.md - What was just completed
- RELIABILITY_GUIDE.md - How to use new features
- PERFORMANCE_OPTIMIZATION_PLAN.md - Overall strategy
- next.config.ts - Config examples

---

**Last Updated:** Feb 7, 2026  
**Ready to Start:** Feb 8, 2026  
**Estimated Completion:** Feb 8-9, 2026  

**Once complete:** Project will be 88-90% done, ready for final QA.

