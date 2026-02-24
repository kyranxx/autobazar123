# Lessons Learned

## 2026-02-19

- User preference correction:
  - Pattern: user rejected a soft roadmap and wanted strict execution order with hard gates.
  - Rule: when presenting execution plans for this project, default to strict priority order, objective pass/fail gates, and explicit completion criteria.
  - Prevention: avoid time-boxed "soft" plans unless user asks for them explicitly.

- User expectation correction:
  - Pattern: user does not accept "gate complete" unless the gate is enforced in practice across the whole applicable surface (for UI: site-wide, not a small route sample).
  - Rule: when claiming a gate is complete, ensure enforcement scope matches user intent (full webapp coverage for site-wide gates).
  - Prevention: convert partial checks into explicit `core` vs `site-wide` gates and run both before reporting completion.

- User context correction:
  - Pattern: user intentionally deleted an older security-analysis file and asked to continue without treating it as an accidental repo issue.
  - Rule: when unexpected file removals appear, confirm user intent first and preserve intentional cleanup decisions while ensuring required tracked files remain intact.
  - Prevention: verify tracked-file state with `git ls-files` + `git status` before escalating a deletion as a blocker.

- Scope-priority correction:
  - Pattern: user explicitly chose an `Adopt-now only` execution mode and asked to ignore backlog.
  - Rule: when user says to forget backlog, stop presenting backlog as active work and treat it as archived context only.
  - Prevention: keep docs and summaries aligned to active scope (`Adopt now`) and avoid backlog next-step suggestions unless user re-enables them.

- Todo hygiene correction:
  - Pattern: user wants `tasks/todo.md` to contain only current active tasks, not completed history.
  - Rule: keep `tasks/todo.md` as an active queue only.
  - Prevention: after tasks are done, remove them from `tasks/todo.md` and rely on Git history for completed audit trail.

## 2026-02-22

- Verification scope correction:
  - Pattern: changed-files `react-doctor` can be clean while full-repo baseline still has warnings.
  - Rule: always distinguish `changed-files` vs `full-repo` results explicitly and keep `tasks/todo.md` numbers aligned to the latest full-repo scan.
  - Prevention: before declaring repo-wide completion, run `npx react-doctor --yes --offline` on a clean tree and record exact totals.

- Runtime validation correction:
  - Pattern: typecheck/build may pass while dev runtime still throws context-boundary errors (`useAuth must be used within an AuthProvider`).
  - Rule: for provider/context refactors, include an explicit browser runtime check for console/page errors on key routes in addition to static checks.
  - Prevention: prefer a dedicated `app/providers.tsx` client wrapper for global providers and run a targeted Playwright console check after wiring changes.

- i18n provider parity correction:
  - Pattern: using a custom `NextIntlClientProvider` wrapper without forwarding `timeZone` triggers `ENVIRONMENT_FALLBACK` and potential SSR/client mismatches.
  - Rule: when wrapping `NextIntlClientProvider`, always pass `locale`, `messages`, and `timeZone` from server.
  - Prevention: source `timeZone` from `getTimeZone()` in layout and keep request config timezone aligned.

- Communication clarity correction:
  - Pattern: user flagged confusion when a future recommendation was phrased as an optional follow-up instead of executed immediately.
  - Rule: when proposing a high-value cleanup, either implement it in the same flow or explain it in one sentence with concrete impact and exact next action.
  - Prevention: avoid vague "we can do X next" phrasing; use explicit plain-language outcomes and execute recommended maintenance tasks by default.

- Execution proof correction:
  - Pattern: user challenged whether a CLI command could actually be executed from the current environment.
  - Rule: when capability is questioned, run the exact command and report the real output/blocker instead of answering hypothetically.
  - Prevention: prioritize direct command execution + concrete logs for deployment/migration operations.

- Upstream-warning handling correction:
  - Pattern: user wanted full warning cleanup, but one warning came from vendor code with no supported disable flag.
  - Rule: verify upstream source/options first, then only promise removals that are technically achievable without unsupported suppression.
  - Prevention: when warning is vendor-emitted, report concrete proof (version + source behavior) and present only architecture-level alternatives.

- Scope coverage correction:
  - Pattern: route-level CSP fix was accepted technically but user required an app-wide policy fix.
  - Rule: when user reports security-header/CSP issues after a localized fix, escalate immediately to shared policy normalization across all header emitters and routes.
  - Prevention: default to single-source-of-truth security policy modules and verify across multiple representative routes before marking complete.

- Root-cause depth correction:
  - Pattern: console/CSP cleanup passed, but user-visible image issue persisted because the true blocker was empty `ads.photos_json` data.
  - Rule: when media placeholders remain after frontend/header fixes, validate persisted data (`photos_json` counts and sample URLs) before claiming resolution.
  - Prevention: include a mandatory data-layer verification step for image incidents: DB row check + rendered `img.currentSrc` check on affected route.

- Localization quality correction:
  - Pattern: route-level copy fixes missed many unaccented Slovak literals in shared/auth/email/admin surfaces.
  - Rule: when user reports Slovak diacritics issues, perform an app-wide literal audit (UI + metadata + templates + related tests), not only the visible route.
  - Prevention: run a targeted `rg` sweep for common unaccented Slovak phrases and verify both runtime strings and test expectations before closing.

- Search bootstrap correction:
  - Pattern: `/vysledky` rendered `0 vozidiel` on first load because the results client was wrapped in `next/dynamic` (`ssr: false`), delaying the search tree enough to show an empty state before hits populated.
  - Rule: for critical, data-first route content, avoid unnecessary lazy wrappers around the primary client search container unless there is a measured perf requirement.
  - Prevention: validate a cold-load route state (no interaction) with a real browser check and confirm first-request payload includes the expected hits query.

- i18n consistency correction:
  - Pattern: user reminded that language text should be managed via i18n, not ad-hoc literals.
  - Rule: for user-facing copy changes, prefer `next-intl` translation keys over hardcoded strings whenever that UI can be localized.
  - Prevention: before finalizing UI edits, quickly scan touched files for new literals and map them to existing/new locale keys.

- Well-known probe handling correction:
  - Pattern: browser/DevTools probe paths under `/.well-known/*` were routed through app middleware, creating unnecessary SSR fallback rendering and unstable dev-time stream behavior.
  - Rule: exclude `/.well-known/*` from middleware/proxy matching and serve required probe files as static assets.
  - Prevention: when debugging startup/runtime errors with DevTools open, include `/.well-known/appspecific/com.chrome.devtools.json` in route diagnostics and verify it bypasses middleware.

- Windows terminal compatibility correction:
  - Pattern: helper script process launch worked in one shell but failed in Git Bash with `spawn EINVAL` when using `spawn("npm.cmd", ..., stdio: "inherit")`.
  - Rule: for Windows CLI launcher scripts, prefer shell-compatible invocation (`spawnSync("npm", ..., { shell: true })`) when forwarding interactive stdio.
  - Prevention: validate new developer scripts in at least two local terminal contexts (PowerShell and Git Bash) before marking complete.

- Developer ergonomics correction:
  - Pattern: repetitive multi-step port/process cleanup creates friction when the user needs to quickly return to a known dev state.
  - Rule: provide short, memorable aliases for common recovery workflows (for example `npm run :reset`) while keeping explicit verbose commands available.
  - Prevention: whenever a workflow is likely to be run often under pressure, add a mnemonic command and verify it end-to-end.

- Alias parity correction:
  - Pattern: introducing a new short alias while keeping an older command with different behavior caused confusion (`dev:reset` did not force `3000`, `:reset` did).
  - Rule: when two commands are presented as alternatives, keep their behavior equivalent unless the difference is explicit in the name.
  - Prevention: after adding any shortcut command, validate the original command path for parity and update both if needed.

- Port cleanup robustness correction:
  - Pattern: a single-pass port cleanup can miss active owners, leading to `EADDRINUSE` or port fallback even after "cleanup".
  - Rule: for forced-port startup scripts, use detect-kill-recheck retries and fail with explicit blocking PID(s) when cleanup is incomplete.
  - Prevention: include both primary and fallback PID discovery methods on Windows (`Get-NetTCPConnection` + `netstat`) before starting the server.

## 2026-02-23

- OAuth diagnosis correction:
  - Pattern: assumed Supabase redirect allow-list was missing even though user had already configured localhost callback URLs.
  - Rule: for OAuth redirect incidents, verify the runtime `redirect_to` value from the actual authorize URL before recommending dashboard config changes.
  - Prevention: reproduce the flow from the reported origin (localhost vs production), capture the generated provider URL, and only then identify missing settings.

- Cursor UX correction:
  - Pattern: initial global cursor fix looked correct in one route but still failed on key real-session controls (dashboard tabs/avatar/menu trigger).
  - Rule: for global interaction UX fixes, validate cascade strength against representative affected controls, not only generic auth page buttons.
  - Prevention: when base/reset styles may override behavior, ship a deterministic global rule (including necessary priority) and verify on the exact user-reported surface.

- Scope control correction:
  - Pattern: proposed an additional automation (`link-resolver`) after the user explicitly declined it.
  - Rule: when the user says no to a proposed implementation path, immediately lock scope to the requested alternative and continue execution without re-proposing that path.
  - Prevention: convert declined ideas into optional backlog notes only, and do not implement or re-suggest unless the user re-opens it.

## 2026-02-24

- Maintenance access correction:
  - Pattern: maintenance page used hover-dependent unlock visibility and desktop-first spacing, which degrades usability on mobile/touch.
  - Rule: for operational/critical access pages (maintenance, auth recovery), avoid hover-only interactions and design mobile-first input/action flow.
  - Prevention: validate critical pages at narrow viewport first and ensure all core actions are visible and tappable without hover.

- Rate-limit identity correction:
  - Pattern: strict limiter keyed by raw IP created false 429s on shared mobile carrier IPs.
  - Rule: for user-facing sensitive endpoints, key rate limiting by a stable request fingerprint (IP + client hints) instead of IP alone when feasible.
  - Prevention: centralize request fingerprint utility and reuse it in edge/API endpoints that run behind shared-network traffic.

- Strict-timeout policy correction:
  - Pattern: strict limiter timeout branch logged "allowing request" but still returned provider success flag unchanged.
  - Rule: timeout handling must explicitly set `success: true` when policy is fail-open to match behavior and log intent.
  - Prevention: keep endpoint policy explicit (`failOpenOnInfrastructureError`) and add focused tests around timeout/infrastructure branches.

- Language consistency correction:
  - Pattern: assistant response included an unexpected non-English word, creating confusion and frustration.
  - Rule: keep user-facing status updates in plain language matching the conversation locale, with no accidental foreign words.
  - Prevention: do a final wording sanity check before sending short completion messages, especially after command-heavy tasks.

- Visual-density correction:
  - Pattern: simplification pass made key surfaces feel too empty/minimal and degraded perceived quality on `/` and `/vysledky`.
  - Rule: when simplifying UI, preserve strong visual hierarchy (clear CTA weight, card structure, and intentional spacing) instead of flattening everything.
  - Prevention: run a quick side-by-side sanity check on the affected routes and explicitly verify button prominence and filter readability before closing.

- Encoding-integrity correction:
  - Pattern: Slovak UI copy regressed into mojibake after iterative edits, making pages look broken.
  - Rule: after copy updates, verify diacritics in touched files and rendered routes before task completion.
  - Prevention: add a targeted text grep for broken UTF-8 sequences on edited UI files and include one browser snapshot check in verification.
