# Active Todo

- [x] Investigate why `/moj-ucet` and `/admin` hit `429 Too Many Requests` in production.
- [x] Apply the smallest root-cause fix in protected-route proxy rate limiting.
- [x] Add/update tests for the fixed proxy behavior.
- [x] Run required verification commands and capture evidence.

## Review

- Root cause addressed: protected-route proxy rate limit key used manual IP parsing with a frequent `"unknown"` fallback; this caused cross-user collisions and false `429` responses on `/moj-ucet` and `/admin` in production environments where expected forwarding headers were absent/changed.
- Fix applied:
  - `src/proxy.ts`
    - Switched to `createRateLimitIdentifier("proxy", request.headers)` from `@/lib/request-fingerprint` for stable Cloudflare/Vercel-aware client fingerprinting.
    - Excluded Next.js prefetch traffic from protected-route rate limit counting.
  - `src/proxy.test.ts`
    - Added assertion that protected-route rate limiting uses fingerprint-based identifier.
    - Added regression test to ensure prefetch requests do not consume protected-route quota.
- Verification evidence:
  - `npm run test:unit -- src/proxy.test.ts` (pass, 1 file / 5 tests)
  - `npm run lint` (pass)
  - `npx tsc --noEmit` (pass)
  - `npm run test:unit` (pass, 35 files / 161 tests)
