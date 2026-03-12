# Autobazar123 Agent Guide

## Purpose (WHY)
Autobazar123 is a car marketplace web app. Prioritize reliability, security, and trustworthy listing and payment behavior over speed.

## Project Map (WHAT)
- `src/`: Next.js 16 app routes, API routes, UI, and domain logic.
- `supabase/`: migrations, RLS policies, RPCs, and auth/storage data rules.
- `cloudflare-worker/`: Cloudflare Worker integration and deploy scripts.
- `scripts/` and `tools/`: verification gates, automation, and maintenance tasks.
- `tests/` and `src/**/*.test.*`: end-to-end and unit coverage.
- `docs/`: detailed architecture and operating playbooks.

## Workflow (HOW)
1. Plan first in `tasks/todo.md` with checkable active items.
2. Implement the smallest correct root-cause fix.
3. Verify with relevant commands from `README.md` and `package.json`.
4. Add a short review section in `tasks/todo.md` with proof of verification.

Default verification baseline:
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:unit`

Use stricter feature checks when the touched area requires them (for example security, workflow, UI, links, agent contracts).

Verification matrix:
- Default product changes: `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`
- UI or accessibility changes: add `npm run test:web-interface` and relevant Playwright UI/a11y checks
- Security, auth, payment, infra, or release-safety changes: add `npm run test:security:release-gate`
- Release or deployment validation: use `docs/release-gauntlet.md`
- Tooling/process-only changes (`.github/workflows/**`, `scripts/**`, `contracts/**`, `skills-graph/**`, Codex workflow docs): run tooling-only checks such as `npm run test:workflow-check`, `npm run test:agent-contract`, `npm run test:skill-graph`

## Non-Negotiables
- No hacks, temporary workarounds, or fake behavior.
- Hard cutover by default: do not add backward-compatibility layers unless explicitly requested.
- Keep impact minimal: touch only what is required and preserve unrelated behavior.
- Do not mark work complete without evidence (tests, logs, or reproducible checks).
- After every GitHub push tied to the current task, check the matching Vercel deployment status/logs; if deployment fails, treat that as unfinished work and keep iterating until Vercel is green or an external blocker is documented.
- Before stopping, run a short self-review for a simpler approach and for redundant, duplicate, dead, or unused code; fix issues immediately, or explicitly confirm the implementation is clean.
- After user corrections, add the lesson to `tasks/lessons.md`.

## Fallback Lifecycle Policy (MANDATORY)
- No new fallback may be merged without a registry entry and telemetry wiring.
- Every fallback must define: unique key, owner, reason, criticality, threshold/window, and review/remove-by date.
- Critical fallbacks must emit a notification event on every activation.
- Non-critical fallbacks must emit activation events and threshold-crossed notifications based on per-fallback limits.
- Fallback activations must be visible in admin notifications.
- Treat fallback usage as degraded operation, not success; prefer root-cause fixes and fallback removal when no longer needed.
- When code changes make a fallback obsolete, remove both runtime fallback code and its registry/monitoring entry in the same pass.

## Collaboration Preferences
- Some backlog items are questions only; answer and explain directly when no code change is needed before changing implementation.
- For larger user-provided backlogs, create a dedicated checklist document so progress can be tracked outside the rolling `tasks/todo.md`.
- Use a dedicated branch for broad multi-file backlog passes when the worktree context makes that safer, while preserving unrelated in-progress changes.
- Prefer using additional sub-agents for focused discovery when parallel investigation will materially speed up delivery.

## Progressive Disclosure
Read extra docs only when relevant:
- `README.md`: canonical local commands and local OAuth callback setup.
- `docs/PROJECT_PLAYBOOK.md`: architecture, services, and system rules.
- `docs/security-top-10-defaults.md`: security expectations and release defaults.
- `docs/web-interface-guidelines-checklist.md`: UI and interaction quality gates.
- `docs/links-ingestion.md`: links ingestion workflow.
- `docs/analytics-governance.md`: analytics constraints and governance.
- `docs/agent-benchmark-suite.md`: benchmark and evaluation flow.
