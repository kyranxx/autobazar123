# Performance Blueprint - Autobazar123 (150K Ads, Lowest-ms Plan)

> Goal: Load any subpage and any search/sort result in the lowest possible milliseconds, even at 150,000 ads.
>
> Date: 2026-02-27
>
> Strategy: Keep Algolia for search, enforce SSR-first rendering for first paint, and use strict cache invalidation so data stays trustworthy.

---

## 1) Executive Decision

We should not implement every optimization at once.

We should still work in priority order:
1. Fix rendering and duplicate-fetch bottlenecks.
2. Add resilient caching and invalidation.
3. Add edge acceleration and scale hardening.
4. Add advanced features behind feature flags when useful.

Rollout mode is intentionally not fixed. Production release style is decided per change window by owner.

### Locked Product Decisions (Confirmed)
1. Primary objective: balanced optimization (search speed + page load speed).
2. Search freshness tolerance: cache-friendly window up to 60s, with on-demand invalidation so new/updated ads usually propagate in seconds.
3. Upstream outage behavior: serve stale cached results instead of hard error when possible.
4. Advanced features: allowed now, but safely gated with feature flags.
5. Homepage direction: keep current concept and optimize for maximum speed.
6. Launch policy: hard gate for full launch; do not fully launch until p95 targets are proven.

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
2. Car detail page now fetches full payload on the server and hydrates the client without a second full data query (`updated: 2026-02-27`).
3. `increment_ad_views` now runs as a non-blocking fire-and-forget call after hydration (`updated: 2026-02-27`).
4. Navbar now lazy-loads `AuthModal` with intent preload (`hover`/`focus`) instead of eager import (`updated: 2026-02-27`).
5. Supabase "cached" helpers now use `unstable_cache` with short revalidation and explicit tags for shared cross-request reads (`updated: 2026-02-27`).
6. Featured cards now use native `next/image` lazy loading; custom `LazyImage` wrapper was removed (`updated: 2026-02-27`).
7. Layout head now includes origin-aware preconnect/dns-prefetch for image delivery, Algolia DSN, and Supabase (`updated: 2026-02-27`).
8. Cloudflare worker currently exists for cron orchestration, not for Algolia edge search proxy caching.
9. `vercel.json` region pin (`fra1`) is already in place.
10. Homepage route ownership is now explicit: `src/app/page.tsx` is server-owned entrypoint and interactive homepage logic lives in `src/components/home/HomePageClient.tsx` (`updated: 2026-02-27`).
11. Production SLO dashboard baseline is now wired: web-vitals (`LCP`/`INP`/`TTFB`) are ingested into `system_logs` and surfaced in admin overview as route-level `p50`/`p95` (`updated: 2026-02-27`).
12. Performance budgets are now frozen in CI gates: webapp audit emits JS transfer and main-thread timing, and policy enforcement blocks bundle-size/JS-execution/route-regression violations (`updated: 2026-02-27`).
13. Homepage now renders as an SSR shell (`src/components/home/HomePageShell.tsx`) with isolated client islands for account menu and search form interactivity, and it now includes real featured/recent server listings with no demo placeholder fallback (`updated: 2026-02-27`).

---

## 4) Collision and Compromise Matrix

| Topic | Collision Risk | Required Compromise | Decision |
|---|---|---|---|
| Aggressive cache vs data freshness | High | Small staleness window (30-120s) | Accept with instant invalidation on critical writes |
| Client-only search UX vs SSR search | Medium | Slightly higher TTFB on cold query | Accept, SSR first paint is a bigger win |
| Global no-cache headers vs PPR/edge benefits | High | Revisit blanket no-cache usage for pages that can be cached safely | Required before advanced caching |
| Service worker vs auth-sensitive pages | Medium | Scope SW caching to safe assets/routes only | Defer SW until cache discipline is stable |
| Speculation/prerender vs bandwidth | Medium | Restrict prerender to high-probability links | Accept with strict selector-based targeting |
| Experimental PPR vs stability | Medium | Roll out behind flag and A/B | Allowed early behind flags; full rollout only after metrics pass |

---

## 5) Core Architecture for 150K Ads

### Search Path (Final)
1. Browser requests search via the application search endpoint.
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

Note: phases are technical ordering guidance, not mandatory release buckets. Owner decides what goes to production each time.

## Phase A - Foundation and Truth (must do first)
1. Finalize homepage route ownership (resolve in-progress `src/app/page.tsx` removal/refactor).
2. Establish production SLO dashboard (LCP/INP/TTFB by route, p50/p95). Done (`2026-02-27`); continue tuning thresholds and alerting.
3. Freeze performance budgets in CI gates (bundle size, JS execution time, route regressions). Done (`2026-02-27`).

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
1. Build a search proxy layer with normalized cache keys (if edge cache is introduced).
2. Add stale-while-revalidate and stale-if-error behavior at worker layer.
3. Convert hero images to modern formats and add deterministic preload.
4. Add query warmup for top searches from logs.
5. Verify DB indexes with `EXPLAIN ANALYZE` at 50K+ and again at 120K+.
6. Tune Algolia replicas and sortable attributes for high-frequency sort paths.

## Phase E - Advanced Accelerators (feature-flagged)
1. Streaming SSR and strategic Suspense boundaries.
2. Speculation rules (prefetch broad, prerender narrow).
3. PPR behind feature flag.
4. Service worker for repeat-visit shell caching (strict route allowlist).
5. `content-visibility: auto` for below-fold non-critical sections.

---

## 7) Updated Status of Existing 28 Items

Active queue legend: `Todo`, `Partial`, `Context only`, `Deferred`.

| # | Active Item | Updated Status |
|---|---|---|
| 1 | Homepage SSR conversion | Done (`2026-02-27`) |
| 7 | Algolia SSR first load | Todo |
| 10 | Homepage filter facet prefetch | Todo |
| 12 | Real homepage data instead of placeholders | Done (`2026-02-27`) |
| 15 | Saved ads N+1 batching | Todo |
| 16 | Hero image optimization | Todo |
| 18 | Edge cache for search proxy | Todo (not active) |
| 19 | Cache strategy rationale | Context only |
| 20 | DB index verification at scale | Todo (scale milestone) |
| 22 | PPR | Todo (feature-flagged rollout) |
| 23 | Speculation rules | Todo (feature-flagged rollout) |
| 24 | On-demand revalidation | Todo |
| 25 | Streaming SSR | Todo (feature-flagged rollout) |
| 26 | `content-visibility` for below fold | Deferred/Low |
| 27 | Service worker | Todo (feature-flagged rollout) |
| 28 | Hero preload | Todo |

<details>
<summary>Archived Completed Items (12)</summary>

| # | Completed Item | Completion |
|---|---|---|
| 2 | Car detail double fetch | Done (`2026-02-27`) |
| 3 | Theme preview dev UI in prod | Done |
| 4 | Remove framer-motion where replaceable | Done (`2026-02-27`) |
| 5 | Lazy-load AuthModal | Done (`2026-02-27`) |
| 6 | lucide-react import cleanup | Done |
| 8 | Supabase shared cache (`unstable_cache`) | Done (`2026-02-27`) |
| 9 | Preconnect headers | Done (`2026-02-27`) |
| 11 | Custom LazyImage overhead | Done (`2026-02-27`) |
| 13 | Unused font cleanup | Done |
| 14 | Search wrapper cleanup | Done |
| 17 | Vercel region pin | Done |
| 21 | Keep smooth scroll behavior | Done (no action) |

</details>

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
6. Maintain and enforce the chosen staleness policy (cache-friendly window + fast invalidation).

---

## 10) Verification Protocol per Phase

After each phase:
1. Run build and lint/type checks.
2. Run mobile Lighthouse on homepage, search, and detail page.
3. Record p50/p95 metrics before/after and keep evidence.
4. Verify no SEO regressions (SSR HTML presence for homepage/search/detail).
5. Validate freshness behavior for ad update/sold flows.

No phase is "done" without measurable proof.

Full production launch is blocked until p95 targets are met on production-like mobile tests.

---

## 11) Bottom Line

To hit lowest-ms behavior at 150,000 ads:
1. Prioritize SSR-first rendering and duplicate-fetch removal.
2. Add strict cache invalidation and edge caching with normalized keys.
3. Use advanced features (PPR/speculation/SW) behind flags and graduate them only after metric validation.

This keeps performance fast, consistent, and trustworthy at marketplace scale.
