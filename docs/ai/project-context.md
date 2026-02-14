# Project Context

## Stack
- Next.js 16 (`next`, `react`, `react-dom`)
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Stripe (`stripe`)
- Algolia (`algoliasearch`, `react-instantsearch`)
- Cloudflare (worker folder and deploy script)

## Key Commands
- Install: `npm install`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Verify setup: `npm run verify`
- Build: `npm run build`
- E2E: `npm run test:e2e`
- Smoke: `npm run test:smoke`

## Important Integrations
- Algolia index: `ads` in `src/lib/algolia/index.ts`.
- Stripe: org-key + `Stripe-Context` account strategy is used.
- Cloudflare Images: requires a token with Cloudflare Images permissions.

## High-Risk Areas
- Auth and session logic under `src/app/auth/`.
- Payment flows and account billing code.
- Search indexing/sync behavior.
- Database migrations under `supabase/migrations/`.
- Production deploy scripts and worker changes.

## Safety
- Never expose values from `.env*` or environment variables.
- Mention env-var names only when confirming setup.
- For destructive operations, include a rollback path in the plan.
