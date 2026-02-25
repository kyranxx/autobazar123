# Active Todo

## Task: QA-02 Stabilize `webapp-audit` Harness (Now)

- [x] Reproduce `npm run audit:webapp` flake and identify exact navigation/context race trigger.
- [x] Harden audit route lifecycle timing so title/perf capture never runs on destroyed context.
- [x] Validate stability with repeated targeted runs.
- [x] Verify with lint, typecheck, and unit baseline commands.
- [x] Update review notes and action-pack status with concrete evidence.

## Review: QA-02 Stabilize `webapp-audit` Harness (Now)

- Status: Completed
- Notes:
  - Hardened `tests/webapp-audit.ts` to avoid page-context teardown races during fast route transitions.
  - Added resilient route-capture helpers:
    - `isExecutionContextDestroyedError(...)`
    - `waitForUrlStability(...)`
    - `readPageTitleSafely(...)` with retries
    - `readPerfSnapshotSafely(...)` with retries + safe fallback (`EMPTY_PERF_SNAPSHOT`)
  - Updated route interaction/capture flow to wait for URL stability before title/perf collection and retry only on navigation teardown errors.
  - Kept existing route diagnostics behavior (status/issues/report output) unchanged.
- Verification:
  - `$env:AUDIT_MAX_ROUTES='12'; npm run audit:webapp` passed in 3 consecutive runs (`1/1` each run) with no `Execution context was destroyed` failure.
  - `npm run lint` passed (`0` warnings, `0` errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`35/35` files, `157/157` tests).

## Task: HYG-01 Warning Backlog + Dead Code Cleanup (Now)

- [x] Capture current lint warning baseline and identify low-risk dead code removals.
- [x] Remove or simplify genuinely unused symbols with minimal behavior impact.
- [x] Reduce warning count materially without suppression-only fixes.
- [x] Verify with lint, typecheck, and unit baseline commands.
- [x] Update review notes and action-pack status with before/after warning evidence.

## Review: HYG-01 Warning Backlog + Dead Code Cleanup (Now)

- Status: Completed
- Notes:
  - Removed dead/unused code paths instead of adding lint suppressions.
  - Deleted fully unused schema module and orphan test:
    - `src/schemas/index.ts`
    - `src/schemas/index.test.ts`
  - Removed unused search components and stale barrel exports:
    - `src/components/search/HeroSearchBar.tsx`
    - `src/components/search/GeoDistanceFilter.tsx`
    - removed related exports from `src/components/search/index.ts`
  - Pruned unused symbols across UI/config/helpers (icons, shadcn wrappers, feature flags, RBAC, Algolia helper leftovers, transactional email type, geo/cached helpers).
  - Warning delta:
    - before: `74` warnings (`@typescript-eslint/no-unused-vars`)
    - after: `0` warnings
- Verification:
  - `npm run lint -- --format json --output-file output/eslint-src.json` (before snapshot) recorded `74` warnings.
  - `npm run lint -- --format json --output-file output/eslint-src-after.json` (after cleanup) recorded `0` warnings.
  - `npm run lint` passed (`0` warnings, `0` errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`35/35` files, `157/157` tests).

## Task: AUTH-03 Restore Google Sign-In/One Tap on Desktop + Mobile (Now)

- [x] Remove local/dev callback resolution behavior that incorrectly forces OAuth callbacks to `localhost` on non-localhost origins.
- [x] Allow Google One Tap to initialize on localhost too (keep webdriver/test guard intact).
- [x] Update focused unit tests for OAuth callback origin resolution.
- [x] Verify with targeted auth tests plus baseline lint/typecheck/unit commands.
- [x] Add review notes with concrete verification evidence.

## Review: AUTH-03 Restore Google Sign-In/One Tap on Desktop + Mobile (Now)

- Status: Completed
- Notes:
  - Updated OAuth callback resolver in `src/lib/auth/oauth-redirect.ts`:
    - preserves explicit `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN` override when configured
    - when override is localhost but the active session is non-localhost (for example mobile/LAN host), uses active browser origin callback to avoid cross-device localhost redirects
    - uses the active browser origin (`window.location.origin`) when available
    - falls back to `http://localhost:3000/auth/callback` only when no location context is available
  - Updated Google One Tap gating in `src/components/GoogleOneTap.tsx`:
    - removed localhost suppression so One Tap can initialize on both desktop and mobile local sessions
    - changed default enable behavior to: enabled when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` exists unless explicitly disabled via `NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP=false`
    - kept webdriver guard to avoid E2E/test interference
  - Updated proxy CSP gating in `src/proxy.ts` to match One Tap runtime enable logic so `accounts.google.com` is allowed whenever One Tap is effectively enabled.
  - Updated focused unit coverage in `src/lib/auth/oauth-redirect.test.ts`:
    - development non-localhost origin now resolves to active origin callback
    - localhost override is ignored only for non-localhost active sessions
    - non-localhost configured origin remains respected
    - added explicit no-location fallback coverage
- Verification:
  - `npm run test:unit -- src/lib/auth/oauth-redirect.test.ts` passed (`9/9` tests).
  - `npm run test:unit -- src/components/AuthModal.email-flow.test.tsx` passed (`6/6` tests).
  - `npm run test:unit -- src/proxy.test.ts` passed (`2/2` tests).
  - `npm run lint` passed (existing repository warnings only; no errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`36/36` files, `170/170` tests).

## Task: QA-01 Journey-Level E2E Coverage for Core Flows (Now)

- [x] Add journey E2E for results filter flow with URL/state assertions.
- [x] Add journey E2E for credits checkout entry flow with deterministic guest guard assertion.
- [x] Add journey E2E for publish/edit routes with deterministic protected-route assertions.
- [x] Add journey E2E for dashboard action surfaces with deterministic protected-route assertions.
- [x] Verify with targeted Playwright run, lint, and typecheck.
- [x] Update `tasks/codebase-audit-action-pack-2026-02-24.md` and `tasks/todo.md` review notes with evidence.

## Review: QA-01 Journey-Level E2E Coverage for Core Flows (Now)

- Status: Completed
- Notes:
  - Added new journey-level Playwright spec:
    - `tests/journey-core-flows.test.ts`
  - Added deterministic core-flow assertions covering:
    - results-page search/filter URL-state sync (`priceTo` + `brand` query params)
    - guest credits checkout guard redirect to `/auth/login?redirect=/kredity`
    - guest publish route guard redirect for `/pridat-inzerat`
    - guest edit-route protection on `/upravit-inzerat/{id}` (redirect or inline auth-required surface)
    - guest dashboard access guard for `/moj-ucet?tab=ads` with protected action controls not present
  - Kept tests CI-friendly and deterministic by validating guarded behaviors where authenticated fixtures are not available in this suite.
- Verification:
  - `npx playwright test tests/journey-core-flows.test.ts` passed (`5/5` tests).
  - `npx eslint tests/journey-core-flows.test.ts` passed.
  - `npx tsc --noEmit` passed.
  - `npm run lint` passed (existing repository warnings only; `74` warnings, `0` errors).
  - `npm run test:unit` passed (`36/36` files, `168/168` tests).

## Task: Theme Scheme Preview on Results + Car Detail (Now)

- [x] Reuse the current branch 3-scheme palette switcher on `/vysledky` and `/auto/[id]`.
- [x] Apply palette token overrides so existing route components visibly reflect each scheme.
- [x] Keep route behavior unchanged while improving scheme visibility for comparison.
- [x] Verify with lint, typecheck, and unit test baseline.
- [x] Add review notes with verification evidence.

## Review: Theme Scheme Preview on Results + Car Detail (Now)

- Status: Completed
- Notes:
  - Added shared palette preview wrapper:
    - `src/components/theme/ThemePreviewShell.tsx`
  - The wrapper reuses the same three branch themes (`Teal + Burnt Orange`, `Navy + Amber`, `Charcoal + Red Orange`) with a top toggle bar and live scheme switching.
  - Applied route-level palette remapping via CSS variables (`--color-accent`, `--color-primary`, `--color-success`, `--color-error`, focus/ring/subtle variants) so existing UI components render each scheme without behavior changes.
  - Wrapped both routes with the shared shell:
    - `src/app/vysledky/page.tsx`
    - `src/app/auto/[id]/page.tsx`
- Verification:
  - `npm run lint` passed (existing repository warnings only; `74` warnings, `0` errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`36/36` files, `170/170` tests).

## Task: Theme Scheme Expansion + UX Analysis (Now)

- [x] Design two additional palette options with UX-focused rationale (trust, CTA salience, readability, accessibility contrast).
- [x] Add both schemes as top-banner toggle buttons in all current theme-preview surfaces.
- [x] Keep existing interactions/layout unchanged while extending palette coverage.
- [x] Verify with lint, typecheck, and unit test baseline.
- [x] Add review notes with rationale and verification evidence.

## Review: Theme Scheme Expansion + UX Analysis (Now)

- Status: Completed
- Notes:
  - Added two new schemes to top-banner theme toggles on:
    - `src/app/page.tsx`
    - `src/components/theme/ThemePreviewShell.tsx` (used by `/vysledky` and `/auto/[id]`)
  - New scheme 1: `Forest + Champagne`
    - Brand: `#1F4D3B`, CTA: `#CFA15A`, CTA text: `#111111`
    - UX intent: premium/trust-forward tone with low anxiety and upscale feel for considered purchases.
    - Contrast check: CTA/text ratio `8.00` (strong readability for button labels).
  - New scheme 2: `Indigo + Coral`
    - Brand: `#1E3A8A`, CTA: `#C73E1D`, CTA text: `#FFFFFF`
    - UX intent: high-action contrast that keeps navigation trustworthy while making CTA states more decisive.
    - Contrast check: CTA/text ratio `5.08` (passes readable action emphasis).
  - Palette selection principles applied:
    - keep trust/navigation anchored in deep cool brand hues
    - keep CTA hue distinct from semantic status colors (`success`/`danger`)
    - ensure primary action text contrast remains readable in all added schemes
- Verification:
  - `npx eslint src/app/page.tsx src/components/theme/ThemePreviewShell.tsx` passed.
  - `npm run lint` passed (existing repository warnings only; `74` warnings, `0` errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`36/36` files, `170/170` tests).

## Task: Hero Search Refresh + Smaller Theme Switcher (Now)

- [x] Reduce top-banner theme switcher button size while keeping full color-scheme names visible.
- [x] Redesign homepage hero from bento-style layout to a unified hero surface.
- [x] Add integrated search + filtering controls in hero with navigation to `/vysledky` query params.
- [x] Verify with lint, typecheck, and unit baseline commands.
- [x] Add review notes with exact implementation and verification evidence.

## Review: Hero Search Refresh + Smaller Theme Switcher (Now)

- Status: Completed
- Notes:
  - Reduced theme switcher button footprint while preserving full scheme names in both top-banner switchers:
    - `src/app/page.tsx`
    - `src/components/theme/ThemePreviewShell.tsx`
  - Replaced the homepage bento hero block with a unified hero surface (single large hero container with image + overlay) in:
    - `src/app/page.tsx`
  - Added functional hero search/filter form and routing behavior:
    - query + fuel + gearbox + budget filters
    - submit maps to `/vysledky` URL params (`q`, `fuel`, `transmission`, `priceTo`)
    - quick filter chips that prefill key filter combinations
- Verification:
  - `npx eslint src/app/page.tsx src/components/theme/ThemePreviewShell.tsx` passed.
  - `npm run lint` passed (existing repository warnings only; `74` warnings, `0` errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`36/36` files, `170/170` tests).

## Task: Hero Real Imagery + Saved Alert Visibility (Now)

- [x] Replace hero background with real car photography and map imagery per color scheme for better visual fit.
- [x] Keep hero behavior and theme switching intact while improving visual quality.
- [x] Improve `moj-ucet` saved ads alert-settings readability/visibility based on current low-contrast UI.
- [x] Verify with lint, typecheck, and unit test baseline commands.
- [x] Add review notes with exact implementation and verification evidence.

## Review: Hero Real Imagery + Saved Alert Visibility (Now)

- Status: Completed
- Notes:
  - Added local real-car hero assets in `public/` and mapped one visual per palette in homepage hero:
    - `/hero-teal-burnt-orange.jpg`
    - `/hero-navy-amber.jpg`
    - `/hero-charcoal-red-orange.jpg`
    - `/hero-forest-champagne.jpg`
    - `/hero-indigo-coral.jpg`
  - Updated `src/app/page.tsx` hero to use `HERO_VISUALS[activeThemeKey]` so each color scheme shows a complementary photo and object position.
  - Added dynamic theme-tinted overlay gradients in hero to match active palette while preserving text contrast.
  - Improved saved-alert settings visibility in `src/app/moj-ucet/DashboardClient.tsx`:
    - stronger card contrast (`border-border-strong`, solid background)
    - darker heading/body text (`text-primary` / `text-secondary`)
    - larger, clearer checkbox controls (`h-5 w-5`) and stronger row typography
- Verification:
  - `npx eslint src/app/page.tsx src/app/moj-ucet/DashboardClient.tsx src/components/theme/ThemePreviewShell.tsx` passed.
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`35/35` files, `157/157` tests).

## Task: Apply Theme Schemes to Dashboard + Admin (Now)

- [x] Apply existing color-scheme preview shell to `moj-ucet` dashboard route.
- [x] Apply existing color-scheme preview shell to `admin` route.
- [x] Keep route auth/redirect behavior unchanged.
- [x] Verify with lint, typecheck, and unit test baseline commands.
- [x] Add review notes with implementation and verification evidence.

## Review: Apply Theme Schemes to Dashboard + Admin (Now)

- Status: Completed
- Notes:
  - Wrapped dashboard page with shared palette preview shell:
    - `src/app/moj-ucet/page.tsx`
    - scope label: `/moj-ucet`
  - Wrapped admin page with shared palette preview shell:
    - `src/app/admin/page.tsx`
    - scope label: `/admin`
  - Reused existing `src/components/theme/ThemePreviewShell.tsx` so admin and dashboard now have the same scheme switcher + token remapping as other preview routes.
  - Preserved all route behavior:
    - `admin` auth and admin-role redirects unchanged
    - `moj-ucet` Suspense loader and client dashboard behavior unchanged
- Verification:
  - `npx eslint src/app/moj-ucet/page.tsx src/app/admin/page.tsx src/components/theme/ThemePreviewShell.tsx` passed.
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`35/35` files, `157/157` tests).

## Task: Hero Headline Contrast Fix (Now)

- [x] Make "Find your next car faster" headline fully white across all color schemes.
- [x] Keep all hero behavior and theme logic unchanged.
- [x] Verify with lint, typecheck, and unit test baseline commands.
- [x] Add review notes with verification evidence.

## Review: Hero Headline Contrast Fix (Now)

- Status: Completed
- Notes:
  - Updated homepage hero headline emphasis color to fixed white so it remains visible on every theme/photo combination:
    - `src/app/page.tsx`
    - changed `with focused filters` span from `text-[var(--home-cta)]` to `text-white`
  - No changes to hero search/filter behavior, routing, or theme switching logic.
- Verification:
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`35/35` files, `157/157` tests).

## Task: Frontpage Theme Showcase Expansion + Image Reliability (Now)

- [x] Expand homepage sections so all three color schemes are visible in more UI contexts.
- [x] Replace fragile/missing image sources with local guaranteed assets from `public/`.
- [x] Keep top-banner theme switching and ensure palette affects links/CTAs/status cards consistently.
- [x] Verify with lint, typecheck, and unit tests.
- [x] Add review notes with exact verification evidence.

## Review: Frontpage Theme Showcase Expansion + Image Reliability (Now)

- Status: Completed
- Notes:
  - Expanded `src/app/page.tsx` into a fuller theme-showcase frontpage with more palette-visible components:
    - enhanced hero with local image + status chips
    - palette proof strip (links/CTA/status samples)
    - richer featured listing cards
    - step cards and dark CTA stress-test section
  - Replaced broken/fragile image paths with local assets only:
    - `/placeholder-car-hero.jpg`
    - `/placeholder-car.jpg`
  - Kept top-banner theme switch and wired theme colors across links, CTA blocks, badges, status pills, and dark/light sections for easier side-by-side visual comparison.
- Verification:
  - `npm run lint` passed (existing repository warnings only; no errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`36/36` files, `167/167` tests).

## Task: Frontpage Theme Schemes Toggle (Now)

- [x] Create a new branch from the current working state for frontpage color-scheme work.
- [x] Add three selectable frontpage color schemes with toggle buttons in the top banner.
- [x] Apply scheme tokens to brand/links, primary CTAs, and status color indicators on the homepage.
- [x] Verify homepage changes with targeted lint + typecheck.
- [x] Add review notes with verification evidence.

## Review: Frontpage Theme Schemes Toggle (Now)

- Status: Completed
- Notes:
  - Created branch `feature/frontpage-theme-schemes-toggle` from current working state.
  - Reworked `src/app/page.tsx` to support three switchable top-banner theme presets:
    - `Teal + Burnt Orange` (default)
    - `Navy + Amber`
    - `Charcoal + Red Orange`
  - Added frontpage theme token wiring for:
    - brand/link colors
    - primary CTA colors (including amber scheme dark CTA text)
    - status indicators (`success`/`danger`) shown in the top banner legend and hero trust signals.
  - Kept homepage structure and interactions intact while applying dynamic palette variables.
- Verification:
  - `npx eslint src/app/page.tsx` passed.
  - `npm run lint` passed (existing repository warnings only; no errors).
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`35/35` files, `165/165` tests).

## Task: SEARCH-03 Fix Dead Quick-Price Buttons in Search Sidebar (Now)

- [x] Wire quick-price buttons in `src/components/search/FilterSidebar.tsx` to real Algolia range refinements.
- [x] Keep behavior consistent with existing range controls and show active/disabled button state.
- [x] Add focused unit coverage proving button click triggers price refinement.
- [x] Verify with targeted tests, lint, and typecheck.
- [x] Update review notes + action-pack status/evidence.

## Review: SEARCH-03 Fix Dead Quick-Price Buttons in Search Sidebar (Now)

- Status: Completed
- Notes:
  - Updated `PriceRangeInput` in `src/components/search/FilterSidebar.tsx` to use `useRange({ attribute })`.
  - Wired quick-price buttons (`do 5k/10k/20k/50k EUR`) to real range refinement calls:
    - `refine([range.min, quickMax])`
  - Added active-state and disabled-state behavior for shortcuts using current `start` and `canRefine`.
  - Exported `PriceRangeInput` for focused component testing.
  - Added focused click behavior test:
    - `src/components/search/FilterSidebar.quick-price.test.tsx`
- Verification:
  - `npm run test:unit -- src/components/search/FilterSidebar.quick-price.test.tsx` passed (`2/2` tests).
  - `npx eslint src/components/search/FilterSidebar.tsx src/components/search/FilterSidebar.quick-price.test.tsx` passed.
  - `npx tsc --noEmit` passed.

## Task: ROUTE-01 Fix Dealer Public Profile Links (Now)

- [x] Add a canonical dealer public-profile path helper for `/predajca/{slug}`.
- [x] Replace stale `/dealer/{slug}` dashboard/storefront links with canonical localized route.
- [x] Add focused unit test coverage for path generation.
- [x] Verify with targeted tests, lint, and typecheck.
- [x] Update review notes + action-pack status/evidence.

## Review: ROUTE-01 Fix Dealer Public Profile Links (Now)

- Status: Completed
- Notes:
  - Added canonical route helper:
    - `src/lib/dealer/public-profile-path.ts`
    - `buildDealerPublicProfilePath(slug) -> /predajca/{slug}`
  - Updated dealer dashboard/storefront links in:
    - `src/app/dealer/DealerDashboardClient.tsx`
  - Removed stale `/dealer/{slug}` link usage in favor of canonical `/predajca/{slug}` route.
  - Added focused route helper test:
    - `src/lib/dealer/public-profile-path.test.ts`
- Verification:
  - `npm run test:unit -- src/lib/dealer/public-profile-path.test.ts` passed (`2/2` tests).
  - `npx eslint src/app/dealer/DealerDashboardClient.tsx src/lib/dealer/public-profile-path.ts src/lib/dealer/public-profile-path.test.ts` passed.
  - `npx tsc --noEmit` passed.

## Task: AUTH-02 Align Proxy Protected Routes With Localized Paths (Now)

- [x] Replace stale `/favorites` and `/messages` protected route entries with canonical `/ulozene` and `/spravy`.
- [x] Keep existing unauthenticated redirect behavior (`/auth/login?redirect=...`) unchanged for localized protected routes.
- [x] Add focused proxy test coverage for unauthenticated access on `/ulozene` and `/spravy`.
- [x] Verify with targeted tests, lint, and typecheck.
- [x] Update review notes + audit action-pack status/evidence.

## Review: AUTH-02 Align Proxy Protected Routes With Localized Paths (Now)

- Status: Completed
- Notes:
  - Updated `PROTECTED_ROUTES.authenticated` in `src/proxy.ts`:
    - removed stale `/favorites` and `/messages`
    - added canonical localized routes `/ulozene` and `/spravy`
  - Existing unauthenticated behavior remains unchanged:
    - protected route access redirects to `/auth/login?redirect=<pathname>`
  - Added focused proxy coverage:
    - `src/proxy.test.ts`
    - validates unauthenticated redirects for both `/ulozene` and `/spravy`
- Verification:
  - `npm run test:unit -- src/proxy.test.ts` passed (`2/2` tests).
  - `npx eslint src/proxy.ts src/proxy.test.ts` passed.
  - `npx tsc --noEmit` passed.

## Task: ADMIN-01 Replace Admin Revenue Placeholders With Real Metrics (Now)

- [x] Add revenue aggregation helpers backed by real Stripe webhook + credit transaction records.
- [x] Refactor `getRevenueStats()` in `src/app/admin/actions.ts` to return real summary values and supporting datasets.
- [x] Replace hardcoded revenue widgets/tables in `src/app/admin/components/AdminRevenue.tsx` with real server-provided values and explicit empty states.
- [x] Add focused unit tests for metric aggregation correctness.
- [x] Verify with targeted tests, lint, and typecheck.
- [x] Update `tasks/todo.md` review section and `tasks/codebase-audit-action-pack-2026-02-24.md` status/evidence.

## Review: ADMIN-01 Replace Admin Revenue Placeholders With Real Metrics (Now)

- Status: Completed
- Notes:
  - Added shared admin revenue aggregation helper `src/lib/admin/revenue.ts` for:
    - Stripe checkout revenue extraction and time-window totals (`today`, `thisWeek`, `thisMonth`, `total`).
    - Credit consumption grouping from real negative `credit_transactions` rows.
    - Recent top-up transaction normalization with webhook-session EUR mapping.
  - Updated `src/app/admin/actions.ts#getRevenueStats()` to fetch only real data sources:
    - `stripe_webhook_logs` for Stripe EUR metrics and webhook health.
    - `credit_transactions` for top-up transactions and monthly credit consumption.
    - `profiles` for total credits currently in the system.
  - Replaced hardcoded placeholders in `src/app/admin/components/AdminRevenue.tsx` with server-provided metrics, including:
    - real Stripe webhook status card
    - real monthly credit-consumption list
    - real recent top-up transactions table
    - explicit empty states when no data exists
  - Added focused tests in `src/lib/admin/revenue.test.ts`.
- Verification:
  - `npm run test:unit -- src/lib/admin/revenue.test.ts` passed (`6/6` tests).
  - `npx eslint src/app/admin/actions.ts src/app/admin/components/AdminRevenue.tsx src/lib/admin/revenue.ts src/lib/admin/revenue.test.ts` passed.
  - `npx tsc --noEmit` passed.

## Task: SEO-01 Replace Mock Inventory on Brand/Model/City Pages (Now)

- [x] Add shared real-inventory fetch helper for SEO routes (brand/model/city filters against real index).
- [x] Replace mock/random car generation in `src/app/[brand]/[model]/page.tsx` with real listings (or explicit empty state).
- [x] Replace mock/random car generation in `src/app/[brand]/[model]/[city]/page.tsx` with real listings (or explicit empty state).
- [x] Keep SEO metadata, breadcrumbs, and related links intact while removing fake card content.
- [x] Add focused test coverage for inventory filter/query normalization helpers.
- [x] Verify with targeted tests, lint, and typecheck.
- [x] Update audit action-pack + review section with implementation/verification evidence.

## Review: SEO-01 Replace Mock Inventory on Brand/Model/City Pages (Now)

- Status: Completed
- Notes:
  - Added shared SEO inventory helper in `src/lib/seo/inventory.ts`:
    - `getSeoInventoryListings(...)`
    - `buildSeoInventoryFilter(...)`
    - `normalizeSeoInventoryHits(...)`
  - Hard-cutover removed random/mock listing generation from:
    - `src/app/[brand]/[model]/page.tsx`
    - `src/app/[brand]/[model]/[city]/page.tsx`
  - Both routes now render real listing cards from Algolia hits (`/auto/{id}` links) or an explicit no-inventory state with canonical `/vysledky` query links.
  - Preserved page metadata, breadcrumbs, and SEO content sections; only listing data source and card rendering were replaced.
  - Added focused helper tests in `src/lib/seo/inventory.test.ts`.
- Verification:
  - `npm run test:unit -- src/lib/seo/inventory.test.ts` passed (`4/4` tests).
  - `npx eslint src/lib/seo/inventory.ts src/lib/seo/inventory.test.ts src/app/[brand]/[model]/page.tsx src/app/[brand]/[model]/[city]/page.tsx` passed.
  - `npx tsc --noEmit` passed.

## Task: AUTH-01 Enforce MFA on Server-Side Admin Actions (Now)

- [x] Add server-side MFA assurance helper for admin actions with clear failure message.
- [x] Apply MFA enforcement to sensitive/mutating admin server actions.
- [x] Keep role checks and MFA checks both required.
- [x] Add focused tests for MFA-enforced server behavior:
  - [x] admin with MFA (`aal2`) succeeds.
  - [x] admin without MFA (`aal1` when `nextLevel=aal2`) fails.
- [x] Verify with targeted tests, lint, and typecheck.
- [x] Update audit action pack + review section with implementation and verification evidence.

## Review: AUTH-01 Enforce MFA on Server-Side Admin Actions (Now)

- Status: Completed
- Notes:
  - Added server MFA assurance helper: `src/lib/auth/admin-mfa.ts`.
  - Introduced explicit failure message for non-MFA admin sessions:
    - `MFA verification required for this admin action.`
  - Updated `src/app/admin/actions.ts` to enforce MFA for sensitive mutating actions via `requireAdmin({ requireMfa: true })`:
    - `approveAd`
    - `rejectAd`
    - `banUser`
    - `updateUserCredits`
    - `toggleFeatureFlag`
    - `createFeatureFlag`
    - `updateSiteSetting`
  - Read-only admin queries remain role-gated only.
  - Added focused tests in `src/lib/auth/admin-mfa.test.ts` for `aal2` success and `aal1` failure when `aal2` is required.
- Verification:
  - `npm run test:unit -- src/lib/auth/admin-mfa.test.ts` passed (`4/4` tests).
  - `npx eslint src/app/admin/actions.ts src/lib/auth/admin-mfa.ts src/lib/auth/admin-mfa.test.ts` passed.
  - `npx tsc --noEmit` passed.

## Task: MSG-01 Unify Messaging Model + Fix False-Success Send Path (Now)

- [x] Confirm and enforce one canonical table/API for user-to-seller communication with hard cutover.
- [x] Fix car detail send flow to return true success only when database write succeeds.
- [x] Replace dashboard mock conversations with real persisted inquiry records (sender + seller visibility).
- [x] Add focused tests for send success/failure behavior and inquiry-to-UI mapping.
- [x] Verify with targeted lint, typecheck, and unit tests.
- [x] Update audit action-pack and review notes with exact verification evidence.

## Review: MSG-01 Unify Messaging Model + Fix False-Success Send Path (Now)

- Status: Completed
- Notes:
  - Enforced hard cutover to `inquiries` and removed active app writes to legacy `messages` path.
  - Updated `src/app/auto/[id]/CarDetailClient.tsx` to use shared inquiry submission helper and to show real failure on insert errors.
  - Replaced dashboard mock conversations in `src/app/moj-ucet/DashboardClient.tsx` with live inquiry loading (`from("inquiries")`) and persisted conversation rendering.
  - Added shared inquiry utilities:
    - `src/lib/inquiries/submit-inquiry.ts`
    - `src/lib/inquiries/conversations.ts`
  - Added focused unit tests:
    - `src/lib/inquiries/submit-inquiry.test.ts`
    - `src/lib/inquiries/conversations.test.ts`
- Verification:
  - `npm run test:unit -- src/lib/inquiries/submit-inquiry.test.ts src/lib/inquiries/conversations.test.ts` passed (`7/7` tests).
  - `npx eslint src/app/auto/[id]/CarDetailClient.tsx src/app/moj-ucet/DashboardClient.tsx src/lib/inquiries/submit-inquiry.ts src/lib/inquiries/submit-inquiry.test.ts src/lib/inquiries/conversations.ts src/lib/inquiries/conversations.test.ts` passed.
  - `npx tsc --noEmit` passed.

## Task: DEALER-01 Implement Real Dealer Bulk Actions (Now)

- [x] Add atomic backend action path for dealer bulk actions (prolong/top/highlight/bump) with ownership and active-status checks.
- [x] Apply credit deduction + tiered discounts server-side in a transactional flow.
- [x] Wire dealer bulk tab UI to execute real backend action and show success/failure summaries.
- [x] Remove placeholder TODO/alert-only behavior for bulk actions.
- [x] Add focused tests for bulk action pricing/state logic and verify lint/typecheck.
- [x] Update audit pack + review section with implementation and verification notes.

## Review: DEALER-01 Implement Real Dealer Bulk Actions (Now)

- Status: Completed
- Notes:
  - Added migration `supabase/migrations/20260224203000_add_dealer_bulk_action_rpc.sql` with new secure RPC:
    - `public.dealer_apply_bulk_action(TEXT, UUID[])`
    - Enforces `auth.uid()` ownership and `status = 'active'` for all selected ads.
    - Computes tier discount server-side (`DEALER_BULK_TIERS` equivalent thresholds).
    - Deducts credits atomically from `profiles.credit_balance`.
    - Applies action updates transactionally:
      - `prolong`: extends `expires_at` by 30 days from max(current, now)
      - `top`: sets `is_top_ad = true` and extends `top_expires_at` by 7 days
      - `highlight`: sets `is_highlighted = true` and extends `highlight_expires_at` by 7 days
      - `bump`: updates `created_at = now()` to move listing upward
    - Writes a `credit_transactions` entry with aggregated bulk action cost.
    - Tightens execute grants to `authenticated` + `service_role` only.
  - Added reusable dealer bulk helpers in `src/lib/dealer/bulk-actions.ts`:
    - `calculateDealerBulkTotals(...)`
    - `applyDealerBulkActionLocally(...)`
  - Updated `src/app/dealer/DealerDashboardClient.tsx` bulk tab to:
    - call real RPC instead of TODO/alert placeholder
    - show in-UI success/error summaries with counts and credit usage
    - apply optimistic local ad updates and clear bulk selection
    - include `top_expires_at` and `highlight_expires_at` in dealer ads fetch payload for consistent local state updates.
- Verification:
  - `npm run test:unit -- src/lib/dealer/bulk-actions.test.ts` passed (`3/3` tests).
  - `npx eslint src/app/dealer/DealerDashboardClient.tsx src/lib/dealer/bulk-actions.ts src/lib/dealer/bulk-actions.test.ts` passed.
  - `npx tsc --noEmit` passed.
  - Migration was created but not applied locally in this environment (no local Supabase/Docker runtime available for `db reset/push` execution).

## Task: SEARCH-02 URL ↔ InstantSearch Sync for `/vysledky` (Now)

- [x] Parse homepage query params on `/vysledky` load and hydrate InstantSearch ui state (`q`, brand/model/fuel/transmission, price/year bounds).
- [x] Keep URL query params in sync when results-page filters/search query change.
- [x] Ensure sync is stable (no update loops) and works with Algolia sort index selection.
- [x] Add focused tests for route-state mapping behavior and verification notes.
- [x] Update audit pack + review section with implementation and evidence.

## Review: SEARCH-02 URL ↔ InstantSearch Sync for `/vysledky` (Now)

- Status: Completed
- Notes:
  - Added URL-state mapper utilities in `src/lib/algolia/url-state.ts`:
    - `routeParamsToIndexUiState(...)` hydrates InstantSearch ui state from URL params.
    - `indexUiStateToRouteParams(...)` serializes active InstantSearch state back to URL params.
  - Wired `/vysledky` search page to:
    - hydrate `initialUiState` from URL query params on first load.
    - update URL via `router.replace(..., { scroll: false })` on state changes.
    - keep sync compatible with sort replica switching by seeding initial state for all configured sort indices.
  - Added `getAllCarsSortIndexNames()` in `src/lib/algolia/sort-indices.ts` to support cross-index state hydration.
  - Added focused tests in `src/lib/algolia/url-state.test.ts` covering:
    - URL -> ui state hydration for homepage params
    - multi-value refinements (repeated/comma-separated params)
    - ui state -> URL serialization
- Verification:
  - `npm run test:unit -- src/lib/algolia/url-state.test.ts src/lib/algolia/sort-indices.test.ts` passed (`5/5` tests).
  - `npx playwright test tests/e2e.test.ts -g "Results page hydrates search query from URL params"` passed (`1/1`).
  - `npx eslint tests/e2e.test.ts src/app/vysledky/AlgoliaSearchPageClient.tsx src/lib/algolia/url-state.ts src/lib/algolia/url-state.test.ts src/lib/algolia/sort-indices.ts src/lib/algolia/sort-indices.test.ts` passed.
  - `npx tsc --noEmit` passed.

## Task: SEARCH-01 Algolia-Backed Sorting on `/vysledky` (Now)

- [x] Remove client-side per-page hit sorting and switch sorting to Algolia index selection.
- [x] Map all existing sort options (`newest`, `price_asc`, `price_desc`, `year_desc`, `mileage_asc`) to canonical Algolia index names/replicas.
- [x] Keep pagination/stat behavior consistent by sorting at query level.
- [x] Add focused test coverage proving sort option changes backend index selection (no local reorder fallback).
- [x] Update audit pack + review notes with changed files and verification.

## Review: SEARCH-01 Algolia-Backed Sorting on `/vysledky` (Now)

- Status: Completed
- Notes:
  - Removed client-side hit reordering from `src/app/vysledky/AlgoliaSearchPageClient.tsx` (`sortHits` and derived local `sortedItems`).
  - Added canonical sort-to-index resolver `getCarsSortIndexName()` in `src/lib/algolia/sort-indices.ts`.
  - Wired selected sort option to InstantSearch index selection (`indexName={indexName}`), so sorting now happens at Algolia index/replica level and remains consistent across pagination.
  - Kept all existing sort options and added env overrides for index names:
    - `NEXT_PUBLIC_ALGOLIA_ADS_INDEX_NEWEST`
    - `NEXT_PUBLIC_ALGOLIA_ADS_INDEX_PRICE_ASC`
    - `NEXT_PUBLIC_ALGOLIA_ADS_INDEX_PRICE_DESC`
    - `NEXT_PUBLIC_ALGOLIA_ADS_INDEX_YEAR_DESC`
    - `NEXT_PUBLIC_ALGOLIA_ADS_INDEX_MILEAGE_ASC`
  - Added focused unit test `src/lib/algolia/sort-indices.test.ts` asserting each sort option resolves to the expected backend index.
- Verification:
  - `npm run test:unit -- src/lib/algolia/sort-indices.test.ts` passed (`2/2` tests).
  - `npx eslint src/app/vysledky/AlgoliaSearchPageClient.tsx src/components/search/SearchControls.tsx src/lib/algolia/sort-indices.ts src/lib/algolia/sort-indices.test.ts` passed (existing warning only: unused `NoResultsBoundary` in `SearchControls.tsx`).
  - `npx tsc --noEmit` passed.

## Task: DB-01 Remove Duplicate Stripe Migration Conflict (Now)

- [x] Select canonical Stripe enhancement migration and hard-cutover retire duplicate file content.
- [x] Ensure only one migration applies Stripe payment-flow DDL in fresh runs.
- [x] Verify migration sequence from clean state (or closest equivalent local check) has no duplicate policy/constraint creation failures.
- [x] Update audit pack + review notes with exact strategy and verification evidence.

## Review: DB-01 Remove Duplicate Stripe Migration Conflict (Now)

- Status: Completed
- Notes:
  - Kept `supabase/migrations/20260206_enhance_stripe_payment_flow.sql` as the single canonical Stripe payment-flow migration.
  - Hard-cutover retired duplicate DDL body in `supabase/migrations/20260212210951_enhance_stripe_payment_flow_20260206.sql` and replaced it with an intentional no-op migration note.
  - This removes duplicate policy/constraint creation attempts during fresh migration runs while preserving migration version history in the repository.
- Verification:
  - `rg -n 'Users can see their payment notifications|Admins can view webhook logs|unique_stripe_session' supabase/migrations -g '*.sql'` now returns only `20260206_enhance_stripe_payment_flow.sql`.
  - `rg -n -P '^(?!\\s*--).*(ALTER TABLE|CREATE TABLE|CREATE POLICY|CREATE INDEX|ADD CONSTRAINT)' supabase/migrations/20260212210951_enhance_stripe_payment_flow_20260206.sql` returns no matches (retired file has no executable DDL).
  - `npx supabase db reset` could not be executed locally due missing Docker Desktop (`docker_engine` pipe unavailable on host).

## Task: PAY-01 Fix Stripe Webhook Retry Deadlock (Now)

- [x] Refactor webhook dedupe/lock logic so stale `processing` events can be retried safely while terminal states remain idempotent.
- [x] Ensure webhook processing always transitions to a terminal status (`processed`, `failed`, `skipped`) on normal and error paths.
- [x] Add focused unit tests that simulate interrupted first attempt (`processing`) and verify retry behavior.
- [x] Verify with targeted tests + lint + typecheck, then capture review notes.

## Review: PAY-01 Fix Stripe Webhook Retry Deadlock (Now)

- Status: Completed
- Notes:
  - Refactored `src/app/api/stripe/webhook/route.ts` to use an explicit replay decision for webhook logs:
    - terminal statuses (`processed`, `skipped`) are strict duplicates
    - `failed` is retried
    - `processing` is retried only when stale (default 5-minute window; configurable by `STRIPE_WEBHOOK_PROCESSING_STALE_SECONDS`)
  - Added lock-claim helpers to safely recover from interrupted first attempts while keeping duplicate protection for active in-flight processing.
  - Added processing-path fail-safe: unexpected handler exceptions now mark the webhook row `failed` before returning 500, preventing permanent `processing` deadlocks.
  - Updated webhook log updates to refresh `processed_at` on each transition so staleness checks have reliable timestamps.
  - Added focused tests in `src/app/api/stripe/webhook/route.test.ts` covering:
    - stale-window parsing
    - terminal duplicate behavior
    - fresh in-flight `processing` duplicate behavior
    - stale `processing` retry behavior
- Verification:
  - `npm run test:unit -- src/app/api/stripe/webhook/route.test.ts` passed (`8/8` tests).
  - `npx eslint src/app/api/stripe/webhook/route.ts src/app/api/stripe/webhook/route.test.ts` passed.
  - `npx tsc --noEmit` passed.

## Task: SEC-01 Harden Credit RPC Authorization (Now)

- [x] Create a new Supabase migration that hard-cutover replaces `deduct_and_boost_ad` and `publish_ad_with_credits` to bind actions to `auth.uid()` and enforce ad ownership server-side.
- [x] Lock down function execute permissions to least privilege for client RPC usage.
- [x] Update frontend RPC callers to the new function signatures (remove caller-provided user IDs).
- [x] Verify with targeted lint, typecheck, and unit tests, then document review notes.

## Review: SEC-01 Harden Credit RPC Authorization (Now)

- Status: Completed
- Notes:
  - Added migration `supabase/migrations/20260224143000_harden_credit_rpcs_auth_uid.sql`.
  - Applied migration `20260224143000_harden_credit_rpcs_auth_uid.sql` to remote via `npx supabase db push`.
  - Hard-cutover dropped old vulnerable function signatures:
    - `deduct_and_boost_ad(UUID, UUID, INTEGER)`
    - `publish_ad_with_credits(UUID, JSONB)`
  - Recreated both functions with caller identity bound to `auth.uid()` and no caller-provided `user_id` parameter.
  - Added ad ownership + active-status checks for boost flow directly in SQL.
  - Tightened execute permissions by revoking broad access and granting execute only to `authenticated` and `service_role` for new signatures.
  - Updated frontend RPC callers to the new signatures:
    - `src/app/moj-ucet/DashboardClient.tsx`
    - `src/app/pridat-inzerat/AdWizardClient.tsx`
  - During live verification, found schema drift in legacy function logic (`ads.vin`, `ads.stk_valid_until`, `profiles.updated_at` no longer exist remotely).
  - Added corrective migrations and pushed them:
    - `supabase/migrations/20260224174000_fix_publish_ad_with_credits_ads_schema.sql`
    - `supabase/migrations/20260224181000_fix_credit_rpcs_profiles_updated_at.sql`
  - Aligned ad wizard writes with active schema fields (`warranty_expiration` instead of removed `stk_valid_until`; removed `vin` writes):
    - `src/app/pridat-inzerat/AdWizardClient.tsx`
- Verification:
  - `npx eslint src/app/moj-ucet/DashboardClient.tsx src/app/pridat-inzerat/AdWizardClient.tsx` passed.
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`24` files, `124` tests).
  - `npx supabase db push --yes` applied remote migrations successfully.
  - Live two-user verification script passed against remote DB:
    - owner publish success: `true`
    - owner boost success: `true`
    - cross-user boost blocked: `true` (`Ad not found or access denied`)
    - anonymous execute blocked: `true` (`42501 permission denied`)
    - user B balance unchanged: `20`

## Task: Audit test coverage for key journeys (Now)

- [ ] Inventory existing tests under tests/* and src/**/*.test.*, noting which journeys (search/filter, checkout, credits, dashboards, selling flows) are touched.
- [ ] Identify major user journeys without coverage or with only superficial assertions.
- [ ] Highlight high-risk gaps/breakpoints (button/feature failures, state transitions) with file references.
- [ ] Propose concrete verification/additional tests needed to reduce risk and cite hotspots for follow-up.

## Task: Fix Local Password Reset Redirect Origin (Now)

- [x] Trace password-reset and registration email-link origin resolution in API routes.
- [x] Implement shared auth request-origin resolver with safe precedence for local redirects.
- [x] Wire resolver into auth link generation routes (password reset, register, resend).
- [x] Add focused tests for origin resolution behavior.
- [x] Verify with targeted tests + lint + typecheck and record review.

## Review: Fix Local Password Reset Redirect Origin (Now)

- Status: Completed
- Notes:
  - Added `src/lib/auth/request-origin.ts` to consistently resolve auth redirect origin with `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN` override support.
  - Updated auth link generation routes to use the shared resolver:
    - `src/app/api/auth/password-reset/route.ts`
    - `src/app/api/auth/register/route.ts`
    - `src/app/api/auth/register/resend/route.ts`
  - Added `src/lib/auth/request-origin.test.ts` covering override, request-origin, host fallback, and site-url fallback paths.
- Verification:
  - `npm run test:unit -- src/lib/auth/request-origin.test.ts` passed.
  - `npx eslint src/lib/auth/request-origin.ts src/lib/auth/request-origin.test.ts src/app/api/auth/password-reset/route.ts src/app/api/auth/register/route.ts src/app/api/auth/register/resend/route.ts` passed.
  - `npx tsc --noEmit` passed.

## Task: Search & Filter Logic Audit (Now)

- [x] Inventory `src/components/search/*`, `src/app/vysledky/*`, `src/utils/search.ts`, `src/lib/algolia/*`, `src/app/[brand]*/` routes, and search UI controls for functional bugs, inconsistent behavior, edge cases, and missing tests.
- [x] Document each finding with concrete file references and line numbers, prioritizing severity, and capture any missing tests or coverage gaps.
- [x] Summarize the audit results with references to high-impact issues plus any verification or follow-up recommendations for fixes/tests.
- [x] Add a review note with status and verification evidence after completing the audit.

## Review: Search & Filter Logic Audit (Now)

- Status: Completed
- Notes:
  - Audited the hero search bar, Algolia client page, filter sidebar, and supporting utilities (including Algolia helpers) to surface inconsistent behavior and missing interactive wiring.
  - Logged prioritized functional bugs (hero search navigation debounce, client-side-only sorting, inactive quick-price buttons) and noted the lack of dedicated unit coverage for these controls despite the existing e2e smoke tests.
- Verification:
  - Manual code review of `src/components/search/*`, `src/app/vysledky/*`, `src/lib/algolia/*`, and route pages under `src/app/[brand]*`.
  - `tests/e2e.test.ts`, `tests/smoke-test.ts`, and other Playwright scripts remain focused on high-level pages rather than component-level filtering logic.

## Task: Credits/Payment/Pricing Audit (Now)

- [x] Review `src/config/credits.ts`, pricing pages, API routes, webhook handler, and Supabase migrations to understand current credit-sale logic.
- [x] Trace the flow from checkout to webhook/email confirmation for incorrect accounting, race conditions, security risks, and mismatched business logic.
- [x] Document prioritized findings with concrete file references (start lines if possible) and suggested fixes.
- [x] Add review notes summarizing audit coverage, severity, and any required follow-up verification.

## Review: Credits/Payment/Pricing Audit (Now)

- Status: Completed
- Notes:
  - Logged pricing/business configuration sources (`src/config/credits.ts`), UX entry points (`src/app/ceny/page.tsx`, `src/app/kredity` pages), and payment APIs/webhooks.
  - Verified server-side checkout route, Strpie webhook handling, email notifications, and Supabase migrations/SQL for idempotency, logging, and ledger integrity.
  - Captured high-severity issues: webhook log duplicate guard, duplicate migrations, and inaccurate failure email amounts (see audit summary).
- Verification:
  - Manual code review only (no automated tests run for this audit).

## Task: Frontpage Visual Redesign (Now)

- [x] Audit current frontpage composition and define a stronger visual hierarchy (hero, search block, trust strip, featured/sold transitions).
- [x] Rebuild `src/app/page.tsx` hero and supporting sections with an intentional premium look and clearer action priorities.
- [x] Keep responsive behavior first-class (mobile + desktop) and preserve existing search/listing flows.
- [x] Verify with targeted lint and typecheck for touched files.
- [x] Add review notes with root decisions and verification output.

## Review: Frontpage Visual Redesign (Now)

- Status: Completed
- Notes:
  - Rebuilt homepage structure in `src/app/page.tsx` with a stronger premium hero, layered atmospheric backgrounds, clearer primary/secondary CTA hierarchy, and preserved search-first behavior.
  - Added quick-route cards and a trust-pillar strip so users can choose intent paths fast while keeping visual density and direction.
  - Reframed featured inventory section with stronger heading hierarchy and tighter transition into recently sold feed.
- Verification:
  - `npx eslint src/app/page.tsx` passed.
  - `npx tsc --noEmit` passed.

## Task: Frontpage Hierarchy Review (Now)

- [ ] Inspect `src/app/page.tsx` and related hero/search components to understand the current visual stack.
- [ ] Document 2–3 high-impact hierarchy friction points (hero messaging, trust cues, CTA prominence, spacing, cards).
- [ ] Match each issue to precise Tailwind/variant adjustments or component tweaks that keep intent/responsiveness intact.
- [ ] Capture the proposed changes in a concise list for the user response, citing target files and classes.

## Task: Dealer Dashboard Ads Ordering + Edit Action (Now)

- [x] Confirm dealer dashboard ads tab source and current behavior.
- [x] Sort dealer ads with active status first, then newest within each status.
- [x] Add visible edit action button for each dealer ad card.
- [x] Verify with targeted checks and document review notes.

## Review: Dealer Dashboard Ads Ordering + Edit Action (Now)

- Status: Completed
- Notes:
  - Updated dealer ads fetch payload to include `created_at` and applied active-first sorting with newest-first fallback inside each status group.
  - Added always-visible per-ad edit action in dealer ads cards (`/upravit-inzerat/{id}`).
  - Normalized status checks so `active` detection is consistent for sorting and selection behavior.
  - Added explicit `expired` status badge in dealer ads list for clearer state visibility.
- Verification:
  - `npx eslint src/app/dealer/DealerDashboardClient.tsx` passed.
  - `npx tsc --noEmit` passed.

## Task: Repair Search/Home Visual Regressions After Simplification (Now)

- [x] Rework `/vysledky` layout so filters stay accessible but the page no longer feels broken/heavy.
- [x] Remove sidebar inner-scroll behavior and improve filter/result visual hierarchy.
- [x] Enrich homepage hero search block and button styling so it feels strong, not empty.
- [x] Verify with lint + typecheck and document the outcome.

## Review: Repair Search/Home Visual Regressions After Simplification (Now)

- Status: Completed
- Notes:
  - Reworked homepage hero into a stronger search-first split layout with explicit CTA buttons and supporting search signals.
  - Upgraded `HomeSearchFilters` controls and button treatments so the module no longer feels visually empty/minimal.
  - Updated `/vysledky` filter sidebar copy and removed list-level internal scroll caps so filter options remain fully visible in-page.
  - Corrected Slovak text rendering regressions (broken diacritics) in search/filter UI components.
- Verification:
  - `npx eslint src/app/page.tsx src/components/HomeSearchFilters.tsx src/components/search/FilterSidebar.tsx src/app/vysledky/AlgoliaSearchPageClient.tsx` passed.
  - `npx tsc --noEmit` passed.
  - Browser sanity check completed on `/` and `/vysledky` using Playwright snapshots.

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

## Task: DEALER-01 Dealer bulk actions analysis (Now)

- [ ] Catalog existing TODO placeholders and data flow in the dealer dashboard, APIs, and credit handling layers.
- [ ] Define the safest minimal-impact implementation path, include files/functions to change and reusable helpers/RPCs.
- [ ] Outline the verification/tests needed to prove the new dealer bulk actions work safely.

## Review: DEALER-01 Dealer bulk actions analysis (Now)

- Status: Pending

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

## Task: MESSAGE-01 Canonical inquiries analysis (Now)

- [ ] Review inquiry/message persistence, models, and relevant UI components to map the current mismatch between stored records and dashboard views.
- [ ] Identify the exact files that need minimal hard-cutover updates to make inquiries canonical, fix `CarDetailClient` send path, and have dashboard Messages tab render persisted inquiry rows for both sender and seller.
- [ ] Draft concrete code-level recommendations plus any necessary new test files before altering behavior (e.g., record load, send flow validation, dashboard displays).
- [ ] Define verification steps that prove both the sender and seller now see persisted inquiries and that false-success send paths are removed.
  - `npm run test:unit -- src/lib/security/maintenance-bypass.test.ts src/lib/request-fingerprint.test.ts` passed.
  - `npm run build` passed.




