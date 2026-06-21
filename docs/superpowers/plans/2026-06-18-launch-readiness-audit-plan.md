# Launch Readiness Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Autobazar123 safe to open publicly, invite Slovak dealers, and run paid listing enhancements without unknown critical gaps.

**Architecture:** Treat launch readiness as a gated release, not one giant refactor. Each subsystem gets a small verified task: auth, listings, payments, email, search, SEO, UI, security, deploy, and branch cleanup. No dealer outreach starts until the launch gate is green.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.7, Supabase/Postgres/RLS, Algolia, Stripe Checkout/Webhooks, Cloudflare Images, Vercel Cron/Deployments, Vitest, Playwright, pgTAP.

---

## Current Audit Snapshot

Branch state after Task 1 completion:
- Current branch: local `master`
- `master`: tracks `origin/master`, ahead by local audit commits
- Removed duplicate local branches: `codex/front-results-ad-dashboard-redesign`, `codex/frontpage-reference-redesign`
- Merged and deleted local audit branch: `codex/autobazar-integration-checkpoint-20260602`
- Local `master` is not pushed or deployed.

Fixed in the current audit pass:
- Docker Desktop recovered; local Supabase DB tests can run.
- `npm audit --json` reports 0 vulnerabilities.
- Next/React packages are at patched versions: Next `16.2.9`, React/React DOM `19.2.7`.
- Login/register/reset forms now render with `method="post"` so a pre-hydration submit cannot leak credentials into the URL query string.
- Homepage search controls now have stable `id` and `name` attributes.
- `npm run dev` now starts successfully with Turbopack after setting `nextConfig.turbopack.root`.
- Supabase RLS hardening migration removes anonymous raw reads from `profiles` and `dealers`.
- Public dealer page no longer reads seller owner email from `profiles`.
- Seller ad insert/update/delete RLS policies were restored with authenticated owner/admin scope.
- `public.public_profiles` view exposes safe display fields only.
- `claim_email_jobs` SQL precedence bug is fixed and covered by pgTAP.
- `/api/cron/process-email-jobs` is now listed in `vercel.json` with a daily deploy-safe schedule.
- `/site-map` production build blockers were fixed.
- Stripe webhook unused type warning was removed.
- Stripe webhook helper signatures now use a route-local typed Supabase schema instead of generic Supabase client suppressions.

Fresh verified evidence:
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run test:db:rls`: pass, 22/22.
- `npm run test:security:release-gate`: pass.
- `npx vitest run src/components/AuthModal.email-flow.test.tsx src/app/api/stripe/webhook/route.test.ts src/lib/email/react-email-templates.test.ts`: pass, 36/36.
- `npx vitest run src/app/api/stripe/webhook/route.test.ts`: pass, 27/27 on 2026-06-20 after the Stripe webhook Supabase typing cleanup.
- `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`: pass, 6 files / 52 tests on 2026-06-20 after the Stripe webhook Supabase typing cleanup.
- `npm run typecheck`, `npm run lint`, `npm run test:security:release-gate`, and `git diff --check`: pass on 2026-06-20 after the Stripe webhook Supabase typing cleanup.
- `npm run easy:quick`: pass, 90 files / 452 tests.
- `npm run build`: pass, 1574 static pages generated.
- `npm run check:algolia-search`: pass, 56 active Supabase ads and 56 Algolia records.
- `npm run list:fallbacks`: pass, 9 registered fallbacks after adding `cron.expire_ads_algolia_cleanup_failed`.
- `npm run check:launch-test-coverage`: pass, complete launch test account coverage is yes.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=true npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`: pass, 12/12.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`: pass, 18/18 on 2026-06-20 after adding seller create/edit/photo-remove/mark-sold/delete lifecycle coverage, non-owner edit-page denial coverage, dashboard create-tab single-`h1` coverage, real recovery-token password reset coverage, admin dealer-verification request visibility coverage, buyer inquiry delivery coverage, and React hydration waits/retries for login/reset/contact interactions.
- 2026-06-20 conditional skip audit: `rg` found no `.only`; explicit `test.skip(...)` calls are limited to credential/fixture/service-data guards in `tests/release-gauntlet.test.ts` and `tests/e2e.test.ts`. Current `npm run check:launch-test-coverage -- --require-complete` passed, and a fresh full release gauntlet passed 18/18 with no reported runtime skips.
- 2026-06-20 tracked cleanup scan: tracked-file grep found no unfinished-code markers, placeholder implementation markers, focused-test leftovers, TypeScript/eslint suppression markers, or explicit untyped Supabase helper usage. Ignored local scratch scripts under `scripts/` are not tracked launch code and were not changed.
- `npx vitest run src/app/api/account/password/route.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts`: pass, 40/40.
- `npm run test:security:release-gate`: pass on 2026-06-19 after the password recovery and cron reliability fixes.
- `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 8/8 after the `send-alerts` failure-reporting fix.
- `npx vitest run src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 10/10 after the `process-email-jobs` failure-reporting fix.
- `npx vitest run src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 14/14 after adding `cleanup-sold` route coverage and the `process-email-jobs` requeue degraded response.
- `npx vitest run src/lib/email/jobs.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 16/16 after adding direct email processor state-update failure coverage.
- `npx vitest run src/proxy.test.ts`: pass, 18/18.
- Latest local post-fix checks: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, `npm run build`, `npm run check:launch-test-coverage`, `npm run test:web-interface`, `npm run test:a11y`, `npm run test:keyboard`, `npm run test:mobile-matrix`, and `npm run test:ui-quality-gate` pass.
- 2026-06-20 launch screenshot/UI pass: `node output/playwright/launch-screenshots/capture-launch-screenshots.mjs` passed 18 desktop/mobile screenshots with 0 failed statuses, 0 console messages, 0 page errors, 0 network failures, 0 horizontal-scroll issues, and 0 too-wide elements.
- 2026-06-20 Task 10 live RLS audit: local `npm run test:db:rls` passed 2 files / 26 tests, but live anon Supabase probes failed for `profiles.email`, `profiles.phone`, `profiles.credit_balance`, and raw `dealers` without printing row values. Fresh 2026-06-20 recheck via `npm run check:live-rls-posture -- --json` still returned `ok=false`, 4 leaked probes, 0 probe errors, and 1 anon-readable row for each check.
- 2026-06-20 Task 10 compatibility fix: `npx vitest run src/lib/cars/public-car-detail.test.ts` passed 2/2 after moving `/auto/[id]` public detail reads to a server-only admin helper with `status=active` and `is_hidden=false` filters.
- 2026-06-20 Task 10 support checks after the compatibility fix: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build` passed; unit tests passed 105 files / 507 tests and build generated 331 pages.
- 2026-06-20 Task 10 maintenance secret check: a RED test proved legacy `MAINTENANCE_PASSWORD` still unlocked maintenance; the route now accepts only `MAINTENANCE_UNLOCK_PASSWORD`, and focused unlock-route coverage passes 6/6.
- 2026-06-20 Vercel env pulls for Production and Preview showed the historical leaked maintenance value and legacy alias are not configured. Later metadata-only `npx vercel env ls preview` / `npx vercel env ls production` checks showed `MAINTENANCE_UNLOCK_PASSWORD` and `MAINTENANCE_BYPASS_SECRET` exist by name in both targets; sensitive values still need deploy/runtime smoke because CLI reads cannot prove them.
- 2026-06-20 Task 10 maintenance support checks: `npx vitest run src/lib/security/maintenance-bypass.test.ts src/app/api/maintenance/unlock/route.test.ts src/proxy.test.ts`, `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build` passed; unit tests passed 105 files / 508 tests and build generated 331 pages.
- 2026-06-20 Task 10 local secret cleanup: `.env.local`, `.vercel/`, and `.env.local.bak-20260322-221455` were confirmed ignored; the backup had 0 backup-only keys and was removed without printing values. Recheck showed only ignored `.env.local` and `.vercel/` remain.
- 2026-06-20 inquiry browser coverage: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=false npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line --grep "buyer inquiry"` passed 1/1 after stabilizing `CarDetailClient` captcha token callbacks and making the contact-form opener hydration-safe. The test verifies buyer submit, DB row ad/sender/recipient/message, seller dashboard read, and cleanup. The full release gauntlet also passed 18/18 with this test included.
- 2026-06-20 inquiry support checks: `npx vitest run src/app/api/inquiries/route.test.ts src/lib/inquiries/submit-inquiry.test.ts src/lib/inquiries/conversations.test.ts` passed 3 files / 16 tests; `git diff --check`, `npm run typecheck`, and `npm run lint` passed.
- 2026-06-20 real auth email delivery: queued Resend processing sent a signup confirmation email to a Gmail launch alias and password-reset emails to the connected Gmail account; Gmail received `Potvrdenie registrácie - Autobazar123` and `Obnovenie hesla - Autobazar123`, delivery logs show sent rows, pending auth email jobs were 0, and temporary launch-test users were deleted.
- 2026-06-20 auth email template fix: password-reset email detail rows now render label/value on separate text lines and avoid inline mailto flattening in the security note; latest Gmail readback confirmed clean spacing. `npx vitest run src/lib/email/react-email-templates.test.ts src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts` passed 6 files / 33 tests; `git diff --check`, `npm run typecheck`, and `npm run lint` passed.
- 2026-06-20 real auth-link browser/Gmail check: initial RED confirmed raw Supabase signup action links confirmed the user but landed on `/auth/auth-code-error`; signup/resend emails now send app `token_hash&type=email` callback URLs, and `/auth/callback` verifies the token hash with Supabase.
- 2026-06-20 auth-link evidence: signup submit, Gmail confirmation delivery, confirmation-link login to `/moj-ucet`, password-reset request, Gmail reset delivery, reset-link password update, old-password rejection, new-password browser login, temp-user cleanup, and pending auth email jobs 0 all passed. `npx vitest run src/app/auth/callback/route.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/account/password/recovery/route.test.ts` passed 5 files / 38 tests. Support checks passed: `npm run typecheck`, `npm run lint`, `npm run test:security:release-gate`, `git diff --check`, and `npm run build`; build generated 331 pages.

Known launch blockers still open:
- Real signup confirmation-link login and real password-reset emailed-link password update are verified locally through browser + Gmail; preview/production auth smoke is still needed after deploy approval.
- Real browser add-listing, edit-listing, photo upload/removal, mark-sold, seller delete/remove, and non-owner edit denial now pass locally.
- Real buyer inquiry submit through seller dashboard read now passes locally; preview/production validation is still needed after deploy approval.
- Configured dealer E2E account exists and passes `/dealer` topup smoke; admin dealer-verification request visibility now passes locally. Broader real admin moderation/provider smoke still belongs to the launch go/no-go gates.
- Configured seller-with-owned-ad credentials exist and pass dashboard edit/top/sold-control smoke plus create/edit/photo-remove/mark-sold lifecycle.
- Real Stripe Checkout creation is verified locally in test mode. A real paid test-mode Checkout also completed, reached paid billing state, created 1 billing transaction, and applied the `prolong_top` listing action before cleanup. An isolated signed current-webhook smoke verified `payment_confirmation` email job/provider/Gmail delivery; remote payment notification logging is still blocked until `20260618193000_align_payment_notifications_billing.sql` is applied remotely.
- Live Supabase raw `profiles` and `dealers` are anonymously readable until compatible code is deployed and `20260618174500_harden_profile_dealer_public_reads.sql` is safely applied to remote, then rechecked with `npm run check:live-rls-posture -- --json`.
- Maintenance bypass cannot be trusted in Preview/Production until `MAINTENANCE_UNLOCK_PASSWORD` and `MAINTENANCE_BYPASS_SECRET` are verified by deploy/runtime smoke.
- Payment scout finding: mocked checkout/webhook tests pass 52/52 after payment failure email queueing, checkout fail-closed handling, paid-webhook retry responses, and fallback transaction lookup for payment confirmation queueing were wired locally. The private-listing transaction/RPC ordering risk now has a verified SQL atomicity migration/test.
- Payment email notification schema drift is fixed locally in commit `0bbf14f`; preview/production migration and payment notification logging are not verified yet. Current-webhook payment email delivery itself is verified locally through Resend and Gmail.
- Site remains crawler-blocked by `NEXT_PUBLIC_SITE_INDEXING_ENABLED=false`. Do not set `NEXT_PUBLIC_SITE_INDEXING_ENABLED=true` in Production until all launch gates pass and the owner explicitly approves public SEO opening; Preview may test indexing only as an isolated/protected verification.
- Canonical/domain decision is resolved to `https://www.autobazar123.sk`; local canonical config and Vercel public app/Supabase env values were cleaned where safe, but Vercel secret env remains launch-blocking.
- Programmatic SEO thin city-route scope is reduced locally: sitemap brand/model URLs now come from active inventory, city pSEO sitemap URLs require at least 10 active matching ads, below-threshold city pages noindex/404, hardcoded internal city pSEO links were removed, and `npm run build` now generates 331 pages instead of the previous 1574. This is not pushed, deployed, or live-smoked.
- Cron/search scout finding: Algolia live read-only check still passes at 56 active ads / 56 records. `expire-ads` DB update, `expire-ads` Algolia cleanup, `send-alerts` email-send, `send-alerts` overlapping invocation claims, `process-email-jobs` failed/requeued false-success paths, and direct email job processor state-update false-success paths are now fixed locally; all four cron routes have local route coverage. Queued email retries and direct saved-alert sends pass deterministic Resend `Idempotency-Key` values. Approved preview/production cron smoke still needs direct coverage, and real provider delivery/idempotency still needs live smoke because Resend keys expire after 24 hours.
- Public scale overclaims were removed locally, but the copy fix is not pushed, deployed, or live-smoked.
- Local Vercel Preview packaging is now locally green after the 2026-06-21 Cache Components/PPR compatibility change. Fresh 2026-06-21 continuation verification: `npm run check:vercel-build-preview` exited 0, generated 302 pages, created `.vercel\output`, and reported `Build completed successfully` for target `preview`; follow-up `npm run check:vercel-ppr-lambda-blocker` returned OK with 0 partially-static routes and no `next-resume` chain headers. Preview deployment itself has still not been run.
- Production/preview were not deployed or smoked in this audit pass.
- Vercel env/cloud-runtime preflight still needs cloud verification even though local packaging is green: public Supabase/App URL values were fixed to remove literal `\r\n`; Preview server envs were re-added from local source values, including Stripe test keys; Production non-payment server envs were re-added from local source values. Fresh `npx vercel env ls preview` / `npx vercel env ls production` checks show expected env names exist in both targets, including Upstash and Stripe names. Fresh `vercel env run` present/missing probes still do not expose sensitive values locally, so local CLI checks cannot prove cloud runtime secrets. Production Stripe still needs cloud smoke or provider/dashboard confirmation.
- Dirty taxonomy/discovery work remains in the main worktree and is not part of the launch-critical path. Current recheck passed parser/candidate tests plus active-only public taxonomy read coverage, lint, typecheck, and whitespace checks. The lane adds external discovery scripts, candidate promotion, and local-only migration `20260619214332_add_vehicle_taxonomy_metadata.sql`; keep it out of the launch remote DB push unless explicitly approved as a separate feature.
- 2026-06-20 dirty taxonomy write-safety hardening: discovery scripts now require either `--dry-run` or explicit `--write`; approved-candidate promotion now has a real read-only `--dry-run` planner and still requires explicit `--write` for mutation. No-flag smoke checks for Wikidata, Autobazar.eu, Otomoto, Mobile.de, and promotion stopped before mutation with explicit errors. Promotion `--dry-run` smoke ran read-only and reported 0 approved candidates, 0 brand inserts, and 0 model inserts. Candidate-store coverage verifies promotion dry-run does not insert/update taxonomy data and does not count existing inactive taxonomy rows as new inserts, matching the real write path. `npx vitest run src/lib/vehicle-taxonomy/candidate-store.test.ts src/lib/vehicle-taxonomy/write-guard.test.ts src/lib/vehicle-taxonomy/public.test.ts src/lib/vehicle-taxonomy/candidates.test.ts src/lib/vehicle-taxonomy/autobazar-eu.test.ts src/lib/vehicle-taxonomy/mobile-de.test.ts src/lib/vehicle-taxonomy/otomoto.test.ts` passed 7 files / 17 tests; `git diff --check`, `npm run typecheck`, and `npm run lint` passed. This remains current-worktree dirty taxonomy work, not launch-approved remote migration work.

## File Map

Files already touched by this audit:
- `package.json`, `package-lock.json`: patched dependency posture.
- `src/lib/auth/admin-mfa.ts`: Supabase MFA assurance type compatibility.
- `src/components/AuthModal/LoginForm.tsx`: pre-hydration credential leak fix.
- `src/components/AuthModal/RegisterForm.tsx`: pre-hydration credential leak fix.
- `src/components/AuthModal/ResetForm.tsx`: pre-hydration email leak fix.
- `src/components/home/HomeFrontpageSearch.tsx`: form control id/name fixes.
- `next.config.ts`: Turbopack root.
- `src/lib/dealer/public.ts`: safe public dealer reads through admin client with limited columns.
- `src/app/(site)/predajca/[slug]/page.tsx`: removes public dealer owner email rendering.
- `src/app/(site)/moj-ucet/DashboardClient.tsx`: uses `public_profiles`.
- `src/app/api/stripe/webhook/route.ts`: warning cleanup.
- `src/app/site-map/page.tsx`: cache-components-compatible request rendering.
- `supabase/migrations/20260618174500_harden_profile_dealer_public_reads.sql`: RLS, public profile view, ad owner policies, email claim function fix.
- `supabase/tests/rls-critical-policy-posture.test.sql`: RLS and email-claim regression coverage.
- `vercel.json`: email queue cron.

Files likely needed next:
- `src/lib/email/jobs.ts`: add payment enqueue helpers once schema is aligned.
- `src/lib/email/send-payment-confirmation.ts`: stop logging current billing transactions into legacy credit-transaction FK.
- `src/app/api/stripe/webhook/route.ts`: enqueue payment success/failure emails after billing apply succeeds.
- `src/app/api/stripe/webhook/route.test.ts`: assert payment email enqueue on non-duplicate paid session and no enqueue on duplicate/unpaid.
- `supabase/migrations/<timestamp>_align_payment_notifications_billing.sql`: align payment notification records with `billing_transactions`.
- `tests/release-gauntlet.test.ts`: expand real role flow checks once credentials exist.
- `src/lib/security/csp.ts`: allows Cloudflare direct creator upload host `https://upload.imagedelivery.net`.
- `src/app/api/account/ads/route.ts`: seller-owned `DELETE` route removes the Algolia object first, then deletes the seller-scoped DB row.
- `src/app/(site)/moj-ucet/DashboardClient.tsx`: seller dashboard delete/remove control and confirmation modal.
- `src/context/AuthContext.tsx`: non-admin admin-status lookup uses `.maybeSingle()` to avoid normal zero-row Supabase 406 console noise.
- `src/context/AuthContext.test.tsx`: regression coverage for the non-admin admin-status lookup.
- `src/app/(site)/auto/[id]/CarDetailClient.tsx`, `src/app/(site)/moj-ucet/DashboardClient.tsx`: first-visible-row listing images are prioritized where they can become launch-page LCP candidates; `CarDetailClient` also keeps Turnstile token callbacks stable for seller contact and report forms.
- `src/lib/cars/public-car-detail.ts`: public listing detail uses a server-only admin fetch helper with active/visible filters so profile RLS hardening does not break `/auto/[id]`.
- `src/lib/cars/public-car-detail.test.ts`: regression coverage for the RLS-compatible public listing detail helper.
- `playwright.config.ts`: mobile Chromium projects honor `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` for local UI gates.
- `tests/e2e.test.ts`: add signup/reset/listing/photo browser coverage if not already present.
- `src/config/config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo/crawl-policy.ts`: canonical/indexing/pSEO gates.
- `src/i18n/messages/sk.json`, `src/i18n/messages/en.json`, `src/i18n/messages/hu.json`: remove scale overclaims.
- `docs/launch-checklist.md`, `PROJECT_STATUS.md`: update evidence after each completed task.

## Resume Protocol

- [ ] **Step 1: Read status first**

Run:
```powershell
Get-Content -LiteralPath PROJECT_STATUS.md
```
Expected: status describes site online, crawler-blocked, current launch blockers, and current local evidence.

- [ ] **Step 2: Check branch/worktree**

Run:
```powershell
git status --short --branch
git branch -vv
```
Expected after Task 1 completion: current branch is clean local `master`, ahead of `origin/master`, and no local audit branches remain.

- [ ] **Step 3: Do not contact dealers**

Do not start dealer outreach until all tasks marked `Launch Gate` are complete and preview/production smoke checks pass.

---

### Task 1: Preserve Audit Work And Clean Branches

**Files:**
- Modify: none.
- Review: all changed files from `git status --short`.

- [x] **Step 1: Confirm automated checks are still green**

Run:
```powershell
npm run typecheck
npm run lint
npm run test:db:rls
npm run test:security:release-gate
npm run build
```
Expected: every command exits 0.

- [x] **Step 2: Commit current audit fixes on the current branch**

Run:
```powershell
git status --short
git add package.json package-lock.json next.config.ts vercel.json
git add src/components/AuthModal/LoginForm.tsx src/components/AuthModal/RegisterForm.tsx src/components/AuthModal/ResetForm.tsx
git add src/components/home/HomeFrontpageSearch.tsx src/lib/auth/admin-mfa.ts src/lib/dealer/public.ts
git add "src/app/(site)/predajca/[slug]/page.tsx" "src/app/(site)/moj-ucet/DashboardClient.tsx" "src/app/api/stripe/webhook/route.ts"
git add src/app/site-map/page.tsx
git add supabase/migrations/20260618174500_harden_profile_dealer_public_reads.sql supabase/tests/rls-critical-policy-posture.test.sql
git add PROJECT_STATUS.md docs/launch-checklist.md docs/launch-completion-audit.md docs/product-capability-backlog.md
git add src/app/robots.test.ts src/lib/seo/crawl-policy.ts src/app/site-map
git diff --cached --check
git commit -m "fix: harden launch audit blockers"
```
Expected: commit succeeds. If `git diff --cached --check` fails, fix whitespace before committing.

- [x] **Step 3: Merge current branch into master locally**

Run:
```powershell
git switch master
git merge --no-ff codex/autobazar-integration-checkpoint-20260602
npm run build
```
Expected: merge succeeds and build passes.

- [x] **Step 4: Delete merged audit branch**

Run:
```powershell
git branch -d codex/autobazar-integration-checkpoint-20260602
git branch -vv
```
Expected: only `master` remains locally.

---

### Task 2: Align Payment Emails With Current Billing

Status: completed locally in commit `0bbf14f`; not pushed, deployed, or live-smoked.

**Files:**
- Create: `supabase/migrations/<timestamp>_align_payment_notifications_billing.sql`
- Modify: `src/lib/email/send-payment-confirmation.ts`
- Modify: `src/lib/email/jobs.ts`
- Modify: `src/app/api/stripe/webhook/route.ts`
- Test: `src/app/api/stripe/webhook/route.test.ts`

- [x] **Step 1: Write a failing webhook test for payment confirmation enqueue**

In `src/app/api/stripe/webhook/route.test.ts`, mock `@/lib/email/jobs`:
```ts
const enqueuePaymentConfirmationEmailJobMock = vi.fn();
const enqueuePaymentFailureEmailJobMock = vi.fn();
const scheduleQueuedEmailDrainMock = vi.fn();

vi.mock("@/lib/email/jobs", () => ({
  enqueuePaymentConfirmationEmailJob: (...args: unknown[]) =>
    enqueuePaymentConfirmationEmailJobMock(...args),
  enqueuePaymentFailureEmailJob: (...args: unknown[]) =>
    enqueuePaymentFailureEmailJobMock(...args),
  scheduleQueuedEmailDrain: (...args: unknown[]) =>
    scheduleQueuedEmailDrainMock(...args),
}));
```

Add this test:
```ts
it("queues a payment confirmation email after a non-duplicate paid checkout", async () => {
  enqueuePaymentConfirmationEmailJobMock.mockResolvedValue({ ok: true });
  webhookMocks.rpc.mockResolvedValue({
    data: {
      success: true,
      duplicate: false,
      kind: "private_listing_action",
      transaction_id: "11111111-1111-4111-8111-111111111111",
    },
    error: null,
  });
  webhookMocks.constructEvent.mockReturnValue({
    id: "evt_checkout_paid_email",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_email",
        payment_status: "paid",
        amount_total: 499,
        currency: "eur",
        customer_email: "buyer@example.com",
        customer_details: { email: "buyer@example.com", name: "Buyer Test" },
        metadata: {
          billingCheckoutId: "billing-checkout-paid",
          billingKind: "private_listing_action",
          operation: "publish_premium",
        },
        payment_intent: "pi_test_123",
        invoice: null,
      },
    },
  });

  const response = await POST(createWebhookRequest({ body: "{\"id\":\"evt\"}" }));

  expect(response.status).toBe(200);
  expect(enqueuePaymentConfirmationEmailJobMock).toHaveBeenCalledWith({
    userEmail: "buyer@example.com",
    userName: "Buyer Test",
    summaryLabel: "Platba",
    summaryValue: "Publikovat Premium inzerat",
    amount: 4.99,
    currency: "eur",
    transactionId: "11111111-1111-4111-8111-111111111111",
    invoiceUrl: undefined,
  });
  expect(scheduleQueuedEmailDrainMock).toHaveBeenCalledWith({
    batchSize: 5,
    jobTypes: ["payment_confirmation"],
  });
});
```

Run:
```powershell
npx vitest run src/app/api/stripe/webhook/route.test.ts
```
Expected: fail because payment enqueue helpers are not implemented/called.

- [x] **Step 2: Align DB notification table**

Create migration `supabase/migrations/<timestamp>_align_payment_notifications_billing.sql`:
```sql
BEGIN;

ALTER TABLE public.payment_notifications
  DROP CONSTRAINT IF EXISTS payment_notifications_transaction_id_fkey;

ALTER TABLE public.payment_notifications
  ADD COLUMN IF NOT EXISTS billing_transaction_id UUID REFERENCES public.billing_transactions(id) ON DELETE CASCADE;

UPDATE public.payment_notifications
SET billing_transaction_id = NULL
WHERE billing_transaction_id IS NULL;

ALTER TABLE public.payment_notifications
  ALTER COLUMN transaction_id DROP NOT NULL;

DROP POLICY IF EXISTS "Users can see their payment notifications" ON public.payment_notifications;
CREATE POLICY "Users can see their payment notifications"
ON public.payment_notifications
FOR SELECT
TO authenticated
USING (
  billing_transaction_id IN (
    SELECT id
    FROM public.billing_transactions
    WHERE actor_user_id = (SELECT auth.uid())
       OR dealer_id IN (
         SELECT id FROM public.dealers WHERE owner_id = (SELECT auth.uid())
       )
  )
  OR EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS idx_payment_notifications_billing_transaction_id
ON public.payment_notifications(billing_transaction_id);

COMMIT;
```

Run:
```powershell
npm run test:db:rls
```
Expected: pass. Add a pgTAP assertion if this migration changes policy posture.

- [x] **Step 3: Add payment enqueue helpers**

In `src/lib/email/jobs.ts`, export helpers:
```ts
export async function enqueuePaymentConfirmationEmailJob(input: {
  userEmail: string;
  userName?: string | null;
  summaryLabel: string;
  summaryValue: string;
  amount: number;
  currency: string;
  invoiceUrl?: string | null;
  transactionId: string;
}) {
  return enqueueEmailJob({
    jobType: "payment_confirmation",
    payload: input,
  });
}

export async function enqueuePaymentFailureEmailJob(input: {
  userEmail: string;
  userName?: string | null;
  amount: number;
  currency: string;
  failureReason: string;
  transactionId: string;
}) {
  return enqueueEmailJob({
    jobType: "payment_failure",
    payload: input,
  });
}
```

Run:
```powershell
npm run typecheck
```
Expected: pass.

- [x] **Step 4: Update payment notification logging**

In `src/lib/email/send-payment-confirmation.ts`, change `logPaymentNotification` to write `billing_transaction_id`:
```ts
const { error } = await supabaseAdmin.from("payment_notifications").insert({
  billing_transaction_id: params.transactionId,
  notification_type: params.notificationType,
  user_email: params.userEmail,
  email_status: params.status,
});
```

Run:
```powershell
npx vitest run src/lib/email/react-email-templates.test.ts
```
Expected: pass.

- [x] **Step 5: Wire webhook enqueue after successful billing apply**

In `src/app/api/stripe/webhook/route.ts`, import:
```ts
import {
  enqueuePaymentConfirmationEmailJob,
  enqueuePaymentFailureEmailJob,
  scheduleQueuedEmailDrain,
} from "@/lib/email/jobs";
```

After a successful non-duplicate `apply_billing_checkout_session`, enqueue confirmation when email and transaction id exist:
```ts
const customerEmail = session.customer_details?.email || session.customer_email || null;
const transactionId = checkoutResult.transaction_id;

if (customerEmail && transactionId) {
  const enqueueResult = await enqueuePaymentConfirmationEmailJob({
    userEmail: customerEmail,
    userName: session.customer_details?.name || undefined,
    summaryLabel: "Platba",
    summaryValue: getCheckoutSummaryValue(metadata),
    amount: (session.amount_total ?? 0) / 100,
    currency: session.currency || "eur",
    invoiceUrl: getInvoiceUrl(session),
    transactionId,
  });

  if (!enqueueResult.ok) {
    console.warn("Failed to queue payment confirmation email:", enqueueResult.error);
  } else {
    scheduleQueuedEmailDrain({
      batchSize: 5,
      jobTypes: ["payment_confirmation"],
    });
  }
}
```

Add helpers near the bottom:
```ts
function getCheckoutSummaryValue(metadata: Stripe.Metadata): string {
  switch (metadata.operation) {
    case "publish_premium":
      return "Publikovat Premium inzerat";
    case "publish_top":
      return "Publikovat Exclusive inzerat";
    case "prolong_basic":
      return "Predlzit inzerat";
    case "prolong_premium":
      return "Predlzit Premium inzerat";
    case "prolong_top":
      return "Predlzit Exclusive inzerat";
    default:
      return metadata.packageLabel || "Platobna operacia";
  }
}

function getInvoiceUrl(session: Stripe.Checkout.Session): string | undefined {
  const invoice = session.invoice;
  if (invoice && typeof invoice !== "string" && "hosted_invoice_url" in invoice) {
    return invoice.hosted_invoice_url || undefined;
  }
  return undefined;
}
```

Run:
```powershell
npx vitest run src/app/api/stripe/webhook/route.test.ts
```
Expected: pass.

---

### Task 3: Finish Real Auth And Email Flows

**Files:**
- Modify: `.env.local` only if adding local E2E credentials; never commit secrets.
- Test: `tests/release-gauntlet.test.ts`
- Docs: `docs/launch-test-accounts.md`, `PROJECT_STATUS.md`

- [x] **Step 1: Create or identify test accounts**

Required accounts:
- Admin account: has admin dashboard access.
- Non-admin account: no admin role.
- Seller account: owns at least one active or draft ad.
- Dealer account: owns one dealer profile and can access `/dealer`.

Record only env variable names in docs:
```text
E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
E2E_NON_ADMIN_EMAIL / E2E_NON_ADMIN_PASSWORD
E2E_SELLER_EMAIL / E2E_SELLER_PASSWORD
E2E_DEALER_EMAIL / E2E_DEALER_PASSWORD
```

- [x] **Step 2: Verify coverage checker**

Run:
```powershell
npm run check:launch-test-coverage
```
Expected:
```text
Complete launch test account coverage: yes
```

- [x] **Step 3: Verify signup confirmation**

Run browser flow:
```powershell
npm run dev
```
Manual browser path:
1. Open `http://localhost:3000/auth/register`.
2. Register a fresh test email.
3. Confirm that the API returns success.
4. Confirm `email_jobs` receives `auth_register_confirmation`.
5. Confirm the email is sent through provider or appears in the configured provider logs.
6. Open confirmation link.
7. Confirm login succeeds and dashboard opens.

Expected: user can register, receive confirmation, confirm, login, and reach `/moj-ucet`.

- [x] **Step 4: Verify password reset**

Manual browser path:
1. Open `http://localhost:3000/auth/reset-password`.
2. Submit known test email.
3. Confirm `email_jobs` receives `auth_password_reset`.
4. Open reset link.
5. Set a new password.
6. Login with new password.

Expected: reset token works once, old password fails, new password succeeds.

2026-06-19 partial evidence:
- Added release-gauntlet coverage that uses Supabase admin `generateLink({ type: "recovery" })`, opens the real recovery-token URL in Chrome, sets a temporary password, proves the old password fails, logs in with the temporary password, restores the original E2E password through the admin API, and proves the original password works again.
- Fixed recovery-session cleanup to use the service-role admin client and to suppress only the benign `AuthSessionMissingError` returned when the recovery session has already been consumed.
- Passed focused browser check: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line --grep "password recovery token lets a non-admin reset and restore password"`.
- Passed full browser check: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`, 16/16 after dashboard create-tab single-`h1` coverage was added.
- Passed auth unit suite: `npx vitest run src/app/api/account/password/route.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts --pool=forks --no-file-parallelism --maxWorkers=1`, 40/40.
- Resolved locally by the 2026-06-20 real provider/link evidence below; preview/production auth smoke remains open after deploy approval.

2026-06-20 real provider/link evidence:
- Real signup confirmation email was queued through `auth_register_confirmation`, sent through Resend, found in Gmail as `Potvrdenie registrácie - Autobazar123`, and the emailed confirmation link logged the temporary user into `/moj-ucet` with 0 browser console/page errors.
- Real password reset email was queued through `auth_password_reset`, sent through Resend, found in Gmail as `Obnovenie hesla - Autobazar123`, and the emailed reset link updated the password; old password was rejected and the new password logged in successfully.
- Cleanup removed temporary auth-link users/profiles, pending auth email jobs were 0, and local token/password artifacts were removed or redacted.
- Passed focused auth-link checks: `npx vitest run src/app/auth/callback/route.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/account/password/recovery/route.test.ts`, 5 files / 38 tests.
- Passed support checks: `npm run typecheck`, `npm run lint`, `npm run test:security:release-gate`, `git diff --check`, and `npm run build`, 331 pages.
- Preview/production auth smoke remains open after deploy approval.

- [x] **Step 5: Update docs**

Updated `PROJECT_STATUS.md` and `docs/launch-checklist.md` with exact dates, commands, account coverage result, and remaining preview/production blockers.

---

### Task 4: Finish Listing Lifecycle And Photo Flows

**Files:**
- Test: `tests/release-gauntlet.test.ts`
- Test: `tests/e2e.test.ts`
- Modify only if tests expose real bugs.

- [x] **Step 1: Add a browser test for seller listing creation**

Add a Playwright test that signs in with `E2E_SELLER_EMAIL`, opens `/pridat-inzerat`, fills minimum valid fields, uploads two small test images, submits as draft or free publish, and records created ad id for cleanup.

Run:
```powershell
npm run test:release-gauntlet -- --grep "seller listing creation"
```
Expected first run: fail if no seller credentials or missing selectors.

- [x] **Step 2: Implement only selector/test helper fixes needed**

If selectors are missing, add stable `data-testid` attributes to `src/app/(site)/pridat-inzerat/AdWizardClient.tsx` for:
```text
listing-brand
listing-model
listing-year
listing-price
listing-mileage
listing-location-city
listing-photo-upload
listing-submit
```

Run:
```powershell
npm run lint
npm run test:release-gauntlet -- --grep "seller listing creation"
```
Expected: pass with a real created listing.

2026-06-19 evidence:
- Added stable wizard selectors for category, brand, model, year, fuel, transmission, body, mileage, city, district, description, photo upload/count/remove, price, and submit.
- Fixed form-adjacent photo/equipment buttons to use `type="button"`.
- Fixed CSP for real Cloudflare direct upload host `https://upload.imagedelivery.net`.
- `npx vitest run src/lib/security/csp.test.ts src/utils/upload.test.ts`: passed, 10/10.
- Focused lifecycle Playwright test passed.

- [x] **Step 3: Verify edit, photo removal, mark sold, delete**

Add or run browser checks for:
- `/upravit-inzerat/{ownedAdId}` loads for owner.
- Owner can change price/description.
- Owner can remove one uploaded photo.
- Owner can mark ad sold.
- Owner can delete/remove the test ad.
- Non-owner cannot edit the test ad.

Run:
```powershell
npm run test:release-gauntlet -- --grep "owned ad"
```
Expected: all owned-ad checks pass without skips.

2026-06-19 evidence:
- Passed: owner creates a test ad, uploads two photos, edits description/price, removes one photo, marks the listing sold, deletes it from the seller dashboard, and cleanup leaves 0 release-gauntlet ads.
- `npx vitest run src/app/api/account/ads/route.test.ts`: passed, 12/12, including seller-owned delete, ownership denial, invalid id, DB delete failure, and Algolia cleanup failure before DB deletion.
- `npx vitest run src/lib/analytics/events.test.ts`: passed, 17/17 after adding `listing_deleted`.
- Passed full suite: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`, 16/16 after dashboard create-tab single-`h1` coverage was added.
- Passed: non-owner browser denial for `/upravit-inzerat/{ownedAdId}`; the edit form is not exposed.
- Passed: `git diff --check`, `npm run lint`, and `npm run typecheck`.
- Passed cleanup check: `release_gauntlet_ads=0`.

---

### Task 5: Finish Dealer And Admin Permission Coverage

**Files:**
- Test: `tests/release-gauntlet.test.ts`
- Docs: `docs/launch-test-accounts.md`

- [x] **Step 1: Create or seed a dealer account**

Create a test dealer profile linked to `E2E_DEALER_EMAIL`.

Verify with:
```powershell
npm run check:launch-test-coverage
```
Expected:
```text
dealer account: yes
dealer owners: 1
```

- [x] **Step 2: Verify dealer dashboard**

Run:
```powershell
npm run test:release-gauntlet -- --grep "dealer"
```
Expected:
- Dealer account reaches `/dealer`.
- Non-dealer account sees registration/onboarding prompt.
- Admin can see dealer verification request area.

2026-06-20 evidence:
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=true npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line --grep "dealer"` passed 3/3.
- Covered dealer account `/dealer` billing/topup smoke, non-dealer onboarding prompt, and admin settings dealer-verification request visibility.
- The admin visibility check creates a temporary pending dealer-verification request for the configured dealer E2E account and deletes it after the test.
- Cleanup probe after verification found `release_gauntlet_dealer_verification_rows=0`.
- Full release gauntlet passed 18/18 with `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=false npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`.

- [x] **Step 3: Verify non-admin admin denial**

Run:
```powershell
npm run test:release-gauntlet -- --grep "admin denial"
```
Expected: `E2E_NON_ADMIN_EMAIL` cannot access `/admin`.

2026-06-18 evidence:
- Full release gauntlet passed 12/12 and asserted non-admin `/admin` returns 403 with `Forbidden: Admin access required`.

---

### Task 6: Finish Stripe Payment Verification

**Files:**
- Modify only if tests expose bugs.
- Test: `src/app/api/stripe/checkout/route.behavior.test.ts`
- Test: `src/app/api/stripe/webhook/route.test.ts`
- Test: `tests/release-gauntlet.test.ts`

- [x] **Step 1: Run local mocked payment tests**

Run:
```powershell
npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts
```
Expected: all tests pass.

2026-06-19 evidence:
- Passed: `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts`, 5 files / 42 tests.
- Still open before launch:
  - Paid Stripe test checkout completion/webhook/billing side effects now have partial shared-test evidence; isolated current-webhook payment confirmation delivery is verified, but remote payment notification logging still needs the launch-critical payment migration and preview/production smoke.
  - The earlier private-listing purchase atomicity risk is now covered by the later SQL atomicity migration/test; keep it in the remote migration batch.

2026-06-20 payment failure email evidence:
- Added RED/GREEN coverage in `src/app/api/stripe/webhook/route.test.ts` proving `checkout.session.async_payment_failed` updates checkout status and queues a `payment_failure` email when Stripe provides a customer email.
- Added RED/GREEN coverage in `src/lib/email/jobs.test.ts` proving queued payment-failure jobs can be processed without a billing transaction id.
- `payment_intent.payment_failed` now queues a failure email when Stripe provides `receipt_email`.
- `send-payment-confirmation.ts` logs payment failure notifications with `billing_transaction_id=null` when there is no billing transaction instead of forcing a fake id.
- Passed: `npx vitest run src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`, 28/28.
- Passed: `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`, 47/47.
- Passed: `npm run lint`; `npm run typecheck`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.
- Still open before launch: remote payment notification logging after `20260618193000_align_payment_notifications_billing.sql`, plus preview/production payment smoke.

2026-06-20 checkout fail-closed evidence:
- Added RED/GREEN coverage in `src/app/api/stripe/checkout/route.behavior.test.ts` for dealer topup and private listing checkout paths where Stripe creates a Checkout Session but `billing_checkout_sessions.stripe_session_id` cannot be stored.
- `/api/stripe/checkout` now logs the failed local attach, attempts to expire the unlinked Stripe Checkout Session, returns degraded `502`, and does not cache a successful idempotency response.
- Passed: `npx vitest run src/app/api/stripe/checkout/route.behavior.test.ts`, 5/5.
- Passed: `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`, 49/49.
- Passed: `npm run lint`; `npm run typecheck`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.
- Still open before launch: remote payment notification logging after `20260618193000_align_payment_notifications_billing.sql`, plus preview/production payment smoke.

2026-06-20 paid-webhook retry evidence:
- Added RED/GREEN coverage in `src/app/api/stripe/webhook/route.test.ts` proving paid checkout RPC errors and `success=false` billing-apply results return `500` after logging the webhook as `failed`.
- `/api/stripe/webhook` now lets Stripe retry failed paid checkout billing application instead of acknowledging those failure paths with `200`.
- Passed: `npx vitest run src/app/api/stripe/webhook/route.test.ts`, 26/26.
- Passed: `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`, 51/51.
- Passed: `git diff --check`; `npm run lint`; `npm run typecheck`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.
- Added verified SQL atomicity migration/test: `supabase/migrations/20260620010000_harden_billing_checkout_atomicity.sql` and `supabase/tests/billing-checkout-atomicity.test.sql`.
- Recovered Docker Desktop by posting Docker's own `Continue` action to the update-failed recovery pipe; `docker info --format '{{json .ServerVersion}}'` returned `29.4.1`.
- Passed: `npm run test:db:rls -- supabase/tests/billing-checkout-atomicity.test.sql`, 1 file / 2 tests.
- Passed: `npm run test:db:rls`, 2 files / 26 tests.
- Passed: `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`, 51/51.
- Passed: `npm run test:security:release-gate`; `git diff --check`; `npm run lint`.
- Still open before launch: remote payment notification logging after `20260618193000_align_payment_notifications_billing.sql`, plus preview/production payment smoke.

2026-06-20 local Stripe checkout creation preflight:
- Local Stripe env is test-mode; `stripe` CLI is not installed.
- An authenticated seller browser session called the real local `/api/stripe/checkout` endpoint for `private_listing_action` / `prolong_top`.
- The endpoint returned 200, Stripe created an unpaid payment-mode Checkout Session, and `billing_checkout_sessions` stored a matching `created` row for the seller ad/action.
- Cleanup passed: expired the test Stripe Checkout Session, matching `billing_checkout_sessions` rows remaining 0, matching `idempotency_keys` rows remaining 0, seller ad fixture restored, browser/page console errors 0.
- This unpaid creation preflight did not complete Step 2 below by itself. The later paid smoke covers payment/billing/ad side effects, and the later isolated current-webhook smoke covers payment confirmation email delivery. Preview/production payment smoke still needs deploy approval.
- `npx supabase migration list` still shows local-only payment/RLS migrations, including `20260618193000_align_payment_notifications_billing.sql`, `20260620010000_harden_billing_checkout_atomicity.sql`, and `20260618174500_harden_profile_dealer_public_reads.sql`; plain remote migration push remains unsafe from the dirty tree because unrelated taxonomy migrations are present. `npx supabase db push --dry-run` reports older local migrations before the last remote migration, while `npx supabase db push --dry-run --include-all` from the dirty tree would include unrelated `20260619214332_add_vehicle_taxonomy_metadata.sql`. Use `docs/launch-remote-migration-deploy-runbook.md` for the safe continuation path.
- Clean-worktree dry-run evidence: after the already-remote `20260619120000_add_vehicle_taxonomy_candidates.sql` migration history file was present locally, `npx supabase --workdir C:\Users\User\Desktop\Projects\autobazar123-launch-db db push --dry-run --include-all` listed exactly `20260618174500_harden_profile_dealer_public_reads.sql`, `20260618193000_align_payment_notifications_billing.sql`, and `20260620010000_harden_billing_checkout_atomicity.sql`.
- Current-commit migration preflight evidence: a fresh throwaway worktree at `C:\Users\User\Desktop\Projects\autobazar123-launch-preflight-20260620-01` on commit `7426f49` passed `npx supabase --workdir <verify-worktree> migration list` and `npx supabase --workdir <verify-worktree> db push --dry-run --include-all`; the dry-run listed only those same three launch-critical migrations and the throwaway worktree was removed. The persistent `autobazar123-launch-db` folder was later observed stale/dirty at detached commit `c978f5c`; after preserving the only unique test mock improvements, it was removed. Create a fresh clean worktree before deploy or remote DB push.
- Historical clean launch worktree local release evidence: `npm run easy:quick`, `npm run test:security:release-gate`, `npm run test:db:rls`, `npm run build`, `npm run check:launch-test-coverage -- --require-complete`, `npm run check:algolia-search`, and `npm audit --json` all passed from removed path `C:\Users\User\Desktop\Projects\autobazar123-launch-db`. The clean DB/RLS reset did not apply `20260619214332_add_vehicle_taxonomy_metadata.sql`. Treat this as historical evidence only.
- Launch migration guard evidence: `npm run check:launch-migration-worktree -- --root <clean-worktree>` now checks the chosen clean worktree before Supabase dry-runs or pushes. It fails on any dirty worktree entry, dirty `supabase/migrations`, missing launch-required migration files, or the unrelated taxonomy metadata migration unless explicitly overridden.
- Guard verification: `npm run test:launch-migration-worktree-script` passed 7/7; `npm run check:launch-migration-worktree -- --help` passed; running the guard in the current dirty main worktree failed as expected with dirty worktree state, dirty `supabase/migrations`, and the blocked taxonomy metadata migration; a fresh clean throwaway worktree passed the guard and was removed.

2026-06-20 paid Stripe completion smoke:
- Docker `stripe/stripe-cli` was used for local webhook forwarding because the `stripe` CLI is not installed.
- A real test-mode Checkout payment for seller `private_listing_action` / `prolong_top` completed with card `4242 4242 4242 4242` and redirected to local `/platba/uspech`.
- Verified before cleanup: `billing_checkout_sessions.status=paid`, 1 `billing_transactions` row with operation `prolong_top`, and listing action applied (`promotion_tier=top`, `is_top_ad=true`, `top_expires_at` present).
- Cleanup passed after runs: seller fixture ad restored, matching checkout/transaction/webhook/idempotency/payment-notification rows removed, no Stripe CLI container remained, and port 3000 was not left listening.
- Payment confirmation email job was not observed. The delivered `checkout.session.completed` event had customer email and billing metadata, but the stored webhook log came from the currently deployed/older webhook path and did not include the new local `payment_confirmation_email=...` audit marker. In the shared Stripe/Supabase test setup, the deployed webhook likely wins the duplicate-event race against local forwarding.
- Local hardening added: `/api/stripe/webhook` now falls back to looking up the created `billing_transactions.id` by `stripe_session_id` before queueing payment confirmation email when the billing RPC omits `transaction_id`; processed webhook logs include a non-PII payment-email decision marker.
- Passed: `npx vitest run src/app/api/stripe/webhook/route.test.ts`, 27/27.
- Passed: `npx vitest run src/app/api/billing/checkout-status/route.test.ts src/app/api/stripe/checkout/route.behavior.test.ts src/app/api/stripe/checkout/route.idempotency.test.ts src/app/api/stripe/checkout/route.rate-limit.test.ts src/app/api/stripe/webhook/route.test.ts src/lib/email/jobs.test.ts`, 52/52.
- Passed support checks: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:security:release-gate`, and `npm run build`; build generated 331 pages.
- Follow-up isolated current-webhook smoke passed on 2026-06-20: a locally signed `checkout.session.completed` event hit `http://localhost:3000/api/stripe/webhook`, returned 200, logged `payment_confirmation_email=queued`, sent `email_jobs.job_type=payment_confirmation` through Resend, wrote `email_deliveries.status=sent` with a provider message id, and Gmail received `Platba potvrdená` containing transaction `2585e6f4-877a-47c6-823e-c77cbdc408be`, `Predĺžiť Exclusive inzerát`, and `EUR 9.99`.
- The isolated smoke cleanup passed: 0 temporary checkout rows, billing transactions, webhook logs, and email jobs; 0 pending email jobs; touched ad restored exactly; evidence artifact `output/payment-email-smoke/payment-email-smoke-2026-06-20T09-18-06-237Z.json`.
- Still open before launch: remote `payment_notifications.billing_transaction_id` is missing, so payment notification logging failed during the smoke. Apply `20260618193000_align_payment_notifications_billing.sql` remotely through the launch migration runbook, recheck notification logging, then run preview/production payment smoke after deploy approval.

- [ ] **Step 2: Verify paid real Stripe test checkout completion**

Use Stripe test card `4242 4242 4242 4242` in preview, not production.

Flow:
1. Seller account creates a paid premium/top listing action.
2. Checkout redirects to Stripe.
3. Payment succeeds.
4. Stripe sends webhook to `/api/stripe/webhook`.
5. Billing checkout status becomes `paid`.
6. Billing transaction exists.
7. Listing action is applied.
8. Payment confirmation email job is queued and sent.

Expected: no manual DB update is needed.

Current status: steps 1-7 are verified locally in shared test mode; step 8 remains open.

- [ ] **Step 3: Verify failure/expired payment paths**

Use Stripe test failure card `4000 0000 0000 9995`.

Expected:
- Checkout session or payment intent becomes failed.
- App shows pending/failed state honestly.
- No listing enhancement is applied.
- Payment failure email job is queued and sent after Task 2.

---

### Task 7: Fix SEO, Canonical Domain, And Indexing Gate

**Files:**
- Modify: `src/config/config.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/lib/seo/crawl-policy.ts`
- Modify: pSEO route generation files under `src/app/[brand]`, `src/app/[brand]/[model]`, `src/app/[brand]/[model]/[city]`
- Modify: locale copy in `src/i18n/messages/*.json`
- Test: `src/app/sitemap.test.ts`, `src/app/robots.test.ts`

2026-06-19 SEO scout evidence:
- Passed: `npm run test:seo-taxonomy`, 27/27.
- Passed: `npx vitest run src/lib/seo/inventory.test.ts`, 4/4.
- Passed: `npm run check:algolia-search`, 56 active Supabase ads and 56 Algolia records.
- Current sitemap has about 1389 URLs, including 1096 city pSEO URLs and 56 listing URLs.
- Still launch-blocking: indexing is disabled, the pSEO launch-gating/copy/canonical fixes are not deployed, and preview/production smoke has not run.
- Owner decisions needed: decide when to enable indexing and approve preview/production deployment and smoke checks.

- [x] **Step 1: Decide canonical host**

Decision required:
- Option A: canonical `https://www.autobazar123.sk`
- Option B: canonical `https://autobazar123.sk`

Current live behavior observed by SEO audit: apex redirects to `www`, while local canonicals/sitemap use apex. Pick one and make redirects, sitemap, canonical metadata, and `NEXT_PUBLIC_APP_URL` match.

2026-06-20 decision:
- Canonical host is `https://www.autobazar123.sk` because live `https://autobazar123.sk/` redirects to `https://www.autobazar123.sk/`.

- [x] **Step 2: Make canonical config consistent**

If choosing `www`, update config to:
```ts
siteOrigin: "https://www.autobazar123.sk"
```

Run:
```powershell
npm run typecheck
npm run build
```
Expected: pass.

2026-06-20 evidence:
- Updated `BRAND_URL` and `APP_URLS.siteOrigin` to `https://www.autobazar123.sk`.
- Updated canonical-output tests for sitemap, robots, and `llms.txt`.
- Updated local `.env.local` public `NEXT_PUBLIC_APP_URL` to `https://www.autobazar123.sk` without touching secrets.
- Updated Vercel Production and Preview `NEXT_PUBLIC_APP_URL` to `https://www.autobazar123.sk` after temporary env pulls showed Production had the old apex host plus a literal `\r\n` escape and Preview was blank.
- Verified by fresh temporary `vercel env pull` snapshots that Production and Preview both match `www` and no literal escape remains.
- Passed: `npx vitest run src/app/sitemap.test.ts src/app/robots.test.ts src/app/llms.txt/route.test.ts src/lib/auth/request-origin.test.ts src/lib/security/csrf.test.ts`, 5 files / 21 tests.
- Passed: `npm run lint`.
- Passed: `npm run typecheck`.
- Passed: `git diff --check`.
- Passed: `npm run build`, 331 generated pages.

- [x] **Step 3: Reduce thin pSEO pages before indexing**

Rule for launch:
- Brand pages: allow only brands with active ads.
- Model pages: allow only models with active ads.
- City pages: disable until at least 10 active ads for that brand/model/city or until dealer inventory exists.

Add tests in `src/app/sitemap.test.ts`:
```ts
it("does not include city pSEO pages when active inventory is below launch threshold", async () => {
  mockedGetPublicVehicleTaxonomy.mockResolvedValue({
    brands: [{ id: "brand-skoda", name: "Skoda", slug: "skoda", isPopular: true }],
    modelsByBrandId: {
      "brand-skoda": [{ id: "model-octavia", name: "Octavia", slug: "octavia", isPopular: true }],
    },
  });

  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  expect(urls).not.toContain("https://autobazar123.sk/skoda/octavia/bratislava");
});
```

Run:
```powershell
npx vitest run src/app/sitemap.test.ts
```
Expected first run: fail until sitemap generation is gated.

2026-06-20 evidence:
- RED checks first failed as expected for city sitemap inclusion below threshold, below-threshold city route index/render behavior, broad city static params, hardcoded search city links, model-page city links, and city-page sibling city links.
- Implemented launch rule: brand/model sitemap URLs are inventory-backed; city sitemap URLs require at least 10 active matching ads; below-threshold city routes return noindex metadata and 404; city static params keep one real taxonomy sample only because Next Cache Components rejects an empty `generateStaticParams`; internal hardcoded city pSEO links were removed.
- `npx vitest run src/app/sitemap.test.ts src/lib/seo/programmatic-taxonomy.test.ts src/lib/seo/inventory.test.ts 'src/app/(site)/[brand]/[model]/[city]/page.test.tsx' 'src/app/(site)/[brand]/[model]/page.test.tsx' 'src/app/(site)/vysledky/SearchSeoLinks.test.tsx'`: passed, 22/22.
- `npm run test:seo-taxonomy`: passed, 30/30.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `git diff --check`: passed.
- `npm run build`: passed, 331 generated pages.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:web-interface`: passed, 18/18.
- Still open in Task 7: indexing enablement, preview smoke, and production smoke.

- [x] **Step 4: Remove scale overclaims**

Search:
```powershell
rg -n "tisic|tisíc|stov|overen|verified|najvac|najväc" src docs
```

Replace public copy that implies broad marketplace scale or verified-dealer coverage when data still shows low real scale.

Run:
```powershell
npm run check:sk-diacritics
npm run check:i18n-contract
npm run check:i18n-diacritics
```
Expected: pass.

2026-06-20 evidence:
- Public scale/verification overclaims were removed from global metadata, pSEO brand/model/city pages, results metadata, dealer directory/profile metadata, homepage/top-banner/about locale copy, and About page stats.
- Actual dealer-verification feature labels remain where they reflect real `is_verified` state.
- Public-copy rescan found only internal key names, real verification-feature labels, or non-marketplace security/legal usage.
- Passed: `npm run check:sk-diacritics`.
- Passed: `npm run check:i18n-contract`.
- Passed: `npm run check:i18n-diacritics`.
- Passed: `npm run lint`.
- Passed: `npm run typecheck`.
- Passed: `git diff --check`.
- Passed: `npm run build`, 331 generated pages.
- Passed: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:web-interface`, 18/18.

2026-06-20 live SEO refresh after local canonical work:
- `seo.config.md` now matches the local source canonical decision: primary domain is `https://www.autobazar123.sk`, with site-wide crawler blocking documented as intentional until the launch gate is green.
- `node C:\Users\User\.codex\skills\seo-agent-audit\scripts\seo-audit.mjs --url https://www.autobazar123.sk --max-pages 15 --format markdown` crawled the live homepage and still reports the homepage canonical as `https://autobazar123.sk`, robots meta `noindex, nofollow`, and description length 173.
- `node C:\Users\User\.codex\skills\seo-agent-audit\scripts\deep-seo-audit.mjs --url https://www.autobazar123.sk --max-urls 40` crawled 40 live URLs, all status 200, with 53 Medium and 16 Low in-review findings dominated by apex canonical drift from fetched `www` URLs and expected prelaunch noindex/template notes.
- Compact live fetches verified apex redirects 307 to `www`, `www` still returns `X-Robots-Tag: noindex, nofollow, noarchive`, `/robots.txt` still disallows all crawlers, `/sitemap.xml` still has 1389 `<loc>` entries all on `autobazar123.sk`, and `/llms.txt` primary URLs still use apex.
- Fresh local SEO/GEO checks passed after the `seo.config.md` cleanup: `npx vitest run src/app/sitemap.test.ts src/app/robots.test.ts src/app/llms.txt/route.test.ts src/lib/seo/programmatic-taxonomy.test.ts src/lib/seo/inventory.test.ts 'src/app/(site)/[brand]/[model]/[city]/page.test.tsx' 'src/app/(site)/[brand]/[model]/page.test.tsx' 'src/app/(site)/vysledky/SearchSeoLinks.test.tsx'`, 8 files / 25 tests; `npm run test:seo-taxonomy`, 3 files / 30 tests.
- Interpretation: this is expected prelaunch blocking plus deployment drift. Before opening to search/dealer outreach, deploy local canonical/pSEO/copy fixes, enable indexing only after all launch gates pass, and verify `www` canonicals, sitemap hosts, robots, and `llms.txt` on preview then production.

2026-06-21 live/local SEO refresh:
- Read-only live probe confirmed the same current production posture: apex returns 307, `www` homepage returns 200 with `X-Robots-Tag: noindex, nofollow, noarchive`, HTML meta robots `noindex, nofollow`, and canonical `https://autobazar123.sk`; `/robots.txt` disallows all crawlers; `/sitemap.xml` has 1389 `<loc>` entries on apex host; `/llms.txt` primary URLs use apex; `/api/health` returns 200 healthy.
- Local support checks passed: `npm run test:seo-taxonomy`, 3 files / 30 tests; `npx vitest run src/app/sitemap.test.ts src/app/robots.test.ts src/app/llms.txt/route.test.ts`, 3 files / 9 tests.
- Interpretation unchanged: SEO launch is blocked until the local `www` canonical/pSEO/copy fixes are deployed and smoked, then indexing is enabled only after the broader launch gates pass.

- [ ] **Step 5: Enable indexing only after all launch gates pass**

Set in Vercel preview first:
```text
NEXT_PUBLIC_SITE_INDEXING_ENABLED=true
```

After preview is verified, deploy production and confirm:
```powershell
Invoke-WebRequest https://www.autobazar123.sk/robots.txt -UseBasicParsing
```
Expected:
```text
User-agent: *
Allow: /
```
And homepage must not include `noindex` in HTML or `X-Robots-Tag`.

---

### Task 8: Finish Search, Algolia, And Cron Reliability

**Files:**
- Modify: `src/app/api/cron/expire-ads/route.ts` if fallback telemetry is missing.
- Modify: `src/lib/fallbacks/registry.ts` if adding a governed fallback.
- Test: matching cron/unit tests.

- [x] **Step 1: Verify Algolia sync and search**

Run:
```powershell
npm run check:algolia-search
npm run test:algolia-search-script
```
Expected: Algolia records equal active Supabase ads.

2026-06-19 evidence:
- Passed: `npm run check:algolia-search`, 56 active Supabase ads and 56 Algolia records.
- Passed: `npm run test:algolia-search-script`.
- Passed supporting service checks: `npm run list:fallbacks`, `npx vitest run src/lib/env.test.ts src/lib/fallbacks/registry.test.ts`, and `npx vitest run src/lib/security/csp.test.ts src/utils/upload.test.ts`.
- `vercel.json` schedules four cron routes: `expire-ads`, `cleanup-sold`, `send-alerts`, and `process-email-jobs`.
- `process-email-jobs` uses the service role, Resend, and the fixed `claim_email_jobs` migration.
- Still open: approved preview/production cron smoke needs direct coverage because it can mutate data or send emails.

- [x] **Step 2: Verify cron routes locally**

Run with valid cron auth headers/env according to `src/lib/cron/route-helpers.ts`.

Routes:
```text
/api/cron/expire-ads
/api/cron/cleanup-sold
/api/cron/send-alerts
/api/cron/process-email-jobs
```

Expected: every route returns 200 for valid cron requests and 401/403 for invalid requests.

2026-06-19 scout findings:
- Fixed locally: `expire-ads` no longer reports success when expired-ad DB updates fail or Algolia stale-record cleanup fails.
- Fixed locally: `send-alerts` no longer reports success when saved-ad or saved-search email sends fail; it returns degraded `502` and leaves failed notifications unmarked.
- Fixed locally: `process-email-jobs` no longer reports success when queued email processing reports failed or requeued jobs; it returns degraded `502`.
- Fixed locally: Algolia cleanup fallback/telemetry for `expire-ads` is registered as `cron.expire_ads_algolia_cleanup_failed`.
- Covered locally: `cleanup-sold` cron auth rejection, successful old-sold-ad hide/cache revalidation, and DB update failure without cache revalidation.
- Covered locally: `src/lib/email/jobs.ts` direct processor tests prove DB state-update failures are no longer counted as handled.

2026-06-19 send-alerts evidence:
- Added `src/app/api/cron/send-alerts/route.test.ts`.
- RED/GREEN coverage proves saved-ad and saved-search email failures return degraded `502` responses with non-PII failure details.
- The tests also prove failed saved-ad and saved-search sends do not update notification state as sent.
- Passed supporting checks: `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`, 8/8; `npm run lint`; `npm run typecheck`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.

2026-06-19 process-email-jobs evidence:
- Added `src/app/api/cron/process-email-jobs/route.test.ts`.
- RED/GREEN coverage proves failed and requeued queued-email batches return degraded `502` instead of `ok: true`.
- Route coverage also proves cron auth rejection returns before processing jobs.
- Passed supporting checks: `npx vitest run src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`, 14/14; `npm run lint`; `npm run typecheck`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.

2026-06-19 email job processor evidence:
- Added `src/lib/email/jobs.test.ts`.
- RED/GREEN coverage proves a failed DB update while marking a sent email no longer counts as `sent`; it records a requeued processor failure instead.
- RED/GREEN coverage proves failure-state DB update errors reject instead of pretending the failed job was handled.
- Passed supporting checks: `npx vitest run src/lib/email/jobs.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`, 16/16; `npm run lint`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.

2026-06-20 email job idempotency evidence:
- Added `src/lib/email/transactional-email.test.ts`.
- RED/GREEN coverage proves queued jobs pass deterministic provider idempotency keys and the Resend fetch path sends `Idempotency-Key`.
- Implementation uses `email-job/{job_type}/{job_id}` for auth, moderation, payment confirmation, payment failure, and invoice queued sends.
- Passed supporting checks: `npx vitest run src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts`, 4/4; `npx vitest run src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts src/lib/email/react-email-templates.test.ts src/app/api/cron/process-email-jobs/route.test.ts`, 15/15; `git diff --check`; `npm run lint`; `npm run typecheck`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.
- Remaining caveat: Resend stores idempotency keys for 24 hours, so real provider smoke and operational monitoring are still needed before claiming live exactly-once behavior.

2026-06-20 cron auth and Vercel scheduler recheck:
- Added `src/lib/cron/route-helpers.test.ts`.
- Fixed stale `cleanup-sold` comment that said 6am while `vercel.json` schedules the route at 18:00 UTC; `vercel.json` is now the schedule source of truth.
- Official Vercel Cron docs rechecked: Vercel invokes cron paths with HTTP `GET` on production deployments only, schedules are UTC, and current limits allow 100 cron jobs per project on all plans with Hobby minimum frequency once per day. Current `vercel.json` has four daily jobs, so count/frequency is not the blocker.
- RED/GREEN coverage now proves `rejectWhenInvalidCronRequest` allows local dev without `CRON_SECRET`, fails closed in production when the secret is missing, rejects wrong/missing production auth, accepts Vercel `Authorization: Bearer <secret>`, and accepts manual `x-cron-secret`.
- Passed supporting checks: `npx vitest run src/lib/cron/route-helpers.test.ts src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts`, 6 files / 17 tests; `npm run list:fallbacks -- --json`, 9 registered fallbacks.
- Remaining risk at this point: Vercel does not retry failed cron invocations and may overlap runs. At this point in the historical audit, `process-email-jobs` used DB claim locks plus queued Resend idempotency keys, but `send-alerts` still sent saved-ad/search emails directly after reading rows. This is superseded by the later 2026-06-21 send-alerts conditional claim update below.

2026-06-20 direct send-alerts idempotency evidence:
- Added `src/lib/email/send-marketplace-alerts.test.ts` and extended `src/app/api/cron/send-alerts/route.test.ts`.
- RED check failed as expected: `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/lib/email/send-marketplace-alerts.test.ts` showed the route did not pass idempotency keys and the marketplace sender did not forward them to `sendEmail`.
- `send-alerts` now builds deterministic saved-ad alert keys from user id, ad id, previous/current price, and previous/current status. It builds saved-search alert keys from saved-search id, previous notification boundary, and newest listing timestamp. `send-marketplace-alerts` forwards those keys to `sendEmail`.
- GREEN check passed: `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/lib/email/send-marketplace-alerts.test.ts`, 2 files / 6 tests.
- Related cron/email check passed: `npx vitest run src/lib/email/send-marketplace-alerts.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/cron/route-helpers.test.ts src/lib/fallbacks/registry.test.ts src/lib/email/jobs.test.ts src/lib/email/transactional-email.test.ts src/lib/email/react-email-templates.test.ts`, 10 files / 34 tests.
- 2026-06-21 send-alerts overlap hardening: `send-alerts` now conditionally claims saved-ad and saved-search rows before provider send, skips rows already claimed by an overlapping cron invocation, and rolls the state back when provider delivery fails or the sender throws. Focused coverage passed: `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/lib/email/send-marketplace-alerts.test.ts`, 2 files / 10 tests. Release coverage passed: `npm run test:cron-email-release`, 10 files / 38 tests. Repo typecheck passed via `npm run typecheck`.
- Remaining risk after this improvement: actual scheduled cron only runs on production, Resend idempotency keys expire after 24 hours, and live provider/scheduler behavior still needs production smoke and log review before launch.

2026-06-19 cleanup-sold evidence:
- Added `src/app/api/cron/cleanup-sold/route.test.ts`.
- Coverage proves cron auth rejection returns before DB access.
- Coverage proves old sold ads are hidden and ad cache tags are revalidated after a successful DB update.
- Coverage proves DB update failure returns `500` and does not revalidate ad cache tags.
- Passed supporting checks: `npx vitest run src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`, 14/14; `npm run lint`; `npm run typecheck`.

- [x] **Step 3: Add telemetry if expire-ads Algolia cleanup can silently fail**

If `expire-ads` catches Algolia errors and continues, register a fallback in `src/lib/fallbacks/registry.ts`:
```ts
{
  key: "cron.expire_ads_algolia_cleanup_failed",
  category: "search",
  criticality: "critical",
  owner: "search",
  threshold: { count: 1, window: "15m" },
  reviewBy: "2026-06-30",
}
```

Run:
```powershell
npm run list:fallbacks
npm run lint
```
Expected: fallback registry includes the new entry and lint passes.

2026-06-19 evidence:
- Added `src/app/api/cron/expire-ads/route.test.ts`.
- Added governed fallback registry key `cron.expire_ads_algolia_cleanup_failed`.
- `expire-ads` now collects failure objects and returns a degraded non-success response for expired-ad DB update failure and Algolia cleanup failure instead of a success message.
- Passed RED/GREEN targeted test: `npx vitest run src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts`, 4/4.
- Passed supporting checks: `npx vitest run src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`, 6/6; `npm run list:fallbacks`, 9 entries; `npm run check:algolia-search`, 56 active ads / 56 records; `npm run lint`; `npm run typecheck`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.
- Still open: approved preview/production cron smoke.

---

### Task 9: Finish UI And Accessibility QA

**Files:**
- Modify: `src/app/(site)/moj-ucet/DashboardClient.tsx`
- Modify: `src/app/(site)/pridat-inzerat/AdWizardClient.tsx`
- Test: UI Playwright suites.

- [x] **Step 1: Fix duplicate `h1` on embedded add-listing wizard**

2026-06-19 result: no production UI change was needed. `AdWizardClient` already hides its own page heading when `embedded` is true, so the dashboard keeps the only visible/accessibility-tree `h1`.

Run:
```powershell
PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:a11y
```
Expected: no duplicate-main-heading or page-heading accessibility issue.

Evidence:
- Added `tests/release-gauntlet.test.ts` coverage for `/moj-ucet?tab=create`.
- Focused check passed: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --grep "dashboard create tab keeps a single page h1" --reporter=line`.
- Full release gauntlet passed: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`, 16/16.
- A11y gate passed through installed Chrome: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:a11y`, 63/63.
- `npm run lint` and `npm run typecheck` passed.

- [x] **Step 2: Run full UI gate**

Run:
```powershell
npm run test:web-interface
npm run test:a11y
npm run test:keyboard
npm run test:mobile-matrix
npm run test:ui-quality-gate
npm run audit:webapp
```
Expected: all pass.

2026-06-19 evidence:
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:web-interface`: passed 18/18.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:a11y`: passed 63/63.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:keyboard`: passed 9/9.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:mobile-matrix`: passed 42/42.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:ui-quality-gate`: passed, including 18/18 Playwright checks and 19/19 UI unit tests.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run audit:webapp`: passed 5/5 tests; 80 route/viewport checks, 0 failing routes, 0 console warnings/errors, 0 network failures, and 0 DevTools issues.

- [x] **Step 3: Capture launch screenshots**

Capture desktop and mobile screenshots for:
```text
/
/vysledky?q=octavia
/vysledky?bodyStyle=motorcycle
/auto/{real-active-ad}
/moj-ucet
/moj-ucet?tab=create
/upravit-inzerat/{ownedAdId}
/dealer
/platba/uspech?session_id={test-session}
```

Expected: no horizontal scroll, no overlapping text, no console errors, no failed network requests.

2026-06-20 evidence:
- Root cause fixed: `AuthContext` uses `.maybeSingle()` for `site_admins`, so a normal non-admin session no longer creates the zero-row Supabase `406` console/network warning.
- Root cause fixed: first-visible-row listing thumbnails on detail/account pages are now eager/high-priority where they can become LCP candidates, removing Next image LCP warnings from the screenshot set.
- Regression coverage passed after RED check: `npx vitest run src/context/AuthContext.test.tsx`, 1/1.
- Screenshot runner passed: `node output/playwright/launch-screenshots/capture-launch-screenshots.mjs`; report at `output/playwright/launch-screenshots/launch-screenshots-report.json`, screenshots at `output/playwright/launch-screenshots/screenshots/`.
- Routes captured on desktop and `mobile-pixel-7`: `/`, `/vysledky?q=octavia`, `/vysledky?bodyStyle=motorcycle`, a real active detail page, `/moj-ucet`, `/moj-ucet?tab=create`, seller-owned edit page, `/dealer`, and `/platba/uspech?session_id=cs_test_release_gauntlet`.
- Screenshot report: 18/18 routes, 0 failed statuses, 0 console messages, 0 page errors, 0 network failures, 0 horizontal-scroll issues, and 0 too-wide elements.
- Supporting checks passed: `npm run typecheck`; `npm run lint`; `npm run test:unit`, 104 files / 505 tests; `npm run test:security:release-gate`; `npm run build`, 331 pages.
- Supporting UI gates passed: web-interface 18/18; a11y/reflow 63/63; keyboard 9/9; mobile matrix 42/42; `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome TEST_URL=http://localhost:3000 npm run test:ui-quality-gate`.

---

### Task 10: Security, Secrets, And Supabase Live Verification

**Files:**
- Modify only if findings require code or migration changes.
- Docs: `docs/security-top-10-defaults.md`, `PROJECT_STATUS.md`

- [ ] **Step 1: Verify live anon cannot read sensitive profile/dealer data**

After migration is applied to preview:
```powershell
npm run test:db:rls
```

Then run:
```powershell
npm run check:live-rls-posture -- --json
```

The live anon Supabase query script must confirm:
```text
profiles.email is not readable
profiles.phone is not readable
profiles.credit_balance is not readable
dealers raw table is not anonymously readable
```

Expected: anon gets denied or receives no sensitive columns.

2026-06-20 evidence:
- Local `npm run test:db:rls` passed 2 files / 26 tests.
- `npm run test:live-rls-posture-script` passed 4/4 for denied/empty, leaked-row, probe-runner-error, and unexpected PostgREST/schema-error classification without carrying row values.
- `npm run check:live-rls-posture -- --help` passed and documents the no-row-value contract.
- Live anon Supabase probe failed as expected before remote migration: `npm run check:live-rls-posture -- --json` returned `ok=false`, 4 leaked probes, 0 probe errors, and 1 anon-readable row each for `profiles.email`, `profiles.phone`, `profiles.credit_balance`, and raw `dealers`. The probe did not print row values.
- Supporting checks passed after adding the reusable probe: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm run test:unit` 116 files / 537 tests, and `npm run test:security:release-gate`.
- `npx supabase migration list` shows `20260618174500_harden_profile_dealer_public_reads.sql` is local-only on remote.
- Plain `supabase db push` is unsafe from the current dirty worktree because unrelated local-only taxonomy migrations are also present; use `docs/launch-remote-migration-deploy-runbook.md` to isolate the launch-critical migrations.
- Clean-worktree `db push --dry-run --include-all` now proves only the three launch-critical migrations would be pushed when the already-remote `20260619120000_add_vehicle_taxonomy_candidates.sql` migration history file is present locally.
- Compatibility code is prepared locally: `/auto/[id]` now uses `src/lib/cars/public-car-detail.ts` instead of an anon raw `profiles` join.
- Passed focused test: `npx vitest run src/lib/cars/public-car-detail.test.ts`, 2/2.
- Passed support checks: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build`; unit tests passed 105 files / 507 tests and build generated 331 pages.
- Step remains open until compatible code is deployed, the remote RLS migration is safely applied without unrelated migrations, and `npm run check:live-rls-posture -- --json` passes.

- [ ] **Step 2: Rotate old maintenance secret if still valid**

The audit found historical migration text containing old maintenance password material. Confirm the production maintenance bypass secret is not the historical value and rotate it if uncertain.

Expected: old value cannot unlock maintenance; new signed-token flow still works.

2026-06-20 evidence:
- RED: `npx vitest run src/app/api/maintenance/unlock/route.test.ts` failed because legacy `MAINTENANCE_PASSWORD` still unlocked maintenance.
- Fix: `src/app/api/maintenance/unlock/route.ts` now accepts only `MAINTENANCE_UNLOCK_PASSWORD`; the test fixture no longer uses the historical leaked value.
- GREEN: `npx vitest run src/app/api/maintenance/unlock/route.test.ts` passed 6/6.
- `rg` found no remaining historical leaked maintenance password string in source/docs/migrations/package files.
- Safe Vercel Production and Preview env pulls showed the historical leaked value and legacy alias are not configured.
- Later metadata-only env-list checks showed `MAINTENANCE_UNLOCK_PASSWORD` and `MAINTENANCE_BYPASS_SECRET` exist by name in both targets; temp env files were deleted. Sensitive values still require deploy/runtime smoke.
- Passed support checks: `npx vitest run src/lib/security/maintenance-bypass.test.ts src/app/api/maintenance/unlock/route.test.ts src/proxy.test.ts`, 32/32; `git diff --check`; `npm run lint`; `npm run typecheck`; `npm run test:unit`, 105 files / 508 tests; `npm run test:security:release-gate`; `npm run build`, 331 pages.
- Step remains open until deploy/runtime smoke proves the signed-token flow works.

- [x] **Step 3: Clean local secret backup files after confirming they are ignored**

Run:
```powershell
git status --ignored --short .env.local .env.local.bak-20260322-221455 .vercel
```
Expected: secret files are ignored and not staged. Remove stale backup files only after confirming there is no needed unique value in them.

2026-06-20 evidence:
- `git status --ignored --short .env.local .env.local.bak-20260322-221455 .vercel` confirmed `.env.local`, `.env.local.bak-20260322-221455`, and `.vercel/` were ignored before cleanup.
- Secret-safe comparison showed `.env.local.bak-20260322-221455` had 0 backup-only keys; current `.env.local` had 6 newer role-specific E2E keys; values were not printed.
- Removed only `.env.local.bak-20260322-221455`.
- Recheck confirmed `.env.local` and `.vercel/` remain ignored, and `.env.local.bak-20260322-221455` is missing.

---

### Task 11: Preview And Production Release Gate

**Files:**
- Docs: `PROJECT_STATUS.md`, `docs/launch-checklist.md`

- [x] **Step 1: Run local release gate**

Run:
```powershell
npm run easy:quick
npm run test:security:release-gate
npm run test:db:rls
npm run build
npm run check:launch-test-coverage
npm run check:algolia-search
npm audit --json
```
Expected:
- All commands pass.
- Launch coverage is complete.
- npm audit total is 0.

Result 2026-06-20:
- Passed: `npm run easy:quick`; lint/text/i18n/theme checks, `npx tsc --noEmit`, and unit tests passed, 105 files / 508 tests.
- Passed: `npm run test:security:release-gate`.
- Passed: `npm run test:db:rls`, 2 files / 26 tests. Note: local reset applied current untracked taxonomy migrations because they exist in `supabase/migrations`; do not push remote DB migrations blindly from this dirty tree.
- Passed: `npm run build`, Next 16.2.9, 331 pages generated.
- Passed: `npm run check:launch-test-coverage -- --require-complete`; complete launch account coverage is yes.
- Passed: `npm run check:algolia-search`; 56 active Supabase ads, 56 searchable Algolia records, 5 sample hits.
- Passed: `npm audit --json`; total vulnerabilities 0 across 1069 dependencies.
- Still open: Vercel env/build preflight, preview deploy, preview smoke, production deploy, and production smoke.
- 2026-06-20 continuation evidence: commit `99efd14` hardens env normalization for copied literal line endings; `npx vitest run src/lib/env.test.ts src/lib/supabase/anon.test.ts`, `git diff --check`, `npm run lint`, and `npm run typecheck` passed. Safe Vercel public env repairs removed literal `\r\n` from Preview `NEXT_PUBLIC_SUPABASE_URL`, Preview `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Preview `NEXT_PUBLIC_APP_URL`, and Production `NEXT_PUBLIC_APP_URL`.
- 2026-06-20 continuation evidence: Vercel server envs were re-added from local source values without printing secrets. Preview received cron, Cloudflare, Algolia admin/sync, Stripe test, Supabase service role, Resend, email, and maintenance values. Production received non-payment service/email/maintenance values only; local Stripe is test-mode, so Production Stripe was not copied. Later and fresh `npx vercel env ls preview` / `npx vercel env ls production` checks show the expected env names exist in both targets, including Upstash and Stripe names. Fresh `vercel env run` present/missing probes still show sensitive values are not available to local CLI commands; sensitive values still need cloud smoke or provider/dashboard confirmation.
- 2026-06-20 continuation evidence: taxonomy discovery lane audit passed `npx vitest run src/lib/vehicle-taxonomy/candidates.test.ts src/lib/vehicle-taxonomy/autobazar-eu.test.ts src/lib/vehicle-taxonomy/mobile-de.test.ts src/lib/vehicle-taxonomy/otomoto.test.ts`, `git diff --check`, `npm run typecheck`, and `npm run lint`. `npx supabase migration list` still shows `20260619214332_add_vehicle_taxonomy_metadata.sql` as local-only; dirty-tree `db push --dry-run --include-all` could not complete without `SUPABASE_DB_PASSWORD`.
- 2026-06-20 continuation evidence: explicit unfinished-marker scan found no matches in source/scripts/tests/docs for `TODO`, `FIXME`, `XXX`, `HACK`, `workaround`, or obvious `not implemented` markers.
- 2026-06-20 Vercel build preflight evidence: focused tests passed for the public dealer pages and pricing/taxonomy API routes after adding `connection()` request boundaries. Support checks passed: `git diff --check`, `npm run typecheck`, `npm run lint`, and `npm run build`; final local Next build generated 330 pages.
- 2026-06-20 Vercel build blocker: `npx vercel build --target=preview --yes` and `npx vercel@54.14.2 build --target=preview --yes` still failed on `/audi/a1` with `Unable to find lambda for route`. Diagnosis matches an open Vercel/Next 16 Cache Components static-PPR builder issue. Do not mark Task 11 Step 2 ready or force pSEO routes dynamic without an owner decision.
- 2026-06-20 fresh recheck: throwaway worktree `autobazar123-vercel-preflight-292bcd4` at commit `292bcd4` reproduced the same failure with latest npm `vercel@54.14.2`; npm dist-tags showed no newer `latest` CLI and an older `canary`.
- 2026-06-20 fresh current-worktree recheck: `npm view vercel dist-tags --json`, `npm view next dist-tags --json`, and `npm view react dist-tags --json` showed no newer stable versions to try (`vercel latest=54.14.2`, `next latest=16.2.9`, `react latest=19.2.7`). `npx vercel@54.14.2 build --target=preview --yes` reproduced the same failure after its internal Next build passed and generated 330 pages; Vercel packaging errored at that time with `Unable to find lambda for route: /audi/a1`.
- 2026-06-20 Vercel diagnostic detail: `.vercel/output/builds.json` labels the error `NEXT_MISSING_LAMBDA`, `.vercel/output/config.json` contains 0 routes, and no completed functions output was produced.
- 2026-06-20 upstream primary-source match: https://github.com/vercel/vercel/issues/16364 documents the same Next 16 Cache Components static-PPR `routesManifest.ppr.chain.headers` missing-lambda failure. Next's PPR platform guide confirms `PARTIALLY_STATIC` routes and `pprChain.headers` with `next-resume` are expected PPR artifacts; the Cache Components migration docs say route segment configs like `dynamic` are replaced. The issue lists `dynamic = 'force-dynamic'` as a workaround, but for Autobazar123 pSEO this is an SEO/performance tradeoff and requires explicit owner approval plus fresh verification before implementation.
- 2026-06-20 diagnostic guard added: `npm run check:vercel-ppr-lambda-blocker` checks local `.next` artifacts for the known static-PPR lambda lookup failure shape. Current expected-blocked run reports `/audi/a1` as `PARTIALLY_STATIC`, `pprChainHeaders={"next-resume":"1"}`, route HTML/meta present, source page JS present, 256 partially-static routes, and 207 `/[brand]/[model]` routes. `npm run test:vercel-ppr-lambda-blocker-script` passed 5/5; `npm run check:vercel-ppr-lambda-blocker -- --expect-blocked` passed. Use the default checker mode after future Vercel/Next updates; it should be `OK` before treating Preview packaging as ready unless the owner approves an SEO rendering tradeoff.
- 2026-06-20 lightweight blocker refresh after the Supabase dry-run recheck: npm dist-tags remain unchanged (`vercel latest=54.14.2`, `next latest=16.2.9`, `react latest=19.2.7`), `npm run test:vercel-ppr-lambda-blocker-script` passed 5/5, and `npm run check:vercel-ppr-lambda-blocker -- --expect-blocked` still reports the same `/audi/a1` static-PPR blocker signature. No full Vercel build was rerun because there is no newer stable package to test and the diagnostic remains blocked.
- 2026-06-21 package-tag recheck found `vercel latest=54.14.5`, `next latest=16.2.9`, and `react latest=19.2.7`. `npx vercel@54.14.5 build --target=preview --yes` still failed at that time at Vercel packaging with `Unable to find lambda for route: /audi/a1` after the embedded Next build passed and generated 330 pages.
- 2026-06-21 diagnostic hardening: `npm run check:vercel-ppr-lambda-blocker` now blocks on any partially-static route with `next-resume`, not only the sampled `/audi/a1` route. `npm run test:vercel-ppr-lambda-blocker-script` passed 6/6.
- 2026-06-21 stability recheck: `npm view vercel dist-tags --json`, `npm view next dist-tags --json`, and `npm view react dist-tags --json` found stable tags unchanged (`vercel latest=54.14.5`, `next latest=16.2.9`, `react latest=19.2.7`). Next preview/canary and React canary tags exist but are not launch-stable candidates, so no full Vercel build was rerun. `npm run test:vercel-ppr-lambda-blocker-script` passed 6/6 and `npm run check:vercel-ppr-lambda-blocker -- --expect-blocked` reported at that time 256 partially-static routes with `next-resume`, including 207 brand/model routes, with `/audi/a1` still `PARTIALLY_STATIC`.
- 2026-06-21 Vercel packaging remediation supersedes the expected-blocked PPR status: global Cache Components/PPR is off in `next.config.ts`, featured-cars caching moved to `unstable_cache`, the anonymous Supabase client no longer injects a custom Next fetch wrapper, sitemap pSEO URLs now come from active ad rows joined to canonical brand/model slugs without a second build-time taxonomy fetch, and `.vercel/**` is ignored by ESLint as generated output. Verification passed: focused sitemap/taxonomy/anon tests 14/14, `npm run test:seo-taxonomy` 31/31, `npm run typecheck`, `npm run lint`, guarded `npm run build` with 302 pages and no `Sitemap: failed` log, `npm run test:vercel-ppr-lambda-blocker-script` 6/6, `npm run check:vercel-ppr-lambda-blocker` OK with 0 partially-static routes, and `npx vercel@54.14.5 build --target=preview --yes` completed successfully. `npm run check:vercel-build-preview` now wraps that pinned Vercel CLI preflight.
- Fresh 2026-06-21 continuation Vercel preflight verification: `npm run check:vercel-build-preview` exited 0, generated 302 pages, created `.vercel\output`, and reported `Build completed successfully` for target `preview`. A follow-up `npm run check:vercel-ppr-lambda-blocker` returned OK with 0 partially-static routes and empty PPR chain headers.
- 2026-06-20 current-commit clean launch migration dry-run refreshed: detached throwaway worktree `C:\Users\User\Desktop\Projects\autobazar123-launch-db-current` at commit `b3f3cbb` passed `npm run check:launch-migration-worktree -- --root <throwaway-worktree>`, `npx supabase migration list`, and `npx supabase db push --dry-run --include-all`. The dry-run listed only `20260618174500_harden_profile_dealer_public_reads.sql`, `20260618193000_align_payment_notifications_billing.sql`, and `20260620010000_harden_billing_checkout_atomicity.sql`; the blocked `20260619214332_add_vehicle_taxonomy_metadata.sql` was absent. No remote migration was applied.
- 2026-06-20 post-webhook-cleanup dry-run recheck: Supabase CLI `2.107.0` still exposes no migration-file selection flag. A fresh detached throwaway worktree `C:\Users\User\Desktop\Projects\autobazar123-launch-dryrun-20260620-190614` at commit `b3f3cbb` passed `npm run check:launch-migration-worktree -- --root <throwaway-worktree>`, `npx supabase --workdir <throwaway-worktree> migration list`, and `npx supabase --workdir <throwaway-worktree> db push --dry-run --include-all`. The dry-run again listed only the three launch-critical migrations, no remote migration was applied, and the throwaway worktree was removed.
- 2026-06-21 clean launch migration dry-run refreshed again: detached throwaway worktree `C:\Users\User\Desktop\Projects\autobazar123-launch-dryrun-20260621-044234` at commit `b3f3cbb` passed `npm run check:launch-migration-worktree -- --root <throwaway-worktree>`, was linked to the existing Supabase project ref, and `npx supabase --workdir <throwaway-worktree> db push --dry-run --include-all` listed only `20260618174500_harden_profile_dealer_public_reads.sql`, `20260618193000_align_payment_notifications_billing.sql`, and `20260620010000_harden_billing_checkout_atomicity.sql`; no remote migration was applied. The throwaway worktree was removed and `git worktree list --porcelain` again shows only the main repo.
- 2026-06-21 Supabase CLI capability recheck: `npx supabase --version` reports `2.107.0`; `npx supabase db push --help` still exposes no per-migration-file selection flag; and the Supabase changelog scan for CLI/migration/db-push changes found no relevant stable capability. Keep the clean launch worktree/runbook path for any future remote dry-run or push.
- 2026-06-21 Vercel/Supabase blocker refresh support checks: `npm run test:vercel-ppr-lambda-blocker-script` passed 6/6, `npm run check:vercel-ppr-lambda-blocker -- --expect-blocked` passed expected-blocked, `npm run test:launch-migration-worktree-script` passed 7/7, `git diff --check` passed, and `npm run dev:status` reported no local Next dev server running.
- 2026-06-21 launch blocker aggregate update: `npm run check:launch-blockers` now includes package-referenced script file tracking, tracked/untracked cleanup/refactor scan, `git diff --check`, security, dependency, payment, cron/email, fallback, SEO/GEO, local smoke, image upload release suite, performance budget, lint, typecheck, build, production bundle budget, Vercel env metadata names, Vercel Upstash value/sensitive metadata, and Vercel static-PPR packaging. That run was still `BLOCKED` on package-referenced local files untracked by git, live Supabase anon RLS, and current-tree migration safety. Upload release coverage, local performance, local Vercel Upstash env metadata/pull checks, local lint/typecheck/build, and local Vercel static-PPR packaging were green. This package-file blocker is superseded by the later package-scope cleanup below.
- 2026-06-21 full launch blocker rollup update: `npm run check:launch-blockers:full` now runs the same rollup plus the pinned Vercel Preview local build preflight lane. Targeted checker coverage passed 13/13 after package-script tracking and upload-lane hardening. Earlier full rollup still exited 1, but package-referenced script tracking passed with 102 local file paths scanned, cleanup/refactor scan passed with 574 launch-code files scanned, upload release suite passed 3 files / 17 tests, and the Vercel Preview local build preflight passed inside the rollup; only live Supabase anon RLS and current-tree migration safety remained blockers. No deploy, push, email send, or remote DB write was run.
- 2026-06-21 local launch smoke/lint/build update: `tests/smoke-test.ts` now verifies `/api/health`, `/`, `/vysledky`, `/auth/login`, `/site-map`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/platba/uspech?session_id=cs_test_release_gauntlet`, and one real `/auto/...` URL discovered from `/sitemap.xml`. The first real run failed because `/llms.txt` returned 500 due to a duplicate `public/llms.txt` file conflicting with `src/app/llms.txt/route.ts`; the stale public file was removed, the route test now guards against the conflict, `TEST_URL=http://localhost:3000 npm run test:smoke` passed 10/10, and fresh `npm run build` passed with `/llms.txt` emitted as a static route. Supporting checks passed: `npx tsx --test scripts/check-local-launch-smoke-core.test.ts`, 4/4, `npx vitest run src/app/llms.txt/route.test.ts`, 2/2, `npm run test:local-launch-smoke-script`, 4/4, `npm run test:launch-blockers-script`, 10/10, and the local lint/typecheck/build lanes in `npm run check:launch-blockers`. This is local evidence only; preview/production smoke remains open.
- 2026-06-21 early performance rollup verification, superseded later same day: the early browser audit was development-mode and correctly failed the launch budget gate. Keep that as historical context only; use the later production-mode performance refresh below for current status.
- 2026-06-21 later performance refresh supersedes the earlier local performance blocker: a secret-safe local production-mode `next start` audit was run with a temporary process env from an old local backup, without printing or writing secrets. The first run found a real CSP `unsafe-eval` issue from Zod browser JIT; `src/app/layout.tsx` now sets Zod `jitless` mode before hydration without weakening CSP. `tests/webapp-audit.ts` now scopes synthetic per-route/per-viewport `x-forwarded-for` headers to local app requests only so the audit does not exhaust one rate-limit bucket or send that header to Algolia. Final production-mode audit passed: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=true TEST_URL=http://localhost:3000 WEBAPP_AUDIT_MODE=production npx playwright test tests/webapp-audit.ts --project=desktop-chromium --reporter=line`, 6/6 tests, 80/80 route/viewport checks, 0 failing routes, and 0 DevTools issues. `npm run check:performance-budgets` passed with p95 JS transfer `2258037`, p95 main-thread work `363.1`, and p95 DOMContentLoaded `691.65`. At that time, after the Vercel packaging remediation, `npm run check:launch-blockers` was blocked on two lanes: live Supabase anon RLS and current-tree migration safety.
- 2026-06-21 continuation blocker refresh: `npm run check:live-rls-posture -- --json` still returned `ok=false` with 4 leaked probes (`profiles.email`, `profiles.phone`, `profiles.credit_balance`, and raw `dealers`), 0 probe errors, and 1 anon-readable row for each check. `npm run test:launch-migration-worktree-script` passed 7/7. `npm run check:launch-migration-worktree` failed as expected in the dirty main worktree because `20260619214332_add_vehicle_taxonomy_metadata.sql` is present and the worktree has uncommitted launch-hardening changes. `git worktree list --porcelain` still shows only the main repo.
- 2026-06-21 continuation runbook/ignored-script/upload cleanup: `.gitignore` now unignores package-referenced release scripts, i18n script tests, dev-server/reset helpers, Chrome console quick-check scripts, and the JATO import script that were previously silently ignored. The launch blocker rollup now has RED/GREEN-tested package-script tracking so missing or gitignored package-referenced local files become a blocker automatically. The i18n locale diacritics checker now explicitly supports same-word manual dictionary suppressions such as `chyba -> chyba`. `/api/images/upload-url` now has route-level coverage for CSRF, auth, config, rate-limit, provider rejection, and thrown-provider-error paths; thrown Cloudflare/provider errors now return a generic response and avoid logging the raw token-bearing error. Passed after the cleanup: `npm run test:uploads-release` 3 files / 17 tests, `npm run test:vercel-env-names-script` 7/7, `npm run test:vercel-env-values-script` 12/12, `npm run test:production-bundle-budget-script` 7/7, `npm run test:launch-blockers-script` 13/13, `npm run test:i18n-contract-script` 4/4, `npm run test:i18n-diacritics-script` 8/8, `npm run check:i18n-diacritics`, `npm run check:i18n-contract`, `npm run check:text-encoding`, `npm run lint`, and `git diff --check` with only the existing `eslint.config.mjs` CRLF warning. Earlier `npm run check:launch-blockers:full` before untracked package-file blocking still blocked only on live Supabase anon RLS and current-tree migration safety, scanning 102 package-referenced local file paths and 574 tracked/untracked launch-code files.
- 2026-06-21 additional upload malformed-response hardening: a new route regression first failed because a Cloudflare `success: true` payload missing `uploadURL` returned HTTP 200. `/api/images/upload-url` now validates both `uploadURL` and `id` before returning success and otherwise returns the generic upload failure. Passed after the fix: `npx vitest run src/app/api/images/upload-url/route.test.ts` 8/8, `npm run test:uploads-release` 3 files / 18 tests, `npm run test:launch-blockers-script` 13/13, and `git diff --check` with the existing `eslint.config.mjs` CRLF warning. No deploy, push, email send, or remote DB write was run.
- 2026-06-21 fresh rollup after package-file hardening, superseded by later package-scope cleanup: `npm run check:launch-blockers` exited 1 on three blocker lanes at that time: package-referenced local files untracked by git, live Supabase anon RLS, and current-tree migration safety. Passing lanes included branch/worktree cleanup, cleanup/refactor scan with 574 launch-code files, diff check, launch account/data coverage, security gate, dependency audit, payment suite 6 files / 52 tests, cron/email suite 10 files / 34 tests, fallback registry, Algolia/Supabase 56/56 parity, SEO/GEO 3 files / 31 tests, local smoke target coverage 4/4, image upload suite 3 files / 18 tests, performance budget, lint, typecheck, production build, production bundle budget, Vercel env names/values, and Vercel static-PPR packaging. No deploy, push, email send, or remote DB write was run.
- 2026-06-21 fresh clean migration dry-run after full rollup: Supabase CLI remained `2.107.0`, and `npx supabase db push --help` still exposes `--dry-run`/`--include-all` but no per-file migration selector. Detached throwaway worktree `C:\Users\User\Desktop\Projects\autobazar123-launch-dryrun-20260621-084803` at `b3f3cbb` passed `npm run check:launch-migration-worktree -- --root <throwaway-worktree>`. After linking only that throwaway worktree to the existing project ref, `npx supabase --workdir <throwaway-worktree> migration list` showed exactly `20260618174500_harden_profile_dealer_public_reads.sql`, `20260618193000_align_payment_notifications_billing.sql`, and `20260620010000_harden_billing_checkout_atomicity.sql` as local-only, and `npx supabase --workdir <throwaway-worktree> db push --dry-run --include-all` would push only those three migrations. No remote migration was applied. The throwaway worktree was removed after path verification, and `git worktree list --porcelain` again shows only the main repo.
- 2026-06-21 corrected remote order: `docs/launch-remote-migration-deploy-runbook.md` now states Preview smoke alone is not enough before remote RLS hardening because the RLS migration affects the shared remote database. The safe path is local gates, clean worktree dry-run, Preview deploy/smoke, Production compatible-code deploy/smoke while indexing stays disabled, then `npx supabase --workdir <clean-worktree> db push --include-all` for the three launch-critical migrations only, followed by live RLS, payment notification logging SQL, and Preview/Production smoke.
- 2026-06-21 owner approval packet added to the same runbook: ask separately before Preview deploy, Production compatible-code deploy with indexing disabled, exact remote Supabase migration apply, and public SEO indexing. Each approval has a command, stop condition, and evidence to record.
- 2026-06-21 earlier short blocker rollup recheck after package-scope cleanup and send-alerts overlap hardening: approved launch-support package-referenced files were reviewed/staged, and deferred taxonomy/provider package shortcuts were removed from `package.json` until explicitly approved as a separate lane. A subsequent checker correction fixed adjacent-path detection so package-script tracking no longer skips neighboring paths such as `src/lib/cron/route-helpers.test.ts`; the cron helper test is staged and covered. `send-alerts` now conditionally claims saved-ad/search rows before provider send, skips rows already claimed by overlapping cron invocations, and rolls state back on provider failure or thrown sender errors. That run of `npm run check:launch-blockers` exited 1 only on live Supabase anon RLS and current-tree launch migration safety, before deploy-source readiness became an executable blocker. Passing lanes included branch/worktree cleanup, package-script tracking with 109 local file paths, cleanup/refactor scan with 574 launch-code files, payments 6 files / 52 tests, cron/email 10 files / 38 tests, SEO/GEO 3 files / 31 tests, uploads 3 files / 18 tests, performance, lint, typecheck, production build, production bundle budget, Vercel env names/values, and static-PPR packaging. No deploy, push, email send, or remote DB write was run.
- 2026-06-21 earlier full predeploy blocker rollup recheck after thrown-sender cron rollback hardening and JATO importer write guard: `npm run check:launch-blockers:full` exited 1 only on live Supabase anon RLS and current-tree launch migration safety before deploy-source readiness was integrated. The full-only Vercel Preview local build preflight lane passed via `npm run check:vercel-build-preview` with `vercel@54.14.5` and detected Next.js `16.2.9`. No preview deployment, push, email send, or remote DB write was run.
- 2026-06-21 earlier short blocker rollup continuation after the owner approval packet: `npm run check:launch-blockers` exited 1 only on live Supabase anon RLS and current-tree launch migration safety before deploy-source readiness was integrated. This result is superseded for current deploy-source safety by the newer checker entry below.
- 2026-06-21 earlier full predeploy blocker rollup continuation: `npm run check:launch-blockers:full` exited 1 only on live Supabase anon RLS and current-tree launch migration safety before deploy-source readiness was integrated. Rerun the full rollup from the chosen reviewed deploy source before Preview approval.
- 2026-06-21 deploy-source guard: before any Preview deploy, the operator must confirm whether the reviewed launch source is a clean commit/branch/worktree or an explicitly owner-approved dirty-tree deploy. Do not assume current committed `master` contains all uncommitted launch-hardening work.
- 2026-06-21 deploy-source preflight: root `.vercelignore` now excludes Supabase DB artifacts, deferred taxonomy/provider operator scripts, deferred taxonomy helper source files, and local test/report output from Vercel source upload. Vercel CLI source deploys from the project root/source path and uploads project files unless default-excluded or `.vercelignore`-excluded. Current `master` is `ahead 63`; after staging launch-approved support files, the dirty main worktree has 63 staged files, 1 unstaged file, and 19 untracked non-ignored files, including deferred taxonomy scripts/helpers and `supabase/migrations/20260619214332_add_vehicle_taxonomy_metadata.sql`. A plain deploy from the dirty main worktree is not a clean reviewed-source deploy; prefer a clean reviewed branch/commit/worktree before Preview approval unless the owner explicitly accepts dirty current-worktree source upload risk.
- 2026-06-21 deploy-source readiness checker integration: `scripts/check-deploy-source-readiness.mjs` now makes deploy-source ambiguity and missing `.vercelignore` launch-risk exclusions executable blockers. `npm run test:deploy-source-readiness-script` passed 4/4, `npm run test:launch-blockers-script` passed 16/16 after adding explicit `--allow-extra-worktrees` support for a clean review-source worktree, including detached review-source commits and `codex/launch-reviewed-source-*` branches, and `npm run check:deploy-source-readiness` blocks the current main worktree with `master` ahead of `origin/master` by 63, 63 staged files, 1 unstaged file, 19 untracked non-ignored files, and deferred taxonomy source present. Latest `npm run check:launch-blockers -- --allow-extra-worktrees` exits 1 on three lanes: deploy-source readiness, live Supabase anon RLS, and current-tree migration safety. Passing lanes include branch/worktree cleanup with explicit review-worktree mode, package-script tracking with 111 local paths, cleanup/refactor scan with 576 files, payments 6 files / 52 tests, cron/email 10 files / 38 tests, SEO/GEO 3 files / 31 tests, uploads 3 files / 18 tests, performance, lint, typecheck, production build, production bundle budget, Vercel env checks, and static-PPR packaging. No deploy, push, email send, payment action, or remote DB write was run. Next safe step is a clean reviewed deploy source, then rerun `npm run check:deploy-source-readiness` and `npm run check:launch-blockers:full -- --allow-extra-worktrees` from that exact source if it is an extra git worktree alongside the main repo.
- 2026-06-21 reviewed deploy source created and verified: clean detached worktree `C:\Users\User\Desktop\Projects\ab123-rs-153336` at commit `d38f2f3a5e27164ac759bcbe1e8a9fb6d36e7c6d` passes `npm run check:deploy-source-readiness` with 0 staged, 0 unstaged, and 0 untracked files. Direct checks confirm the deferred taxonomy/provider scripts/helpers and `supabase/migrations/20260619214332_add_vehicle_taxonomy_metadata.sql` are absent. A production-mode Chrome audit passed 6/6 tests with 80/80 route/viewport checks, 0 failing routes, and 0 DevTools issues; `npm run check:performance-budgets` passed with p95 JS transfer `1639621`, p95 main-thread work `306.2`, and p95 DOMContentLoaded `545.25`. `npm run test:launch-blockers-script` passed 18/18 after a RED/GREEN parser fix for Git's linked-worktree `+ master` marker. `npm run check:launch-blockers:full -- --allow-extra-worktrees` from the reviewed source exits 1 only on live Supabase anon RLS; branch/worktree cleanup, deploy-source readiness, package tracking, cleanup scan, diff check, launch account/data coverage, security, dependency audit, payments, cron/email, fallbacks, Algolia parity, SEO/GEO, local smoke coverage, uploads, performance, lint, typecheck, production build, bundle budget, Vercel env checks, static-PPR packaging, Vercel Preview build preflight, and launch migration worktree safety all pass. No deploy, push, email send, payment action, or remote DB write was run. Next safe step is explicit owner approval for Preview deploy from this exact reviewed source.
- 2026-06-21 reviewed-source Supabase dry-run refreshed: Supabase CLI is still `2.107.0`; `npx supabase db push --help` still has `--dry-run` and `--include-all` but no per-file selector. The reviewed source `C:\Users\User\Desktop\Projects\ab123-rs-153336` was linked locally to project ref `vxwbbzjlctjpzivfkdou` with ignored `supabase/.temp` metadata. `npm run check:launch-migration-worktree` passed. `npx supabase migration list` showed exactly `20260618174500_harden_profile_dealer_public_reads.sql`, `20260618193000_align_payment_notifications_billing.sql`, and `20260620010000_harden_billing_checkout_atomicity.sql` as local-only; `20260619120000_add_vehicle_taxonomy_candidates.sql` is already remote and the blocked taxonomy metadata migration is absent. `npx supabase db push --dry-run --include-all` would push only those three launch-critical migrations and did not apply anything.
- 2026-06-21 live production read-only smoke: `TEST_URL=https://www.autobazar123.sk npm run test:smoke` passed 10/10. A small Playwright run using installed Chrome loaded the live homepage with status 200, 0 console warnings/errors, 0 page errors, noindex headers/meta, healthy `/api/health`, and `/robots.txt` disallow. `npm run test:agent-browser` timed out and was stopped, so no success is claimed for that helper.

- [ ] **Step 2: Deploy preview**

Only after local deploy preflight is green, `npm run check:launch-blockers:full -- --allow-extra-worktrees` has no unexpected blockers beyond live anon RLS before the migration sequence when run from an extra clean review-source worktree, and the owner explicitly approves deploy:
```powershell
npx vercel@54.14.5 deploy
```

Expected: preview deployment reaches `Ready`.

2026-06-21 status:
- Reviewed deploy source is ready at `C:\Users\User\Desktop\Projects\ab123-rs-153336`, commit `d38f2f3a5e27164ac759bcbe1e8a9fb6d36e7c6d`. `npm run check:deploy-source-readiness` passes there, the deferred taxonomy lane is absent, and `npm run check:launch-blockers:full -- --allow-extra-worktrees` has no unexpected blocker beyond live anon RLS before the migration sequence. No preview deployment was run. Next action is explicit owner approval for Preview deploy from this exact path/commit.

- [ ] **Step 3: Smoke preview**

Check:
```powershell
$env:TEST_URL="<preview-url>"; npm run test:smoke
$env:TEST_URL="<preview-url>"; npm run test:agent-browser
```

- [ ] **Step 4: Deploy production**

Only after preview is green, before remote RLS hardening, and after explicit owner approval for Production deploy:
```powershell
npx vercel@54.14.5 deploy --prod
```

Expected: production deployment reaches `Ready`.
Keep crawler indexing disabled.

- [ ] **Step 5: Smoke production**

Check production before remote migrations:
```powershell
$env:TEST_URL="<production-url>"; npm run test:smoke
$env:TEST_URL="<production-url>"; npm run test:agent-browser
```

Expected: all pass with the same indexing/canonical decision.

- [ ] **Step 6: Apply remote migrations**

Only after clean-worktree dry-run, Preview smoke, pre-migration Production smoke, and explicit owner approval for the exact dry-run output plus exact apply command are green:
```powershell
npx supabase --workdir <clean-worktree> db push --include-all
```

Expected migration batch:
```text
20260618174500_harden_profile_dealer_public_reads.sql
20260618193000_align_payment_notifications_billing.sql
20260620010000_harden_billing_checkout_atomicity.sql
```

Do not include `20260619214332_add_vehicle_taxonomy_metadata.sql`.

- [ ] **Step 7: Post-migration proof**

Run:
```powershell
npx supabase --workdir <clean-worktree> migration list
npm run check:live-rls-posture -- --json
$env:TEST_URL="<production-url>"; npm run test:smoke
$env:TEST_URL="<preview-url>"; npm run test:smoke
```

Then run the Stripe paid-checkout smoke and the payment notification SQL query from `docs/launch-remote-migration-deploy-runbook.md`.

---

### Task 12: Dealer Outreach Go/No-Go

**Files:**
- Docs: `docs/ad-supply-launch-plan.md`
- Docs: `PROJECT_STATUS.md`

- [ ] **Step 1: Confirm launch gates**

All must be true:
```text
Signup real email: pass locally 2026-06-20; preview/production open
Password reset real email delivery: pass locally 2026-06-20; preview/production open
Password reset token consumption: pass locally 2026-06-20; preview/production open
Login/logout: pass locally; preview/production open
Add listing: pass locally 2026-06-19; preview/production open
Edit listing: pass locally 2026-06-19; preview/production open
Upload/remove photos: pass locally 2026-06-19; preview/production open
Delete/remove listing: pass locally 2026-06-19; preview/production open
Inquiry/contact delivery: pass locally 2026-06-20; preview/production open
Stripe checkout creation: pass locally; paid completion/webhook/billing side effects: partial local pass; preview/production open
Payment emails: auth pass locally; payment confirmation delivery pass in isolated current-webhook smoke; payment notification logging/migrations open
Dealer dashboard: pass locally; preview/production open
Admin moderation: pass locally; preview/production open
Algolia sync: pass locally/live read parity 56/56
SEO canonical/indexing: local canonical/pSEO gate pass; live indexing intentionally blocked until launch gates pass
Performance budget: pass locally in production mode; final audit passed 6/6 with 80/80 route/viewport checks, 0 failing routes, 0 DevTools issues, and `npm run check:performance-budgets` passed with p95 JS transfer `2258037`, p95 main-thread work `363.1`, and p95 DOMContentLoaded `691.65`. Preview/external performance smoke is still open after deploy approval.
Live Supabase RLS: blocked, 4 anon-readable probes until compatible code is deployed and remote launch migrations are applied
Vercel preview packaging: local preflight pass; preview deploy itself is still open
Migration safety: blocked from current dirty tree; use clean launch worktree/runbook
Preview smoke: open, not run
Production smoke: open, not run
```

- [ ] **Step 2: Contact only the first small dealer batch**

Start with 5-10 Slovak bazaars, not a mass campaign.

Offer:
```text
Free ad uploads at launch.
We can help import first inventory manually.
No paid commitment until listings and buyer interest are proven.
```

- [ ] **Step 3: Track each dealer response**

For each dealer, record:
```text
Name
Website
Contact person
Email/phone
Date contacted
Response
Inventory size
Import needs
Follow-up date
```

Expected: outreach is measurable and reversible.

---

## Self-Review

Spec coverage:
- Auth, login/logout, signup, password reset, emails: Tasks 2 and 3.
- Add/edit/remove listings/photos: Task 4.
- Payments/ad enhancements/premium: Tasks 2 and 6.
- Algolia/Supabase/crons/services: Tasks 8 and 10.
- SEO/geo/schema/indexing/canonicals: Task 7.
- UI/design/errors: Task 9.
- Branch cleanup/merge: Task 1.
- Launch/deploy readiness: Task 11.
- Dealer outreach: Task 12.

Gaps deliberately left as decisions:
- Canonical host must be chosen once: `www` or apex.
- Vercel plan must be known before increasing cron frequency beyond daily. Current daily schedule is deploy-safe under the stricter official Hobby cron restriction.
- Real credentials/accounts must exist before role-specific E2E can be complete.

Execution rule:
- A task is not complete until its commands pass and `PROJECT_STATUS.md` is updated with exact evidence.
