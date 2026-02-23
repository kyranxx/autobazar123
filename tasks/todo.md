# Active Todo

## Full Adoption Of Suggested Priorities (2026-02-23)

- [x] Build a LINKS ingestion pipeline with dedupe + snapshot outputs.
- [x] Publish project `llms.txt` for agent-friendly context discovery.
- [x] Implement formal security release gate (policy checks + CI workflow).
- [x] Add agent benchmark suite with machine-readable rubric and scoring tool.
- [x] Add reusable agent contract template plus validator.
- [x] Add UI quality automation gate command and workflow documentation.
- [x] Build project skill graph (linked markdown nodes with frontmatter metadata).
- [x] Add analytics governance package (typed event taxonomy + docs + tests).
- [x] Run verification suite for all new tooling.
- [x] Commit and push all changes.

## Review (Full Adoption Of Suggested Priorities)

- LINKS ingestion pipeline implemented in:
  - `scripts/links-ingest.mjs`
  - `scripts/links-ingest.test.mjs`
  - `docs/links-ingestion.md`
  - command: `npm run links:ingest`
- Agent-friendly context published in:
  - `public/llms.txt`
- Security release gate implemented in:
  - `config/security-release-policy.json`
  - `scripts/security-release-gate.mjs`
  - `scripts/security-release-gate.test.mjs`
  - `.github/workflows/release-security-gate.yml`
  - commands:
    - `npm run test:security:policy`
    - `npm run test:security:release-gate`
- Agent benchmark suite implemented in:
  - `benchmarks/agent-suite/tasks.json`
  - `scripts/agent-benchmark.mjs`
  - `scripts/agent-benchmark.test.mjs`
  - `docs/agent-benchmark-suite.md`
- Reusable agent contract implemented in:
  - `contracts/agent-contract.template.json`
  - `contracts/agent-contract.json`
  - `scripts/agent-contract-check.mjs`
  - `scripts/agent-contract-check.test.mjs`
  - command: `npm run test:agent-contract`
- UI quality automation implemented in:
  - `scripts/ui-quality-gate.mjs`
  - `scripts/ui-quality-gate.test.mjs`
  - command: `npm run test:ui-quality-gate`
- Skill graph implemented in:
  - `skills-graph/index.md` + domain map/node files
  - `scripts/skill-graph-check.mjs`
  - `scripts/skill-graph-check.test.mjs`
  - command: `npm run test:skill-graph`
- Analytics governance implemented in:
  - `src/lib/analytics/events.ts`
  - `src/lib/analytics/events.test.ts`
  - `docs/analytics-governance.md`
- Verification run:
  - `npm run test:workflow-check`
  - `npm run test:links-ingest`
  - `npm run test:security-gate-script`
  - `npm run test:security:release-gate`
  - `npm run test:agent-benchmark-script`
  - `npm run test:agent-contract-script`
  - `npm run test:agent-contract`
  - `npm run test:skill-graph-script`
  - `npm run test:skill-graph`
  - `npm run test:ui-quality-gate-script`
  - `node scripts/ui-quality-gate.mjs --core-only`
  - `npx vitest run src/lib/analytics/events.test.ts`

## Analytics Instrumentation Scan (2026-02-23)

- [ ] Catalog existing analytics instrumentation surfaces and config files (events, PostHog, helpers).
- [ ] Note the conventions/structures already in place to guide a typed event taxonomy.
- [ ] Recommend minimal-impact location for a typed taxonomy and tracking helpers plus next steps.
- [ ] Record review notes or follow-up actions in this file after summarizing findings.

## Links Recovery + Deep Link Analysis (2026-02-23)

- [x] Recover previously removed `LINKS.md` entries from git history.
- [x] Restore recovered historical links under `## DONE` in `LINKS.md`.
- [x] Deep-read every current `## TODO` item in `LINKS.md` (including all `x.com` links).
- [x] Produce per-link extraction guidance for current project and future projects.
- [x] Add review notes with evidence and residual risks.

## Review (Links Recovery + Deep Link Analysis)

- Restored the historical link batch from `LINKS.md` git history (`44f780e`) into the current `## DONE` section.
- Analyzed every `## TODO` entry end-to-end and captured source material in `output/link_research/`.
- For `x.com` long-form posts, extracted structured content from `https://api.fxtwitter.com/status/<id>` to avoid shallow/login-gated analysis.
- For Reddit, used JSON endpoint fallback (`.../.json?raw_json=1`) to retrieve full post body when direct page fetch returned 403.
- Residual risk:
  - `https://openai.com/sk-SK/index/introducing-aardvark/` returns anti-bot `403` for anonymous fetches, so conclusions rely on OpenAI search-snippet metadata and secondary context rather than full page body extraction.

## Interactive Cursor Consistency (2026-02-23)

- [x] Add global cursor policy so clickable controls use pointer cursor consistently.
- [x] Preserve disabled/non-interactive cursor semantics.
- [x] Verify in runtime and document review notes.

## Review (Interactive Cursor Consistency)

- Implemented a global cursor policy in `src/app/globals.css`:
  - Interactive controls now consistently use `cursor: pointer !important`.
  - Disabled controls use `cursor: not-allowed !important`.
- Coverage includes:
  - `a[href]`, `button`, submit/reset/button inputs, `summary`, labels with `for`,
    and ARIA controls (`role="button"` / `role="menuitem"` when not disabled).
- Verification:
  - Updated cascade strength after follow-up report that account tabs/avatar still rendered default cursor in real session.
  - `npx tsc --noEmit` passes.

## OAuth Local Setup Hardening (2026-02-22)

- [x] Add explicit local OAuth callback origin in local env config.
- [x] Document required Supabase Auth redirect allow-list entries for local Google OAuth.
- [x] Verify with targeted tests/typecheck and direct authorize endpoint inspection.
- [x] Add review notes with exact manual validation steps.

## Review (OAuth Local Setup Hardening)

- Added explicit local OAuth callback origin in `.env.local`:
  - `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN=http://localhost:3000`
- Documented local Google OAuth requirements in:
  - `README.md`
  - `docs/PROJECT_PLAYBOOK.md`
- Verification:
  - `npx vitest run src/lib/auth/oauth-redirect.test.ts src/components/AuthModal.email-flow.test.tsx`
  - `npx tsc --noEmit`
  - Direct Supabase authorize endpoint check confirms local callback is carried in provider URL:
    - `GET /auth/v1/authorize?...redirect_to=http://localhost:3000/auth/callback` returns `302` with Google `Location` containing `redirect_to=http://localhost:3000/auth/callback`.
- Manual validation steps:
  - In Supabase Dashboard -> Authentication -> URL Configuration:
    - Add `http://localhost:3000/auth/callback`
    - Add `http://127.0.0.1:3000/auth/callback` (if used)
  - Restart local dev server, click Google login, complete flow, confirm final URL remains on localhost.

## Google OAuth Redirect Should Stay on Localhost (2026-02-22)

- [x] Trace Google OAuth redirect construction and callback host resolution.
- [x] Implement a root-cause fix so localhost OAuth always uses localhost callback origin in dev.
- [x] Add targeted tests for redirect-origin resolution (localhost vs production).
- [x] Verify with automated tests and document review notes.

## Review (Google OAuth Redirect Should Stay on Localhost)

- Root cause:
  - OAuth start flow could silently continue with a provider URL whose `redirect_to` had been normalized to production by upstream auth configuration, causing the browser to leave localhost.
- Fix:
  - Added `src/lib/auth/oauth-redirect.ts` to centralize callback URL resolution and provider redirect-target validation.
  - Updated `src/components/AuthModal.tsx` Google login flow to:
    - Resolve callback URL via shared helper.
    - Use `skipBrowserRedirect: true`.
    - Validate returned provider URL `redirect_to` before navigation.
    - Block navigation with a clear error when callback target mismatches expected localhost callback.
- Verification:
  - `npx vitest run src/lib/auth/oauth-redirect.test.ts src/components/AuthModal.email-flow.test.tsx`
  - `npx tsc --noEmit`
- Residual requirement:
  - Supabase Auth redirect allow-list must include `http://localhost:3000/auth/callback` (or configured local origin) for OAuth to complete locally.

## Harden Port 3000 Enforcement (2026-02-22)

- [x] Improve `--ensure-3000` logic to detect all owner PIDs for port 3000 on Windows.
- [x] Add retry/recheck loop before launching Next.js.
- [x] Fail with explicit owner PID list if port cannot be freed.
- [x] Verify `npm run dev:reset` no longer falls to 3001 or unclear failures.

## Review (Harden Port 3000 Enforcement)

- Updated `scripts/dev-reset.mjs` to harden port cleanup:
  - Detects owner PID(s) for port `3000` via `Get-NetTCPConnection` with `netstat` fallback.
  - Kills detected owner PID(s) and retries with short waits.
  - Throws explicit error with remaining PID list if port still cannot be freed.
- Verification:
  - `npm run dev:reset -- --dry-run` shows `Freeing port 3000... ok`.
  - Real run (`npm run dev:reset`) now starts with:
    - `next dev --port 3000`
    - `Local: http://localhost:3000`
  - `curl -I http://localhost:3000` returns `200`.

## Align dev:reset With :reset (2026-02-22)

- [x] Update `package.json` so `dev:reset` also uses `--ensure-3000`.
- [x] Verify `npm run dev:reset -- --dry-run` includes port-3000 cleanup step.
- [x] Document parity behavior in review notes.

## Review (Align dev:reset With :reset)

- `dev:reset` now matches `:reset` behavior exactly.
- Both commands now run:
  - `node scripts/dev-reset.mjs --ensure-3000`
- Verification:
  - `npm run dev:reset -- --dry-run` now prints:
    - `Freeing port 3000... ok`
- Result:
  - Whether you type `npm run dev:reset` or `npm run :reset`, it now forces startup on `3000` using the same recovery path.

## Short Alias For Port 3000 Reset (2026-02-22)

- [x] Add memorable npm alias command `:reset`.
- [x] Extend reset script to optionally guarantee port `3000`.
- [x] Verify dry-run and real startup path for the new alias.
- [x] Add review notes and usage example.

## Review (Short Alias For Port 3000 Reset)

- Added alias: `:reset` in `package.json`:
  - `npm run :reset` -> `node scripts/dev-reset.mjs --ensure-3000`
- Extended `scripts/dev-reset.mjs`:
  - Added `--ensure-3000` mode.
  - Kills process(es) listening on port `3000`.
  - Starts `next dev --port 3000`.
- Verification:
  - `npm run :reset -- --dry-run` succeeds.
  - `npm run :reset` starts Next on `http://localhost:3000`.
  - `curl -I http://localhost:3000` returns `200`.
  - `curl -I http://localhost:3001` fails (not used), confirming no fallback to 3001.
- Usage:
  - Use `npm run :reset` whenever you just want the app back on `3000` quickly.

## Dev Reset Spawn EINVAL Fix (2026-02-22)

- [x] Patch `scripts/dev-reset.mjs` to avoid Windows Git Bash `spawn EINVAL` when starting dev server.
- [x] Verify with `npm run dev:reset -- --dry-run`.
- [x] Verify with `npm run dev:reset` that startup reaches Next.js boot logs.
- [x] Add review notes and residual risk.

## Review (Dev Reset Spawn EINVAL Fix)

- Root cause:
  - `scripts/dev-reset.mjs` started dev using `spawn("npm.cmd", ..., stdio: "inherit")`, which can fail with `spawn EINVAL` in Windows Git Bash terminals.
- Fix:
  - Switched start step to `spawnSync("npm", ["run", "dev"], { shell: isWindows, stdio: "inherit" })`, which is shell-compatible on Windows across PowerShell/CMD/Git Bash.
- Verification:
  - `npm run dev:reset -- --dry-run` succeeds.
  - `npm run dev:reset` no longer throws `spawn EINVAL`; dev server is reachable (`curl -I http://localhost:3000` returns `200`).
- Residual risk:
  - Running `dev:reset` from automated tools can appear as timeout because it intentionally keeps `next dev` running in the foreground.

## Dev Lock Fast Reset Command (2026-02-22)

- [x] Add a dedicated `dev:reset` script entry in `package.json`.
- [x] Implement `scripts/dev-reset.mjs` to stop stale local `next dev` processes and remove `.next/dev/lock`.
- [x] Verify script behavior with a dry-run invocation.
- [x] Add review notes with exact usage.

## Review (Dev Lock Fast Reset Command)

- Added `npm run dev:reset` in `package.json`.
- Implemented `scripts/dev-reset.mjs`:
  - Stops stale `next dev` processes for this repo only.
  - Removes stale `.next/dev/lock` if present.
  - Starts a fresh `npm run dev` process.
  - Supports `--dry-run` for safe verification.
- Verification:
  - `npm run dev:reset -- --dry-run`
  - Output confirmed both reset steps run successfully.
- Usage:
  - Run `npm run dev:reset` whenever you see `Unable to acquire lock at .next/dev/lock`.

## Slovak Diacritics Cleanup (2026-02-22)

- [x] Audit visible Slovak UI strings missing diacritics on detail route and shared UI.
- [x] Correct hardcoded strings in `src/app/auto/[id]/CarDetailClient.tsx`.
- [x] Correct shared auth/saved-ad/navbar strings with missing diacritics.
- [x] Verify via `npx tsc --noEmit` and targeted UI/email tests.
- [x] Add review notes and residual risk.

## Review (Slovak Diacritics Cleanup)

- Scope:
  - Corrected Slovak diacritics and wording across detail page, auth flows, search metadata/headings, admin logs labels, recently sold demo locations, and email templates.
  - Updated affected tests to assert accented Slovak output.
- Verification:
  - `npx tsc --noEmit`
  - `npx vitest run src/components/AuthModal.password-strength.test.tsx src/components/AuthModal.email-flow.test.tsx src/lib/email/react-email-templates.test.ts`
- Residual risk:
  - Dynamic content loaded from database can still contain unaccented input and is outside static source copy cleanup.

## CSP Coverage Audit (2026-02-22)

- [ ] Inventory external origins loaded by client-rendered pages/scripts/styles/images/frames/connect flows.
- [ ] Cross-check actual origins against `src/proxy.ts` CSP rules and the fallback policy in `next.config.ts`.
- [ ] List concrete conflicts/missing origins and recommend the minimal secure directive updates.
- [ ] Capture any remaining verification steps or uncertainties.

## Security Gate Assessment (2026-02-23)

- [ ] Review the repo for existing security gate/check scripts, policies, and CI workflow references.
- [ ] Identify where a formal release security gate command and policy checks could slot into the existing automation (scripts, workflows, docs).
- [ ] Collect evidence (files/sections) that support the best placement and note requirements for the new gate.
- [ ] Summarize findings and recommendations in this task output.

## Search page ads missing on load (2026-02-22)

- [x] Review `src/app/vysledky/AlgoliaSearchPageClient.tsx` and connected hooks/components to map the current search lifecycle.
- [x] Pinpoint why the initial Algolia query returns zero hits and determine which config/state is wrong.
- [x] Propose a minimal change (with file/line references) that ensures the query populates immediately.
- [x] Summarize findings and residual checks for the investigation.

## Review (Search page ads)

- Findings: Initial render reached `SortedHits` before Algolia results had settled; `status` was still `idle`, so `sortedItems` was empty and the empty-state card (NoResults) appeared before any cars were fetched, giving the impression of zero ads on load.
- Verification: `playwright` navigation to `/vysledky` showed Algolia queries returning 24 hits once the request resolved; `SortedHits` now treats the `idle` status as “still updating,” so the loading skeleton stays up until hits arrive.
- Notes: No automated tests were run because the fix only affects the client rendering timing; watch for the initial loading skeleton to disappear in the browser after applying the patch.

## Slovak string audit (2026-02-22)

- [x] Search `src` for the listed Slovak words that likely miss diacritics.
- [x] Confirm each match is user-facing and note the corrected spelling.
- [x] Document findings for handoff (summary + verification details).

## Review (Slovak string audit)

- Findings:
  - Identified 25+ user-facing literals in `src` that either omit Slovak diacritics entirely (e.g., `Napisat spravu`, `Predajca`) or use incorrect forms of the listed keywords.
  - Corrections touch only `CarDetailClient`, the saved ad hook, and the auth/reset UI so the rest of the code remains untouched.
- Verification:
  - Ran targeted `rg` searches for each keyword and reviewed the surrounding JSX/JS strings to ensure they render on the front end.
- Notes:
  - None; no further action pending.

## Search Results Initial Load Bug (2026-02-22)

- [x] Reproduce and isolate why `/vysledky` shows `0 vozidiel` with no cards on first load.
- [x] Apply a minimal app-wide fix so initial search hits are requested and rendered immediately.
- [x] Verify in browser that result cards render on initial page load without manual interaction.
- [x] Add review notes and any residual risk.

## Review (Search Results Initial Load Bug)

- Root cause:
  - `src/app/vysledky/SearchPageClient.tsx` loaded `AlgoliaSearchPageClient` via `next/dynamic` with `ssr: false`. On first route load this deferred client search tree initialization and produced an initial empty-state render (`0 vozidiel` / no cards) until extra client interactions occurred.
- Fix:
  - Replaced the dynamic wrapper with a direct client import/render of `AlgoliaSearchPageClient` in `src/app/vysledky/SearchPageClient.tsx`.
- Verification:
  - `npx tsc --noEmit` passes.
  - Browser validation with Playwright on `http://localhost:3000/vysledky` shows initial load now requests the hits query (`hitsPerPage: 24`) and renders `60 vozidiel` with `24` cards without manual interaction.
- Residual risk:
  - Removing lazy-loading slightly increases initial JS for this route; behavior is correct, but bundle/perf can be re-tuned later if needed.

## Dev Runtime Crash: transformAlgorithm (2026-02-22)

- [x] Reproduce `controller[kState].transformAlgorithm is not a function` with full stack context.
- [x] Identify the concrete source creating an invalid `TransformStream` transformer.
- [x] Implement a root-cause fix (no workaround) in the responsible module.
- [x] Verify by restarting dev server and exercising affected routes.
- [x] Record review notes and any residual risk.

## Review (Dev Runtime Crash: transformAlgorithm)

- Root cause:
  - Chrome probes `/.well-known/appspecific/com.chrome.devtools.json` when DevTools is open. This request was passing through `src/proxy.ts` and falling into streamed app rendering (404 shell), which is an unnecessary middleware path for well-known probes and can trigger unstable transform-stream behavior in dev.
- Fix:
  - Excluded `/.well-known/*` from proxy matching in `src/proxy.ts`.
  - Added `public/.well-known/appspecific/com.chrome.devtools.json` so the probe resolves as static JSON instead of app-rendered fallback.
  - Kept `/vysledky` stable by treating `idle` as updating in `SortedHits` and fixed multi-hook InstantSearch suspense usage in `SearchResultsSearchBox`.
- Verification:
  - `npx tsc --noEmit`
  - `curl -I http://localhost:3000/.well-known/appspecific/com.chrome.devtools.json` returns static JSON headers without `x-middleware-applied`.
  - Playwright check on `/vysledky` now shows `60 vozidiel`, `24` cards, and `0` page errors.
  - Dev logs no longer show the previous multi-hook warning and did not reproduce the `transformAlgorithm` crash after restart and route exercise.
- Residual risk:
  - `react-instantsearch-nextjs` still logs its standard experimental notice in development; this is expected from the library and not a runtime failure.

## Google OAuth redirect host bug (2026-02-22)

- [ ] Trace where Google login redirect/callback host is selected (local vs production).
- [ ] Identify all files/functions involved in OAuth redirect URL, confirm why production domain is used locally.
- [ ] Implement minimal correction so Google login stays on `http://localhost:3000` in dev without hacks.
- [ ] Add or update tests (unit/integration) covering host selection and redirect URL.
- [ ] Document verification steps/residual risk in review notes.

## SEO/pSEO Inventory & Guidance (2026-02-23)

- [ ] Enumerate existing SEO or programmatic-SEO documentation, policies, or route patterns in the repo.
- [ ] Identify current pSEO implementation touchpoints (pages, templates, helpers, middleware) and capture their status.
- [ ] Recommend governance or documentation additions that avoid duplicating existing work.
- [ ] Record verification insights (paths reviewed, gaps found, follow-up questions) for transparency.
