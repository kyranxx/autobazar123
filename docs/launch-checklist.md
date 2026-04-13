# Release Readiness

Last updated: 2026-04-07

Use this as the single pre-release document.

Rule:
- If any required item fails, do not ship.
- If the site is still maintenance-gated, keep maintenance mode on.

## Fast Local Paths

### Quick preflight

```bash
npm run easy:quick
```

Use this for a fast sanity pass before small changes.

### Stronger ship-ready pass

```bash
npm run easy:full
```

This runs:

- lint
- typecheck
- unit tests
- security release gate
- UI quality gate
- analytics taxonomy test
- links-ingestion tests

Important:
- `easy:full` is useful, but it does not replace targeted tests for the touched area.

## Required Automated Checks

Run what matches the change:

1. `npm run typecheck`
2. `npm run test:security:release-gate` for auth, payment, security, release, or env-sensitive work
3. Targeted tests for the touched area
4. `npm run test:web-interface`, `npm run test:a11y`, `npm run test:keyboard`, `npm run test:mobile-matrix`, or `npm run test:ui-quality-gate` for UI work
5. `npm run test:release-gauntlet` for release-facing flow confidence
6. `npm run audit:webapp` when route-level or runtime regressions matter

Authenticated release-gauntlet flows:

```bash
E2E_AUTH_EMAIL="you@example.com" E2E_AUTH_PASSWORD="your-password" npm run test:release-gauntlet -- --grep "Release gauntlet authenticated flows"
```

## Deployment Cadence

When deploy is in scope and production is still maintenance-gated:

1. Make the change.
2. Check preview first.
3. Verify preview deployment is `Ready`.
4. Verify preview `/api/health` is `healthy`.
5. Run local targeted checks.
6. Do a short production verification while maintenance mode is still on.
7. Remove maintenance mode only when required checks pass and we both feel comfortable.

## Core Product Checks

- [ ] Homepage opens.
- [ ] Search/results page works.
- [ ] Listing detail page opens.
- [ ] Sign up works.
- [ ] Login works.
- [ ] Password reset works.
- [ ] Add listing works.
- [ ] Edit/manage own listing works.
- [ ] Inquiry/contact works.
- [ ] Payment flow works if paid features are enabled.
- [ ] Admin area still works.

## Launch / Release Gate Checks

- [ ] Preview deployment is `Ready` when preview is in scope.
- [ ] Preview `/api/health` is `healthy` when preview is in scope.
- [ ] Production deployment is `Ready` when production is in scope.
- [ ] Production `/api/health` is `healthy` when production is in scope.
- [ ] Maintenance mode still protects the public before launch.
- [ ] Maintenance bypass still works for us.
- [ ] No obvious runtime or browser-console errors on key pages.
- [ ] No open P0/P1 defect in auth, payment, search, listing lifecycle, or admin permissions.

## User Visual Checks

- [ ] Homepage looks good enough.
- [ ] Search page looks good enough.
- [ ] Listing detail looks good enough.
- [ ] Add listing flow feels clear enough.
- [ ] No ugly broken layout on mobile or desktop in the main flows.

## First Day After Opening

- [ ] Watch logs and health after launch.
- [ ] Confirm signups still work.
- [ ] Confirm listing creation still works.
- [ ] Confirm inquiries still work.
- [ ] Confirm search still works.
- [ ] If something critical breaks, turn maintenance mode back on.
