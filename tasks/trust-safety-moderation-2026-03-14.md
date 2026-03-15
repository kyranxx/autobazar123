# Trust and Safety Moderation

- [x] Add checked-in Supabase schema for listing reports and seller-visible moderation fields.
- [x] Add report-submission API flow with validation and abuse protection.
- [x] Surface report action on listing detail pages.
- [x] Expand admin moderation to review pending and reported ads with anti-fraud context.
- [x] Persist rejection reason/note so sellers can see what to fix.
- [x] Let sellers resubmit rejected ads for review after fixing issues.
- [x] Verify with lint, typecheck, unit tests, security gate, and relevant UI checks.

## Notes

- Remote Supabase migrations were pushed successfully, including the new listing report / moderation schema and the later hybrid auto-publish / moderation-notification migration.
- Code-level checks are green: lint, typecheck, unit tests, and security release gate.
- Hybrid moderation behavior is now wired:
  - verified dealers with at least 5 approved-history ads can auto-publish
  - suspicious description heuristics keep ads in manual review
  - seller settings now include moderation email preference
  - admin users can toggle dealer verification
- Local `supabase test db` is no longer blocked. The project wrapper now auto-starts a DB-only local Supabase stack, resets it to checked-in migrations, and runs the pgTAP suite successfully.
- Follow-up 2026-03-14:
  - Fixed the saved-alert cron type regression and locale-diacritics fallout introduced during the wider backlog pass.
  - Fixed homepage CTA-card contrast and the `/vysledky` toolbar reflow regression that were blocking the sitewide UI gates.
  - Updated `tests/accessibility-gate.test.ts` to wait for the real app shell before axe/landmark assertions, which removes the false-negative Next dev overlay state without masking genuine missing landmarks.
  - Reconfirmed `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run test:security:release-gate`, `npm run test:web-interface`, `npm run test:a11y`, `npm run test:keyboard`, `npm run test:mobile-matrix`, and `npm run test:ui-quality-gate` all pass.
  - Reconfirmed `npm run qc` is clean for `/vysledky`, listing detail, dashboard, and auth surfaces; the remaining quick-check console error is on `/admin` and comes from existing admin data fetching, not the moderation flow itself.
