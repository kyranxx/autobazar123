# Release Readiness

Last updated: 2026-06-19

Use this as the single pre-release document.

Rule:
- If any required item fails, do not ship.
- If the site is still maintenance-gated, keep maintenance mode on.

## Fast Local Paths

### Quick preflight

```bash
npm run easy:quick
```

Use this for a fast sanity pass before small changes.

### Stronger ship-ready pass

```bash
npm run easy:full
```

This runs:

- lint
- typecheck
- unit tests
- security release gate
- UI quality gate
- analytics taxonomy test
- links-ingestion tests

Important:
- `easy:full` is useful, but it does not replace targeted tests for the touched area.

## Required Automated Checks

Run what matches the change:

1. `npm run typecheck`
2. `npm run test:security:release-gate` for auth, payment, security, release, or env-sensitive work
3. Targeted tests for the touched area
4. `npm run test:web-interface`, `npm run test:a11y`, `npm run test:keyboard`, `npm run test:mobile-matrix`, or `npm run test:ui-quality-gate` for UI work
5. `npm run test:release-gauntlet` for release-facing flow confidence
6. `npm run audit:webapp` when route-level or runtime regressions matter
7. `npm run check:launch-test-coverage` before launch-account runs, to confirm which configured E2E accounts and DB candidate data can cover admin, non-admin, seller, and dealer checks without printing secrets
8. `npm run check:algolia-search` before preview validation, to confirm the configured Algolia index is searchable and matches active Supabase inventory
9. `npm audit --json` after dependency changes, to confirm there are no unresolved npm advisories in the exact lockfile
10. `npm run test:launch-test-coverage-script` after changing the launch-account checker
11. `npm run test:algolia-search-script` after changing the Algolia search coverage checker

Authenticated release-gauntlet flows:

```bash
E2E_AUTH_EMAIL="you@example.com" E2E_AUTH_PASSWORD="your-password" npm run test:release-gauntlet -- --grep "Release gauntlet authenticated flows"
```

For full role/data coverage in one run, provide role-specific credentials when available:

- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` for admin dashboard access.
- `E2E_NON_ADMIN_EMAIL` / `E2E_NON_ADMIN_PASSWORD` for admin-denial and non-dealer checks.
- `E2E_SELLER_EMAIL` / `E2E_SELLER_PASSWORD` for owned-ad edit/top/sold checks.
- `E2E_DEALER_EMAIL` / `E2E_DEALER_PASSWORD` for dealer billing/topup checks.

If these are missing, the gauntlet falls back to `E2E_AUTH_EMAIL` / `E2E_AUTH_PASSWORD` and skips honestly when that account cannot cover the role or data condition.
Playwright loads `.env.local` for the test runner, so local credential keys can stay in `.env.local` without shell-exporting them.

Account setup reference: `docs/launch-test-accounts.md`.

## Deployment Cadence

When deploy is in scope and production is still maintenance-gated:

1. Make the change.
2. Check preview first.
3. Verify preview deployment is `Ready`.
4. Verify preview `/api/health` is `healthy`.
5. Run local targeted checks.
6. Do a short production verification while maintenance mode is still on.
7. Remove maintenance mode only when required checks pass and we both feel comfortable.

## Core Product Checks

Status key:
- `Verified local`: checked on fresh `localhost:3000`.
- `Partial`: route/guard works, but full authenticated or external-provider flow still needs credentials/env.
- `Blocked`: do not treat as launch-ready until resolved.
- `Not in scope`: not checked because no deploy was requested.

- [x] Homepage opens. `Verified local` by smoke, UI gates, webapp audit, and the 2026-05-16 reflow fix for redesigned homepage quick-choice cards.
- [x] Search/results page opens and keeps route/UI baseline. `Partial`: local route checks, mocked Algolia release-gauntlet promoted-order/no-legacy-top-filter check, read-only real Algolia/Supabase count check, and focused desktop/mobile `/vysledky?bodyStyle=motorcycle` runtime check passed after the missing locale key was fixed. Preview browser validation against deployed Algolia env is still needed.
- [x] Listing detail page opens. `Verified local` by webapp audit over sampled live detail URLs.
- [ ] Sign up works. `Partial`: page opens, UI/a11y checks passed, and register/resend POST routes have mocked local coverage. Real submit, email delivery, and confirmation-link flow still need a real test account/provider run.
- [x] Login works. `Verified local`: authenticated dashboard/signout passed in release-gauntlet, and the focused E2E auth entry/exit happy path passed with the local test account.
- [ ] Password reset works. `Partial`: page opens, UI/a11y checks passed, password-reset POST route has mocked local coverage for recovery link generation and queueing, and account password recovery POST has mocked local coverage for token verification, password update, and recovery-session revocation. Real email delivery/reset token flow still needs a real test account/provider run.
- [x] Add listing works. `Verified local`: protected guest redirect works, account ads POST route behavior has mocked local coverage, and the 2026-06-19 release-gauntlet seller lifecycle created a real test listing with two uploaded photos, then cleaned it up.
- [x] Edit/manage own listing works. `Verified local`: route-level quick-edit / feature-action behavior has mocked local coverage. The 2026-06-19 release gauntlet verified seller edit, photo removal, mark-sold, seller dashboard delete/remove, and cleanup with 0 leftover release-gauntlet ads. `DELETE /api/account/ads` verifies owner scope and removes the Algolia object before the seller-scoped DB delete.
- [ ] Inquiry/contact works. `Partial`: contact page opens, contact POST has mocked local coverage, and buyer inquiry POST/PATCH route behavior has mocked local coverage. Real browser submit and seller delivery/read path still need verification.
- [ ] Payment flow works if paid features are enabled. `Partial`: `/platba/uspech` and legacy `/kredity/uspech` route behavior are verified locally, checkout-status GET behavior has mocked local coverage, Stripe checkout/webhook POST behavior has mocked local coverage, and the release gauntlet verifies seller paid-listing and dealer topup checkout payloads. Real Stripe checkout and live webhook delivery still need verification.
- [ ] Admin area still works. `Partial`: guest/admin guardrails work; the configured admin account reached the admin dashboard, non-admin admin denial passed, the non-dealer dealer prompt was verified, dealer topup payload was verified, and the dealer verification request API has mocked coverage for owner-scoped state, duplicate pending guard, verified/missing dealer rejection, and request creation. Admin dealer-verification UI still needs browser coverage.

## Launch / Release Gate Checks

- [ ] Preview deployment is `Ready` when preview is in scope. `Not in scope`: no deploy requested this pass.
- [ ] Preview `/api/health` is `healthy` when preview is in scope. `Not in scope`: no deploy requested this pass. Local `/api/health` route behavior has unit coverage.
- [ ] Production deployment is `Ready` when production is in scope. `Not in scope`: no deploy requested this pass.
- [ ] Production `/api/health` is `healthy` when production is in scope. `Not in scope`: no deploy requested this pass. Local `/api/health` route behavior has unit coverage.
- [ ] Maintenance mode still protects the public before launch. `Not in scope`: production was not touched; keep it on.
- [ ] Maintenance bypass still works for us. `Partial`: local token helper, unlock route, and proxy host behavior have unit coverage. The real production bypass must still be rechecked before opening.
- [x] No obvious runtime or browser-console errors on key pages. `Verified local`: `npm run audit:webapp` passed on 2026-05-20 with 80/80 desktop/mobile route checks complete, 0 failing routes, 0 console warnings/errors, 0 network failures, and 0 DevTools issues. Preview browser validation is still needed after deploy approval.
- [x] Dependency audit is clean. `Verified local`: `npm audit --json` reports 0 vulnerabilities after direct dependency bumps and explicit transitive overrides.
- [ ] No open P0/P1 defect in auth, payment, search, listing lifecycle, or admin permissions. `Blocked`: no current local P0/P1 found in available checks, but real inquiry delivery, real checkout/webhook delivery, password reset, and signup still need full real-account/provider coverage.

## Evidence From 2026-05-15 / 2026-05-16 Local Pass

- `npm audit --json` passed with 0 vulnerabilities after dependency hardening.
- `npm run typecheck` passed after removing stale generated `.next/dev` artifacts, regenerating route types, and running TypeScript without stale incremental state.
- `npm run build` passed with Next 16.2.6 after removing stale generated `.next/dev` artifacts before build.
- A later `npm run typecheck` failed because App Router API route files exported helper functions/objects for tests; those helpers were moved to sidecar modules. Fresh `npm run typecheck` then passed.
- Fresh `npm run build` passed after the route-helper export fix: Next 16.2.6 compiled successfully, ran TypeScript, and generated 1573 static pages.
- `npx vitest run src/app/api/contact/route.rate-limit.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/app/api/admin/quality-gates/route.test.ts src/app/api/monitoring/quality-gates/route.test.ts --pool=forks --no-file-parallelism --maxWorkers=1` passed 7/7 files and 62/62 tests.
- `npm run easy:quick` passed after the homepage reflow fix: lint, typecheck, and 89/89 unit files with 448/448 tests.
- `npm run test:security:release-gate` passed after the homepage reflow, health-test updates, App Router route-helper policy update, and build/typecheck cleanup.
- Fresh 2026-05-17 `npm run test:security:release-gate` passed after updating the policy to track moved quality-gate OIDC internals and to run the repo cleanup-aware `npm run typecheck`.
- `node --check scripts/clean-next-dev-artifacts.mjs` and `node --check scripts/dev-server.mjs` passed after adding a guard that refuses to delete `.next/dev` while this project's dev server is running.
- Fresh `npm run typecheck` passed after the live-dev-server cleanup guard, proving cleanup still works when no dev server is active.
- `npx playwright test tests/webapp-audit.ts --grep "webapp audit issue filtering" --reporter=line` passed 4/4 after the audit timeout/filtering changes.
- `npm run check:i18n-contract`, `npm run check:sk-diacritics`, and `npm run check:i18n-diacritics` passed after adding `bodyType.motorcycle` to the locale catalogs.
- `npm run check:algolia-search` passed: configured `ads` index has 56 searchable records, matching 56 active Supabase ads, with sample hits returning required fields.
- `npm run test:algolia-search-script` passed 3/3 tests, covering required sample-hit fields, no-active-ad failure, and Supabase/Algolia count mismatch failure without live network access.
- `npx vitest run src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts` passed 20/20 tests, covering register/resend/password-reset throttling, CSRF/origin guardrails, strict payload validation, provider link generation, email queueing, missing-token/link failure, queue failure, and enumeration-safe reset behavior.
- `npx vitest run src/app/api/account/password/recovery/route.test.ts` passed 12/12 tests, covering recovery payload parsing, CSRF/rate-limit guards, public Supabase config failure, recovery token verification, admin password update, recovery-session revocation, and password update failure.
- `npx vitest run src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts` passed 32/32 tests.
- `npx vitest run src/app/api/account/password/route.test.ts` passed 7/7 tests, covering CSRF/rate-limit guards, auth requirement, password payload validation, Supabase password update failure, successful update, and other-session revocation.
- `npx vitest run src/app/api/account/password/route.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts` passed 39/39 tests.
- `npm run check:launch-test-coverage` passed as a read-only coverage report: primary login/admin coverage exists; non-admin and seller-with-owned-ad credentials are missing despite DB candidates; dealer coverage is missing and the DB has 0 dealer owners.
- `npm run test:launch-test-coverage-script` passed 2/2 tests, covering role-specific fallback and DB candidate-count logic without live Supabase access.
- `docs/launch-test-accounts.md` documents the exact credential/data gaps and the verification commands to remove account/data skips.
- `npx vitest run src/app/api/account/ads/route.test.ts` passed 6/6 tests, covering auth, paid draft creation with server-resolved brand/model names, free auto-publish, failed publish cleanup, quick edit, and ownership denial.
- `npx vitest run src/app/api/account/ads/apply-action/route.test.ts` passed 5/5 tests, covering auth, ownership denial, paid checkout metadata handoff, free listing action RPC application, and RPC failure handling.
- `npx vitest run src/app/api/account/dealer-verification/route.test.ts` passed 6/6 tests, covering authenticated owner-scoped reads, missing dealer rejection, already-verified dealer rejection, duplicate pending request rejection, and pending request creation.
- `npx vitest run src/app/api/account/dealer-verification/route.test.ts src/app/api/account/ads/route.test.ts src/app/api/account/ads/apply-action/route.test.ts` passed 17/17 tests.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line` passed 13/13 on 2026-06-19, including seller create, two-photo upload through Cloudflare direct-upload, edit description/price, remove one photo, mark sold, seller dashboard delete/remove, and cleanup.
- `npx vitest run src/app/api/account/ads/route.test.ts` passed 12/12 after adding seller-owned delete, invalid-id/auth/ownership denial, DB delete failure, and Algolia cleanup-failure coverage.
- `npx vitest run src/lib/analytics/events.test.ts` passed 17/17 after adding the `listing_deleted` analytics taxonomy event.
- `npx vitest run src/lib/security/csp.test.ts src/utils/upload.test.ts` passed 10/10 after allowing `https://upload.imagedelivery.net` in CSP.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts` passed 8/8 tests, covering explicit secret resolution, no derived secret fallback, valid signed tokens, wrong-secret rejection, tampered tokens, malformed/expired tokens, and the 24-hour validity window.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts src/app/api/maintenance/unlock/route.test.ts src/proxy.test.ts` passed 27/27 tests.
- `npx vitest run src/app/api/health/route.test.ts src/proxy.test.ts src/lib/security/maintenance-bypass.test.ts` passed 29/29 tests, covering local health route behavior plus proxy/maintenance-bypass behavior.
- `npm run check:theme-guard` passed after replacing the unrelated marketplace UI raw hex with existing background color tokens.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts` passed 8/8 tests, covering missing session id, auth, admin-client failure, actor-owned checkout lookup, dealer-owner fallback lookup, pending response, and lookup failure.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts` passed 41/41 tests.
- `npx vitest run src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts` passed 33/33 tests, covering checkout route dealer topup metadata, private listing checkout metadata, seller ownership rejection, billing-session updates, idempotency storage, checkout helper behavior, and webhook behavior.
- `npx vitest run src/app/api/stripe/webhook/route.test.ts` passed 22/22 tests, covering missing config, missing/invalid Stripe signature, duplicate terminal skip, paid checkout RPC application, and unpaid checkout deferral.
- `npx vitest run src/app/api/contact/route.rate-limit.test.ts` passed 6/6 tests, covering invalid payload, rate limit, missing admin config, sanitized insert, and insert failure.
- `npx vitest run src/app/api/inquiries/route.test.ts` passed 8/8 tests, covering auth, captcha, ad lookup, seller recipient enforcement, self-message rejection, submit handoff, and seller qualification permissions.
- `npm run list:fallbacks` passed.
- `npm run test:web-interface` passed 18/18 after the latest homepage/search UI changes; on 2026-06-19 it also passed after the Playwright config fix that lets mobile Chromium projects use `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome`.
- Initial `npm run test:a11y` found redesigned homepage quick-choice cards wider than a 320px viewport; `src/components/home/HomePageShell.tsx` now constrains those links with `min-w-0 max-w-full overflow-hidden`.
- `npx playwright test tests/reflow-zoom.test.ts` passed 21/21 after the homepage reflow fix.
- `npm run test:a11y` passed 63/63 after the homepage reflow fix.
- `npm run test:keyboard` passed 9/9.
- `npm run test:mobile-matrix` passed 42/42.
- `npm run test:ui-quality-gate` passed after the homepage reflow fix and again on 2026-06-19 after the seller dashboard delete/remove UI.
- Focused Playwright runtime check passed for desktop and mobile `/vysledky?bodyStyle=motorcycle`: status 200, 0 console issues, 0 network issues.
- Latest full `npm run audit:webapp` passed on 2026-05-20 after the dev-artifact/server cleanup fixes. The report at `output/playwright/webapp-audit.json` is complete and records 80 route/viewport checks, 0 failing routes, 0 console warnings/errors, 0 network failures, and 0 DevTools issues.
- Follow-up local audit work improved `tests/webapp-audit.ts` so it writes incremental reports, supports viewport/route chunks, applies the intended long timeout, and cleans CDP/browser contexts per route. The full local audit now completes successfully; preview browser validation is still required after deploy approval.
- Local `next start` validation after `npm run build` is blocked by missing local Upstash Redis env vars: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. This is expected fail-closed proxy behavior locally; preview/production env need validation after explicit deploy approval.
- `npm run test:release-gauntlet` passed 8/12 checks after dependency hardening and Playwright `.env.local` runner loading was fixed; 4 skipped honestly: non-admin admin denial, paid dashboard action, dealer topup, and owned-ad controls.
- `npx playwright test tests/e2e.test.ts --grep "Critical path: auth entry and exit happy path"` passed.
- `npm run test:smoke` passed 9/9.
- Read-only Supabase coverage audit found 9 profiles, 2 admins, 0 dealers, 192 ads, 7 non-admin profiles, 1 non-admin seller with an ad, and no seller/dealer-specific credentials in `.env.local`.

Note: an earlier `/platba/uspech` 404 during UI tests was traced to stale generated `.next` dev output after App Router route edits. A fresh dev build served `/platba/uspech` and `/kredity/uspech` correctly.

Note: the local `.env.local` service-role value had a trailing literal escaped newline. It was normalized locally without printing the secret, and release-gauntlet now passes with normal `.env.local` loading.

## User Visual Checks

- [ ] Homepage looks good enough. `Need user visual check`.
- [ ] Search page looks good enough. `Need user visual check`.
- [ ] Listing detail looks good enough. `Need user visual check`.
- [ ] Add listing flow feels clear enough. `Need user visual check`.
- [ ] No ugly broken layout on mobile or desktop in the main flows. `Need user visual check`.

## Brands / Models And Ad Supply

- [x] Cheapest acceptable brands/models launch plan chosen: use the current app taxonomy plus dealer/seller-provided listing data with manual normalization. Do not buy JATO before launch.
- [ ] Always-updated EU makes/models database remains open capability backlog in `docs/product-capability-backlog.md`. It needs a provider decision, cost/license review, update job, migration dry-run, rollback plan, and preview verification.
- [ ] VIN decoding remains open capability backlog in `docs/product-capability-backlog.md`. Existing Vincario scaffolding stays feature-flagged off until plan/license review, EU VIN tests, monitoring, and staged rollout approval are complete.
- [x] First dealer/free-ad-upload plan drafted in `docs/ad-supply-launch-plan.md`.
- [ ] Execute dealer outreach only after launch checks pass and the user explicitly agrees to open the site.

## First Day After Opening

- [ ] Watch logs and health after launch.
- [ ] Confirm signups still work.
- [ ] Confirm listing creation still works.
- [ ] Confirm inquiries still work.
- [ ] Confirm search still works.
- [ ] If something critical breaks, turn maintenance mode back on.
