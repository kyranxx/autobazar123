# UI/UX Pro Max Protocol (Gate 2)

## Purpose

Use `#13` (`ui-ux-pro-max-skill`) as a structured design-intelligence input, not as uncontrolled style generation.

## Hard Rules

1. Product constraints first:
   - Keep current Autobazar123 visual language, IA, and interaction model unless a specific redesign task says otherwise.
2. One scope per pass:
   - Apply guidance to one user flow or component group at a time.
3. Measurable output required:
   - Every pass must produce at least one UI change with objective acceptance criteria and automated verification when possible.
4. No unverifiable polish claims:
   - Changes are accepted only with before/after behavior evidence (tests, route checks, or screenshots).

## Execution Workflow

1. Define target:
   - Example: auth register flow, search filters, ad creation wizard.
2. Extract relevant design guidance:
   - Interaction clarity
   - Feedback visibility
   - Accessibility and motion safety
3. Convert guidance to implementation tasks:
   - Component-level code changes
   - Test assertions
4. Verify:
   - Unit/integration tests for deterministic behavior
   - Browser smoke checks for flow-level sanity
5. Record evidence:
   - Commands run
   - Pass/fail outcomes
   - Remaining risks

## Three-Pass Refinement Loop (50 -> 99 -> 100)

Use this loop for non-trivial UI tasks:

1. Pass 1 (50%):
   - Build the full page/flow skeleton with correct structure, hierarchy, and core states.
2. Pass 2 (99%):
   - Run a self-review pass for spacing, typography, color contrast, interaction clarity, and consistency.
3. Pass 3 (100%):
   - Apply micro-adjustments with explicit measurable edits (px, timing, alignment, labels), then re-run UI gates.

Validation expectation:

- `npm run test:web-interface`
- `npm run test:ui-qa`
- `npm run test:ui-quality-gate`

## Current Gate 2 Output

Target flow: `AuthModal` registration.

Implemented:
1. Real-time password-strength feedback (`weak`, `medium`, `strong`) with:
   - progress bar
   - text label
   - live updates as user types

Acceptance criteria:
1. Weak password displays `Slaba` and 33% bar.
2. Medium password displays `Stredna` and 66% bar.
3. Strong password displays `Silna` and 100% bar.

Verification:
1. `src/components/AuthModal.password-strength.test.tsx`
2. `npx vitest run src/components/AuthModal.password-strength.test.tsx`
