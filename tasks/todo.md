# Active Todo

- [x] Add production/predeploy Redis env guard for rate-limit reliability.
- [x] Integrate the guard into release checks/build flow.
- [x] Remove stale `SECURITY_REVIEW.md` requirements from security policy gate.
- [x] Add short runbook + alert notes for rate-limit env failures.
- [x] Run baseline verification and record proof.

## Review

- Added `scripts/check-prod-rate-limit-env.mjs`:
  - Enforces `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for production-target releases.
  - Skips safely for non-production targets.
- Added guard unit tests in `scripts/check-prod-rate-limit-env.test.mjs`.
- Integrated guard into workflow:
  - `npm run build` now runs `npm run check:prod-rate-limit-env` first.
  - Added scripts: `check:prod-rate-limit-env`, `test:prod-rate-limit-env-guard`.
  - Security release policy now requires/runs the new guard and no longer references deleted `SECURITY_REVIEW.md`.
- Added runbook + alert notes:
  - `docs/PROJECT_PLAYBOOK.md` (`Rate-Limit Reliability Runbook` section).
  - `docs/security-top-10-defaults.md` (`Alert Notes` section).
  - Updated `README.md` local commands list.
- Verification:
  - `npm run test:prod-rate-limit-env-guard` passed (5 tests).
  - `npm run check:prod-rate-limit-env` passed (skipped in non-production target context).
  - `npm run test:security:policy` passed.
  - `npm run test:security:release-gate` passed.
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (35 files, 160 tests).
