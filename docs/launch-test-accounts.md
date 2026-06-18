# Launch Test Accounts

Last updated: 2026-05-20

Purpose: close the remaining launch-account coverage gaps without printing secrets or seeding fake public inventory.

## Current Read-Only Coverage

Command:

```bash
npm run check:launch-test-coverage
```

Current result from `npm run check:launch-test-coverage` on 2026-05-20:

- Primary login account: covered.
- Admin dashboard account: covered by the primary account.
- Non-admin admin-denial account: missing credentials.
- Seller with owned ad account: missing credentials.
- Dealer account: missing account/data.

Current DB candidate counts:

- Profiles: 9
- Non-admin profiles: 7
- Non-admin seller profiles with owned ads: 1
- Dealer owners: 0

## Needed Before Launch

Set these in local `.env.local` when accounts are available:

```bash
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_NON_ADMIN_EMAIL=
E2E_NON_ADMIN_PASSWORD=
E2E_SELLER_EMAIL=
E2E_SELLER_PASSWORD=
E2E_DEALER_EMAIL=
E2E_DEALER_PASSWORD=
```

Notes:

- The existing primary `E2E_AUTH_*` account already covers login and admin-positive checks.
- Use a real non-admin account for admin-denial checks.
- Use a real seller account that owns at least one ad for edit/top/sold/dashboard checks.
- Create or approve a dealer account through the normal dealer flow before dealer billing/topup checks. Current DB has 0 dealer owners.
- Do not overwrite passwords for real user accounts without explicit approval.
- Do not use old ignored seed scripts for launch evidence; they can create public active ads on arbitrary profiles.

## Verification After Credentials Exist

Run:

```bash
npm run check:launch-test-coverage -- --require-complete
npm run test:release-gauntlet
```

Expected launch-ready account result:

- `Complete launch test account coverage: yes`
- Release gauntlet has no account/data skips for non-admin, seller, or dealer checks.

## Stripe Test Path

Still needed:

- Stripe test-mode checkout credentials configured in the target environment.
- A seller-owned ad to trigger private listing checkout.
- A dealer account to trigger dealer topup checkout.
- Live webhook delivery verified against the deployment target.
