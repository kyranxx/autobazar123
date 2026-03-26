# Autobazar123 Agent Guide

## Purpose
Autobazar123 is a car marketplace web app. Prioritize reliability, security, and trustworthy listing and payment behavior over speed.

`AGENTS.md` is the only always-on local agent policy. Other docs and skills are task-scoped reference material unless the touched area calls for them.

## Default Local Workflow
1. Execute direct requests immediately.
2. Implement the smallest correct root-cause fix.
3. Keep scope tight and preserve unrelated behavior.
4. For UI, UX, layout, and copy work, the user verifies visuals on `localhost`; the agent verifies non-visual technical correctness in the touched area.
5. Run targeted technical checks before claiming done. Broader suites are for ship-ready work, release-critical changes, or when the user explicitly asks.
6. Do not push or deploy unless the user explicitly asks.
7. Update process/docs only when the task directly changes them or the user asks.
8. Use task-specific repo skills automatically when the touched area is sensitive or specialized.

## Non-Negotiables
- No hacks, temporary workarounds, or fake behavior unless the user explicitly asks for a temporary workaround.
- Prefer the real root-cause fix. If the proper fix is not ready, leave the work unfinished and state the blocker clearly.
- Do not mark work complete without evidence from relevant checks, logs, or direct inspection.
- Treat known schema drift, unverified critical flows, or manual-only production setup in the touched area as release-blocking unless the user explicitly accepts the risk.
- Keep fallback behavior governed and explicit. When touching fallbacks, auth/RLS, payments/credits, search/SEO, or UI quality, use the matching repo skill/workflow.
- Brand-signature color exceptions are narrow; functional UI still prioritizes readability and usability.

## CI and Release Posture
- Strong CI, release, and deployment gates remain authoritative for protected branches and production safety.
- Local agent behavior should stay lightweight by default. Do not expand into full repo gates unless the task needs ship-ready validation.
- After any user-requested push, check the resulting deployment/status and treat failures as unfinished work.

## Reference Docs
- `docs/PROJECT_PLAYBOOK.md`: architecture, commands, and release/security policy.
- `docs/security-top-10-defaults.md`: security defaults.
- `docs/web-interface-guidelines-checklist.md` and related UI docs: UI-specific quality gates.
- `docs/agent-benchmark-suite.md`: tooling and benchmark work.
