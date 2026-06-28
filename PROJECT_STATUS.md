# Autobazar123 Project Status

Last updated: 2026-06-28

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
- Production deployment `dpl_2Aum27a7nyvnEaNJBm9Mi54Nm1s7` is Ready and aliased to `https://www.autobazar123.sk`.
- Current clean deploy source is local and remote `master` at commit `0d3f4b9`.
- Local repo `C:\Users\User\Desktop\Projects\autobazar123` is clean, tracks `origin/master`, and has no extra local branches or registered worktrees.
- Recovery points from the cleanup remain available:
  - stash `pre-master-reset-20260628-202709`;
  - bundle backup `C:\Users\User\Desktop\Projects\autobazar123-consolidation-backups\final-cleanup-20260628-202823\all-refs-before-branch-cleanup.bundle`.
- `NEXT_PUBLIC_SITE_INDEXING_ENABLED=true` is set in Vercel Preview and Production.
- Dealer outreach has not started; it still needs separate owner approval for copy/sending.

## Verified Evidence

- 2026-06-28 local consolidation checks are green.
  - Worktree: `C:\Users\User\.config\superpowers\worktrees\autobazar123\consolidate-master-20260628`.
  - `npm run typecheck`: passed.
  - `npm run lint`: passed with one existing warning in `tools/dealer-import-converter.mjs`.
  - `npm run build`: passed when local `.env.local` was loaded into the process.
  - `npx next build --webpack`: passed when local `.env.local` was loaded into the process.
  - `npm run test:security:release-gate`: passed.
  - `npm run check:production-bundle-budget`: passed from fresh Next build manifests.
  - `npm run check:vercel-ppr-lambda-blocker`: passed.
  - `git diff --check`: passed.
- 2026-06-28 local branch cleanup is partially complete.
  - Stale removed worktree entry was pruned.
  - Redundant `codex/fix-ad-breadcrumbs-20260628` worktree and branch were removed.
  - Stale `codex/breadcrumb-detail-live` branch was removed after confirming it is contained in the consolidation branch and backed up.
- 2026-06-28 master consolidation and cleanup is complete.
  - Consolidation was pushed to `origin/master` at commit `0d3f4b9`.
  - Local `master` was reset to `origin/master` and is clean.
  - Local branches: only `master`.
  - Remote branches: only `master`.
  - Registered worktrees: only `C:\Users\User\Desktop\Projects\autobazar123`.
  - `npm run check:deploy-source-readiness`: passed on clean `master`.
- 2026-06-28 post-push GitHub checks are green for commit `0d3f4b9`.
  - CodeQL: passed.
  - Production Postdeploy Smoke: passed.
  - Release Security Gate: passed.
  - Master Fast Gate: passed.
- 2026-06-28 Vercel production deployment is green.
  - Deployment: `dpl_2Aum27a7nyvnEaNJBm9Mi54Nm1s7`.
  - URL: `https://autobazar123-3k2fbwdal-daniels-projects-98c0558b.vercel.app`.
  - Aliases include `https://www.autobazar123.sk`.
  - `$env:TEST_URL='https://www.autobazar123.sk'; npm run test:smoke`: 10/10 passed, average response 446ms.
- 2026-06-28 SEO/domain source check is aligned to `https://www.autobazar123.sk`.
  - `src/config/brand.ts` uses `www.autobazar123.sk`.
  - `robots`, `sitemap`, and SEO tests expect `https://www.autobazar123.sk`.
- 2026-06-28 live SEO/domain check is aligned to `https://www.autobazar123.sk`.
  - Homepage, `/vysledky`, `/robots.txt`, and `/sitemap.xml`: HTTP 200.
  - Homepage canonical: `https://www.autobazar123.sk`.
  - `/vysledky` canonical: `https://www.autobazar123.sk/vysledky`.
  - Sampled pages and sitemap contained 0 apex `https://autobazar123.sk` refs.
- 2026-06-28 email/DKIM verification is not fully finishable from local access.
  - DNS has a TXT record at `resend._domainkey.mail.autobazar123.sk`.
  - Local `RESEND_API_KEY` returns HTTP 401 from Resend.
  - Local Cloudflare token is active but sees 0 zones for `autobazar123.sk`.
  - Owner must verify/update the domain in Resend and Cloudflare dashboard before marking professional email fully complete.
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
- 2026-06-23 master merge and branch cleanup was verified.
  - Dealer import launch prep is on `master` as clean commit `715d8fb`.
  - Framework patch posture fix is on `master` as clean commit `a80599f`.
  - Remote branches: only `refs/heads/master`.
  - Obsolete local branch `codex/dealer-import-pack` was deleted.
  - Temporary local branch/worktree `codex/framework-patch-gate-fix` / `C:\Users\User\Desktop\Projects\autobazar123-release-gate-fix` was deleted.
  - GitHub workflows on `a80599f`: CodeQL, Production Postdeploy Smoke, Release Security Gate, and Master Fast Gate all passed.
  - Direct production smoke after the master update passed 9/9 with 378ms average response.
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
