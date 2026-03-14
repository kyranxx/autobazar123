---
name: release-gate-remediation
description: Use for Vercel/build failures, release-security gate failures, CI breakages tied to deployment posture, or when post-change deploy checks are needed.
metadata:
  version: 1.0.0
---

# Release Gate Remediation

Use this flow for build/release failures and deployment hardening tasks.

## Trigger Conditions

Use when a request includes:
- Vercel deploy failures
- failed security/quality release gates
- environment/config problems in production-like deploys
- release or rollout validation tasks
- dependency/security posture regressions

## Workflow

1. read `AGENTS.md` and `docs/PROJECT_PLAYBOOK.md` first.
2. locate the latest failing signal source (CI log, Vercel log, gate output).
3. identify whether failure is:
   - build-time
   - runtime deploy env
   - required check posture
4. fix the minimal root cause in code or env wiring.
5. rerun the minimal reproducer command for that gate before moving on.
6. when the gate set is security/publish critical, include:
   - `npm run check:framework-patch-posture`
   - `npm run check:github-actions-oidc-posture`
   - `npm run check:prod-rate-limit-env` when env target is production
   - `npm run test:security:release-gate`
7. verify preview/production deployment status explicitly after gate fixes.
8. capture evidence in task review section before declaring complete.

## References

- `docs/PROJECT_PLAYBOOK.md`
- `docs/security-top-10-defaults.md`
- `package.json`
- Vercel deployment logs and CI run details

## Non-Negotiables

- do not skip release checks to preserve speed
- do not hand-wave a warning as a success path
- treat failed required gates as incomplete until resolved

