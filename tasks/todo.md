# Active Todo

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
