---
id: ui-three-pass-refinement
title: UI Three-Pass Refinement
description: Structured 50/99/100 loop for moving UI work from rough structure to production polish.
tags:
  - ui
  - workflow
  - quality
---

# UI Three-Pass Refinement

Use this sequence for non-trivial UI tasks:

1. Pass 1 (50%):
   - Build correct structure, hierarchy, and core states.
2. Pass 2 (99%):
   - Self-review spacing, typography, interaction clarity, and consistency.
3. Pass 3 (100%):
   - Apply measurable micro-adjustments and re-run UI gates.

Validation commands:

- `npm run test:web-interface`
- `npm run test:ui-quality-gate`

Related nodes:

- [[ui/ui-quality-gates]]
- [[agent/control-plane]]
