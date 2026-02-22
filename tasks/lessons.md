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
