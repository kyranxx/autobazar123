# cloudflare-worker: Agent Rules

## Scope
Applies to `cloudflare-worker/` and nested directories.

## Deployment and Safety
- Treat deploy-related changes as high impact.
- Do not print token values or secret material.
- Reference env-var names only when confirming configuration.

## Implementation Notes
- Keep worker behavior changes small and explicit.
- Call out routing/auth/cache implications in the handoff.
- If deployment steps are proposed, list exact commands and expected outcomes.

## Validation
- Run the most relevant local checks available before suggesting deploy.
- Document what was tested locally versus what still needs staging/production validation.
