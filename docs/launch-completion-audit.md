# Launch Completion Audit

Last updated: 2026-06-20

Objective: make Autobazar123 safely launch-ready, with evidence, then prepare the first real ad-supply push.

Completion decision: not complete. The local hardening evidence is good, but live Supabase still allows anon reads from raw profile/dealer tables, and public launch still needs real-account, preview, production smoke, and live maintenance-bypass evidence.

## Success Criteria

- Production stays maintenance-gated until launch checks pass and the user explicitly agrees to open it.
- Dirty working tree is classified before shipping.
- `docs/launch-checklist.md` truthfully marks done, partial, blocked, and not-in-scope launch items.
- Core flows have evidence: homepage, search/results, listing detail, signup, login, reset, add/edit/manage listing, inquiry/contact, payment if enabled, admin/dealer permissions, maintenance bypass, `/api/health`.
- Verified blockers receive root-cause fixes only.
- Preview is the primary validation target; production is only final smoke while maintenance remains on.
- Cheapest acceptable brands/models plan is decided and documented.
- Dealer/free-ad-upload push is prepared, but not executed until the site is safe to open.
- `PROJECT_STATUS.md` stays current after important verified changes.

## Prompt To Artifact Checklist

| Requirement | Evidence | Status | Gap |
| --- | --- | --- | --- |
| Reconcile dirty repo state | `PROJECT_STATUS.md` classifies the dirty tree as intended launch-hardening work. | Partial | Changes are still uncommitted and not deployed. |
| Preserve unrelated user work | `git status --short` shows broad intended launch-hardening changes already classified. | Partial | Needs review again before any commit/push. |
| Use launch checklist | `docs/launch-checklist.md` updated with core-flow statuses and evidence. | Done | Keep updating as real-account and deploy checks run. |
| Homepage | Local smoke/UI/webapp audit evidence in `docs/launch-checklist.md`; 2026-05-16 UI gates passed after fixing redesigned quick-choice cards that were wider than a 320px viewport. | Verified local | Needs final preview/prod smoke and user visual review after deploy approval. |
| Search/results | Local route/UI checks, mocked Algolia release-gauntlet evidence, stale top-ad optional filter removal, read-only real Algolia/Supabase count check, focused desktop/mobile `/vysledky?bodyStyle=motorcycle` runtime check, and full local `npm run audit:webapp` evidence across desktop/mobile results and detail routes. | Partial | Preview browser validation against deployed Algolia env is still missing. |
| SEO/crawl/indexing | pSEO launch gating now derives sitemap brand/model URLs from active inventory, requires at least 10 active matching ads before city pSEO URLs enter the sitemap, noindexes/404s below-threshold city pages, removes hardcoded internal city pSEO links, reduces `npm run build` output to 331 generated pages, public copy no longer claims broad scale/verified marketplace status, local canonical config matches the live `www` redirect target, and Vercel Production/Preview `NEXT_PUBLIC_APP_URL` now matches `https://www.autobazar123.sk`. | Partial | Site remains noindex/crawler-blocked, and the local SEO/copy/canonical fixes are not deployed or smoked. |
| Algolia search checker quality | `npm run test:algolia-search-script` covers sample-hit required fields, no-active-ad failure, and count mismatch failure offline; `npm run check:algolia-search` verifies current live read-only state. | Verified local | Does not replace preview browser validation against deployed Algolia env. |
| Listing detail | Local webapp audit over sampled detail URLs, 2026-06-20 launch screenshot pass over a real active detail page, and `src/lib/cars/public-car-detail.ts` now fetches public detail through a server-only admin helper with active/visible filters so remote profile RLS hardening will not break the page. | Verified local | Deploy compatible code before applying remote RLS hardening, then preview/prod smoke after deploy approval. |
| Live Supabase profile/dealer RLS | Local `npm run test:db:rls` passes 2 files / 26 tests, but a live anon Supabase probe failed for `profiles.email`, `profiles.phone`, `profiles.credit_balance`, and raw `dealers` without printing row values. `npx supabase migration list` shows `20260618174500_harden_profile_dealer_public_reads.sql` is local-only. | Blocked | Deploy compatible code first, safely apply the hardening migration without pushing unrelated local-only taxonomy migrations, then rerun the live anon probe. |
| Launch screenshots and local visual sanity | 2026-06-20 launch screenshot pass captured 18 desktop/mobile screenshots across homepage, results, motorcycle results, real detail, seller dashboard, seller create tab, seller edit page, dealer dashboard, and payment success. Report recorded 0 failed statuses, console messages, page errors, network failures, horizontal-scroll issues, or too-wide elements. | Verified local | Needs final preview/prod browser smoke and user visual review after deploy approval. |
| Signup | Page/UI checks plus mocked register/resend POST route coverage. Real Resend/Gmail delivery of `Potvrdenie registrácie - Autobazar123` passed on 2026-06-20. A RED browser check first proved raw Supabase action links confirmed the user but landed on `/auth/auth-code-error`; signup/resend emails now use app `token_hash&type=email` callback URLs. Real browser signup submit, emailed confirmation-link login to `/moj-ucet`, 0 console/page errors, and temp-user cleanup passed. | Verified local | Needs preview/prod validation after deploy approval. |
| Login | Release-gauntlet and focused E2E auth entry/exit passed with configured account. | Verified local | Needs preview/prod validation after deploy approval. |
| Password reset and account password change | Page/UI checks plus mocked password-reset POST route coverage for recovery link generation and queueing. Account password recovery POST route coverage verifies token verification, admin password update, service-role recovery-session revocation, benign consumed-session cleanup, and failure handling. The 2026-06-19 release gauntlet verifies a real Supabase recovery token in the browser, old password rejection, temporary-password login, and password restoration. Real Resend/Gmail delivery of `Obnovenie hesla - Autobazar123` passed on 2026-06-20. Real emailed reset-link password update, old-password rejection, new-password acceptance, and browser login to `/moj-ucet` passed with 0 console/page errors. Authenticated password-change route coverage verifies auth, payload validation, password update failure, success, and other-session revocation. | Verified local | Needs preview/prod validation after deploy approval. |
| Add listing | Route tests cover draft create, free auto-publish, and failed publish cleanup. The 2026-06-19 release gauntlet verifies authenticated seller browser creation with two uploaded photos and cleanup. | Verified local | Needs preview/prod validation after deploy approval. |
| Edit/manage listing | Route tests cover quick edit, feature actions, seller-owned delete with Algolia cleanup, and ownership denial. The 2026-06-19 release gauntlet verifies owner edit, photo removal, mark-sold, seller dashboard delete/remove, non-owner edit-page denial, and cleanup. | Verified local | Needs preview/prod validation after deploy approval. |
| Inquiry/contact | Contact and inquiry route tests cover validation, rate-limit/config failure, auth, captcha, recipient ownership, self-message rejection, and handoff. The 2026-06-20 release-gauntlet inquiry check verifies a non-admin buyer submits from a real listing detail page, the DB row has the expected ad/sender/recipient/message, the seller sees it in `/moj-ucet?tab=messages`, and cleanup leaves 0 `Release gauntlet inquiry` rows. | Verified local | Needs preview/prod validation after deploy approval. |
| Payment if enabled | Checkout-status route tests cover authenticated actor lookup, dealer-owner fallback lookup, pending response, and lookup failure. Stripe checkout route tests cover dealer topup metadata, private listing checkout metadata, seller ownership rejection, billing-session updates, fail-closed handling when storing the Stripe session id fails, and idempotency storage. Stripe webhook route tests cover config/signature/duplicate/paid/unpaid behavior, payment confirmation email queueing, payment failure email queueing for failed checkout events, and `500` retry responses when paid checkout billing application fails. Docker-backed pgTAP now proves failed private-listing checkout application leaves no billing transaction and does not mark checkout paid. | Partial | Real Stripe checkout and live webhook delivery still missing. |
| Admin/dealer permissions | Admin-positive, non-admin admin denial, non-dealer prompt, dealer topup payload, seller paid-listing payload, and admin dealer-verification request visibility pass locally; dealer verification request API has route coverage for authenticated owner-scoped reads, duplicate pending guard, verified/missing dealer rejection, and request creation; Playwright loads `.env.local`; release gauntlet now supports separate admin, non-admin, seller, and dealer credentials; read-only launch coverage checker confirms complete launch account coverage. | Verified local | Needs preview/prod validation after deploy approval. |
| Launch test account setup | `docs/launch-test-accounts.md` documents current candidate counts, required E2E env keys, safe rules, and verification commands; `npm run check:launch-test-coverage -- --require-complete` reports complete local coverage for primary/admin, non-admin, seller-with-owned-ad, and dealer coverage. | Verified local | Keep secrets out of logs and recheck before preview/prod smoke. |
| Launch account checker quality | `npm run test:launch-test-coverage-script` covers role-specific fallback and DB candidate-count logic offline; `npm run check:launch-test-coverage` verifies current live read-only state. | Verified local | Does not replace real preview/prod auth smoke. |
| Cron/fallback reliability | `expire-ads` now returns explicit degraded non-success responses when expired-ad DB updates fail or Algolia stale-record cleanup fails; Algolia cleanup failure records governed critical fallback `cron.expire_ads_algolia_cleanup_failed`. `send-alerts` now returns degraded `502` when saved-ad or saved-search email delivery fails and does not mark failed notifications as sent. `process-email-jobs` now returns degraded `502` when queued email processing reports failed or requeued jobs. Direct email processor tests prove DB state-update failures are no longer counted as handled. Queued email retries now pass deterministic Resend `Idempotency-Key` values. `cleanup-sold` has route coverage for auth rejection, successful hide/cache revalidation, and DB update failure. | Partial | Preview/production cron smoke still needs verification/approval. Real provider delivery/idempotency still needs live smoke; Resend keys expire after 24 hours. |
| Maintenance bypass | Local token helper, unlock route, and proxy host behavior are covered by unit tests. The unlock route no longer accepts the legacy `MAINTENANCE_PASSWORD` env alias. Safe Vercel Production/Preview env pulls showed the historical leaked value and legacy alias are not configured. | Blocked | `MAINTENANCE_UNLOCK_PASSWORD` and `MAINTENANCE_BYPASS_SECRET` are missing in Production and Preview, so set them, redeploy, and live-smoke bypass before relying on maintenance mode. |
| `/api/health` | `npx vitest run src/app/api/health/route.test.ts src/proxy.test.ts src/lib/security/maintenance-bypass.test.ts` passed 29/29 tests, covering local health route behavior plus proxy/maintenance-bypass behavior. | Partial | Needs fresh preview/prod health after explicit deploy request. |
| Fix only verified blockers | Current changes are targeted to verified analytics, search, route, test, and checklist gaps. | Partial | Continue this rule for remaining real-flow issues. |
| Dependency posture | `npm audit --json`, `npm run build`, `npm run typecheck`, `npm run easy:quick`, and `npm run test:security:release-gate` pass after direct dependency bumps, explicit transitive overrides, the latest homepage reflow fix, stale `.next/dev` cleanup before build/typecheck, moving test helpers out of App Router route exports, and updating the release policy for moved quality-gate OIDC internals. | Verified local | Needs preview/prod deploy validation before shipping. |
| Task 11 local release gate | On 2026-06-20, `npm run easy:quick`, `npm run test:security:release-gate`, `npm run test:db:rls`, `npm run build`, `npm run check:launch-test-coverage -- --require-complete`, `npm run check:algolia-search`, and `npm audit --json` all passed. | Verified local | Preview/prod deploy and smoke are still not run. The local RLS reset included current untracked taxonomy migrations, so avoid pushing remote DB migrations blindly. |
| Preview as main validation target | `PROJECT_STATUS.md` says no deploy was requested; production remains gated. | Done for posture | Needs explicit deploy approval to validate. |
| Brands/models launch posture | `docs/ad-supply-launch-plan.md` chooses current taxonomy plus manual normalization; no paid provider for launch without owner approval. | Done | User still needs to accept the launch stopgap. |
| VIN and always-updated taxonomy capability | `docs/product-capability-backlog.md` records the existing scaffolding and the provider, cost/license, sync, migration, monitoring, rollback, and preview work still required. | Open backlog | Do not describe either capability as complete or enable live sync without owner approval. |
| Dealer/free-upload plan | `docs/ad-supply-launch-plan.md` drafts offer, rules, intake fields, message, and success target. | Prepared | Do not contact dealers until launch checks pass and user agrees to open. |
| PROJECT_STATUS updates | `PROJECT_STATUS.md` updated with evidence, blockers, and next tasks. | Done | Keep current after the next important change. |

## Verified Commands From Current Local Evidence

- `npm audit --json`: passed with 0 vulnerabilities.
- 2026-06-20 Task 11 local gate:
  - `npm run easy:quick`: passed; lint, text/i18n/theme checks, `npx tsc --noEmit`, and unit tests passed, 105 files / 508 tests.
  - `npm run test:security:release-gate`: passed.
  - `npm run test:db:rls`: passed, 2 files / 26 tests; local reset applied current untracked taxonomy migrations because they exist in the worktree.
  - `npm run build`: passed on Next 16.2.9, 331 pages generated.
  - `npm run check:launch-test-coverage -- --require-complete`: passed; complete launch account coverage is yes.
  - `npm run check:algolia-search`: passed; 56 active Supabase ads matched 56 searchable Algolia records.
  - `npm audit --json`: passed with 0 vulnerabilities across 1069 dependencies.
- `npm run typecheck`: passed after removing stale generated `.next/dev` artifacts, regenerating route types, and running TypeScript without stale incremental state.
- `npm run build`: passed with Next 16.2.6 after removing stale generated `.next/dev` artifacts before build.
- `npm run typecheck`: failed once on Next 16 App Router route extra exports, then passed after moving route helpers into sidecar modules.
- `npm run build`: passed after the route-helper export fix, including TypeScript and 1573 generated static pages.
- `npx vitest run src/app/api/contact/route.rate-limit.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/app/api/admin/quality-gates/route.test.ts src/app/api/monitoring/quality-gates/route.test.ts --pool=forks --no-file-parallelism --maxWorkers=1`: passed 7/7 files and 62/62 tests.
- `npm run easy:quick`: passed with 89/89 unit files and 448/448 tests.
- `npm run test:security:release-gate`: passed after the homepage reflow, health-test updates, App Router route-helper policy update, and cleanup-aware typecheck command.
- `npm run check:i18n-contract`, `npm run check:sk-diacritics`, and `npm run check:i18n-diacritics`: passed after adding `bodyType.motorcycle` to Slovak, English, and Hungarian locale catalogs.
- `npx vitest run src/app/api/account/password/route.test.ts`: passed 7/7 tests.
- `npx vitest run src/app/api/account/password/route.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts`: passed 40/40 tests.
- `npx vitest run src/app/api/account/password/recovery/route.test.ts`: passed 13/13 tests.
- `npx vitest run src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts`: passed 32/32 tests.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts`: passed 8/8 tests.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts src/app/api/maintenance/unlock/route.test.ts src/proxy.test.ts`: passed 27/27 tests.
- `npx vitest run src/app/api/health/route.test.ts src/proxy.test.ts src/lib/security/maintenance-bypass.test.ts`: passed 29/29 tests.
- `npx vitest run src/app/api/maintenance/unlock/route.test.ts`: RED failed because legacy `MAINTENANCE_PASSWORD` still unlocked maintenance; GREEN passed 6/6 after removing that alias.
- Safe Vercel Production and Preview env pulls showed the historical leaked maintenance value and legacy alias are not configured, but both targets are missing `MAINTENANCE_UNLOCK_PASSWORD` and `MAINTENANCE_BYPASS_SECRET`; temp env files were deleted.
- `.env.local`, `.vercel/`, and `.env.local.bak-20260322-221455` were confirmed ignored; the stale backup had 0 backup-only keys and was removed without printing values. Recheck showed only ignored `.env.local` and `.vercel/` remain.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts src/app/api/maintenance/unlock/route.test.ts src/proxy.test.ts`: passed 32/32 after the maintenance alias removal.
- `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build`: passed after the maintenance alias removal; unit tests passed 105 files / 508 tests and build generated 331 pages.
- `npm run check:theme-guard`: passed after normalizing the unrelated marketplace UI raw hex to existing background color tokens.
- `npx vitest run src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts`: passed 20/20 tests.
- `npx vitest run src/app/api/account/dealer-verification/route.test.ts`: passed 6/6 tests.
- `npx vitest run src/app/api/account/dealer-verification/route.test.ts src/app/api/account/ads/route.test.ts src/app/api/account/ads/apply-action/route.test.ts`: passed 17/17 tests.
- `npx vitest run src/app/api/account/ads/route.test.ts`: passed 12/12 after adding seller-owned delete, invalid-id/auth/ownership denial, DB delete failure, and Algolia cleanup-failure-before-DB-delete coverage.
- `npx vitest run src/lib/analytics/events.test.ts`: passed 17/17 after adding the `listing_deleted` analytics taxonomy event.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts`: passed 8/8 tests.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts`: passed 42/42 tests.
- `npx vitest run src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts`: passed 33/33 tests.
- `npx vitest run src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`: passed 28/28 after payment failure email queueing and nullable failure transaction ids.
- `npx vitest run src/app/api/stripe/checkout/route.behavior.test.ts`: passed 5/5 after checkout fail-closed handling for Stripe session id update failure.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`: passed 49/49 after the checkout fail-closed fix.
- `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build`: passed after the checkout fail-closed fix; build generated 1574 pages.
- `npx vitest run src/app/api/stripe/webhook/route.test.ts`: passed 26/26 after paid checkout billing-apply failures were changed to return `500` for Stripe retry.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`: passed 51/51 after the paid-webhook retry fix.
- `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build`: passed after the paid-webhook retry fix; build generated 1574 pages.
- `npm run test:db:rls -- supabase/tests/billing-checkout-atomicity.test.sql`: passed 1 file / 2 tests after Docker Desktop was recovered.
- `npm run test:db:rls`: passed 2 files / 26 tests after the SQL atomicity migration/test.
- `npm run test:db:rls`: passed 2 files / 26 tests during the live Supabase RLS audit.
- Live anon Supabase probe: failed for `profiles.email`, `profiles.phone`, `profiles.credit_balance`, and raw `dealers`; no row values were printed.
- `npx vitest run src/lib/cars/public-car-detail.test.ts`: passed 2/2 after adding the RLS-compatible public listing detail helper.
- `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build`: passed after the public detail compatibility fix; unit tests passed 105 files / 507 tests and build generated 331 pages.
- `npm run test:release-gauntlet`: passed 8/12 checks with 4 honest skips after dependency hardening and Playwright `.env.local` runner loading was fixed.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`: passed 18/18 on 2026-06-20, including seller create, two-photo upload, edit description/price, photo removal, mark sold, seller dashboard delete/remove, non-owner edit-page denial, dashboard create-tab single `h1`, real recovery-token password reset, password restore, admin dealer-verification request visibility with a cleaned-up temporary fixture, buyer inquiry submit through seller dashboard read, and cleanup.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=false npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line --grep "buyer inquiry"`: passed 1/1 on 2026-06-20 as the focused buyer inquiry check, including submit, DB row verification, seller dashboard read, and cleanup.
- 2026-06-20 real auth delivery: queued Resend processing sent signup confirmation and password reset emails; Gmail received both expected subjects, delivery logs show sent rows, pending auth email jobs were 0, and temporary launch-test users were cleaned up.
- `npx vitest run src/lib/email/react-email-templates.test.ts src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts`: passed 6 files / 33 tests after fixing password-reset email detail-row spacing.
- 2026-06-20 real auth-link browser/Gmail check: initial RED confirmed raw Supabase signup action links landed on `/auth/auth-code-error`; after switching signup/resend emails to app `token_hash&type=email` callbacks, signup submit, Gmail confirmation delivery, confirmation-link login to `/moj-ucet`, password-reset request, Gmail reset delivery, reset-link password update, old-password rejection, new-password browser login, temp-user cleanup, and pending auth email jobs 0 all passed.
- `npx vitest run src/app/auth/callback/route.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/account/password/recovery/route.test.ts`: passed 5 files / 38 tests after the auth-link callback fix.
- `npm run typecheck`, `npm run lint`, `npm run test:security:release-gate`, `git diff --check`, and `npm run build`: passed after the auth-link callback fix; build generated 331 pages.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=true npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line --grep "dealer"`: passed 3/3 after adding admin dealer-verification request visibility coverage.
- Temporary dealer-verification fixture cleanup probe: `release_gauntlet_dealer_verification_rows=0`.
- `npm run check:launch-test-coverage -- --require-complete`: passed as a read-only coverage report; complete launch test account coverage is yes for primary/admin, non-admin, seller-with-owned-ad, and dealer coverage.
- `npm run test:launch-test-coverage-script`: passed 2/2 tests for launch-account checker role fallback and candidate counting.
- `npm run check:algolia-search`: passed as a read-only real index check; 56 active Supabase ads matched 56 searchable Algolia records.
- `npm run test:algolia-search-script`: passed 3/3 tests for Algolia coverage-checker validation logic.
- `npx vitest run src/app/sitemap.test.ts src/lib/seo/programmatic-taxonomy.test.ts src/lib/seo/inventory.test.ts 'src/app/(site)/[brand]/[model]/[city]/page.test.tsx' 'src/app/(site)/[brand]/[model]/page.test.tsx' 'src/app/(site)/vysledky/SearchSeoLinks.test.tsx'`: passed 22/22 after pSEO launch gating.
- `npm run test:seo-taxonomy`: passed 30/30 after pSEO launch gating.
- `npm run lint`, `npm run typecheck`, `git diff --check`, and `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:web-interface`: passed after pSEO launch gating; web-interface passed 18/18.
- `npm run build`: passed after pSEO launch gating and generated 331 pages instead of the earlier 1574-page build.
- `npm run check:sk-diacritics`, `npm run check:i18n-contract`, `npm run check:i18n-diacritics`, `npm run lint`, `npm run typecheck`, `git diff --check`, `npm run build`, and `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:web-interface`: passed after public copy overclaim cleanup; build generated 331 pages and web-interface passed 18/18.
- `npx vitest run src/app/sitemap.test.ts src/app/robots.test.ts src/app/llms.txt/route.test.ts src/lib/auth/request-origin.test.ts src/lib/security/csrf.test.ts`: passed 5 files / 21 tests after canonical host alignment to `https://www.autobazar123.sk`.
- `npm run lint`, `npm run typecheck`, `git diff --check`, and `npm run build`: passed after canonical host alignment; build generated 331 pages.
- `npx vitest run src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts`: passed 4/4 tests.
- `npx vitest run src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: passed 6/6 tests.
- `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: passed 8/8 tests.
- `npx vitest run src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: passed 10/10 tests.
- `npx vitest run src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: passed 14/14 tests.
- `npx vitest run src/lib/email/jobs.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: passed 16/16 tests.
- `npx vitest run src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts`: passed 4/4 after adding queued-email provider idempotency coverage.
- `npx vitest run src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts src/lib/email/react-email-templates.test.ts src/app/api/cron/process-email-jobs/route.test.ts`: passed 15/15.
- `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build`: passed after the queued-email idempotency fix; build generated 1574 pages.
- `npm run list:fallbacks`: passed with 9 registered fallbacks.
- `npm run check:algolia-search`: passed after the expire-ads cleanup fallback change; 56 active Supabase ads matched 56 searchable Algolia records.
- `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build`: passed after the email job processor state-update fix; build generated 1574 pages.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:web-interface`: passed 18/18 after the dashboard create-tab single-`h1` coverage check.
- `npx playwright test tests/reflow-zoom.test.ts`: passed 21/21 after the homepage reflow fix.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:a11y`: passed 63/63 after the dashboard create-tab single-`h1` coverage check.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:keyboard`: passed 9/9.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:mobile-matrix`: passed 42/42.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:ui-quality-gate`: passed after the dashboard create-tab single-`h1` coverage check, including 18/18 Playwright checks plus 19/19 UI unit tests.
- `npx vitest run src/context/AuthContext.test.tsx`: passed 1/1 after adding non-admin `site_admins` `.maybeSingle()` coverage.
- `node output/playwright/launch-screenshots/capture-launch-screenshots.mjs`: passed 18 desktop/mobile launch screenshots with 0 failed statuses, 0 console messages, 0 page errors, 0 network failures, 0 horizontal-scroll issues, and 0 too-wide elements.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/web-interface-guidelines.test.ts tests/web-interface-sitewide.test.ts --reporter=line`: passed 18/18 after the launch screenshot/UI fixes.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/accessibility-gate.test.ts tests/reflow-zoom.test.ts --reporter=line`: passed 63/63 after the launch screenshot/UI fixes.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome TEST_URL=http://localhost:3000 npx playwright test tests/keyboard-navigation.test.ts --reporter=line`: passed 9/9 after the launch screenshot/UI fixes.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome TEST_URL=http://localhost:3000 npx playwright test tests/accessibility-gate.test.ts tests/reflow-zoom.test.ts --project=mobile-pixel-7 --project=mobile-iphone-13-landscape --reporter=line`: passed 42/42 after the launch screenshot/UI fixes.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome TEST_URL=http://localhost:3000 npm run test:ui-quality-gate`: passed after the launch screenshot/UI fixes.
- `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build`: passed after the launch screenshot/UI fixes; unit tests passed 104 files / 505 tests and build generated 331 pages.
- `git diff --check`: passed.
- Focused Playwright runtime check for desktop and mobile `/vysledky?bodyStyle=motorcycle`: passed with status 200, 0 console issues, and 0 network issues.
- Latest full `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run audit:webapp`: passed on 2026-06-19. Playwright completed 5/5 tests and the saved report at `output/playwright/webapp-audit.json` records `complete: true`, 80 route/viewport checks, 0 failing routes, 0 console warnings/errors, 0 network failures, and 0 DevTools issues.
- `tests/webapp-audit.ts` now writes partial JSON reports, supports `AUDIT_VIEWPORT` / `AUDIT_ROUTE_OFFSET`, applies the intended long timeout, detaches CDP sessions, and isolates browser contexts per route. After the dev-artifact/server cleanup fixes, the full local audit completes successfully.
- Local `next start` validation after `npm run build`: blocked by missing local Upstash Redis env vars; this is expected fail-closed proxy behavior locally.

## Remaining Launch Blockers

- Live Supabase raw `profiles` and `dealers` are anonymously readable until compatible code is deployed, the remote profile/dealer RLS hardening migration is safely applied, and the live anon probe passes.
- Real provider smoke for queued email delivery/idempotency.
- Real Stripe checkout and live webhook delivery check.
- SEO remains launch-blocked until noindex/indexing, preview smoke, and production smoke are resolved.
- Approved preview/production cron smoke.
- Preview deploy, preview `/api/health`, preview core-flow smoke, and preview browser search validation against deployed Algolia env.
- Preview browser audit/search validation against the deployed environment after explicit deploy approval.
- Production smoke while maintenance remains on.
- Configure `MAINTENANCE_UNLOCK_PASSWORD` and `MAINTENANCE_BYPASS_SECRET` in Preview/Production, redeploy, and recheck maintenance bypass before opening or before using maintenance mode as a safety switch.
- User approval before removing maintenance mode or contacting dealers.
