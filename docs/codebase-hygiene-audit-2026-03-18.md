# Codebase Hygiene Audit - 2026-03-18

## Scope

- Repo-wide dead-code scan used `knip`, ESLint, ripgrep, and manual import checks.
- Hardcoded-value audit treated operational literals as in-scope: URLs, hex colors, thresholds, timeouts, storage keys, and repeated route strings.
- Translation copy in `src/i18n/messages/*.json` was intentionally excluded. Moving product copy into `config.ts` would break the existing i18n boundary.

## 1. Dead Code Removal

### Deleted now

- `split_auth_modal.js`
  - Orphan script, not referenced by imports, scripts, or runtime entrypoints.
- `src/hooks/useSavedAd.ts`
  - Reported by `knip` as an orphan file and not imported anywhere.
- `src/components/AuthModal.tsx.bak`
  - Duplicate backup file left beside the real `src/components/AuthModal/` feature module.

### Safe function/export removals applied now

- `src/lib/search/saved-searches.ts`
  - `normalizeSavedSearchText`
  - `normalizeSavedSearchFilters`
  - Both are still used internally, but they no longer leak as public exports.
- `src/lib/security/csrf.ts`
  - `validateCsrfTokenRequest`
  - Only used by `rejectInvalidCsrfTokenRequest`, so it is now internal.
- `src/lib/auth/password-policy.ts`
  - `isPasswordLongEnough`
  - Unused wrapper around `MIN_PASSWORD_LENGTH`.
- `src/lib/security/client-csrf.ts`
  - `getCsrfToken`
  - Only used by `createCsrfHeaders`, so it is now internal.
- `src/lib/algolia/admin-config.ts`
  - `getReplicaIndexNames`
  - Only used by `getCarsIndexSettings`, so it is now internal.
- `src/components/AuthModal/useAuthModal.ts`
  - `shouldAutoFocusAuthField`
  - Only used inside the hook file, so it is now internal.

### Remaining delete candidates

- `src/lib/auth/recovery-session.ts`
  - `RecoveryErrorReason`
  - Exported type alias is only used as the return type of the same file. It can be made internal in a later pass.

### Remaining likely-orphan or vague utility files to review next

- `scripts/refactor.js`
- `scripts/debug-filters.js`
- `scripts/test-all.ts`

Those were not deleted in this pass because they are shell-entry scripts rather than import-graph modules. They should be either renamed to a specific purpose or removed after one manual owner check.

## 2. Folder Restructure

### Current high-level tree

```text
src/
  app/
  components/
    account/
    auth/
    AuthModal/
    home/
    monitoring/
    payments/
    search/
    security/
    seo/
    theme/
    ui/
    wizard/
  config/
  context/
  hooks/
  i18n/
  lib/
    admin/
    algolia/
    analytics/
    api/
    auth/
    cache/
    cars/
    cron/
    dealer/
    email/
    fallbacks/
    feature-flags/
    geo/
    inquiries/
    next/
    performance/
    privacy/
    search/
    security/
    seo/
    stripe/
    supabase/
    theme/
    upload/
  types/
  utils/
```

### Proposed feature-first tree

```text
src/
  app/
  config/
    config.ts
    brand.ts
    credits.ts
    feature-flags.ts
    vat.ts
  features/
    account/
      components/
      hooks/
      lib/
      types/
    admin/
      components/
      lib/
      types/
    auth/
      components/
      hooks/
      lib/
      types/
    dealer/
      components/
      lib/
      types/
    home/
      components/
      lib/
      types/
    inquiries/
      components/
      lib/
      types/
    listings/
      components/
      hooks/
      lib/
      types/
    search/
      components/
      hooks/
      lib/
      types/
    seo/
      components/
      lib/
      types/
  shared/
    analytics/
    api/
    content/
    email/
    security/
    supabase/
    theme/
    ui/
    utils/
  i18n/
```

### Moves I would do first

- `src/components/search/*` + `src/lib/algolia/*` + `src/lib/search/*`
  - Move to `src/features/search/`
- `src/components/AuthModal/*` + `src/components/auth/*` + `src/lib/auth/*`
  - Move to `src/features/auth/`
- `src/app/(site)/moj-ucet/*` + `src/components/account/*` + account-related `src/lib/*`
  - Move to `src/features/account/`
- `src/app/(site)/admin/*` + `src/lib/admin/*`
  - Move to `src/features/admin/`

## 3. Hardcoded Value Extraction

### Applied now

Created `src/config/config.ts` and moved repeated operational literals into grouped exports:

- `APP_URLS`
  - site origin
  - localhost origin
  - loopback origin
  - Google script URL
  - Resend API URL
  - Schema.org origin
  - Turnstile URLs
- `SEARCH_RESULTS_CONFIG`
  - search debounce timings
  - suggestion thresholds
  - local storage key
  - optional Algolia filter
- `AUTH_MODAL_CONFIG`
  - resend cooldown
  - resend tick interval
  - pointer/hover media queries
- `BRAND_VISUAL_CONFIG`
  - auth-panel gradient stop
  - auth-panel glow color
  - Google brand colors
- `SEO_CONFIG`
  - sitemap listing limit

### Files updated to use shared config

- `src/components/search/SearchResultsSearchBox.tsx`
- `src/components/AuthModal/useAuthModal.ts`
- `src/components/AuthModal/shared.tsx`
- `src/components/AuthModal/BrandedPanel.tsx`
- `src/lib/auth/request-origin.ts`
- `src/lib/auth/oauth-redirect.ts`
- `src/app/sitemap.ts`
- `src/app/robots.ts`

### Remaining high-priority extraction backlog

- Repeated site origin literals still exist in live metadata/content files:
  - `src/app/llms.txt/route.ts`
  - `src/app/(site)/ceny/page.tsx`
  - `src/app/(site)/cookies/page.tsx`
  - `src/app/(site)/kalkulacka-leasingu/page.tsx`
  - `src/app/(site)/o-nas/page.tsx`
  - `src/app/(site)/obchodne-podmienky/page.tsx`
  - `src/app/(site)/ochrana-udajov/page.tsx`
  - `src/app/(site)/predajcovia/page.tsx`
  - `src/app/(site)/vysledky/page.tsx`
  - `src/app/(site)/predajca/[slug]/page.tsx`
- Repeated email-template hex colors still exist in:
  - `src/lib/email/send-marketplace-alerts.ts`
  - `src/lib/email/send-moderation-decision.ts`
- Repeated theme hex values still exist in:
  - `src/app/globals.css`
  - `src/config/theme-brand.json`
- Remaining direct service URLs still exist in:
  - `src/lib/email/transactional-email.ts`
  - `src/components/GoogleOneTap.tsx`
  - `src/components/security/TurnstileCaptcha.tsx`
  - `src/lib/security/turnstile.ts`
  - `src/lib/seo/programmatic-inventory.ts`

## 4. Naming Standardization

### File names to rename

- `scripts/refactor.js`
  - Replace with `scripts/auth-modal-refactor-sandbox.js` if kept, otherwise delete.
- `scripts/test-all.ts`
  - Replace with `scripts/run-local-smoke-suite.ts`.
- `scripts/debug-filters.js`
  - Replace with `scripts/debug-search-filter-routing.js`.
- `tests/e2e.test.ts`
  - Replace with `tests/core-user-journeys.test.ts`.
- `src/components/AuthModal/shared.tsx`
  - Replace with `src/components/AuthModal/authModalPrimitives.tsx`.

### Code symbols to rename on next pass

- `DashboardClient`
  - Replace with `AccountDashboardClient`.
- `CreateListingTab`
  - Replace with `AccountCreateListingTab`.
- `MessagesTab`
  - Replace with `AccountMessagesTab`.
- `SettingsTab`
  - Replace with `AccountSettingsTab`.
- Generic Supabase response names like `data` / `error`
  - Replace with domain names where the scope is large, for example:
    - `savedSearchRows`
    - `userAdsRows`
    - `profileUpdateError`
    - `checkoutSessionResponse`

### Reason

The codebase has acceptable naming in small leaf files, but the large feature files still collapse multiple responsibilities into generic names that stop being descriptive once the file grows past a few hundred lines.

## 5. Top 5 Scalability Risks at 10,000 DAU

### 1. Account dashboard client is too large and too chatty

Failure mode:

- `src/app/(site)/moj-ucet/DashboardClient.tsx` is 3,200+ lines and mixes tab rendering, Supabase fetches, settings mutation, messages, and credit flows.
- At 10,000 DAU this becomes slower first paint, harder cache reuse, and duplicated client fetches per tab.

Fix:

```tsx
// Split tabs into lazy feature modules so inactive tabs do not fetch or render.
const AccountMessagesTab = dynamic(() => import("./tabs/AccountMessagesTab"));
const AccountSettingsTab = dynamic(() => import("./tabs/AccountSettingsTab"));

if (activeTab === "messages") {
  return <AccountMessagesTab userId={user.id} />;
}
```

### 2. Search suggestions still hit Algolia on every live keystroke path

Failure mode:

- Even with debounce, high concurrent typing volume creates a bursty read pattern.
- Mobile users and slow networks will amplify duplicate suggestion requests.

Fix:

```ts
const suggestionCache = new Map<string, SearchSuggestion[]>();

async function getCachedSuggestions(cacheKey: string, loader: () => Promise<SearchSuggestion[]>) {
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey) ?? [];
  }

  const suggestions = await loader();
  suggestionCache.set(cacheKey, suggestions);
  return suggestions;
}
```

Also add server-backed suggestion caching or edge caching for repeated prefixes.

### 3. Sitemap generation does a live database fetch on request

Failure mode:

- `src/app/sitemap.ts` queries up to 5,000 rows at request time.
- With traffic growth or crawler spikes, sitemap generation becomes DB-bound.

Fix:

```ts
// Precompute sitemap chunks on a schedule and serve static files.
export async function GET() {
  const xml = await readFile("public/sitemaps/active-listings.xml", "utf8");
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
```

### 4. Admin actions are doing too much inside one server module

Failure mode:

- `src/app/(site)/admin/actions.ts` is 1,700+ lines with moderation, email, revenue, and settings behavior.
- Higher DAU means more operational traffic and higher blast radius for every deployment.

Fix:

```ts
// src/features/admin/lib/moderation/sendApprovalEmail.ts
export async function sendApprovalEmail(input: ModerationApprovalEmailInput) {
  return sendModerationDecision({
    sellerEmail: input.sellerEmail,
    decision: "approved",
    dashboardUrl: input.dashboardUrl,
  });
}
```

Break by feature boundary and call thin orchestration actions from the route layer.

### 5. Email rendering and delivery are tightly coupled to request paths

Failure mode:

- Slow provider calls or transient provider issues will directly slow user-facing route handlers.
- Spikes in saved-search alerts or moderation emails will compete with interactive traffic.

Fix:

```ts
// Push email work into a queue table and let a cron worker drain it.
await supabase.from("email_jobs").insert({
  kind: "saved_search_alert",
  payload,
  status: "pending",
});
```

Then process the queue from a cron route with bounded batch sizes.

## 6. Worst File Rewrite

### Rewritten in this pass

- `src/components/search/SearchResultsSearchBox.tsx`

### Why this file

- It was carrying search input normalization, Algolia IO, keyboard handling, suggestion rendering, analytics, localStorage behavior, and URL/query sync in one place.
- It sat on a live, high-traffic route (`/vysledky`), so cleanup here pays back faster than rewriting a dead or admin-only file.

### What changed

- Moved all search thresholds and timings into `src/config/config.ts`.
- Rewrote the reducer and helper flow with descriptive names.
- Added explicit comments for:
  - input normalization
  - stale-request protection
  - external query sync
  - stale facet clearing
- Added external query synchronization so browser back/forward and external URL updates keep the input aligned.

### Biggest remaining messy file

- `src/app/(site)/moj-ucet/DashboardClient.tsx`

That is still the largest cleanup target in the repo and should be split by tab/feature next.
