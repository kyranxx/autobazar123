# Launch Remote Migration and Deploy Runbook

## Purpose

This runbook defines the safe path for finishing the current launch-critical remote work without mixing in unrelated taxonomy migrations.

It exists because the current worktree has both:

- launch-critical payment/RLS migrations that must reach remote before final launch verification
- unrelated taxonomy migration files that must not be pushed as part of the payment/RLS launch lane

## Current verified state

- 2026-06-21 execution update:
  - Current reviewed app source used for deploy/payment/cron/maintenance proof: `C:\Users\User\Desktop\Projects\ab123-rs-153336` at `2297260` (`fix: handle stripe failed payment intents`).
  - Preview deploy succeeded: `dpl_8mpqjPYXKpYNkuXicZ6YUghDGkad`, `https://autobazar123-dh4n3e44q-daniels-projects-98c0558b.vercel.app`.
  - Production deploy succeeded: `dpl_CSYeS3gn1VYRkCz2LGdkt73hiNNN`, aliased to `https://www.autobazar123.sk`.
  - The three launch-critical remote migrations were applied earlier from reviewed worktree `a2417f3`; the deferred `20260619214332_add_vehicle_taxonomy_metadata.sql` migration stayed out of this lane.
  - Fresh live RLS passes: `npm run check:live-rls-posture -- --json` returned 4/4 safe probes, 0 leaked rows, and 0 probe errors.
  - Fresh Production smoke passes: `TEST_URL=https://www.autobazar123.sk npm run test:smoke` passed 10/10.
  - Fresh protected Preview route smoke passes through the Vercel share cookie for the main launch route shell set.
  - Real Preview Stripe success smoke passes: paid checkout, billing transaction, `payment_notifications.billing_transaction_id`, sent payment email delivery, processed webhook log with session/user context, and verified cleanup.
  - Real Preview Stripe failed-payment smoke passes: failed PaymentIntent with receipt email and checkout metadata, Production `payment_intent.payment_failed` webhook processed, checkout marked `failed`, no billing transaction created, seller ad unchanged, payment failure email sent, and cleanup left 0 run rows.
  - Deployed cron route smoke passes: unauthenticated requests returned 401; authorized Production cron routes returned 200; follow-up Algolia parity was 56/56.
  - Deployed maintenance-bypass runtime smoke passes: Production maintenance redirect, unlock, bypass cookie, and restore to `maintenance_mode=false` verified.
  - Remaining open gates before public launch: configure real Turnstile envs and rerun deployed inquiry/browser smoke, then get explicit public SEO indexing approval. Fresh local Docker-backed RLS now passes from clean reviewed source `2297260`, and Vercel Production runtime logs verified the scheduled `cleanup-sold` cron invocation at 18:56:21 UTC with HTTP 200.

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
- 2026-06-20 current-commit recheck: a fresh throwaway worktree at `C:\Users\User\Desktop\Projects\autobazar123-launch-preflight-20260620-01` from commit `7426f49` was linked with existing Supabase metadata and passed `npx supabase --workdir <verify-worktree> migration list` plus `npx supabase --workdir <verify-worktree> db push --dry-run --include-all`; the dry-run again listed only the three launch-critical migrations above and the throwaway worktree was removed.
- 2026-06-20 current-commit recheck from committed `master`: a fresh detached throwaway worktree at `C:\Users\User\Desktop\Projects\autobazar123-launch-db-current` from commit `b3f3cbb` passed `npm run check:launch-migration-worktree -- --root C:\Users\User\Desktop\Projects\autobazar123-launch-db-current`. After linking to the existing Supabase project ref, `npx supabase migration list` showed the same three launch-critical local-only migrations, and `npx supabase db push --dry-run --include-all` listed exactly those three migrations. The blocked taxonomy metadata migration was absent and no remote migration was applied.
- 2026-06-20 recheck after Stripe webhook cleanup: Supabase CLI `2.107.0` still exposes no migration-file selection flag. A fresh detached throwaway worktree at `C:\Users\User\Desktop\Projects\autobazar123-launch-dryrun-20260620-190614` from commit `b3f3cbb` passed the launch migration guard, was linked to the existing Supabase project ref, and `npx supabase --workdir <throwaway-worktree> db push --dry-run --include-all` again listed exactly the same three launch-critical migrations. The blocked taxonomy metadata migration was absent, no remote migration was applied, and the throwaway worktree was removed.
- 2026-06-21 recheck: Supabase CLI `2.107.0` still completed the clean-worktree dry-run path. A fresh detached throwaway worktree at `C:\Users\User\Desktop\Projects\autobazar123-launch-dryrun-20260621-044234` from commit `b3f3cbb` passed `npm run check:launch-migration-worktree -- --root <throwaway-worktree>`, was linked to the existing Supabase project ref, and `npx supabase --workdir <throwaway-worktree> db push --dry-run --include-all` listed exactly:
  - `20260618174500_harden_profile_dealer_public_reads.sql`
  - `20260618193000_align_payment_notifications_billing.sql`
  - `20260620010000_harden_billing_checkout_atomicity.sql`
  The blocked taxonomy metadata migration was absent, no remote migration was applied, and the throwaway worktree was removed.
- 2026-06-21 Supabase CLI capability recheck: `npx supabase --version` still reports `2.107.0`; `npx supabase db push --help` still exposes no per-migration-file selection flag; and the Supabase changelog scan for CLI/migration/db-push changes found no relevant stable capability. Isolation still must come from a clean launch worktree or an owner-approved manual SQL path.
- Warning: the persistent `C:\Users\User\Desktop\Projects\autobazar123-launch-db` worktree was later reused for local Vercel build investigation and became stale/dirty. On 2026-06-20 it was removed after its scratch route/preflight files were compared against current `master` and the only unique test mock improvements were preserved. Do not assume that folder exists; create a fresh clean launch worktree and repeat the dry-run from the current commit before any remote DB push.

Clean-worktree local gate evidence:

- The now-removed historical clean launch worktree `C:\Users\User\Desktop\Projects\autobazar123-launch-db` passed these commands before any preview deploy or remote DB push:
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
- Later Vercel Preview build investigation in this same folder is not clean deploy evidence. App-side route fixes made local `npm run build` pass with 330 pages, but local `npx vercel build --target=preview --yes` failed at that time on static-PPR `/audi/a1` with `Unable to find lambda for route`.
- Fresh 2026-06-20 recheck from throwaway worktree `C:\Users\User\Desktop\Projects\autobazar123-vercel-preflight-292bcd4` at commit `292bcd4` reproduced the same failure with `npx vercel@54.14.2 build --target=preview --yes`.
- Earlier 2026-06-21 current-worktree recheck found updated npm tag `vercel latest=54.14.5` while `next latest=16.2.9` and `react latest=19.2.7` were unchanged. `npx vercel@54.14.5 build --target=preview --yes` still reproduced the same `Unable to find lambda for route: /audi/a1` failure at that time.
- Later 2026-06-21 remediation superseded that blocker: global Cache Components/PPR is off, featured-cars caching moved to `unstable_cache`, sitemap pSEO URLs now come from active ad rows joined to canonical brand/model slugs, and `.vercel/**` is ignored by ESLint as generated output.
- Current diagnostic: fresh 2026-06-21 continuation `npm run check:vercel-build-preview` exited 0, generated 302 pages, created `.vercel\output`, and reported `Build completed successfully` for target `preview`; follow-up `npm run check:vercel-ppr-lambda-blocker` returned OK with 0 partially-static routes and no `next-resume` PPR chain headers. Later Preview deployment `dpl_Ev4TEGLi9Pr5zGwswhJHcvmfN1Uu` reached Ready from reviewed source `a2417f3`.

## Remote deploy and migration order

Compatibility rule:

- Preview deploy alone is not enough before remote RLS hardening.
- The profile/dealer RLS migration changes the shared remote Supabase database used by the live app.
- Therefore compatible application code must be deployed to Production before the remote RLS migration is applied.
- If Production deploy is not approved yet, stop after Preview smoke and do not apply remote migrations.

Supabase CLI batch order:

- The safe CLI path is a clean worktree plus `db push --include-all`.
- The Supabase CLI applies the selected migration batch in filename timestamp order.
- The expected safe batch order is:
  1. `20260618174500_harden_profile_dealer_public_reads.sql`
  2. `20260618193000_align_payment_notifications_billing.sql`
  3. `20260620010000_harden_billing_checkout_atomicity.sql`
- This timestamp order is acceptable only after compatible code is live in Production.
- The payment migrations must be applied before payment notification logging and paid-checkout smoke are claimed, but they do not need to run before the profile/dealer RLS migration.

Logical launch requirements:

1. Deploy the compatible application code first.
   - Required because the current deployed listing detail page must stop depending on anonymous raw `profiles` joins before profile/dealer RLS is hardened remotely.
2. Apply the clean-worktree Supabase migration batch.
   - Actual apply command after the dry-run is approved:
     - `npx supabase --workdir <clean-worktree> db push --include-all`
   - Do not include `--dry-run` in the real apply command.
   - Stop if the dry-run listed anything besides the three launch-critical migrations.
3. Recheck live RLS.
   - Required to prove anonymous users can no longer read raw profile/dealer data.
4. Recheck payment notification logging.
   - Required before proving payment notifications for billing transactions.
5. Do not apply `20260619214332_add_vehicle_taxonomy_metadata.sql` in this lane.

Known admin links:

- Supabase project overview: `https://supabase.com/dashboard/project/vxwbbzjlctjpzivfkdou`
- Supabase SQL editor: `https://supabase.com/dashboard/project/vxwbbzjlctjpzivfkdou/sql/new`
- Vercel project is locally linked as project name `autobazar123`, project id `prj_hd6JGoZ070mgiWSrtmk4olPt9Atw`; use the deployment URL printed by `npx vercel@54.14.5 deploy`.
- Vercel environment variables: `https://vercel.com/daniels-projects-98c0558b/autobazar123/settings/environment-variables`
- Cloudflare Turnstile dashboard: `https://dash.cloudflare.com/?to=/:account/turnstile`

## Turnstile owner action

Production buyer inquiries are blocked until a real Cloudflare Turnstile widget is configured and deployed.

1. In Cloudflare Turnstile, create or reuse a widget for Autobazar123.
   - Required hostnames: `autobazar123.sk`, `www.autobazar123.sk`.
   - Optional Preview hostname for smoke testing: `autobazar123-dh4n3e44q-daniels-projects-98c0558b.vercel.app`.
   - Do not add broad `*.vercel.app` hostnames; the server now checks the Turnstile response hostname, but exact widget hostnames are still the safest launch setup.
2. Add these Vercel env vars to both Preview and Production:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = Cloudflare public sitekey.
   - `TURNSTILE_SECRET_KEY` = Cloudflare secret key.
3. Redeploy Preview/Production. `NEXT_PUBLIC_*` values are baked into the client bundle at build time, so adding the env var to an already-built deployment is not enough.
4. Verify:
   - `npm run check:vercel-env-names`
   - deployed buyer inquiry smoke or full Production release gauntlet
   - 0 leftover release-gauntlet inquiry rows after cleanup

## Owner approval packet

Use this packet only after the deploy source is explicit. A dirty current worktree is not a normal launch source unless the owner explicitly accepts that risk.

Do not combine these approvals. Ask for them one at a time, verify the result, then continue.

1. Preview deploy approval
   - Ask: `Approve Preview deploy from <exact source choice>?`
   - Required immediately before asking: `npm run check:deploy-source-readiness` passes from the chosen source, then `npm run check:launch-blockers:full -- --allow-extra-worktrees` has no unexpected blocker beyond live anon RLS before the migration sequence when the source is an extra git worktree. Use the plain full command only in a source with exactly one worktree.
   - Command after approval: `npx vercel@54.14.5 deploy`
   - Evidence to record: preview URL, deploy status, commit/source decision, smoke results.
   - Stop if: deploy-source readiness is blocked, the source choice is unclear, the local full rollup has any unexplained blocker, or Vercel reports a failed build.

2. Production compatible-code deploy approval
   - Ask only after Preview smoke passes: `Approve Production deploy with indexing still disabled?`
   - Command after approval: `npx vercel@54.14.5 deploy --prod`
   - Evidence to record: production URL, deploy status, `TEST_URL=<production-url> npm run test:smoke`, and sensitive runtime smoke notes.
   - Stop if: Preview smoke failed, production env/provider state is not accepted by owner, or crawler indexing would be enabled.

3. Remote Supabase migration approval
   - Ask only after Preview smoke, Production deploy, pre-migration Production smoke, and clean-worktree dry-run are complete.
   - Ask: `Approve applying exactly these three remote migrations with npx supabase --workdir <clean-worktree> db push --include-all?`
   - Required dry-run output must list only:
     - `20260618174500_harden_profile_dealer_public_reads.sql`
     - `20260618193000_align_payment_notifications_billing.sql`
     - `20260620010000_harden_billing_checkout_atomicity.sql`
   - Command after approval: `npx supabase --workdir <clean-worktree> db push --include-all`
   - Direct manual review link if needed: `https://supabase.com/dashboard/project/vxwbbzjlctjpzivfkdou/sql/new`
   - Stop if: dry-run lists any other migration, especially `20260619214332_add_vehicle_taxonomy_metadata.sql`, or the clean worktree guard fails.

4. Public SEO indexing approval
   - Ask only after post-migration RLS, payment logging, Preview smoke, and Production smoke are green.
   - Ask: `Approve enabling Production indexing for public SEO launch?`
   - Do not set `NEXT_PUBLIC_SITE_INDEXING_ENABLED=true` before this approval.
   - Evidence to record after approval/deploy: robots, sitemap, canonical host, metadata, and Search Console readiness.

## Deploy source preflight

Use this before asking for Preview deploy approval.

Why this matters:

- Vercel CLI deploys from the current project root or a provided source path: `https://vercel.com/docs/cli/deploying-from-cli`.
- Vercel docs say that, aside from default exclusions, all project files are uploaded unless excluded by `.vercelignore`: `https://vercel.com/docs/deployments/vercel-ignore`.
- Vercel default CLI exclusions include `.git`, `.vercel`, `.env.local`, `.env.*.local`, `.next`, and `node_modules`, but not arbitrary source files or Supabase migrations: `https://vercel.com/docs/builds/build-features`.

Current source audit from 2026-06-21:

- Current main worktree is not the deploy source: it is ahead of `origin/master` and still contains the deferred taxonomy/provider lane.
- Root `.vercelignore` exists and excludes Supabase DB artifacts, deferred taxonomy/provider operator scripts, deferred taxonomy helper source files, and local test/report output from Vercel source upload.
- `.vercel/project.json` links this directory to project `autobazar123`, project id `prj_hd6JGoZ070mgiWSrtmk4olPt9Atw`, with default root directory settings.
- `npm run test:deploy-source-readiness-script` passed 4/4.
- `npm run check:deploy-source-readiness` blocks the current main worktree.
- Staged files: 63.
- Unstaged files: 1.
- Untracked non-ignored files: 19.
- Untracked dirty taxonomy lane includes discovery/promotion scripts, taxonomy helper/tests, and `supabase/migrations/20260619214332_add_vehicle_taxonomy_metadata.sql`.

Current reviewed source ready from 2026-06-21:

- Clean detached worktree: `C:\Users\User\Desktop\Projects\ab123-rs-153336`.
- Commit: `2297260` (`fix: handle stripe failed payment intents`).
- `npm run check:deploy-source-readiness` passes from that worktree with 0 staged, 0 unstaged, and 0 untracked files.
- Direct path checks confirm deferred taxonomy/provider scripts/helpers and `supabase/migrations/20260619214332_add_vehicle_taxonomy_metadata.sql` are absent.
- Fresh `npm run check:launch-blockers:full -- --allow-extra-worktrees` from that worktree passes after the remote migrations and live RLS proof.
- `npx supabase link --project-ref vxwbbzjlctjpzivfkdou` succeeded locally in that worktree and created ignored `supabase/.temp` metadata.
- `npx supabase --workdir C:\Users\User\Desktop\Projects\ab123-rs-153336 migration list` shows the three launch-critical migrations are now present locally and remotely; the blocked taxonomy metadata migration is absent.

Implication:

- A plain `npx vercel@54.14.5 deploy` from this current main worktree is not a clean reviewed-source deploy.
- It can upload uncommitted and untracked project files that are not default-excluded by Vercel.
- The dirty taxonomy migration would not be applied to Supabase by deployment alone, but its source file could still be uploaded with the deployment source bundle.

Preferred source choice:

1. Use the reviewed source `C:\Users\User\Desktop\Projects\ab123-rs-153336` at `2297260`, unless a newer reviewed source is created and reverified.
2. If any launch source changes before deploy, rerun `npm run check:deploy-source-readiness`, `npm run check:launch-blockers:full -- --allow-extra-worktrees`, `npx supabase migration list`, and `npx supabase db push --dry-run --include-all` from that exact source.
3. Ask: `Approve Preview deploy from reviewed source C:\Users\User\Desktop\Projects\ab123-rs-153336 at <current-reviewed-commit>?`

Allowed only with explicit owner acceptance:

- Dirty current-worktree Preview deploy. Ask: `Approve dirty current-worktree Preview deploy, including the currently listed unstaged and untracked files?`
- This is not recommended for launch readiness because it mixes launch-approved work with deferred taxonomy/provider work.

## Preferred safe path

Use a clean launch worktree/branch that contains only committed launch-critical code and migrations.

Run the Supabase commands below from the main repo with `--workdir <clean-worktree>`. If you intentionally `cd` into the clean worktree first, the `--workdir` flag may be omitted, but never run these commands from the dirty main worktree.

1. Confirm the current dirty taxonomy files are preserved:
   - `git status --short`
2. Create or refresh a separate clean worktree from current committed `master`:
   - The old `..\autobazar123-launch-db` folder was removed on 2026-06-20; if a folder with that name exists again, first verify its commit matches current `master`. Stale worktrees must be recreated or replaced with a new throwaway launch worktree.
   - Example for a fresh path: `git worktree add ..\autobazar123-launch-db-current master`
3. In the clean worktree, confirm no dirty files and the expected commit:
   - `git status --short`
   - `git rev-parse --short HEAD`
4. Run the launch migration worktree guard from the main repo against the clean worktree:
   - `npm run check:launch-migration-worktree -- --root <clean-worktree>`
   - Expected: `launch-migration-worktree: OK`
   - This guard now fails on any dirty worktree entry, dirty `supabase/migrations`, missing required launch migrations, or the blocked taxonomy metadata migration.
   - If it fails, do not run Supabase dry-runs or pushes from that worktree.
5. Link the clean worktree to the same Supabase project if `supabase/.temp` is absent:
   - `npx supabase --workdir <clean-worktree> link --project-ref <production-project-ref>`
   - Do not commit or copy `supabase/.temp` into git.
6. Confirm migration history:
   - `npx supabase --workdir <clean-worktree> migration list`
   - Expected: `20260619120000_add_vehicle_taxonomy_candidates.sql` appears on both local and remote.
   - Expected: the three launch-critical migrations appear local-only.
   - Not allowed: `20260619214332_add_vehicle_taxonomy_metadata.sql` appears local-only in this lane.
7. If the clean worktree still lacks the already-remote `20260619120000_add_vehicle_taxonomy_candidates.sql`, stop and repair the local migration-history mirror before running dry-runs.
8. If the clean worktree still contains unrelated local-only taxonomy migrations, remove them only in that clean worktree or create a temporary launch branch that excludes them.
   - Main worktree warning: `20260619214332_add_vehicle_taxonomy_metadata.sql` is currently an unrelated local-only taxonomy migration. It must stay absent from the launch dry-run unless the owner explicitly chooses to launch that taxonomy feature too.
9. Run a dry run before touching remote:
   - `npx supabase --workdir <clean-worktree> db push --dry-run --include-all`
   - If the CLI asks for `SUPABASE_DB_PASSWORD`, do not guess or print secrets; get the password through the owner/provider path or use an already-linked clean worktree that can complete the dry-run.
10. Verify the dry run lists only:
   - `20260618174500_harden_profile_dealer_public_reads.sql`
   - `20260618193000_align_payment_notifications_billing.sql`
   - `20260620010000_harden_billing_checkout_atomicity.sql`
11. Confirm Vercel env readiness before any deploy:
   - `npm run check:vercel-env-names`
   - Confirms required Preview and Production env names exist in Vercel metadata without pulling or printing secret values.
   - Do not rely on `vercel env run` as proof for sensitive Production/Preview values after they are marked sensitive; local CLI reads can return zero-length values even after re-creation.
   - Current env state: `npm run test:vercel-env-names-script` passes 8/8, and real `npm run check:vercel-env-names` now blocks as expected because Preview and Production are missing `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. The check still prints only metadata names, not secret values.
   - Still not proven: sensitive values cannot be read back through CLI, so cloud build/runtime smoke or provider/dashboard confirmation is required, especially for Upstash and Production Stripe live secret/webhook values.
   - Current build state: local Vercel Preview packaging preflight is green. Run `npm run check:vercel-build-preview` for the pinned full local Vercel Preview build preflight; `npm run check:vercel-ppr-lambda-blocker` reports 0 partially-static routes with no `next-resume` PPR chain headers.
   - Quick diagnostic: `npm run check:vercel-ppr-lambda-blocker`. It should remain `OK` before preview deployment; `-- --expect-blocked` is only for documenting a future regression if the known blocker returns.
   - Deploy source readiness before preview deploy approval: `npm run check:deploy-source-readiness`. It must pass from the chosen source unless the owner explicitly approves a dirty current-worktree deploy.
   - Full local blocker rollup before preview deploy approval: `npm run check:launch-blockers:full -- --allow-extra-worktrees` for an extra clean review-source git worktree, or the plain full command in a source with exactly one worktree. It includes the pinned Vercel Preview build preflight. Rerun it from the same chosen source after deploy-source readiness passes.
   - Before deploying, confirm the deploy source tree contains the same reviewed launch code that passed local gates. If the launch code still exists only as uncommitted main-worktree changes, stop and get owner approval for the deploy source choice: commit/clean launch branch, explicit dirty-tree deploy, or another reviewed source path.
12. Deploy Preview from the same clean code state only when the owner accepts the remaining env/provider state and is ready for cloud build/smoke verification:
   - `npx vercel@54.14.5 deploy`
   - Record the Preview URL printed by the command.
13. Smoke Preview:
   - PowerShell:
     - `$env:TEST_URL="<preview-url>"; npm run test:smoke`
     - `$env:TEST_URL="<preview-url>"; npm run test:agent-browser`
   - `/api/health`
   - homepage
   - one real listing detail page
   - seller dashboard
   - admin dashboard
14. Stop and get explicit owner approval for Production deploy, then deploy compatible code to Production before remote RLS hardening:
   - `npx vercel@54.14.5 deploy --prod`
   - Record the Production URL printed by the command.
   - Keep crawler indexing disabled until the full launch gate is green.
15. Smoke Production before remote migrations:
   - PowerShell:
     - `$env:TEST_URL="<production-url>"; npm run test:smoke`
     - `$env:TEST_URL="<production-url>"; npm run test:agent-browser`
   - Stop if listing detail, seller/admin dashboard, or health checks fail.
16. Stop and get explicit owner approval for the exact dry-run output and the exact apply command, then apply selected remote migrations only after the dry-run, Preview smoke, and pre-migration Production smoke are clean:
   - `npx supabase --workdir <clean-worktree> db push --include-all`
   - Expected applied migrations are exactly:
     - `20260618174500_harden_profile_dealer_public_reads.sql`
     - `20260618193000_align_payment_notifications_billing.sql`
     - `20260620010000_harden_billing_checkout_atomicity.sql`
17. Rerun remote migration list:
   - `npx supabase --workdir <clean-worktree> migration list`
18. Run local and live safety checks listed below.
19. Run post-migration smoke against Production and Preview:
   - `$env:TEST_URL="<production-url>"; npm run test:smoke`
   - `$env:TEST_URL="<preview-url>"; npm run test:smoke`
20. If code changes after the migration, redeploy Preview first, then Production, and rerun the smoke checks.

## Manual SQL fallback

Use this only if the clean-worktree migration path is blocked and the owner explicitly approves manual remote SQL.

1. Confirm production backup/PITR posture from `docs/database-backup-restore-runbook.md`.
2. Copy only the SQL from the three launch-critical migration files.
3. Apply them one at a time in the same timestamp order as the CLI batch:
   1. `20260618174500_harden_profile_dealer_public_reads.sql`
   2. `20260618193000_align_payment_notifications_billing.sql`
   3. `20260620010000_harden_billing_checkout_atomicity.sql`
4. Record the exact timestamp, operator, and Supabase project.
5. Immediately run the post-migration checks.

Do not manually apply taxonomy SQL in this payment/RLS lane.

## Post-migration checks

Run these before claiming the remote work is done:

- `npx supabase --workdir <clean-worktree> migration list`
- `npm run test:db:rls`
- `npm run check:live-rls-posture -- --json`
  - expected after the remote RLS migration: `ok=true`
  - acceptable probe statuses: `denied` or `empty`
  - failure means anonymous users can still read at least one protected target, an unexpected PostgREST/schema error occurred, or the probe itself could not complete
  - the command reports counts/status only and must not print returned row values
- live anon probe targets:
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
  - verify `payment_notifications.billing_transaction_id` is not null for the created billing transaction
  - verify the listing action is applied
  - verify payment confirmation email is queued/sent
- Stripe failure-path test in preview:
  - use test card `4000 0000 0000 9995`
  - verify failed payment does not apply listing action or grant credits
  - verify payment failure email is queued/sent when Stripe provides an email
- `npm run test:security:release-gate`
- `npm run build`

Payment notification logging SQL recheck:

Use the Supabase SQL editor after the successful Stripe test payment. Replace the placeholders with the Stripe session id and billing transaction id from the test artifacts:

```sql
select
  pn.id,
  pn.billing_transaction_id,
  pn.notification_type,
  pn.user_email,
  pn.email_status,
  pn.created_at
from public.payment_notifications pn
join public.billing_transactions bt
  on bt.id = pn.billing_transaction_id
where bt.stripe_session_id = '<cs_test_or_live_session_id>'
   or bt.id = '<billing_transaction_id>'
order by pn.created_at desc
limit 5;
```

Expected result:

- at least one row for the test payment
- `billing_transaction_id` is not null
- `notification_type` is `confirmation` for the successful payment
- `email_status` matches the provider result, normally `sent`

Failure result:

- no rows, a null `billing_transaction_id`, or a SQL error means the payment notification logging blocker is still open.

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

This runbook's core deploy/migration/payment/cron/maintenance path has now been executed successfully for the 2026-06-21 launch lane:

- live profile/dealer RLS hardening is proven on remote by `npm run check:live-rls-posture -- --json`
- remote payment notification logging is proven for a successful Preview Stripe payment with non-null `payment_notifications.billing_transaction_id`
- Preview and Production deployments reached Ready from reviewed source `2297260`
- Production route smoke and protected Preview route smoke passed
- failed-payment Preview smoke passed for seller listing action and cleaned up to 0 run rows
- deployed cron route smoke passed for unauthorized 401 and authorized 200 route behavior
- deployed maintenance-bypass runtime smoke passed and restored `maintenance_mode=false`

Launch still remains blocked for public opening until these follow-up gates are complete:

- first production scheduled-cron invocation verified: `GET /api/cron/cleanup-sold` at 18:56:21 UTC with HTTP 200; keep monitoring future scheduled runs
- real Turnstile env setup plus deployed inquiry/browser re-smoke; latest Production release gauntlet passed 17/18 and failed only on buyer inquiry due missing Turnstile envs
- fresh local Docker-backed RLS suite already passes from clean reviewed source `2297260`; rerun after any future DB/RLS migration change
- explicit owner approval before public SEO indexing/dealer outreach
