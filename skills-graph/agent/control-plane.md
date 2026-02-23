---
id: agent-control-plane
title: Agent Control Plane
description: Contract-driven checks, benchmark loops, and deterministic review evidence for agentic development.
tags:
  - agents
  - governance
  - ci
---

# Agent Control Plane

Core artifacts:

- Contract template: `contracts/agent-contract.template.json`
- Repository contract: `contracts/agent-contract.json`
- Contract validator: `npm run test:agent-contract`
- Benchmark suite: `benchmarks/agent-suite/tasks.json`
- Benchmark CLI: `scripts/agent-benchmark.mjs`

Execution policy:

1. Determine risk tier from changed paths.
2. Run all checks required by that tier.
3. Require fresh evidence for the current change head.
4. Block merge when policy or evidence checks fail.

Related nodes:

- [[security/release-gate]]
- [[ui/ui-quality-gates]]
- [[analytics/event-taxonomy]]
