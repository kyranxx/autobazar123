# Active Todo

- [ ] Homepage polish: introduce a lighter green accent on the front page while preserving orange as the primary CTA color.
- [ ] Auth domain: allow branded Supabase auth/API domains in CSP and docs so Google OAuth can stop exposing the raw `*.supabase.co` hostname after dashboard + DNS setup.
- [ ] Architecture priority backlog: reconcile checked-in Supabase migrations with runtime expectations (`site_admins`, `contact_messages`, ad status values like `pending`/`rejected`, and any other schema drift) so fresh environments match the app.
- [ ] Architecture priority backlog: build a real report-listing moderation flow with report submission, admin review context, anti-fraud signals, and clear seller/listing actions.
- [ ] Architecture priority backlog: finish real alert delivery for saved ads and add saved-search alerts so users receive actual change/new-match notifications instead of preference toggles only.
- [ ] Architecture priority backlog: implement dealer verification and approval workflow so “verified” trust signals come from an auditable admin process.
- [ ] Architecture priority backlog: add billing edge-case tooling for refunds, failed-payment support handling, and safer admin payment remediation.
- [ ] Architecture priority backlog: wire analytics across the main funnel (search -> detail -> contact -> posting -> payment) so conversion drop-offs are measurable.
- [ ] Architecture priority backlog: improve the Algolia quality layer with better typo handling, synonyms, suggestions, and ranking tuning.
- [ ] Later backlog: add CMS/editable marketing blocks for homepage and promo surfaces once the core marketplace spine is stable.

## Review

- Recovered local workflow, auth-domain, homepage polish, copy, and test updates onto latest `origin/master`.
- Verification:
  - `npm run lint` (pass)
  - `npx tsc --noEmit` (pass)
  - `npm run test:unit` (pass; 68 files / 305 tests)
  - `npm run test:workflow-check` (pass)
  - `npm run test:agent-contract` (pass)
  - `npm run test:skill-graph` (pass)
  - `npm run test:security:release-gate` (pass)
  - `npm run test:web-interface` (pass after rerunning with a clean managed Playwright web server)
- Self-review:
  - Kept the recovery focused on real product and workflow changes from the saved local work, dropped the incomplete chrome-console script wiring, and normalized the new homepage mint accent through shared brand tokens instead of hardcoded values.
