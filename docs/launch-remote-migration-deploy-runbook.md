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
- `20260619120000_add_vehicle_taxonomy_candidates.sql` was present locally and appeared in remote migration history, but the file was still untracked locally.

## Hard rule

Do not run plain `npx supabase db push` from the current dirty worktree.

The local Supabase CLI supports `db push --dry-run`, but the checked CLI help does not expose a flag for selecting only specific migration files. Isolation must therefore come from a clean worktree/branch or from explicit manual SQL application after owner approval.

Current dry-run behavior:

- `npx supabase db push --dry-run` exits without applying anything because two launch migrations are older than the last remote migration.
- The CLI says to rerun with `--include-all`.
- `npx supabase db push --dry-run --include-all` from the dirty worktree would apply the three launch-critical migrations plus the unrelated `20260619214332_add_vehicle_taxonomy_metadata.sql`.
- Therefore, never use `--include-all` from this dirty worktree.

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
   - Expected: `20260619120000_add_vehicle_taxonomy_candidates.sql` may appear remote-only because it is remote-applied but untracked locally.
   - Expected: the three launch-critical migrations appear local-only.
   - Not allowed: `20260619214332_add_vehicle_taxonomy_metadata.sql` appears local-only in this lane.
6. If the clean worktree still contains unrelated local-only taxonomy migrations, remove them only in that clean worktree or create a temporary launch branch that excludes them.
7. Run a dry run before touching remote:
   - `npx supabase db push --dry-run --include-all`
8. Verify the dry run lists only:
   - `20260618174500_harden_profile_dealer_public_reads.sql`
   - `20260618193000_align_payment_notifications_billing.sql`
   - `20260620010000_harden_billing_checkout_atomicity.sql`
9. Deploy preview from the same clean code state.
10. Smoke preview:
   - `/api/health`
   - homepage
   - one real listing detail page
   - seller dashboard
   - admin dashboard
11. Apply selected remote migrations only after the dry run and preview smoke are clean.
12. Rerun remote migration list:
   - `npx supabase migration list`
13. Run local and live safety checks listed below.
14. Deploy production only after preview, remote migrations, and post-migration checks pass.
15. Run short production smoke after deploy.

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
