# Accessibility and Mobile Testing Playbook

Last updated: 2026-03-03

## Purpose

Provide a repeatable gate for accessibility, keyboard-only usability, zoom/reflow readiness, and blind-user preparedness checks.

## Automated Gates

Run these in CI/local before approving UI changes:

- `npm run test:web-interface`
  - Semantic baseline (`main`, `h1`, control labeling, image `alt`) across curated/sitewide routes.
- `npm run test:a11y`
  - Axe-based WCAG checks on core routes.
  - Includes explicit `color-contrast` violation enforcement.
  - Includes accessibility-tree landmark checks.
- `npm run test:keyboard`
  - Keyboard-only journeys (skip link, menu open/close with keyboard, keyboard navigation activation).
- `npm run test:sr-proxy`
  - Accessibility-tree proxy gate for screen-reader readiness:
    - landmark presence (`banner`, `navigation`, `main`, `contentinfo`)
    - interactive control naming baseline (buttons/links/inputs/comboboxes etc. must expose accessible names)
- `npm run test:mobile-matrix`
  - Runs accessibility/reflow checks on mobile device matrix (`Pixel 7`, `iPhone 13 landscape`).

## Blind-User Preparedness (Manual)

Automated checks are necessary but not sufficient for real screen-reader quality.
Run this manual checklist before high-impact releases:

1. NVDA + Firefox (Windows)
- Open `/`, `/vysledky`, `/auth/login`, `/kredity`, and one `/auto/{id}` detail page.
- Verify page title and first heading are announced correctly.
- Verify landmark navigation exposes at least: banner/header, navigation, main, contentinfo/footer.
- Confirm form labels and error messages are announced on login/register/contact forms.

2. VoiceOver + Safari (macOS)
- Repeat route set above.
- Verify rotor shows meaningful headings and links.
- Confirm interactive controls in navbar and mobile menu are announced with clear names.

3. TalkBack + Chrome (Android)
- Verify touch exploration reads control purpose for card actions, filter controls, and auth actions.
- Confirm focus does not trap unintentionally in menus/modals.

4. Keyboard-only fallback
- Verify skip link appears on first `Tab` and targets `#main-content`.
- Verify mobile menu opens with `Enter` and closes with `Escape`.

## Evidence to Attach in PR

- Command output for:
  - `npm run test:web-interface`
  - `npm run test:a11y`
  - `npm run test:keyboard`
  - `npm run test:sr-proxy`
  - `npm run test:mobile-matrix`
- Short note of manual screen-reader pass/fail, including browser + OS used.
