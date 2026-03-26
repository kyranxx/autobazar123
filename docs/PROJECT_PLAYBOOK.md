# Autobazar123 Project Playbook

Last updated: 2026-03-02

This is the reference playbook for how this repo is built, what is implemented, and which quality/security rules we enforce.

For local agent behavior, `AGENTS.md` is the only always-on policy. This playbook is reference material plus release/CI policy.

## Local Agent Operating Model

- Default local work stays lightweight: targeted technical verification, no default push/deploy, and no always-on tracking or lessons files.
- For UI work, the user verifies visuals on `localhost` and the agent verifies non-visual technical correctness in the touched area.
- Task-specific skills stay task-scoped and auto-activate only when the touched area needs them.
- Release/CI docs and gates remain authoritative for ship-ready work.

## 1) Product Scope

- Marketplace web app for vehicle listings.
- Main journeys:
  - Browse/search listings.
  - View listing detail.
  - Register/login/reset password.
  - Add and manage listings.
  - Pay for listing actions and manage dealer prepaid balance.
- Admin and dealer flows are protected by RBAC.

## 2) Core Stack

- Framework: Next.js (App Router), React, TypeScript.
- Styling/UI: Tailwind CSS, shadcn-based components, Lucide icons.
- Data/Auth: Supabase (auth, DB, RLS).
- Search: Algolia.
- Payments: Stripe.
- Email delivery: Resend transactional sender.
- Email templates: React Email.
- Cron orchestration: Vercel Cron.
- Product analytics: consent-aware first-party analytics with optional GA4 / PostHog transport.
- Testing:
  - Unit: Vitest.
  - UI/e2e/gates: Playwright.

## 3) Key Implemented Systems

- Auth UX hardening:
  - Register existing-user behavior.
  - Resend confirmation action.
  - Password reset flow.
- Auth email pipeline:
  - Register confirmation and password reset now sent via API endpoints + React Email templates.
- Site-wide UI quality gates:
  - Semantic/accessibility checks for `main`, `h1`, labeled controls, image `alt`.
- Production postdeploy smoke:
  - waits for health, retries smoke once, and fails loudly without auto-reverting commits.
- Detail.design implementation:
  - Canonical `Adopt now` list in `docs/detail-design-92-applicability.md` (deferred items are archived/non-active).
- SEO baseline:
  - Matrix and tranche in `docs/seo-implementation-matrix.md`.
- Analytics governance baseline:
  - Typed taxonomy and consent-aware helpers in `src/lib/analytics/events.ts`.
  - Process documentation in `docs/analytics-governance.md`.

## 4) Security Baseline

- Stripe signature verification.
- RLS and server-side RBAC checks.
- Maintenance bypass token signing/verification.
- Timing-safe maintenance password comparison.
- Sanitization via `sanitize-html`.
- Strict rate limit behavior for sensitive operations.
- Generic proxy rate limit now configured to fail closed in production when limiter is unavailable.
- Proxy response metadata leakage removed (`X-User-ID`, `X-Client-IP` no longer exposed).
- Production/predeploy Redis env guard prevents deploying fail-closed proxy rate limiting without required Upstash credentials.
- Algolia sync endpoint uses dedicated auth secret (`ALGOLIA_SYNC_SECRET`) instead of admin API key reuse.
- Vercel cron routes enforce secret validation before execution.
- Scheduled GitHub quality-alert workflows support OIDC-authenticated webhook posts (with shared-secret fallback during migration).
- GitHub Actions OIDC is the preferred CI identity mechanism for scheduled monitoring webhook calls.
- Release security gate is enforced by:
  - `npm run check:framework-patch-posture` (fails when `next`/`react`/`react-dom` lag beyond allowed patch windows)
  - `npm run check:github-actions-oidc-posture` (fails when quality-alert workflows lose required OIDC markers)
  - `npm run check:prod-rate-limit-env` (fails production-target deploys when required Upstash vars are missing)
  - `npm run test:security:release-gate` (policy + required validation commands)
  - `.github/workflows/release-security-gate.yml` on pull requests and pushes to protected branches.

### Security Top-10 Defaults (Non-Conflicting Baseline)

Use this as a standing checklist for API/auth/payment/search changes:

1. Broken access control:
   - Enforce auth on every sensitive route and deny by default.
2. Security misconfiguration:
   - Keep defaults minimal, remove unnecessary features, avoid verbose prod errors.
3. Supply-chain risk:
   - Pin dependencies and run security checks before release.
4. Cryptographic failures:
   - Use vetted algorithms/libraries, never custom crypto primitives.
5. Injection:
   - Validate inputs and use safe query builders/parameterization.
6. Insecure design:
   - Threat-model critical flows before implementation.
7. Authentication/session failures:
   - Strong password policy, secure token handling, explicit session controls.
8. Integrity failures:
   - Verify trusted inputs/artifacts and protect update/sync paths.
9. Logging/monitoring failures:
   - Log auth/security events and ensure alertable signal exists.
10. Exception-handling failures:
   - Fail closed where possible and avoid leaking sensitive internals in errors.

Operational enforcement remains:

- `npm run check:framework-patch-posture`
- `npm run check:github-actions-oidc-posture`
- `npm run test:security:release-gate`
- Reference checklist doc: `docs/security-top-10-defaults.md`

## 5) UI/UX Rules and Gates

- Gate docs:
  - `docs/web-interface-guidelines-checklist.md`
  - `docs/accessibility-testing-playbook.md`
  - `docs/ui-ux-pro-max-protocol.md`
  - `docs/ui-skills-review-pass.md`
  - `docs/codex-workflow-checklist.md`
- Test commands:
  - `npm run test:web-interface`
  - `npm run test:a11y`
  - `npm run test:keyboard`
  - `npm run test:mobile-matrix`
  - `npm run test:ui-quality-gate`
- Site-wide route coverage behavior:
  - Default: curated routes only (fast).
  - Extended: `WEB_INTERFACE_INCLUDE_DISCOVERED_ROUTES=true`.

## 6) Email Architecture

- Sender abstraction:
  - `src/lib/email/transactional-email.ts`
- React Email templates:
  - `src/lib/email/react-email-templates.tsx`
- Payment email senders:
  - `src/lib/email/send-payment-confirmation.ts`
- Auth email senders:
  - `src/lib/email/send-auth-emails.ts`
- Auth email API routes:
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/auth/register/resend/route.ts`
  - `src/app/api/auth/password-reset/route.ts`

## 7) External Services and Required Env Keys

- Supabase:
  - Public:
    - `NEXT_PUBLIC_SUPABASE_URL` (`https://<project-ref>.supabase.co` by default, or your branded Supabase custom domain after activation)
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN` (recommended in local dev, e.g. `http://localhost:3000`)
  - Secret:
    - `SUPABASE_SERVICE_ROLE_KEY`
- Maintenance bypass:
  - `MAINTENANCE_UNLOCK_PASSWORD`
- Email provider:
  - `EMAIL_FROM`
  - `EMAIL_REPLY_TO`
  - `RESEND_API_KEY`
- Stripe:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Algolia:
  - Public:
    - `NEXT_PUBLIC_ALGOLIA_APP_ID`
    - `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`
  - Secret:
    - `ALGOLIA_ADMIN_KEY`
    - `ALGOLIA_SYNC_SECRET`
- Upstash rate limiting:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Cloudflare uploads:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`
  - Optional hardening: `CLOUDFLARE_IMAGES_REQUIRE_SIGNED_URLS=true`
- European VIN decoder:
  - `VINCARIO_API_KEY`
  - `VINCARIO_SECRET_KEY`
- Optional analytics transports:
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`
- GitHub quality-alert ingest auth:
  - `QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES` (required for OIDC mode; comma-separated `owner/repo` list)
  - Optional: `QUALITY_GATE_ALERT_OIDC_AUDIENCE` (default: `autobazar123-quality-gates`)
  - Optional migration fallback: `QUALITY_GATE_ALERT_SECRET` (or `CRON_SECRET`)

### Rate-Limit Reliability Runbook (Prod Guard + Alerts)

- Build/deploy guard:
  - `npm run check:prod-rate-limit-env` runs automatically in `npm run build`.
  - The guard enforces vars only for production-target deploys (`RELEASE_ENV=production`, `SECURITY_RELEASE_TARGET=production`, `VERCEL_ENV=production`, or `CHECK_PROD_RATE_LIMIT_ENV=true`).
- Failure signal:
  - Guard exits non-zero with `RATE LIMIT ENV CHECK FAILED` and lists missing variables.
- Required response:
  1. Add missing `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to the production environment.
  2. Re-run `npm run check:prod-rate-limit-env`.
  3. Re-run `npm run test:security:release-gate` before retrying deployment.
- Alert note:
  - Treat missing production rate-limit env vars as release-blocking because proxy/authenticated routes fail closed and can produce widespread `429` responses.

### OAuth Redirect Notes (Local Dev)

- For Google OAuth to return to local app instead of production, Supabase Auth redirect allow-list must include:
  - `http://localhost:3000/auth/callback`
  - `http://127.0.0.1:3000/auth/callback` (if used)
  - `http://localhost:3000/auth/reset-password`
  - `http://127.0.0.1:3000/auth/reset-password` (if used)

## 8) Working Commands

- Local dev: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Unit tests: `npm run test:unit`
- Analytics taxonomy test: `npx vitest run src/lib/analytics/events.test.ts`
- Web interface gates: `npm run test:web-interface`
- Accessibility gates (axe/reflow): `npm run test:a11y`
- Keyboard-only journeys: `npm run test:keyboard`
- Mobile matrix accessibility/reflow: `npm run test:mobile-matrix`
- UI QA aggregate: `npm run test:ui-quality-gate`
- Release gauntlet: `npm run test:release-gauntlet`
- Webapp audit: `npm run audit:webapp`
- Framework patch posture: `npm run check:framework-patch-posture`
- Security release gate: `npm run test:security:release-gate`
- Production env guard: `npm run check:prod-rate-limit-env`
- Links ingestion: `npm run links:ingest`
- Agent benchmark suite list/init:
  - `npm run bench:agent:list`
  - `npm run bench:agent:init`

### Codex / Tooling-Only Validation

Run these only when changing repo automation, Codex workflow docs, or tooling contracts:

- `npm run test:workflow-check`
- `npm run test:agent-contract`
- `npm run test:skill-graph`
- `npm run test:model-check`
- `npm run test:codex-cli-check`

## 9) Resource Policy

- `LINKS.md` is research input, not operating policy.
- Local agent policy lives in `AGENTS.md`. Release and operational policy live in docs and enforced gates.
- If new resources are adopted, update this playbook and relevant gate docs in same change.

## 10) Resource Radar (Codex / AI Tooling)

- OpenAI Codex prompting guide:
  - `https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/`
  - Keep using structured requests with scope, constraints, and verification expectations.
- OpenAI community best-practices thread:
  - `https://community.openai.com/t/best-practices-for-using-codex/1373143`
  - Periodically sync workflow guard rules from this thread.
- Awesome Codex skills list:
  - `https://github.com/ComposioHQ/awesome-codex-skills`
  - Use as optional inspiration; only adopt skills with clear repo fit.
- Official Codex skills guide:
  - `https://developers.openai.com/codex/skills/`
  - Preferred reference for creating/updating local skills.
- Official Codex CLI repository:
  - `https://github.com/openai/codex`
  - Track releases and breaking changes for local agent workflow compatibility.
