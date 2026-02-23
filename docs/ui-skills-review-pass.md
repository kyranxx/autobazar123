# UI Skills Review Pass (Gate 9)

This pass translates `#3` into a repeatable UI QA loop.

## Run Order

1. `npm run test:web-interface`
2. `npx vitest run src/components/AuthModal.password-strength.test.tsx src/components/AuthModal.email-flow.test.tsx`
3. `npm run test:ui-quality-gate`
4. `npm run test:agent-browser` (when testing against deployed environment)

This pass corresponds to refinement Pass 2 and Pass 3 from:

- `docs/ui-ux-pro-max-protocol.md` (`Three-Pass Refinement Loop`)

## Review Rubric

1. Clarity: primary action is obvious in first viewport.
2. Feedback: errors/success states are immediate and specific.
3. Statefulness: loading/disabled states prevent duplicate or invalid actions.
4. Accessibility: form controls are labeled and keyboard-usable.
5. Consistency: spacing, typography, and component behavior match existing system.

## Pass Criteria

The UI change is accepted only when:

1. All automated checks in run order pass.
2. At least one concrete UX improvement is shown with before/after evidence.
3. Regressions are absent from auth and search core flows.
