# I18n Completion Pass

- [x] Audit remaining translatable hardcoded copy in public/shared UI surfaces.
- [x] Move shared-component literals into `src/i18n/messages/{sk,en,hu}.json`.
- [ ] Move route-level public-page literals into `src/i18n/messages/{sk,en,hu}.json`.
- [ ] Keep only non-translatable constants/data hardcoded and verify that choice during self-review.
- [x] Run `npm run check:i18n-contract`.
- [x] Run `npm run check:i18n-diacritics`.
- [x] Run baseline verification: `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`.

## Review

- First verified sweep:
  - Localized shared/public surfaces that still mixed hardcoded Slovak into otherwise translated flows: `src/app/not-found.tsx`, `src/app/maintenance/page.tsx`, `src/app/auth/reset-password/page.tsx`, `src/components/CookieBanner.tsx`, `src/components/SimpleMap.tsx`, `src/components/home/HomeSearchFormClient.tsx`, and `src/components/wizard/steps/Step3Technical.tsx`.
  - Added matching catalog keys to `src/i18n/messages/sk.json`, `src/i18n/messages/en.json`, and `src/i18n/messages/hu.json`.
  - Fixed the reset-password recovery helper to return locale-neutral error reasons instead of embedding Slovak strings in `src/lib/auth/recovery-session.ts`, and updated its tests.
  - Cleared existing diacritics-gate blockers uncovered during the pass in `src/app/(site)/admin/components/AdminUsers.tsx`, `src/app/(site)/cookies/CookiesPageClient.tsx`, `src/app/api/contact/route.ts`, and the locale catalogs.
  - Verification:
    - `npm run check:i18n-contract` (pass)
    - `npm run check:i18n-diacritics` (pass)
    - `npx tsc --noEmit` (pass)
    - `npm run lint` (pass)
    - `npm run test:unit` (pass; 71 files / 315 tests)
  - Residual scope:
    - Route-level public pages such as dealer/dealers, credits success, legal/programmatic SEO pages, and several admin/dealer/detail sub-surfaces still have hardcoded user-facing copy and need a second pass before this checklist can be marked complete.
