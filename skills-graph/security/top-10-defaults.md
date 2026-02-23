---
id: security-top-10-defaults
title: Security Top-10 Defaults
description: Practical top-10 baseline to run before release-facing changes and security reviews.
tags:
  - security
  - checklist
  - baseline
---

# Security Top-10 Defaults

Use this baseline for API/auth/payment/search changes:

1. Access control by default-deny.
2. Minimal and explicit configuration.
3. Dependency/supply-chain hygiene.
4. Vetted cryptography only.
5. Injection-safe input + query handling.
6. Threat-modeled design for critical flows.
7. Strong authentication/session controls.
8. Trusted integrity checks for privileged paths.
9. Actionable logging and alerting.
10. Safe exception handling without data leakage.

Enforcement commands:

- `npm run test:security:policy`
- `npm run test:security:release-gate`
- `npm run test:workflow-check`

Related nodes:

- [[security/release-gate]]
- [[security/api-hardening]]
