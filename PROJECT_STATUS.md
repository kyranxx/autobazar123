# Autobazar123 Project Status

Last updated: 2026-06-23

## Source Of Truth

- This file is the only current launch handoff and implementation plan.
- Start every new Autobazar123 launch chat by reading this file first.
- Do not use removed launch audit/checklist/runbook files as instructions.
- Do not deploy, push, or apply DB migrations from dirty local `master`.

## Goal

Open Autobazar123 safely for public indexing, then start inviting Slovak dealers to add real ads.

## Current State

- Public SEO indexing is now open on Production.
- Production URL: `https://www.autobazar123.sk`.
- Current Production deployment: `dpl_5ZuwNLGU3S3JhqTzB4prN2UjcZLh`.
- Current clean reviewed deploy source: `C:\Users\User\Desktop\Projects\ab123-rs-153336`.
- Current clean reviewed source commit: `5ab7b09`.
- Local main repo `C:\Users\User\Desktop\Projects\autobazar123` is not the deploy source.
- Local `master` still contains deferred taxonomy/provider work and local-only migration `20260619214332_add_vehicle_taxonomy_metadata.sql`.
- `NEXT_PUBLIC_SITE_INDEXING_ENABLED=true` is set in Vercel Preview and Production.
- Dealer outreach has not started; it still needs separate owner approval for copy/sending.

## Verified Evidence

- Production buyer inquiry through real Turnstile is verified.
  - Command: `npm run check:human-inquiry-proof -- --json`
  - Result: passed with `matchingInquiries=1`, `freshMatchingInquiries=1`, `sellerRecipientMatches=1`.
  - Proof row: `2110435b-ed0a-4085-ac4d-70a855fc9f94`.
  - Target ad: `56e8e190-f13c-4398-8fb7-5183fc025aaa`.
- Production smoke is green.
  - Command: `$env:TEST_URL='https://www.autobazar123.sk'; npm run test:smoke`
  - Result: 10/10, average response 244ms.
- Public SEO indexing is open and verified on Production.
  - Deployment: `dpl_5ZuwNLGU3S3JhqTzB4prN2UjcZLh`.
  - `/robots.txt`: HTTP 200, allows `/`, does not `Disallow: /`, sitemap is `https://www.autobazar123.sk/sitemap.xml`, no `X-Robots-Tag`.
  - Homepage and `/vysledky`: HTTP 200, `meta robots` is `index, follow`, no `X-Robots-Tag`, canonicals stay on `https://www.autobazar123.sk`.
  - `/vysledky`: one server-visible `h1`, no double-brand title.
  - `/sitemap.xml`: HTTP 200, 130 `www` URLs, 0 non-`www` URLs.
  - Sampled sitemap URLs: 10/10 HTTP 200, no `X-Robots-Tag`.
- Algolia parity is green.
  - Command: `npm run check:algolia-search`
  - Result: 57 active Supabase ads / 57 Algolia records.
- Live RLS posture is green.
  - Command: `npm run check:live-rls-posture -- --json`
  - Result: 4/4 safe probes, 0 leaks.
- Production browser audit is green.
  - Command: `$env:TEST_URL='https://www.autobazar123.sk'; $env:PLAYWRIGHT_CHROMIUM_CHANNEL='chrome'; $env:WEBAPP_AUDIT_MODE='external'; $env:AUDIT_MAX_ROUTES='20'; npm run audit:webapp`
  - Result: 6/6 Playwright tests, 40/40 desktop/mobile routes, 0 failing routes, 0 DevTools issues.
- Production inquiry logs are green.
  - Real `POST /api/inquiries` returned HTTP 200.
  - Fresh scan found 0 5xx rows, 0 429 rows, and 0 `timeout` matches.
- Production post-opening logs are green.
  - Command: `npx vercel@54.14.5 logs https://www.autobazar123.sk --since 30m --json`
  - Parsed rows: 100 for deployment `dpl_5ZuwNLGU3S3JhqTzB4prN2UjcZLh`.
  - Result: 0 5xx, 0 429, 0 `timeout`, 0 fallback persistence matches, 0 critical route errors.
- Known watch item:
  - Occasional `Failed to persist fallback monitoring log` rows on HTTP 200 requests.
  - Not seen in the post-opening log sample.
  - Recheck before outreach.

## Remaining Before Dealer Outreach

1. Owner approval for dealer outreach copy/sending.
2. Reverify contacts from live dealer websites.
3. Start first dealer outreach batch only after approval.

## Public Launch Implementation Plan

### 1. Owner Approval Gate

Status: completed on 2026-06-23.

Required owner phrase before changing indexing:

```text
approve public SEO indexing
```

If this approval is missing, stop. Do not remove noindex, do not change `/robots.txt`, and do not start dealer outreach.

### 2. Clean Source Gate

Status: completed on 2026-06-23 from `C:\Users\User\Desktop\Projects\ab123-rs-153336`.

Use the clean reviewed source or create a fresh clean branch/worktree from it:

```text
C:\Users\User\Desktop\Projects\ab123-rs-153336
```

Verify before editing:

```powershell
git status --short --branch
npm run check:deploy-source-readiness -- --json
npm run check:launch-migration-worktree -- --root C:\Users\User\Desktop\Projects\ab123-rs-153336
```

Do not include the deferred taxonomy/provider lane unless the owner separately approves that feature.

### 3. Public SEO Indexing Work

Status: completed on 2026-06-23 through `NEXT_PUBLIC_SITE_INDEXING_ENABLED=true` in Vercel Preview and Production.

Use the SEO audit workflow for this lane.

First inspect indexing controls:

```powershell
rg -n "NEXT_PUBLIC_SITE_INDEXING_ENABLED|noindex|robots|X-Robots-Tag|Disallow" src next.config.* vercel.json
```

Open indexing through the configured mechanism, likely the site indexing flag/env plus the app robots/meta/header code path. Do not hardcode a one-page workaround.

Verify:

- `/robots.txt` no longer disallows all crawlers.
- Important public pages no longer emit `noindex`.
- Canonicals stay on `https://www.autobazar123.sk`.
- `/sitemap.xml` stays `www`.
- Sampled sitemap URLs return 200.
- `/vysledky` keeps one server-visible `h1`, no double-brand title, and correct canonical.

### 4. Final Release Checks

Status: completed on 2026-06-23 for Production deployment `dpl_5ZuwNLGU3S3JhqTzB4prN2UjcZLh`.

Run targeted checks for touched indexing/SEO code first.

Then run:

```powershell
$env:TEST_URL='https://www.autobazar123.sk'; npm run test:smoke
npm run check:algolia-search
npm run check:live-rls-posture -- --json
$env:TEST_URL='https://www.autobazar123.sk'; $env:PLAYWRIGHT_CHROMIUM_CHANNEL='chrome'; $env:WEBAPP_AUDIT_MODE='external'; $env:AUDIT_MAX_ROUTES='20'; npm run audit:webapp
```

Also scan Production logs for 5xx, 429, `timeout`, and critical route errors. If fallback-monitoring persistence errors are increasing or appear on inquiry/payment/signup, fix before outreach.

### 5. Dealer Outreach Gate

Do not send outreach until:

- public indexing/opening checks are green;
- owner approves outreach copy/sending;
- contacts are reverified from live dealer websites.

Dealer prep file:

```text
docs/ad-supply-launch-plan.md
```

Use it only for the prepared dealer batch and outreach copy, not for launch status.

## Next Clean Chat Prompt

Use this:

```text
Continue Autobazar123 launch implementation from C:\Users\User\Desktop\Projects\autobazar123. Read PROJECT_STATUS.md first and use it as the only source of truth. Do not use removed launch audit/checklist/runbook files. Public SEO indexing is already open on Production deployment dpl_5ZuwNLGU3S3JhqTzB4prN2UjcZLh. Do not start dealer outreach unless I explicitly approve outreach copy/sending. Start with the next required step, verify before claiming done, and keep reports short: Goal, Status, Evidence, Next, Need from me.
```
