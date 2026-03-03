# Active Todo

- [x] Add a reusable Slovak diacritics quality gate script for site text.
- [x] Add a dedicated dictionary file and wire a package command for easy reuse.
- [x] Document usage and run targeted verification for the new checker.

# Review

- Added `scripts/slovak-diacritics-check.mjs` and `scripts/slovak-diacritics-dictionary.json`.
- Added npm commands: `check:sk-diacritics`, `test:sk-diacritics-script`.
- Added docs: `docs/slovak-diacritics-check.md` and README references.
- Verification:
  - `npm run lint` (pass)
  - `npx tsc --noEmit` (pass)
  - `npm run test:unit` (pass)
  - `npm run test:sk-diacritics-script` (pass)
  - `npm run check:sk-diacritics` (expected fail; checker correctly reports current missing diacritics in `src`)
