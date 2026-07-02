# Marketplace Pro UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inconsistent public-page styling with one Marketplace Pro visual system for Autobazar123.

**Architecture:** Add small shared page primitives for public pages, then migrate high-visibility public routes to them. Keep business logic, data loading, auth, payments, search behavior, and SEO metadata unchanged.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind v4 tokens, existing `market-*` CSS primitives.

---

### Task 1: Shared Marketplace UI Primitives

**Files:**
- Create: `src/components/ui/MarketplacePage.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add shared components**

Create `MarketplacePage.tsx` with:
- `MarketplacePageShell`
- `MarketplaceHero`
- `MarketplaceSection`
- `MarketplaceCard`
- `MarketplaceStatCard`
- `MarketplaceCTA`

These components only compose layout/classes and accept normal React children.

- [ ] **Step 2: Add token-level helpers**

Extend `globals.css` with `market-hero`, `market-section`, `market-readable`, and `market-soft-band` helpers using existing green/orange theme variables.

- [ ] **Step 3: Typecheck component API**

Run: `npm run typecheck`

Expected: no new TypeScript errors.

### Task 2: Public Informational And Commerce Pages

**Files:**
- Modify: `src/app/(site)/ceny/page.tsx`
- Modify: `src/app/(site)/kontakt/page.tsx`
- Modify: `src/app/(site)/kontakt/ContactFormClient.tsx`
- Modify: `src/app/(site)/o-nas/page.tsx`
- Modify: `src/app/(site)/predajcovia/page.tsx`
- Modify: `src/app/site-map/page.tsx`

- [ ] **Step 1: Migrate wrappers**

Replace custom `mx-auto max-w-*`, `rounded-2xl`, and pill button patterns with `MarketplacePageShell`, `MarketplaceHero`, `MarketplaceCard`, and `MarketplaceCTA`.

- [ ] **Step 2: Keep user flows unchanged**

All links, forms, dealer profile paths, contact API calls, and pricing data remain exactly as before.

- [ ] **Step 3: Verify visible semantics**

Run: `npm run test:web-interface`

Expected: all tested routes keep a main landmark and page intent heading.

### Task 3: Legal, Privacy, Cookies, And Utility Pages

**Files:**
- Modify: `src/app/(site)/obchodne-podmienky/page.tsx`
- Modify: `src/app/(site)/ochrana-udajov/page.tsx`
- Modify: `src/app/(site)/cookies/CookiesPageClient.tsx`
- Modify: `src/app/(site)/kalkulacka-leasingu/LeasingCalculatorPageClient.tsx`

- [ ] **Step 1: Migrate document layouts**

Use the same shell and readable document cards so legal/privacy/cookies pages no longer look like separate products.

- [ ] **Step 2: Preserve interactive controls**

Cookie toggles and leasing sliders keep their existing state and behavior.

- [ ] **Step 3: Run accessibility checks**

Run: `npm run test:a11y`

Expected: no new axe, landmark, contrast, or reflow failures.

### Task 4: Verification Pass

**Files:**
- No additional intended code files.

- [ ] **Step 1: Run targeted checks**

Run:

```powershell
npm run typecheck
npm run lint
npm run test:web-interface
npm run test:a11y
npm run test:keyboard
npm run test:mobile-matrix
npm run test:ui-quality-gate
```

- [ ] **Step 2: Browser route smoke**

Start the local dev server and capture screenshots for:
- `/`
- `/vysledky`
- `/ceny`
- `/kontakt`
- `/o-nas`
- `/predajcovia`
- `/obchodne-podmienky`
- `/ochrana-udajov`
- `/cookies`
- `/site-map`

- [ ] **Step 3: Final review**

Confirm the redesign is applied through shared components, not one-off page decoration.
