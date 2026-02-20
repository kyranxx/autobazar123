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

## 2026-02-20

- CI lockfile sync correction:
  - Pattern: local npm (v11) is more lenient about peer dependency resolution than CI npm (v10). A package installed only as a transitive dep (`@swc/helpers@0.5.15`) satisfied local installs but failed `npm ci` on CI which required `>=0.5.17`.
  - Rule: after any `npm install`, verify `npm ci` (not just `npm install --dry-run`) would succeed before committing the lockfile.
  - Prevention: use `npm ci` as the local validation step before pushing lockfile changes.

- Gitignored CI scripts pattern:
  - Pattern: `scripts/` directory was gitignored as "local only" but `package.json` scripts referenced files inside it, causing CI failures.
  - Rule: any file referenced from `package.json` scripts and called by CI workflows must NOT be gitignored.
  - Prevention: before adding a `package.json` script that points to a local file path, check `.gitignore` to ensure that path isn't excluded.

- Bot-pushed workflow approval:
  - Pattern: when the Copilot bot pushes a commit, GitHub requires a human to approve the workflow run before it executes (shows `conclusion: action_required` with 0 jobs). This is not a code bug.
  - Rule: `action_required` with 0 jobs on a bot-triggered workflow run means it needs human approval — do not attempt to fix it with code changes.
  - Prevention: understand GitHub's first-party bot workflow approval gates before investigating "CI failures" for bot commits.

- SECURITY_REVIEW.md maintenance:
  - Pattern: the security review document described issues in "needs fixing" language even after they were resolved, creating confusion about what was live.
  - Rule: after fixing issues documented in a review file, update the file to mark them as resolved so the document reflects current state.
  - Prevention: include a SECURITY_REVIEW.md update step in the security fix checklist.
