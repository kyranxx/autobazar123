# src: Agent Rules

## Scope
Applies to `src/` and all nested directories unless a deeper `AGENTS.md` overrides it.

## Goals
- Preserve user-facing behavior unless the task explicitly changes it.
- Keep UI and copy changes aligned with existing patterns.
- Avoid broad rewrites when a targeted fix is enough.

## Implementation Notes
- Prefer minimal diffs in components and routes.
- Keep TypeScript types strict; avoid `any` unless justified.
- When editing localized UI text, update all relevant locale files.
- For API routes and auth-related code, prefer explicit error handling and safe defaults.

## Validation
- Run `npm run lint` for all `src/` changes.
- For auth, checkout, search, or form-flow changes, run the most relevant smoke or e2e checks.
- If tests are skipped, explain why in the final handoff.
