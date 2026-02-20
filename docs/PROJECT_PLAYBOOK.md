# Autobazar123 Project Playbook

Last updated: 2026-02-19

This is the single source of truth for how this repo is built, what is implemented, and which quality/security rules we enforce.

## 1) Product Scope

- Marketplace web app for vehicle listings.
- Main journeys:
  - Browse/search listings.
  - View listing detail.
  - Register/login/reset password.
  - Add and manage listings.
  - Buy credits and manage account.
- Admin and dealer flows are protected by RBAC.

## 2) Core Stack

- Framework: Next.js (App Router), React, TypeScript.
- Styling/UI: Tailwind CSS, shadcn-based components, Lucide icons.
- Data/Auth: Supabase (auth, DB, RLS).
- Search: Algolia.
- Payments: Stripe.
- Email delivery: provider-agnostic transactional sender (`resend` / `sendgrid` / `mailgun`).
- Email templates: React Email.
- Edge/Cron: Cloudflare Worker.
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
- Detail.design implementation:
  - Canonical `Adopt now` list in `docs/detail-design-92-applicability.md` (backlog is archived/non-active).
- SEO baseline:
  - Matrix and tranche in `docs/seo-implementation-matrix.md`.

## 4) Security Baseline

- Stripe signature verification.
- RLS and server-side RBAC checks.
- Maintenance bypass token signing/verification.
- Timing-safe maintenance password comparison.
- Sanitization via `sanitize-html`.
- Strict rate limit behavior for sensitive operations.
- Generic proxy rate limit now configured to fail closed in production when limiter is unavailable.
- Proxy response metadata leakage removed (`X-User-ID`, `X-Client-IP` no longer exposed).
- Algolia sync endpoint uses dedicated auth secret (`ALGOLIA_SYNC_SECRET`) instead of admin API key reuse.
- Cloudflare manual cron trigger uses constant-time secret comparison.

## 5) UI/UX Rules and Gates

- Gate docs:
  - `docs/web-interface-guidelines-checklist.md`
  - `docs/ui-ux-pro-max-protocol.md`
  - `docs/ui-skills-review-pass.md`
  - `docs/codex-workflow-checklist.md`
  - `docs/codex-resource-adoption.md`
- Test commands:
  - `npm run test:web-interface`
  - `npm run test:ui-qa`
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
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Email provider (one active):
  - `EMAIL_PROVIDER`
  - `EMAIL_FROM`
  - `EMAIL_REPLY_TO`
  - `RESEND_API_KEY` or `SENDGRID_API_KEY` or (`MAILGUN_API_KEY` + `MAILGUN_DOMAIN`)
- Stripe:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Algolia:
  - `ALGOLIA_APP_ID`
  - `ALGOLIA_ADMIN_KEY`
  - `ALGOLIA_SYNC_SECRET`
- Upstash rate limiting:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Cloudflare uploads/worker:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`
  - Worker envs: `CRON_SECRET`, `SITE_URL`

## 8) Working Commands

- Local dev: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Unit tests: `npm run test:unit`
- Web interface gates: `npm run test:web-interface`
- UI QA aggregate: `npm run test:ui-qa`
- Workflow guard: `npm run test:workflow-check`
- Codex CLI availability check: `npm run test:codex-cli-check`
- Email smoke (register/reset/payment): `npm run test:email:smoke -- <recipient-email>`

## 9) Resource Policy

- `LINKS.md` is research input, not operating policy.
- Operational policy lives in docs and enforced gates.
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
