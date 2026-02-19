# Security Review Remediation Plan

## Checklist
- [x] Audit `SECURITY_REVIEW.md` findings against current codebase.
- [x] Restrict health endpoint output for unauthenticated callers.
- [x] Remove webhook credit balance race condition with atomic DB operation.
- [x] Make strict rate limiting fail closed when limiter is unavailable.
- [x] Remove client-supplied `userId` from checkout payload.
- [x] Apply consistent escaped JSON-LD rendering via shared utility.
- [x] Replace maintenance bypass static cookie with signed token verification.
- [x] Move Cloudflare worker manual auth secret from query param to `Authorization` header.
- [x] Replace regex-based HTML sanitization with sanitizer library.
- [x] Add/verify `site_admins` RLS policy to restrict reads to own row.
- [x] Fix deprecated Codex config flag (`collab` -> `features.multi_agent`).
- [x] Run verification checks on touched code paths.

## Review
- Status: Complete
- Notes:
  - Implemented all 9 findings from `SECURITY_REVIEW.md` across app, worker, and DB migration layers.
  - Added shared utilities for JSON-LD escaping, maintenance token signing/verification, and robust sanitization.
  - Verification:
    - `npm run lint` passed with no warnings.
    - `npx tsc --noEmit` passed.
    - `npm run test:unit` passed (87/87 tests) after updating one schema sanitization expectation to match hardened behavior.

## Supabase Migration Execution Plan
- [x] Authenticate Supabase CLI with provided access token.
- [x] Link local project to remote project ref `vxwbbzjlctjpzivfkdou`.
- [x] Push pending migrations to remote database.
- [x] Verify `process_stripe_credit_topup` function exists remotely.
- [x] Verify `site_admins` RLS policies exist remotely.

## Supabase Migration Execution Review
- Status: Complete
- Notes:
  - Synced remote migration drift by fetching `20260212210951`.
  - Resolved duplicate migration version collisions by renaming legacy pending files to unique versions:
    - `20260213000100_create_logs_tables.sql`
    - `20260213000200_idempotency_keys.sql`
    - `20260213000300_saved_ads.sql`
  - Hardened legacy logs migration to current admin model (`site_admins`) and made policy/index creation idempotent.
  - Applied security migration `20260218_security_review_hardening.sql` successfully.
  - Found and fixed legacy schema blocker (`credit_transactions.dealer_id` still `NOT NULL`) with migration:
    - `20260219000100_fix_credit_transactions_dealer_not_null.sql`
  - Post-push verification:
    - Remote migration history includes `20260218` and `20260219000100`.
    - RPC `process_stripe_credit_topup` is callable (returns structured function response, no missing-function error).
    - `site_admins` anonymous read returns zero rows while admin read has rows.

## Smoke Check Execution
- [x] Check production `/api/health` response shape as unauthenticated user.
- [x] Check local `/api/health` response shape as unauthenticated user.
- [x] Verify maintenance bypass token validator rejects static `true`.
- [x] Verify Cloudflare worker fetch auth gate rejects query secret and accepts bearer auth.
- [x] Verify maintenance unlock endpoint behavior under strict fail-closed rate limiting.

## Smoke Check Review
- Status: Complete
- Notes:
  - Production `https://www.autobazar123.sk/api/health` currently returns detailed fields (`checks`, `uptime`), indicating production deployment has not yet picked up latest health endpoint hardening.
  - Local `http://localhost:3000/api/health` returns only `status` and `timestamp` for unauthenticated requests as expected.
  - Maintenance token helper behavior:
    - generated signed token validates successfully
    - static `true` token is rejected
    - tampered token is rejected
  - Cloudflare API token verification fixed:
    - Workers subdomain API now returns `200` with `success: true`.
  - Worker auth gate behavior (verified on deployed worker URL):
    - query-param secret request returns `401`
    - `Authorization: Bearer <secret>` returns `200`
  - Maintenance unlock endpoint currently returns `429` locally due strict limiter fail-closed mode without configured Upstash Redis, which is expected with current security settings.

## Links Execution Plan (Hard Order, No Soft Milestones)

### Checklist
- [x] Capture user-priority order exactly as requested: `14, 13, 12, 10, 8, 7, 5, 4, 3, 2, 1`.
- [x] Gate 0 (mandatory): Verify auth email flows for `register` and `reset password` with automated tests.
- [x] Gate 1: Add `#14` agent-browser implementation path and pass/fail smoke script for core user flows.
- [x] Gate 2: Add `#13` UI/UX Pro Max usage protocol and produce one measurable UI output.
- [x] Gate 3: Evaluate `#12` Shannon Lite in staging-only scope; confirm license/cost constraints and run bounded pilot if feasible.
- [x] Gate 4: Add `#10` model-mismatch preflight script to local and CI workflows.
- [x] Gate 5: Integrate selected `#8` codex best-practice rules into repo workflow docs/checklists.
- [x] Gate 6: Convert `#7` SEO map into concrete implementation matrix and ship first technical/on-page tranche.
- [x] Gate 7: Apply `#5` detail-level UI polish changes to production components.
- [x] Gate 8: Encode `#4` web-interface-guidelines into review checklist and enforceable tests.
- [x] Gate 9: Add `#3` ui-skills review pass in UI QA loop.
- [x] Gate 10: Evaluate `#2` onboarding inspiration and implement one measurable onboarding improvement.
- [x] Gate 11: Implement `#1` react.email migration path for targeted templates.
- [x] Run verification for touched code and capture objective proof.

### Review
- Status: In Progress
- Notes:
  - Execution is intentionally strict and gate-based.
  - No gate is considered complete without objective verification evidence.
  - Gate 0 evidence:
    - Added `src/components/AuthModal.email-flow.test.tsx`.
    - Verified registration flow calls `supabase.auth.signUp` with `emailRedirectTo: ${window.location.origin}/auth/callback`.
    - Verified reset flow calls `supabase.auth.resetPasswordForEmail` with `redirectTo: ${window.location.origin}/auth/reset-password`.
    - Verification command: `npx vitest run src/components/AuthModal.email-flow.test.tsx` (passed, 2/2 tests).
    - Live send execution:
      - Provided address `blanarikdanielgmail.com` was rejected by Supabase as invalid email format (`400`).
      - Fallback assumption used to continue execution: `blanarikdaniel@gmail.com`.
      - For assumed address, both register trigger (`signUp`) and reset trigger (`resetPasswordForEmail`) completed without API error.
  - Gate 1 evidence:
    - Added `scripts/agent-browser-smoke.mjs` (direct `agent-browser` API path).
    - Added npm command: `npm run test:agent-browser`.
    - `agent-browser` CLI daemon mode is broken on this Windows environment (`Daemon failed to start (socket: C:\Users\User\.agent-browser\default.sock)`), so smoke checks use the package API directly.
    - Verification command: `$env:TEST_URL='https://www.autobazar123.sk'; npm run test:agent-browser` (passed).
  - Gate 2 evidence:
    - Added protocol: `docs/ui-ux-pro-max-protocol.md`.
    - Implemented measurable UI output in `src/components/AuthModal.tsx`:
      - real-time password-strength bar + label in register flow (`Slaba`, `Stredna`, `Silna`).
    - Added verification tests: `src/components/AuthModal.password-strength.test.tsx`.
    - Verification command: `npx vitest run src/components/AuthModal.password-strength.test.tsx` (passed, 3/3 tests).
  - Gate 3 evidence:
    - Feasibility check completed against current machine/env.
    - Docker runtime not installed (`docker --version` command not found).
    - Required Shannon model provider keys not present in local env file (`ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY` not configured).
    - Outcome: bounded pilot is currently not feasible; no production-risking workaround applied.
  - Gate 4 evidence:
    - Added model preflight script: `scripts/model-check.mjs`.
    - Added CI workflow: `.github/workflows/model-check.yml`.
    - Verification command: `npm run test:model-check` (passed, requested model matched actual model).
  - Gate 5 evidence:
    - Added workflow guard script: `scripts/workflow-check.mjs`.
    - Added command: `npm run test:workflow-check`.
    - Integrated guard checks in PR template and CI workflow.
    - Verification command: `npm run test:workflow-check` (passed).
  - Gate 6 evidence:
    - Added SEO execution matrix: `docs/seo-implementation-matrix.md`.
    - Shipped first technical/on-page tranche:
      - canonical + OG URL alignment and internal link cluster on search page (`src/app/vysledky/page.tsx`),
      - semantic heading baseline for search route (`src/app/vysledky/AlgoliaSearchPageClient.tsx`),
      - breadcrumb JSON-LD on brand/model/city/dealer routes (`src/app/[brand]/page.tsx`, `src/app/[brand]/[model]/page.tsx`, `src/app/[brand]/[model]/[city]/page.tsx`, `src/app/predajca/[slug]/page.tsx`).
  - Gate 7 evidence:
    - Added detail-level registration polish in `src/components/AuthModal.tsx`:
      - password requirement checklist,
      - live password match state,
      - register submit gating until form validity is satisfied.
    - Verification command: `npx vitest run src/components/AuthModal.password-strength.test.tsx` (passed, 4/4 tests).
  - Gate 8 evidence:
    - Added review checklist doc: `docs/web-interface-guidelines-checklist.md`.
    - Added enforceable tests:
      - core baseline: `tests/web-interface-guidelines.test.ts`,
      - site-wide gate: `tests/web-interface-sitewide.test.ts`.
    - Added commands:
      - `npm run test:web-interface:core`,
      - `npm run test:web-interface:sitewide`,
      - `npm run test:web-interface` (core + site-wide).
    - Verification command: `npm run test:web-interface` (passed locally with managed Playwright web server).
  - Gate 9 evidence:
    - Added UI QA loop doc: `docs/ui-skills-review-pass.md`.
    - Added aggregate command: `npm run test:ui-qa` and checklist integration in `docs/codex-workflow-checklist.md`.
    - Verification command: `npm run test:ui-qa` (passed).
  - Gate 10 evidence:
    - Implemented onboarding improvement in `src/components/AuthModal.tsx`:
      - post-registration `verify` view with explicit next-step checklist and login continuation CTA.
    - Updated flow validation in `src/components/AuthModal.email-flow.test.tsx` to assert verify-step transition (passed).
  - Gate 11 evidence:
    - Installed React Email stack (`@react-email/components`, `@react-email/render`).
    - Added targeted React Email templates: `src/lib/email/react-email-templates.tsx`.
    - Implemented migration path in `src/lib/email/send-payment-confirmation.ts` using rendered React templates + provider send path + notification logging.
    - Added template tests: `src/lib/email/react-email-templates.test.ts` (passed, 2/2 tests).
  - Verification summary:
    - `npx vitest run src/components/AuthModal.email-flow.test.tsx src/components/AuthModal.password-strength.test.tsx src/lib/email/react-email-templates.test.ts` (passed, 8/8 tests).
    - `npm run test:web-interface` (passed, 5/5 core + 1/1 site-wide Playwright tests).
    - `npm run test:ui-qa` (passed).
    - `npm run test:model-check` (passed).
    - `npm run test:workflow-check` (passed).
    - `npm run test:agent-browser` against production URL (passed).
    - `npx tsc --noEmit` (passed).

## UI + Email Proof Pass (User Follow-up)

### Checklist
- [x] Diagnose why reset email can arrive while registration confirmation does not.
- [x] Improve auth UX to handle already-registered email behavior explicitly.
- [x] Add in-flow resend confirmation email action in verify step.
- [x] Fix detected hydration mismatch on calculator page from full-route UI audit.
- [ ] Run broad verification suite and collect objective outputs.
- [ ] Push validated changes to GitHub remote.

### Review
- Status: In Progress
- Notes:
  - Live Supabase diagnostics executed against register/reset/resend flows:
    - `signup_alias` (`blanarikdaniel+autobazar123-<timestamp>@gmail.com`) => success, `identitiesCount: 1` (new-user confirmation path).
    - `signup_base` (`blanarikdaniel@gmail.com`) => success, `identitiesCount: 0` (already-registered behavior; new confirmation typically not sent).
    - `resend_base` => success (resend endpoint accepted).
    - `reset_base` => `429 email rate limit exceeded` during rapid retest.
  - Auth UX hardening implemented in `src/components/AuthModal.tsx`:
    - explicit already-registered detection (`identities.length === 0`) with guided login/reset message,
    - resend confirmation button in verify step with cooldown and loading states.
  - Added tests:
    - `src/components/AuthModal.email-flow.test.tsx` (resend + existing-account branch),
    - `src/components/AuthModal.password-strength.test.tsx` updated Supabase mock surface.
  - Hydration mismatch fix:
    - rewrote leasing page numeric formatting to deterministic formatter in `src/app/kalkulacka-leasingu/page.tsx`.

## Gate Enforcement Hardening (Site-wide)

### Checklist
- [x] Define explicit site-wide UI gate acceptance criteria (not core routes only).
- [x] Implement Playwright gate that checks semantic/accessibility UI rules across broad route inventory.
- [x] Wire new site-wide gate into npm scripts and workflow checklist docs.
- [x] Run full gate verification locally and capture objective pass/fail evidence.
- [ ] Commit and push gate-hardening changes.

### Review
- Status: In Progress
- Notes:
  - User requested proof that gates are implemented in practice site-wide.
  - Implemented site-wide enforcement gate:
    - New test: `tests/web-interface-sitewide.test.ts`
    - Route sources: core routes + sitemap + homepage-discovered links
    - Checks per route: `main`, `h1`, labeled controls, non-empty image `alt`
    - Output report: `output/playwright/web-interface-sitewide.json`
  - Updated commands:
    - `npm run test:web-interface` now runs both core and site-wide gates.
  - Accessibility fixes applied from initial failing run:
    - `src/app/auth/reset-password/page.tsx`: restored top-level `main` landmark.
    - `src/app/kalkulacka-leasingu/page.tsx`: labeled range controls with explicit `id`/`htmlFor`.
    - `src/app/cookies/page.tsx`: labeled cookie toggle buttons and set non-submit button types.
    - `src/app/auto/[id]/CarDetailClient.tsx`: added robust error-state `h1`, labeled icon-only buttons, labeled photo thumbnails, and meaningful thumbnail image `alt`.
  - Verification evidence:
    - `npm run test:web-interface:sitewide` (passed, 1/1).
    - `npm run test:web-interface` (passed, core + site-wide).
    - `npm run test:ui-qa` (passed with site-wide gate included).
    - `npm run lint` (passed).
    - `npx tsc --noEmit` (passed).

## Detail.design 92-Item Applicability Review

### Checklist
- [x] Pull full current detail catalog from `https://detail.design/sitemap.xml`.
- [x] Build per-item matrix for all 92 `/detail/*` entries.
- [x] Score each item for Autobazar123 as `Adopt now`, `Backlog`, or `Skip for now`.
- [x] Mark current implementation status (`Implemented`, `Partial`, `Not implemented`).
- [x] Produce actionable shortlist of first implementation batch.

### Review
- Status: Complete
- Notes:
  - Source of truth: `docs/detail-design-92-applicability.md`.
  - Coverage: 92/92 detail entries.
  - Recommendation split:
    - Adopt now: 30
    - Backlog: 40
    - Skip for now: 22
  - Current repo status estimate:
    - Implemented: 2
    - Partial: 8
    - Not implemented: 82

## Detail.design Adopt-Now Rollout

### Checklist
- [x] Promote `docs/detail-design-92-applicability.md` to permanent design manual format with explicit `Adopt now` and `Backlog` canonical sections.
- [x] Implement navigation/state/microinteraction adopt-now rules (`footer active state`, `dynamic enter role`, `active item visibility`, `scroll landmark`).
- [x] Implement accessibility/input adopt-now rules (`label-focus integrity`, `larger hit areas`, `default focus ring`, `paste with intent`, `CJK handling`).
- [x] Implement motion/loading/error adopt-now rules (`modal close physics`, `interruptible animation`, `reduced animation`, `interactive 404`, `interactive error`, `self-explanatory loading`).
- [x] Implement content/layout adopt-now rules (`problematic content warning`, `outer/inner radius consistency`, `overscroll nested scrollers`, `text overflow cutoff`, `respect brand name`).
- [x] Re-run UI and type/lint verification and capture objective outputs.

### Review
- Status: Complete
- Notes:
  - User approved implementing all current `Adopt now` details and keeping both `Adopt now` and `Backlog` permanently documented.
  - Permanent manual updates:
    - Added `Design Manual Usage`, `Canonical Adopt Now List (30)`, and `Canonical Backlog List (40)` to `docs/detail-design-92-applicability.md`.
  - Adopt-now implementation changes (system + key UX flows):
    - `active-state-also-works-in-footer`: active footer link marker + `aria-current` in `src/components/Footer.tsx`.
    - `dynamic-role-of-enter-key`, `handle-cjk-input-method-differently`, `keep-entry-of-active-view-visible`, `paste-with-intent`, `reduced-animation-for-frequently-used-feature`:
      - implemented in `src/components/search/SearchResultsSearchBox.tsx`.
    - `clicking-the-input-label-focus-the-input-field`:
      - robust label-control wiring via `FormField` auto-id in `src/components/ui/FormField.tsx`.
    - `larger-hit-area-than-it-appears`, `tooltip-in-a-group`, `text-overflow-cutoff`, `pre-filled-with-example-content-not-empty`, `form-respects-keyboard`:
      - applied on key detail interactions in `src/app/auto/[id]/CarDetailClient.tsx`.
    - `keep-default-focus-ring`, `interruptible-animation`, `outer-and-inner-border-radius`, `overscroll-nested-scrollers`, `fade-edge-doesnt-override-scrollbar`, `anchored-scrolling`:
      - added global utilities and behavior in `src/app/globals.css`.
    - `interactive-404-page`: new `src/app/not-found.tsx`.
    - `interactive-error-page`: upgraded `src/app/error.tsx`.
    - `self-explanatory-load-bar`: new `src/app/loading.tsx`.
    - `scroll-landmark` and `respect-brand-name`: updated `src/app/layout.tsx` + new `src/config/brand.ts`.
    - `check-potential-problem-in-user-content`: content-risk warning + paste normalization in `src/components/wizard/steps/Step4Details.tsx` with helper `src/lib/content-safety.ts`.
    - `avoid-using-webp-for-og`: OG normalization helper `src/lib/seo/og-image.ts` wired in `src/app/auto/[id]/page.tsx`.
    - `closing-modal-respect-physics`: smoother close/open modal transitions in `src/components/ui/shadcn/dialog.tsx` and `src/components/ui/shadcn/modal.tsx`.
  - Verification evidence:
    - `npm run lint` (passed).
    - `npx tsc --noEmit` (passed).
    - `npm run test:web-interface` (passed).
    - `npm run test:ui-qa` (passed).
    - `npm run test:unit` (passed, 97/97).
    - `npm run test:workflow-check` (passed).
