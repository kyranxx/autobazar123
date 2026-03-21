# Analytics Foundation Spec

This document is step 1 of the company sale readiness plan.

Its purpose is simple:

- define the core entities
- define stable IDs
- define how those entities relate to each other
- make later tracking and reporting consistent

Without this step, later analytics usually becomes messy.

## Status

- Step 1 completed: core entities and stable IDs defined here
- Step 2 now exists in [Analytics Metric Dictionary](./analytics-metric-dictionary.md)
- Next recommended step: define the analytics event spec

## Why This Comes First

Before event names, dashboards, or funnels, the team needs to agree on what the important objects are.

If that is unclear, later questions become hard to answer.

Example:
"How many qualified leads from premium dealer listings in Bratislava became confirmed sales in the last 90 days?"

That question is only easy if the IDs and relationships were designed clearly.

## Core Rule

Every important business object should have:

- one canonical ID
- one clear owner system
- one plain-English definition

The canonical ID should stay stable over time.

## Core Entities

These are the main business objects Autobazar123 should treat as first-class entities.

### User

What it is:
A person account in the system.

Canonical ID:
`user_id`

Examples:

- a buyer browsing and sending leads
- a private seller posting a car
- a dealer staff member managing inventory

Notes:

- one human should ideally map to one `user_id`
- roles should be modeled as properties or related entities, not by creating duplicate users

### Seller

What it is:
The selling side identity for a listing.

Canonical ID:
`seller_id`

Examples:

- a private person selling one car
- a business seller represented by a dealer record

Notes:

- a seller is a business object, not just a login
- if one person can sell privately and also work for a dealer, keep those roles explicit instead of mixing them

### Dealer

What it is:
A dealership or dealer account that owns inventory, receives leads, and may pay for premium products.

Canonical ID:
`dealer_id`

Examples:

- a single-location used car dealer
- a multi-location dealer group

Notes:

- dealer-level reporting is critical for retention, revenue, and concentration risk
- avoid making dealer analytics depend only on user accounts

### Listing

What it is:
A vehicle listing published on the marketplace.

Canonical ID:
`listing_id`

Examples:

- one BMW 320d listing
- one Skoda Octavia listing

Notes:

- one listing should represent one sellable inventory item at a given time
- if a listing is duplicated or republished, preserve history carefully rather than losing the connection
- in current analytics code, some payloads use `adId`; this should be treated as the current implementation field for the listing object and normalized in later analytics cleanup

### Lead

What it is:
A buyer intent event that creates a meaningful seller contact or inquiry record.

Canonical ID:
`lead_id`

Examples:

- contact form submission
- chat start
- phone reveal if you decide to count it as a lead type

Notes:

- define exactly which actions create a lead in step 2
- a lead should be a distinct business object if it matters to reporting, seller value, or monetization

### Conversation

What it is:
An ongoing message or contact thread between buyer and seller.

Canonical ID:
`conversation_id`

Examples:

- buyer asks about mileage and service history
- dealer follows up after first inquiry

Notes:

- useful when one lead turns into many messages
- separates the first demand signal from longer communication

### Subscription

What it is:
A recurring commercial agreement for a dealer or seller product.

Canonical ID:
`subscription_id`

Examples:

- dealer premium package
- monthly inventory placement plan

Notes:

- this is needed for revenue retention and churn analysis
- do not rely only on invoice records for subscription analytics

### Invoice

What it is:
A billing record for money charged or due.

Canonical ID:
`invoice_id`

Examples:

- dealer monthly package invoice
- premium feature invoice

Notes:

- finance should remain the source of truth for recognized revenue
- invoice IDs help reconcile analytics and accounting

### Session

What it is:
A bounded usage session used for web analytics and attribution.

Canonical ID:
`session_id`

Examples:

- a buyer visit from SEO
- a dealer login session from direct traffic

Notes:

- session logic should be consistent across tracking tools where possible
- session IDs support funnel analysis and channel attribution

## Entity Relationships

This is the simple relationship map.

- one `user_id` can create or manage one or more seller-side records
- one `dealer_id` can have multiple `user_id` accounts
- one `seller_id` can own one or more `listing_id` records
- one `dealer_id` can own many `listing_id` records
- one `listing_id` can generate many `lead_id` records
- one `lead_id` can create or join a `conversation_id`
- one `dealer_id` can have one or more `subscription_id` records over time
- one `subscription_id` can generate one or more `invoice_id` records

## Minimum Required ID Set

If the team wants the smallest useful starting point, these IDs matter most:

- `user_id`
- `dealer_id`
- `seller_id`
- `listing_id`
- `lead_id`
- `subscription_id`

These six unlock most of the important reporting:

- funnels
- retention
- monetization
- concentration risk
- lead quality
- sale outcome tracking

## Naming Rules

Use these naming rules consistently.

- use lowercase snake_case
- use the `_id` suffix for canonical identifiers
- do not mix `dealerId`, `dealer_id`, and `account_id` for the same concept
- use one business name per object
- put context in properties, not in the ID name

Good examples:

- `listing_id`
- `dealer_id`
- `subscription_id`

Bad examples:

- `adUuid`
- `dealerAccountRef`
- `listingRecordIdValue`

## Source Of Truth Rules

Each important object should have a clear source of truth.

Recommended ownership:

- `user_id`: auth / identity system
- `dealer_id`: dealer domain model
- `seller_id`: seller domain model
- `listing_id`: listings domain model
- `lead_id`: leads / contact pipeline
- `conversation_id`: messaging system
- `subscription_id`: billing or subscription domain
- `invoice_id`: finance / billing records

This matters because analytics should reference these objects, not replace them.

## What To Avoid

Avoid these common mistakes:

- creating new IDs in analytics that do not match product records
- using email or phone number as the identifier
- changing IDs when a listing is edited
- mixing person identity and dealer identity into one field
- making billing reports depend on frontend-only events
- losing historical continuity when data structures change

## How This Connects To The Existing Repo

The repo already has a typed analytics contract in:

- `src/lib/analytics/events.ts`
- `src/lib/analytics/events.test.ts`
- `docs/analytics-governance.md`

That is good.

This foundation spec sits one level above that contract.

Its job is to define the business objects that event payloads should reference.

Example:

- `listing_viewed` already exists
- its payload currently uses `adId`
- the business object behind that field is the canonical `listing_id`

That means the next steps should keep business definitions and implementation fields aligned.

## Practical Example

A simple chain could look like this:

- `user_id` signs up
- that user creates or belongs to a `seller_id` or `dealer_id`
- that seller publishes a `listing_id`
- the listing gets a `lead_id`
- the lead turns into a `conversation_id`
- later the listing may be marked sold
- if the seller is a dealer, the dealer may also have a `subscription_id` and related `invoice_id`

This is the basic skeleton needed for sale-ready reporting.

## What Step 2 Should Do

The next document should define the metric dictionary.

That document should answer questions like:

- what counts as an active dealer
- what counts as a qualified lead
- what counts as a sale confirmed
- what counts as stale inventory
- what counts as a paying dealer

Without that, event tracking still leaves too much room for interpretation.
