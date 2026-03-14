---
name: supabase-auth-rls
description: Use when modifying Supabase migrations, RLS, auth/session flow, RBAC, or any auth-sensitive data path. Prioritizes deny-by-default and server-side trust boundaries.
metadata:
  version: 1.0.0
---

# Supabase Auth and RLS

This workflow covers authentication, row-level security, and sensitive DB access paths.

## Trigger Conditions

Use when a request includes:
- changes under `supabase/migrations`, `supabase/policies`, `supabase/functions`
- auth/session endpoints in `src/app/api/*` with sensitive data
- listing ownership, admin/dealer separation, or protected resource reads/writes
- storage bucket policy changes affecting user or media access

## Workflow

1. read `AGENTS.md` and `docs/PROJECT_PLAYBOOK.md` first.
2. identify every data access path touched and map auth checks from UI to DB boundary.
3. verify server routes and actions enforce identity and role checks directly, not only UI visibility.
4. update RLS policies or functions in same pass as API logic changes when required.
5. validate secret handling for service-role use is explicit and minimal.
6. confirm fallback paths (if any) are logged and do not become silent privilege elevation.
7. if policy behavior changes, include targeted SQL/RLS checks.
8. complete with release-safe evidence in task review.

## Required Checks

- `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`
- `npm run test:db:rls` when DB/RLS behavior changed (and local Supabase is available)
- `npm run test:security:release-gate` for auth/security-adjacent changes

## References

- `docs/security-top-10-defaults.md`
- `AGENTS.md`
- `supabase` policy/migration files

