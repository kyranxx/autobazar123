# Launch Completion Audit

Last updated: 2026-05-17

Objective: make Autobazar123 safely launch-ready, with evidence, then prepare the first real ad-supply push.

Completion decision: not complete. The local hardening evidence is good, but public launch still needs real-account, preview, production smoke, and live maintenance-bypass evidence.

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
| Algolia search checker quality | `npm run test:algolia-search-script` covers sample-hit required fields, no-active-ad failure, and count mismatch failure offline; `npm run check:algolia-search` verifies current live read-only state. | Verified local | Does not replace preview browser validation against deployed Algolia env. |
| Listing detail | Local webapp audit over sampled detail URLs. | Verified local | Needs final preview/prod smoke after deploy approval. |
| Signup | Page/UI checks plus mocked register/resend POST route coverage. | Partial | Real signup submit, email delivery, and confirmation-link flow still missing. |
| Login | Release-gauntlet and focused E2E auth entry/exit passed with configured account. | Verified local | Needs preview/prod validation after deploy approval. |
| Password reset and account password change | Page/UI checks plus mocked password-reset POST route coverage for recovery link generation and queueing. Account password recovery POST route coverage verifies token verification, admin password update, recovery-session revocation, and failure handling. Authenticated password-change route coverage verifies auth, payload validation, password update failure, success, and other-session revocation. | Partial | Real email delivery and reset token flow still missing. |
| Add listing | Route tests cover draft create, free auto-publish, and failed publish cleanup. | Partial | Real authenticated browser listing creation still missing. |
| Edit/manage listing | Route tests cover quick edit, feature actions, and ownership denial. | Blocked | Configured E2E account has no ads; needs seller-with-ad credentials or approved test setup. |
| Inquiry/contact | Contact and inquiry route tests cover validation, rate-limit/config failure, auth, captcha, recipient ownership, self-message rejection, and handoff. | Partial | Real browser submit plus seller delivery/read path still missing. |
| Payment if enabled | Checkout-status route tests cover authenticated actor lookup, dealer-owner fallback lookup, pending response, and lookup failure. Stripe checkout route tests cover dealer topup metadata, private listing checkout metadata, seller ownership rejection, billing-session updates, and idempotency storage. Stripe webhook route tests cover config/signature/duplicate/paid/unpaid behavior. | Partial | Real Stripe checkout and live webhook delivery still missing. |
| Admin/dealer permissions | Admin-positive and non-dealer prompt pass locally; dealer verification request API has route coverage for authenticated owner-scoped reads, duplicate pending guard, verified/missing dealer rejection, and request creation; Playwright loads `.env.local`; release gauntlet now supports separate admin, non-admin, seller, and dealer credentials; read-only launch coverage checker confirms the current primary account is admin and reports DB candidate counts without printing secrets. | Partial | Non-admin admin denial still needs credentials; dealer billing path needs dealer data/account. |
| Launch test account setup | `docs/launch-test-accounts.md` documents current candidate counts, required E2E env keys, safe rules, and verification commands. | Prepared | Credentials/dealer data still need user-approved setup. |
| Launch account checker quality | `npm run test:launch-test-coverage-script` covers role-specific fallback and DB candidate-count logic offline; `npm run check:launch-test-coverage` verifies current live read-only state. | Verified local | Does not replace missing real credentials/dealer data. |
| Maintenance bypass | Local token helper, unlock route, and proxy host behavior are covered by unit tests. | Partial | Real production bypass must still be rechecked before opening. |
| `/api/health` | `npx vitest run src/app/api/health/route.test.ts src/proxy.test.ts src/lib/security/maintenance-bypass.test.ts` passed 29/29 tests, covering local health route behavior plus proxy/maintenance-bypass behavior. | Partial | Needs fresh preview/prod health after explicit deploy request. |
| Fix only verified blockers | Current changes are targeted to verified analytics, search, route, test, and checklist gaps. | Partial | Continue this rule for remaining real-flow issues. |
| Dependency posture | `npm audit --json`, `npm run build`, `npm run typecheck`, `npm run easy:quick`, and `npm run test:security:release-gate` pass after direct dependency bumps, explicit transitive overrides, the latest homepage reflow fix, stale `.next/dev` cleanup before build/typecheck, moving test helpers out of App Router route exports, and updating the release policy for moved quality-gate OIDC internals. | Verified local | Needs preview/prod deploy validation before shipping. |
| Preview as main validation target | `PROJECT_STATUS.md` says no deploy was requested; production remains gated. | Done for posture | Needs explicit deploy approval to validate. |
| Brands/models launch posture | `docs/ad-supply-launch-plan.md` chooses current taxonomy plus manual normalization; no paid provider for launch without owner approval. | Done | User still needs to accept the launch stopgap. |
| VIN and always-updated taxonomy capability | `docs/product-capability-backlog.md` records the existing scaffolding and the provider, cost/license, sync, migration, monitoring, rollback, and preview work still required. | Open backlog | Do not describe either capability as complete or enable live sync without owner approval. |
| Dealer/free-upload plan | `docs/ad-supply-launch-plan.md` drafts offer, rules, intake fields, message, and success target. | Prepared | Do not contact dealers until launch checks pass and user agrees to open. |
| PROJECT_STATUS updates | `PROJECT_STATUS.md` updated with evidence, blockers, and next tasks. | Done | Keep current after the next important change. |

## Verified Commands From Current Local Evidence

- `npm audit --json`: passed with 0 vulnerabilities.
- `npm run typecheck`: passed after removing stale generated `.next/dev` artifacts, regenerating route types, and running TypeScript without stale incremental state.
- `npm run build`: passed with Next 16.2.6 after removing stale generated `.next/dev` artifacts before build.
- `npm run typecheck`: failed once on Next 16 App Router route extra exports, then passed after moving route helpers into sidecar modules.
- `npm run build`: passed after the route-helper export fix, including TypeScript and 1573 generated static pages.
- `npx vitest run src/app/api/contact/route.rate-limit.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/app/api/admin/quality-gates/route.test.ts src/app/api/monitoring/quality-gates/route.test.ts --pool=forks --no-file-parallelism --maxWorkers=1`: passed 7/7 files and 62/62 tests.
- `npm run easy:quick`: passed with 89/89 unit files and 448/448 tests.
- `npm run test:security:release-gate`: passed after the homepage reflow, health-test updates, App Router route-helper policy update, and cleanup-aware typecheck command.
- `npm run check:i18n-contract`, `npm run check:sk-diacritics`, and `npm run check:i18n-diacritics`: passed after adding `bodyType.motorcycle` to Slovak, English, and Hungarian locale catalogs.
- `npx vitest run src/app/api/account/password/route.test.ts`: passed 7/7 tests.
- `npx vitest run src/app/api/account/password/route.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts`: passed 39/39 tests.
- `npx vitest run src/app/api/account/password/recovery/route.test.ts`: passed 12/12 tests.
- `npx vitest run src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts`: passed 32/32 tests.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts`: passed 8/8 tests.
- `npx vitest run src/lib/security/maintenance-bypass.test.ts src/app/api/maintenance/unlock/route.test.ts src/proxy.test.ts`: passed 27/27 tests.
- `npx vitest run src/app/api/health/route.test.ts src/proxy.test.ts src/lib/security/maintenance-bypass.test.ts`: passed 29/29 tests.
- `npm run check:theme-guard`: passed after normalizing the unrelated marketplace UI raw hex to existing background color tokens.
- `npx vitest run src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts`: passed 20/20 tests.
- `npx vitest run src/app/api/account/dealer-verification/route.test.ts`: passed 6/6 tests.
- `npx vitest run src/app/api/account/dealer-verification/route.test.ts src/app/api/account/ads/route.test.ts src/app/api/account/ads/apply-action/route.test.ts`: passed 17/17 tests.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts`: passed 8/8 tests.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts`: passed 41/41 tests.
- `npx vitest run src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts`: passed 33/33 tests.
- `npm run test:release-gauntlet`: passed 8/12 checks with 4 honest skips after dependency hardening and Playwright `.env.local` runner loading was fixed.
- `npm run check:launch-test-coverage`: passed as a read-only coverage report; complete launch test account coverage is no. Primary login/admin coverage exists; non-admin, seller-with-owned-ad, and dealer credentials are missing; DB candidates exist for non-admin and seller-with-ad, but not dealer owners.
- `npm run test:launch-test-coverage-script`: passed 2/2 tests for launch-account checker role fallback and candidate counting.
- `npm run check:algolia-search`: passed as a read-only real index check; 56 active Supabase ads matched 56 searchable Algolia records.
- `npm run test:algolia-search-script`: passed 3/3 tests for Algolia coverage-checker validation logic.
- `npm run test:web-interface`: passed 18/18 after the latest homepage/search UI changes.
- `npx playwright test tests/reflow-zoom.test.ts`: passed 21/21 after the homepage reflow fix.
- `npm run test:a11y`: passed 63/63 after the homepage reflow fix.
- `npm run test:keyboard`: passed 9/9.
- `npm run test:mobile-matrix`: passed 42/42.
- `npm run test:ui-quality-gate`: passed after the homepage reflow fix.
- `git diff --check`: passed.
- Focused Playwright runtime check for desktop and mobile `/vysledky?bodyStyle=motorcycle`: passed with status 200, 0 console issues, and 0 network issues.
- Latest full `npm run audit:webapp`: passed on 2026-05-20. Playwright completed 5/5 tests and the saved report at `output/playwright/webapp-audit.json` records `complete: true`, 80 route/viewport checks, 0 failing routes, 0 console warnings/errors, 0 network failures, and 0 DevTools issues.
- `tests/webapp-audit.ts` now writes partial JSON reports, supports `AUDIT_VIEWPORT` / `AUDIT_ROUTE_OFFSET`, applies the intended long timeout, detaches CDP sessions, and isolates browser contexts per route. After the dev-artifact/server cleanup fixes, the full local audit completes successfully.
- Local `next start` validation after `npm run build`: blocked by missing local Upstash Redis env vars; this is expected fail-closed proxy behavior locally.

## Remaining Launch Blockers

- Real non-admin account for admin-denial testing.
- Real seller account with at least one owned ad for edit/top/sold/manage checks.
- Dealer account/data for dealer permission and topup checks.
- Role-specific release-gauntlet env vars when available: `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`, `E2E_NON_ADMIN_EMAIL` / `E2E_NON_ADMIN_PASSWORD`, `E2E_SELLER_EMAIL` / `E2E_SELLER_PASSWORD`, and `E2E_DEALER_EMAIL` / `E2E_DEALER_PASSWORD`.
- Real signup confirmation check.
- Real password reset email/token check.
- Browser add-listing creation check.
- Real inquiry delivery/read path check.
- Real Stripe checkout and live webhook delivery check.
- Preview deploy, preview `/api/health`, preview core-flow smoke, and preview browser search validation against deployed Algolia env.
- Preview browser audit/search validation against the deployed environment after explicit deploy approval.
- Production smoke while maintenance remains on.
- Maintenance bypass recheck before opening.
- User approval before removing maintenance mode or contacting dealers.
