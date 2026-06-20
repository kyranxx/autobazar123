# Release Readiness

Last updated: 2026-06-20

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
7. `npm run check:launch-test-coverage -- --require-complete` before launch-account runs, to confirm configured E2E accounts and DB candidate data can cover admin, non-admin, seller, and dealer checks without printing secrets
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
- [x] Listing detail page opens. `Verified local` by webapp audit over sampled live detail URLs and the 2026-06-20 RLS-compatible public detail fetcher test. The local detail route no longer depends on an anon raw `profiles` join, but the compatible code still needs deploy before the remote RLS hardening migration is applied.
- [x] Sign up works. `Verified local`: page opens, UI/a11y checks passed, register/resend POST routes have mocked local coverage, real browser signup submit passed, Gmail received `Potvrdenie registrácie - Autobazar123`, and opening the emailed confirmation link logged the temp user into `/moj-ucet` with 0 console/page errors. The RED check first proved raw Supabase action links landed on `/auth/auth-code-error`; signup/resend emails now send app `token_hash&type=email` callback URLs.
- [x] Login works. `Verified local`: authenticated dashboard/signout passed in release-gauntlet, and the focused E2E auth entry/exit happy path passed with the local test account.
- [x] Password reset works. `Verified local`: page opens, UI/a11y checks passed, password-reset POST route has mocked local coverage for recovery link generation and queueing, account password recovery POST has mocked local coverage for token verification and password update, Gmail received `Obnovenie hesla - Autobazar123`, opening the emailed reset link updated the password, old password was rejected, new password was accepted, and browser login reached `/moj-ucet` with 0 console/page errors.
- [x] Add listing works. `Verified local`: protected guest redirect works, account ads POST route behavior has mocked local coverage, and the 2026-06-19 release-gauntlet seller lifecycle created a real test listing with two uploaded photos, then cleaned it up.
- [x] Edit/manage own listing works. `Verified local`: route-level quick-edit / feature-action behavior has mocked local coverage. The 2026-06-19 release gauntlet verified seller edit, photo removal, mark-sold, seller dashboard delete/remove, non-owner edit-page denial, and cleanup with 0 leftover release-gauntlet ads. `DELETE /api/account/ads` verifies owner scope and removes the Algolia object before the seller-scoped DB delete.
- [x] Inquiry/contact works. `Verified local`: contact page opens, contact POST has mocked local coverage, and buyer inquiry POST/PATCH route behavior has mocked local coverage. The 2026-06-20 release-gauntlet inquiry check verifies a non-admin buyer submits from a real listing detail page, the DB row has the expected ad/sender/recipient/message, the seller sees it in `/moj-ucet?tab=messages`, and cleanup leaves 0 `Release gauntlet inquiry` rows.
- [ ] Payment flow works if paid features are enabled. `Partial`: `/platba/uspech` and legacy `/kredity/uspech` route behavior are verified locally, checkout-status GET behavior has mocked local coverage, Stripe checkout/webhook POST behavior has mocked local coverage including payment confirmation email queueing, payment failure email queueing, fail-closed checkout handling when the local Stripe session id update fails, `500` retry responses when paid webhook billing application fails, and Docker-backed SQL atomicity coverage for failed private-listing checkout application. The release gauntlet verifies seller paid-listing and dealer topup checkout payloads. A real local test-mode Stripe Checkout Session creation preflight passed and cleaned up its test artifacts. A real test-mode paid Checkout run reached `paid`, created 1 billing transaction, applied the `prolong_top` ad action, and cleaned up. An isolated signed local webhook smoke now proves the current webhook path queues and sends a `payment_confirmation` email through Resend and Gmail receives `Platba potvrdená`; remote `payment_notifications` logging is still blocked until `20260618193000_align_payment_notifications_billing.sql` is applied remotely.
- [x] Admin area still works. `Verified local`: guest/admin guardrails work; the configured admin account reached the admin dashboard, non-admin admin denial passed, the non-dealer dealer prompt was verified, dealer topup payload was verified, dealer verification request API has mocked coverage, and the release gauntlet now verifies the admin settings dealer-verification request area with a temporary pending request fixture that is cleaned up.

## Launch / Release Gate Checks

- [x] Local release gate passed before preview/prod deploy. `Verified local`: on 2026-06-20, `npm run easy:quick`, `npm run test:security:release-gate`, `npm run test:db:rls`, `npm run build`, `npm run check:launch-test-coverage -- --require-complete`, `npm run check:algolia-search`, and `npm audit --json` all passed. RLS reset applied current untracked taxonomy migrations because they exist locally; do not treat that as remote-push approval for those migrations.
- [ ] Vercel env/build preflight is green. `Blocked`: public Supabase/App URL values were fixed and sensitive server envs were re-added where local source values exist, but local `vercel env run` cannot prove sensitive Preview/Production values after they are marked sensitive. A real Vercel cloud Preview build/smoke is now required to verify runtime-sensitive envs. `UPSTASH_REDIS_REST_TOKEN` is still not available locally, and Production live Stripe keys were intentionally not copied from local test-mode Stripe values.
- [ ] Preview deployment is `Ready` when preview is in scope. `Blocked`: no deploy until Vercel env/build preflight is green.
- [ ] Preview `/api/health` is `healthy` when preview is in scope. `Blocked`: no deploy until Vercel env/build preflight is green. Local `/api/health` route behavior has unit coverage.
- [ ] Production deployment is `Ready` when production is in scope. `Blocked`: no deploy until preview is green and production env/build preflight passes.
- [ ] Production `/api/health` is `healthy` when production is in scope. `Not in scope`: no deploy requested this pass. Local `/api/health` route behavior has unit coverage.
- [ ] Maintenance mode still protects the public before launch. `Not in scope`: production was not touched; keep it on.
- [ ] Maintenance bypass still works for us. `Blocked`: local token helper, unlock route, and proxy host behavior have unit coverage, and the unlock route no longer accepts the legacy `MAINTENANCE_PASSWORD` alias. Preview/Production maintenance bypass envs were re-added without printing values, but live bypass cannot be claimed until a Vercel cloud deployment is smoked.
- [x] No obvious runtime or browser-console errors on key pages. `Verified local`: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run audit:webapp` passed on 2026-06-19 with 80/80 desktop/mobile route checks complete, 0 failing routes, 0 console warnings/errors, 0 network failures, and 0 DevTools issues. The 2026-06-20 launch screenshot pass also captured 18 desktop/mobile screenshots across public, seller, dealer, edit, and payment-success routes with 0 failed statuses, console messages, page errors, network failures, horizontal-scroll issues, or too-wide elements. Preview browser validation is still needed after deploy approval.
- [x] Dependency audit is clean. `Verified local`: `npm audit --json` reports 0 vulnerabilities after direct dependency bumps and explicit transitive overrides.
- [ ] No open P0/P1 defect in auth, payment, search, listing lifecycle, or admin permissions. `Blocked`: live anon Supabase currently reads raw `profiles` and `dealers` because `20260618174500_harden_profile_dealer_public_reads.sql` is local-only. Also still open: remote payment notification logging still lacks `payment_notifications.billing_transaction_id` until the launch-critical payment migration is applied.

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
- `npx vitest run src/app/api/account/password/recovery/route.test.ts` passed 13/13 tests, covering recovery payload parsing, CSRF/rate-limit guards, public Supabase config failure, recovery token verification, admin password update, service-role recovery-session revocation, benign consumed-session cleanup, and password update failure.
- `npx vitest run src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts` passed 32/32 tests.
- `npx vitest run src/app/api/account/password/route.test.ts` passed 7/7 tests, covering CSRF/rate-limit guards, auth requirement, password payload validation, Supabase password update failure, successful update, and other-session revocation.
- `npx vitest run src/app/api/account/password/route.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts` passed 40/40 tests.
- `npm run check:launch-test-coverage -- --require-complete` passed as a read-only coverage report: complete launch test account coverage is yes for primary/admin, non-admin, seller-with-owned-ad, and dealer coverage.
- `npm run test:launch-test-coverage-script` passed 2/2 tests, covering role-specific fallback and DB candidate-count logic without live Supabase access.
- `docs/launch-test-accounts.md` documents current credential/data coverage and the verification commands to keep account/data skips out of launch runs.
- `npm run test:db:rls` passed locally with 2 files / 26 tests, but a live anon Supabase probe failed for `profiles.email`, `profiles.phone`, `profiles.credit_balance`, and raw `dealers` without printing row values.
- `npx supabase migration list` shows `20260618174500_harden_profile_dealer_public_reads.sql`, `20260618193000_align_payment_notifications_billing.sql`, and `20260620010000_harden_billing_checkout_atomicity.sql` are local-only; applying them with a plain `supabase db push` is unsafe from the current dirty tree because unrelated local-only taxonomy migrations exist. Use `docs/launch-remote-migration-deploy-runbook.md` for the safe path.
- Clean-worktree dry-run evidence now proves the safe path: after the already-remote `20260619120000_add_vehicle_taxonomy_candidates.sql` history file was present locally, `npx supabase --workdir C:\Users\User\Desktop\Projects\autobazar123-launch-db db push --dry-run --include-all` listed only the three launch-critical migrations and did not list `20260619214332_add_vehicle_taxonomy_metadata.sql`.
- `npx vitest run src/lib/cars/public-car-detail.test.ts` passed 2/2 after moving public listing detail reads to a server-only admin helper with explicit active/visible filters.
- `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build` passed after the public-detail compatibility fix; unit tests passed 105 files / 507 tests and build generated 331 pages.
- `npx vitest run src/app/api/account/ads/route.test.ts` passed 6/6 tests, covering auth, paid draft creation with server-resolved brand/model names, free auto-publish, failed publish cleanup, quick edit, and ownership denial.
- `npx vitest run src/app/api/account/ads/apply-action/route.test.ts` passed 5/5 tests, covering auth, ownership denial, paid checkout metadata handoff, free listing action RPC application, and RPC failure handling.
- `npx vitest run src/app/api/account/dealer-verification/route.test.ts` passed 6/6 tests, covering authenticated owner-scoped reads, missing dealer rejection, already-verified dealer rejection, duplicate pending request rejection, and pending request creation.
- `npx vitest run src/app/api/account/dealer-verification/route.test.ts src/app/api/account/ads/route.test.ts src/app/api/account/ads/apply-action/route.test.ts` passed 17/17 tests.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line` passed 18/18 on 2026-06-20, including seller create, two-photo upload through Cloudflare direct-upload, edit description/price, remove one photo, mark sold, seller dashboard delete/remove, non-owner edit-page denial, dashboard create-tab single `h1`, real recovery-token password reset, password restore, admin dealer-verification request visibility, buyer inquiry submit through seller dashboard read, and cleanup.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=false npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line --grep "buyer inquiry"` passed 1/1 on 2026-06-20 as the focused check for buyer inquiry submit through seller dashboard read plus cleanup.
- Real auth delivery check on 2026-06-20 sent one signup confirmation and fresh password reset emails through queued Resend jobs; Gmail received `Potvrdenie registrácie - Autobazar123` and `Obnovenie hesla - Autobazar123`; pending auth email jobs were 0 and temporary launch-test users were cleaned up.
- `npx vitest run src/lib/email/react-email-templates.test.ts src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts` passed 6 files / 33 tests after the password-reset email spacing fix.
- Real auth-link browser/Gmail check on 2026-06-20 passed after fixing signup/resend emails to use app `token_hash&type=email` callback URLs: signup submit, Gmail confirmation delivery, emailed confirmation login to `/moj-ucet`, password-reset request, Gmail reset delivery, emailed reset-link password update, old-password rejection, new-password browser login, temp-user cleanup, and pending auth email jobs 0.
- `npx vitest run src/app/auth/callback/route.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/account/password/recovery/route.test.ts` passed 5 files / 38 tests after the auth-link callback fix.
- `npm run typecheck`, `npm run lint`, `npm run test:security:release-gate`, `git diff --check`, and `npm run build` passed after the auth-link callback fix; build generated 331 pages.
- `npx vitest run src/app/api/account/ads/route.test.ts` passed 12/12 after adding seller-owned delete, invalid-id/auth/ownership denial, DB delete failure, and Algolia cleanup-failure coverage.
- `npx vitest run src/lib/analytics/events.test.ts` passed 17/17 after adding the `listing_deleted` analytics taxonomy event.
- `npx vitest run src/lib/security/csp.test.ts src/utils/upload.test.ts` passed 10/10 after allowing `https://upload.imagedelivery.net` in CSP.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts` passed 8/8 tests, covering explicit secret resolution, no derived secret fallback, valid signed tokens, wrong-secret rejection, tampered tokens, malformed/expired tokens, and the 24-hour validity window.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts src/app/api/maintenance/unlock/route.test.ts src/proxy.test.ts` passed 27/27 tests.
- `npx vitest run src/app/api/health/route.test.ts src/proxy.test.ts src/lib/security/maintenance-bypass.test.ts` passed 29/29 tests, covering local health route behavior plus proxy/maintenance-bypass behavior.
- 2026-06-20 maintenance secret follow-up: a RED test proved the legacy `MAINTENANCE_PASSWORD` alias still unlocked maintenance; the route now accepts only `MAINTENANCE_UNLOCK_PASSWORD`, and the focused route test passes 6/6.
- Safe Vercel Production and Preview env pulls showed the historical leaked maintenance value and legacy alias are not configured, but both targets are also missing `MAINTENANCE_UNLOCK_PASSWORD` and `MAINTENANCE_BYPASS_SECRET`.
- Local secret backup cleanup: `.env.local`, `.vercel/`, and `.env.local.bak-20260322-221455` were confirmed ignored; the old backup had 0 backup-only keys and was removed without printing values. Recheck showed only ignored `.env.local` and `.vercel/` remain.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts src/app/api/maintenance/unlock/route.test.ts src/proxy.test.ts` passed 32/32 after the maintenance alias removal.
- `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build` passed after the maintenance alias removal; unit tests passed 105 files / 508 tests and build generated 331 pages.
- `npm run check:theme-guard` passed after replacing the unrelated marketplace UI raw hex with existing background color tokens.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts` passed 8/8 tests, covering missing session id, auth, admin-client failure, actor-owned checkout lookup, dealer-owner fallback lookup, pending response, and lookup failure.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts` passed 42/42 tests.
- `npx vitest run src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts` passed 35/35 tests, covering checkout route dealer topup metadata, private listing checkout metadata, seller ownership rejection, billing-session updates, fail-closed handling when storing the Stripe session id fails, idempotency storage, checkout helper behavior, and webhook behavior.
- `npx vitest run src/app/api/stripe/webhook/route.test.ts` passed 22/22 tests, covering missing config, missing/invalid Stripe signature, duplicate terminal skip, paid checkout RPC application, and unpaid checkout deferral.
- `npx vitest run src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts` passed 28/28 after wiring payment failure email queueing for async failed checkout sessions and allowing payment-failure jobs without a billing transaction id.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts` passed 49/49 after the checkout fail-closed fix.
- `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build` passed after the checkout fail-closed fix; build generated 1574 pages.
- `npx vitest run src/app/api/stripe/webhook/route.test.ts` passed 26/26 after paid checkout billing-apply failures were changed to return `500` for Stripe retry.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts` passed 51/51 after the paid-webhook retry fix.
- `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build` passed after the paid-webhook retry fix; build generated 1574 pages.
- Docker Desktop was recovered by posting `Continue` to Docker's update-failed recovery pipe after the log confirmed the restored previous version was ready; `docker info --format '{{json .ServerVersion}}'` returned `29.4.1`.
- Billing checkout SQL atomicity now has Docker-backed pgTAP coverage: `npm run test:db:rls -- supabase/tests/billing-checkout-atomicity.test.sql` passed 1 file / 2 tests, and full `npm run test:db:rls` passed 2 files / 26 tests.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts` passed 51/51 after the SQL atomicity migration was verified.
- Real local Stripe checkout creation preflight passed in test mode: an authenticated seller browser session called `/api/stripe/checkout` for `private_listing_action` / `prolong_top`, the endpoint returned 200, Stripe created an unpaid payment Checkout Session, `billing_checkout_sessions` stored a matching `created` row, and cleanup expired the session, removed matching checkout/idempotency rows, restored the seller ad fixture, and saw 0 browser/page console errors. This does not cover paid completion/webhook/payment email delivery.
- Real local paid Stripe smoke partially passed in test mode: a seller `private_listing_action` / `prolong_top` Checkout payment completed with card `4242 4242 4242 4242`, redirected to `/platba/uspech`, produced `billing_checkout_sessions.status=paid`, created 1 `billing_transactions` row, and applied the top-ad listing action before cleanup restored the fixture and removed matching test rows. The delivered Stripe event had customer email and billing metadata, but no `payment_confirmation` email job was observed because the stored webhook log came from the currently deployed/older webhook path. The later isolated signed local webhook smoke now verifies current-webhook payment confirmation delivery.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts` passed 52/52 after hardening payment confirmation queueing to fall back to a billing-transaction lookup by `stripe_session_id` when the RPC omits `transaction_id`.
- `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build` passed after the payment confirmation fallback hardening; build generated 331 pages.
- Isolated current-webhook payment email smoke passed on 2026-06-20: a local signed `checkout.session.completed` event hit `http://localhost:3000/api/stripe/webhook`, returned 200, logged `payment_confirmation_email=queued`, sent `email_jobs.job_type=payment_confirmation` through Resend with `email_deliveries.status=sent` and provider message id, and Gmail received `Platba potvrdená` containing transaction `2585e6f4-877a-47c6-823e-c77cbdc408be`, `Predĺžiť Exclusive inzerát`, and `EUR 9.99`. Cleanup verified 0 temporary checkout, billing transaction, webhook log, and email job rows, 0 pending email jobs, and exact ad restoration. Evidence artifact: `output/payment-email-smoke/payment-email-smoke-2026-06-20T09-18-06-237Z.json`.
- The isolated payment email smoke also found remote schema drift: `payment_notifications.billing_transaction_id` is missing remotely, so payment notification logging failed even though the email delivered. Apply `20260618193000_align_payment_notifications_billing.sql` remotely through the launch migration runbook and recheck logging before launch.
- Clean launch worktree local release gate passed from `C:\Users\User\Desktop\Projects\autobazar123-launch-db`: `npm run easy:quick`, `npm run test:security:release-gate`, `npm run test:db:rls`, `npm run build`, `npm run check:launch-test-coverage -- --require-complete`, `npm run check:algolia-search`, and `npm audit --json` all passed. `npm run test:db:rls` in this clean worktree did not apply `20260619214332_add_vehicle_taxonomy_metadata.sql`.
- `npm run test:security:release-gate`, `git diff --check`, and `npm run lint` passed after the SQL atomicity migration/test.
- `npx vitest run src/app/api/contact/route.rate-limit.test.ts` passed 6/6 tests, covering invalid payload, rate limit, missing admin config, sanitized insert, and insert failure.
- `npx vitest run src/app/api/inquiries/route.test.ts` passed 8/8 tests, covering auth, captcha, ad lookup, seller recipient enforcement, self-message rejection, submit handoff, and seller qualification permissions.
- `npx vitest run src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts` passed 4/4 tests, covering explicit degraded responses for expired-ad update failure and Algolia cleanup failure plus the governed cron fallback key.
- `npx vitest run src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts` passed 6/6 tests.
- `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts` passed 8/8 tests, covering `send-alerts` degraded `502` responses for saved-ad and saved-search email delivery failures without marking the failed alert/search as notified.
- `npx vitest run src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts` passed 10/10 tests, covering `process-email-jobs` degraded `502` responses when queued email processing reports terminal failed jobs.
- `npx vitest run src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts` passed 14/14 tests, adding `cleanup-sold` route coverage and proving `process-email-jobs` also returns degraded `502` when queued email processing requeues jobs.
- `npx vitest run src/lib/email/jobs.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts` passed 16/16 tests, adding direct email processor coverage for DB state-update failures.
- Direct processor coverage proves a failed `sent` update is requeued and recorded instead of counted as sent, and a failed failed/pending update rejects instead of pretending the job was handled.
- `npx vitest run src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts` passed 4/4 after adding deterministic queued-email provider idempotency keys and the Resend `Idempotency-Key` header.
- `npx vitest run src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts src/lib/email/react-email-templates.test.ts src/app/api/cron/process-email-jobs/route.test.ts` passed 15/15.
- Provider duplicate-send risk is reduced for normal retries: queued jobs reuse `email-job/{job_type}/{job_id}` as the Resend idempotency key after a provider-success / DB-mark-sent failure.
- Remaining caveat: Resend idempotency keys expire after 24 hours, and real provider delivery/idempotency still needs a live provider smoke before launch.
- `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build` passed after the queued-email idempotency fix; build generated 1574 pages.
- `npx vitest run src/app/sitemap.test.ts src/lib/seo/programmatic-taxonomy.test.ts src/lib/seo/inventory.test.ts 'src/app/(site)/[brand]/[model]/[city]/page.test.tsx' 'src/app/(site)/[brand]/[model]/page.test.tsx' 'src/app/(site)/vysledky/SearchSeoLinks.test.tsx'` passed 22/22 after pSEO launch gating.
- `npm run test:seo-taxonomy` passed 30/30 after pSEO launch gating.
- `npm run lint`, `npm run typecheck`, `git diff --check`, and `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:web-interface` passed after pSEO launch gating; web-interface passed 18/18.
- `npm run build` passed after pSEO launch gating and generated 331 pages, down from the earlier 1574-page build, because city pSEO prebuilds are now limited to one Cache Components validation sample and runtime city pages require at least 10 active matching ads.
- Public SEO/marketing copy overclaim cleanup passed locally: scale/verification claims were removed from global metadata, pSEO brand/model/city pages, results metadata, dealer pages, homepage/top-banner/about locale copy, and fake-looking About stats; `npm run check:sk-diacritics`, `npm run check:i18n-contract`, `npm run check:i18n-diacritics`, `npm run lint`, `npm run typecheck`, `git diff --check`, `npm run build`, and `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:web-interface` passed, with build still generating 331 pages and web-interface passing 18/18.
- Canonical host alignment passed locally: live apex redirects to `https://www.autobazar123.sk/`; `BRAND_URL`, `APP_URLS.siteOrigin`, sitemap tests, robots tests, and `llms.txt` tests now use `https://www.autobazar123.sk`; local `.env.local` public `NEXT_PUBLIC_APP_URL` was aligned to `www`; `npx vitest run src/app/sitemap.test.ts src/app/robots.test.ts src/app/llms.txt/route.test.ts src/lib/auth/request-origin.test.ts src/lib/security/csrf.test.ts` passed 5 files / 21 tests, and `npm run lint`, `npm run typecheck`, `git diff --check`, and `npm run build` passed with 331 generated pages.
- Live SEO audit refresh after local canonical work: `seo-audit.mjs` still reports the live homepage canonical as `https://autobazar123.sk` and robots meta as `noindex, nofollow`; `deep-seo-audit.mjs --max-urls 40` crawled 40 live URLs, all status 200, with 53 Medium and 16 Low in-review findings dominated by apex canonical drift from fetched `www` URLs plus expected prelaunch noindex/template notes. Compact fetches verified `robots.txt` is `Disallow: /`, `sitemap.xml` has 1389 `<loc>` entries all on `autobazar123.sk`, and `llms.txt` primary URLs still use apex. Treat this as intentional prelaunch crawler blocking plus undeployed local canonical/sitemap/llms fixes, not launch-ready SEO.
- Vercel public env preflight: Preview `NEXT_PUBLIC_SUPABASE_URL`, Preview `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Preview `NEXT_PUBLIC_APP_URL`, and Production `NEXT_PUBLIC_APP_URL` were fixed through no-newline file input and fresh pulls confirm those public values have no literal `\r\n` escape.
- Vercel secret/env preflight remains blocked until cloud verification: Preview server envs were re-added from local source values, including Stripe test keys, Supabase service role, Resend, Algolia, email, cron, Cloudflare, and maintenance bypass values. Production non-payment server envs were re-added from local source values. Local `vercel env run` still returns zero-length values for sensitive vars after re-creation, so it is not authoritative proof for deployed runtime values. `UPSTASH_REDIS_REST_TOKEN` is still missing locally, and Production live Stripe values still need owner/provider confirmation.
- Dirty taxonomy/discovery lane audit: focused taxonomy tests passed 4 files / 9 tests, plus `git diff --check`, `npm run typecheck`, and `npm run lint`. This lane remains unrelated to the launch-critical DB push; `20260619214332_add_vehicle_taxonomy_metadata.sql` is local-only and must not be included in the launch migration push unless explicitly approved.
- Local cleanup: ignored Vercel env snapshots and `.vercel/output` were removed from the main worktree after the env audit; `.vercel` now keeps only `project.json` and `README.txt`.
- `npm run list:fallbacks` passed with 9 registered fallbacks, including `cron.expire_ads_algolia_cleanup_failed`.
- `npm run check:algolia-search` passed after the expire-ads cleanup fallback change: 56 active Supabase ads and 56 Algolia records.
- `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build` passed after the email job processor state-update fix; build generated 1574 pages.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:web-interface` passed 18/18 after the dashboard create-tab single-`h1` coverage check.
- Initial `npm run test:a11y` found redesigned homepage quick-choice cards wider than a 320px viewport; `src/components/home/HomePageShell.tsx` now constrains those links with `min-w-0 max-w-full overflow-hidden`.
- `npx playwright test tests/reflow-zoom.test.ts` passed 21/21 after the homepage reflow fix.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:a11y` passed 63/63 after the dashboard create-tab single-`h1` coverage check.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:keyboard` passed 9/9.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:mobile-matrix` passed 42/42.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:ui-quality-gate` passed after the dashboard create-tab single-`h1` coverage check, including 18/18 Playwright checks plus 19/19 UI unit tests.
- Launch screenshot/UI pass fixed the non-admin `site_admins` zero-row Supabase `406` console noise by using `AuthContext` `.maybeSingle()` and removed launch screenshot Next image LCP warnings by prioritizing first-visible-row listing thumbnails where they can be LCP candidates.
- `npx vitest run src/context/AuthContext.test.tsx` passed 1/1 after a RED check proved `.single()` was still used before the auth fix.
- `node output/playwright/launch-screenshots/capture-launch-screenshots.mjs` passed: 18 desktop/mobile screenshots for `/`, `/vysledky?q=octavia`, `/vysledky?bodyStyle=motorcycle`, a real active detail page, `/moj-ucet`, `/moj-ucet?tab=create`, a seller-owned edit page, `/dealer`, and `/platba/uspech?session_id=cs_test_release_gauntlet`; 0 failed statuses, 0 console messages, 0 page errors, 0 network failures, 0 horizontal-scroll issues, and 0 too-wide elements.
- `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build` passed after the launch screenshot/UI fixes; unit tests passed 104 files / 505 tests and build generated 331 pages.
- Direct UI gates passed after the launch screenshot/UI fixes: web-interface 18/18, a11y/reflow 63/63, keyboard 9/9, mobile matrix 42/42, and `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome TEST_URL=http://localhost:3000 npm run test:ui-quality-gate`.
- Focused Playwright runtime check passed for desktop and mobile `/vysledky?bodyStyle=motorcycle`: status 200, 0 console issues, 0 network issues.
- Latest full `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run audit:webapp` passed on 2026-06-19 after the dashboard create-tab single-`h1` coverage check. The report at `output/playwright/webapp-audit.json` is complete and records 80 route/viewport checks, 0 failing routes, 0 console warnings/errors, 0 network failures, and 0 DevTools issues.
- Follow-up local audit work improved `tests/webapp-audit.ts` so it writes incremental reports, supports viewport/route chunks, applies the intended long timeout, and cleans CDP/browser contexts per route. The full local audit now completes successfully; preview browser validation is still required after deploy approval.
- Local `next start` validation after `npm run build` is blocked by missing local Upstash Redis env vars: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. This is expected fail-closed proxy behavior locally; preview/production env need validation after explicit deploy approval.
- `npm run test:release-gauntlet` passed 8/12 checks after dependency hardening and Playwright `.env.local` runner loading was fixed; 4 skipped honestly: non-admin admin denial, paid dashboard action, dealer topup, and owned-ad controls.
- `npx playwright test tests/e2e.test.ts --grep "Critical path: auth entry and exit happy path"` passed.
- `npm run test:smoke` passed 9/9.
- Initial read-only Supabase coverage audit found 9 profiles, 2 admins, 0 dealers, 192 ads, 7 non-admin profiles, 1 non-admin seller with an ad, and no seller/dealer-specific credentials in `.env.local`; current launch coverage is now complete per the 2026-06-20 `--require-complete` check.

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
