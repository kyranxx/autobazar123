---
id: security-release-gate
title: Security Release Gate
description: Deterministic release checks that enforce security policy and critical tests.
tags:
  - security
  - release
  - ci
---

# Security Release Gate

Primary controls:

- `npm run test:security:policy`
- `npm run test:security:release-gate`
- `.github/workflows/release-security-gate.yml`

When touching API/auth/security/migrations, validate:

1. Required marker checks still pass.
2. Typecheck is clean.
3. Targeted security tests pass.

Related nodes:

- [[security/api-hardening]]
- [[agent/control-plane]]
