---
name: inventory-search-seo
description: Use when the user changes search, results, inventory, Algolia sync/state, or SEO route behavior. Covers search-url state correctness, routing consistency, and SEO-indexable listing pages.
metadata:
  version: 1.0.0
---

# Inventory, Search, and SEO

You are the workflow for search/search-state and SEO inventory route changes.

## Trigger Conditions

Use this skill when a request touches:
- search results pages (`/vysledky`, search params, query sync)
- Algolia integration, sync triggers, or search suggestions
- SEO pages for make/model/city/storefront inventory routes
- sitemap or inventory indexing behavior
- any route-level behavior change affecting crawlability of listings

## Required Check Flow

1. read `AGENTS.md` and `docs/PROJECT_PLAYBOOK.md` first.
2. map the exact touch points in:
   - search page clients and URL state sync layers
   - Algolia query/route wiring
   - SEO data loading functions used during render
3. verify no behavior drift between URL state and UI state, especially back/forward and deep-link cases.
4. keep user-facing ordering and filters stable if behavior already exists; avoid broad re-architecture.
5. ensure routes that were migrated for SSR/pre-render safety stay deterministic and do not read request-time values during prerender.
6. for listing-indexed pages, verify canonical links, metadata, and pagination behavior still match existing route contracts.
7. if `build` stability is touched, include relevant SEO/crawlability smoke checks.

## Commands

- `npm run test:web-interface` (for search-flow UI behavior changes)
- `npm run test:release-gauntlet` if SEO/indexing-critical routes changed
- `npm run lint`, `npx tsc --noEmit`, `npm run test:unit` baseline for related code changes
- `npm run build` when SEO or routing runtime safety changed

## Documentation and Source of Truth

- `docs/PROJECT_PLAYBOOK.md`
- `docs/seo-implementation-matrix.md`
- `docs/links-ingestion.md`
- `package.json`

## Hard Rules

- preserve query-state compatibility for existing backlinks
- prefer deterministic rendering paths over dynamic fixes that reduce cacheability
- avoid adding client-only randomness or time reads in SEO routes

