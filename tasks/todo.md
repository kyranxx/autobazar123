# Active Todo

- [x] Verify current production 429 behavior on `/moj-ucet` and identify remaining limiter root cause.
- [x] Patch protected-route proxy limiter to key by authenticated user when available (fallback to request fingerprint) and fail-open on limiter infrastructure errors.
- [x] Add/update proxy tests for authenticated keying and fail-open options.
- [x] Run verification commands and record proof.

## Review

- Production probe evidence:
  - `curl.exe -I https://www.autobazar123.sk/moj-ucet` returned `429 Too Many Requests` with `X-RateLimit-Remaining: 0` and proxy-generated security headers.
  - Distinct `User-Agent`/`Accept-Language` probes also returned immediate `429`, confirming protected-route limiter remained too aggressive in real traffic conditions.
- Fix applied:
  - `src/proxy.ts`
    - For protected routes, limiter key now prefers authenticated user identity: `proxy:user:${userId}`.
    - Falls back to request fingerprint only when user identity is unavailable.
    - Uses `checkRateLimit(..., { failOpenOnInfrastructureError: true })` so Redis/Upstash infra errors do not hard-lock account/admin access.
    - Keeps prefetch exclusion logic so navigation preloads do not consume protected-route quota.
  - `src/proxy.test.ts`
    - Added assertion for authenticated user-based limiter key.
    - Updated fallback fingerprint test to assert infra fail-open option is passed.
- Verification evidence:
  - `npm run test:unit -- src/proxy.test.ts` (pass, 1 file / 6 tests)
  - `npm run lint` (pass)
  - `npx tsc --noEmit` (pass)
  - `npm run test:unit` (pass, 35 files / 162 tests)
