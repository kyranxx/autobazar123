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
4. Use Prompt Contract Template:
   - Goal
   - Scope
   - Constraints
   - Steps
   - Validation
   - Output format

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
2. `npm run test:codex-cli-check` - verify codex CLI is callable and returns version.
3. `npx vitest run <path>` - targeted unit tests.
4. `npm run test:agent-browser` - core route/browser smoke checks.
5. `npm run test:web-interface` - enforce semantic/accessibility web-interface baseline and site-wide gate.
6. `npm run test:ui-qa` - combined UI review pass for auth + interface guardrails.
7. `npm run test:ui-quality-gate` - deterministic UI quality automation gate.
8. `npm run test:security:release-gate` - security release policy + validation gate.
9. `npm run test:agent-contract` - validate risk-tier contract and required checks.
