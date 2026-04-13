# Autobazar123 Project Status

Last updated: 2026-04-07

## Main goal

Get the site stable enough to open safely, then start getting real car ads.

## Current live state

- Site is online, but still behind maintenance mode.
- Last known production deployment on `master` is live.
- Preview deployments build again and health-check again.
- Latest successful preview:
  - `https://autobazar123-5ylvdexi4-daniels-projects-98c0558b.vercel.app`
- Preview env now includes the previously missing email / Algolia / Stripe / app URL / service-role secrets.
- Dealers will be contacted only after the site is public.
- Dealer plan for launch: offer free ad uploads at the start.

## What looks good

- Local quick checks passed.
- Security release gate passed.
- Launch checklist now exists in `docs/launch-checklist.md`.
- Core systems exist in code:
  - sign up / login
  - listings
  - payments
  - search
  - admin
  - analytics
- Car brands/models system exists.

## Main problems right now

1. Deployment env problems
- Root cause found and fixed:
  - some API routes were crashing during build when preview secrets were missing
  - proxy startup requirements were stricter than needed for preview build
  - one preview env sync pass uploaded some secret values incorrectly; resynced with proper `.env` parsing
- Verified result:
  - preview deployment now reaches `Ready`
  - build no longer dies during compile / route collection for those missing-secret cases
  - preview `/api/health` is back to `healthy`

2. Search/results fragility
- The results page is still one of the most fragile parts of the app.

3. Low real business traction
- Very small real dataset.
- No dealers in this environment yet.
- Almost no proven buyer/seller activity yet.

4. Data source uncertainty
- JATO exists in code, but may be too expensive.
- We still need a realistic cheaper plan for brands/models and inventory growth.
- Right now there is no confirmed real source for brands/models or dealer inventory.

## Real data snapshot from this environment

- Ads: 192
- Active ads: 185
- Sold ads: 6
- Brands: 20
- Models: 207
- Profiles: 9
- Dealers: 0
- Inquiries: 3
- Checkout sessions: 0
- Imported ads: 25

## Biggest risks

- We make changes and new problems appear.
- Deployments are not predictable enough yet.
- We still do not have a strong ad supply plan.
- The project feels too complex to track in your head.

## Confirmed priority order

1. Stability and safety
2. Public launch
3. Dealer outreach and free ad uploads
4. Nice extra improvements

## Next 3 important tasks

1. Use the launch checklist and mark which items are already done or still failing.
2. Choose a cheaper brands/models plan than JATO, if possible.

## Fast mode rules

1. Normal work happens on preview first.
2. Production is for a short final check, not for experimenting.
3. Small visual or text changes can be checked fast.
4. Backend, auth, payment, search, and env changes need preview first, then a short production check.
5. After every important change, keep the result written here so chat memory does not matter.

## Simple working rule

At the start of future sessions, the agent must do this automatically:

1. Read this file first.
2. Answer in this format:
- Goal
- Status
- Next
- Need from you

Do not rely on old chat memory.

## Open questions

- What is the cheapest acceptable source for brands/models?
- After launch, which dealers do we contact first?
- When do we remove maintenance mode?
