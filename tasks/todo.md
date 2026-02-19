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
