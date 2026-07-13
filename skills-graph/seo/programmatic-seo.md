---
id: seo-programmatic
title: Programmatic SEO
description: Route expansion strategy for brand/model/city surfaces and metadata consistency.
tags:
  - seo
  - programmatic
---

# Programmatic SEO

Key route surfaces:

- `src/app/(site)/[brand]/page.tsx`
- `src/app/(site)/[brand]/[model]/page.tsx`
- `src/app/(site)/[brand]/[model]/[city]/page.tsx`

Guardrails:

1. Keep `generateMetadata` complete for each route layer.
2. Keep canonical and JSON-LD aligned with route params.
3. Validate sitemap coverage when adding new indexable route classes.

Related nodes:

- [[seo/sitemap-governance]]
- [[analytics/event-taxonomy]]
