# Autobazar123

Autobazar123 is a Slovak car marketplace built with Next.js, Supabase, Algolia, Stripe, and Resend. The app covers listing discovery, vehicle detail pages, user accounts, dealer/admin flows, saved searches, inquiries, direct EUR listing payments for private sellers, and prepaid dealer balance actions.

## Local run

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the required environment variables listed below.

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test:unit
npm run test:web-interface
npm run test:a11y
npm run test:keyboard
npm run test:mobile-matrix
npm run test:ui-quality-gate
npm run test:release-gauntlet
npm run audit:chrome-console
```

## Folder structure

```text
src/
  app/                  Next.js routes, layouts, route handlers
  components/           UI and route-level client components
  config/               Shared app constants and domain config
  context/              React context providers
  i18n/                 locale config and translation catalogs
  lib/                  server/client domain logic by concern
  types/                shared TypeScript types
  utils/                small framework-agnostic helpers

supabase/
  migrations/           checked-in schema changes
  tests/                pgTAP / database tests

scripts/                one-off tooling, audits, maintenance scripts
tests/                  Playwright end-to-end and quality-gate tests
docs/                   project playbooks and operating docs
tasks/                  task-specific working briefs when explicitly tracked
```

## Environment variables

### Core app

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN`

### Algolia

- `NEXT_PUBLIC_ALGOLIA_APP_ID`
- `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`
- `ALGOLIA_ADMIN_KEY`
- `ALGOLIA_SYNC_SECRET`

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Email

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`

### Rate limiting

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Cloudflare Images

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_IMAGES_REQUIRE_SIGNED_URLS`

### European VIN decoder

- `VINCARIO_API_KEY`
- `VINCARIO_SECRET_KEY`

### Maintenance / operational security

- `MAINTENANCE_UNLOCK_PASSWORD`
- `CRON_SECRET`
- `QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES`
- `QUALITY_GATE_ALERT_OIDC_AUDIENCE`
- `QUALITY_GATE_ALERT_SECRET`

## Notes

- Search state and inventory pages rely on Algolia.
- Auth, account data, and most persistence rely on Supabase.
- Billing checkout and webhook processing rely on Stripe.
- Transactional emails rely on Resend.
- Local agent behavior lives in `AGENTS.md`.
- The main operator docs live in `docs/PROJECT_PLAYBOOK.md`.
