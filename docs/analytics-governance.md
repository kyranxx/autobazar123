# Analytics Governance

This repository uses a typed analytics contract so instrumentation stays stable, reviewable, and safe to evolve.

## Source Of Truth

- Event catalog: `src/lib/analytics/events.ts`
- Event tests: `src/lib/analytics/events.test.ts`

## Naming Convention

Event names must be `snake_case` and domain-scoped:

- `search_query_submitted`
- `homepage_cta_clicked`
- `listing_viewed`
- `seller_contact_started`
- `listing_created`
- `listing_submitted`
- `listing_published`
- `lead_submitted`
- `lead_qualified`
- `sale_confirmed`
- `listing_approved`
- `listing_feature_purchased`
- `listing_removed_by_moderation`
- `listing_marked_sold`
- `payment_credit_checkout_started`
- `payment_credit_checkout_completed`

## Payload Contract

Every event has a schema and must be validated before transport:

- Use `validateAnalyticsEvent(name, payload)` to check payload shape.
- Keep fields specific to business intent (avoid dumping whole objects).
- Prefer explicit enums over free-form strings when possible.
- `homepage_cta_clicked` allowed values include:
  - `cta`: `register`, `sell_car`, `family_suv`, `city_cars`, `automatics`
  - `surface`: `home_account`, `home_seller_panel`, `home_quick_links`
- `listing_viewed.source` allowed values include:
  - `search`
  - `featured`
  - `direct`
  - `dealer_page`
  - `seo_model_route`
  - `seo_city_route`
- `lead_submitted.channel` currently allowed values include:
  - `message`
- `lead_qualified.qualificationMethod` currently allowed values include:
  - `seller_dashboard_manual`
- `sale_confirmed.confirmationMethod` currently allowed values include:
  - `seller_dashboard_manual`
- `sale_confirmed.sellerType` currently allowed values include:
  - `private`
  - `dealer`
- `listing_approved.approvalMethod` currently allowed values include:
  - `admin_moderation`
- `listing_feature_purchased.featureType` currently allowed values include:
  - `top`
  - `highlight`
- `listing_feature_purchased.purchaseSurface` currently allowed values include:
  - `account_dashboard`
  - `dealer_bulk`
- `listing_removed_by_moderation.removalReason` currently allowed values include:
  - `admin_rejection`

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
