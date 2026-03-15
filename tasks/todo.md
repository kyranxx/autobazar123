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

- Fixed maintenance mode page UI to completely hide the underlying website by applying a `fixed inset-0 z-[9999]` over the layout.
- Fixed the API route for the maintenance bypass unlock (`src/app/api/maintenance/unlock/route.ts`) to prioritize `process.env.MAINTENANCE_PASSWORD` explicitly, allowing operators to configure it easily via Vercel env vars, falling back to the database as needed.
- Verification:
  - Visual verification with `fixed` bounds matching requirement "hide everything but popup"
  - `npm run lint` (pass)
  - `npx tsc --noEmit` (pass)
  - `npm run test:unit src/app/api/maintenance/unlock/route.test.ts` (pass)
- Self-review:
  - Code changes were kept minimal, avoiding rewriting layouts or routes while effectively implementing the required visual block and environment-variable-first authentication precedence.
