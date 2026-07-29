# Market extension guide

AutoNinja uses one application repository with a declarative market registry.
Shared product changes are implemented once and deployed to every market project
that follows the same Git production branch. Country differences belong in a
market definition or locale catalog, not in duplicated application code.

## Add a market

1. Add one definition to `MARKET_DEFINITIONS` in
   `src/config/markets.ts`. Use `defineMarket` and provide:
   - code, country, canonical domain and all accepted hosts;
   - locale, language tag, currency, timezone and calling code;
   - localized public route mappings;
   - contact, presentation, SEO/runtime copy and service defaults.
2. Add `src/i18n/messages/<locale>.json` and include the locale in
   `src/i18n/config.ts`. The registry contract test fails when a production
   market has no catalog.
3. Create a Supabase migration that inserts the market into `public.markets`.
   Inventory continues to be isolated by the `ads.market_code` foreign key.
4. Create or connect the market's Vercel project to the same repository and
   production branch. Configure the custom apex/canonical domains and set
   `NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE` to the new code.
5. Add market-specific provider configuration where applicable:
   - Supabase Auth callback and recovery URL allowlist;
   - Resend sender/reply-to domain;
   - Stripe currency/product settings;
   - Clarity/GA/PostHog IDs;
   - Algolia records and filters.
6. Run the contract, i18n, route/search/SEO, type and production-build checks.
   Verify the canonical domain, localized routes, inventory purity, auth
   callback and one listing-detail page before launch.

## Extension contract

The generic registry validates duplicate codes, locales and hosts, canonical
origin/domain mismatches, and host normalization. The generic route translator
uses each market's own mapping in both directions.

`src/config/market-registry-extension.test.ts` registers a synthetic Czech
market and proves that a new TLD, locale and route set work without adding
country branches to request, proxy or routing logic.

## Rules

- Never use an unknown-host fallback to launch a market. Add its hosts to the
  registry so the request carries the correct market code.
- Never remove the `market_code` filter from public inventory, Algolia, sitemap
  or listing-detail queries.
- Do not add another `marketCode === "XX"` infrastructure branch. Add a typed
  field to `MarketDefinition` and consume it generically.
- Domain-specific copy may differ, but shared behavior, components and fixes
  must remain in the common application path.
