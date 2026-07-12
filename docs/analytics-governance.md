# Analytics Spec And Governance

This is the single analytics document for Autobazar123.

Use it to answer:

- what business objects exist
- which metrics matter
- what events we track
- how analytics changes are governed

## Source Of Truth

- Event catalog: `src/lib/analytics/events.ts`
- Event tests: `src/lib/analytics/events.test.ts`

## Core Entities And Stable IDs

Every important business object should have:

- one canonical ID
- one clear owner system
- one plain-English definition

Core IDs:

- `user_id`
- `seller_id`
- `dealer_id`
- `listing_id`
- `lead_id`
- `conversation_id`
- `subscription_id`
- `session_id`

Important:
- Some current code still uses `adId`. The business concept is `listing_id`.

## Core Metrics

These are the main numbers the company should trust and reuse consistently:

1. Traffic by channel
2. Searchers
3. Search-to-listing-view rate
4. Listing-view-to-lead rate
5. Paid ads posted
6. Paid feature purchases
7. Sold listings
8. Time to sale
9. Repeat sellers
10. Repeat paying sellers / dealers
11. Revenue from ads and premium features

Rules:

- Use one definition per metric.
- Do not create slightly different versions in different dashboards.
- If finance and product disagree, record which system is the source of truth.
- Prefer simple definitions that can be explained out loud.

## Event Contract

Event names must be `snake_case` and domain-scoped.

Current important events include:

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

Standard reusable properties:

- `user_id`
- `seller_id`
- `dealer_id`
- `listing_id`
- `lead_id`
- `conversation_id`
- `subscription_id`
- `session_id`
- `traffic_channel`
- `locale`
- `city`
- `region`
- `brand`
- `model`
- `seller_type`
- `device_type`
- `premium_flag`

## Payload Rules

Every event must have a schema and be validated before transport.

- Use `validateAnalyticsEvent(name, payload)`.
- Keep payloads small and intentional.
- Avoid raw PII.
- Prefer explicit enums over free-form strings.
- Never dump whole objects into analytics events.

Useful enum examples already in use:

- `listing_viewed.source`: `search`, `featured`, `direct`, `dealer_page`, `seo_model_route`, `seo_city_route`
- `lead_submitted.channel`: `message`
- `sale_confirmed.sellerType`: `private`, `dealer`
- `listing_feature_purchased.featureType`: `top`, `highlight`

## Consent Policy

Analytics emission must respect cookie consent.

- Primary key: `autobazar123_cookie_consent`
- Legacy fallback key: `cookiePreferences`
- Use `resolveAnalyticsConsentFromStorage(...)` to evaluate consent consistently.

## Session Recording

Microsoft Clarity is loaded only after the visitor grants analytics consent.
Use `NEXT_PUBLIC_CLARITY_ID` as the shared fallback project ID.

Optional market-specific overrides:

- `NEXT_PUBLIC_CLARITY_ID_SK` for `autobazar123.sk` / `www.autobazar123.sk`
- `NEXT_PUBLIC_CLARITY_ID_RO` for `autobazar123.ro` / `www.autobazar123.ro`

If a market-specific ID is missing, the runtime falls back to
`NEXT_PUBLIC_CLARITY_ID`. Unknown hosts such as local development do not load
Clarity, even when a Clarity ID is present.

## Operational Rules

1. Add or update event schemas in `src/lib/analytics/events.ts`.
2. Add matching tests in `src/lib/analytics/events.test.ts`.
3. Update this document when taxonomy changes.
4. Never introduce ad-hoc event strings directly inside UI components.
5. Treat this file as the shared analytics contract for product, reporting, and future monthly snapshots.
