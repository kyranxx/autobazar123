# Codex Workflow Checklist (Gate 5)

Use this only as the short operator checklist for Codex-driven repo work.

## Before Starting

1. Define target outcome and done criteria in concrete terms:
   - behavior to change
   - files expected to change
   - tests/checks that must pass
2. For non-trivial work, write a short execution plan with ordered steps.
3. Choose execution mode:
   - local-first for repo changes
   - read-only for quick analysis tasks

## During Implementation

1. Keep one task focus per thread.
2. Use explicit pass/fail checkpoints ("gates") before moving forward.
3. Prefer minimal, reversible changes over broad refactors.
4. If parallel work is needed, use worktree/branch isolation to avoid collisions.

## Before Marking Done

1. Review diff for scope control and unintended edits.
2. After each GitHub push for the task, check the linked Vercel deployment status and logs.
3. If Vercel reports a failed deployment, continue the fix -> push -> recheck loop until the deployment succeeds or an external blocker is explicitly documented.
4. Run relevant verification:
   - unit tests for touched logic
   - flow tests for touched UX paths
   - targeted smoke checks where applicable
5. Review implementation quality:
   - check for a simpler approach
   - remove redundant or duplicate logic
   - remove dead or unused code
   - if no issues are found, explicitly note the implementation is clean
6. Document:
   - what changed
   - what was verified (with command output summary)
   - remaining risks or blockers

## Codex Security

1. Review `docs/codex-security-threat-model.md` for impacted trust boundaries.
2. Confirm Threat Model / Security Review items are completed in the PR template.
3. Record security-relevant decisions and residual risk in the PR summary.

## Repository-Specific Commands

1. `npx vitest run <path>` - targeted unit tests.
2. `npm run test:agent-browser` - core route/browser smoke checks.
3. `npm run test:web-interface` - enforce semantic/accessibility web-interface baseline and site-wide gate.
4. `npm run test:ui-quality-gate` - deterministic UI quality automation gate.
5. `npm run test:security:release-gate` - security release policy + validation gate.

## Tooling-Only Checks

Run these only when changing repo automation infrastructure such as `.github/workflows/**`, `scripts/**`, `contracts/**`, `skills-graph/**`, or this checklist itself.

1. `npm run test:workflow-check`
2. `npm run test:agent-contract`
3. `npm run test:skill-graph`
4. `npm run test:model-check`
5. `npm run test:codex-cli-check`
