# Autobazar123 Project Status

Last updated: 2026-07-02

## Source Of Truth

- This file is the only current launch handoff and implementation plan.
- Start every new Autobazar123 launch chat by reading this file first.
- Do not use removed launch audit/checklist/runbook files as instructions.
- Do not deploy, push, or apply DB migrations from dirty local `master`.

## Goal

Open Autobazar123 safely for public indexing, then start inviting Slovak dealers to add real ads.

## Current State

- Public SEO indexing is open on Production.
- Production URL: `https://www.autobazar123.sk`.
- Latest functional release code is `605951f` (`Trim Upstash rate limit env values`) on top of `72945445` (`Add Romanian market foundation`).
- Verified production deployment `dpl_24dGuvqX2PGDdF3NT3btCBiJRnsX` is Ready and aliased to `https://www.autobazar123.sk`.
- Current live deploy source is remote `master`; later status-only commits may not change runtime code.
- Production homepage search-first change is live from commit `f1cf0dce` (`Make homepage search first`).
- Production login-modal first-click fix is live from commit `530798ab` (`Fix first login modal click`).
- RO market foundation has been reconciled onto release branch `codex/slate-clean-live-20260702`.
- Do not push or deploy unreconciled branch `codex/ro-market-foundation`; use the release branch or fresh `origin/master`.
- Registered worktrees currently include:
  - `C:\Users\User\Desktop\Projects\autobazar123` on `codex/slate-clean-live-20260702`;
  - `C:\Users\User\.config\superpowers\worktrees\autobazar123\results-ui-master` on local `master` at `530798ab`;
  - `C:\Users\User\.config\superpowers\worktrees\autobazar123\ui-marketplace-pro-redesign` on `codex/search-first-homepage-live-20260702`.
- Recovery points from the cleanup remain available:
  - stash `pre-master-reset-20260628-202709`;
  - bundle backup `C:\Users\User\Desktop\Projects\autobazar123-consolidation-backups\final-cleanup-20260628-202823\all-refs-before-branch-cleanup.bundle`.
- `NEXT_PUBLIC_SITE_INDEXING_ENABLED=true` is set in Vercel Preview and Production.
- Dealer outreach has not started; it still needs separate owner approval for copy/sending.
- Live Supabase migration `20260630090000_add_ad_market_code.sql` has been applied.
- Existing ads are backfilled to `market_code='SK'`; live check found 192 total SK ads, 0 RO ads, 0 null market codes, and 57 active SK ads.
- Algolia has been reindexed with `market_code`; filtered live check found `market_code:SK` = 57 hits and `market_code:RO` = 0 hits.
- Production Upstash rate-limit env values are trimmed before Redis initialization; latest log scan found no Upstash whitespace warning.

## Verified Evidence

- 2026-07-02 slate-clean release is live.
  - Code release commits pushed to remote `master`: `72945445` and `605951f`.
  - Supabase migration `20260630090000_add_ad_market_code.sql` was applied to linked live DB.
  - Live DB check: 192 SK ads, 0 RO ads, 0 null market codes, 57 active SK ads.
  - Algolia reindex wrote 57 active SK records; filtered checks returned SK = 57 and RO = 0.
  - Local focused RO/search/SEO/i18n Vitest set: 47/47 passed.
  - Local rate-limit/env regression tests: 8/8 passed.
  - `npm run typecheck`: passed.
  - `npm run lint`: passed with the known existing warning in `tools/dealer-import-converter.mjs`.
  - `npm run test:security:release-gate`: passed.
  - `npm run build`: passed locally and on Vercel Production.
  - `npm run test:seo-taxonomy`: passed.
  - `npm run check:production-bundle-budget`: passed.
  - `npm run check:vercel-ppr-lambda-blocker`: passed.
  - Local `npm run test:db:rls` could not run because Docker Desktop was not running; live RLS posture check passed instead.
  - GitHub checks for `605951f`: CodeQL, Release Security Gate, Master Fast Gate, and Production Postdeploy Smoke passed.
  - Production deployment `dpl_24dGuvqX2PGDdF3NT3btCBiJRnsX`: Ready and aliased to `https://www.autobazar123.sk`.
  - `$env:TEST_URL='https://www.autobazar123.sk'; npm run test:smoke`: 10/10 passed, average response 353ms.
  - `npm run check:algolia-search`: 57 active Supabase ads / 57 Algolia records.
  - `npm run check:live-rls-posture -- --json`: 4/4 safe probes, 0 leaks.
  - Vercel log scan after the final deployment: 12 rows, 0 matches for 5xx, 429, timeout, critical errors, fallback persistence errors, or Upstash whitespace warnings.
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
- 2026-06-28 post-push GitHub checks are green for the consolidation and status-only handoff commits.
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
  - Owner dashboard access is still useful for Resend/Cloudflare domain-status visibility.
- 2026-06-28 email follow-up check narrowed the blocker.
  - Production `/api/health`: HTTP 200 with `status: healthy`, so production has non-empty email runtime config.
  - Vercel Production env names exist for `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID`.
  - Vercel local env pull/run exposes empty values for encrypted `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, and `CLOUDFLARE_API_TOKEN`; provider API verification cannot be done from local CLI.
  - Root inbound mail DNS is present: `autobazar123.sk` has Google MX, Google SPF, and root DMARC `p=none`.
  - Sending subdomain DNS is incomplete to verify from public DNS alone: `mail.autobazar123.sk` has no SPF/MX/DMARC; only `resend._domainkey.mail.autobazar123.sk` DKIM TXT is visible.
  - Final runtime send proof was completed by one owner-approved live transactional email smoke.
- 2026-06-29 production transactional email smoke is green.
  - Preflight queue check: 0 pending jobs, 0 processing jobs.
  - Inserted one smoke-only `auth_password_reset` job: `068a8607-e553-4280-8ea4-7dc88e758b39`.
  - Recipient: `delivered+ab123-smoke-20260628222421@resend.dev`.
  - Production cron `GET /api/cron/process-email-jobs`: HTTP 200, `claimed=1`, `sent=1`, `requeued=0`, `failed=0`.
  - `email_jobs` proof: status `sent`, attempts `1`, processed at `2026-06-28T22:24:57.710Z`, error `null`.
  - `email_deliveries` proof: row `31b32308-1f71-468f-8177-6c69ab021921`, provider `resend`, provider message ID `56ed8d6c-ec79-474c-aea4-476cf3440c09`, status `sent`.
  - Post-smoke queue check: 0 pending jobs, 0 processing jobs.
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

## Active Coordination Snapshot

- Coordinator thread: `019f22dd-4e02-74c1-ba02-2047f1337855`.
- RO market/code thread: `019f12fb-e389-7843-b33f-abf0e0e5549b`.
- Brand naming thread: `019f1fe1-f96c-75a3-a3ad-831d7850978d`; research only, no code changes expected.
- Homepage/search-first thread: `019f1fd8-8d9c-7910-8cd4-8ef7bc4e455d`; live change completed at `f1cf0dce`.
- Collision rule: do not resume or deploy old `codex/ro-market-foundation` directly; it has been superseded by `codex/slate-clean-live-20260702`.
- Release rule: `.ro` is not public-launch-ready until Romanian copy review, domain/DNS setup, and final SK/RO SEO/search isolation checks are complete. The shared market foundation, live DB migration, and Algolia reindex are now done.

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

Status: completed for the latest verified Production deployment `dpl_24dGuvqX2PGDdF3NT3btCBiJRnsX`.

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
Continue Autobazar123 launch implementation from C:\Users\User\Desktop\Projects\autobazar123. Read PROJECT_STATUS.md first and use it as the only source of truth. Do not use removed launch audit/checklist/runbook files. Public SEO indexing and the SK/RO market foundation are live on Production; latest functional release code is 605951f. Do not start dealer outreach unless I explicitly approve outreach copy/sending. Start with the next required step, verify before claiming done, and keep reports short: Goal, Status, Evidence, Next, Need from me.
```
