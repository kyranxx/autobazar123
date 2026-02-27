# Performance Blueprint — Autobazar123

> **Goal:** Make every interaction as fast as physically possible. Scale to 50-150K ads.  
> **Decision:** Stay with Algolia + add Cloudflare Worker edge cache. No Typesense migration.  
> **Date:** 2026-02-26  
> **Status:** Phase 0 completed. Awaiting Phase 1.

---

## Realistic Speed Targets

| Interaction | Current estimate | After all optimizations |
|-------------|-----------------|------------------------|
| Homepage LCP | 2-4 seconds | ~200-400ms |
| Car detail page LCP | 1-3 seconds | ~150-300ms |
| Search results (first load) | 1-2 seconds (skeleton) | ~300-500ms (real HTML) |
| Search query (subsequent) | 40-80ms | <10ms (cached), ~40ms (fresh) |
| Page-to-page navigation | 300-800ms | <100ms (with speculation) |

**Sub-50ms search is achievable** for repeated queries via Cloudflare Worker edge cache.  
**Fresh unique queries: ~35-50ms** (Algolia Amsterdam processing + network). Acceptable.

---

## How to Measure

| Tool | What | Access |
|------|------|--------|
| **Lighthouse** | LCP, FCP, CLS, TTFB, TBT | F12 → Lighthouse → Mobile → Performance |
| **Network tab** | Waterfall, per-request timing | F12 → Network → "Fast 3G" → hard reload |
| **Coverage tab** | Unused JS/CSS bytes | Ctrl+Shift+P → "Coverage" → reload |
| **Performance tab** | Long Tasks (>50ms red bars) | F12 → Performance → record page load |
| **`npm run analyze`** | Bundle treemap | Terminal → visual breakdown |
| **`performance.now()`** | Measure specific ops in code | Add around search handler |

---

## PART 1: Code-Level Fixes (Items 1-15)

### 1. ⛔ Homepage is 100% Client-Side Rendered

- **File:** `src/app/page.tsx` — line 1: `"use client"` on ~844 lines
- **Impact:** LCP penalty of **1-3 seconds**. Server sends empty HTML shell. Browser must download 34KB JS, parse, execute, THEN render pixels. Hero image can't start loading until JS runs.
- **Fix:** Convert to Server Component shell with client islands. Hero image, static text, car cards = server HTML. Interactive parts (search form, auth state) = small `"use client"` sub-components.
- **Theme picker note:** The homepage contains an 11-theme color picker system (`HOME_THEMES`, `HERO_VISUALS`, `THEME_ORDER` — lines 61-299) that is design tooling for evaluating color schemes. When converting to SSR: pick a single production theme and remove the theme picker UI, or hide it behind `NEXT_PUBLIC_ENABLE_THEME_PREVIEW` (same pattern as ThemePreviewShell in Item #3).
- **Compromise:** None. Identical look and behavior.
- **Measure:** Lighthouse LCP before vs after.

### 2. ⛔ Car Detail Page Double-Fetches Data

- **File:** `src/app/(site)/auto/[id]/CarDetailClient.tsx` — 1003 lines, entirely `"use client"`
- **Impact:** The server component (`page.tsx`) already fetches car data for metadata/JSON-LD via `getCarData()`, then **throws it away**. `CarDetailClient` re-fetches the exact same data from the browser via Supabase client. Also, `increment_ad_views` RPC (CarDetailClient.tsx, line 238) runs inside the client-side `useEffect` BEFORE the main Supabase query, **blocking the client-side data fetch** (not server render — there is no server render currently since the component is `"use client"`).
- **Nuance:** The server `getCarData()` query (page.tsx, line 12-22) only fetches a subset of fields: `id, brand, model, year, price_eur, mileage_km, fuel, transmission, body_style, description, photos_json, location_city`. The client component fetches `*` plus seller profile joins. Need to expand the server query to fetch ALL fields including seller data, then pass the full car object as a prop.
- **Fix:**
  1. Expand `getCarData()` in `page.tsx` to use `select('*, seller:profiles!seller_id (id, full_name, phone, is_verified, created_at)')` — matching what `CarDetailClient` currently fetches.
  2. Pass the full car object as a prop: `<CarDetailClient car={car} />`.
  3. Remove the `useEffect` + `fetchCar()` function from `CarDetailClient`. It should receive data via props.
  4. Move `increment_ad_views` to a fire-and-forget `POST` to an API route (e.g., `/api/views/[id]`), called from a lightweight `useEffect` in the client component. This never blocks rendering.
  5. Client component still needs `"use client"` for: gallery image selection, save/unsave toggle, contact form, show phone, share link.
- **Compromise:** None. Faster + less DB load.
- **Measure:** Network tab — should see 0 Supabase queries from the browser on initial page load (only the view increment API call).

### 3. ⛔ ThemePreviewShell Ships Dev UI to Production ✅ **DONE**

- **File:** `src/components/theme/ThemePreviewShell.tsx`
- **Impact:** Wraps `/vysledky`, `/auto/[id]`, `/moj-ucet`, `/admin` with a colored theme-picker bar. Every visitor was downloading 335 lines of theme-switching JS.
- **Fix:** Hidden behind an environment variable check. Only renders when `process.env.NEXT_PUBLIC_ENABLE_THEME_PREVIEW="true"`. In production, it just renders `{children}` with no overhead.

### 4. 🔴 framer-motion Loaded for 2 CSS-Replaceable Animations

- **File:** `src/app/page.tsx` — `import { motion } from "framer-motion"`
- **Impact:** ~32KB gzipped JS. Used for: hero section fade-in + card hover lift.
- **Fix:** Replace with CSS `animation: fade-in-up` (already defined in `globals.css` as `.animate-fade-in-up`) and `:hover { transform: translateY(-5px) }`. If you need spring physics feel, use `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- **Compromise:** None. CSS gives identical result for these simple animations.
- **Measure:** Coverage tab — framer-motion gone.

### 5. 🔴 AuthModal (33KB) Loaded Eagerly on Every Page

- **File:** `src/components/Navbar.tsx` (line 17) — `import AuthModal from "@/components/AuthModal"`
- **Impact:** 33KB of password validation, OAuth logic bundled into every page. 90%+ visitors never click login.
- **Fix:** Dynamic import in `Navbar.tsx`: `const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false })`. Additionally, preload the chunk on hover over the login button so even the first click feels instant:
  ```tsx
  onMouseEnter={() => import("@/components/AuthModal")}
  ```
- **Scope note:** AuthModal is also statically imported in `src/app/auth/login/page.tsx` and `src/app/auth/register/page.tsx`. Those imports should remain **eager** (static) — users on those pages always need the modal immediately. Only the `Navbar.tsx` import should be made dynamic.
- **Compromise:** None with hover preload. First click is instant because chunk loads during hover.
- **Measure:** `npm run analyze` — AuthModal in separate lazy chunk.

### 6. 🟡 lucide-react Barrel Import ✅ **DONE**

- **File:** `src/components/RecentlySoldFeedClient.tsx`
- **Impact:** This was the ONLY `lucide-react` import in the entire app. The rest use custom `Icons.tsx` inline SVGs.
- **Fix:** Replaced `BadgeCheck` with `VerifiedIcon` from `@/components/ui/Icons`. 

### 7. ⛔ Algolia Search is Client-Only (Skeleton First Load)

- **File:** `src/app/(site)/vysledky/AlgoliaSearchPageClient.tsx`
- **Impact:** Navigation to `/vysledky`: HTML → JS download → JS parse → Algolia API → render. 500-1500ms skeleton.
- **Fix:** Use `InstantSearchNext` from `react-instantsearch-nextjs` (already in `package.json` as `^1.0.15`!) instead of `InstantSearch` from `react-instantsearch`.
- **Current import to change:**
  ```tsx
  // BEFORE (AlgoliaSearchPageClient.tsx, line 14):
  import { InstantSearch } from "react-instantsearch";
  // AFTER:
  import { InstantSearchNext } from "react-instantsearch-nextjs";
  ```
- **Important — this is NOT a simple import swap.** The page structure needs to change:
  1. The parent `page.tsx` for `/vysledky` should do the server-side Algolia query.
  2. `InstantSearchNext` replaces `InstantSearch` in the component and requires `serverState` and `serverUrl` props to hydrate correctly.
  3. The component can remain `"use client"` — `InstantSearchNext` handles the SSR/hydration bridge internally.
  4. Refer to the [`react-instantsearch-nextjs` docs](https://www.algolia.com/doc/guides/building-search-ui/going-further/server-side-rendering/react/#with-nextjs) for the exact pattern.
- **How it works:** Server queries Algolia, renders HTML with results, sends to browser. User interactions (filtering, sorting, pagination) stay client-side. Only the INITIAL load is server-rendered.
- **Compromise:** +30-50ms TTFB (server waits for Algolia). But eliminates 500-1500ms skeleton. Massive net win.
- **Measure:** View source of `/vysledky` — should see actual car card HTML, not skeleton divs.

### 8. 🔴 Supabase Data Not Cached Between Visitors

- **Files:** `src/lib/supabase/cached.ts` — `getFeaturedCars()` (line 74), `getRecentlySoldCars()` (line 164)
- **Impact:** Both functions are currently wrapped with `React.cache()` (imported from `"react"`). This deduplicates within a single server request but does NOT cache across requests/visitors. The `anon.ts` sets `next: { revalidate: 300 }` on fetch, but Supabase JS client uses POST requests — **Next.js only caches GET requests** in the fetch cache. So cross-visitor caching is not working.
- **Fix — step by step:**
  1. In `cached.ts`, replace `import { cache } from "react"` with `import { unstable_cache } from "next/cache"`.
  2. Replace the `cache()` wrapper with `unstable_cache()`. The inner async function (the Supabase query) stays the same:
  ```ts
  import { unstable_cache } from "next/cache";

  export const getFeaturedCars = unstable_cache(
    async (): Promise<FeaturedCar[]> => {
      // ... existing Supabase query code stays exactly the same ...
    },
    ["featured-cars"],
    { revalidate: 300, tags: ["featured-cars"] }
  );

  export const getRecentlySoldCars = unstable_cache(
    async (): Promise<SoldCar[]> => {
      // ... existing Supabase query code stays exactly the same ...
    },
    ["sold-cars"],
    { revalidate: 300, tags: ["sold-cars"] }
  );
  ```
  3. When implementing Item #24 (on-demand revalidation), add `revalidateTag("featured-cars")` and `revalidateTag("sold-cars")` in your ad update/sold API routes so caches are purged instantly when data changes.
- **Compromise:** Up to 5 min staleness for cold caches. Instant updates when combined with Item #24's `revalidateTag()`.
- **Measure:** Add `console.log("cache-miss", Date.now())` inside the cached function. Should NOT re-log on every request.

### 9. 🟡 Missing Preconnect to Algolia and Supabase ✅ **DONE**

- **File:** `src/app/layout.tsx`
- **Impact:** First API calls were paying a DNS+TCP+TLS penalty (~100-200ms).
- **Fix:** Added precise `<link rel="preconnect">` and `dns-prefetch` attributes directly into the HTML head tag for both Supabase and Algolia edge domains.

### 10. 🟡 HomeSearchFilters — Optimize for Instant Homepage→Results Transition

- **File:** `src/components/HomeSearchFilters.tsx` (601 lines, `"use client"`)
- **Context:** This component is fully functional but currently not imported anywhere. It will be integrated into the SSR homepage (after Item #1). It has a `useEffect` (line 220-223) that fires `searchWithFilters()` via Algolia within 220ms of mount to populate facet dropdowns (brands, fuels, transmissions, models) and result count.
- **Current issue:** On mount, it immediately fires an Algolia API call to get facet counts. This happens before the user touches anything — wasted request.
- **Fix:** Pre-fetch facet data server-side and pass as props (initial brands, fuels, transmissions, counts). Add props like `initialBrands`, `initialFuels`, `initialTransmissions`, `initialCount` to the component. The component hydrates with data already present — no initial Algolia call needed. User interactions trigger client-side updates.
- **For instant page transition:** Use Next.js `router.push()` with URL search params to navigate to `/vysledky`. Share filter state between homepage and results page via URL params + `useSearchParams()`. The search results page picks up the filters from the URL and renders instantly (especially with Algolia SSR from #7). *(Note: `shallow` routing does not exist in App Router — use URL params instead.)*
- **Compromise:** Server-side facet data may be up to 5 min stale (via `unstable_cache`). User will see fresh counts once they interact.
- **Measure:** Network tab — no Algolia request on initial homepage load.

### 11. 🟢 Custom LazyImage Adds JS Overhead

- **File:** `src/components/LazyImage.tsx`
- **Impact:** Creates IntersectionObserver + React state per image instance. Minor overhead, but `<Image loading="lazy">` from Next.js does the same thing with zero JS cost (browser-native).
- **Fix:** Replace with `<Image loading="lazy" />`. For fade-in effect, use `onLoad` callback + CSS transition.
- **Compromise:** Lose custom `threshold` and `rootMargin` control. Browser defaults are fine for nearly all cases.
- **Measure:** Coverage tab — LazyImage code gone.

### 12. 🟡 Homepage Uses Hardcoded Fake Cars

- **File:** `src/app/page.tsx` — `FEATURED_CARS` constant (line 210) with hardcoded placeholder data (`/placeholder-car.jpg` images)
- **Impact:** Users see fake placeholder images and hardcoded car data ("Volkswagen Golf VII", "12,900 EUR", etc.). Meanwhile, `src/components/FeaturedCars.tsx` and `src/components/RecentlySoldFeed.tsx` already exist as Server Components with real Supabase data (via `cached.ts`) but aren't used because the homepage is `"use client"`.
- **Fix:** When converting homepage to SSR (#1), remove the `FEATURED_CARS` constant and embed `<FeaturedCars />` and `<RecentlySoldFeed />` directly. Real data, server-rendered, zero client fetch.
- **Cleanup:** Also remove the `FeaturedCar` type (line 44-53) and the `FEATURED_CARS` array (lines 210-241) from `page.tsx` — they become dead code once the real components are used.
- **Compromise:** None. Real data is better for users and SEO.

### 13. 🟢 Unused Font Files (653KB of Dead Weight) ✅ **DONE**

- **Files:** `/public/fonts/*`
- **Impact:** These were not referenced anywhere in the codebase.
- **Fix:** Deleted the files.

### 14. 🟢 SearchPageClient is a Pointless Wrapper ✅ **DONE**

- **File:** `src/app/(site)/vysledky/SearchPageClient.tsx`
- **Impact:** Added an unnecessary React chunk boundary.
- **Fix:** Removed the wrapper file and imported `AlgoliaSearchPageClient` directly.

### 15. 🟡 useSavedAd Hook — Batch at Scale

- **File:** `src/hooks/useSavedAd.ts` — used in `src/components/search/CarHit.tsx` (line 36) and `src/components/FeaturedCarsClient.tsx` (line 26)
- **Impact:** Each car card creates its own hook instance. For anonymous visitors (majority): no query fires, `saved` defaults to `false`. For logged-in users: at 24 results = 24 potential Supabase checks. Not critical today, but N+1 at scale.
- **Fix — step by step:**
  1. Modify `src/context/AuthContext.tsx`: when user logs in, fetch all `saved_ads` IDs for that user in a single query. Store as `savedAdIds: Set<string>` in context.
  2. Expose `savedAdIds` from `useAuth()` hook.
  3. In `CarHit.tsx` and `FeaturedCarsClient.tsx`, check `savedAdIds.has(adId)` instead of making individual Supabase queries per card.
  4. The `useSavedAd` hook still needs Supabase for the **toggle** action (save/unsave), but the initial check is now instant from context.
- **Compromise:** None. Fewer DB queries for logged-in users.
- **Measure:** Network tab (logged in) — should see 1 `saved_ads` query on login instead of N queries per page.

---

## PART 2: Asset & Infrastructure Fixes (Items 16-21)

### 16. 🔴 Hero Images Are Unoptimized JPGs (1.8MB Total)

- **Files:** `public/hero-forest-champagne.jpg` (552KB), `public/hero-indigo-coral.jpg` (479KB), `public/hero-charcoal-red-orange.jpg` (332KB), `public/hero-teal-burnt-orange.jpg` (310KB), `public/hero-navy-amber.jpg` (124KB)
- **Impact:** The hero image is the LCP element (marked `priority` in Next.js). Next.js `<Image>` optimizes on the fly, but source size still affects build time and initial cache misses.
- **Fix:** Convert to WebP at source using `cwebp` (50-70% smaller), or move to Cloudflare Images (you already use it for car photos — edge-cached, automatic format negotiation).
- **Compromise:** None. Identical visual quality at much smaller size.
- **Measure:** Network tab — hero image transfer size before vs after.

### 17. 🔴 Vercel Function Region Checked ✅ **DONE**

- **Impact:** Prevents 100ms+ roundtrip latencies to fallback US data centers.
- **Fix:** Hardcoded `fra1` (Frankfurt) into `vercel.json` regions array.

### 18. 🔴 Cloudflare Worker Edge Cache for Algolia

- **Decision:** Algolia stays. Add Cloudflare Worker as caching proxy.
- **How it works:**
  1. Browser sends search request to Cloudflare Worker (at edge, ~2-5ms from user)
  2. Worker checks cache. If hit → return instantly (<10ms total)
  3. If miss → forward to Algolia Amsterdam (~40-50ms), cache response, return
  4. Cache TTL: 30-60 seconds. Popular queries like "BMW", "diesel automatic", no-filter browse = high cache hit rate (60-80%)
- **Cost:** $0 (Cloudflare Workers free tier: 100K requests/day)
- **Effort:** Few hours to build and deploy the Worker
- **Compromise:** Up to 60 seconds stale for cached queries. New ads don't appear in cached results immediately. Acceptable for car marketplace.
- **Measure:** Worker analytics dashboard shows cache hit rate. Network tab shows response time.

### 19. 🟡 Supabase Cache Strategy — unstable_cache over Redis *(context for Item #8, no separate implementation)*

- **Context:** Upstash Redis is installed in `package.json` but NOT configured (no env vars set). Rate limiting fails open silently.
- **Decision:** Use `unstable_cache()` from Next.js for Supabase data caching. The actual code changes are done in **Item #8** — this item just documents the architectural rationale. No separate implementation needed.
- **Future:** When you need cross-region edge caching or real-time cache invalidation, set up Upstash Redis (free tier: 10K commands/day). But don't add infrastructure complexity until needed.
- **Compromise:** `unstable_cache` is tied to the Vercel function region. If you later add Edge Runtime or multiple regions, you'll need Redis.

### 20. 🟡 Verify Database Indexes at Scale

- **Context:** Supabase adds indexes automatically for primary keys and foreign keys. Your current queries use standard patterns that likely already have indexes.
- **Action:** When approaching 50K+ ads, check Supabase dashboard → SQL Editor → run `EXPLAIN ANALYZE` on your critical queries:
  - `SELECT * FROM ads WHERE brand = X AND status = 'active' ORDER BY created_at DESC`
  - `SELECT * FROM ads WHERE id = X` (single ad)
  - `SELECT * FROM saved_ads WHERE user_id = X`
- **If any show sequential scan:** Add composite indexes:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_ads_brand_status_created ON ads(brand, status, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_ads_status_featured ON ads(status, is_featured) WHERE is_featured = true;
  ```
- **Compromise:** None. Indexes are free for reads.

### 21. ✅ CSS scroll-behavior: smooth — Keep As-Is

- **Context:** `scroll-behavior: smooth` in CSS only affects anchor link (`#id`) navigation, not Next.js page transitions.
- **Impact:** Zero effect on TTFB, LCP, or page load performance.
- **Action:** No change needed. Keep as-is.

---

## PART 3: Architecture Improvements (Items 22-28)

### 22. 🔴 Partial Pre-Rendering (PPR)

- **Prerequisite:** Implement #1 (SSR homepage) and #25 (Streaming SSR) first. PPR builds on top of these.
- **Impact:** Static shell (hero, navigation, footer) served from CDN in ~5ms. Dynamic parts (auth state, personalized content) stream in after.
- **Fix:** Enable in `next.config.ts`:
  ```ts
  experimental: { ppr: true }
  ```
  Then add `<Suspense>` boundaries around dynamic sections.
- **Compromise:** Experimental feature in Next.js. Test thoroughly before production.
- **Measure:** TTFB should drop to near-zero for static portions.

### 23. 🔴 Speculation Rules for Instant Navigation

- **Impact:** Browser pre-renders pages when user hovers a link. Navigation appears instant (0ms).
- **Fix:** Add to layout.tsx `<head>`:
  ```html
  <script type="speculationrules">
  {
    "prefetch": [{ "where": { "href_matches": ["/auto/*", "/vysledky*"] } }],
    "prerender": [{ "where": { "and": [
      { "href_matches": "/auto/*" },
      { "selector_matches": ".car-card-link" }
    ] } }]
  }
  </script>
  ```
- **Strategy:** Use `prefetch` (lightweight) for most links. Use `prerender` (full pre-render) only for car detail links that the user is likely to click (e.g., first few search results). This avoids aggressive bandwidth usage.
- **Compromise:** Chrome 108+ only (~70% market share). Progressive enhancement — no harm to other browsers.
- **Measure:** Chrome DevTools → Application → Speculative loads.

### 24. 🔴 ISR with On-Demand Revalidation for Car Details

- **Current state:** `src/app/(site)/auto/[id]/page.tsx` already has `revalidate = 600` (10 min ISR). Pages are cached after first visit. This is partially working.
- **Problem:** When an ad is sold or updated, it takes up to 10 minutes to reflect. At 150K ads, using `generateStaticParams` to pre-build pages would make builds extremely slow.
- **Fix:** Keep current ISR. Add on-demand revalidation:
  ```ts
  // In your ad update API route:
  import { revalidatePath } from "next/cache";
  revalidatePath(`/auto/${adId}`);
  ```
  When an ad is updated/sold, the cache is immediately purged. Next visitor gets a fresh build.
- **Compromise:** None. Better than current setup — instant updates when needed, cached otherwise.

### 25. 🔴 Streaming SSR with Suspense Boundaries

- **Impact:** Instead of server waiting for ALL data before sending HTML, stream sections as they resolve. Browser starts rendering immediately — even before DB queries finish.
- **Fix:** On the SSR-converted homepage:
  ```tsx
  // Static shell renders instantly
  <HeroSection />
  <HomeSearchForm />

  // Data sections stream in as they resolve
  <Suspense fallback={<FeaturedCarsSkeleton />}>
    <FeaturedCars />
  </Suspense>
  <Suspense fallback={<RecentlySoldSkeleton />}>
    <RecentlySoldFeed />
  </Suspense>
  ```
- **Compromise:** User briefly sees skeleton for data sections (milliseconds, not seconds). But the page is interactive much faster.
- **Measure:** DevTools → check for chunked transfer encoding. TTFB for first byte should be very fast.

### 26. 🟡 content-visibility: auto for Below-the-Fold

- **Impact:** Browser skips layout/paint for off-screen sections until user scrolls near them.
- **Fix:** Add to CSS for major below-fold sections:
  ```css
  .section {
    content-visibility: auto;
    contain-intrinsic-size: 0 500px;
  }
  ```
- **Compromise:** None visually. `contain-intrinsic-size` prevents scroll bar instability.
- **Measure:** Performance tab → initial rendering time drops.

### 27. 🟡 Service Worker for Repeat Visit Caching

- **Impact:** Every repeat visit currently re-downloads HTML, CSS, JS from network.
- **Fix:** Register a service worker that caches the App Shell (HTML skeleton, CSS, JS bundles, fonts). Second visit serves from cache in <10ms, then updates in background (stale-while-revalidate strategy).
- **Compromise:** Cache invalidation adds complexity. Service worker bugs can be hard to debug. Implement after all other items are stable.
- **Measure:** First visit vs second visit — second should show near-zero network time.

### 28. 🟡 Preload Critical Hero Image

- **Impact:** Even with SSR, the browser starts downloading the hero image only after parsing the HTML and finding the `<img>` tag. Adding a preload hint tells the browser to start the download immediately.
- **Fix:** Add to `<head>` in layout.tsx (or homepage-specific head):
  ```html
  <link rel="preload" as="image" href="/hero-default.webp" fetchpriority="high" />
  ```
  For dynamic hero images (theme-dependent), use the default/most-common theme's hero image.
- **Compromise:** Wastes bandwidth if user sees a different theme's hero. Pick the most common one.
- **Measure:** Network waterfall — hero image download should start in parallel with CSS, not after.

---

## Implementation Phases

| Phase | Items | Expected Impact |
|-------|-------|-----------------|
| **Phase 0: Quick Wins** | *(Completed)* ~#3, #6, #9, #13, #14, #17~ | Removed dead weight |
| **Phase 1: SSR conversion** | #1 (home SSR), #2 (car detail), #4 (remove framer-motion), #5 (lazy AuthModal), #12 (real data) | **LCP drops 1-3 seconds on every page** |
| **Phase 2: Data layer** | #7 (Algolia SSR), #8 (Supabase cache), #10 (facets), #15 (batch saved ads) | Faster data, no skeletons |
| **Phase 3: Edge & caching** | #16 (hero images), #18 (CF Worker), #28 (preload hero) | Edge-fast search, optimized assets |
| **Phase 4: Advanced** | #22 (PPR), #23 (Speculation), #24 (Revalidation), #25 (Suspense), #26 (CSS), #27 (SW) | Perceived instant everything |

**After each phase:** Run `npm run build` to verify no build errors. Run Lighthouse on mobile. Compare LCP/TTFB to the targets at the top of this document.

---

## Summary Table (28 items, 7 done / 21 todo)

| # | Issue | Category | Priority | Status |
|---|-------|----------|----------|--------|
| 1 | Homepage `"use client"` — SSR conversion | Code | ⛔ Critical | Todo |
| 2 | CarDetail double-fetches data | Code | ⛔ Critical | Todo |
| 3 | ThemePreviewShell Ships Dev UI | Code | ⛔ Critical | ✅ Done |
| 4 | Remove framer-motion | Code | 🔴 High | Todo |
| 5 | Lazy-load AuthModal | Code | 🔴 High | Todo |
| 6 | lucide-react Barrel Import | Code | 🟡 Medium | ✅ Done |
| 7 | Algolia SSR (InstantSearchNext) | Code | ⛔ Critical | Todo |
| 8 | Supabase cache with unstable_cache | Code | 🔴 High | Todo |
| 9 | Missing Preconnect Headers | Code | 🟡 Medium | ✅ Done |
| 10 | Pre-fetch facets server-side | Code | 🟡 Medium | Todo |
| 11 | Custom LazyImage overhead | Code | 🟢 Low | Todo |
| 12 | Real data on homepage | Code | 🟡 Medium | Todo |
| 13 | Unused Font Files | Assets | 🟡 Medium | ✅ Done |
| 14 | Pointless SearchPageClient wrapper | Code | 🟢 Low | ✅ Done |
| 15 | useSavedAd N+1 (batch at scale) | Code | 🟡 Medium | Todo |
| 16 | Unoptimized hero images | Assets | 🔴 High | Todo |
| 17 | Vercel Function Region | Infra | 🔴 High | ✅ Done |
| 18 | Cloudflare Worker edge cache | Infra | 🔴 High | Todo |
| 19 | Supabase cache strategy (context for #8, no separate work) | Infra | 🟡 Medium | ℹ️ Context only |
| 20 | Verify DB indexes when scaling | Infra | 🟡 Medium | Todo (at scale) |
| 21 | CSS scroll-behavior — keep as-is | CSS | ✅ No action | Done |
| 22 | Partial Pre-Rendering (PPR) | Arch | 🔴 High | Todo |
| 23 | Speculation Rules for instant nav | Arch | 🔴 High | Todo |
| 24 | ISR with on-demand revalidation | Arch | 🔴 High | Todo |
| 25 | Streaming SSR with Suspense | Arch | 🔴 High | Todo |
| 26 | `content-visibility: auto` | CSS | 🟢 Low | Todo |
| 27 | Service Worker for repeat visits | Arch | 🟡 Medium | Todo |
| 28 | Preload critical hero image | Assets | 🟡 Medium | Todo |
