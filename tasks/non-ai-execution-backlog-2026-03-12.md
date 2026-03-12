# Non-AI Execution Backlog (2026-03-12)

## Scope lock
- Product scope for now: no in-app AI features, no runtime LLM calls, no AI-generated user-facing content flows.
- Allowed: AI-assisted development workflow (Codex), testing, and research tooling.

## Working loop
1. Take one item from this file into `tasks/todo.md`.
2. Ship smallest root-cause fix.
3. Run verification gates.
4. Record proof in `tasks/todo.md` Review.

## P0 (ship first)

### P0.1 Search + filters reliability hardening
- Goal: eliminate user-facing breakpoints in `/vysledky` navigation and filter state behavior.
- Delivery:
  - Add/extend regression coverage for repeated same-route navigation, query persistence, and filter reset semantics.
  - Ensure one stable source of truth for search params between URL and UI state.
- Acceptance:
  - Repeated clicks on search-related nav targets never leave page in stale/incorrect position.
  - Filter chips, query params, and results count stay consistent after refresh/back/forward.
- Verification:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test:unit`
  - `npm run test:web-interface`

### P0.2 Playwright critical-path guardrails
- Goal: convert highest-risk manual checks into deterministic browser tests.
- Delivery:
  - Add Playwright coverage for:
    - home search -> results flow
    - listing detail open from results
    - seller contact flow
    - auth entry/exit happy path
  - Keep tests independent and stable for CI.
- Acceptance:
  - Critical flows are covered by non-flaky specs with clear assertions.
  - Failures are actionable (step-level messages, no ambiguous waits).
- Verification:
  - `npm run test:web-interface`
  - `npm run lint`

### P0.3 SEO pipeline without AI dependencies
- Goal: improve SEO decisions through deterministic data collection, not AI generation.
- Delivery:
  - Add a scriptable keyword/relevance input pipeline (CSV/JSON ingest) for brand/model/city targeting.
  - Wire outputs to internal planning docs and route-priority queue.
- Acceptance:
  - Re-runnable data ingest that produces the same output for the same input.
  - Clear mapping from keyword cluster -> target route template.
- Verification:
  - Script run output committed or documented with reproducible command.
  - `npm run lint`
  - `npx tsc --noEmit`

## P1 (after P0)

### P1.1 Design system consolidation pass
- Goal: reduce UI drift and duplicate implementations.
- Delivery:
  - Standardize shared primitives (form controls, modal/drawer, table/list shells, empty/error states).
  - Keep visual language consistent with existing app branding.
- Acceptance:
  - Fewer duplicated component patterns in app/admin flows.
  - No regressions in accessibility and responsive behavior.
- Verification:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test:unit`

### P1.2 Analytics and conversion instrumentation cleanup
- Goal: improve decision quality for UX and SEO priorities.
- Delivery:
  - Ensure critical funnels emit stable, governed events.
  - Remove duplicate/noisy events and document final event contract.
- Acceptance:
  - Funnel events can answer: discover -> search -> detail -> contact.
  - Event naming/schema stable across releases.
- Verification:
  - `npm run lint`
  - `npx tsc --noEmit`
  - relevant analytics checks/scripts

## Not in scope now
- In-app chatbot, AI assistant, AI-generated listings/content, agent orchestration in production runtime.

