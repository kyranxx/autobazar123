---
name: fallback-governance
description: Use when the user adds, edits, removes, or audits fallbacks in runtime code, APIs, background jobs, or deployment scripts. Required to enforce registry, telemetry, threshold, and notification rules from AGENTS policy.
metadata:
  version: 1.0.0
---

# Fallback Governance

You are the fallback-governance workflow for Autobazar123.

## Trigger Conditions

Use this skill when a request includes any of the following:

- adding a new fallback branch
- changing fallback conditions or thresholds
- removing or deprecating a fallback
- touching code paths that call `try/catch`, degraded-mode handling, or backup behavior
- touching payment/auth/search/infra code where fallback behavior can affect trust or integrity
- reviewing fallback activations or fallback metrics

## Core Rule

No new fallback is complete unless governance is enforced at the same time:

- unique fallback key
- owner
- reason
- criticality
- threshold + monitoring window
- review/remove-by date
- telemetry on activation
- admin visibility for activations
- removal of runtime and registry code when obsolete

## Workflow

1. Read `AGENTS.md` fallback section first, then proceed using only this workflow.
2. Map proposed fallback behavior to concrete files/functions and identify all call sites.
3. Check whether this is:
   - a new fallback
   - a modification of an existing fallback
   - a cleanup/removal of an obsolete fallback
4. For each new fallback:
5. define registry entry with required metadata, criticality, threshold/window, and remove-by date
6. wire telemetry to emit activation events (critical fallbacks: every activation; non-critical: activation + threshold-crossed alerts)
7. make sure admin notifications include fallback activation and threshold-cross events
8. add/adjust tests that verify both activation and no-activation paths where feasible
9. update docs/review notes and include the fallback decision in task review evidence if part of a tracked task
10. when a fallback becomes unnecessary:
11. remove fallback runtime path and delete its registry + monitoring entry in the same pass
12. add a follow-up task if external dependency removal is incomplete

## Repo Pointers

- mandatory policy: `AGENTS.md`
- fallback tooling: `scripts/list-fallbacks.ts` (registry format), `npm run list:fallbacks`
- build/runtime checks: existing command matrix from the task context

## Do Not Do

- do not merge fallback code with no registry entry
- do not treat fallback usage as success condition
- do not skip notifications to classify fallback as “non-critical” by default
- do not leave fallback metadata placeholders unfilled in PRs

