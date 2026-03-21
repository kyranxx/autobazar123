# Analytics Metric Dictionary

This document is step 2 of the company sale readiness plan.

Its purpose is to define the key business metrics in one place so the whole team uses the same meanings.

Without this, a company can have dashboards but still not have trustworthy numbers.

## Status

- Step 2 completed: core metrics defined here
- Step 3 now exists in [Analytics Event Spec](./analytics-event-spec.md)
- Next recommended step: start storing monthly snapshots

## How To Use This Document

Each metric should have:

- one name
- one clear definition
- one calculation rule
- one simple use case

If a metric changes, update this file before changing dashboards or board reports.

## General Rules

- Use one definition per metric.
- Do not create slightly different versions in different dashboards.
- If finance and product disagree, write down which system is the source of truth.
- Prefer simple definitions that the team can explain out loud.
- Do not count vanity metrics as core success metrics.

## Source Of Truth Rules

- Product behavior metrics: product analytics and backend records
- Revenue metrics: finance or billing source of truth
- Sale confirmation metrics: backend outcome records with clear business rules
- Dealer retention metrics: dealer domain records plus billing status where relevant

## Core Metrics

### Traffic By Channel

Definition:
The number of visits grouped by source such as SEO, direct, paid, social, referral, or partner.

Calculation:
Count sessions in a period, grouped by channel.

Use case:
Shows where growth comes from and whether the company depends too much on one source.

Notes:
This is useful, but it is not enough on its own.

### Searchers

Definition:
The number of unique users or sessions that perform at least one search in a period.

Calculation:
Count distinct search-capable users or sessions with at least one valid search event.

Use case:
Better than raw traffic because it measures buyer intent.

### Search-To-Listing-View Rate

Definition:
The percentage of searchers who click into at least one listing.

Calculation:
`listing viewers after search / searchers`

Use case:
Shows whether search results are relevant and attractive.

### Listing-View-To-Lead Rate

Definition:
The percentage of listing viewers who create at least one lead.

Calculation:
`lead creators / listing viewers`

Use case:
Shows whether listing pages are convincing and whether buyer intent is turning into action.

### Qualified Lead Rate

Definition:
The percentage of raw leads that meet the quality standard.

Calculation:
`qualified leads / all leads`

Use case:
Separates real business value from spam or low-quality interest.

Notes:
The team should define exactly what makes a lead qualified. That definition should remain stable.

### Lead-To-Sale Rate

Definition:
The percentage of leads that become confirmed sales.

Calculation:
`sale-confirmed leads / all leads`

Use case:
One of the strongest marketplace proof metrics.

Notes:
This is especially important in cars because many transactions close offline.

### Sale-Confirmed Rate

Definition:
The percentage of listings or leads that end in a confirmed real sale, depending on the chosen denominator.

Calculation:
Choose one official version and stick to it:

- `sale-confirmed listings / published listings`
- or `sale-confirmed leads / leads`

Use case:
Shows whether the marketplace creates real outcomes, not just activity.

Notes:
The team should choose one primary version and name it clearly.

### Time To First Lead

Definition:
The time between listing publication and the first lead.

Calculation:
For each listing, subtract listing publish time from first lead time. Report median by default.

Use case:
A fast and simple liquidity signal.

### Days To Sale

Definition:
The time between listing publication and confirmed sale.

Calculation:
For each sold listing, subtract publish date from sale confirmation date. Report median by default.

Use case:
Shows how efficiently the marketplace helps inventory move.

### Stale Inventory Rate

Definition:
The percentage of live listings older than the accepted healthy threshold without enough progress.

Calculation:
`stale live listings / all live listings`

Use case:
Shows weak liquidity or low-quality supply.

Notes:
The stale threshold should be chosen by business reality, not by guesswork.

### Lead Response Time

Definition:
The time between a lead being created and the first seller or dealer response.

Calculation:
For each lead with a response, subtract lead timestamp from first response timestamp. Report median.

Use case:
Shows seller and dealer responsiveness and buyer experience quality.

### New Seller Activation Rate

Definition:
The percentage of new seller accounts that reach first live listing.

Calculation:
`new sellers with first live listing / new seller accounts`

Use case:
Shows whether seller onboarding works.

### Dealer Activation Rate

Definition:
The percentage of new dealers that go live with inventory and receive at least one lead.

Calculation:
`new dealers that publish inventory and receive first lead / new dealers`

Use case:
Shows whether the dealer actually reached first value.

### Repeat Seller Rate

Definition:
The percentage of sellers who come back and list again within a chosen period.

Calculation:
`sellers with another listing in period / eligible sellers from earlier period`

Use case:
Useful for private seller retention.

### Dealer Logo Retention

Definition:
The percentage of dealers that remain active in a later period, counted by dealer account.

Calculation:
`retained active dealers / dealer cohort at start`

Use case:
Shows whether dealers stay on the platform.

### Dealer Revenue Retention

Definition:
Revenue retained from the same dealer cohort over time, including upgrades, downgrades, and churn.

Calculation:
`current-period revenue from same dealer cohort / starting-period revenue from that cohort`

Use case:
Stronger than simple dealer count because it measures commercial depth.

### Paying Dealers

Definition:
The number of dealers with recognized paid subscription or paid product revenue in the period.

Calculation:
Count distinct dealers with accepted paid status in the period.

Use case:
Shows the monetized base of the marketplace.

Notes:
Finance and billing rules matter here. Keep them consistent.

### Average Revenue Per Dealer

Definition:
Average revenue generated per active paying dealer in a period.

Calculation:
`dealer revenue / active paying dealers`

Use case:
Shows monetization quality and whether accounts are deepening.

### Paid Placement Attach Rate

Definition:
The percentage of eligible listings or dealers that buy a premium placement product.

Calculation:
Choose one official version and keep it stable:

- `premium listings / eligible listings`
- or `dealers buying premium placements / eligible dealers`

Use case:
Shows whether premium products create enough value for customers to pay.

### Subscription Renewal Rate

Definition:
The percentage of renewable subscriptions that renew successfully.

Calculation:
`renewed subscriptions / renewable subscriptions`

Use case:
A practical health signal for monetization and customer value.

### Refund Rate

Definition:
The percentage of transactions or customers that result in refunds.

Calculation:
Use one official denominator:

- `refunded transactions / all transactions`
- or `customers refunded / paying customers`

Use case:
Helps detect product dissatisfaction, billing problems, or poor sales quality.

### Fraud / Duplicate / Moderation Removal Rate

Definition:
The percentage of listings or users removed or flagged because of fraud, duplication, or policy violations.

Calculation:
`flagged or removed objects / total reviewed or published objects`

Use case:
Shows marketplace trust and content quality.

## Entity State Metrics

These are simple state definitions the team should keep stable.

### Active Buyer

Definition:
A user who searched, viewed a listing, or created a lead in the last 30 days.

Use case:
Represents real demand-side activity better than visits alone.

### Active Private Seller

Definition:
A seller with at least one live listing in the last 30 days.

Use case:
Shows active private supply.

### Active Dealer

Definition:
A dealer with at least one live listing or active paid product in the last 30 days.

Use case:
Useful for both marketplace and monetization reporting.

### Activated Seller

Definition:
A seller who reaches first live listing.

Use case:
A cleaner activation event than simple signup.

### Activated Dealer

Definition:
A dealer that reaches live inventory and first lead.

Use case:
A better business milestone than just account creation.

### Healthy Listing

Definition:
A live, approved, complete, non-duplicate, fresh listing that is realistically sellable.

Use case:
Helps avoid treating all listings as equal when some are dead or low quality.

### Stale Listing

Definition:
A listing older than the accepted threshold without enough engagement or sale progress.

Use case:
Used in stale inventory reporting and marketplace quality reviews.

### Qualified Lead

Definition:
A lead that meets the official quality rule.

Use case:
Helps the team focus on valuable buyer intent instead of raw inquiry count.

### Sale Confirmed

Definition:
A listing or lead with enough evidence that a real sale happened.

Use case:
Provides the strongest outcome signal for marketplace value.

## Important Measurement Choices

These choices should be decided once and then kept stable.

### What Counts As A Lead

The team should decide whether these are all leads or separate intent signals:

- contact form submission
- chat start
- phone reveal
- call click

Recommendation:
Choose one primary lead rule and keep secondary signals separate if they are noisier.

### What Counts As Sale Confirmed

Possible rules:

- seller explicitly marks sold
- dealer CRM confirms sale
- follow-up workflow confirms outcome
- payment or delivery event confirms outcome

Recommendation:
Use the strongest trustworthy rule available, even if the number is smaller.

### What Counts As Active Dealer

Possible rules:

- any dealer with live inventory
- any dealer with paid subscription
- any dealer with leads in period

Recommendation:
Use one official definition for reporting and do not switch back and forth casually.

## Metrics To Treat Carefully

These metrics can be useful, but they are easy to misuse:

- pageviews
- app opens
- impressions
- raw listing count
- raw lead count

Why:
They can look strong even when liquidity, quality, retention, or monetization are weak.

## Practical Summary

If Autobazar123 keeps this metric dictionary stable, later reporting becomes much easier.

The company will be able to answer better questions, such as:

- Which traffic channels produce the best qualified leads?
- Which cities have the strongest liquidity?
- Which dealers retain and expand best?
- Do premium placements increase real sales outcomes?
- Is supply quality improving or just quantity?

That is exactly the kind of clarity buyers and investors like.
