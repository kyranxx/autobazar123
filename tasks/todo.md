# Active Todo

## GitHub Sync (2026-02-22)

- [x] Review working tree status and remote target.
- [x] Update `tasks/todo.md` with this sync task.
- [x] Commit current repository changes.
- [x] Push `master` to `origin`.

## Review (GitHub Sync)

- Synchronized current repository updates into a new commit.
- Pushed local `master` branch updates to `origin/master`.

## InstantSearch Experimental Warning Resolution (2026-02-22)

- [x] Upgrade `react-instantsearch-nextjs` to latest published version.
- [x] Verify whether upstream removed the dev experimental warning.
- [x] If warning persists, document root cause and present only non-hack options.

## Review (InstantSearch Experimental Warning Resolution)

- Upgraded `react-instantsearch-nextjs` from `^1.0.11` to `^1.0.15` in `package.json` and `package-lock.json` (latest published version as of 2026-02-22).
- Verification:
  - `npx tsc --noEmit` passes.
  - Targeted browser check on `/vysledky` still logs:
    - `[react-instantsearch-nextjs] InstantSearchNext relies on experimental APIs...`
- Root cause:
  - The warning is emitted unconditionally in development by `react-instantsearch-nextjs` source (`InstantSearchNext` calls `warn(false, ...)`) and has no disable prop/flag.
- Non-hack options:
  - Keep current App Router integration and accept this single dev-only upstream warning (production has no warning).
  - Migrate the search route off App Router experimental path (for example to Pages Router + stable InstantSearch routing integration), which is a larger architectural change.

## InstantSearch Warning Cleanup (2026-02-22)

- [x] Confirm all warning sources in `/vysledky` search surface.
- [x] Remove `preserveSharedStateOnUnmount` deprecation warning with explicit `future` config.
- [x] Migrate App Router search root to `react-instantsearch-nextjs` integration.
- [x] Re-run verification (`npx tsc --noEmit` + targeted warning scan) and capture outcomes.
- [x] Add review notes and residual risk.

## Review (InstantSearch Warning Cleanup)

- Updated search root in `src/app/vysledky/AlgoliaSearchPageClient.tsx` to use `InstantSearchNext`.
- Added explicit `future={{ preserveSharedStateOnUnmount: false }}` to remove the deprecation warning without changing current state-unmount behavior.
- Removed obsolete Playwright ignore patterns for the old App Router warning in `tests/e2e.test.ts` and `tests/webapp-audit.ts` so regressions are now detectable.
- Verification:
  - `npx tsc --noEmit` passes.
  - `npx playwright test tests/e2e.test.ts --grep "Search navigation stability"` passes.
  - Targeted Playwright console scan on `http://localhost:3000/vysledky` reports that previous warnings are gone:
    - `preserveSharedStateOnUnmount` warning: not present.
    - `We've detected you are using Next.js with the App Router` warning: not present.
  - Remaining dev-only warning:
    - `[react-instantsearch-nextjs] InstantSearchNext relies on experimental APIs...`
- Residual risk:
  - The remaining warning is emitted by `react-instantsearch-nextjs` itself in development mode; it does not appear in production builds.

## next-intl Timezone Stabilization (2026-02-22)

- [x] Add global `timeZone` to next-intl request config.
- [x] Pass `timeZone` through app provider wrapper to `NextIntlClientProvider`.
- [x] Wire `layout.tsx` to provide server-resolved timezone.
- [x] Verify with `npx tsc --noEmit` and browser check for `ENVIRONMENT_FALLBACK`.
- [x] Document outcomes and residual risk.

## Review

- Added default timezone in request config at `src/i18n/request.ts` (`Europe/Bratislava`).
- `src/app/providers.tsx` now requires and forwards `timeZone` to `NextIntlClientProvider`.
- `src/app/layout.tsx` now reads timezone from `getTimeZone()` and passes it to `AppProviders`.
- Verification:
  - `npx tsc --noEmit` passes.
  - Browser runtime check on `/` reports: `No next-intl timezone fallback errors detected on /.`.
- Residual risk:
  - Browser tab with old HMR state can still display stale console output until hard refresh (`Ctrl+F5`).

## Ad Images via Cloudflare Images (2026-02-22)

- [x] Confirm upload and render paths for ad photos.
- [x] Apply Cloudflare image optimization helper to ad image render points.
- [x] Remove non-Cloudflare external fallback for ad thumbnails.
- [x] Verify with targeted tests/typecheck.
- [x] Document results and residual risk.

## Review (Ad Images via Cloudflare Images)

- Confirmed ad uploads are Cloudflare-backed through `src/utils/upload.ts` and `src/app/api/images/upload-url/route.ts`.
- Applied `optimizeCloudflareImage` to ad rendering surfaces in search, detail, dashboard, dealer dashboard, featured cars, and recently sold cards.
- Replaced ad thumbnail Unsplash fallbacks in user dashboard paths with local `/placeholder-car.jpg`.
- Verification:
  - `npx tsc --noEmit` passes.
  - `npx vitest run src/lib/image-optimizer.test.ts` passes (7/7 tests).
- Residual risk:
  - Existing mock/demo image URLs remain in non-ad demo content and are outside the ad upload/render pipeline.

## Legacy Ad Image URL Cleanup Migration (2026-02-22)

- [x] Define one-time DB migration scope for `ads.photos_json`.
- [x] Keep only Cloudflare delivery URLs (`https://imagedelivery.net/...`) in existing rows.
- [x] Ensure migration is safe/idempotent (update only changed rows, preserve order, array-safe).
- [x] Add verification query comments for before/after checks.
- [x] Document rollout guidance.

## Review (Legacy Ad Image URL Cleanup Migration)

- Added migration: `supabase/migrations/20260222100000_filter_ads_photos_cloudflare.sql`.
- Migration behavior:
  - Processes only rows where `photos_json` is a JSON array.
  - Filters each array to keep only `https://imagedelivery.net/...` entries.
  - Preserves original element order.
  - Updates only rows where the filtered array differs from current value.
- Included verification SQL comment in the migration file for pre/post run validation.
- Residual risk:
  - Ads that only had non-Cloudflare URLs will end up with an empty `photos_json` array and render placeholder images.
  - No schema/data regression expected, but listings that only had legacy external URLs now rely on UI placeholder fallbacks.
