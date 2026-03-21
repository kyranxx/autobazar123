# Service Remediation 2026-03-21

- [ ] Add production env guard for missing email/search/payment-critical secrets
- [ ] Make postdeploy smoke fail on degraded health instead of reachability-only
- [ ] Fix GitHub quality-gate webhook auth compatibility and admin repo resolution
- [ ] Add monitoring posts for release and fast GitHub workflows
- [ ] Reconcile Algolia production sync/settings path and deploy-time enforcement
- [ ] Restore missing production env vars for email and Algolia sync
- [ ] Restore local Stripe secret for payment testing
- [ ] Reconcile local Cloudflare token with the working production token
- [ ] Reduce dependency vulnerability count with safe package updates
