# Release Gauntlet

Use this as the final pre-launch pass/fail checklist.

## 1) Required automated gates

Run in this order and stop on first failure:

```bash
npm run lint
npx tsc --noEmit
npm run test:unit
npm run test:e2e
npm run test:web-interface
npm run test:links
npm run test:smoke
npm run audit:webapp
npm run easy:full
```

## 2) Critical Playwright release suite

Base release checks (guest guardrails, cookie persistence, premium catalog, top-ad ranking signal):

```bash
npm run test:release-gauntlet -- --grep "Release gauntlet critical checks"
```

Authenticated critical flows (login/logout, admin redirect for non-admin, credits checkout start, dashboard action controls):

```bash
E2E_AUTH_EMAIL="you@example.com" E2E_AUTH_PASSWORD="your-password" npm run test:release-gauntlet -- --grep "Release gauntlet authenticated flows"
```

Optional env:

- `E2E_AUTH_IS_ADMIN=true` skips the non-admin admin-redirect assertion.

## 3) 60-minute final pre-launch execution script

- 00-10 min: run `lint`, `tsc`, `test:unit`; fail fast and fix blockers.
- 10-25 min: run `test:e2e` + `tests/release-gauntlet.test.ts` (guest checks).
- 25-35 min: run authenticated release-gauntlet flows with seeded test account.
- 35-45 min: run `test:web-interface`, `test:links`, `test:smoke`.
- 45-55 min: run `audit:webapp` and verify no route-level regressions.
- 55-60 min: run `easy:full`, collect final artifacts, and publish go/no-go status.

## 4) Release pass criteria

- All required commands exit `0`.
- No failing route in `output/playwright/webapp-audit.json`.
- No open P0/P1 defects in auth, payment/credits, ad lifecycle, or admin permissions.
- Release-gauntlet tests pass (or are explicitly skipped due missing env and tracked as follow-up).
