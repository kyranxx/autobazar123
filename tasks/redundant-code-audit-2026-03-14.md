# Redundant Code Audit

Date: 2026-03-14

## Scope

Repo-wide audit across tracked source plus local dot-folders and generated artifacts.

Methods used:
- exact duplicate scan with SHA-256 hashes
- clone detection with `jscpd` over maintained source
- dead-code and package-usage scan with `knip`

Headline numbers:
- `jscpd`: 96 clones across maintained source, about 3.44% duplicated lines overall
- biggest duplication bucket in maintained code: SQL migrations at about 17.13% duplicated lines
- local/generated footprint currently present:
  - `.next`: 8,070 files, about 920.45 MB
  - `node_modules`: 54,600 files, about 741.44 MB
  - `output`: 273 files, about 165.89 MB
  - `docs/vendor`: 70 files, about 45.89 MB
  - `.playwright-cli`: 179 files, about 2.43 MB

## Highest-Value Findings

### 1. Exact duplicate maintained scripts

These are byte-for-byte duplicates and should have one canonical home only.

- [scripts/codex-cli-check.mjs](/c:/Users/User/Desktop/Projects/autobazar123/scripts/codex-cli-check.mjs#L1) duplicates [tools/codex-cli-check.mjs](/c:/Users/User/Desktop/Projects/autobazar123/tools/codex-cli-check.mjs#L1)
- [scripts/resend-smoke.ts](/c:/Users/User/Desktop/Projects/autobazar123/scripts/resend-smoke.ts#L1) duplicates [tools/resend-smoke.ts](/c:/Users/User/Desktop/Projects/autobazar123/tools/resend-smoke.ts#L1)

Refactor:
- choose either `scripts/` or `tools/` as the canonical location
- update [package.json](/c:/Users/User/Desktop/Projects/autobazar123/package.json#L50) and [scripts/vendor-docs-sync.mjs](/c:/Users/User/Desktop/Projects/autobazar123/scripts/vendor-docs-sync.mjs#L164) to point to that one copy
- delete the duplicate copy after references are moved

### 2. Duplicate SEO route implementations

The brand/model route and brand/model/city route are largely parallel implementations with duplicated helpers, metadata construction, JSON-LD assembly, market-summary logic, CTA blocks, and listing rendering.

- [src/app/(site)/[brand]/[model]/page.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/app/(site)/[brand]/[model]/page.tsx#L30)
- [src/app/(site)/[brand]/[model]/[city]/page.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/app/(site)/[brand]/[model]/[city]/page.tsx#L52)

Refactor:
- extract shared helpers for:
  - metadata assembly
  - absolute URL and search URL builders
  - inventory `ItemList` JSON-LD
  - market summary stats
  - empty-state and search CTA blocks
  - shared page shell and breadcrumb rendering
- keep only city-specific copy and filtering in the city route

### 3. Auth entry pages are effectively the same component twice

- [src/app/auth/login/page.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/app/auth/login/page.tsx#L9)
- [src/app/auth/register/page.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/app/auth/register/page.tsx#L9)

The only meaningful differences are the SR-only title and `initialView`.

Refactor:
- replace both with a shared `AuthEntryPage` wrapper or a single page factory
- pass `initialView` and the translation key as props

### 4. Auth/account API routes repeat the same request pipeline

The following routes all repeat the same structure:
- CSRF rejection
- strict rate-limit check
- `request.json().catch(() => null)`
- `zod.safeParse`
- similar JSON error responses

Examples:
- [src/app/api/auth/register/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/auth/register/route.ts#L27)
- [src/app/api/auth/register/resend/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/auth/register/resend/route.ts#L21)
- [src/app/api/auth/password-reset/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/auth/password-reset/route.ts#L35)
- [src/app/api/account/password/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/account/password/route.ts#L22)
- [src/app/api/account/delete/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/account/delete/route.ts#L22)
- [src/app/api/account/phone/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/account/phone/route.ts#L25)
- [src/app/api/account/password/recovery/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/account/password/recovery/route.ts#L25)

Refactor:
- extract shared route helpers such as:
  - `enforceCsrf`
  - `enforceStrictRateLimit`
  - `parseJsonBody(schema, request)`
  - `requireAuthenticatedUser`
  - standard `retry-after` response builder
- this will reduce drift across security-sensitive routes

### 5. Cron route boilerplate is duplicated

- [src/app/api/cron/cleanup-sold/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/cron/cleanup-sold/route.ts#L7)
- [src/app/api/cron/expire-ads/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/cron/expire-ads/route.ts#L8)

Shared duplication includes:
- cron-secret validation
- admin Supabase client creation
- ads cache-tag revalidation
- identical top-level error handling

Refactor:
- extract `verifyCronRequest`
- extract `createCronSupabaseAdmin`
- extract `revalidateAdsTags`
- keep only the actual mutation/query logic in each route

### 6. Site-admin detection logic is duplicated

- [src/app/api/health/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/health/route.ts#L26)
- [src/app/api/admin/quality-gates/route.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/app/api/admin/quality-gates/route.ts#L436)

Refactor:
- move this into a shared auth helper such as `isCurrentUserSiteAdmin()`
- this is security-sensitive logic and should not drift

## Medium-Value Findings

### 7. Test suites overlap heavily

Route discovery and accessibility checks are repeated across:
- [tests/web-interface-sitewide.test.ts](/c:/Users/User/Desktop/Projects/autobazar123/tests/web-interface-sitewide.test.ts#L49)
- [tests/webapp-audit.ts](/c:/Users/User/Desktop/Projects/autobazar123/tests/webapp-audit.ts#L171)
- [tests/web-interface-guidelines.test.ts](/c:/Users/User/Desktop/Projects/autobazar123/tests/web-interface-guidelines.test.ts#L23)

Auth modal form setup is also repeated:
- [src/components/AuthModal.email-flow.test.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.email-flow.test.tsx#L47)
- [src/components/AuthModal.password-strength.test.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.password-strength.test.tsx#L54)

Refactor:
- add shared test helpers for:
  - route normalization and discovery
  - unlabeled-control and missing-alt scans
  - `renderAuthModal()`
  - register-form element lookup and filling

### 8. Small but direct UI duplication

- [src/components/ui/LoadingSpinner.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/components/ui/LoadingSpinner.tsx#L1) is duplicated inline inside [src/app/(site)/kredity/CreditsPageClient.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/app/(site)/kredity/CreditsPageClient.tsx#L290)

Refactor:
- import the shared spinner instead of maintaining a local copy

### 9. Email sending paths repeat the same delivery flow

- [src/lib/email/send-auth-emails.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/lib/email/send-auth-emails.ts#L37)

`sendRegistrationConfirmationEmail` and `sendPasswordRecoveryEmail` both:
- render a template
- call `sendEmail`
- log delivery
- convert a provider result into `{ success, error }`

Refactor:
- extract a shared internal helper such as `sendLoggedTransactionalEmail`
- keep only template-specific inputs and metadata in the exported functions

### 10. Supabase utility scripts duplicate the same bootstrap block

Several scripts repeat the same dotenv loading and Supabase client initialization:
- [scripts/check-ads.ts](/c:/Users/User/Desktop/Projects/autobazar123/scripts/check-ads.ts#L1)
- [scripts/create-test-ad.ts](/c:/Users/User/Desktop/Projects/autobazar123/scripts/create-test-ad.ts#L1)
- [scripts/db-stats.ts](/c:/Users/User/Desktop/Projects/autobazar123/scripts/db-stats.ts#L1)
- [scripts/seed-models-complete.ts](/c:/Users/User/Desktop/Projects/autobazar123/scripts/seed-models-complete.ts#L1)
- [scripts/seed-60-cars.ts](/c:/Users/User/Desktop/Projects/autobazar123/scripts/seed-60-cars.ts#L1)
- [scripts/verify_api_access.js](/c:/Users/User/Desktop/Projects/autobazar123/scripts/verify_api_access.js#L2)
- [scripts/verify_db_tables.js](/c:/Users/User/Desktop/Projects/autobazar123/scripts/verify_db_tables.js#L2)

Refactor:
- create one shared script helper for env loading and client creation
- standardize on one module format instead of mixing TS ESM and CommonJS

## Dead Code and Package Cleanup

`knip` flagged likely dead files:
- [tools/codex-cli-check.mjs](/c:/Users/User/Desktop/Projects/autobazar123/tools/codex-cli-check.mjs)
- [tools/resend-smoke.ts](/c:/Users/User/Desktop/Projects/autobazar123/tools/resend-smoke.ts)
- [src/components/FeaturedCars.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/components/FeaturedCars.tsx)
- [src/components/FeaturedCarsClient.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/components/FeaturedCarsClient.tsx)
- [src/components/RecentlySoldFeed.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/components/RecentlySoldFeed.tsx)
- [src/components/RecentlySoldFeedClient.tsx](/c:/Users/User/Desktop/Projects/autobazar123/src/components/RecentlySoldFeedClient.tsx)
- [src/lib/algolia/search.ts](/c:/Users/User/Desktop/Projects/autobazar123/src/lib/algolia/search.ts)
- [tools/chrome-tab-exporter/background.js](/c:/Users/User/Desktop/Projects/autobazar123/tools/chrome-tab-exporter/background.js)
- [tools/chrome-tab-exporter/panel.css](/c:/Users/User/Desktop/Projects/autobazar123/tools/chrome-tab-exporter/panel.css)
- [tools/chrome-tab-exporter/panel.js](/c:/Users/User/Desktop/Projects/autobazar123/tools/chrome-tab-exporter/panel.js)

Likely removable dependencies from [package.json](/c:/Users/User/Desktop/Projects/autobazar123/package.json#L87):
- `@radix-ui/react-icons`
- `@radix-ui/react-select`
- `@radix-ui/react-slot`
- `embla-carousel-autoplay`
- `embla-carousel-react`
- `fslightbox-react`
- `react-slick`
- `slick-carousel`
- `@swc/helpers`
- `@types/react-slick`
- `dotenv`

Note:
- validate the `chrome-tab-exporter` and `starter-kit` folders before deleting anything; they may be intentionally parked tooling
- `docs/vendor` is large but appears intentional, not accidental redundancy

## Generated and Local Artifact Redundancy

These are not core product code, but they do add noise and storage cost:

- `.next` contains many duplicate build artifacts and caches
- `output/` contains duplicated screenshots and duplicate starter-kit smoke outputs
- `.playwright-cli/` contains many identical page snapshots and network logs
- `supabase/.temp` and `supabase/supabase/.temp` are mirrored temp directories

Examples of exact duplicates:
- [public/placeholder-car.jpg](/c:/Users/User/Desktop/Projects/autobazar123/public/placeholder-car.jpg) and [public/placeholder-car-hero.jpg](/c:/Users/User/Desktop/Projects/autobazar123/public/placeholder-car-hero.jpg)
- `output/chrome-console-quick-check/latest.*` and timestamped copies
- many repeated `.playwright-cli/page-*.yml` files

Refactor:
- keep only one placeholder image unless the names communicate different intended usage
- periodically clear `output/`, `.next`, and `.playwright-cli` locally
- pick one Supabase temp location and ignore both temp trees consistently

## SQL Migration Duplication

The migration history has heavy copy-paste reuse, especially around credit RPCs and publish-ad function revisions:
- [supabase/migrations/20260224174000_fix_publish_ad_with_credits_ads_schema.sql](/c:/Users/User/Desktop/Projects/autobazar123/supabase/migrations/20260224174000_fix_publish_ad_with_credits_ads_schema.sql)
- [supabase/migrations/20260224181000_fix_credit_rpcs_profiles_updated_at.sql](/c:/Users/User/Desktop/Projects/autobazar123/supabase/migrations/20260224181000_fix_credit_rpcs_profiles_updated_at.sql)
- [supabase/migrations/20260304110000_harden_publish_ad_photo_policy.sql](/c:/Users/User/Desktop/Projects/autobazar123/supabase/migrations/20260304110000_harden_publish_ad_photo_policy.sql)

This is historically understandable, but it makes schema reasoning harder.

Refactor:
- do not rewrite historical migrations unless the team intentionally squashes them
- for future work, prefer one baseline migration plus smaller delta migrations in fresh branches or scheduled squashing windows

## Priority Order

1. Remove exact duplicate maintained files in `scripts/` and `tools/`
2. Consolidate shared auth/account route plumbing
3. Consolidate shared cron route plumbing
4. Extract shared SEO route helpers for the programmatic inventory pages
5. Delete or reconnect dead components and unused Algolia helper
6. Trim unused dependencies from `package.json`
7. Clean local artifact folders and duplicate placeholder assets

## Low-Risk Refactor Plan

1. Delete exact duplicate script files after switching all references to one canonical copy.
2. Add shared helpers for auth route guards and response shaping.
3. Add shared helpers for cron auth and cache revalidation.
4. Extract a shared SEO inventory page module for metadata, JSON-LD, and list rendering.
5. Build small test utilities to remove repeated DOM setup in AuthModal and route-audit tests.
6. Run `knip` again and delete anything still confirmed unused.
