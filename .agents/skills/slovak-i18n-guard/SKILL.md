---
name: slovak-i18n-guard
description: Use when editing locale catalogs, visible Slovak copy, i18n contracts, or UI text that may impact Slovak diacritic and translation correctness.
metadata:
  version: 1.0.0
---

# Slovak & i18n Guard

Use this workflow for any text, locale, or translation-surface change.

## Trigger Conditions

Use when a request includes:
- `src/i18n`, `messages`, `locales`, or locale JSON edits
- Slovak string changes in UI/tests/docs that surface to users
- schema changes that impact translation contracts
- import/export of translation files

## Required Workflow

1. read `AGENTS.md` fallback and quality sections plus `docs/PROJECT_PLAYBOOK.md`.
2. inspect changed copy and locate generated/static locale sources.
3. validate both:
   - `check:i18n-contract`
   - diacritic/differentness checks
4. confirm no regressions in shared surfaces covered by theme/diacritic gates.
5. for known legacy mismatches, run write-mode check only with explicit intent and review generated output.
6. keep tests/docs minimal and focused, no unrelated string churn.

## Commands

- `npm run check:sk-diacritics`
- `npm run check:i18n-contract`
- `npm run check:i18n-diacritics`
- `npm run lint`, `npx tsc --noEmit`, `npm run test:unit` baseline for code-related changes

## Required References

- `docs/PROJECT_PLAYBOOK.md`
- `package.json` command entries for verification
- any locale contract files under `src`

