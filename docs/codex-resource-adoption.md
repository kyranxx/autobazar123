# Codex Resource Adoption (From AI Edge X Thread)

Last updated: 2026-02-19

This document converts external Codex resources into concrete repository behavior.

## Adopted Now

1. Official prompting guide:
   - Source: `https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/`
   - Repo implementation:
     - Use a fixed prompt contract for non-trivial tasks.
     - Lock expected output format when needed.
   - Enforcement:
     - `docs/codex-workflow-checklist.md` contains required contract fields.

2. Official skills guide:
   - Source: `https://developers.openai.com/codex/skills/`
   - Repo implementation:
     - Skills are used only when task fit is explicit.
     - Keep skill usage deterministic and minimal.
   - Enforcement:
     - `AGENTS.md` + workflow checklist + this document.

3. Official Codex CLI repository:
   - Source: `https://github.com/openai/codex`
   - Repo implementation:
     - Keep a codex CLI smoke check in local workflow.
     - Run model/CLI checks before marking done.
   - Enforcement:
     - `npm run test:model-check`
     - `npm run test:codex-cli-check`

4. Community best-practice thread:
   - Source: `https://community.openai.com/t/best-practices-for-using-codex/1373143`
   - Repo implementation:
     - Periodically sync practical rules into checklists and gates.
   - Cadence:
     - Review monthly or after major Codex releases.

5. Awesome Codex skills list (selective adoption only):
   - Source: `https://github.com/ComposioHQ/awesome-codex-skills`
   - Repo implementation:
     - No bulk installs.
     - Only adopt skills with direct app impact and clear maintenance owner.

## Prompt Contract Template (Required For Non-trivial Tasks)

Use this structure:

1. Goal:
   - What must be true when done.
2. Scope:
   - Files/areas allowed to change.
3. Constraints:
   - What must not change.
4. Steps:
   - Ordered execution plan.
5. Validation:
   - Exact commands/tests to run.
6. Output:
   - Expected final report format.

## Skill Adoption Gate

A skill can be adopted only if all are true:

1. It saves repeated effort for this repo.
2. It does not add hidden external coupling.
3. It has clear operational owner.
4. It has at least one verification command.

## Operational Commands

1. `npm run test:model-check`
2. `npm run test:workflow-check`
3. `npm run test:codex-cli-check`
