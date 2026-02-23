---
id: ui-quality-gates
title: UI Quality Gates
description: Automated enforcement of semantic, accessibility, and consistency checks.
tags:
  - ui
  - quality
  - tests
---

# UI Quality Gates

Primary command:

- `npm run test:ui-quality-gate`

Includes:

1. Semantic/accessibility route checks (`tests/web-interface-guidelines.test.ts`)
2. Sitewide optional scan (`tests/web-interface-sitewide.test.ts`)
3. Core UI unit checks for shared components

Related nodes:

- [[agent/control-plane]]
