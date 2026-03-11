# Security Top-10 Defaults

This checklist is a practical baseline for release-facing changes and complements the enforced gates in this repository.

## Checklist

1. Access control:
   - Enforce auth/RBAC server-side for sensitive operations.
2. Misconfiguration:
   - Minimize defaults, disable unnecessary paths/features, avoid verbose production errors.
3. Supply chain:
   - Keep dependencies current and verify security posture before release.
   - Prefer GitHub Actions OIDC over long-lived deployment/webhook secrets.
4. Cryptography:
   - Use vetted libraries/algorithms; never implement custom crypto primitives.
5. Injection:
   - Validate/sanitize all inputs and use safe database/query patterns.
6. Insecure design:
   - Threat-model critical flows before implementation.
7. Auth/session:
   - Enforce strong auth controls and safe token/session handling.
8. Integrity:
   - Verify trusted update/sync paths and protect privileged automation endpoints.
9. Logging/monitoring:
   - Emit and review actionable security/auth logs.
10. Error handling:
   - Fail closed where possible and avoid leaking internal/security-sensitive details.

## Enforced Commands

- `npm run check:framework-patch-posture`
- `npm run check:github-actions-oidc-posture`
- `npm run check:prod-rate-limit-env`
- `npm run test:security:release-gate`
- `npm run test:workflow-check`

Use this checklist as a pre-implementation and pre-merge sanity pass; the commands above remain the objective gate.

## Alert Notes

- If `npm run check:prod-rate-limit-env` fails for a production-target release, treat it as release-blocking.
- If `npm run check:framework-patch-posture` fails, treat it as release-blocking for framework patch hygiene.
- If `npm run check:github-actions-oidc-posture` fails, treat it as release-blocking for CI auth hardening.
- Missing `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` can cause fail-closed proxy/auth rate limiting and widespread `429` responses.
