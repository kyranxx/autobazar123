# Launch Remote Migration and Deploy Runbook

## Purpose

This runbook defines the safe path for finishing the current launch-critical remote work without mixing in unrelated taxonomy migrations.

It exists because the current worktree has both:

- launch-critical payment/RLS migrations that must reach remote before final launch verification
- unrelated taxonomy migration files that must not be pushed as part of the payment/RLS launch lane

## Current verified state

- Local branch: `master`
- Local branch status when this runbook was created: `master` was ahead of `origin/master` and not pushed.
- Dirty unrelated files existed in taxonomy/package areas.
- `npx supabase migration list` showed these launch-critical migrations as local-only:
  - `20260618174500_harden_profile_dealer_public_reads.sql`
  - `20260618193000_align_payment_notifications_billing.sql`
  - `20260620010000_harden_billing_checkout_atomicity.sql`
- `npx supabase migration list` also showed this unrelated taxonomy migration as local-only:
  - `20260619214332_add_vehicle_taxonomy_metadata.sql`
- `20260619120000_add_vehicle_taxonomy_candidates.sql` appeared in remote migration history and must be present locally so clean Supabase CLI migration checks can compare history.

## Hard rule

Do not run plain `npx supabase db push` from the current dirty worktree.

The local Supabase CLI supports `db push --dry-run`, but the checked CLI help does not expose a flag for selecting only specific migration files. Isolation must therefore come from a clean worktree/branch or from explicit manual SQL application after owner approval.

Current dry-run behavior:

- `npx supabase db push --dry-run` exits without applying anything because two launch migrations are older than the last remote migration.
- The CLI says to rerun with `--include-all`.
- `npx supabase db push --dry-run --include-all` from the dirty worktree would apply the three launch-critical migrations plus the unrelated `20260619214332_add_vehicle_taxonomy_metadata.sql`.
- Therefore, never use `--include-all` from this dirty worktree.

Clean-worktree dry-run evidence:

- `C:\Users\User\Desktop\Projects\autobazar123-launch-db` was created as a detached `HEAD` worktree for the initial dry-run proof.
- The worktree was linked with `npx supabase --workdir C:\Users\User\Desktop\Projects\autobazar123-launch-db link --project-ref <project-ref>`.
- Without `20260619120000_add_vehicle_taxonomy_candidates.sql` present, `db push --dry-run` failed because remote migration history was missing locally.
- With that already-remote migration file present, `npx supabase --workdir C:\Users\User\Desktop\Projects\autobazar123-launch-db db push --dry-run --include-all` listed exactly:
  - `20260618174500_harden_profile_dealer_public_reads.sql`
  - `20260618193000_align_payment_notifications_billing.sql`
  - `20260620010000_harden_billing_checkout_atomicity.sql`
- It did not list `20260619214332_add_vehicle_taxonomy_metadata.sql`.
- After `20260619120000_add_vehicle_taxonomy_candidates.sql` was committed, a fresh throwaway worktree from the committed state was linked and rerun with `db push --dry-run --include-all`; it again listed only the three launch-critical migrations above and was removed after verification.

Clean-worktree local gate evidence:

- The persistent clean launch worktree `C:\Users\User\Desktop\Projects\autobazar123-launch-db` passed these commands before any preview deploy or remote DB push:
  - `npm run easy:quick`
  - `npm run test:security:release-gate`
  - `npm run test:db:rls`
  - `npm run build`
  - `npm run check:launch-test-coverage -- --require-complete`
  - `npm run check:algolia-search`
  - `npm audit --json`
- `npm run test:db:rls` in that clean worktree applied checked-in migrations through `20260620010000_harden_billing_checkout_atomicity.sql` and did not apply `20260619214332_add_vehicle_taxonomy_metadata.sql`.
- `npm run build` generated 331 pages.
- The first build attempt failed because `node_modules` was a junction to the main worktree; Turbopack rejected that symlink as outside the project root. A real `npm ci --prefer-offline --no-audit` install in the clean worktree fixed the build.

## Launch-critical migration order

Use this order unless a fresh diff shows a new dependency:

1. Deploy the compatible application code first.
   - Required because the current deployed listing detail page must stop depending on anonymous raw `profiles` joins before profile/dealer RLS is hardened remotely.
2. Apply `20260618193000_align_payment_notifications_billing.sql`.
   - Required before proving payment notifications for billing transactions.
3. Apply `20260620010000_harden_billing_checkout_atomicity.sql`.
   - Required before final paid private-listing checkout verification.
4. Apply `20260618174500_harden_profile_dealer_public_reads.sql`.
   - Required to close the live anon `profiles` and raw `dealers` exposure.
   - Apply after compatible code is deployed.
5. Do not apply `20260619214332_add_vehicle_taxonomy_metadata.sql` in this lane.

## Preferred safe path

Use a clean launch worktree/branch that contains only committed launch-critical code and migrations.

1. Confirm the current dirty taxonomy files are preserved:
   - `git status --short`
2. Create a separate clean worktree from current committed `master`:
   - `git worktree add ..\autobazar123-launch-db master`
3. In the clean worktree, confirm no dirty files:
   - `git status --short`
4. Link the clean worktree to the same Supabase project if `supabase/.temp` is absent:
   - `npx supabase link --project-ref <production-project-ref>`
   - Do not commit or copy `supabase/.temp` into git.
5. Confirm migration history:
   - `npx supabase migration list`
   - Expected: `20260619120000_add_vehicle_taxonomy_candidates.sql` appears on both local and remote.
   - Expected: the three launch-critical migrations appear local-only.
   - Not allowed: `20260619214332_add_vehicle_taxonomy_metadata.sql` appears local-only in this lane.
6. If the clean worktree still lacks the already-remote `20260619120000_add_vehicle_taxonomy_candidates.sql`, stop and repair the local migration-history mirror before running dry-runs.
7. If the clean worktree still contains unrelated local-only taxonomy migrations, remove them only in that clean worktree or create a temporary launch branch that excludes them.
8. Run a dry run before touching remote:
   - `npx supabase db push --dry-run --include-all`
9. Verify the dry run lists only:
   - `20260618174500_harden_profile_dealer_public_reads.sql`
   - `20260618193000_align_payment_notifications_billing.sql`
   - `20260620010000_harden_billing_checkout_atomicity.sql`
10. Run Vercel env/build preflight before any deploy:
   - `npx vercel env run -e preview -- npm run build`
   - `npx vercel env run -e production -- npm run build`
   - Expected: both pass without printing secret values.
   - Current blocker: Preview fails because `SUPABASE_SERVICE_ROLE_KEY` is empty/unusable; Production fails because `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, and `ALGOLIA_SYNC_SECRET` are empty/unusable.
   - Also repair Production `EMAIL_FROM` / `EMAIL_REPLY_TO` literal `\r\n` values by delete/recreate or dashboard edit, because the CLI refused direct sensitive updates.
11. Deploy preview from the same clean code state only after Vercel env/build preflight is green.
12. Smoke preview:
   - `/api/health`
   - homepage
   - one real listing detail page
   - seller dashboard
   - admin dashboard
13. Apply selected remote migrations only after the dry run and preview smoke are clean.
14. Rerun remote migration list:
   - `npx supabase migration list`
15. Run local and live safety checks listed below.
16. Deploy production only after preview, remote migrations, and post-migration checks pass.
17. Run short production smoke after deploy.

## Manual SQL fallback

Use this only if the clean-worktree migration path is blocked and the owner explicitly approves manual remote SQL.

1. Confirm production backup/PITR posture from `docs/database-backup-restore-runbook.md`.
2. Copy only the SQL from the three launch-critical migration files.
3. Apply them one at a time in the order above.
4. Record the exact timestamp, operator, and Supabase project.
5. Immediately run the post-migration checks.

Do not manually apply taxonomy SQL in this payment/RLS lane.

## Post-migration checks

Run these before claiming the remote work is done:

- `npx supabase migration list`
- `npm run test:db:rls`
- live anon probe proving anonymous users cannot read:
  - `profiles.email`
  - `profiles.phone`
  - `profiles.credit_balance`
  - raw `dealers`
- preview `/auto/[id]` real listing detail smoke
- preview seller dashboard smoke
- preview admin dashboard smoke
- Stripe paid checkout test in preview:
  - use test card `4242 4242 4242 4242`
  - verify Stripe Checkout completes
  - verify webhook reaches `/api/stripe/webhook`
  - verify `billing_checkout_sessions.status='paid'`
  - verify a `billing_transactions` row exists
  - verify the listing action is applied
  - verify payment confirmation email is queued/sent
- Stripe failure-path test in preview:
  - use test card `4000 0000 0000 9995`
  - verify failed payment does not apply listing action or grant credits
  - verify payment failure email is queued/sent when Stripe provides an email
- `npm run test:security:release-gate`
- `npm run build`

## Evidence to keep

Record evidence in `PROJECT_STATUS.md`, `docs/launch-checklist.md`, and `docs/launch-completion-audit.md`:

- migration list before and after
- dry-run output summary
- preview URL
- production URL if deployed
- Stripe test session id, redacted if needed
- webhook delivery status
- DB verification summary without printing secrets or user-sensitive row data
- email delivery status
- exact commands that passed

## Release blocker state

Until this runbook is executed successfully:

- live profile/dealer RLS hardening is still not proven on remote
- paid Stripe completion/webhook/payment email delivery is still not proven end-to-end
- launch remains blocked for payment-enabled public use
