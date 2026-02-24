# Active Todo

## Task: Repair Search/Home Visual Regressions After Simplification (Now)

- [ ] Rework `/vysledky` layout so filters stay accessible but the page no longer feels broken/heavy.
- [ ] Remove sidebar inner-scroll behavior and improve filter/result visual hierarchy.
- [ ] Enrich homepage hero search block and button styling so it feels strong, not empty.
- [ ] Verify with lint + typecheck and document the outcome.

## Task: Simplify Frontpage Hero + Always-Visible Search Filters (Now)

- [x] Review current homepage hero and `/vysledky` filter layout.
- [x] Simplify homepage hero to focus on search/filters only.
- [x] Make `/vysledky` filters always visible (desktop + mobile).
- [x] Verify changes with lint + typecheck.

## Review: Simplify Frontpage Hero + Always-Visible Search Filters (Now)

- Status: Completed
- Notes:
  - Simplified homepage hero to a focused search-first block with `HomeSearchFilters`.
  - Reduced homepage complexity by removing extra decision/journey/retention sections.
  - Updated `/vysledky` layout so filter panel is always rendered, including mobile.
  - Removed collapsible filter sections so all filter groups are visible by default.
- Verification:
  - `npx eslint src/app/page.tsx src/app/vysledky/AlgoliaSearchPageClient.tsx src/components/search/FilterSidebar.tsx` passed.
  - `npx tsc --noEmit` passed.

## Task: Dashboard Ads Ordering + Edit Action (Now)

- [x] Review current user dashboard ads rendering and sorting behavior.
- [x] Update ordering so active ads are shown first.
- [x] Add a visible edit action button for each user ad row/card.
- [x] Verify with targeted checks (type/lint) and summarize outcome.

## Review: Dashboard Ads Ordering + Edit Action (Now)

- Status: Completed
- Notes:
  - Added active-first sorting helper and applied it when loading dashboard user ads.
  - Kept edit action always visible in each ad card; active-only actions (boost/mark sold) remain conditional.
- Verification:
  - `npx eslint src/app/moj-ucet/DashboardClient.tsx` passed.
  - `npx tsc --noEmit` has pre-existing unrelated failures in `src/lib/security/maintenance-bypass.test.ts` (`ProcessEnv` typing), not introduced by this dashboard change.

## Task: Implement Vendor-Applicable Fixes (Now)

- [x] Implement secure server-side contact submission endpoint (validation + sanitization + server rate limiting).
- [x] Switch contact form client to call server endpoint instead of direct anon Supabase insert.
- [x] Add Stripe webhook duplicate-event guard by `event_id` before processing.
- [x] Improve strict Upstash limiter resilience with explicit timeout configuration.
- [x] Verify with static checks and focused runtime sanity checks.

## Review: Implement Vendor-Applicable Fixes (Now)

- Status: Completed
- Notes:
  - Added new server endpoint `src/app/api/contact/route.ts` with Zod validation, sanitization, and strict rate limiting.
  - Updated contact UI client to submit via `/api/contact` instead of direct client-side Supabase writes.
  - Added Stripe webhook duplicate short-circuit using `event_id` state in `stripe_webhook_logs`.
  - Added strict limiter timeout/resilience options in `src/lib/ratelimit.ts`.
- Verification:
  - `npx tsc --noEmit` passed.
  - `npx eslint src/app/api/contact/route.ts src/app/kontakt/ContactFormClient.tsx src/app/api/stripe/webhook/route.ts src/lib/ratelimit.ts` passed.

## Task: Vendor Docs Applicability Review (Now)

- [x] Review high-impact vendor docs already downloaded for active integrations (Supabase, Algolia, Stripe, Cloudflare, Upstash, Resend).
- [x] Compare docs guidance against current implementation in code and config.
- [x] Identify concrete items that are immediately applicable now (or confirm no change needed).
- [x] Focus current audit on Stripe, Upstash, and Resend integrations, mapping docs to local implementation.
- [x] Provide prioritized recommendations with impact and effort.
  - [x] Collect Supabase-specific guidance from `docs/vendor/supabase` and `manifests/index`.
  - [x] Collect Algolia-specific guidance from `docs/vendor/algolia` and `manifests/index`.
  - [x] Match guidance to current implementation and summarize compliance vs. gaps for Supabase/Algolia.

## Review: Vendor Docs Applicability Review (Now)

- Status: Completed
- Immediate applicable items:
  - Move contact-form inserts from client anon SDK to a validated server route/action with server-side rate limiting.
  - Add Stripe webhook duplicate `event_id` short-circuit before processing, as defense-in-depth.
  - Add explicit Upstash strict-limiter timeout/resilience handling to reduce avoidable failures on Redis/network stalls.
- Not applicable right now:
  - Do not force signed Cloudflare image delivery for public listing photos.
  - Do not re-enable Cloudflare Worker cron triggers while Vercel cron remains the active scheduler.

## Task: Vendor Docs Inventory + Local Docs Pack

- [x] Build a complete inventory of technologies/services used in this repository from manifests, config, and runtime usage.
- [x] Classify each item into:
  - external service/provider (for example Supabase, Algolia)
  - framework/runtime/tooling (for example Next.js, Vitest)
  - infrastructure/deployment platform (for example Vercel, Cloudflare)
- [x] Decide which docs are worth downloading locally (high-value + low-noise pages only).
- [x] Download curated official docs pages into `docs/vendor/` with one folder per service.
- [x] Create an index file summarizing:
  - what is used in this repo
  - what was downloaded
  - where each local doc file is stored
- [x] Verify outputs:
  - downloaded files exist
  - links/sources are recorded
  - inventory matches actual code usage

## Review

- Status: Completed
- Implementation:
  - Added sync automation script: `scripts/vendor-docs-sync.mjs`
  - Added npm command: `npm run docs:vendor:sync`
  - Generated curated docs pack in `docs/vendor/`
- Verification:
  - Sync command executed successfully with `services=16`, `docsPlanned=52`, `docsDownloaded=52`
  - Generated inventory + source map: `docs/vendor/index.md`
  - Generated machine-readable manifest: `docs/vendor/manifest.json`

## Task: Runtime third-party usage analysis

- [ ] Identify third-party/third-party service integrations used at runtime across `src/`, `scripts/`, `cloudflare-worker/`, and `supabase/`.
- [ ] Capture supporting evidence (paths, imports, env vars, endpoints, SDK clients).
- [ ] Summarize findings for report back to the user.

## Task: Global Car Classifieds Benchmark (Design + Features)

- [x] Define benchmarking rubric (navigation, search UX, listing detail, trust, seller tools, monetization, mobile behavior, performance signals).
- [x] Compile at least 25 major car classifieds portals globally with region coverage and official URLs.
- [x] Capture visual references (homepage/search/listing samples where accessible) into `output/competitive/car-portals/screenshots/`.
- [x] Analyze portal patterns and extract reusable design/feature inspirations relevant to Autobazar123.
- [x] Produce implementation suggestions grouped by effort and impact.
- [x] Verify outputs and document evidence sources.

## Review: Global Car Classifieds Benchmark (Design + Features)

- Status: Completed
- Notes: Captured 44 global portals with desktop/mobile screenshots and metadata using Playwright.
- Notes: Generated inventory + analysis report in `output/competitive/car-portals/global-car-classifieds-benchmark.md`.
- Notes: Raw capture evidence in `output/competitive/car-portals/capture-results.json`; sources are official portal URLs listed in the report inventory table.

## Task: Map Portal UX for Frontpage/Search/Saved Ads/Alerts

- [x] Review route/layout structure in `src/` to list key pages/components for frontpage, search/filter, saved ads, and alerts.
- [x] Trace saved ad and notification logic (API handlers, data stores, Supabase tables) to capture existing behavior and DB usage.
- [x] Identify best insertion points for portal redesign and note implementation constraints or risks.

## Task: Implement Portal UX System (Frontpage + Search + Saved Alerts)

- [x] Add persistent saved-ad alert preferences schema with safe defaults and RLS.
- [x] Implement notification management in account Saved tab (per-ad + bulk controls, easy management).
- [x] Add live saved-ad signal states (price drop / status change) for quick decision-making.
- [x] Upgrade homepage to stronger buy/sell split, trust communication, exploration paths, and save-alert onboarding.
- [x] Improve search-first homepage filter UX with better feedback and intent shortcuts.
- [x] Verify implementation with targeted tests and manual checks.

## Review: Implement Portal UX System (Frontpage + Search + Saved Alerts)

- Status: Completed
- Notes: Added `saved_ad_alert_preferences` migration with RLS, defaults, and saved_ads sync triggers.
- Notes: Rebuilt Saved tab into a notification-management center with per-ad controls, bulk controls, and live price/status signals.
- Notes: Upgraded frontpage structure to clearer buy/sell decision paths and retention-oriented sections.
- Notes: Improved homepage search UX with quick intent presets and removable active-filter chips.
- Verification:
  - `npm run lint` passed (warnings only; no errors)
  - `npm run test:unit` passed (21 files, 112 tests)
  - `npm run build` failed due existing CSS parser issue in `src/app/globals.css` (`first-childu003eu0026` pseudo-class from generated CSS)

## Task: Cloudflare/Vercel vendor docs audit (Now)

- [x] Capture requirements/expectations from "docs/vendor/cloudflare-workers", docs/vendor/cloudflare-images, and docs/vendor/vercel relevant to this repo's integrations.
- [x] Compare those requirements to the current Cloudflare Workers/Images and Vercel configuration/implementation.
- [x] Identify and document immediate applicable improvements and confirm areas already aligned with the docs.
- [x] Produce evidence-backed summary (file paths, doc references) for the audit report.

## Task: Fix Build Blocking CSS Parse Error (Now)

- [x] Reproduce current terminal/build failure and isolate the class-source causing invalid generated CSS.
- [x] Apply proper Tailwind source-scoping fix so only app source files are scanned for utilities.
- [x] Verify `npm run build` succeeds and page can load again.
- [x] Document root cause + fix outcome in review notes.

## Review: Fix Build Blocking CSS Parse Error (Now)

- Status: Completed
- Root cause: Tailwind v4 automatic source detection scanned non-app/vendor files containing escaped class strings (`in-data-stack:[\:first-child\u003e\u0026]...`), which generated invalid CSS selectors and broke Turbopack parsing.
- Fix: Scoped Tailwind source root to `src` by changing import in `src/app/globals.css` to `@import "tailwindcss" source("../");`.
- Verification:
  - `npm run build` passed successfully (production build completes and routes are generated).

## Task: Fix Maintenance Access UX + False 429 (Now)

- [x] Refactor `/maintenance` page to be mobile-first, readable, and operable without hover-only interactions.
- [x] Harden `/api/maintenance/unlock` rate-limit identifier to reduce shared-mobile-IP false positives.
- [x] Update strict rate-limit utility to fail-open on timeouts/infrastructure errors only when explicitly requested by endpoint policy.
- [x] Verify with lint, typecheck, and targeted tests for maintenance unlock path.

## Review: Fix Maintenance Access UX + False 429 (Now)

- Status: Completed
- Root causes:
  - `/maintenance` used desktop-heavy spacing/typography and a hover-reveal unlock form, which is poor on touch/mobile.
  - Unlock endpoint keyed strict rate limiting by raw IP only, causing false positives on shared mobile networks/NAT.
  - Strict rate-limit timeout handling logged fail-open intent but still returned provider success value, which could still block.
- Fixes:
  - Rebuilt `src/app/maintenance/page.tsx` as mobile-first with a visible, touch-friendly operator unlock section.
  - Added `src/lib/request-fingerprint.ts` and switched unlock rate key to request fingerprint (IP + UA + language hash).
  - Extended `checkStrictRateLimit` with endpoint policy option `failOpenOnInfrastructureError` and enabled it for maintenance unlock only.
- Verification:
  - `npm run lint` passed (existing warnings only, no errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit -- src/lib/request-fingerprint.test.ts` passed (5/5).
  - `npm run build` passed.

## Task: Polish Maintenance UX + Remove Misconfigured Unlock Failures (Now)

- [x] Redesign `/maintenance` for stronger mobile readability, spacing, and operator interaction flow.
- [x] Improve unlock interaction states and messaging (errors, disabled states, helper guidance).
- [x] Implement shared maintenance-bypass secret resolver used by both proxy and unlock API to avoid false `Server misconfigured.` when dedicated secret is missing.
- [x] Verify with lint, typecheck, and production build.

## Review: Polish Maintenance UX + Remove Misconfigured Unlock Failures (Now)

- Status: Completed
- Root causes:
  - Maintenance page had weak visual hierarchy/contrast and minimal interaction feedback.
  - Unlock endpoint and proxy depended on a single env secret; if absent, operators received `Server misconfigured.` and could not unlock.
- Fixes:
  - Refined maintenance UI with stronger contrast, cleaner card layout, clearer punctuation/copy, password visibility toggle, disabled submit state, and user-friendly error mapping.
  - Added `resolveMaintenanceBypassSecret()` fallback strategy and wired it in both unlock API and proxy token validation.
  - Added unit tests for bypass-secret resolver behavior.
- Verification:
  - `npm run lint` passed (existing warnings only, no errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit -- src/lib/security/maintenance-bypass.test.ts src/lib/request-fingerprint.test.ts` passed.
  - `npm run build` passed.

