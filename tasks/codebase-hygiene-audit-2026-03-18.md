# Codebase Hygiene Audit - 2026-03-18

- [ ] Replace public dealer mock pages with real data or remove/hide the routes until the dealer domain is production-ready.
- [ ] Remove fake seller fallback values from car detail mapping and fail cleanly when seller data is missing on a real listing.
- [ ] Remove stock-car image fallbacks from real listing surfaces and show an honest missing-photo state instead.
- [ ] Review maintenance-mode fail-open timeout posture in `src/proxy.ts` and decide whether production should fail closed instead.
- [ ] Keep Algolia fallback search only if the degraded-mode behavior remains intentionally supported, monitored, and behaviorally aligned with the primary search.

- [x] Inventory dead code, orphaned files, and duplicate modules
- [x] Propose feature-first folder structure with before/after tree
- [x] Audit hardcoded values and centralize safe shared constants
- [x] Audit vague naming and propose specific replacements
- [x] Document top 5 scalability risks with concrete fixes
- [x] Rewrite the single messiest file cleanly
- [x] Replace `README.md` with a current operator-focused guide
