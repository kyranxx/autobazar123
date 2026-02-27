# Performance Blueprint - Autobazar123 (150K Ads, Lowest-ms Plan)

> Goal: Load any subpage and any search/sort result in the lowest possible milliseconds, even at 150,000 ads.
>
> Date: 2026-02-27
>
> Strategy: Keep Algolia for search, add edge caching in Cloudflare Worker, enforce SSR-first rendering for first paint, and use strict cache invalidation so data stays trustworthy.

---

## 1) Executive Decision

We should not implement every optimization at once.

We should implement in strict sequence:
1. Fix rendering and duplicate-fetch bottlenecks.
2. Add resilient caching and invalidation.
3. Add edge acceleration and scale hardening.
4. Add advanced features only after baseline is stable.

This is the fastest path with the lowest regression risk.

---

## 2) Target SLOs (Production, EU Users, Mobile Mid-tier)

| Surface | p50 | p95 | Hard limit |
|---|---:|---:|---:|
| Homepage LCP | <= 1.0s | <= 1.8s | <= 2.2s |
| Car detail LCP | <= 0.9s | <= 1.6s | <= 2.0s |
| Search first paint (SSR HTML) | <= 0.9s | <= 1.5s | <= 1.9s |
| Search interaction (cached query) | <= 15ms | <= 40ms | <= 60ms |
| Search interaction (fresh query) | <= 45ms | <= 90ms | <= 130ms |
| Route transition (likely next click) | <= 80ms | <= 160ms | <= 250ms |
| INP | <= 120ms | <= 200ms | <= 250ms |
| CLS | <= 0.03 | <= 0.08 | <= 0.10 |

---

## 3) Current Reality Snapshot (Repo-verified)

1. Search page is still client-first (`InstantSearch` from `react-instantsearch`), not SSR-first.
2. Car detail page server fetches metadata data and client re-fetches full data (double fetch pattern remains).
3. `increment_ad_views` is still called in client `useEffect` before main client query.
4. Navbar still eagerly imports `AuthModal`.
5. Supabase "cached" helpers still use `React.cache` (request dedupe only), not cross-request cache.
6. `LazyImage` custom IntersectionObserver is still used in featured cards.
7. Preconnect in layout currently targets image delivery host; Algolia and Supabase preconnect links are not fully represented in layout head.
8. Cloudflare worker currently exists for cron orchestration, not for Algolia edge search proxy caching.
9. `vercel.json` region pin (`fra1`) is already in place.
10. Important note: homepage migration is in-flight in local working tree (`src/app/page.tsx` currently deleted in git status), so homepage ownership/path must be finalized before applying homepage-specific work items.

---

## 4) Collision and Compromise Matrix

| Topic | Collision Risk | Required Compromise | Decision |
|---|---|---|---|
| Aggressive cache vs data freshness | High | Small staleness window (30-120s) | Accept with instant invalidation on critical writes |
| Client-only search UX vs SSR search | Medium | Slightly higher TTFB on cold query | Accept, SSR first paint is a bigger win |
| Global no-cache headers vs PPR/edge benefits | High | Revisit blanket no-cache usage for pages that can be cached safely | Required before advanced caching |
| Service worker vs auth-sensitive pages | Medium | Scope SW caching to safe assets/routes only | Defer SW until cache discipline is stable |
| Speculation/prerender vs bandwidth | Medium | Restrict prerender to high-probability links | Accept with strict selector-based targeting |
| Experimental PPR vs stability | Medium | Roll out behind flag and A/B | Defer until baseline stable |

---

## 5) Core Architecture for 150K Ads

### Search Path (Final)
1. Browser requests search via Cloudflare Worker endpoint.
2. Worker normalizes query and cache key.
3. If cache hit: return edge response in single-digit/low-double-digit ms.
4. If miss: forward to Algolia (EU region), cache response with short TTL and stale-if-error.
5. UI hydrates SSR output and keeps interactive filtering client-side.

### Listing Detail Path (Final)
1. Server fetches full ad payload once.
2. Server renders HTML for first paint.
3. Client hydrates only interactive islands.
4. View increment runs fire-and-forget and never blocks UI.

### Homepage Path (Final)
1. Server renders hero + primary content + real listings.
2. Interactive widgets stay in isolated client islands.
3. No fake data, no unnecessary runtime-heavy client shell.

---

## 6) Priority Roadmap (Reordered for Lowest Risk/Highest Gain)

## Phase A - Foundation and Truth (must do first)
1. Finalize homepage route ownership (resolve in-progress `src/app/page.tsx` removal/refactor).
2. Establish production SLO dashboard (LCP/INP/TTFB by route, p50/p95).
3. Freeze performance budgets in CI gates (bundle size, JS execution time, route regressions).

## Phase B - Rendering and Payload Wins
1. Convert homepage to SSR shell with client islands.
2. Remove car detail double fetch; server fetch once and pass data to client component.
3. Move view increment to non-blocking API call.
4. Replace framer-motion where pure CSS gives equal UX.
5. Lazy-load navbar AuthModal with hover preload.
6. Replace custom `LazyImage` in featured cards with native lazy `<Image>` pattern.
7. Replace homepage fake cards with real server components.

## Phase C - Search and Cache Discipline
1. Move `/vysledky` first load to SSR with `react-instantsearch-nextjs`.
2. Replace `React.cache` with `unstable_cache` for shared reads.
3. Add tag/path invalidation when ads are sold/updated/approved/rejected.
4. Batch saved ads state in auth context to remove N+1 card checks.
5. Prefetch facets server-side for homepage filters (remove mount-time query spam).

## Phase D - Edge and Scale Hardening
1. Build Cloudflare Worker search proxy with cache keys normalized.
2. Add stale-while-revalidate and stale-if-error behavior at worker layer.
3. Convert hero images to modern formats and add deterministic preload.
4. Add query warmup for top searches from logs.
5. Verify DB indexes with `EXPLAIN ANALYZE` at 50K+ and again at 120K+.
6. Tune Algolia replicas and sortable attributes for high-frequency sort paths.

## Phase E - Advanced (only after stable baseline)
1. Streaming SSR and strategic Suspense boundaries.
2. Speculation rules (prefetch broad, prerender narrow).
3. PPR behind feature flag.
4. Service worker for repeat-visit shell caching (strict route allowlist).
5. `content-visibility: auto` for below-fold non-critical sections.

---

## 7) Updated Status of Existing 28 Items

Legend: `Done`, `Todo`, `Partial`, `Context only`, `Deferred`.

| # | Item | Updated Status |
|---|---|---|
| 1 | Homepage SSR conversion | Todo (homepage route currently in refactor state) |
| 2 | Car detail double fetch | Todo |
| 3 | Theme preview dev UI in prod | Done |
| 4 | Remove framer-motion where replaceable | Todo |
| 5 | Lazy-load AuthModal | Todo |
| 6 | lucide-react import cleanup | Done |
| 7 | Algolia SSR first load | Todo |
| 8 | Supabase shared cache (`unstable_cache`) | Todo |
| 9 | Preconnect headers | Partial (image host present; verify Algolia+Supabase) |
| 10 | Homepage filter facet prefetch | Todo |
| 11 | Custom LazyImage overhead | Todo |
| 12 | Real homepage data instead of placeholders | Todo |
| 13 | Unused font cleanup | Done |
| 14 | Search wrapper cleanup | Done |
| 15 | Saved ads N+1 batching | Todo |
| 16 | Hero image optimization | Todo |
| 17 | Vercel region pin | Done |
| 18 | Cloudflare Worker edge cache for search | Todo (current worker is cron-focused) |
| 19 | Cache strategy rationale | Context only |
| 20 | DB index verification at scale | Todo (scale milestone) |
| 21 | Keep smooth scroll behavior | Done (no action) |
| 22 | PPR | Deferred (after stable baseline) |
| 23 | Speculation rules | Deferred (after stable baseline) |
| 24 | On-demand revalidation | Todo |
| 25 | Streaming SSR | Deferred (after core SSR cleanup) |
| 26 | `content-visibility` for below fold | Deferred/Low |
| 27 | Service worker | Deferred |
| 28 | Hero preload | Todo |

---

## 8) New Recommendations Added (Beyond the Original 28)

1. Query normalization in worker cache key:
   - lowercase query
   - sort filter keys
   - strip non-semantic params
   - canonicalize pagination params
   This alone can materially improve cache hit rate.

2. Stale-if-error fallback at edge:
   - if Algolia or upstream fails temporarily, serve last good cached response for a short window.

3. Negative caching for empty/rare results:
   - short TTL (5-15s) for no-hit queries to protect upstream from repetitive misses.

4. Algolia payload minimization:
   - strict `attributesToRetrieve`
   - avoid returning large fields on search cards
   - fetch heavy detail fields only on detail page.

5. Top-query warming:
   - prefetch top N query+filter combinations every few minutes from analytics logs.

6. Performance budgets as release gates:
   - block release if p95 route budgets regress by defined thresholds.

7. Route-level cache policy matrix:
   - explicitly classify each route as `private`, `shared-cacheable`, or `edge-cacheable`.
   - avoid global blanket policy that nullifies caching gains.

8. Bot/rate-limit hardening for search endpoints:
   - edge-level rate limits and abuse filters to protect latency for real users.

---

## 9) What Must Be Done Manually (Owner Tasks)

1. Cloudflare account setup and secret management for search worker deployment.
2. Algolia dashboard/index settings (replicas, ranking, searchable/sortable attributes).
3. Supabase `EXPLAIN ANALYZE` checks and index rollout approvals.
4. Real-device performance validation on target networks (not only local dev).
5. Production SLO sign-off and rollback thresholds.
6. Final decision on acceptable staleness windows per route (search/results/detail/home).

---

## 10) Verification Protocol per Phase

After each phase:
1. Run build and lint/type checks.
2. Run mobile Lighthouse on homepage, search, and detail page.
3. Record p50/p95 metrics before/after and keep evidence.
4. Verify no SEO regressions (SSR HTML presence for homepage/search/detail).
5. Validate freshness behavior for ad update/sold flows.

No phase is "done" without measurable proof.

---

## 11) Bottom Line

To hit lowest-ms behavior at 150,000 ads:
1. Prioritize SSR-first rendering and duplicate-fetch removal.
2. Add strict cache invalidation and edge caching with normalized keys.
3. Treat advanced features (PPR/speculation/SW) as optional accelerators after stability.

This keeps performance fast, consistent, and trustworthy at marketplace scale.

