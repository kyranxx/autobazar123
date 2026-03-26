# Codex Workflow Checklist (Gate 5)

Use this as the short operator checklist for ship-ready or workflow-heavy Codex work, not as an always-on rule layer for every small task.

## Before Starting

1. Define target outcome and done criteria in concrete terms:
   - behavior to change
   - whether push/deploy is in scope
   - tests/checks that actually matter
2. Decide whether this is normal local work or ship-ready/release-facing work.
3. For non-trivial work, write a short execution plan with ordered steps.

## During Implementation

1. Keep one task focus per thread.
2. Prefer minimal, reversible changes over broad refactors.
3. Use explicit pass/fail checkpoints only when they materially help the task.
4. Use task-matched docs/skills when the touched area needs them.

## Before Marking Done

1. Review diff for scope control and unintended edits.
2. Run targeted verification appropriate to the touched area.
3. If push or deploy is in scope, check the linked Vercel deployment status and logs after each GitHub push.
4. Document:
   - what changed
   - what was verified (with command output summary)
   - remaining risks or blockers
5. Review implementation quality:
   - check for a simpler approach
   - remove redundant or duplicate logic
   - remove dead or unused code
   - if no issues are found, explicitly note the implementation is clean

## Codex Security

1. Review `docs/codex-security-threat-model.md` for impacted trust boundaries.
2. Confirm Threat Model / Security Review items are completed in the PR template when a PR is part of the task.
3. Record security-relevant decisions and residual risk in the handoff or PR summary.

## Repository-Specific Commands

1. `npx vitest run <path>` - targeted unit tests.
2. `npm run test:web-interface` - semantic/accessibility baseline for UI work.
3. `npm run test:ui-quality-gate` - broader UI automation when UI work needs ship-ready confidence.
4. `npm run test:security:release-gate` - security release policy + validation gate for auth/payment/security/release work.
5. `npm run test:agent-browser` - optional route/browser smoke check when deployed-environment behavior matters.

## Tooling-Only Checks

Run these only when changing repo automation infrastructure such as `.github/workflows/**`, `scripts/**`, `contracts/**`, `skills-graph/**`, or this checklist itself.

1. `npm run test:workflow-check`
2. `npm run test:agent-contract`
3. `npm run test:skill-graph`
4. `npm run test:model-check`
5. `npm run test:codex-cli-check`
