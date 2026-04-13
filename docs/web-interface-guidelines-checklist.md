# UI Quality Guide

This is the single UI quality document for Autobazar123.

Use it for:

- semantic and accessibility baselines
- automated UI gates
- manual spot checks
- local browser debugging
- Slovak and locale text hygiene
- design-process guardrails

## Required Baseline For Core Routes

1. At least one `main` landmark.
2. At least one `h1` that defines page intent.
3. Interactive controls must have accessible names.
4. Images must include non-empty `alt` text when decorative silence is not intended.
5. Keyboard focus must stay visible and usable.
6. Primary action should be obvious in the first viewport on key flows.

## Automated Checks

Run the checks that match the change:

- `npm run test:web-interface`
  - semantic baseline across curated and sitewide routes
- `npm run test:a11y`
  - axe checks, landmark coverage, color contrast, reflow/zoom readiness
- `npm run test:keyboard`
  - keyboard-only journeys and escape/activation behavior
- `npm run test:sr-proxy`
  - accessibility-tree proxy baseline for landmark and naming quality
- `npm run test:mobile-matrix`
  - mobile accessibility and reflow checks
- `npm run test:ui-quality-gate`
  - broader UI automation when ship-ready confidence matters

Site-wide route coverage behavior:

- Default mode: curated routes only
- Extended mode: `WEB_INTERFACE_INCLUDE_DISCOVERED_ROUTES=true`

## UI Review Rubric

Do not approve UI work unless these are true:

1. Clarity: primary action is obvious.
2. Feedback: errors and success states are specific and fast.
3. Statefulness: loading and disabled states prevent duplicate or invalid actions.
4. Accessibility: controls are labeled and keyboard-usable.
5. Consistency: spacing, typography, color, and interaction behavior fit the rest of the app.

## Manual Accessibility Spot Check

For high-impact releases, manually spot-check:

1. NVDA + Firefox on `/`, `/vysledky`, `/auth/login`, `/kredity`, and one `/auto/{id}` page
2. VoiceOver + Safari on the same route set
3. TalkBack + Chrome for mobile touch exploration and focus order
4. Keyboard-only behavior:
   - skip link appears on first `Tab`
   - mobile menu opens with `Enter`
   - mobile menu closes with `Escape`

## Local Browser Debugging

Use Playwright CLI for fast local debugging, not as a replacement for repo gates.

Install:

```bash
npm install -g @playwright/cli@latest
playwright-cli --help
```

Quick start:

```bash
npm run dev
playwright-cli open http://localhost:3000 --headed
playwright-cli snapshot
playwright-cli console warning
playwright-cli network
```

Recommended session usage:

```bash
playwright-cli -s=ab123 open http://localhost:3000 --headed
playwright-cli -s=ab123 snapshot
playwright-cli -s=ab123 delete-data
```

If a hydration mismatch appears only in your normal browser and not in Playwright, a browser extension is a strong suspect.

## Slovak And Locale Text Hygiene

Use these checks for visible copy quality:

```bash
npm run check:sk-diacritics
npm run check:i18n-contract
npm run check:i18n-diacritics
```

Safe autofix commands:

```bash
npm run check:sk-diacritics:write
npm run check:i18n-diacritics:write
```

Notes:

- the Slovak checker scans string literals in code files
- route slugs like `/moj-ucet` are ignored
- extend `scripts/slovak-diacritics-dictionary.json` when new wording appears

## Design-Process Guardrails

Use design guidance as structured input, not uncontrolled polish.

1. Keep the current visual language unless the task is an intentional redesign.
2. Work one flow or component group at a time.
3. Every non-trivial pass must produce measurable changes.
4. Do not claim polish without evidence.

For larger UI tasks, use this loop:

1. Pass 1: structure, hierarchy, and states
2. Pass 2: spacing, contrast, clarity, and consistency
3. Pass 3: small measurable refinements, then re-run gates

## Evidence To Record

- command output for the checks you ran
- short note on manual accessibility pass/fail when relevant
- before/after screenshots or route notes for meaningful UI changes
