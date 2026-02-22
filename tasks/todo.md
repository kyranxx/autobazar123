# Active Todo

- [ ] Capture fresh full-repo `react-doctor` baseline and export diagnostics.
- [ ] Fix all `SearchResultsSearchBox` state/size warnings (`useReducer`, split component, effect cleanup).
- [ ] Remove all dead code warnings (`Unused file`, `Unused export`, `Unused type`) repo-wide.
- [ ] Re-run full-repo `react-doctor` until baseline is `0 errors / 0 warnings`.
- [ ] Run verification (`eslint` + targeted checks) on touched code.
- [ ] Update this file with final review summary and push changes to `origin/master`.

## Plan (knip cleanup)

- [ ] Gather the latest `knip` dead-code diagnostics for files, exports, and types across the workspace.
- [ ] Assess each flagged file/export/type to decide whether it is a needed entrypoint, redundant (can be deleted), or should become internal (drop export) without affecting runtime/deploy scripts.
- [ ] Document a grouped, actionable edit list that preserves behavior and scripts while cleaning the dead code.

## Execution Plan (react-doctor knip cleanup)

- [ ] Parse `C:/Users/User/AppData/Local/Temp/react-doctor-3a0279d1-7f1c-4b8f-bd5b-84ac8f8d5ed9/diagnostics.json` and lock scope to `knip/files`, `knip/exports`, `knip/types`.
- [ ] Confirm runtime/deploy entrypoints (`cloudflare-worker/src/index.ts`, `public/sw.js`) and decide keep vs delete using project scripts/config.
- [ ] Remove truly-unused files that have no runtime/build responsibility and are not protected.
- [ ] Convert unused exported runtime symbols to internal declarations (remove `export`) while preserving used exports and public APIs that are actually imported.
- [ ] Convert unused exported types to internal type aliases/interfaces where still needed in-file, or delete them when unused.
- [ ] Resolve the protected-file `CookieBanner` export warning without modifying protected files.
- [ ] Re-run `react-doctor` (or equivalent diagnostics command) and prove `knip/files`, `knip/exports`, `knip/types` are clean.
- [ ] Update this todo with completed checks and a concise review summary of exact file changes + verification output.

## Review

- In progress.
