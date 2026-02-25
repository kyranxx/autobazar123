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

## Non-Negotiables
- No hacks, temporary workarounds, or fake behavior.
- Hard cutover by default: do not add backward-compatibility layers unless explicitly requested.
- Keep impact minimal: touch only what is required and preserve unrelated behavior.
- Do not mark work complete without evidence (tests, logs, or reproducible checks).
- After user corrections, add the lesson to `tasks/lessons.md`.

## Progressive Disclosure
Read extra docs only when relevant:
- `README.md`: canonical local commands and local OAuth callback setup.
- `docs/PROJECT_PLAYBOOK.md`: architecture, services, and system rules.
- `docs/security-top-10-defaults.md`: security expectations and release defaults.
- `docs/web-interface-guidelines-checklist.md`: UI and interaction quality gates.
- `docs/links-ingestion.md`: links ingestion workflow.
- `docs/analytics-governance.md`: analytics constraints and governance.
- `docs/agent-benchmark-suite.md`: benchmark and evaluation flow.
