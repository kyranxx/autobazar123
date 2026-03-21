# Analytics Event Spec

This document is step 3 of the company sale readiness plan.

Its purpose is to turn the business objects and metric definitions into an implementation checklist for product analytics.

In simple words:

- step 1 said what objects exist
- step 2 said what the numbers mean
- step 3 says what actions we must track in the app

## Status

- Step 3 completed: analytics event spec defined here
- Step 4 now exists in [Monthly Snapshot Spec](./monthly-snapshot-spec.md)
- Next recommended step: build the monthly founder / board pack

## How To Use This Document

For each event, this document answers:

- what the event means
- when it should fire
- what properties it should include
- which KPI it supports
- whether it already exists in the typed analytics contract

This document should be used together with:

- [Analytics Foundation Spec](./analytics-foundation-spec.md)
- [Analytics Metric Dictionary](./analytics-metric-dictionary.md)
- [Analytics Governance](./analytics-governance.md)

## Core Rules

- event names must stay in `snake_case`
- use business objects from the foundation spec
- keep payloads small and intentional
- do not put raw PII into analytics events
- every important event should support a real business question

## Current Contract Alignment

The repo already has a typed analytics contract in:

- `src/lib/analytics/events.ts`
- `src/lib/analytics/events.test.ts`

Events already present there:

- `search_query_submitted`
- `homepage_cta_clicked`
- `listing_viewed`
- `seller_contact_started`
- `listing_created`
- `payment_credit_checkout_started`
- `payment_credit_checkout_completed`

This spec keeps those events and extends the roadmap around them.

## Standard Properties

These are the most useful reusable properties.

Add only what is relevant to a specific event.

- `user_id`
- `seller_id`
- `dealer_id`
- `listing_id`
- `lead_id`
- `conversation_id`
- `subscription_id`
- `session_id`
- `traffic_channel`
- `locale`
- `city`
- `region`
- `brand`
- `model`
- `seller_type`
- `device_type`
- `premium_flag`

Important:
In current code some payloads use `adId`. That is the current implementation field. The business concept behind it is `listing_id`.

## Event Groups

### 1. Acquisition And Entry Events

These help explain where users come from and whether they start meaningful journeys.

#### `homepage_cta_clicked`

Definition:
User clicks a major CTA on the homepage.

Trigger:
Fire on successful click of a tracked homepage CTA.

Core properties:

- `cta`
- `surface`
- `destination`
- `locale`

Feeds KPIs:

- homepage conversion flow
- traffic-to-signup intent

Status:
Already in current contract.

#### `search_query_submitted`

Definition:
User submits a real vehicle search query.

Trigger:
Fire when a search is executed and results are requested.

Core properties:

- `query`
- `filters_count`
- `result_count`
- `locale`

Feeds KPIs:

- searchers
- search-to-listing-view rate

Status:
Already in current contract, though current payload uses `filtersCount` and `resultCount`.

### 2. Listing Discovery Events

These show whether buyers find interesting inventory.

#### `listing_viewed`

Definition:
User opens a listing detail page.

Trigger:
Fire when the listing detail view is successfully rendered.

Core properties:

- `listing_id`
- `source`
- `position`
- `premium_flag`
- `seller_type`

Feeds KPIs:

- listing engagement
- search-to-listing-view rate
- listing-view-to-lead rate

Status:
Already in current contract, currently implemented with `adId`.

### 3. Demand Creation Events

These are some of the most important events in the whole system.

#### `seller_contact_started`

Definition:
Buyer starts contact with the seller or dealer.

Trigger:
Fire when a contact action begins through a supported channel.

Core properties:

- `listing_id`
- `channel`
- `is_dealer`

Feeds KPIs:

- listing-view-to-lead rate
- lead mix by channel

Status:
Already in current contract, currently implemented with `adId`.

Notes:
This event is useful, but step 2 still requires one official decision on what counts as a primary lead.

#### `lead_submitted`

Definition:
A lead record is successfully created.

Trigger:
Fire only after the system creates a real lead object.

Core properties:

- `lead_id`
- `listing_id`
- `seller_id`
- `dealer_id`
- `channel`
- `traffic_channel`

Feeds KPIs:

- raw leads
- listing-view-to-lead rate
- lead quality review

Status:
Implemented in the current inquiry success flow.

Why it matters:
This is cleaner than inferring all leads from frontend intent events alone.

#### `lead_qualified`

Definition:
A lead is marked as qualified under the official business rule.

Trigger:
Fire when qualification is determined by system logic or trusted workflow.

Core properties:

- `lead_id`
- `listing_id`
- `qualification_method`
- `seller_type`

Feeds KPIs:

- qualified lead rate
- channel quality
- dealer value reporting

Status:
Implemented in the seller dashboard qualification flow.

### 4. Supply Creation Events

These events explain how sellers and dealers become useful supply.

#### `listing_created`

Definition:
A seller creates a new listing record.

Trigger:
Fire when a listing record is created successfully.

Core properties:

- `listing_id`
- `is_dealer`
- `photos_count`

Feeds KPIs:

- seller activation flow
- inventory creation

Status:
Already in current contract, currently implemented with `adId`.

#### `listing_submitted`

Definition:
A listing is submitted for review or publish workflow.

Trigger:
Fire when the seller finishes submission.

Core properties:

- `listing_id`
- `seller_id`
- `dealer_id`
- `has_required_fields`

Feeds KPIs:

- listing funnel
- moderation workflow

Status:
Implemented in the current publish flow for non-auto-published listings and re-submit flow.

#### `listing_approved`

Definition:
A listing passes moderation and becomes approved.

Trigger:
Fire when the approval decision is stored.

Core properties:

- `listing_id`
- `approval_method`
- `seller_type`

Feeds KPIs:

- moderation efficiency
- publish funnel

Status:
Implemented in the admin moderation approval action.

#### `listing_published`

Definition:
A listing becomes live and visible to buyers.

Trigger:
Fire when the listing goes live.

Core properties:

- `listing_id`
- `seller_id`
- `dealer_id`
- `city`
- `region`
- `brand`
- `model`
- `premium_flag`

Feeds KPIs:

- live inventory
- time to first lead
- days to sale
- stale inventory rate

Status:
Implemented in the auto-publish create and re-submit flows.

#### `listing_marked_sold`

Definition:
Seller or dealer marks the listing as sold.

Trigger:
Fire when sold state is saved.

Core properties:

- `listing_id`
- `seller_id`
- `dealer_id`
- `marked_by`

Feeds KPIs:

- sale tracking
- time to sale

Status:
Implemented in the dedicated seller mark-sold confirmation flow.

#### `sale_confirmed`

Definition:
The system records a confirmed real sale under the official rule.

Trigger:
Fire only when the sale meets the chosen confidence rule.

Core properties:

- `listing_id`
- `lead_id`
- `confirmation_method`
- `seller_type`

Feeds KPIs:

- sale-confirmed rate
- lead-to-sale rate
- city liquidity quality

Status:
Implemented in the dedicated seller mark-sold confirmation flow.

### 5. Dealer And Revenue Events

These events connect the marketplace to monetization.

#### `payment_credit_checkout_started`

Definition:
Buyer starts a credits checkout flow.

Trigger:
Fire when checkout begins successfully.

Core properties:

- `package_id`
- `credits`
- `value_eur`

Feeds KPIs:

- payment funnel
- monetization intent

Status:
Already in current contract.

#### `payment_credit_checkout_completed`

Definition:
Credits checkout completes successfully.

Trigger:
Fire after trusted payment completion.

Core properties:

- `package_id`
- `credits`
- `value_eur`
- `payment_provider`

Feeds KPIs:

- monetization
- conversion to paid

Status:
Already in current contract.

#### `subscription_started`

Definition:
A recurring subscription starts.

Trigger:
Fire when a real subscription record becomes active.

Core properties:

- `subscription_id`
- `dealer_id`
- `plan`
- `value_eur`

Feeds KPIs:

- paying dealers
- subscription growth

Status:
Not implemented because the current product uses credits, not recurring subscriptions.

#### `subscription_renewed`

Definition:
A renewable subscription successfully renews.

Trigger:
Fire after successful renewal.

Core properties:

- `subscription_id`
- `dealer_id`
- `plan`
- `value_eur`

Feeds KPIs:

- renewal rate
- dealer revenue retention

Status:
Not implemented because the current product uses credits, not recurring subscriptions.

#### `subscription_cancelled`

Definition:
A subscription is cancelled or moved into a non-renewing state.

Trigger:
Fire when cancellation is recorded.

Core properties:

- `subscription_id`
- `dealer_id`
- `plan`
- `reason`

Feeds KPIs:

- churn
- monetization risk

Status:
Not implemented because the current product uses credits, not recurring subscriptions.

#### `listing_feature_purchased`

Definition:
A listing or dealer buys a premium placement or feature.

Trigger:
Fire when purchase succeeds.

Core properties:

- `listing_id`
- `dealer_id`
- `feature_type`
- `value_eur`

Feeds KPIs:

- attach rate
- premium monetization

Status:
Implemented in the single boost and dealer bulk top/highlight flows.

#### `refund_completed`

Definition:
A refund is completed.

Trigger:
Fire after refund succeeds in the trusted billing system.

Core properties:

- `subscription_id`
- `invoice_id`
- `refund_type`
- `value_eur`

Feeds KPIs:

- refund rate
- revenue quality

Status:
Not implemented because there is no trusted refund-completion product flow yet.

### 6. Trust And Safety Events

These support quality and buyer confidence.

#### `listing_removed_by_moderation`

Definition:
A listing is removed because of policy, fraud, or quality reasons.

Trigger:
Fire when removal is saved.

Core properties:

- `listing_id`
- `seller_id`
- `dealer_id`
- `removal_reason`

Feeds KPIs:

- moderation removal rate
- fraud quality

Status:
Implemented in the admin moderation rejection action.

#### `duplicate_detected`

Definition:
The system identifies a listing as duplicate inventory.

Trigger:
Fire when a duplicate decision is stored.

Core properties:

- `listing_id`
- `duplicate_group_id`
- `seller_type`

Feeds KPIs:

- duplicate rate
- inventory quality

Status:
Recommended next implementation.

#### `fraud_flagged`

Definition:
An account or listing is flagged for suspected fraud.

Trigger:
Fire when a trusted fraud rule or review flags the object.

Core properties:

- `listing_id`
- `seller_id`
- `dealer_id`
- `fraud_reason`

Feeds KPIs:

- fraud rate
- trust health

Status:
Recommended next implementation.

## Event Priority

If implementation capacity is limited, build in this order:

1. `listing_published`
2. `lead_submitted`
3. `lead_qualified`
4. `sale_confirmed`
5. `subscription_started`
6. `subscription_renewed`
7. `listing_feature_purchased`
8. `listing_removed_by_moderation`

Why this order:

- first prove supply exists
- then prove demand exists
- then prove quality exists
- then prove monetization exists
- then prove trust exists

## Mapping To Business Questions

These are the kinds of questions this event spec should make easy to answer.

- Which channels produce the best qualified leads?
- Which cities have strong liquidity?
- Do premium listings generate faster first leads?
- Which dealers retain and expand best?
- What share of listings become confirmed sales?
- Are moderation and fraud problems rising or falling?

If an event does not help answer an important question, it probably should not exist.

## Implementation Notes For The Repo

- keep the typed contract in `src/lib/analytics/events.ts` as the source of truth
- add matching tests in `src/lib/analytics/events.test.ts`
- keep `docs/analytics-governance.md` updated when taxonomy changes
- prefer backend-confirmed events for money, lead creation, and sale confirmation
- do not rely only on frontend click events for business-critical metrics

## Practical Summary

This document is the bridge between strategy and implementation.

It tells the team what to track so Autobazar123 can later prove:

- buyers really search
- listings really get leads
- leads have quality
- cars really get sold
- dealers really pay and renew
- trust and moderation are under control

That is the kind of evidence that helps both management and future buyers.
