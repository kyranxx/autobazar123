# Codex Workflow Checklist (Gate 5)

Derived from selected `#8` practices and adapted for this repository.

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
2. Run relevant verification:
   - unit tests for touched logic
   - flow tests for touched UX paths
   - targeted smoke checks where applicable
3. Document:
   - what changed
   - what was verified (with command output summary)
   - remaining risks or blockers

## Repository-Specific Commands

1. `npm run test:model-check` - preflight requested vs actual codex model.
2. `npx vitest run <path>` - targeted unit tests.
3. `npm run test:agent-browser` - core route/browser smoke checks.
4. `npm run test:web-interface` - enforce semantic/accessibility web-interface baseline.
5. `npm run test:ui-qa` - combined UI review pass for auth + interface guardrails.
