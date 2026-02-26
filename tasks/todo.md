# Active Todo

- [x] Update `Forest + Sunset Orange` (`deepForestSunsetOrange`) scheme values to be more orange-forward in home theme definitions.
- [x] Apply matching update in `ThemePreviewShell` so palette behavior stays consistent across themed pages.
- [x] Verify with baseline checks (`npm run lint`, `npx tsc --noEmit`, `npm run test:unit`).
- [x] Commit and push all changes to GitHub.

## Review

- Updated `deepForestSunsetOrange` in:
  - `src/app/page.tsx`
  - `src/components/theme/ThemePreviewShell.tsx`
- Palette tuning applied to make the scheme more orange-forward while keeping the forest base:
  - label: `Forest + Sunset Orange`
  - link: `#B45309`
  - cta: `#F97316`
  - soft surface: `#F7F3EE`
  - dark surface: `#1D3026`
- Verification proof:
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`35` files, `162` tests).
