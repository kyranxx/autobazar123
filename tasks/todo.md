# Active Todo

- [x] Add a reusable Slovak diacritics quality gate script for site text.
- [x] Add a dedicated dictionary file and wire a package command for easy reuse.
- [x] Document usage and run targeted verification for the new checker.
- [x] Reduce false positives for route and URL slug fragments.
- [x] Add safe autofix support for literal/text replacements.

# Review

- Added `scripts/slovak-diacritics-check.mjs` and `scripts/slovak-diacritics-dictionary.json`.
- Added npm commands: `check:sk-diacritics`, `check:sk-diacritics:write`, `test:sk-diacritics-script`.
- Added docs: `docs/slovak-diacritics-check.md` and README references.
- Hardened checker behavior to ignore slug fragments like `/moj-ucet`.
- Added optional `--write` mode for safe in-place replacement in text and string literals.
- Ran autofix with `npm run check:sk-diacritics:write` and applied 143 replacements in 26 files.
- Verification:
  - `npm run lint` (pass)
  - `npx tsc --noEmit` (pass)
  - `npm run test:unit` (pass)
  - `npm run test:sk-diacritics-script` (pass)
  - `npm run check:sk-diacritics` (pass after autofix)
