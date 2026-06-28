# Vercel Environment Variable Audit

Checked on 2026-04-14 using `vercel env ls` plus repo usage search.
Refreshed on 2026-06-20 for canonical URL envs using `vercel env ls` and temporary `vercel env pull` snapshots.
Refreshed on 2026-06-21 with secret-safe metadata and pull-readability gates using a pinned modern Vercel CLI path:
`npm run check:vercel-env-names` now blocks for Preview and Production because Turnstile env names are missing, and
`npm run check:vercel-env-values` passed after the checker was corrected for
Vercel sensitive variables: the Upstash URL is pull-readable and non-empty,
and `UPSTASH_REDIS_REST_TOKEN` exists in metadata with `type=sensitive`.

Safe cleanup applied on 2026-04-14:

- Removed `FLAGS`
- Removed `FLAGS_SECRET`
- Removed `UPSTASH_REDIS_REST_KV_REST_API_READ_ONLY_TOKEN`
- Removed `UPSTASH_REDIS_REST_REDIS_URL`
- Removed `UPSTASH_REDIS_REST_KV_REST_API_URL`
- Removed `UPSTASH_REDIS_REST_KV_URL`
- Removed `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`
- Removed `REDIS_URL`

## Summary

- Keep: 25
- Optional but valid: 3
- Likely removable: 10
- Current metadata gate: Preview and Production are missing the two required
  Turnstile env names checked by `npm run check:vercel-env-names`:
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
- Current local pull-value/sensitive-metadata gate: Preview and Production pass
  `npm run check:vercel-env-values`; the checker verifies the pull-readable
  Upstash URL value and verifies `UPSTASH_REDIS_REST_TOKEN` by sensitive
  metadata instead of incorrectly requiring the token in local env-pull output.
  Cloud runtime smoke is still required because sensitive values are intentionally
  non-readable after creation.

## Table

| Variable | Vercel scope | Keep? | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Keep | Public Supabase project URL used by client, server, proxy, auth, and sitemap code. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Keep | Public Supabase anon key used by browser auth and proxy-side session checks. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Keep | Server-only Supabase admin key used by admin actions, Stripe flows, email jobs, Algolia sync, and maintenance checks. |
| `NEXT_PUBLIC_APP_URL` | Production, Preview | Keep | Canonical app URL used for Stripe redirects, CSRF/origin checks, and absolute link generation. |
| `STRIPE_SECRET_KEY` | Production, Preview | Keep | Stripe server API key used for checkout creation and webhook processing. |
| `STRIPE_WEBHOOK_SECRET` | Production, Preview | Keep | Verifies incoming Stripe webhook signatures. |
| `RESEND_API_KEY` | Production, Preview | Keep | API key for sending transactional emails through Resend. |
| `EMAIL_FROM` | Production, Preview | Keep | Default sender address for transactional emails. |
| `EMAIL_REPLY_TO` | Production, Preview | Keep | Reply-to address added to outgoing emails. |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | Production, Preview | Keep | Public Algolia app ID used by the search UI and Algolia setup/sync scripts. |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` | Production, Preview, Development | Keep | Public Algolia search-only key used by the browser search experience. |
| `ALGOLIA_ADMIN_KEY` | Production, Preview | Keep | Server/admin Algolia key used for index writes and maintenance scripts. |
| `ALGOLIA_SYNC_SECRET` | Production, Preview | Keep | Shared secret that protects the `/api/algolia/sync` endpoint. |
| `UPSTASH_REDIS_REST_URL` | Production, Preview, Development | Keep | Upstash REST URL used by the live rate limiter. |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview, Development | Keep | Upstash REST token used by the live rate limiter. |
| `CRON_SECRET` | Production, Preview, Development | Keep | Secret that protects cron-style internal routes, including quality-gate alerts fallback auth. |
| `QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES` | Production, Preview, Development | Keep | Comma-separated GitHub repo allowlist for GitHub Actions OIDC quality-gate alerts. |
| `MAINTENANCE_UNLOCK_PASSWORD` | Production | Keep for now | Password used by the maintenance unlock API while the site is still maintenance-gated. |
| `MAINTENANCE_BYPASS_SECRET` | Production | Keep for now | Secret used to sign the maintenance bypass cookie after a successful unlock. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Production, Preview, Development | Optional | Public PostHog key used by analytics runtime and first-party event forwarding. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Production, Preview, Development | Optional | PostHog host used by analytics runtime and first-party event forwarding. |
| `GITHUB_TOKEN` | Production | Optional | Used by the admin quality-gates page to query GitHub Actions with better rate limits. |
| `CLOUDFLARE_ACCOUNT_ID` | Production, Preview, Development | Keep | Cloudflare account ID used by the image upload API and Cloudflare image migration scripts. |
| `CLOUDFLARE_API_TOKEN` | Production, Preview, Development | Keep | Cloudflare API token used by the image upload API and Cloudflare image migration scripts. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Production, Preview | Keep | Public Cloudflare Turnstile sitekey used by buyer inquiry and listing-report captcha widgets. |
| `TURNSTILE_SECRET_KEY` | Production, Preview | Keep | Server-only Cloudflare Turnstile secret used by Siteverify for inquiry and listing-report submission protection. |
| `NEXT_PUBLIC_GITHUB_REPOSITORY` | Production | Likely removable | Repository override for the admin quality-gates page, but the code can already infer repo from Vercel git metadata. |
| `QUALITY_GATE_ALERT_OIDC_AUDIENCE` | Production, Preview, Development | Likely removable | Custom OIDC audience override, but workflows and server code already use the default `autobazar123-quality-gates`. |
| `FLAGS` | Production, Preview, Development | Likely removable | No repo code reads this Vercel Flags payload. |
| `FLAGS_SECRET` | Production, Preview, Development | Likely removable | No repo code reads this Vercel Flags secret. |
| `UPSTASH_REDIS_REST_KV_REST_API_READ_ONLY_TOKEN` | Production, Preview, Development | Likely removable | Upstash integration alias that is not read anywhere in this repo. |
| `UPSTASH_REDIS_REST_REDIS_URL` | Production, Preview, Development | Likely removable | Upstash integration alias that is not read anywhere in this repo. |
| `UPSTASH_REDIS_REST_KV_REST_API_URL` | Production, Preview, Development | Likely removable | Upstash integration alias that is not read anywhere in this repo. |
| `UPSTASH_REDIS_REST_KV_URL` | Production, Preview, Development | Likely removable | Upstash integration alias that is not read anywhere in this repo. |
| `UPSTASH_REDIS_REST_KV_REST_API_TOKEN` | Production, Preview, Development | Likely removable | Upstash integration alias that is not read anywhere in this repo. |
| `REDIS_URL` | Production, Preview, Development | Likely removable | Generic Redis URL alias that is not read anywhere in this repo. |
| `NEXT_PUBLIC_CLARITY_ID` | Production, Preview, Development | Likely removable | No Microsoft Clarity initialization code currently reads this variable. |

## Notes

- I found real runtime usage for the core Supabase, Stripe, email, Algolia, Redis, cron, maintenance, GitHub quality-gate, PostHog, and Cloudflare image variables.
- 2026-06-20 refresh: Production previously had `NEXT_PUBLIC_APP_URL` pointed at the apex host with a literal line-ending escape, and Preview had a blank value. Both were overwritten to `https://www.autobazar123.sk` and verified by fresh temporary pulls. No deploy was run.
- 2026-06-21 refresh: `npm run test:vercel-env-names-script` passed 8/8
  after Turnstile env names were added to the metadata gate. Real
  `npm run check:vercel-env-names` now blocks without pulling or printing
  secrets because Preview and Production are missing
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
- 2026-06-21 refresh: `npm run test:vercel-env-values-script` passed 12/12 and
  `npm run check:vercel-env-values` passed for Preview and Production without
  printing secret values. Temp files are deleted after inspection. The report
  still marks `runtimeSmokeStillRequired=UPSTASH_REDIS_REST_TOKEN`.
- I did not find any repo usage for the Vercel Flags variables, the extra Upstash alias variables, `REDIS_URL`, or `NEXT_PUBLIC_CLARITY_ID`.
- Turnstile server validation now checks successful Siteverify responses against the expected widget action and request hostname when those response fields are present; in production, missing response fields fail closed.
- `NEXT_PUBLIC_GITHUB_REPOSITORY` looks redundant because the code falls back to `VERCEL_GIT_REPO_OWNER` and `VERCEL_GIT_REPO_SLUG`.
- `QUALITY_GATE_ALERT_OIDC_AUDIENCE` looks redundant because your workflows already request the default audience `autobazar123-quality-gates`, and the server accepts that default even without the env var.
- `MAINTENANCE_UNLOCK_PASSWORD` and `MAINTENANCE_BYPASS_SECRET` should stay until maintenance mode is removed.
