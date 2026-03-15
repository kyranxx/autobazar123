# Supabase Inspection Report

Date: 2026-03-14

## Scope

This audit inspected the Supabase setup for Autobazar123 using:

- Supabase CLI against the linked hosted project
- Checked-in Supabase config and migrations under `supabase/`
- Local app wiring that reads and writes Supabase tables

I used CLI because the repo has a Supabase MCP endpoint configured in `.vscode/mcp.json`, but that MCP server is not exposed as a callable tool in this session.

## Hosted project snapshot

- Linked project count visible to the CLI profile: 1
- Project name: `autobazar123`
- Project ref: `vxwbbzjlctjpzivfkdou`
- Region: `Central EU (Frankfurt)`
- Created at: `2026-01-03 17:48:29 UTC`
- Preview branches: none
- Edge Functions deployed: none
- Supabase secrets visible from CLI inventory: `SUPABASE_DB_URL`
- API key families present in the hosted project: legacy `anon` and `service_role`, plus newer publishable and secret keys

## Local app / local stack snapshot

- `supabase/config.toml` uses local project id `autobazar123`
- Local Postgres major version is pinned to `17`
- REST API exposes `public` and `graphql_public`
- Local auth is enabled
- Local email confirmations are disabled in `supabase/config.toml`
- Local password minimum is `6` and no extra password complexity is configured in `supabase/config.toml`
- Local Studio, Realtime, Storage, Analytics, and Inbucket are enabled
- Local Storage S3 compatibility is enabled
- Local seed is enabled, but `supabase/seed.sql` does not exist

## Current app host wiring

From `.env.local`, the app currently points at:

- Host: `vxwbbzjlctjpzivfkdou.supabase.co`
- Custom Supabase domain in local env: no

The app uses:

- SSR/browser Supabase clients for normal user access
- A service-role admin client for privileged server writes
- Google OAuth in app code

## Live database inventory

The hosted database inspection returned these live `public` tables. Row counts below are estimated counts from `supabase inspect db table-stats`.

| Table | Estimated rows | Notes |
| --- | ---: | --- |
| `system_logs` | 680 | Largest table by usage in current snapshot |
| `ads` | 192 | Core marketplace listings |
| `models` | 198 | Vehicle model catalog |
| `brands` | 20 | Vehicle brand catalog |
| `profiles` | 9 | User profile extension over `auth.users` |
| `site_admins` | 2 | Admin-role mapping table |
| `credit_packages` | 5 | Credit pack catalog |
| `credit_transactions` | 4 | Ledger for credits and purchases |
| `saved_ads` | 2 | Wishlist/favorites |
| `saved_ad_alert_preferences` | 2 | Alert preferences for saved ads |
| `inquiries` | 3 | Buyer/seller messaging |
| `site_settings` | 2 | Operational settings |
| `feature_flags` | 6 | Runtime flags |
| `admin_audit_logs` | 12 | Admin activity log |
| `idempotency_keys` | 0 | Idempotency support |
| `payment_notifications` | 0 | Payment email tracking |
| `stripe_webhook_logs` | 0 | Stripe webhook audit trail |
| `email_deliveries` | 0 | Email admin center log |
| `dealers` | 0 | Dealer entities exist structurally, no live rows in snapshot |

Hosted DB stats snapshot:

- Database size: `15 MB`
- Total table size: `1088 kB`
- Total index size: `1104 kB`
- WAL size: `80 MB`
- Table hit rate: `1.00`
- Index hit rate: `1.00`

## Schema declared in git

Tables declared by checked-in migrations:

- `admin_audit_logs`
- `ads`
- `brands`
- `credit_packages`
- `credit_transactions`
- `dealers`
- `email_deliveries`
- `feature_flags`
- `idempotency_keys`
- `inquiries`
- `models`
- `payment_notifications`
- `profiles`
- `saved_ad_alert_preferences`
- `saved_ads`
- `site_settings`
- `stripe_webhook_logs`
- `system_logs`

Enums declared by checked-in migrations:

- `ad_status`
- `body_type`
- `fuel_type`
- `transmission_type`

SQL functions declared by checked-in migrations:

- `cleanup_old_logs`
- `cleanup_saved_alert_preferences_on_saved_ads_delete`
- `dealer_apply_bulk_action`
- `deduct_and_boost_ad`
- `deduct_credit`
- `deduct_credits_with_transaction`
- `enforce_inquiry_rate_limit`
- `handle_new_user`
- `increment_ad_views`
- `is_stripe_transaction_processed`
- `process_stripe_credit_topup`
- `publish_ad_with_credits`
- `set_saved_ad_alert_preferences_updated_at`
- `sync_saved_alert_preferences_on_saved_ads_insert`
- `update_feature_flags_updated_at`

Triggers declared by checked-in migrations:

- `on_auth_user_created`
- `trigger_feature_flags_updated_at`
- `trg_saved_ad_alert_preferences_updated_at`
- `trg_saved_ads_insert_alert_preferences`
- `trg_saved_ads_delete_alert_preferences`
- `trg_enforce_inquiry_rate_limit`

RLS is explicitly enabled in migrations for:

- `ads`
- `brands`
- `credit_packages`
- `credit_transactions`
- `dealers`
- `email_deliveries`
- `feature_flags`
- `inquiries`
- `models`
- `payment_notifications`
- `profiles`
- `saved_ad_alert_preferences`
- `saved_ads`
- `site_admins`
- `site_settings`
- `stripe_webhook_logs`
- `system_logs`
- `admin_audit_logs`

## What the setup is doing

The current Supabase design is a single hosted Postgres project with most app data in `public`, plus Supabase Auth for identity. The app uses:

- `profiles` as the app-level user record linked to `auth.users`
- `site_admins` as admin RBAC
- `ads`, `brands`, `models`, `dealers` as marketplace domain tables
- `credit_packages`, `credit_transactions`, `payment_notifications`, `stripe_webhook_logs`, and idempotency support for billing
- `saved_ads`, `saved_ad_alert_preferences`, and `inquiries` for user engagement
- `feature_flags`, `site_settings`, `system_logs`, `admin_audit_logs`, and `email_deliveries` for operations/admin tooling

RLS is used broadly. The later migrations harden role scopes so that critical tables like `profiles`, `ads`, and `credit_transactions` explicitly grant access to `authenticated` and `service_role` instead of relying on implicit/public behavior.

## Confirmed issues and drift

### 1. `contact_messages` is used by the app but missing from the Supabase schema

Confirmed:

- `src/app/api/contact/route.ts` inserts into `contact_messages`
- no checked-in migration creates `contact_messages`
- the live table inventory does not show `contact_messages`

Impact:

- the contact form is structurally broken against a fresh environment
- it is also likely broken in the hosted project unless the table was created manually outside git and later removed, or the route is currently failing

### 2. Admin moderation code expects ad statuses that migrations do not define

Confirmed:

- checked-in enum: `ad_status = ('draft', 'active', 'sold', 'expired', 'banned')`
- admin code queries `ads.status = "pending"`
- admin code updates ads to `status = "rejected"`
- no migration was found that adds `pending` or `rejected` to `ad_status`

Impact:

- fresh environments cannot support the current moderation flow correctly
- hosted behavior depends on out-of-band drift or code paths that are not actually exercised

### 3. `site_admins` exists live but is not created by checked-in migrations

Confirmed:

- live table inventory includes `site_admins` with 2 rows
- migrations reference and harden `site_admins`
- no checked-in `CREATE TABLE` for `site_admins` was found
- one hardening migration explicitly tolerates the table being missing

Impact:

- fresh environments are not reproducible from migrations alone
- admin RBAC bootstrapping depends on manual drift or missing SQL that is not in git

### 4. Local seeding is misconfigured

Confirmed:

- `supabase/config.toml` enables seeding from `./seed.sql`
- `supabase/seed.sql` does not exist

Impact:

- `supabase db reset` on a local stack will not have the seed file the config expects
- local bootstrap behavior is ambiguous and likely incomplete

### 5. A plaintext maintenance password is written by migration

Confirmed:

- one migration blanks the known default `autobazar2026`
- a later migration writes `maintenance_password = 'pepsicola'` directly into `site_settings`

Impact:

- operational secret material is stored in migration history
- rotation is awkward because secrets are embedded in schema history instead of external secret management

### 6. Supabase Storage is enabled in local config, but the app media path is Cloudflare Images

Confirmed:

- local Supabase Storage is enabled in `supabase/config.toml`
- the app upload route uses Cloudflare Images direct upload
- a migration filters `ads.photos_json` to Cloudflare `imagedelivery.net` URLs

Impact:

- Supabase Storage currently looks unused for the listing photo path
- keeping it enabled may be harmless locally, but it is not part of the actual production media architecture

## Inspection limitations

Some hosted inspection commands were only partially available:

- `supabase inspect db table-stats` and `db-stats` worked and provided useful live metadata
- `supabase inspect db role-stats`, `index-stats`, and `traffic-profile` did not complete cleanly here
- direct dump-style inspection hit auth problems for the transient `cli_login_postgres` role
- storage inspection required experimental mode and did not return a usable inventory in this session

That means this report is strong on project metadata, live public-table inventory, and checked-in schema design, but not a full raw `pg_dump` of the hosted project.

## Recommended next actions

1. Add a real checked-in migration for `site_admins`.
2. Add a real checked-in migration for `contact_messages`, or remove the table usage and replace it with the intended data path.
3. Reconcile `ad_status` with runtime behavior by either:
   - extending the enum to include `pending` and `rejected`, or
   - rewriting admin moderation to match the real stored status model.
4. Remove plaintext maintenance password values from migrations and move that secret to environment-backed operational config.
5. Fix local bootstrap by either adding `supabase/seed.sql` or disabling seed loading in `supabase/config.toml`.
6. Decide whether Supabase Storage is intentionally unused; if yes, document that Cloudflare Images is the canonical media path.
