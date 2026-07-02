# RO Market Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first safe foundation for Romania as a separate market without duplicating the app.

**Architecture:** Keep one Next.js codebase and add market-aware config plus data isolation fields. Existing Slovakia traffic remains the default market until the database migration is applied and Algolia is reindexed with the new market field.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Supabase migrations, Algolia records.

---

### Task 1: Market Config

**Files:**
- Create: `src/config/markets.ts`
- Create: `src/config/markets.test.ts`

- [ ] **Step 1: Write the failing tests**

Test that `www.autobazar123.sk` resolves to `SK`, `www.autobazar123.ro` resolves to `RO`, unknown hosts fall back to `SK`, and invalid market codes are rejected.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/config/markets.test.ts`
Expected: fail because `src/config/markets.ts` does not exist yet.

- [ ] **Step 3: Implement minimal market config**

Add market definitions for `SK` and `RO`, host normalization, host-to-market resolution, and market-code validation.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/config/markets.test.ts`
Expected: pass.

### Task 2: Search Catalog Market Isolation

**Files:**
- Modify: `src/app/api/search/catalog/route.test.ts`
- Modify: `src/app/api/search/catalog/route.ts`
- Modify: `src/lib/algolia/index.ts`

- [ ] **Step 1: Write the failing test**

Test that a request to `https://www.autobazar123.ro/api/search/catalog` adds `.eq("market_code", "RO")` to the Supabase query.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/search/catalog/route.test.ts`
Expected: fail because the route does not filter by `market_code`.

- [ ] **Step 3: Implement minimal route filtering**

Resolve the market from the request host, select `market_code`, filter active ads by that code, and include `market_code` in Algolia records with a safe default of `SK`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/search/catalog/route.test.ts src/lib/algolia/fallback-search.test.ts`
Expected: pass.

### Task 3: Sitemap Market Backfill Safety

**Files:**
- Modify: `src/app/sitemap.test.ts`
- Modify: `src/app/sitemap.ts`
- Create: `supabase/migrations/20260630090000_add_ad_market_code.sql`

- [ ] **Step 1: Write the failing test**

Test that the sitemap query filters ads with `.eq("market_code", "SK")`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: fail because the sitemap query does not filter by market.

- [ ] **Step 3: Implement minimal schema and sitemap filter**

Add a `market_code` column defaulting to `SK`, constrain it to `SK` or `RO`, add an index for active public inventory, select the field in sitemap rows, and filter the current SK sitemap to `SK`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: pass.

### Task 4: Verification

**Files:**
- No production files expected beyond Tasks 1-3.

- [ ] **Step 1: Run focused checks**

Run: `npx vitest run src/config/markets.test.ts src/app/api/search/catalog/route.test.ts src/app/sitemap.test.ts`
Expected: pass.

- [ ] **Step 2: Run type and i18n contract checks**

Run: `npm run typecheck`
Run: `npm run check:i18n-contract`
Expected: pass.

- [ ] **Step 3: Report remaining blockers**

State that RO is not launch-ready until the `.ro` domain is bought, Romanian copy is completed, the Supabase migration is applied, Algolia is reindexed, and outreach is owner-approved/compliance-safe.
