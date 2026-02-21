# Active Todo

- [x] Produce full-repo `react-doctor` baseline (all files, not changed-files mode)
- [x] Classify findings by fix batch (blocking/correctness/state-nextjs/a11y/dead-code)
- [x] Implement fixes batch-by-batch with verification after each batch
- [ ] Re-run full-repo `react-doctor` until remaining findings are zero
- [x] Run focused tests for touched areas and confirm no regressions

## Review

- Changed-files `react-doctor` scan is clean: `npx react-doctor --offline` -> `No issues found` (29 changed source files).
- Full-repo clean-HEAD baseline remains unchanged at `2 errors, 273 warnings, 98/225 files` when local modifications are stashed.
- Focused lint passed for touched files:
  - `npm run lint -- src/app/moj-ucet/DashboardClient.tsx src/app/admin/components/AdminModeration.tsx`
