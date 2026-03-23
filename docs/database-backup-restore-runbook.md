# Database Backup and Restore Runbook

## Purpose

This runbook defines the minimum backup and restore posture for Autobazar123 production data.

It exists so backup safety is not assumed, forgotten, or left as dashboard-only tribal knowledge.

## Scope

This applies to:

- production Supabase Postgres data
- production auth data linked to Supabase
- production storage metadata that is required to keep listings and user flows consistent

This does not replace provider-managed backup features.

It defines the operational standard the team must maintain.

## Required production posture

- PITR or equivalent point-in-time database recovery must be enabled for production.
- Backup retention must be at least 7 days.
- The restore path must be tested on a schedule, not only assumed from provider docs.
- Backup ownership must be explicit.
- A failed or missing restore drill is release-blocking for production data-risk changes.

## Ownership

- Primary owner: founder or operator responsible for production Supabase access
- Secondary owner: one backup person with access to verify restore readiness

Record the actual owner names in the internal ops record outside this repo if needed.

## What must be checked

At minimum, confirm in the production provider:

- PITR is enabled
- retention window is correct
- backups are healthy
- the current project is the real production project
- storage and auth recovery expectations are understood

## Restore drill cadence

- Monthly: verify backup settings are still enabled and retention is unchanged.
- Quarterly: perform a restore drill into a non-production environment.
- After any major schema migration incident: perform an extra restore drill.

## Restore drill checklist

1. Create a fresh non-production target.
2. Restore production data from a selected backup or recovery point.
3. Confirm critical tables exist and contain expected recent records.
4. Confirm auth-linked flows still map to application users correctly.
5. Confirm listing, payment, inquiry, and moderation data looks consistent.
6. Record the backup timestamp used, restore completion time, and result.
7. Record any manual steps that were required.

## Minimum validation after restore

- `profiles`
- `ads`
- `credit_transactions`
- `inquiries`
- `listing_reports`
- `email_deliveries`
- `email_jobs`
- `system_logs`
- `admin_audit_logs`

## Incident use

If production data is damaged:

1. Stop further destructive writes if possible.
2. Capture the incident timestamp.
3. Identify the last known good recovery point.
4. Restore into a non-production target first if time allows.
5. Validate critical tables and recent transactions.
6. Restore production only after the recovery point is confirmed.
7. Record what was lost between the bad write and the recovery point.

## Evidence to keep

For each monthly check or quarterly drill, keep:

- date
- operator
- environment checked
- retention window
- recovery point used
- restore duration
- validation result
- blockers or surprises

## Current repo-side status

This repo now contains the runbook.

Live production backup configuration still requires direct access to the Supabase production project and cannot be confirmed from code alone.
