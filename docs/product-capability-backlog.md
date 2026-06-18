# Product Capability Backlog

Last updated: 2026-06-02

This document separates launch stopgaps from finished product capabilities. Existing code scaffolding does not mean a capability is production-ready.

## VIN Integration

Status: open backlog. Do not describe VIN decoding as complete or enable it in production yet.

What already exists:
- Authenticated, CSRF-protected, rate-limited `/api/vin/decode` route.
- Vincario adapter, listing-form mapping, tests, and a feature flag that is off by default.
- Listing intake can store a VIN without requiring automatic decoding.

What remains:
1. Confirm Vincario as the provider or compare it with a combined catalog option such as JATO JaaS.
2. Record the selected plan, monthly lookup budget, VAT, overage mode, cancellation terms, license, storage/caching rights, and permitted public use.
3. Configure credentials only in approved preview/production secret stores. Keep the feature flag off during setup.
4. Test representative Slovak/EU VINs in preview, including unsupported and partial-match cases.
5. Define manual-review behavior when decoded make/model values do not match the local taxonomy.
6. Add monitoring for provider errors, lookup volume, cost, and feature-flag rollback.
7. Enable only through a staged rollout after owner approval.

Current cost note:
- Vincario publishes a free API demo and monthly subscriptions. Its pricing page shows an API demo of up to 20 credits while its FAQ says new customers receive 3 free VIN lookups each month, so confirm the exact trial allowance in the account before relying on it.
- Vincario says valid VIN requests count as lookups, invalid or unrecognized VINs are not charged, the API limit is 60 lookups per minute, plans can pause at quota or use an always-active renewal mode, and prices exclude VAT.
- Vincario's official April 2026 pricing explainer lists VIN decode rates of EUR 0.49/request for 100 lookups, EUR 0.298 for 500, EUR 0.249 for 1,000, and EUR 0.22 for 5,000. Verify the final checkout amount before owner approval because the interactive pricing page is authoritative.

VIN decoder options:

| Candidate | Current fit | Cost / licensing posture | Decision |
| --- | --- | --- | --- |
| Vincario | Best first evaluation path. It advertises global coverage with extended European support, structured JSON, and 40-50+ fields. The repo already has a Vincario adapter. | Public monthly pricing and trial path exist. Confirm account trial credits, VAT, caching/storage rights, public-use rights, and pause-vs-always-active billing before enabling. | Recommended for a preview-only trial after owner approval. |
| JATO JaaS VIN/VRM decoding | Strong enterprise escalation path if Autobazar123 later needs a combined VIN, registration, specifications, configuration, and unified-ID platform. | Pricing and permitted use are contractual. JATO provisions trials manually, and its trial terms allow internal evaluation only until a paid license is agreed. | Request a quote only if the Vincario evaluation or catalog decision shows a need for richer data. |
| NHTSA vPIC | Free official sanity check for US-market vehicles and useful diagnostic fallback. | Public API with automated traffic controls. NHTSA says its data represents vehicles intended for US sale or import, so limited results are expected for other vehicles. | Do not use as the Slovak/EU production decoder. |
| CarAPI | Useful public-price benchmark with VIN decoding and cache guidance. | Base plan is USD 199/year for 1,500 calls/day; higher public tiers exist. Official FAQ says the data is for cars sold in the United States. | Do not use as the Slovak/EU production decoder. |

## Always-Updated Makes And Models

Status: open backlog. The current 20-brand / 207-model dataset plus manual normalization is acceptable only as the cheapest launch posture.

What already exists:
- Brands and models store `source`, `source_external_id`, `last_synced_at`, and active-state metadata.
- `runVehicleTaxonomyImport()` can upsert provider rows, deactivate missing provider rows, and record success/failure in `taxonomy_sync_runs`.
- Public taxonomy consumers already read through the central taxonomy layer.

Provider decision required:

| Candidate | Current fit | Cost / licensing work |
| --- | --- | --- |
| Auto-Data.net API | Best first taxonomy evaluation for the current architecture: European-heavy catalog, daily updates, and downloadable XML/JSON with delta updates suitable for database sync. | Quote-based by selected fields and volume. Terms grant limited public automotive-site use but prohibit database redistribution; images may require attribution and prices exclude VAT. |
| JATO JaaS | Strong enterprise escalation path for a commercial EU marketplace: 50+ markets, unified vehicle IDs, VIN/VRM decoding, structured specifications, and real-time APIs. | Public pricing is not listed. Request a trial and quote only with owner approval. Review the paid order for permitted public display, caching/storage, call volume, markets, and termination export rights. Trial data is for internal evaluation only. |
| CarAPI | Useful benchmark because pricing is public and caching is supported. | Not a canonical Slovak/EU source: its official page says its vehicle data covers cars sold in the United States. |
| NHTSA vPIC | Free official VIN sanity-check source and possible fallback for US-market vehicles. | Not a canonical Slovak/EU taxonomy: NHTSA states the data represents vehicles intended for US sale or import and applies traffic controls. |

Update mechanism required:
1. Choose the canonical provider and contract before buying or syncing live data.
2. Add a provider adapter that produces `VehicleTaxonomyImportInput`.
3. For Auto-Data.net evaluation, use its documented XML/JSON download and `update=YYYY-MM-DD` delta feed. The provider requires storing data locally and allows a fresh file download every 5 hours.
4. Schedule a daily read-fetch, validate, stage, and import job with alerts for failed runs, deleted rows, and unexpected row-count changes.
5. Store a provider cursor and raw import metadata so a run can be replayed or audited.
6. Keep manual overrides and aliases separate so a provider refresh cannot silently erase local corrections.
7. Refresh dependent Algolia and SEO data only after taxonomy validation passes.

Migration plan required:
1. Snapshot the current taxonomy and listing references.
2. Import provider data into a staging environment and preserve existing IDs where slugs or approved aliases match.
3. Review collisions, missing models, renamed models, and inactive rows. Deactivate rows instead of deleting them.
4. Backfill listing references, Algolia records, and SEO paths with redirect/alias handling where needed.
5. Run listing, search, sitemap, and add-listing regression checks.
6. Roll out in preview first with a rollback snapshot, then request owner approval before any live sync.

Definition of done:
- Owner approves the provider, cost, and license.
- The adapter, schedule, validation, monitoring, migration dry-run, rollback plan, and preview verification all pass.

## Recommended Phases

1. Launch: spend nothing. Keep VIN optional, keep VIN decoding off, and use the current taxonomy with manual normalization.
2. First VIN evaluation: after owner approval, use the existing Vincario adapter in preview only with representative Slovak/EU VINs. Start with pause-at-quota billing if a paid preview test is later approved.
3. First taxonomy evaluation: after owner approval, request an Auto-Data.net demo/quote limited to brand, model, generation, modification, production years, body type, fuel, and transmission fields. Dry-run its delta feed through a staging adapter.
4. Escalation: request a JATO JaaS trial/quote only if Auto-Data.net coverage, license, or data depth is insufficient, or if unified VIN/VRM/specification data becomes commercially valuable.
5. Live rollout: no provider sync or VIN flag enablement until migration rehearsal, monitoring, rollback, preview checks, and a separate owner approval pass.

Owner decisions needed before external action:
- Approve or reject a preview-only Vincario trial.
- Approve or reject requesting an Auto-Data.net demo/quote.
- Decide the monthly VIN lookup budget ceiling if paid evaluation becomes necessary.
- Approve JATO outreach only if the lower-complexity evaluation is insufficient.

## Official Research Links

- JATO JaaS: https://developer.jato.com/
- JATO API trial: https://www.jato.com/product-trials/api
- JATO subscription terms: https://www.jato.com/hubfs/JATO%20Global%20Terms%20and%20Conditions%20for%20Subscription%20Services_version_3_April%20_2026.pdf
- Auto-Data.net API: https://api.auto-data.net/
- Auto-Data.net documentation: https://api.auto-data.net/documentation
- Auto-Data.net quote form: https://api.auto-data.net/get-a-quote/?source=auto-data-menu
- Auto-Data.net terms: https://api.auto-data.net/terms-and-conditions
- CarAPI pricing: https://carapi.app/pricing
- NHTSA vPIC: https://vpic.nhtsa.dot.gov/
- Vincario pricing: https://vincario.com/pricing/
- Vincario VIN API: https://vincario.com/vin-decoder/
- Vincario April 2026 pricing explainer: https://vincario.com/blog/vin-decoder-api-pricing/
