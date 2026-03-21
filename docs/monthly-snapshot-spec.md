# Monthly Snapshot Spec

This document is step 4 of the company sale readiness plan.

Its purpose is to define what should be saved every month so Autobazar123 keeps a reliable historical record of company performance.

In simple words:

- dashboards show what is true now
- monthly snapshots preserve what was true then

That matters because buyers, investors, and founders usually care about trends, not just today's numbers.

## Status

- Step 4 completed: monthly snapshot rules defined here
- Step 5 now exists in [Monthly Founder / Board Pack](./monthly-founder-board-pack.md)
- Next recommended step: set up clean IP, account ownership, and legal records

## Why Monthly Snapshots Matter

A live dashboard changes all the time.

That is useful for operations, but not enough for history.

Monthly snapshots matter because they let the company answer questions like:

- What did dealer retention look like 9 months ago?
- Was Bratislava liquidity getting better before the pricing change?
- Did qualified lead quality improve after listing improvements?
- How much revenue came from the top 10 dealers last December?

Without snapshots, teams often lose the exact state of the business over time.

## The Rule

At the end of every month, save a fixed snapshot of the business.

That snapshot should be:

- timestamped
- reproducible
- easy to compare to previous months
- protected from later accidental edits

## What To Save Every Month

These are the main snapshot sections.

### 1. Traffic Snapshot

Save:

- total sessions
- traffic by channel
- searchers
- top landing pages
- top city pages
- top model pages

Why:
Shows growth quality and dependence on channels or pages.

### 2. Buyer Funnel Snapshot

Save:

- searchers
- listing viewers
- lead creators
- qualified leads
- confirmed sales

Why:
Shows whether buyer demand is becoming more productive.

### 3. Seller Funnel Snapshot

Save:

- new seller accounts
- sellers who started listing drafts
- sellers who submitted listings
- sellers with approved listings
- sellers with published listings
- sellers receiving first lead
- sellers with sold listings

Why:
Shows whether seller onboarding and supply conversion are healthy.

### 4. Dealer Snapshot

Save:

- total active dealers
- new dealers
- activated dealers
- paying dealers
- dealer logo retention
- dealer revenue retention
- average revenue per dealer
- top dealers by revenue

Why:
Dealer quality is one of the most important commercial signals in this business.

### 5. Inventory Snapshot

Save:

- total live listings
- new listings published
- listings by city
- listings by brand
- listings by seller type
- premium listings
- stale inventory count
- stale inventory rate

Why:
Shows supply quality, coverage, and liquidity risk.

### 6. Lead And Outcome Snapshot

Save:

- raw leads
- qualified leads
- lead quality rate
- time to first lead
- days to sale
- lead-to-sale rate
- sale-confirmed rate

Why:
This is where marketplace usefulness becomes visible.

### 7. Revenue Snapshot

Save:

- subscription revenue
- premium placement revenue
- one-time revenue
- refunds
- discounts
- recognized revenue
- monthly recurring revenue if relevant

Why:
Shows how real and repeatable monetization is.

### 8. Risk Snapshot

Save:

- top 10 dealer revenue share
- top traffic channel share
- top region share
- refund rate
- fraud rate
- duplicate rate
- moderation removal rate

Why:
A growing business with hidden concentration or trust problems is still risky.

### 9. Cash Snapshot

Save:

- ending cash
- monthly burn
- runway estimate
- receivables
- overdue invoices

Why:
Founders and buyers both care about survival and financial discipline.

## Suggested Snapshot File Structure

The exact implementation can change, but the structure should stay consistent.

Recommended pattern:

- one folder per year
- one file per month
- same layout every month

Example:

```text
snapshots/
  2026/
    2026-01-monthly-snapshot.md
    2026-02-monthly-snapshot.md
    2026-03-monthly-snapshot.md
```

You can also keep structured exports such as CSV or JSON alongside the readable summary.

## Recommended Snapshot Fields

Every monthly snapshot should include:

- snapshot month
- created date
- owner
- metric definitions version
- notes on known issues
- links to source dashboards or exports

Why:
This helps future readers trust the snapshot and understand context.

## What A Snapshot Should Look Like

A simple monthly snapshot should include:

- headline metrics
- funnel metrics
- retention metrics
- revenue metrics
- risk metrics
- short notes

The important thing is consistency, not beauty.

## Good Habits

### Use One Monthly Cutoff Rule

Pick one rule for when the month closes.

Example:
Use calendar month in Europe/Bratislava time and freeze the snapshot after close.

Why:
Different cutoff rules create confusion later.

### Keep The Same Definitions

If a metric definition changes, record the change clearly.

Why:
Otherwise trend charts become misleading.

### Add Short Notes

Each snapshot should include short notes such as:

- pricing changed this month
- dealer campaign launched this month
- sale confirmation logic changed this month
- tracking issue affected part of the data

Why:
Numbers without context are easy to misread later.

### Prefer Stable Tables

Keep the same table layout every month.

Why:
This makes comparisons much easier.

## What Not To Do

Avoid these mistakes:

- relying only on live dashboards
- changing definitions without notes
- saving screenshots instead of structured numbers
- skipping bad months
- mixing finance and analytics numbers without explanation
- saving snapshots in random places

## Practical Use Cases

### Use Case 1: Founder Review

You compare March to February and immediately see:

- more listings
- slower time to first lead
- worse qualified lead rate

This tells you growth is becoming less efficient.

### Use Case 2: Investor Meeting

You want to show that dealer retention improved for the last 6 months.

Snapshots give you fixed historical proof instead of rebuilding numbers under pressure.

### Use Case 3: Buyer Diligence

The buyer asks:
"Please show monthly dealer revenue retention and top dealer concentration for the last 18 months."

With snapshots, this is easy.

Without snapshots, it becomes a painful reconstruction project.

## How This Connects To The Other Docs

- the foundation spec defines the important objects
- the metric dictionary defines the meanings
- the event spec defines what actions must be tracked
- this snapshot spec defines what monthly history must be preserved

Together, these documents create a usable measurement system.

## Practical Summary

Monthly snapshots are not just reporting homework.

They are memory for the company.

They help Autobazar123:

- spot trends
- explain decisions
- survive diligence
- prove progress over time

That is why this step matters.
