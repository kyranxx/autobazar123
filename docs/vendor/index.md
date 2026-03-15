# Vendor Docs Pack

Generated: 2026-02-23T21:50:16.734Z

This folder contains a curated local docs pack for technologies and services used in this repository.

## Stack Inventory

| Technology/Service | Category | Packages | Repo Evidence |
|---|---|---|---|
| Supabase | External Service | @supabase/supabase-js (^2.89.0), @supabase/ssr (^0.8.0) | src/lib/supabase/client.ts, src/lib/supabase/server.ts, supabase/config.toml |
| Algolia | External Service | algoliasearch (^5.46.3), react-instantsearch (^7.22.1), react-instantsearch-nextjs (^1.0.15) | src/lib/algolia/index.ts, src/app/vysledky/AlgoliaSearchPageClient.tsx, scripts/setup-algolia.ts |
| Stripe | External Service | stripe (^20.1.1) | src/app/api/stripe/checkout/route.ts, src/app/api/stripe/webhook/route.ts |
| Cloudflare Workers | Infrastructure | wrangler (^3), @cloudflare/workers-types (^4) | cloudflare-worker/src/index.ts, cloudflare-worker/wrangler.toml |
| Cloudflare Images | External Service | - | src/app/api/images/upload-url/route.ts, src/lib/image-optimizer.ts |
| Vercel | Infrastructure | - | vercel.json, README.md |
| Upstash Redis/Ratelimit | External Service | @upstash/redis (^1.36.1), @upstash/ratelimit (^2.0.8) | src/lib/ratelimit.ts |
| Resend | External Service | - | src/lib/email/transactional-email.ts |
| Google Identity Services | External Service | - | src/components/GoogleOneTap.tsx, src/lib/security/csp.ts |
| Next.js | Framework | next (^16.1.6) | next.config.ts, src/app |
| React | Framework | react (19.2.3), react-dom (19.2.3) | src/app, src/components |
| TypeScript | Language Tooling | typescript (^5) | tsconfig.json, src |
| Tailwind CSS | Framework Tooling | tailwindcss (^4), @tailwindcss/postcss (^4) | postcss.config.mjs, src/app/globals.css |
| next-intl | Framework Tooling | next-intl (^4.7.0) | src/i18n, src/app/[locale] |
| Playwright | Testing Tooling | @playwright/test (^1.57.0) | playwright.config.ts, tests |
| Vitest | Testing Tooling | vitest (^4.0.0) | vitest.config.ts, src/**/*.test.ts* |

## Download Status

| Technology/Service | Downloaded | Planned | Folder |
|---|---:|---:|---|
| Supabase | 4 | 4 | docs/vendor/supabase/ |
| Algolia | 4 | 4 | docs/vendor/algolia/ |
| Stripe | 4 | 4 | docs/vendor/stripe/ |
| Cloudflare Workers | 3 | 3 | docs/vendor/cloudflare-workers/ |
| Cloudflare Images | 3 | 3 | docs/vendor/cloudflare-images/ |
| Vercel | 3 | 3 | docs/vendor/vercel/ |
| Upstash Redis/Ratelimit | 3 | 3 | docs/vendor/upstash/ |
| Resend | 3 | 3 | docs/vendor/resend/ |
| Google Identity Services | 3 | 3 | docs/vendor/google-identity-services/ |
| Next.js | 4 | 4 | docs/vendor/nextjs/ |
| React | 3 | 3 | docs/vendor/react/ |
| TypeScript | 3 | 3 | docs/vendor/typescript/ |
| Tailwind CSS | 3 | 3 | docs/vendor/tailwindcss/ |
| next-intl | 3 | 3 | docs/vendor/next-intl/ |
| Playwright | 3 | 3 | docs/vendor/playwright/ |
| Vitest | 3 | 3 | docs/vendor/vitest/ |

## Source Index

### Supabase

- Getting started: [source](https://supabase.com/docs/guides/getting-started) -> [local](supabase/01-docs-guides-getting-started.html) (HTTP 200)
- Auth guides: [source](https://supabase.com/docs/guides/auth) -> [local](supabase/02-docs-guides-auth.html) (HTTP 200)
- RLS guide: [source](https://supabase.com/docs/guides/database/postgres/row-level-security) -> [local](supabase/03-docs-guides-database-postgres-row-level-security.html) (HTTP 200)
- JavaScript client: [source](https://supabase.com/docs/reference/javascript/introduction) -> [local](supabase/04-docs-reference-javascript-introduction.html) (HTTP 200)

### Algolia

- What is Algolia: [source](https://www.algolia.com/doc/guides/getting-started/what-is-algolia/) -> [local](algolia/01-doc-guides-getting-started-what-is-algolia.html) (HTTP 200)
- JavaScript API client: [source](https://www.algolia.com/doc/libraries/javascript/v5/getting-started/install/) -> [local](algolia/02-doc-libraries-javascript-v5-getting-started-install.html) (HTTP 200)
- React InstantSearch: [source](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/) -> [local](algolia/03-doc-guides-building-search-ui-what-is-instantsearch-react.html) (HTTP 200)
- API key security: [source](https://www.algolia.com/doc/guides/security/api-keys/) -> [local](algolia/04-doc-guides-security-api-keys.html) (HTTP 200)

### Stripe

- Checkout: [source](https://docs.stripe.com/payments/checkout) -> [local](stripe/01-payments-checkout.html) (HTTP 200)
- Checkout session API: [source](https://docs.stripe.com/api/checkout/sessions/create) -> [local](stripe/02-api-checkout-sessions-create.html) (HTTP 200)
- Webhooks overview: [source](https://docs.stripe.com/webhooks) -> [local](stripe/03-webhooks.html) (HTTP 200)
- Webhook signatures: [source](https://docs.stripe.com/webhooks/signature) -> [local](stripe/04-webhooks-signature.html) (HTTP 200)

### Cloudflare Workers

- Workers docs: [source](https://developers.cloudflare.com/workers/) -> [local](cloudflare-workers/01-workers.html) (HTTP 200)
- Cron triggers: [source](https://developers.cloudflare.com/workers/configuration/cron-triggers/) -> [local](cloudflare-workers/02-workers-configuration-cron-triggers.html) (HTTP 200)
- Wrangler docs: [source](https://developers.cloudflare.com/workers/wrangler/) -> [local](cloudflare-workers/03-workers-wrangler.html) (HTTP 200)

### Cloudflare Images

- Images docs: [source](https://developers.cloudflare.com/images/) -> [local](cloudflare-images/01-images.html) (HTTP 200)
- Direct creator upload: [source](https://developers.cloudflare.com/images/upload-images/direct-creator-upload/) -> [local](cloudflare-images/02-images-upload-images-direct-creator-upload.html) (HTTP 200)
- Image transformations: [source](https://developers.cloudflare.com/images/transform-images/) -> [local](cloudflare-images/03-images-transform-images.html) (HTTP 200)

### Vercel

- Vercel docs: [source](https://vercel.com/docs) -> [local](vercel/01-docs.html) (HTTP 200)
- Cron jobs: [source](https://vercel.com/docs/cron-jobs) -> [local](vercel/02-docs-cron-jobs.html) (HTTP 200)
- Functions: [source](https://vercel.com/docs/functions) -> [local](vercel/03-docs-functions.html) (HTTP 200)

### Upstash Redis/Ratelimit

- Redis getting started: [source](https://upstash.com/docs/redis/overall/getstarted) -> [local](upstash/01-docs-redis-overall-getstarted.html) (HTTP 200)
- TypeScript SDK: [source](https://upstash.com/docs/redis/sdks/ts/gettingstarted) -> [local](upstash/02-docs-redis-sdks-ts-gettingstarted.html) (HTTP 200)
- Ratelimit SDK: [source](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) -> [local](upstash/03-docs-redis-sdks-ratelimit-ts-overview.html) (HTTP 200)

### Resend

- Introduction: [source](https://resend.com/docs/introduction) -> [local](resend/01-docs-introduction.html) (HTTP 200)
- Node.js sending: [source](https://resend.com/docs/send-with-nodejs) -> [local](resend/02-docs-send-with-nodejs.html) (HTTP 200)
- Emails API: [source](https://resend.com/docs/api-reference/emails/send-email) -> [local](resend/03-docs-api-reference-emails-send-email.html) (HTTP 200)

### Google Identity Services

- Overview: [source](https://developers.google.com/identity/gsi/web/guides/overview) -> [local](google-identity-services/01-identity-gsi-web-guides-overview.html) (HTTP 200)
- Display button: [source](https://developers.google.com/identity/gsi/web/guides/display-button) -> [local](google-identity-services/02-identity-gsi-web-guides-display-button.html) (HTTP 200)
- Verify ID token: [source](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) -> [local](google-identity-services/03-identity-gsi-web-guides-verify-google-id-token.html) (HTTP 200)

### Next.js

- Next.js docs: [source](https://nextjs.org/docs) -> [local](nextjs/01-docs.html) (HTTP 200)
- App Router: [source](https://nextjs.org/docs/app) -> [local](nextjs/02-docs-app.html) (HTTP 200)
- Route handlers: [source](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) -> [local](nextjs/03-docs-app-building-your-application-routing-route-handlers.html) (HTTP 200)
- Authentication: [source](https://nextjs.org/docs/app/guides/authentication) -> [local](nextjs/04-docs-app-guides-authentication.html) (HTTP 200)

### React

- Learn React: [source](https://react.dev/learn) -> [local](react/01-learn.html) (HTTP 200)
- React reference: [source](https://react.dev/reference/react) -> [local](react/02-reference-react.html) (HTTP 200)
- React DOM reference: [source](https://react.dev/reference/react-dom) -> [local](react/03-reference-react-dom.html) (HTTP 200)

### TypeScript

- Handbook intro: [source](https://www.typescriptlang.org/docs/handbook/intro.html) -> [local](typescript/01-docs-handbook-intro.html) (HTTP 200)
- Everyday types: [source](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) -> [local](typescript/02-docs-handbook-2-everyday-types.html) (HTTP 200)
- Modules: [source](https://www.typescriptlang.org/docs/handbook/modules.html) -> [local](typescript/03-docs-handbook-modules.html) (HTTP 200)

### Tailwind CSS

- Next.js setup: [source](https://tailwindcss.com/docs/installation/framework-guides/nextjs) -> [local](tailwindcss/01-docs-installation-framework-guides-nextjs.html) (HTTP 200)
- Utility classes: [source](https://tailwindcss.com/docs/styling-with-utility-classes) -> [local](tailwindcss/02-docs-styling-with-utility-classes.html) (HTTP 200)
- Theme variables: [source](https://tailwindcss.com/docs/theme) -> [local](tailwindcss/03-docs-theme.html) (HTTP 200)

### next-intl

- App Router setup: [source](https://next-intl.dev/docs/getting-started/app-router) -> [local](next-intl/01-docs-getting-started-app-router.html) (HTTP 200)
- Translations usage: [source](https://next-intl.dev/docs/usage/translations) -> [local](next-intl/02-docs-usage-translations.html) (HTTP 200)
- Configuration: [source](https://next-intl.dev/docs/usage/configuration) -> [local](next-intl/03-docs-usage-configuration.html) (HTTP 200)

### Playwright

- Playwright intro: [source](https://playwright.dev/docs/intro) -> [local](playwright/01-docs-intro.html) (HTTP 200)
- Assertions: [source](https://playwright.dev/docs/test-assertions) -> [local](playwright/02-docs-test-assertions.html) (HTTP 200)
- Trace viewer: [source](https://playwright.dev/docs/trace-viewer) -> [local](playwright/03-docs-trace-viewer.html) (HTTP 200)

### Vitest

- Vitest guide: [source](https://vitest.dev/guide/) -> [local](vitest/01-guide.html) (HTTP 200)
- Vitest features: [source](https://vitest.dev/guide/features) -> [local](vitest/02-guide-features.html) (HTTP 200)
- Mocking: [source](https://vitest.dev/guide/mocking) -> [local](vitest/03-guide-mocking.html) (HTTP 200)



