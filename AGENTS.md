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
1. For direct small requests, execute immediately without updating `tasks/todo.md`.
2. Use `tasks/todo.md` only when the user explicitly asks for tracking or when the work is a larger multi-step backlog.
3. Implement the smallest correct root-cause fix.
4. For UI, UX, layout, copy, and overall feel, the user verifies on `localhost`.
5. For technical correctness in the touched area, the agent verifies the non-visual parts before push as needed: build, typecheck, backend behavior, API logic, migrations, and targeted tests/checks.

## Non-Negotiables
- No hacks, temporary workarounds, or fake behavior.
- Release-quality bar is mandatory: correct, clean, reproducible, and verified beats speed every time.
- Prefer the real root-cause fix. Do not ship or present bandaids, silent fallbacks, dashboard-only/manual state, placeholder behavior, or partial fixes as complete work.
- If the proper fix is not ready, leave the task explicitly unfinished and state the blocker instead of masking it with a workaround unless the user explicitly asks for a temporary workaround.
- Hard cutover by default: do not add backward-compatibility layers unless explicitly requested.
- Keep impact minimal: touch only what is required and preserve unrelated behavior.
- Do not mark work complete without evidence (tests, logs, or reproducible checks).
- Treat known correctness gaps, schema drift, missing migrations, unverified critical flows, or manual-only production setup in the touched area as release-blocking until fixed or explicitly accepted by the user.
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
- Do not add direct one-off requests to `tasks/todo.md` unless the user asks for backlog tracking.
- For larger user-provided backlogs, create a dedicated checklist document so progress can be tracked outside the rolling `tasks/todo.md`.
- Use a dedicated branch for broad multi-file backlog passes when the worktree context makes that safer, while preserving unrelated in-progress changes.
- Prefer using additional sub-agents for focused discovery when parallel investigation will materially speed up delivery.
- Default shipping flow for solo work: user checks the change visually on `localhost`, agent checks the technical side locally, then push to `master`, then confirm the Vercel deployment is green.

## Branding vs Accessibility
- Brand-signature color decisions may intentionally override automated contrast checks for approved branding elements such as logos, wordmarks, and selected brand-accent treatments.
- This is a narrow exception, not a default excuse to ignore accessibility findings.
- Functional UI must still prioritize readability and usability: forms, inputs, navigation, body text, error states, data tables, and task-critical CTAs should meet accessibility thresholds unless the user explicitly approves an exception.
- When a contrast failure is accepted as a branding choice, call it out clearly as an intentional exception instead of presenting it as an unresolved bug.
- Mobile overflow, layout breakage, and interaction issues are not branding exceptions and should still be treated as real defects.

## Progressive Disclosure
Read extra docs only when relevant:
- `README.md`: canonical local commands and local OAuth callback setup.
- `docs/PROJECT_PLAYBOOK.md`: architecture, services, and system rules.
- `docs/security-top-10-defaults.md`: security expectations and release defaults.
- `docs/web-interface-guidelines-checklist.md`: UI and interaction quality gates.
- `docs/links-ingestion.md`: links ingestion workflow.
- `docs/analytics-governance.md`: analytics constraints and governance.
- `docs/agent-benchmark-suite.md`: benchmark and evaluation flow.

## Freshness Rule (All Topics)
For any topic that can change, verify the latest information online before answering when current accuracy matters.
This applies across domains, not only AI/LLM.

Keep those answers clean:
- do not force `Knowledge cutoff`, `Today`, or similar metadata lines
- include source links only when they materially help the answer or when the user asks for them
- if you cannot verify online, clearly say the information may be outdated
