---
name: ui-quality-pass
description: Use for UI, accessibility, interaction, and mobile usability changes. Enforces the project’s UI quality gates and relevant Playwright suites before completion.
metadata:
  version: 1.0.0
---

# UI Quality Pass

Use this flow for any component, page, interaction, or UX-affecting style change.

## Trigger Conditions

Use when a request includes:
- new or changed components under `src/components`, `src/app/**/page.tsx`
- route-level UI flow changes
- interaction, keyboard, motion, or focus-visible behavior updates
- mobile-only layout/visual adjustments

## Mandatory Quality Flow

1. read `AGENTS.md` and `docs/web-interface-guidelines-checklist.md` first.
2. apply the smallest functional change needed and keep business logic untouched.
3. add/update tests only where practical and meaningful.
4. run the core verification set for UI work:
   - `npm run test:web-interface`
   - `npm run test:a11y`
   - `npm run test:keyboard`
   - `npm run test:mobile-matrix`
   - `npm run test:ui-quality-gate`
5. keep `npm run lint`, `npx tsc --noEmit`, and `npm run test:unit` for code-level correctness.
6. verify the result against related checklists before closing:
   - `docs/web-interface-guidelines-checklist.md`
   - `docs/accessibility-testing-playbook.md`
   - `docs/ui-ux-pro-max-protocol.md` if touched

## Scope Boundaries

- do not broaden into unrelated visual redesigns while solving one issue
- do not bypass required checks to keep pace on deadline

