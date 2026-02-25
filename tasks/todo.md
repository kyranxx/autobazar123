# Active Todo

## Task: PROD search index-key mismatch on /vysledky (Now)

- [x] Reproduce and identify why `/vysledky` returns `Index not allowed with this API key`.
- [x] Add safe index-selection fallback so results page does not depend on unauthorized replica indices by default.
- [x] Support explicit base index override for production key/index restrictions.
- [x] Verify with lint, typecheck, and unit baseline commands.

## Review: PROD search index-key mismatch on /vysledky (Now)

- Status: Completed
- Notes:
  - Updated Algolia base index resolution:
    - `src/lib/algolia/index.ts` now reads `NEXT_PUBLIC_ALGOLIA_ADS_INDEX` and falls back to `ads`.
  - Hardened sort-index resolution:
    - `src/lib/algolia/sort-indices.ts` now uses base index for all sort options by default.
    - Replica index suffixes are used only when explicitly enabled via `NEXT_PUBLIC_ALGOLIA_ENABLE_REPLICA_SORT=true` (or per-sort explicit index overrides are present).
  - This removes unauthorized replica-index requests for restricted search keys and prevents `Index not allowed with this API key` in default production configuration.
- Verification:
  - `npm run lint` passed
  - `npx tsc --noEmit` passed
  - `npm run test:unit` passed (`35/35` files, `158/158` tests)

## Task: Frontpage mobile nav overflow + auth state fix (Now)

- [x] Prevent top-right nav actions from overflowing on small mobile widths.
- [x] Keep `/vysledky` directly accessible from frontpage nav.
- [x] Make frontpage auth action reflect real session state (show account/avatar when logged in, show login when logged out).
- [x] Verify with lint, typecheck, and unit baseline commands.

## Review: Frontpage mobile nav overflow + auth state fix (Now)

- Status: Completed
- Notes:
  - Updated `src/app/page.tsx` nav layout to fit mobile safely:
    - compact mobile brand label (`AB123`) and full brand text on `sm+`
    - converted mobile action buttons to compact icon-first controls to avoid overflow
    - kept `/vysledky` as a persistent nav action (icon on mobile, text on `sm+`)
  - Added auth-aware frontpage account control using `useAuth`:
    - loading state: neutral placeholder (no false login label)
    - logged-in state: avatar/initials button linking to `/moj-ucet`
    - logged-out state: `Prihlásiť sa` login button linking to `/auth/login?redirect=%2Fmoj-ucet`
  - Limited desktop `Admin` link visibility to authenticated admins.
- Verification:
  - `npm run lint` passed
  - `npx tsc --noEmit` passed
  - `npm run test:unit` passed (`35/35` files, `157/157` tests)
  - Production deploy completed: `https://autobazar123-alzbc53fc-daniels-projects-98c0558b.vercel.app`
  - Alias confirmed on deploy: `https://www.autobazar123.sk`

## Task: PROD-429 Google login follow-up (Now)

- [x] Identify why prod login flow reaches `429 Too Many Requests`.
- [x] Implement minimal safe fix so protected routes do not hard-lock when rate-limit infrastructure is unavailable.
- [x] Keep normal rate limiting behavior when Redis is healthy.
- [x] Verify with lint, typecheck, unit tests, and production checks.

## Review: PROD-429 Google login follow-up (Now)

- Status: Completed
- Notes:
  - Root cause: protected-route proxy rate limiting was configured fail-closed in production while Upstash Redis env variables were missing in production (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), causing immediate `429` on `/moj-ucet` and `/admin`.
  - Implemented targeted fail-open behavior for infrastructure outages on proxy-protected routes only:
    - `src/lib/ratelimit.ts`: added optional `checkRateLimit(..., { failOpenOnInfrastructureError })`
    - `src/proxy.ts`: proxy now calls `checkRateLimit` with `failOpenOnInfrastructureError: true`
  - Normal behavior unchanged when Redis is healthy: real limiter responses still enforce rate limits.
  - Deployed fix to production:
    - `https://autobazar123-inco7zyt7-daniels-projects-98c0558b.vercel.app`
    - aliased to `https://www.autobazar123.sk`
- Verification:
  - `npm run lint` passed
  - `npx tsc --noEmit` passed
  - `npm run test:unit` passed (`35/35` files, `157/157` tests)
  - Prod check: `https://www.autobazar123.sk/moj-ucet` now returns `307` to `/auth/login?redirect=%2Fmoj-ucet` (no `429`)
  - Prod check: `https://www.autobazar123.sk/admin` now returns `307` to `/auth/login?redirect=%2Fadmin` (no `429`)

## Task: Frontpage nav access links for prod (Now)

- [x] Add visible login entry point in `src/app/page.tsx` so users can reach dashboard/admin flows.
- [x] Add a clear `/vysledky` link in top navigation.
- [x] Replace placeholder nav links with real routes relevant to buyer/admin flows.
- [x] Verify with lint, typecheck, and unit baseline commands.

## Review: Frontpage nav access links for prod (Now)

- Status: Completed
- Notes:
  - Updated frontpage top navigation in `src/app/page.tsx`:
    - added visible `Prihlásiť sa` button linking to `/auth/login?redirect=%2Fmoj-ucet`
    - added visible `Výsledky` button linking to `/vysledky`
    - replaced old placeholder `#` nav entries with real links: `/vysledky`, `/moj-ucet`, `/admin`
    - kept `Pridať inzerát` CTA and made right-side action group responsive for smaller screens
- Verification:
  - `npm run lint` passed
  - `npx tsc --noEmit` passed
  - `npm run test:unit` passed (`35/35` files, `157/157` tests)
  - Production deploy completed: `https://autobazar123-298f7aww4-daniels-projects-98c0558b.vercel.app`
  - Alias confirmed on deploy: `https://www.autobazar123.sk`
