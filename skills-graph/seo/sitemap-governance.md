---
id: seo-sitemap-governance
title: Sitemap Governance
description: Rules for sitemap completeness, robots policy, and crawl-safe route rollout.
tags:
  - seo
  - sitemap
  - robots
---

# Sitemap Governance

Primary files:

- `src/app/sitemap.ts`
- `src/app/robots.ts`

Checklist:

1. New indexable page families must be represented in sitemap generation.
2. Robots policy must stay aligned with route discoverability and maintenance routes.
3. Do not add duplicate canonical paths for equivalent resource pages.

Related nodes:

- [[seo/programmatic-seo]]
