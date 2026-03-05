# Analytics Governance

This repository uses a typed analytics contract so instrumentation stays stable, reviewable, and safe to evolve.

## Source Of Truth

- Event catalog: `src/lib/analytics/events.ts`
- Event tests: `src/lib/analytics/events.test.ts`

## Naming Convention

Event names must be `snake_case` and domain-scoped:

- `search_query_submitted`
- `listing_viewed`
- `seller_contact_started`
- `listing_created`
- `payment_credit_checkout_started`
- `payment_credit_checkout_completed`

## Payload Contract

Every event has a schema and must be validated before transport:

- Use `validateAnalyticsEvent(name, payload)` to check payload shape.
- Keep fields specific to business intent (avoid dumping whole objects).
- Prefer explicit enums over free-form strings when possible.
- `listing_viewed.source` allowed values include:
  - `search`
  - `featured`
  - `direct`
  - `dealer_page`
  - `seo_model_route`
  - `seo_city_route`

## Consent Policy

Analytics emission must respect cookie consent:

- Primary key: `autobazar123_cookie_consent`
- Legacy fallback key: `cookiePreferences`
- Use `resolveAnalyticsConsentFromStorage(...)` to evaluate consent consistently.

## Operational Rules

1. Add or update event schemas in `src/lib/analytics/events.ts`.
2. Add matching tests in `src/lib/analytics/events.test.ts`.
3. Update this document when taxonomy changes.
4. Never introduce ad-hoc event strings directly inside UI components.
