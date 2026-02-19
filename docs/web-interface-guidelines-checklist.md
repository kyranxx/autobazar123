# Web Interface Guidelines Checklist (Gate 8)

Derived from `#4` and encoded into both review workflow and tests.

## Required for Core Routes

1. At least one `main` landmark.
2. At least one `h1` heading that defines page intent.
3. Form controls (`button`, `input`, `select`, `textarea`) must have an accessible name.
4. Images must include non-empty `alt` text.

## Enforced Test

- `tests/web-interface-guidelines.test.ts`
- Run with: `npm run test:web-interface`

## Review Integration

When reviewing UI changes, do not approve unless:

1. `npm run test:web-interface` passes on target environment.
2. The PR includes evidence for semantic structure and control labeling.
3. Any intentional exception is explicitly documented in the PR body.
