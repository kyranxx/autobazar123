# Redundancy Remediation Checklist

- [x] Remove exact duplicate maintained files and update all references.
- [x] Remove confirmed dead leaf modules and duplicate placeholder assets.
- [x] Extract shared auth/account API route helpers for CSRF, rate limit, JSON parsing, and auth checks.
- [x] Extract shared admin and cron helpers for site-admin detection, cron secret validation, and cache revalidation.
- [x] Consolidate duplicated programmatic SEO route logic for brand/model and brand/model/city pages.
- [x] Consolidate repeated test helpers in auth modal and web interface suites.
- [x] Remove duplicated local spinner implementation and reuse shared UI component.
- [x] Clean package/dependency noise that remains confirmed unused after code cleanup.
- [x] Run verification and capture proof in `tasks/todo.md`.

## Residual Notes

- Removed the unused `starter-kit/` bootstrap bundle in the final cleanup pass.
- `dotenv` is still intentionally kept because multiple checked-in scripts import it even though `knip` does not treat those scripts as active entrypoints in this repo layout.
- `powershell` remains an intentional package-script binary for `codex:hooks:install`.
- Final `knip` scan no longer reports real redundant files or dead runtime code. It only reports the `src/proxy.ts` config hint from `knip.json`.
