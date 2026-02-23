# __PROJECT_NAME__ Agent Guide

## Core Rule

- Do not mark tasks done until `npm run starter:full` passes.

## Workflow

1. Keep changes minimal and scoped.
2. Update docs when scripts/policies/workflows change.
3. Validate before done:
   - `npm run starter:quick` for routine tasks
   - `npm run starter:full` for release-ready tasks

## Starter Contract

- Contract file: `contracts/agent-contract.json`
- Security policy: `config/security-release-policy.json`
- Prompt template: `docs/future-llm-prompt-template.md`
