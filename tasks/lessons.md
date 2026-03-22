# Lessons Learned

## 2026-03-15

- Company-data correction:
  - Pattern: I removed a likely placeholder company address but still needed the user to confirm the exact registered office before publishing it again.
  - Rule: company identity data such as legal address must come from a verified source or direct user confirmation, then be stored in one shared config.
  - Prevention: keep operator/contact/address data centralized and avoid inventing or reusing placeholder address lines on public pages.

- Local shell shortcut correction:
  - Pattern: I added `npm run ...` helpers and then `nrd:*` npm aliases, but the user wanted truly bare shell commands with no `npm run` prefix.
  - Rule: when the user asks for a shortcut command, optimize for the exact invocation they want, not just a shorter npm script name.
  - Prevention: if the user wants plain terminal commands in Git Bash, prefer profile functions or shell-level wrappers over more package.json aliases.

- Auto-test pacing correction:
  - Pattern: user explicitly asked to stop automatic tests after each change because iteration speed matters during active work.
  - Rule: do not run automatic tests during implementation by default; only run verification when the user explicitly asks or when a higher-priority session/repo requirement makes it mandatory before claiming completion.
  - Prevention: keep progress fast by skipping opportunistic verification during edits, and when a mandatory finish gate still applies, state that constraint clearly instead of silently running extra checks.

- Auto-verification correction:
  - Pattern: I automatically ran lint, tsc, and test suites after a UI change when the user only asked for a design update, wasting time.
  - Rule: never run tests or verification automatically. Only run them when the user explicitly asks.
  - Prevention: removed the automatic verification baseline and matrix from `AGENTS.md`. Tests are opt-in only.



- Playwright local-server stability correction:
  - Pattern: requiring `PLAYWRIGHT_REUSE_SERVER=true` by hand and allowing parallel workers against a shared Next dev server made local Playwright runs fail in two noisy ways: port-conflict startup errors and flaky teardown/HMR churn.
  - Rule: local Playwright commands should auto-reuse the known local app when it is already running, and shared-dev-server runs should default to a stability-first worker count.
  - Prevention: keep the local reuse default in `playwright.config.ts`, probe a real app route instead of a bare port, and default local shared-server runs to `1` worker unless explicitly overridden.

- Instruction-source diagnosis correction:
  - Pattern: I initially treated repeated `Knowledge cutoff` / `Today` / `Sources` output as a current-chat response habit instead of checking whether repo instructions were forcing it in every new chat.
  - Rule: when the user reports the same behavior across chats, inspect persistent instruction files like `AGENTS.md` before assuming it is only session-local behavior.
  - Prevention: search the workspace for the repeated phrasing first, then patch the instruction source if it is repo-defined.

## 2026-03-10

- Workflow-scope correction:
  - Pattern: I applied the repo's full delivery checklist to a tiny UI request and also inferred the wrong target surface.
  - Rule: for small explicit UI requests, first confirm the exact target surface from the request and use the fast path by default.
  - Prevention: do the minimal patch in the named component, run only quick targeted validation unless the user asks for full gates, and avoid broad verification chatter for footer-level edits.

- Test-scope interpretation correction:
  - Pattern: I interpreted the user's question as "which tests to run per change" instead of "which scripts are unnecessary overall."
  - Rule: when a user asks whether tests are needed "at all," classify scripts by hard requirement (CI/enforced) vs optional/convenience before recommending runs.
  - Prevention: explicitly restate whether the question is about per-change execution or permanent script retention before proposing a test matrix.

- Server-dependent test triage correction:
  - Pattern: browser/smoke failures were initially mixed with code regressions, but the user correctly highlighted that missing local dev runtime can be part of the failure path.
  - Rule: for route-level smoke/browser failures, explicitly verify local server readiness first, then separate infra/runtime failures from real code defects.
  - Prevention: run a health probe against `http://localhost:3000/api/health` before executing server-dependent test scripts and keep that runtime alive for the full test batch.

## 2026-03-08

- Verification pacing correction:
  - Pattern: I ran full process overhead (`tasks/todo.md` bookkeeping + full baseline checks) for a tiny one-token color swap, which slowed delivery.
  - Rule: default to a fast path for small scoped changes; run heavier repo process/check gates only when I explicitly recommend them and the user approves, or when the user directly requests them.
  - Prevention: for small edits, apply minimal patch + quick targeted validation only, then offer optional full gate run as an opt-in.

- Ambiguous-language escalation correction:
  - Pattern: I made the Slovak checker avoid ambiguous auto-fixes, but I did not surface those cases back to the user for a decision.
  - Rule: when a language-quality check hits an ambiguous word, it must report the exact file/line and options instead of silently skipping it.
  - Prevention: keep ambiguous words as explicit review findings in `check:sk-diacritics` and only allow automatic fixes for unambiguous mappings.

- Palette-accessibility correction:
  - Pattern: a brighter requested accent can look right as a fill color but fail badly as white-on-orange text or orange-on-white text if the theme treats one token as both.
  - Rule: when applying a bright accent color, verify fill and text use separately and adjust foreground/utility overrides instead of assuming one accent token works for both.
  - Prevention: run contrast checks against both accent backgrounds and accent text surfaces, then patch the shared utility path before closing the theme pass.

- Frontend visibility correction:
  - Pattern: source token edits looked correct in files, but the live homepage still rendered stale black/blue theme values due to a runtime token override path.
  - Rule: for user-visible theme work, always verify the rendered route in a real browser before claiming the palette changed.
  - Prevention: after theme edits, inspect the live route, confirm computed colors on the target surface, and fix runtime token inheritance if source-only edits do not show up.

- Slovak diacritics gate correction:
  - Pattern: the checker reported green while visible UI still had missing Slovak diacritics because it only learned from a narrow dictionary and not from rendered app text.
  - Rule: Slovak quality gates must scan app-wide user-facing text, including JSX text nodes and locale files, and must exclude non-Slovak catalogs from the Slovak pass.
  - Prevention: keep the checker aligned to rendered-text segments, block ambiguous auto-learned mappings, and verify with `check:sk-diacritics`, `check:sk-diacritics:write`, and targeted checker tests before closing copy work.

## 2026-03-04

- Algolia scope correction:
  - Pattern: user asked to fix real Algolia, but I changed local behavior to prefer fallback search and masked the blocked-provider issue.
  - Rule: when a user asks to fix an external provider, do not reroute around it unless they explicitly ask for a temporary fallback.
  - Prevention: verify provider health first, then only ship fallbacks as explicit user-approved contingency behavior.

- Multi-agent worktree coordination correction:
  - Pattern: I treated a heavily dirty worktree as potential unexpected-change risk before confirming active parallel agents.
  - Rule: in this repo, assume concurrent agent edits are normal once the user confirms parallel work; proceed with tightly scoped file edits instead of pausing repeatedly.
  - Prevention: when seeing many unrelated changes, ask once for confirmation, then continue in shared-worktree mode and only touch explicitly scoped files.

## 2026-03-03

- Execution-intent correction:
  - Pattern: user asked for concrete implementation of recommended improvements, not just evaluation.
  - Rule: after recommending practical setup steps, execute them immediately unless the user asks to hold.
  - Prevention: treat "is this useful?" follow-ups that request action as implementation commands and ship with verification evidence.

- Scope-discipline correction:
  - Pattern: user requested strict implementation of explicit feedback items, and reacted when extra behavior was introduced.
  - Rule: implement only what user explicitly requests in the current round unless user asks for optional additions.
  - Prevention: before coding, map each numbered feedback item to one concrete code change and avoid extra features.

- Backlog pruning correction:
  - Pattern: user asked to keep only non-OK items in backlog with fresh numbering after each pass.
  - Rule: remove all `ok` items from backlog summary and keep only the newly addressed non-OK set for the latest pass.
  - Prevention: rebuild backlog from latest feedback labels (`ok` vs `not ok`) before final handoff.

- Communication language correction:
  - Pattern: user explicitly requested English-only communication, but I still used Slovak in status updates.
  - Rule: when user requests a language for collaboration messages, keep all assistant communication in that language only.
  - Prevention: apply and re-check user language preference before every commentary/final response.

- Backlog filtering correction:
  - Pattern: user asked to remove all "OK" tasks from backlog, but earlier versions still mixed done history and broader lists.
  - Rule: when user says "remove OK tasks," backlog must contain only non-OK/reworked items with fresh numbering.
  - Prevention: rebuild backlog from the latest explicit feedback labels (`ok` vs `not ok`) before finalizing.

- Latest-only reporting correction:
  - Pattern: user requested backlog content with only the most recent work, but I kept including broader history formats.
  - Rule: when user asks for "only latest done work," provide only the current-pass completed items.
  - Prevention: default backlog output format to `Latest Completed Work` unless user explicitly asks for full historical list.

- Backlog detail-level correction:
  - Pattern: user asked to see all completed tasks, but I briefly switched to a reduced subset view.
  - Rule: when user asks for full delivery visibility, provide the complete original task list with per-item done notes.
  - Prevention: confirm and preserve the requested reporting granularity (full list vs subset) before rewriting trackers.

- Backlog scope interpretation correction:
  - Pattern: user asked for newly renumbered tasks only, but I expanded back to the full original 31 list.
  - Rule: when user asks for "newly renumbered new tasks," keep only the current reduced-scope list.
  - Prevention: before rewriting task trackers, mirror scope first (full original list vs current subset) and keep only requested level.

- Backlog hygiene correction:
  - Pattern: user requested a clean backlog pass, but the tracker still contained completed items, historical notes, and old numbering.
  - Rule: when user asks to clean backlog, keep only unresolved items, renumber from `1`, and remove historical note blocks.
  - Prevention: after each feedback pass, rewrite backlog into "remaining only" format before final handoff.

- Runtime command safety correction:
  - Pattern: user explicitly revoked the prior instruction to shut down the PC after finishing.
  - Rule: never run shutdown or power-off commands unless the latest user message explicitly requests it.
  - Prevention: treat machine-level commands as opt-in and re-check the latest instruction before execution.

- Contrast expectation correction:
  - Pattern: user reported footer headings as unreadable even after a first visual pass.
  - Rule: when readability is explicitly flagged, use maximum-contrast text for headings/critical links instead of semi-transparent variants.
  - Prevention: for dark surfaces, default headings and key nav links to pure white unless the user asks for softer contrast.

- Encoding hygiene correction:
  - Pattern: localized UI text in touched components degraded into mojibake during iterative edits.
  - Rule: when editing localized copy, verify changed strings render as clean UTF-8 before closure.
  - Prevention: rerun text-encoding guard and manually inspect touched UI components for corrupted glyphs.

- UI asset fidelity correction:
  - Pattern: using emoji flags did not meet the user expectation of real flag icons in the language switcher.
  - Rule: when the user asks for actual flag visuals, use dedicated image assets instead of emoji symbols.
  - Prevention: treat emoji as fallback only and default to local SVG/PNG assets for icon fidelity requests.

- Regional-flag accuracy correction:
  - Pattern: a plain white-blue-red tricolor was interpreted as the wrong country flag for Slovak locale.
  - Rule: for country-flag assets, use country-specific symbols (including coat of arms where expected), not generic tricolors.
  - Prevention: validate locale flag assets visually before closing UI icon tasks.

- Flag-source fidelity correction:
  - Pattern: user requested a "better downloaded" Slovak flag, indicating custom-drawn/local variants were still not trusted as final quality.
  - Rule: when users ask for better flag quality, replace with a downloaded authoritative source asset (for example official/Wikimedia vector).
  - Prevention: prefer provenance-backed flag files over hand-crafted approximations and note the source in review evidence.

- Scope-tightness correction:
  - Pattern: user requested animation removal and expected fully static behavior.
  - Rule: when asked to remove animation, remove all motion controls and timers instead of replacing them with alternative motion.
  - Prevention: map "remove animation" to a static-only implementation checklist (no intervals, no transitions, no carousel controls).

- Placement-precision correction:
  - Pattern: user requested the language switcher be moved specifically to the top green banner, not just away from the avatar area.
  - Rule: when a user specifies an exact UI destination, implement that exact placement and preserve behavior.
  - Prevention: treat location instructions as strict requirements and verify final placement against the requested surface.

- Minimal-UI interpretation correction:
  - Pattern: user asked for switcher UI as "just flag, nothing else", so extra chevron/text remained unwanted.
  - Rule: for explicit minimal UI requests, remove all non-essential visual elements unless asked otherwise.
  - Prevention: translate wording like "just X" into a strict checklist and verify no extra labels/icons remain.

- Diacritics-check coverage correction:
  - Pattern: checker reported green overall, but user still found missing Slovak diacritics in dashboard messages text.
  - Rule: when a language-quality gate passes but UI feedback contradicts it, treat it as dictionary coverage gap and expand detection rules immediately.
  - Prevention: update dictionary from real UI misses, rerun `check:sk-diacritics`, then run `check:sk-diacritics:write` and verify again.

## 2026-03-01

- Recovery-token verification correction:
  - Pattern: inferring a password-recovery grant from the access-token JWT shape was unreliable in the real Supabase flow and kept producing false `403 Forbidden` rejections.
  - Rule: when Supabase already provides a one-time `hashed_token`/`token_hash` for recovery, prefer verifying that explicit credential over guessing from session-token claims.
  - Prevention: build app-owned recovery URLs from `hashed_token` and validate with `verifyOtp({ token_hash, type: "recovery" })` for server-side recovery actions.

- Recovery-link error-state correction:
  - Pattern: the reset page treated a Supabase auth hash like `error_code=otp_expired` as if it were just missing context, which let users submit the form and then surfaced a misleading AAL2 error.
  - Rule: when auth providers return explicit error state in the callback hash, detect and surface that exact failure before allowing any follow-up action.
  - Prevention: parse callback hashes for both success tokens and provider error payloads, and block submission when the link is already invalid.

- Password-setup UX correction:
  - Pattern: collecting a new password in dashboard before switching social-login users into an email-link recovery flow creates a confusing double-entry experience and obscures the real MFA/AAL2 blocker.
  - Rule: when the flow must fall back to an email recovery link, the dashboard should only trigger the email and let the linked reset page collect the new password once.
  - Prevention: prefer one authoritative password-entry surface per flow, and treat AAL2/MFA requirements as a separate constraint rather than a reason to keep duplicate inputs.

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

## 2026-03-01

- Auth-provider correction:
  - Pattern: a user account may be registered through Google only, even when the request sounds like a normal email/password flow.
  - Rule: before assuming account-password actions can use email-password reauthentication, check whether the current user is OAuth-only.
  - Prevention: branch password/account-security UX by auth provider and keep a fallback path for OAuth-created accounts.

- Linked-provider correction:
  - Pattern: Supabase can report a social-login account with both a social provider and `email`, which can still behave like a social account for password setup.
  - Rule: when deciding password-setup UX, treat the presence of any non-`email` provider as needing the social-login-safe path.
  - Prevention: write tests for mixed-provider identities instead of assuming `email` in the provider list means the classic email-password flow should win.

- Recovery-redirect correction:
  - Pattern: password recovery can fail differently from OAuth login; localhost may inherit a production auth redirect origin or a missing reset-path allow-list and silently send a broken link.
  - Rule: validate recovery redirect URLs separately from OAuth callbacks and fail before sending email when Supabase rewrites the target.
  - Prevention: cover localhost reset-password redirects in code, tests, and local setup docs (`/auth/reset-password`, not only `/auth/callback`).

- Recovery-session correction:
  - Pattern: landing on a password recovery page with `#access_token` in the URL does not guarantee the client has already adopted that recovery session.
  - Rule: before calling `auth.updateUser()` on a recovery page, explicitly hydrate the Supabase session from the recovery hash.
  - Prevention: parse the recovery fragment, call `auth.setSession()`, and only then allow password submission.

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

- Surface-targeting correction:
  - Pattern: user-reported dashboard issue persisted because the fix was applied to `moj-ucet` while the user was using dealer dashboard (`/dealer`).
  - Rule: when multiple UI surfaces implement similar behavior, confirm and patch the exact active surface before closing.
  - Prevention: for dashboard bug reports, check route/component mapping first and validate both user + dealer variants when relevant.

- Auth-link origin correction:
  - Pattern: password reset from local workflow generated links to production domain, forcing users into maintenance flow and blocking the intended local reset path.
  - Rule: auth email link redirects must use a dedicated, explicit origin resolver (with local override support) instead of scattered per-route fallbacks.
  - Prevention: centralize request-origin logic for auth routes and cover it with tests for local override, request origin, and fallback behavior.

## 2026-02-25

- Google auth environment correction:
  - Pattern: Google sign-in UX looked broken across devices because local/dev logic forced OAuth callbacks to `localhost` on non-localhost sessions, and One Tap was explicitly disabled on localhost.
  - Rule: use the active browser origin for OAuth callback generation unless an explicit redirect override is configured, and avoid localhost-only One Tap suppression.
  - Prevention: keep callback-origin behavior covered with focused unit tests and validate Google auth on both localhost and non-localhost dev origins during verification.

- Todo cleanup correction:
  - Pattern: completed work remained in `tasks/todo.md`, creating noise and stale context.
  - Rule: after finishing a task and recording proof, reset `tasks/todo.md` back to active-task template only.
  - Prevention: end every task by clearing completed checklist/review items from `tasks/todo.md` before final response.

- Deployment target correction:
  - Pattern: pushing to GitHub produced a preview deployment while user expected production updates.
  - Rule: when user asks to deploy or "push changes live", treat production as the default target.
  - Prevention: run explicit production deployment (`vercel --prod`) after push unless user explicitly requests preview-only.

- Search first-load reliability correction:
  - Pattern: `/vysledky` intermittently rendered `0 vozidiel` on first load in production even though Algolia had hits.
  - Rule: avoid SSR-cached InstantSearch state for critical result pages when it can serve stale/empty first paint.
  - Prevention: use client-driven `InstantSearch` for `/vysledky` and verify repeated cold loads on production before closing.

## 2026-02-26

- Account-security flow correction:
  - Pattern: dashboard password update looked complete but failed for MFA-enabled users with `AAL2 session is required`.
  - Rule: any password/email change flow must explicitly handle MFA assurance upgrades, not only non-MFA accounts.
  - Prevention: include an MFA-enabled test path (or manual check) for account-security changes before marking done.

- Form-submit semantics correction:
  - Pattern: form-like UI sections built with `div + button` did not submit on Enter.
  - Rule: use semantic `<form onSubmit>` + submit buttons for input flows that have a primary action.
  - Prevention: audit changed input sections for Enter-key behavior and convert pseudo-forms to real forms during implementation.

- MFA UX fit correction:
  - Pattern: forcing authenticator-code entry in account settings blocked users who do not use authenticator apps.
  - Rule: when user base does not use MFA apps, provide a non-app fallback (reset-email flow) instead of requiring authenticator setup.
  - Prevention: for security-sensitive actions, verify the primary UX matches actual user auth methods before finalizing.

- Production verification correction:
  - Pattern: code was pushed successfully, but user still hit the old prod incident because push-to-branch did not equal production cutover.
  - Rule: after incident fixes for live routes, explicitly verify current production behavior and clearly distinguish branch push status from production deployment status.
  - Prevention: include a post-push live endpoint probe (`curl -I` on affected route) and call out whether deployment is still required.

- Redis provider compatibility correction:
  - Pattern: installing Redis Cloud integration surfaced only `REDIS_URL`, but production guard/runtime required Upstash REST credentials (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
  - Rule: verify Redis provider/protocol compatibility (TCP URL vs Upstash REST) before instructing environment-variable setup or deployment retries.
  - Prevention: check runtime client assumptions (`@upstash/redis`/edge HTTP) first, then choose matching integration and env variable names.

## 2026-02-27

- Theme-intent precision correction:
  - Pattern: interpreted "forest green" as a general shade adjustment, while user specifically wanted exact parity with the `Forest + Champagne` scheme's green tokens.
  - Rule: when user references an existing scheme as a baseline, copy the exact token values from that scheme instead of approximating by name.
  - Prevention: for palette requests, explicitly map source-scheme tokens (`brand`, `link`, `softSurface`, `darkSurface`) to target-scheme tokens before making edits.

## 2026-02-28

- Redis env integrity correction:
  - Pattern: production still returned maintenance-unlock `500` even though `UPSTASH_REDIS_REST_URL/TOKEN` keys existed, because values contained trailing newline escapes (`\r\n`) and were rejected by Upstash.
  - Rule: for env-dependent incidents, validate both variable presence and exact value format/content before concluding integration is complete.
  - Prevention: pull envs and inspect suspicious keys for whitespace/newline artifacts, then redeploy and verify the affected endpoint status transition in runtime logs.

- Response-language correction:
  - Pattern: user objected when assistant switched to Slovak in status updates during an English conversation.
  - Rule: keep assistant commentary/final responses in the user’s current conversation language unless the user explicitly asks to switch.
  - Prevention: do a quick language check before sending progress updates, especially after working on localized UI text.

## 2026-03-01

- Focus-priority correction:
  - Pattern: user explicitly redirected work away from line-ending housekeeping and toward real code defects.
  - Rule: when the user asks for code quality improvements, prioritize reproducible functional/gate failures over formatting/environment noise.
  - Prevention: run broad quality gates first, surface concrete failing checks, and fix root-cause code issues before returning to secondary hygiene tasks.

- Output-discipline correction:
  - Pattern: user reacted negatively when the assistant streamed large raw exploration output instead of a concise actionable answer.
  - Rule: keep progress updates compact and summarize findings; never dump long file excerpts unless explicitly requested.
  - Prevention: before responding, trim to decisions, outcomes, and next actions only.

- Incident-triage correction:
  - Pattern: initial diagnosis treated password-code failures as potentially user-side expiry/input issues, but the user confirmed the failure was deterministic.
  - Rule: when a user reports a verification flow fails every time, prioritize code-path root cause over retry guidance.
  - Prevention: verify that challenge issuance and challenge verification run through the same auth-client context before closing the incident.
## 2026-03-02

- UX visibility correction:
  - Pattern: a backend-only safeguard was reported as complete, but the user could not see any change in the product and reasonably treated it as unfinished.
  - Rule: for user-facing safety or anti-spam work, pair backend enforcement with visible UI guidance or feedback in the same pass.
  - Prevention: before closing a UX protection task, confirm both the guardrail and the on-screen cue or error path exist.

- Interaction expectation correction:
  - Pattern: saying a sidebar was "sticky" was not enough when the user expected it to stay visually pinned immediately instead of drifting before the sticky offset engaged.
  - Rule: when a user asks for sticky navigation or filters, interpret it as pinned-in-view behavior unless they explicitly want a delayed stick point.
  - Prevention: favor near-top sticky or fixed behavior with internal panel scrolling, then verify the motion matches the reported expectation.

- Overlay behavior correction:
  - Pattern: the remaining "bounce" came from a dropdown component scroll-locking the `body`, adding margin compensation, and shifting the page rather than from the result grid itself.
  - Rule: when a UI "bounce" appears only while a popup opens, inspect shared overlay primitives for scroll-lock or modal behavior before changing layout containers.
  - Prevention: for lightweight inline controls like sort dropdowns, prefer non-modal overlay behavior so the page layout stays stable.

## 2026-03-03

- Rollout-plan completeness correction:
  - Pattern: initial SEO rollout summary listed strategy but omitted practical safeguards (multi-select URL compatibility, sitemap/index consistency, phased verification), which reduced user confidence.
  - Rule: when proposing changes to crawl/index behavior, include both strategy and implementation safeguards in the same first plan.
  - Prevention: use a fixed checklist for SEO rollouts: URL behavior compatibility, indexation policy, sitemap alignment, and verification gates.

## 2026-03-05

- LINKS status-transition correction:
  - Pattern: I moved an analyzed URL from `## TODO` to `## DONE` without explicit user instruction.
  - Rule: when the user asks to analyze/check a TODO link, keep link status unchanged unless they explicitly request moving it.
  - Prevention: separate analysis output from list-state changes and confirm before changing `TODO`/`DONE` placement.

- Apply-now execution correction:
  - Pattern: user requested immediate application of selected UX guidance, but the flow drifted toward repeated analysis/scoping.
  - Rule: when user says to apply now, switch directly to implementation on prioritized product surfaces and report concrete shipped changes.
  - Prevention: translate "apply now" into an execution checklist (edit, verify, record evidence) before any additional research.

- I18n completion correction:
  - Pattern: user had to prompt continuation because localization work stopped before app-visible shared components were fully covered.
  - Rule: for app-wide language-switch tasks, finish by checking all shared/fallback UI surfaces (not only primary page shells) before reporting complete.
  - Prevention: include a final shared-component sweep (`*Client` and server fallback wrappers) in the i18n checklist before closing.

## 2026-03-04

- Alert-channel preference correction:
  - Pattern: user explicitly prioritized seeing actionable status inside `/admin` and did not want noisy per-alert email delivery.
  - Rule: for monitoring/quality-gate work, default to low-noise in-product admin visibility with deduped alert states before proposing broadcast notifications.
  - Prevention: implement transition-based alerting (`failure`/`recovered`) and surface active issues in admin dashboards as the primary channel.
## 2026-03-07

- Current-chat model detection correction:
  - Pattern: I treated a spawned `codex exec` run and default config as if they described the model of the already-open VS Code chat.
  - Rule: when the user asks for the model of the current chat, read the active Codex thread/session state (`CODEX_THREAD_ID` + session `turn_context.model`) instead of launching a new Codex process with its own model selection.
  - Prevention: distinguish between pinned workflow checks and live-chat inspection before reporting model identity.

- Long-screenshot intake correction:
  - Pattern: initial image attachment was too compressed for reliable extraction, and implementation could not start from ambiguous OCR.
  - Rule: when requirements come from long social screenshots, request the source PDF/full-resolution artifact immediately before analysis.
  - Prevention: run a fast PDF render+OCR pipeline first (`pdftoppm` + OCR), then confirm extracted requirements before making repo changes.

## 2026-03-10 (continued)

- App-wide scope confirmation correction:
  - Pattern: after updating a standalone palette page, I inferred theme completion without first proving brand-color cutover across runtime UI surfaces.
  - Rule: when user asks if a change is app-wide, verify with a repo-wide runtime scan and call out remaining exceptions before claiming coverage.
  - Prevention: run non-test raw-color inventory (`src/app`, `src/components`, `src/lib`), patch drift sites, and report explicit allowed exceptions (third-party brand marks).

- Cache-visibility correction:
  - Pattern: user still saw stale visuals even after refresh because cache/view-target ambiguity remained.
  - Rule: for static UI previews, provide a cache-busted URL and an on-page version marker before requesting visual confirmation.
  - Prevention: add no-cache meta tags plus a visible timestamp/version line, then verify the served localhost HTML includes that marker.
## 2026-03-14

- Moderation-model correction:
  - Pattern: a full manual-approval model was heading toward operational bottlenecks, but the user clarified they want a hybrid trust/safety system with verified fast-lane sellers and risk-based review.
  - Rule: for marketplace moderation, do not stop at a simple pending/rejected queue if the user is optimizing for production scale; combine manual review with explicit trust tiers and automated risk signals.
  - Prevention: when designing moderation, confirm the intended review model early: all-manual, hybrid, or post-publication review.

- Completion-standard correction:
  - Pattern: I described the schema as "mostly ready" after the core drift fix, but the user explicitly requires production-ready language only when schema, ops, and supporting verification are all in place.
  - Rule: in this repo, do not use soft completion phrasing for release-critical systems when surrounding operational paths or verification remain open.
  - Prevention: for launch-facing work, separate `schema`, `runtime flow`, `ops tooling`, and `verification` and only call the area complete when all four are green or an external blocker is explicit.

## 2026-03-19

- Maintenance-domain correction:
  - Pattern: I disabled maintenance globally after the first request, but the user actually wanted production to stay in maintenance while only the Vercel alias remained open.
  - Rule: when maintenance requirements mention a specific hostname, confirm and implement the scope at the host-routing level instead of changing the global maintenance flag.
  - Prevention: verify the exact live domains first, then choose between site-setting changes and hostname-based proxy behavior before touching production state.

- Surface-detail correction:
  - Pattern: I removed the mobile brand labels first, but the user also wanted the same brand-name removal on desktop.
  - Rule: when a visual cleanup request targets a repeated UI element across breakpoints, confirm both mobile and desktop variants before closing.
  - Prevention: do a breakpoint sweep on the exact component after the first pass and remove any duplicate text treatment in the same change.

- Mobile-layout tuning correction:
  - Pattern: I treated the first carousel-arrow pass as done, but the user’s screenshots showed the row still started too far right and the arrow/dropdown surfaces still needed visual tuning.
  - Rule: for screenshot-led mobile UI fixes, keep iterating on spacing, overlay position, and translucency until the exact reported surface reads correctly, not just approximately.
  - Prevention: after each mobile layout pass, re-check the same screenshot-level details: row start offset, arrow centerline, overlay opacity, and dropdown attachment styling.

- Frontpage-shell correction:
  - Pattern: I kept the homepage background wash and generous top spacing until the user explicitly asked for a cleaner white canvas and tighter bento placement.
  - Rule: when the user asks for a plain frontpage background and less empty space, remove decorative shell treatments rather than only softening them.
  - Prevention: for homepage polish requests, check the outer page canvas and section top padding first before tuning inner card spacing.

- Border-visibility correction:
  - Pattern: the mint search-input border was technically changed, but the semi-transparent styling still made it look invisible on the white surface.
  - Rule: when the user asks for a visible accent border on a white input, use an explicit solid border value instead of a soft translucent version.
  - Prevention: for white-surface inputs, sanity-check accent borders for real contrast and promote them to a solid token when the user still cannot see them.

- Placeholder-tone correction:
  - Pattern: the search hint remained too bold and attention-grabbing even after the border was fixed.
  - Rule: when the user wants placeholder copy to feel quieter, reduce placeholder weight and opacity without weakening the real input text.
  - Prevention: treat placeholder tone separately from typed text styling and tune both independently on prominent search inputs.

- Visual-verification correction:
  - Pattern: the top search input still looked grey in the real screenshot even though the utility classes suggested it should be mint.
  - Rule: when a user reports a visible mismatch, verify the rendered result with a real screenshot and upgrade from utility-only styling to explicit inline styling if needed.
  - Prevention: for high-visibility hero inputs, confirm the actual rendered border color in a browser capture before declaring the accent treatment done.

- Header-density correction:
  - Pattern: the homepage top area still felt too airy even after the search-card cleanup because the white navbar spacing and green-strip pills were not tuned together.
  - Rule: when the user asks to reduce top-page whitespace, review both the main navbar density and the banner-chip treatment in the same pass.
  - Prevention: for homepage header polish, check logo/button/header height and pill background color as one compactness pass instead of treating them separately.

- Mobile-dismissal correction:
  - Pattern: the homepage filter dropdowns stayed open on mobile tap-away because they were only watching `mousedown`, which is not a reliable outside-dismiss signal for touch interaction.
  - Rule: for mobile-friendly custom dropdowns, use pointer-based outside-dismiss handling instead of mouse-only listeners.
  - Prevention: verify custom popovers with a real tap-away browser check and prefer `pointerdown` capture for outside-close behavior.

- Filter-tone correction:
  - Pattern: the filter fields still felt muted after icon work because the default closed-state labels were inheriting a grey presentation that the user read as too weak.
  - Rule: when filter controls act as primary inputs in a hero bento tile, default their visible labels to the primary text color unless the user asks for softer hierarchy.
  - Prevention: tune placeholder tone and closed-field label tone separately so hints can stay subtle while actual filter labels remain strong.

- Tile-hierarchy correction:
  - Pattern: making only the filter row black left the rest of the bento tile visually inconsistent because category labels, chevrons, and the brand section heading still read softer.
  - Rule: when the user asks for stronger text inside a composite tile, apply the hierarchy change across the full tile surface, not just one subsection.
  - Prevention: sweep all visible text roles in the same card: section headings, control labels, and affordance icons before closing the typography pass.

- Branding-exception correction:
  - Pattern: I treated automated contrast failures in brand-signature orange usage as standard bugs, but the user clarified that the branding scheme has higher priority there.
  - Rule: approved branding elements such as logos, wordmarks, and selected brand-accent treatments may intentionally keep brand colors even when contrast tools complain, but this exception does not apply to general product usability.
  - Prevention: separate branding exceptions from real UI defects, and continue fixing mobile overflow, layout, and interaction issues even when some contrast findings are intentionally accepted.

## 2026-03-20

- Documentation-structure correction:
  - Pattern: strategy docs were written as principles, but the user needed an explicit implementation order to understand what comes first.
  - Rule: when a doc mixes principles and execution, add a clear step order at the top.
  - Prevention: separate "what matters" from "what to do next" in founder-facing docs.

- Documentation-audience correction:
  - Pattern: the docs were useful as internal specs but still felt too abstract for the user's learning goal.
  - Rule: when the user wants to learn the topic, add a simpler handbook or checklist instead of only extending technical docs.
  - Prevention: pair strategy specs with one short student-friendly entry point.

## 2026-03-21
- Homepage-search density correction:
  - Pattern: I moved result feedback out of the submit CTA and simplified the category row, but the user preferred the denser homepage search layout with the counter still inside the orange button and the fuller vehicle-type strip.
  - Rule: when the user is tuning an existing hero search UI, preserve the preferred density and location of feedback elements unless they explicitly ask to relocate them.
  - Prevention: treat changes to CTA copy, chip placement, and category-tab count as visual regressions unless the user explicitly approves the new structure.

- Homepage-search scope correction:
  - Pattern: I initially started from broader CRO and structure changes, but the user wanted the homepage search layout kept and only asked for polish plus a few helper affordances.
  - Rule: when the user says to keep the current structure, preserve the layout and limit the pass to alignment, clarity, and explicitly requested helper UI.
  - Prevention: treat numbered keep/do feedback as a strict implementation list before editing the homepage UI.

- Brand-orange authority correction:
  - Pattern: I let a contrast-driven theme adjustment replace the approved bright brand orange with a darker "safer" accent.
  - Rule: the approved Autobazar123 brand orange stays authoritative until the user explicitly changes it, and automated contrast checks must not silently substitute a darker orange token.
  - Prevention: pin the bright orange in shared theme tests and treat any contrast exception here as intentional branding, not a token-change prompt.

- Business-model-fit correction:
  - Pattern: I overweighted leads and conversation metrics even though Autobazar123 mainly earns from paid ad posting and paid listing features.
  - Rule: for this product, prioritize monetization, sold outcomes, listing views, and repeat seller value over contact-detail metrics.
  - Prevention: before expanding marketplace metrics, anchor the KPI hierarchy to the repo's actual revenue model.
