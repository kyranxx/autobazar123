---
id: analytics-event-taxonomy
title: Analytics Event Taxonomy
description: Naming, payload, and governance conventions for typed analytics events.
tags:
  - analytics
  - governance
---

# Analytics Event Taxonomy

Rules:

1. Event names use `domain_action` format (for example: `search_query_submitted`).
2. Event payloads are typed and validated before send.
3. Tracking honors explicit cookie consent choices.
4. New events must be added to the shared catalog (`src/lib/analytics/events.ts`).

Related nodes:

- [[seo/programmatic-seo]]
- [[agent/control-plane]]
