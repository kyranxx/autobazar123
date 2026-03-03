# Active Todo

- [x] Confirm the high-impact marketing skills set for Autobazar123 and install scope.
- [x] Install `programmatic-seo`, `schema-markup`, `seo-audit`, `analytics-tracking`, `page-cro` from `coreyhaines31/marketingskills`.
- [x] Verify project-level skill installation and capture evidence.

- [x] Add a reusable Slovak diacritics quality gate script for site text.
- [x] Add a dedicated dictionary file and wire a package command for easy reuse.
- [x] Document usage and run targeted verification for the new checker.
- [x] Reduce false positives for route and URL slug fragments.
- [x] Add safe autofix support for literal/text replacements.
- [x] Restore documented command scripts in `package.json` (`test:model-check`, `test:codex-cli-check`, `test:agent-browser`).
- [x] Track command scripts in git by unignoring them in `.gitignore`.
- [x] Fix broken relative links in `docs/vendor/index.md`.
- [x] Add Slovak diacritics check to CI workflow gate.
- [x] Delete obsolete `tasks/backlog-2026-03-02-product-polish.md`.
- [x] Fix remaining missing diacritics in dashboard messages copy and extend dictionary coverage.
- [ ] Harden `site_settings` access so public reads cannot expose maintenance secrets.
- [ ] Align cron orchestration and remove stale Cloudflare worker endpoint reference.
- [ ] Enforce fail-closed proxy rate-limit behavior as documented.
- [ ] Switch strict route limit keys to stable request fingerprinting.
- [ ] Add/extend targeted tests for modified API/service hardening behavior.
- [ ] Run verification (`npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run test:security:release-gate`).

# Review

- Marketing skill rollout (2026-03-03):
  - Installed project-level skills from `coreyhaines31/marketingskills`:
    - `programmatic-seo`
    - `schema-markup`
    - `seo-audit`
    - `analytics-tracking`
    - `page-cro`
  - Installation command:
    - `npx --yes skills add coreyhaines31/marketingskills --skill programmatic-seo --skill schema-markup --skill seo-audit --skill analytics-tracking --skill page-cro -y`
  - Verification command:
    - `npx --yes skills list`
  - Verified installed skill paths in project scope:
    - `.agents/skills/analytics-tracking`
    - `.agents/skills/page-cro`
    - `.agents/skills/programmatic-seo`
    - `.agents/skills/schema-markup`
    - `.agents/skills/seo-audit`
  - Self-review:
    - Implementation is minimal and focused: only the five marketplace-relevant skills were installed.

- Added `scripts/slovak-diacritics-check.mjs` and `scripts/slovak-diacritics-dictionary.json`.
- Added npm commands: `check:sk-diacritics`, `check:sk-diacritics:write`, `test:sk-diacritics-script`.
- Added docs: `docs/slovak-diacritics-check.md` and README references.
- Hardened checker behavior to ignore slug fragments like `/moj-ucet`.
- Added optional `--write` mode for safe in-place replacement in text and string literals.
- Ran autofix with `npm run check:sk-diacritics:write` and applied 143 replacements in 26 files.
- Added CI step in `.github/workflows/release-security-gate.yml`:
  - `npm run check:sk-diacritics`
- Ran additional autofix pass after dictionary extension:
  - `npm run check:sk-diacritics` (expected fail, found new uncovered terms)
  - `npm run check:sk-diacritics:write` (pass, applied 9 replacements in 8 files)
- Verification:
  - `npm run lint` (pass)
  - `npx tsc --noEmit` (pass)
  - `npm run test:unit` (pass)
  - `npm run test:sk-diacritics-script` (pass)
  - `npm run check:sk-diacritics` (pass after autofix)
  - Service hardening pass: pending
