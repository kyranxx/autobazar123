# Active Todo

- [x] Add a visible `NEW` marker to the `Forest + Sunset Orange` theme option in the home theme picker.
- [x] Add the same `NEW` marker in `ThemePreviewShell` theme picker for consistency.
- [x] Verify with baseline checks (`npm run lint`, `npx tsc --noEmit`, `npm run test:unit`).

## Review

- Added `NEW` badge rendering for `deepForestSunsetOrange` option in:
  - `src/app/page.tsx`
  - `src/components/theme/ThemePreviewShell.tsx`
- Kept default theme unchanged (`tealBurntOrange`), as requested.
- Verification proof:
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`35` files, `162` tests).
