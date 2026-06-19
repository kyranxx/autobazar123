# Autobazar123 Project Status

Last updated: 2026-06-19

## Main goal

Get the site stable enough to open safely, then start getting real car ads.

## 2026-06-19 audit update

- Local `master` is still not pushed or deployed.
- Role-flow checkpoint commit exists locally: `00bcd3e`; non-owner edit denial checkpoint commit exists locally: `eea0afd`.
- Browser listing lifecycle is now verified locally with the seller E2E account:
  - seller can create a listing
  - upload two photos through the Cloudflare direct-upload path
  - edit description and price
  - remove one photo
  - mark the listing sold
  - delete the listing from the seller dashboard
  - non-owner cannot open another seller's edit page
  - cleanup verified: 0 leftover release-gauntlet ads
- Password recovery token browser flow is now verified locally with the non-admin E2E account:
  - generated a real Supabase recovery token through the admin API
  - opened `/auth/reset-password?token_hash=...&type=recovery`
  - set a temporary password in the browser
  - confirmed the old password fails
  - logged in with the temporary password
  - restored the original E2E password and confirmed it works again
- Full release gauntlet now passes 15/15:
  - `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`
- Root cause fixed during password recovery verification:
  - recovery-session revocation used the public client admin namespace and logged a benign `AuthSessionMissingError` when Supabase had already consumed the recovery session.
  - password recovery now revokes through the service-role admin client and suppresses only that known session-missing cleanup race while still logging other revocation failures.
- Root cause fixed during cron reliability work:
  - `/api/cron/expire-ads` could return a success response while expired-ad DB updates or Algolia stale-record cleanup failed.
  - the route now collects failures, returns a degraded non-success response for those failure paths, and records a governed critical fallback for Algolia cleanup failure.
  - fallback registry now includes `cron.expire_ads_algolia_cleanup_failed`.
  - `/api/cron/send-alerts` could return a success response when saved-ad or saved-search email delivery failed.
  - the route now returns a degraded `502` with failure details for those email-send failures and does not mark the alert/search as notified after a failed send.
  - `/api/cron/process-email-jobs` could return `ok: true` when queued email processing reported failed or requeued jobs.
  - the route now returns a degraded `502` when the processor reports failed or requeued jobs, while still returning success for clean or no-work batches.
  - the email job processor could also ignore database errors while marking jobs as `sent`, `pending`, or `failed`.
  - email job state-update failures now fail closed: mark-sent failures are recorded as requeued processor failures, and failed/pending state-update failures reject instead of pretending they were handled.
  - residual risk: if the provider already sent an email and the later `sent` state update fails, a retry can still send a duplicate; exact email idempotency remains a follow-up hardening item.
- Root cause fixed during Task 4:
  - CSP allowed Cloudflare image delivery but not Cloudflare direct creator uploads.
  - `connect-src` now includes `https://upload.imagedelivery.net`.
- Root cause fixed during seller delete/remove work:
  - the app had RLS permission for seller-owned deletes, but no supported seller UI/API path.
  - `DELETE /api/account/ads?id=...` now requires CSRF, auth, owner verification, Algolia object deletion, and seller-scoped DB deletion.
  - the dashboard has a seller delete button and confirmation modal.
  - Playwright mobile projects now honor `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome`; the bundled Playwright browser install was unhealthy locally, but app UI gates pass through installed Chrome.
- Verification after the latest 2026-06-19 audit work:
  - `git diff --check`: passed
  - `npx vitest run src/lib/security/csp.test.ts src/utils/upload.test.ts`: passed, 10/10
  - focused lifecycle Playwright test: passed
  - full release gauntlet: passed, 15/15
  - focused password recovery token Playwright check: passed
  - auth/password route unit suite: passed, 5 files / 40 tests
  - `npx vitest run src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts`: passed, 4/4
  - `npx vitest run src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: passed, 6/6
  - `npx vitest run src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: passed, 10/10
  - `npx vitest run src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: passed, 14/14
  - `npx vitest run src/lib/email/jobs.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: passed, 16/16
  - `npm run list:fallbacks`: passed, 9 registered fallbacks
  - `npm run check:algolia-search`: passed, 56 active Supabase ads and 56 Algolia records
  - `npm run lint`: passed
  - `npm run typecheck`: passed
  - `npm run test:unit`: passed, 90 files / 464 tests
  - `npm run test:security:release-gate`: passed
  - `npm run build`: passed, 1574 pages generated after the email job processor state-update fix
  - `npm run check:launch-test-coverage`: complete launch coverage yes
  - `npm run test:web-interface`: passed, 18/18
  - `npm run test:a11y`: passed, 63/63
  - `npm run test:keyboard`: passed, 9/9
  - `npm run test:mobile-matrix`: passed, 42/42
  - `npm run test:ui-quality-gate`: passed
  - Supabase cleanup query: 0 leftover release-gauntlet ads
- Listing ownership gap closed:
  - non-owner browser denial for `/upravit-inzerat/{ownedAdId}` is now covered in the release gauntlet.

## 2026-06-18 audit update

- Full launch-readiness audit work now continues on local `master`.
- Big continuation plan is saved at `docs/superpowers/plans/2026-06-18-launch-readiness-audit-plan.md`.
- Duplicate local branches `codex/front-results-ad-dashboard-redesign` and `codex/frontpage-reference-redesign` were deleted because both pointed at `master`.
- Audit branch `codex/autobazar-integration-checkpoint-20260602` was committed, merged into `master`, and deleted locally.
- Current local `master` is ahead of `origin/master` and is not pushed or deployed.
- Docker Desktop was recovered by continuing the restored Docker version after the stale "insufficient disk space" update dialog.
- Local dependency/security posture is now clean:
  - `npm audit --json`: 0 vulnerabilities
  - `npm run check:framework-patch-posture`: passed
  - Next `16.2.9`, React/React DOM `19.2.7`
- Local build and core checks now pass:
  - `npm run typecheck`: passed
  - `npm run lint`: passed with 0 warnings after Stripe webhook cleanup
  - `npm run test:db:rls`: passed, 22/22
  - `npm run test:security:release-gate`: passed
  - `npx vitest run src/components/AuthModal.email-flow.test.tsx src/app/api/stripe/webhook/route.test.ts src/lib/email/react-email-templates.test.ts`: passed, 36/36
  - `npm run easy:quick`: passed, 90 files / 452 tests
  - `npm run build`: passed, 1574 pages generated
  - `npm run check:algolia-search`: passed, 56 active Supabase ads and 56 Algolia records
  - `npm run list:fallbacks`: passed, 8 registered fallbacks
- Task 1 branch cleanup evidence:
  - audit fix commit: `27cfd52`
  - local merge commit on `master`: `3a931d6`
  - post-merge `npm run build`: passed, 1574 pages generated
  - `git branch -vv`: only local `master` remains
- Task 2 payment email/schema evidence:
  - payment email/billing alignment commit: `0bbf14f`
  - `npx vitest run src/app/api/stripe/webhook/route.test.ts`: passed, 23/23
  - `npx vitest run src/lib/email/react-email-templates.test.ts`: passed, 8/8
  - `npm run typecheck`: passed
  - `npm run test:db:rls`: passed, 24/24
  - `npm run lint`: passed
  - `npm run test:security:release-gate`: passed
  - `npm run build`: passed, 1574 pages generated
- Post-Task 2 launch account coverage:
  - `npm run check:launch-test-coverage`: complete launch coverage now yes
  - configured coverage exists for primary/admin, non-admin, seller-with-owned-ad, and dealer
  - read-only DB candidates: 7 non-admin profiles, 1 non-admin seller with owned ads, 1 dealer owner
  - dealer test profile was created for `qa.user2+202603022210@example.com`
- Real-account browser role coverage:
  - `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=true npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`: passed, 12/12 on 2026-06-18
  - `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`: passed, 15/15 on 2026-06-19
  - verified guest guardrails, cookie consent, mocked Algolia result ordering, legacy credits redirect, login/dashboard/signout, delete keyword gate, non-admin admin denial, admin dashboard access, non-dealer dealer onboarding, seller paid listing checkout payload, dealer topup checkout payload, seller dashboard edit/top/sold controls, non-owner edit-page denial, and seller create/edit/photo-remove/mark-sold/delete lifecycle
  - seller ad fixture restored after the run: `56e8e190-f13c-4398-8fb7-5183fc025aaa` back to `status=expired`, `is_hidden=false`
- Fixed during audit:
  - Auth forms use `method="post"` so pre-hydration login/register/reset submit cannot leak credentials into the URL query.
  - Homepage search fields now have stable `id`/`name`.
  - Default `npm run dev` works with Turbopack after adding `turbopack.root`.
  - Public raw profile/dealer reads are hardened; public dealer page no longer exposes owner email.
  - Seller ad insert/update/delete RLS policies are restored.
  - `claim_email_jobs` no longer ignores requested job type for pending jobs.
  - `/api/cron/process-email-jobs` is scheduled in `vercel.json`.
  - `/site-map` builds with cache components.
  - Cloudflare direct image uploads are allowed by CSP via `https://upload.imagedelivery.net`.
  - Seller-side delete/remove listing is implemented and verified locally through API tests and the seller browser lifecycle.
- Still launch-blocking:
  - Real signup confirmation email, real password reset email delivery, real Stripe checkout/webhook, and payment emails still need full verification.
  - Password reset token consumption is browser-verified locally, but provider email delivery and the real emailed-link path are not verified yet.
  - Payment notification schema drift is fixed locally in commit `0bbf14f`, but the migration is not deployed and real payment email delivery is not verified.
  - Cron reliability is still partial: all four cron routes now have local route coverage, but preview/production cron smoke still needs approval and has not been run.
  - SEO launch is not ready: noindex is still enabled, canonical host decision is unresolved, pSEO is too broad for 56 active ads / no real dealers, and some public copy still overclaims scale.
  - Preview/production were not deployed or smoked in this audit pass.

## Current live state

- Site is online and maintenance mode is turned off.
- Crawlers are still blocked sitewide until `NEXT_PUBLIC_SITE_INDEXING_ENABLED=true` is explicitly enabled and deployed.
- Last known production deployment is live and healthy.
- Local launch-hardening plus redesign work is merged into local `master` at merge commit `3a931d6`.
- The local `master` commits are not pushed or deployed.
- Old stashes/worktree cleanup were archived as pushed `codex/archive/*` tags before removal.
- Latest verified production deployment:
  - `https://autobazar123-6r2o5iyie-daniels-projects-98c0558b.vercel.app`
- Latest verified production smoke:
  - commit `bbe0213`
  - GitHub Actions production smoke passed
- Preview deployments build again and health-check again.
- Latest successful preview:
  - `https://autobazar123-5ylvdexi4-daniels-projects-98c0558b.vercel.app`
- Preview env now includes the previously missing email / Algolia / Stripe / app URL / service-role secrets.
- Dealers will be contacted only after the site is public.
- Dealer plan for launch: offer free ad uploads at the start.
- Production was opened with explicit user approval on 2026-06-06, but remains noindex / crawler-blocked.

## Current working tree classification

The previously mixed tree is preserved in local `master` through checkpoint commit `a55e8ed`, audit fix commit `27cfd52`, and merge commit `3a931d6`. The classification below explains that preserved snapshot.

Intended changes:
- `PROJECT_STATUS.md` and `docs/launch-checklist.md`: current launch evidence, blockers, and next steps.
- `docs/ad-supply-launch-plan.md`: cheapest brands/models plan and first dealer/free-upload outreach plan.
- `docs/product-capability-backlog.md`: keeps VIN decoding and an always-updated makes/models database explicitly open until provider, licensing, sync, migration, monitoring, and preview gates are complete.
- `docs/launch-completion-audit.md`: prompt-to-artifact completion audit showing what is verified, partial, blocked, and still required before launch.
- `docs/launch-test-accounts.md`: exact account/data setup needed to remove release-gauntlet account skips without printing secrets or seeding public test inventory.
- `.gitignore`: explicitly allow the two curated launch checker scripts so future commits do not miss them.
- `.gitignore`, `package.json`, `scripts/typecheck.mjs`, `scripts/dev-server.mjs`, and `scripts/clean-next-dev-artifacts.mjs`: keep generated `.next/dev` type artifacts from breaking local build/typecheck, make typecheck run without stale incremental state, and refuse to delete live `.next/dev` artifacts while this project's dev server is running.
- `package.json`, `scripts/check-launch-test-coverage.ts`, `scripts/check-launch-test-coverage-core.ts`, and `scripts/check-launch-test-coverage-core.test.ts`: add a read-only launch account/data coverage checker for configured E2E accounts and safe DB candidate counts, with offline regression coverage for the checker logic.
- `package.json`, `scripts/check-algolia-search.ts`, `scripts/check-algolia-search-core.ts`, `scripts/check-algolia-search-core.test.ts`, and `scripts/test-algolia.js`: add a read-only live Algolia/Supabase search coverage checker, offline regression coverage for its validation logic, and remove hardcoded Algolia values from the legacy standalone test script.
- `package.json` and `package-lock.json`: patch framework/runtime/dev dependency posture and add explicit npm overrides for audited transitive vulnerabilities while staying on stable Next.
- `src/app/nastavenia/page.tsx` removed and `src/app/nastavenia/route.ts` added: keep `/nastavenia` as a redirect to `/moj-ucet?tab=settings` without a dev-render page warning.
- `src/components/analytics/AnalyticsRuntime.tsx`, `src/lib/analytics/client.ts`, and `src/lib/analytics/posthog-client.ts`: lazy-load PostHog only after analytics consent/config.
- `src/components/search/SearchResultsSearchBox.tsx` and `src/config/config.ts`: remove the stale Algolia top-ad optional filter from search suggestions.
- `src/i18n/messages/sk.json`, `src/i18n/messages/en.json`, and `src/i18n/messages/hu.json`: add the missing `bodyType.motorcycle` label that caused `/vysledky?bodyStyle=motorcycle` runtime Intl errors.
- `src/lib/api/rate-limit-identifiers.ts`, `src/lib/stripe/checkout-request.ts`, `src/lib/stripe/webhook-processing.ts`, route helper modules, and affected API route tests: move testable helpers out of App Router `route.ts` files so Next 16 route type generation accepts the API routes.
- `src/app/api/account/ads/route.test.ts`: add route-level listing create/edit tests for auth, draft creation, free auto-publish, failed publish cleanup, quick edit, and ownership denial.
- `src/app/api/account/ads/apply-action/route.test.ts`: add route-level listing feature-action tests for auth, ownership, paid checkout handoff, free RPC application, and RPC failure.
- `src/app/api/account/dealer-verification/route.test.ts`: add route-level dealer verification tests for authenticated owner-scoped reads, missing/verified dealer rejection, duplicate pending request rejection, and pending request creation.
- `src/app/api/account/password/route.test.ts`: add route-level authenticated password-change tests for CSRF/rate-limit guards, auth requirement, payload validation, Supabase password update failure, success, and other-session revocation.
- `src/app/api/account/password/recovery/route.test.ts`: extend password recovery tests from parser-only coverage to route-level recovery token verification, config failure, admin password update, service-role recovery-session revocation, and benign consumed-session cleanup behavior.
- `src/app/api/auth/register/route.test.ts`, `src/app/api/auth/register/resend/route.test.ts`, and `src/app/api/auth/password-reset/route.security.test.ts`: add route-level auth email flow tests for throttling, CSRF/origin guardrails, strict payloads, provider link generation, queueing, missing-token/link failure, and enumeration-safe reset behavior.
- `src/app/api/auth/register/resend/route.ts`: normalize resend-confirmation email input at schema validation time, matching the register and password-reset routes.
- `src/app/api/contact/route.rate-limit.test.ts`: add contact form POST route tests for validation, rate limiting, admin-client failure, sanitized insert, and insert failure.
- `src/app/api/inquiries/route.test.ts`: add buyer inquiry POST route tests for auth, captcha, ad lookup, recipient ownership, self-message rejection, and submit handoff.
- `src/app/api/billing/checkout-status/route.test.ts`: add route-level checkout-status tests for auth, missing session id, admin-client failure, actor-owned lookup, dealer-owner fallback lookup, pending response, and lookup failure.
- `src/app/api/stripe/checkout/route.behavior.test.ts`: add route-level checkout tests for dealer topup metadata, private listing checkout metadata, seller ownership rejection, billing-session updates, and idempotency storage.
- `src/app/api/stripe/webhook/route.test.ts`: add route-level webhook tests for configuration failure, Stripe signature rejection, duplicate skip behavior, paid checkout application, and unpaid checkout deferral.
- `src/lib/security/maintenance-bypass.test.ts`: extend maintenance bypass helper tests to cover signed-token validation, wrong-secret rejection, tamper rejection, malformed/expired tokens, and the 24-hour validity window.
- `src/app/api/health/route.test.ts`: add local route-level health-check coverage for healthy, degraded, misconfigured, and unexpected-failure responses.
- `src/app/api/cron/expire-ads/route.ts`, `src/app/api/cron/expire-ads/route.test.ts`, `src/lib/fallbacks/registry.ts`, and `src/lib/fallbacks/registry.test.ts`: make expire-ads cron failure reporting explicit, add a governed critical Algolia cleanup fallback, and cover degraded DB/Algolia failure responses.
- `src/lib/next/prerender-bailout.ts`: classify only the verified Next dev render-restart abort as expected.
- `tests/e2e.test.ts` and `tests/release-gauntlet.test.ts`: make auth/search checks prove server-accepted sessions, current search behavior, role-specific account coverage, and honest skip conditions for missing test data.
- `playwright.config.ts`: load `.env.local` into the Playwright test-runner process so local E2E credential keys do not require manual shell export.
- `tests/webapp-audit.ts`: keep ordinary issues visible while ignoring verified dev-only noise, write partial route reports, support route/viewport chunking, and apply the intended long timeout to the audit suite.
- `src/components/home/HomePageShell.tsx`: add shrink/overflow constraints to redesigned homepage quick-choice cards after the reflow gate found 337px-wide cards in a 320px viewport.

Observed user/unrelated changes preserved:
- `AGENTS.md`: adds shared user rules for short answers, root-cause fixes, verification, tool/skill disclosure, and protecting local secrets.
- `src/app/globals.css`: adds marketplace redesign primitives such as `.market-page`, `.market-card`, chips, fields, and action/button classes; the new `.market-page` background was normalized to existing color tokens after `theme-guard` rejected a raw hex value.
- `src/components/home/HomeSearchFormClient.tsx`: applies the marketplace redesign primitives to homepage search controls, dropdowns, chips, and the primary search button.
- Larger homepage/search/detail/account UI redesign work appeared while launch-hardening was in progress and was preserved, including `src/app/(site)/auto/[id]/CarDetailClient.tsx`, `src/app/(site)/moj-ucet/DashboardClient.tsx`, `src/app/(site)/vysledky/AlgoliaSearchPageClient.tsx`, `src/components/home/HomeFeaturedAdsRows.tsx`, `src/components/home/HomePageShell.tsx`, new `src/components/home/HomeFrontpageSearch.tsx`, `src/components/search/CarHit.tsx`, `src/components/search/FilterSidebar.tsx`, `src/components/search/SearchControls.tsx`, new public images `public/homepage-dealer-showroom.png` and `public/homepage-reference-hero.png`, homepage-specific `Navbar` / `Footer` / `TopBanner` variants with `src/components/TopBannerClient.tsx`, and local visual-QA helpers in `next.config.ts` / `src/app/providers.tsx`.

Unfinished / not shipped:
- Local `master` commits through `b4d3027` are not pushed or deployed.
- Preview and production were deployed on 2026-06-06 to open the site while keeping crawler blocking active.
- VIN decoding remains feature-flagged off and is not a finished production capability.
- The current brands/models dataset plus manual normalization is a launch stopgap, not an always-updated vehicle database.

## What looks good

- Merged redesign/audit work now has fresh local evidence for the front page, results page, ad detail page, and dashboard redesign:
  - `docs/front-results-ad-dashboard-redesign-audit.md` records the source-backed UI/UX research and element/page decisions.
  - `npm run lint` passed with 0 errors and the existing Stripe webhook unused-type warning.
  - `npm run typecheck` passed.
  - A Playwright hydration/browser probe passed for `/`, `/vysledky`, one real `/auto/...` detail page, and authenticated `/moj-ucet`, with screenshots in `output/hydration-check/`.
  - Fresh UI gates passed after the latest polish fixes: `npm run test:web-interface` 18/18, `npm run test:a11y` 63/63, `npm run test:keyboard` 9/9, `npm run test:mobile-matrix` 42/42, and `npm run test:ui-quality-gate` including 18/18 Playwright checks plus 19/19 UI unit tests.
- Latest local quick checks passed after the homepage reflow fix: `npm run easy:quick` passed lint, typecheck, and 89/89 unit files with 448/448 tests.
- Latest security release gate passed after the homepage reflow, health-test updates, App Router route-helper policy update, and cleanup-aware typecheck command.
- `npm audit --json` now reports 0 vulnerabilities.
- `npm run build` passed with Next 16.2.6 after cleaning stale `.next/dev` artifacts before build.
- `npm run typecheck` passed after cleaning stale `.next/dev` artifacts, regenerating route types, and running TypeScript without stale incremental state.
- Latest route-contract fix evidence: `npm run typecheck` passed, `npm run build` passed, and 7 targeted helper/route test files passed with 62/62 tests after moving extra App Router route exports into sidecar modules.
- Latest release-gate evidence: `npm run test:security:release-gate` passed on 2026-05-17 after updating the policy to track moved quality-gate OIDC internals and to run the repo cleanup-aware `npm run typecheck`.
- Latest dev-artifact tooling evidence: `node --check scripts/clean-next-dev-artifacts.mjs`, `node --check scripts/dev-server.mjs`, `npm run typecheck`, and `npx playwright test tests/webapp-audit.ts --grep "webapp audit issue filtering" --reporter=line` passed after adding the live-dev-server cleanup guard and audit timeout fix.
- `npm run test:launch-test-coverage-script` passed and covers the launch-account checker fallback/candidate-count logic.
- `npm run test:algolia-search-script` passed and covers Algolia sample-hit/count validation logic without live network access.
- Local UI checks passed on 2026-05-16 after the homepage quick-choice reflow fix:
  - `npm run test:web-interface`
  - `npm run test:a11y`
  - `npm run test:keyboard`
  - `npm run test:mobile-matrix`
  - `npm run test:ui-quality-gate`
  - `npx playwright test tests/reflow-zoom.test.ts`
- Local runtime route checks passed on 2026-05-15:
  - `npm run audit:webapp`
  - `npm run test:smoke`
- Latest focused results-route regression check passed after fixing the missing motorcycle locale key:
  - desktop and mobile `/vysledky?bodyStyle=motorcycle` returned 200 with 0 console issues and 0 network issues.
- Latest full `npm run audit:webapp` passed on 2026-05-20 after the dev-artifact/server cleanup fixes:
  - 5/5 Playwright tests passed
  - 80 route/viewport checks completed across desktop and mobile
  - failing routes: 0/80
  - console warnings/errors: 0
  - network failures: 0
  - DevTools issues: 0
  - report: `output/playwright/webapp-audit.json`
- Local release checks now have partial real-account evidence:
  - `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=true npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line` passed 12/12 on 2026-06-18 after the local Chrome fallback and role-flow fixes
  - focused chunks also passed before the full run: unauthenticated 4/4, auth/RBAC 5/5, paid/dealer/dashboard 3/3
  - focused E2E auth entry/exit happy path passed
- Payment checkout/status/webhook route-level behavior now has local unit evidence:
  - `npx vitest run src/app/api/billing/checkout-status/route.test.ts` passed 8/8 tests
  - `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts` passed 42/42 tests
  - `npx vitest run src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts` passed 33/33 tests
  - checkout-status route tests cover missing session id, auth, admin-client failure, actor-owned lookup, dealer-owner fallback lookup, pending response, and lookup failure
  - checkout route tests cover dealer topup metadata, private listing checkout metadata, seller ownership rejection, billing-session updates, and idempotency storage
  - `npx vitest run src/app/api/stripe/webhook/route.test.ts` passed 22/22 tests
  - `npm run test:security:release-gate` passed after the latest checkout-status route test update
- Search now has real index read-only evidence:
  - `npm run check:algolia-search` passed against the configured `ads` index
  - current result: 56 active Supabase ads and 56 searchable Algolia records
  - the Algolia checker has an offline regression test for missing required hit fields, no-active-ads, and count mismatch failures
- Auth email/recovery route-level behavior now has local unit evidence:
  - `npx vitest run src/app/api/account/password/route.test.ts` passed 7/7 tests
  - `npx vitest run src/app/api/account/password/recovery/route.test.ts` passed 13/13 tests
  - `npx vitest run src/app/api/account/password/route.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts` passed 40/40 tests
  - `npx vitest run src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts` passed 32/32 tests
  - `npx vitest run src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts` passed 20/20 tests
  - latest `npm run easy:quick` passed after the homepage reflow fix: 89/89 unit files with 448/448 tests
- Contact/inquiry route-level behavior now has local unit evidence:
  - `npx vitest run src/app/api/contact/route.rate-limit.test.ts` passed 6/6 tests
  - `npx vitest run src/app/api/inquiries/route.test.ts` passed 8/8 tests
- Listing lifecycle route-level behavior now has local unit evidence:
  - `npx vitest run src/app/api/account/ads/route.test.ts` passed 6/6 tests
  - `npx vitest run src/app/api/account/ads/apply-action/route.test.ts` passed 5/5 tests
- Dealer verification route-level behavior now has local unit evidence:
  - `npx vitest run src/app/api/account/dealer-verification/route.test.ts` passed 6/6 tests
  - `npx vitest run src/app/api/account/dealer-verification/route.test.ts src/app/api/account/ads/route.test.ts src/app/api/account/ads/apply-action/route.test.ts` passed 17/17 tests
- Maintenance bypass local behavior now has unit evidence:
  - `npx vitest run src/lib/security/maintenance-bypass.test.ts` passed 8/8 tests
  - `npx vitest run src/lib/security/maintenance-bypass.test.ts src/app/api/maintenance/unlock/route.test.ts src/proxy.test.ts` passed 27/27 tests
  - `npx vitest run src/app/api/health/route.test.ts src/proxy.test.ts src/lib/security/maintenance-bypass.test.ts` passed 29/29 tests
  - `npm run check:theme-guard` passed after replacing the unrelated UI raw hex with existing color tokens
  - `npm run easy:quick` passed after the homepage reflow fix: 89/89 unit files with 448/448 tests
- Launch checklist now exists in `docs/launch-checklist.md`.
- Launch completion audit now exists in `docs/launch-completion-audit.md`.
- Launch account setup guide now exists in `docs/launch-test-accounts.md`.
- Core systems exist in code:
  - sign up / login
  - listings
  - payments
  - search
  - admin
  - analytics
- Car brands/models system exists.

## Main problems right now

1. Deployment env problems
- Root cause found and fixed:
  - some API routes were crashing during build when preview secrets were missing
  - proxy startup requirements were stricter than needed for preview build
  - one preview env sync pass uploaded some secret values incorrectly; resynced with proper `.env` parsing
- Verified result:
  - preview deployment now reaches `Ready`
  - build no longer dies during compile / route collection for those missing-secret cases
  - preview `/api/health` is back to `healthy`

2. Search/results fragility
- The results page is still one of the most fragile parts of the app.
- Local route/UI/runtime checks passed for `/vysledky`, including several query variants.
- Missing `bodyType.motorcycle` translations caused a verified runtime Intl error on `/vysledky?bodyStyle=motorcycle`; the labels now exist in Slovak, English, and Hungarian, and the focused desktop/mobile route check is clean.
- The Algolia-backed release-gauntlet search check now passes locally with a mocked Algolia response and verifies promoted result order without the old global top optional filter.
- Read-only real Algolia/Supabase search coverage now passes for the configured local env.
- Preview browser validation against the deployed Algolia env is still needed after deploy approval.

3. Low real business traction
- Very small real dataset.
- No real dealers in this environment yet; there is 1 QA dealer profile for launch testing.
- Almost no proven buyer/seller activity yet.

4. Data source uncertainty
- Do not buy JATO or another provider for launch without owner approval.
- Cheapest acceptable launch plan is now chosen:
  - use the current brands/models taxonomy
  - accept dealer/seller-provided values
  - manually normalize missing models before publish/import
  - add paid catalog data only after real dealer demand proves it is needed
- The complete always-updated vehicle database remains open backlog in `docs/product-capability-backlog.md`.
- The provider decision must cover EU fit, update mechanism, cost, licensing, caching/storage rights, migration, monitoring, and rollback.
- First dealer/free-ad-upload plan is documented in `docs/ad-supply-launch-plan.md`.
- There is still no confirmed real dealer inventory source.

5. Unverified launch-critical flows
- Authenticated login/dashboard/signout and settings delete-gate now pass locally with the configured E2E account.
- Admin-positive access, non-admin admin denial, non-dealer dealer onboarding, dealer billing topup payload, seller paid-listing checkout payload, and seller dashboard edit/top/sold controls now pass in the release gauntlet.
- The seller dashboard checks temporarily activate the seller's latest ad only during the run, then restore its original state.
- Signup confirmation and password reset routes now have mocked local route coverage, including recovery token verification and password update behavior. Real recovery-token consumption is browser-verified locally, but real signup confirmation delivery and real password reset email delivery still need provider checks. Browser add-listing creation/edit/photo removal/mark-sold/delete now passes locally; real browser inquiry submit/delivery, real Stripe checkout, and live webhook delivery still need full checks.
- Authenticated password-change route-level tests now cover CSRF/rate-limit guards, auth requirement, payload validation, password update failure, success, and other-session revocation.
- Listing route-level tests now cover create draft, free auto-publish, failed publish cleanup, quick edit, seller-owned delete with Algolia cleanup, listing feature actions, and ownership denial.
- Contact and buyer inquiry route-level tests now cover validation/rate-limit/config failure, auth, captcha, ad lookup, recipient ownership, self-message rejection, and successful submit handoff.
- Payment checkout route-level tests now cover dealer topup metadata, private listing checkout metadata, seller ownership rejection, billing-session updates, and idempotency storage.
- Payment checkout-status route-level tests now cover authenticated actor lookup, dealer-owner fallback lookup, pending response, and lookup failure without reporting fake success.
- Payment webhook route-level tests now cover config failure, missing/invalid Stripe signature, duplicate terminal event skips, paid checkout RPC application, and unpaid checkout deferral.
- Dealer verification route-level tests now cover authenticated owner-scoped reads, missing dealer rejection, already-verified dealer rejection, duplicate pending request rejection, and pending request creation.
- Local `.env.local` service-role formatting was normalized by removing a trailing literal escaped newline from the service-role value without printing the secret. A normal `.env.local` release-gauntlet run now passes with 8/12 checks and 4 honest skips.
- Read-only DB coverage audit now finds 7 non-admin profiles, 1 non-admin seller profile with an ad, and 1 dealer owner. `.env.local` has dedicated non-admin, seller, and dealer E2E credentials.
- The release gauntlet can now use dedicated `E2E_ADMIN_*`, `E2E_NON_ADMIN_*`, `E2E_SELLER_*`, and `E2E_DEALER_*` credentials when those accounts are available, while preserving the existing single-account fallback.
- Playwright now loads `.env.local` for the test runner process, so those E2E credentials can be read consistently by tests and the Next dev server.
- `npm run check:launch-test-coverage` now reports account/data coverage and DB candidate counts without printing secrets. Refreshed 2026-06-19 result: complete launch test account coverage is yes.
- `npx vitest run src/proxy.test.ts` now passes 18/18 after covering non-admin admin 403, `/dealer` onboarding access, and deeper dealer-route fail-closed behavior.
- Local verification after the role-flow fixes passed: `git diff --check`, `npm run lint`, `npm run typecheck`, and `npm run check:launch-test-coverage`.
- The launch coverage checker has an offline regression test so future changes can verify role fallback and candidate counting without touching Supabase.
- Local production-style `next start` validation is currently blocked by missing local Upstash Redis env vars, which is expected fail-closed behavior for the proxy. Preview/production env still need explicit validation after deploy approval.
- A real Next 16 route type-generation blocker was found and fixed: App Router API route files had extra exported helpers for tests. Those helpers now live outside `route.ts`; `npm run typecheck` and `npm run build` pass again.
- Preview and production were not redeployed or smoked in the latest pass because no deploy was requested.
- `/api/health` now has local route-level coverage for healthy, degraded, misconfigured, and unexpected-failure responses, but preview and production health still need fresh checks after deploy approval.
- Maintenance mode is now off in `site_settings.maintenance_mode=false`; live production homepage returns 200 and `/api/health` returns `healthy`.
- Crawler blocking is verified live: `/robots.txt` returns `User-Agent: *` plus `Disallow: /`, homepage has `X-Robots-Tag: noindex, nofollow, noarchive`, and HTML meta robots is `noindex, nofollow`.

## Real data snapshot from this environment

- Ads: 192
- Active ads: 56
- Sold ads: 6
- Expired ads: 130
- Brands: 20
- Models: 207
- Profiles: 9
- Dealers: 1
- Inquiries: 2
- Checkout sessions: 0
- Imported ads: 25

## Biggest risks

- We make changes and new problems appear.
- Deployments are not predictable enough yet.
- We still do not have a strong ad supply plan.
- The project feels too complex to track in your head.

## Confirmed priority order

1. Stability and safety
2. Public launch
3. Dealer outreach and free ad uploads
4. Nice extra improvements

## Next 3 important tasks

1. Verify real auth flows with the configured E2E accounts: login/logout, signup confirmation, and password reset.
2. Verify real inquiry/contact delivery from buyer submit through seller dashboard/email path.
3. When ready for real SEO launch, explicitly enable `NEXT_PUBLIC_SITE_INDEXING_ENABLED=true`, redeploy, and recheck robots/sitemap/indexable metadata.

## Fast mode rules

1. Normal work happens on preview first.
2. Production is for a short final check, not for experimenting.
3. Small visual or text changes can be checked fast.
4. Backend, auth, payment, search, and env changes need preview first, then a short production check.
5. After every important change, keep the result written here so chat memory does not matter.

## Simple working rule

At the start of future sessions, the agent must do this automatically:

1. Read this file first.
2. Answer in this format:
- Goal
- Status
- Next
- Need from you

Do not rely on old chat memory.

## Open questions

- Confirm whether the manual-normalization brands/models plan is acceptable for launch.
- Decide when to evaluate the VIN provider and always-updated EU taxonomy provider backlog in `docs/product-capability-backlog.md`.
- After launch, which dealers do we contact first?
- When do we enable crawler indexing for the public SEO launch?
