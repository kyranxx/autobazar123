# Tasks

- [x] Restore global production maintenance mode
- [x] Add hostname-specific maintenance bypass for `autobazar123.vercel.app`
- [x] Deploy and verify only the Vercel alias stays open

## Blockers

## Active

- [x] Create a safety branch and backup before source-control cleanup
- [x] Ignore `.tmp/` and `test-results/` local artifacts
- [x] Commit the real app/docs/db changes on a cleanup branch
- [x] Run baseline `npx tsc --noEmit` verification after cleanup
- [ ] Execute service remediation checklist in `tasks/service-remediation-2026-03-21.md`
- [x] Add first real founder dashboard section in admin overview
- [x] Add simple founder dashboard template doc for monthly review
- [x] Audit external service setup and health for GitHub, Stripe, Vercel, Cloudflare, Algolia, Resend, and Supabase
- [x] Map which services can be inspected directly from this machine versus which require additional authenticated access
- [x] Review project integration posture for security, correctness, performance, and operational gaps
- [x] Add company sale readiness blueprint and glossary doc in `docs/`
- [x] Add analytics foundation spec for company sale readiness step 1
- [x] Add metric dictionary for company sale readiness step 2
- [x] Add plain-language founder handbook for running and selling the company
- [x] Add analytics event spec for company sale readiness step 3
- [x] Add monthly snapshot spec for company sale readiness step 4
- [x] Add monthly founder board pack template for company sale readiness step 5
- [x] Add legal IP and account ownership hygiene doc for company sale readiness step 6
- [x] Add finance and monthly close discipline doc for company sale readiness step 7
- [x] Add diligence room structure doc for company sale readiness step 8
- [x] Add company sale readiness master checklist
- [x] Implement first missing sale-readiness analytics events in code
- [x] Implement real lead qualification state and lead_qualified analytics event
- [x] Implement real sale confirmation workflow and sale_confirmed analytics event
- [x] Rebalance founder docs around Autobazar123 ads-marketplace business model
- [x] Add bare `nrd-status` / `nrd-stop` / `nrd-restart` Git Bash commands
- [x] Add shorter `nrd:*` aliases for local dev server controls
- [x] Add quick local dev stop/restart commands that do not require PID lookup
- [x] Clear orphaned `next dev` lock and restore local dev startup
- [x] Fix `/vysledky` back-navigation regression where results content disappears after opening an ad and returning
- [x] Run homepage CRO and analytics pass checklist from `tasks/homepage-frontpage-analytics-pass.md` and finish external PostHog env activation
- [x] Restore homepage category carousel, move brand/model dropdowns below brand buttons, and improve CTA/gallery mobile interactions
- [x] Fix homepage popular brand logos for taxonomy-driven brands
- [x] Make database taxonomy the source of truth for brands and models
- [x] Fix mobile vehicle-type carousel alignment so it stays inside the left edge of the bento tile
- [x] Vertically center the mobile carousel arrows
- [x] Normalize small brand logo sizing while preserving the larger Kia treatment
- [x] Prevent mobile browser zoom on brand filter dropdown focus
- [x] Fix carousel arrow overlay so both mobile arrows stay on the row centerline and correct side
- [x] Tune homepage search card spacing and controls after mobile visual review
- [x] Tighten homepage hero spacing and simplify the frontpage canvas
- [x] Make the homepage search input mint border clearly visible
- [x] Soften the homepage search placeholder hint
- [x] Force the homepage top search input to render a visibly mint border
- [x] Tighten the homepage top header and retint the top-banner pills
- [x] Fix mobile filter dropdown dismissal and add real icons to the filter fields
- [x] Make filter labels black and change price icons to euro
- [x] Make the remaining bento tile labels black
