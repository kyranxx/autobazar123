# supabase: Agent Rules

## Scope
Applies to `supabase/` and nested directories.

## Migration Safety
- Prefer creating a new migration file rather than rewriting an existing applied migration.
- Make schema/data changes explicit and reviewable.
- For destructive steps, document rollback or mitigation in the handoff.

## Implementation Notes
- Keep migrations focused on one concern when possible.
- Use clear names and comments when behavior is non-obvious.
- Avoid embedding secrets in SQL or scripts.

## Validation
- Validate migration logic with the project verification flow when relevant.
- Note any assumptions about existing schema state.
