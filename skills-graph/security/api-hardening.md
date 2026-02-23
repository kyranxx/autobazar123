---
id: security-api-hardening
title: API Hardening Checklist
description: Route-level requirements for auth, validation, rate limiting, and secret handling.
tags:
  - security
  - api
---

# API Hardening Checklist

For sensitive routes, enforce:

- Auth gate (`supabase.auth.getUser()` or equivalent)
- Input validation (`zod` or strict runtime checks)
- Secret-bound triggers for cron/admin sync endpoints
- Rate limiting where abuse risk is non-trivial
- No internal identity/IP leakage in response headers

Related nodes:

- [[security/release-gate]]
