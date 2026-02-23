# Agent Benchmark Suite

This repository includes a machine-readable benchmark suite for comparing agent quality across recurring engineering tasks.

## Files

- `benchmarks/agent-suite/tasks.json`: canonical suite definition and task weights.
- `scripts/agent-benchmark.mjs`: CLI for listing tasks, creating report templates, and scoring reports.

## Commands

- `npm run bench:agent:list` - print all benchmark tasks.
- `npm run bench:agent:init` - generate a report template at `output/benchmarks/agent-report.template.json`.
- `npm run bench:agent:score` - score `output/benchmarks/agent-report.json`.

## Report Contract

The scoring CLI expects:

```json
{
  "suite": "autobazar123-agent-suite",
  "generatedAt": "2026-02-23T00:00:00.000Z",
  "evaluator": "agent-id-or-run-id",
  "notes": "",
  "evaluations": [
    {
      "taskId": "bugfix-auth-flow",
      "status": "pass",
      "score": 95,
      "notes": "Brief rationale",
      "evidence": ["npm run test:unit"]
    }
  ]
}
```

If `score` is omitted, fallback scoring is used:

- `pass` -> `100`
- `partial` -> `60`
- `fail` -> `0`

## Purpose

The suite is not a synthetic benchmark. It captures recurring, repository-relevant task types:

- bugfix
- security hardening
- refactor reliability
- SEO correctness
- UI quality
- analytics instrumentation
- tooling automation
- governance/docs alignment
