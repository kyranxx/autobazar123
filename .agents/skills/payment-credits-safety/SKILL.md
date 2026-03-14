---
name: payment-credits-safety
description: Use when touching Stripe, credits, purchases, webhook handlers, or billing-side effects. Enforces server-side verification, idempotency, and trust boundaries.
metadata:
  version: 1.0.0
---

# Payments & Credits Safety

Use this workflow for Stripe/credit/billing changes.

## Trigger Conditions

Use when a request includes:
- `src/app/api/webhooks` and any webhook handler
- credit grant/revocation logic
- purchase checkout/session flow changes
- email or notification side effects tied to payment state
- refund/cancel/deletion paths impacting user balance

## Required Sequence

1. read `AGENTS.md` security sections and `docs/PROJECT_PLAYBOOK.md` first.
2. confirm the endpoint is server-side where trust decisions happen.
3. validate webhook signature verification paths are unchanged or intentionally hardened.
4. ensure every payment-triggered state change is idempotent and cannot be replayed into duplicate credits.
5. verify ownership checks on any mutation endpoint that touches wallet/credits/listing entitlement.
6. confirm notification events and audit signals are still emitted (and not in-place silent no-ops).
7. check fallback behavior is explicit and treated as degraded, not success.
8. include release/security checks if webhooks or secrets changed.

## Commands

- `npm run test:security:release-gate` for payment/security-sensitive edits
 - `npm run lint`, `npx tsc --noEmit`, `npm run test:unit` baseline
- targeted test for changed payment/credits modules when available

## References

- `docs/security-top-10-defaults.md`
- `AGENTS.md`
- `package.json`
