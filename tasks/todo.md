# Active Todo

- [x] Create shared App Router route-group layout for pages that use the standard site chrome (`Navbar` + `Footer`).
- [x] Move applicable routes into the route group without changing public URLs.
- [x] Remove duplicated per-page `Navbar`/`Footer` rendering from moved pages.
- [x] Verify behavior with baseline checks (`npm run lint`, `npx tsc --noEmit`, `npm run test:unit`).
- [x] Run a self-review for redundancy/cleanliness and record results.

## Review

- Implemented `src/app/(site)/layout.tsx` to centralize shared site chrome (`Navbar` + `Footer`) in App Router layout.
- Moved site routes under `src/app/(site)/...` route group so public URLs remain unchanged while enabling layout persistence.
- Removed per-page `Navbar` and `Footer` imports/usages from moved pages (single source of truth is now the route-group layout).
- Fixed moved import in `src/app/(site)/upravit-inzerat/[id]/page.tsx` to `@/app/(site)/pridat-inzerat/AdWizardClient`.
- Self-review: no remaining duplicated `Navbar`/`Footer` usage under `src/app`; shared chrome now renders only from `src/app/(site)/layout.tsx`.
- Verification proof:
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - `npm run test:unit` passed (`35` files, `162` tests).
