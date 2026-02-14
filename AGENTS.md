# autobazar123: Agent Guide

## Why this file exists
This is the fast entrypoint for coding agents. Keep it short. Put durable details in `docs/ai/` and load only what is needed for the current task.

## Scope
This `AGENTS.md` applies to this directory and all child directories unless a deeper `AGENTS.md` overrides it.

## Fast Start
1. Read this file.
2. Copy `docs/ai/new-chat-starter.md` for the task brief.
3. Load only relevant context from `docs/ai/project-context.md`.
4. Check deeper rules before editing:
   - `src/AGENTS.md`
   - `supabase/AGENTS.md`
   - `cloudflare-worker/AGENTS.md`

## Standard Commands
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Lint: `npm run lint`
- Verify setup: `npm run verify`
- Build: `npm run build`
- E2E tests: `npm run test:e2e`
- Smoke tests: `npm run test:smoke`

## Hard Rules
- Keep changes minimal and task-focused.
- Follow existing patterns; do not refactor unrelated code.
- Never print secret values from `.env*` files or environment variables.
- If credentials are required, mention env-var names only and confirm presence without exposing values.
- Call out risky operations before running them (schema changes, destructive data edits, deploy actions).

## Multi-Agent Workflow
Use subagents for non-trivial work (multi-system changes, risky refactors, deployments, debugging):
- `Architect`: approach, files, risks, rollout plan.
- `Implementer`: code changes.
- `Verifier`: diff review and checks.
- Coordinator: resolve disagreements and produce final output.

## Context Map
- `docs/ai/project-context.md`: architecture and integration notes.
- `docs/ai/new-chat-starter.md`: strict brief template for new chats.
- `docs/ai/prompt-efficiency.md`: token and context efficiency practices.
- `docs/ai/session-handoff-template.md`: compact carry-forward summary.

## Done Criteria
- Change is scoped and reversible.
- Relevant checks pass, or skips are explicitly documented.
- Secrets are not exposed.
- Handoff includes changed files, verification, and follow-ups.
