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
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`: pass, 15/15 on 2026-06-19 after adding seller create/edit/photo-remove/mark-sold/delete lifecycle coverage, non-owner edit-page denial coverage, and real recovery-token password reset coverage.
- `npx vitest run src/app/api/account/password/route.test.ts src/app/api/account/password/recovery/route.test.ts src/app/api/auth/password-reset/route.security.test.ts src/app/api/auth/register/route.test.ts src/app/api/auth/register/resend/route.test.ts`: pass, 40/40.
- `npm run test:security:release-gate`: pass on 2026-06-19 after the password recovery and cron reliability fixes.
- `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 8/8 after the `send-alerts` failure-reporting fix.
- `npx vitest run src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 10/10 after the `process-email-jobs` failure-reporting fix.
- `npx vitest run src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`: pass, 13/13 after adding `cleanup-sold` route coverage.
- `npx vitest run src/proxy.test.ts`: pass, 18/18.
- Latest local post-fix checks: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:security:release-gate`, `npm run build`, `npm run check:launch-test-coverage`, `npm run test:web-interface`, `npm run test:a11y`, `npm run test:keyboard`, `npm run test:mobile-matrix`, and `npm run test:ui-quality-gate` pass.

Known launch blockers still open:
- Real signup confirmation email delivery is not verified.
- Real password reset email delivery and the real emailed-link path are not verified. Real recovery-token consumption is verified locally through the browser.
- Real browser add-listing, edit-listing, photo upload/removal, mark-sold, seller delete/remove, and non-owner edit denial now pass locally.
- Configured dealer E2E account exists and passes `/dealer` topup smoke; full dealer verification/admin moderation coverage is still not complete.
- Configured seller-with-owned-ad credentials exist and pass dashboard edit/top/sold-control smoke plus create/edit/photo-remove/mark-sold lifecycle.
- Real Stripe Checkout and live webhook delivery are not verified.
- Payment scout finding: mocked checkout/webhook tests pass 42/42, but failure emails are not wired, checkout DB-update errors after Stripe session creation can leave pending local status, and the private-listing purchase order can leave a transaction row if the later action RPC fails.
- Payment email notification schema drift is fixed locally in commit `0bbf14f`; preview/production migration and real payment email delivery are not verified yet.
- Site remains crawler-blocked by `NEXT_PUBLIC_SITE_INDEXING_ENABLED=false`.
- Canonical/domain decision is unresolved: live apex redirects to `www`, while local sitemap/canonicals use apex.
- Programmatic SEO creates too many thin routes for current inventory: 56 active ads, no real dealers, and the current sitemap has about 1389 URLs including 1096 city pSEO URLs and only 56 listing URLs.
- Cron/search scout finding: Algolia live read-only check still passes at 56 active ads / 56 records. `expire-ads` DB update, `expire-ads` Algolia cleanup, `send-alerts` email-send, and `process-email-jobs` terminal-failure false-success paths are now fixed locally; all four cron routes have local route coverage. Approved preview/production cron smoke still needs direct coverage.
- Public copy still overclaims marketplace scale in places.
- Production/preview were not deployed or smoked in this audit pass.

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
- Passed full browser check: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`, 15/15.
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
- Passed full suite: `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`, 15/15.
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

- [ ] **Step 2: Verify dealer dashboard**

Run:
```powershell
npm run test:release-gauntlet -- --grep "dealer"
```
Expected:
- Dealer account reaches `/dealer`.
- Non-dealer account sees registration/onboarding prompt.
- Admin can see dealer verification request area.

Partial 2026-06-18 evidence:
- `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_REUSE_SERVER=true npx playwright test tests/release-gauntlet.test.ts --project=desktop-chromium --reporter=line`: passed 12/12.
- Covered dealer account `/dealer` billing/topup smoke and non-dealer onboarding prompt.
- Not yet covered here: admin dealer verification request area.

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
  - Real Stripe test checkout and live webhook delivery are not verified.
  - Failure email helper exists, but webhook failure branches do not enqueue failure emails yet.
  - Checkout route can redirect to Stripe even if the local billing-session update fails after session creation.
  - Private listing purchase flow inserts `billing_transactions` before `apply_private_listing_action`; if the later RPC fails, the transaction row can remain without the intended listing action.

- [ ] **Step 2: Verify real Stripe test checkout**

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
- Still launch-blocking: indexing is disabled, canonical host is unresolved, pSEO is too broad for the current inventory, and public copy still overclaims marketplace scale.
- Owner decisions needed: choose canonical `www` or apex, choose pSEO launch rule, approve honest small-launch copy, and decide when to enable indexing.

- [ ] **Step 1: Decide canonical host**

Decision required:
- Option A: canonical `https://www.autobazar123.sk`
- Option B: canonical `https://autobazar123.sk`

Current live behavior observed by SEO audit: apex redirects to `www`, while local canonicals/sitemap use apex. Pick one and make redirects, sitemap, canonical metadata, and `NEXT_PUBLIC_APP_URL` match.

- [ ] **Step 2: Make canonical config consistent**

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

- [ ] **Step 3: Reduce thin pSEO pages before indexing**

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

- [ ] **Step 4: Remove scale overclaims**

Search:
```powershell
rg -n "tisic|tisíc|stov|overen|verified|najvac|najväc" src docs
```

Replace public copy that implies scale or verified dealers when data says 56 active ads and 0 dealers.

Run:
```powershell
npm run check:sk-diacritics
npm run check:i18n-contract
npm run check:i18n-diacritics
```
Expected: pass.

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
- Still open: direct cron route coverage is partial; preview/production cron smoke needs approval because it can mutate data or send emails.

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
- Fixed locally: `process-email-jobs` no longer reports success when queued email processing reports terminal failed jobs; it returns degraded `502`.
- Fixed locally: Algolia cleanup fallback/telemetry for `expire-ads` is registered as `cron.expire_ads_algolia_cleanup_failed`.
- Covered locally: `cleanup-sold` cron auth rejection, successful old-sold-ad hide/cache revalidation, and DB update failure without cache revalidation.
- `src/lib/email/jobs.ts` does not have direct processor tests.

2026-06-19 send-alerts evidence:
- Added `src/app/api/cron/send-alerts/route.test.ts`.
- RED/GREEN coverage proves saved-ad and saved-search email failures return degraded `502` responses with non-PII failure details.
- The tests also prove failed saved-ad and saved-search sends do not update notification state as sent.
- Passed supporting checks: `npx vitest run src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`, 8/8; `npm run lint`; `npm run typecheck`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.

2026-06-19 process-email-jobs evidence:
- Added `src/app/api/cron/process-email-jobs/route.test.ts`.
- RED/GREEN coverage proves terminal queued-email failures return degraded `502` instead of `ok: true`.
- Route coverage also proves cron auth rejection returns before processing jobs.
- Passed supporting checks: `npx vitest run src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`, 10/10; `npm run lint`; `npm run typecheck`; `npm run test:security:release-gate`; `npm run build`, 1574 pages.

2026-06-19 cleanup-sold evidence:
- Added `src/app/api/cron/cleanup-sold/route.test.ts`.
- Coverage proves cron auth rejection returns before DB access.
- Coverage proves old sold ads are hidden and ad cache tags are revalidated after a successful DB update.
- Coverage proves DB update failure returns `500` and does not revalidate ad cache tags.
- Passed supporting checks: `npx vitest run src/app/api/cron/cleanup-sold/route.test.ts src/app/api/cron/process-email-jobs/route.test.ts src/app/api/cron/send-alerts/route.test.ts src/app/api/cron/expire-ads/route.test.ts src/lib/fallbacks/registry.test.ts src/lib/env.test.ts`, 13/13; `npm run lint`; `npm run typecheck`.

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

- [ ] **Step 1: Fix duplicate `h1` on embedded add-listing wizard**

When `AdWizardClient` is rendered inside dashboard create tab, demote the wizard heading to `h2` or pass a prop:
```tsx
<AdWizardClient headingLevel="h2" />
```

Run:
```powershell
npm run test:a11y
```
Expected: no duplicate-main-heading or page-heading accessibility issue.

- [ ] **Step 2: Run full UI gate**

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

- [ ] **Step 3: Capture launch screenshots**

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

- [ ] **Step 2: Rotate old maintenance secret if still valid**

The audit found historical migration text containing old maintenance password material. Confirm the production maintenance bypass secret is not the historical value and rotate it if uncertain.

Expected: old value cannot unlock maintenance; new signed-token flow still works.

- [ ] **Step 3: Clean local secret backup files after confirming they are ignored**

Run:
```powershell
git status --ignored --short .env.local .env.local.bak-20260322-221455 .vercel
```
Expected: secret files are ignored and not staged. Remove stale backup files only after confirming there is no needed unique value in them.

---

### Task 11: Preview And Production Release Gate

**Files:**
- Docs: `PROJECT_STATUS.md`, `docs/launch-checklist.md`

- [ ] **Step 1: Run local release gate**

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

- [ ] **Step 2: Deploy preview**

Only after local gate passes:
```powershell
vercel deploy
```

Expected: preview deployment reaches `Ready`.

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
Stripe checkout/webhook: pass
Payment emails: pass
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
