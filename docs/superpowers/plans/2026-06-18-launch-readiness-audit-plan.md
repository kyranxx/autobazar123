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

Fresh verified evidence:
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run test:db:rls`: pass, 22/22.
- `npm run test:security:release-gate`: pass.
- `npx vitest run src/components/AuthModal.email-flow.test.tsx src/app/api/stripe/webhook/route.test.ts src/lib/email/react-email-templates.test.ts`: pass, 36/36.
- `npm run easy:quick`: pass, 90 files / 452 tests.
- `npm run build`: pass, 1574 static pages generated.
- `npm run check:algolia-search`: pass, 56 active Supabase ads and 56 Algolia records.
- `npm run list:fallbacks`: pass, 9 registered fallbacks after adding `cron.expire_ads_algolia_cleanup_failed`.
- `npm run check:launch-test-coverage`: pass, complete launch test account coverage is yes.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=true npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`: pass, 12/12.
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`: pass, 18/18 on 2026-06-20 after adding seller create/edit/photo-remove/mark-sold/delete lifecycle coverage, non-owner edit-page denial coverage, dashboard create-tab single-`h1` coverage, real recovery-token password reset coverage, admin dealer-verification request visibility coverage, buyer inquiry delivery coverage, and React hydration waits/retries for login/reset/contact interactions.
- `npx vitest run src/app/api/account/password/route.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts`: pass, 40/40.
- `npm run test:security:release-gate`: pass on 2026-06-19 after the password recovery and cron reliability fixes.
- `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 8/8 after the `send-alerts` failure-reporting fix.
- `npx vitest run src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 10/10 after the `process-email-jobs` failure-reporting fix.
- `npx vitest run src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 14/14 after adding `cleanup-sold` route coverage and the `process-email-jobs` requeue degraded response.
- `npx vitest run src/lib/email/jobs.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 16/16 after adding direct email processor state-update failure coverage.
- `npx vitest run src/proxy.test.ts`: pass, 18/18.
- Latest local post-fix checks: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, `npm run build`, `npm run check:launch-test-coverage`, `npm run test:web-interface`, `npm run test:a11y`, `npm run test:keyboard`, `npm run test:mobile-matrix`, and `npm run test:ui-quality-gate` pass.
- 2026-06-20 launch screenshot/UI pass: `node output/playwright/launch-screenshots/capture-launch-screenshots.mjs` passed 18 desktop/mobile screenshots with 0 failed statuses, 0 console messages, 0 page errors, 0 network failures, 0 horizontal-scroll issues, and 0 too-wide elements.
- 2026-06-20 Task 10 live RLS audit: local `npm run test:db:rls` passed 2 files / 26 tests, but live anon Supabase probe failed for `profiles.email`, `profiles.phone`, `profiles.credit_balance`, and raw `dealers` without printing row values.
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
- Live Supabase raw `profiles` and `dealers` are anonymously readable until compatible code is deployed and `20260618174500_harden_profile_dealer_public_reads.sql` is safely applied to remote, then rechecked with the live anon probe.
- Maintenance bypass cannot be trusted in Preview/Production until `MAINTENANCE_UNLOCK_PASSWORD` and `MAINTENANCE_BYPASS_SECRET` are verified by deploy/runtime smoke.
- Payment scout finding: mocked checkout/webhook tests pass 52/52 after payment failure email queueing, checkout fail-closed handling, paid-webhook retry responses, and fallback transaction lookup for payment confirmation queueing were wired locally. The private-listing transaction/RPC ordering risk now has a verified SQL atomicity migration/test.
- Payment email notification schema drift is fixed locally in commit `0bbf14f`; preview/production migration and payment notification logging are not verified yet. Current-webhook payment email delivery itself is verified locally through Resend and Gmail.
- Site remains crawler-blocked by `NEXT_PUBLIC_SITE_INDEXING_ENABLED=false`.
- Canonical/domain decision is resolved to `https://www.autobazar123.sk`; local canonical config and Vercel public app/Supabase env values were cleaned where safe, but Vercel secret env remains launch-blocking.
- Programmatic SEO thin city-route scope is reduced locally: sitemap brand/model URLs now come from active inventory, city pSEO sitemap URLs require at least 10 active matching ads, below-threshold city pages noindex/404, hardcoded internal city pSEO links were removed, and `npm run build` now generates 331 pages instead of the previous 1574. This is not pushed, deployed, or live-smoked.
- Cron/search scout finding: Algolia live read-only check still passes at 56 active ads / 56 records. `expire-ads` DB update, `expire-ads` Algolia cleanup, `send-alerts` email-send, `process-email-jobs` failed/requeued false-success paths, and direct email job processor state-update false-success paths are now fixed locally; all four cron routes have local route coverage. Queued email retries now pass deterministic Resend `Idempotency-Key` values for normal provider-success / DB-mark-sent failure retries. Approved preview/production cron smoke still needs direct coverage, and real provider delivery/idempotency still needs live smoke because Resend keys expire after 24 hours.
- Public scale overclaims were removed locally, but the copy fix is not pushed, deployed, or live-smoked.
- Local Vercel Preview packaging is still blocked after the app-side route fixes: dealer pages and pricing/taxonomy API routes no longer perform build-time service-role/mutable-data collection, but Vercel Preview packaging still fails on static-PPR `/audi/a1` with `Unable to find lambda for route`.
- Production/preview were not deployed or smoked in this audit pass.
- Vercel env/build preflight is currently blocked on cloud verification, not only local CLI checks: public Supabase/App URL values were fixed to remove literal `\r\n`; Preview server envs were re-added from local source values, including Stripe test keys; Production non-payment server envs were re-added from local source values. Latest `npx vercel env ls preview` / `npx vercel env ls production` checks show expected env names exist in both targets, including Upstash and Stripe names. Local `vercel env run` is not authoritative proof for sensitive deployed runtime values, so Upstash and Production Stripe values still need cloud smoke or provider/dashboard confirmation.
- Dirty taxonomy/discovery work remains in the main worktree and is not part of the launch-critical path. Current recheck passed parser/candidate tests plus active-only public taxonomy read coverage, lint, typecheck, and whitespace checks. The lane adds external discovery scripts, candidate promotion, and local-only migration `20260619214332_add_vehicle_taxonomy_metadata.sql`; keep it out of the launch remote DB push unless explicitly approved as a separate feature.

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

- [ ] **Step 3: Verify signup confirmation**

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

- [ ] **Step 4: Verify password reset**

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
- Still open: real provider email delivery and the real emailed-link path.

- [ ] **Step 5: Update docs**

Update `PROJECT_STATUS.md` and `docs/launch-checklist.md` with exact date, commands, account coverage result, and any remaining blocker.

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
- `node C:\Users\User\.codex\skills\seo-agent-audit\scripts\seo-audit.mjs --url https://www.autobazar123.sk --max-pages 30 --format markdown` crawled the live homepage and still reports the homepage canonical as `https://autobazar123.sk`, robots meta `noindex, nofollow`, and description length 173.
- `node C:\Users\User\.codex\skills\seo-agent-audit\scripts\deep-seo-audit.mjs --url https://www.autobazar123.sk --max-urls 40` crawled 40 live URLs, all status 200, with 53 Medium and 16 Low in-review findings dominated by apex canonical drift from fetched `www` URLs and expected prelaunch noindex/template notes.
- Compact live fetches verified apex redirects 307 to `www`, `www` still returns `X-Robots-Tag: noindex, nofollow, noarchive`, `/robots.txt` still disallows all crawlers, `/sitemap.xml` still has 1389 `<loc>` entries all on `autobazar123.sk`, and `/llms.txt` primary URLs still use apex.
- Interpretation: this is expected prelaunch blocking plus deployment drift. Before opening to search/dealer outreach, deploy local canonical/pSEO/copy fixes, enable indexing only after all launch gates pass, and verify `www` canonicals, sitemap hosts, robots, and `llms.txt` on preview then production.

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

- [ ] **Step 2: Verify cron routes locally**

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

Then use a live anon Supabase query script to confirm:
```text
profiles.email is not readable
profiles.phone is not readable
profiles.credit_balance is not readable
dealers raw table is not anonymously readable
```

Expected: anon gets denied or receives no sensitive columns.

2026-06-20 evidence:
- Local `npm run test:db:rls` passed 2 files / 26 tests.
- Live anon Supabase probe failed: `profiles.email`, `profiles.phone`, `profiles.credit_balance`, and raw `dealers` returned rows anonymously. The probe did not print row values.
- `npx supabase migration list` shows `20260618174500_harden_profile_dealer_public_reads.sql` is local-only on remote.
- Plain `supabase db push` is unsafe from the current dirty worktree because unrelated local-only taxonomy migrations are also present; use `docs/launch-remote-migration-deploy-runbook.md` to isolate the launch-critical migrations.
- Clean-worktree `db push --dry-run --include-all` now proves only the three launch-critical migrations would be pushed when the already-remote `20260619120000_add_vehicle_taxonomy_candidates.sql` migration history file is present locally.
- Compatibility code is prepared locally: `/auto/[id]` now uses `src/lib/cars/public-car-detail.ts` instead of an anon raw `profiles` join.
- Passed focused test: `npx vitest run src/lib/cars/public-car-detail.test.ts`, 2/2.
- Passed support checks: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, and `npm run build`; unit tests passed 105 files / 507 tests and build generated 331 pages.
- Step remains open until compatible code is deployed, the remote RLS migration is safely applied without unrelated migrations, and the live anon probe passes.

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
- 2026-06-20 continuation evidence: Vercel server envs were re-added from local source values without printing secrets. Preview received cron, Cloudflare, Algolia admin/sync, Stripe test, Supabase service role, Resend, email, and maintenance values. Production received non-payment service/email/maintenance values only; local Stripe is test-mode, so Production Stripe was not copied. Later `npx vercel env ls preview` / `npx vercel env ls production` checks show the expected env names exist in both targets, including Upstash and Stripe names; sensitive values still need cloud smoke or provider/dashboard confirmation.
- 2026-06-20 continuation evidence: taxonomy discovery lane audit passed `npx vitest run src/lib/vehicle-taxonomy/candidates.test.ts src/lib/vehicle-taxonomy/autobazar-eu.test.ts src/lib/vehicle-taxonomy/mobile-de.test.ts src/lib/vehicle-taxonomy/otomoto.test.ts`, `git diff --check`, `npm run typecheck`, and `npm run lint`. `npx supabase migration list` still shows `20260619214332_add_vehicle_taxonomy_metadata.sql` as local-only; dirty-tree `db push --dry-run --include-all` could not complete without `SUPABASE_DB_PASSWORD`.
- 2026-06-20 continuation evidence: explicit unfinished-marker scan found no matches in source/scripts/tests/docs for `TODO`, `FIXME`, `XXX`, `HACK`, `workaround`, or obvious `not implemented` markers.
- 2026-06-20 Vercel build preflight evidence: focused tests passed for the public dealer pages and pricing/taxonomy API routes after adding `connection()` request boundaries. Support checks passed: `git diff --check`, `npm run typecheck`, `npm run lint`, and `npm run build`; final local Next build generated 330 pages.
- 2026-06-20 Vercel build blocker: `npx vercel build --target=preview --yes` and `npx vercel@54.14.2 build --target=preview --yes` still failed on `/audi/a1` with `Unable to find lambda for route`. Diagnosis matches an open Vercel/Next 16 Cache Components static-PPR builder issue. Do not mark Task 11 Step 2 ready or force pSEO routes dynamic without an owner decision.
- 2026-06-20 fresh recheck: throwaway worktree `autobazar123-vercel-preflight-292bcd4` at commit `292bcd4` reproduced the same failure with latest npm `vercel@54.14.2`; npm dist-tags showed no newer `latest` CLI and an older `canary`.

- [ ] **Step 2: Deploy preview**

Only after local gate passes:
```powershell
vercel deploy
```

Expected: preview deployment reaches `Ready`.

2026-06-20 status:
- Blocked before deploy by the local Vercel Preview packaging failure above. No preview deployment was run in this continuation.

- [ ] **Step 3: Smoke preview**

Check:
```text
Preview /api/health = healthy
Preview homepage = 200
Preview /vysledky = 200
Preview /auth/login = 200
Preview /site-map = 200
Preview /sitemap.xml = 200
Preview /robots.txt matches indexing decision
```

- [ ] **Step 4: Deploy production**

Only after preview is green:
```powershell
vercel deploy --prod
```

Expected: production deployment reaches `Ready`.

- [ ] **Step 5: Smoke production**

Check production:
```text
/api/health
/
/vysledky
/auto/{real-active-ad}
/auth/login
/site-map
/sitemap.xml
/robots.txt
```

Expected: all pass with the same indexing/canonical decision.

---

### Task 12: Dealer Outreach Go/No-Go

**Files:**
- Docs: `docs/ad-supply-launch-plan.md`
- Docs: `PROJECT_STATUS.md`

- [ ] **Step 1: Confirm launch gates**

All must be true:
```text
Signup real email: pass
Password reset real email delivery: pass
Password reset token consumption: pass locally 2026-06-19
Login/logout: pass
Add listing: pass locally 2026-06-19
Edit listing: pass locally 2026-06-19
Upload/remove photos: pass locally 2026-06-19
Delete/remove listing: pass locally 2026-06-19
Inquiry/contact delivery: pass
Stripe checkout creation: pass locally; paid completion/webhook/billing side effects: partial pass locally in shared test mode
Payment emails: auth pass; payment confirmation delivery pass in isolated current-webhook smoke; payment notification logging/migrations open
Dealer dashboard: pass
Admin moderation: pass
Algolia sync: pass
SEO canonical/indexing: pass
Preview smoke: pass
Production smoke: pass
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
