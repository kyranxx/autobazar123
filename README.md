# Autobazar123

Central reference for project architecture, services, rules, and implemented systems:

- `docs/PROJECT_PLAYBOOK.md`

Additional operating docs:

- `docs/detail-design-92-applicability.md`
- `docs/web-interface-guidelines-checklist.md`
- `docs/ui-ux-pro-max-protocol.md`
- `docs/ui-skills-review-pass.md`
- `docs/seo-implementation-matrix.md`
- `docs/links-ingestion.md`
- `docs/analytics-governance.md`
- `docs/agent-benchmark-suite.md`
- `docs/security-top-10-defaults.md`
- `docs/slovak-diacritics-check.md`
- `docs/accessibility-testing-playbook.md`
- `docs/easy-mode.md`
- `docs/future-llm-prompt-template.md`

## Local Commands

- `npm run dev`
- `npm run lint`
- `npm run check:sk-diacritics`
- `npm run check:i18n-contract`
- `npm run check:i18n-diacritics`
- `npm run check:i18n-diacritics:write`
- `npx tsc --noEmit`
- `npm run test:unit`
- `npm run test:db:rls` (requires Supabase CLI and running local Supabase stack)
- `npm run test:web-interface`
- `npm run test:a11y`
- `npm run test:keyboard`
- `npm run test:mobile-matrix`
- `npm run test:ui-quality-gate`
- `npm run test:security:release-gate`
- `npm run check:framework-patch-posture`
- `npm run test:framework-patch-posture-script`
- `npm run check:prod-rate-limit-env`
- `npm run test:links-ingest`
- `npm run easy:quick`
- `npm run easy:full`
- `npm run test:release-gauntlet`
- `npm run audit:webapp`
- `npm run audit:webapp:webpack`
- `npm run links:ingest`
- `npm run bench:agent:list`

## Shadcn CLI v4 Workflows

- `npm run ui:shadcn:info` to inspect framework/version and installed UI setup.
- `npm run ui:shadcn:docs -- button` to open docs/api/examples for a component.
- `npm run ui:shadcn:add:dry-run -- button` to preview component changes before writing files.
- `npm run ui:shadcn:add:diff -- src/components/ui/shadcn/button.tsx` to review update diffs.
- `npm run ui:shadcn:init:preset -- base-nova` to scaffold or reconfigure using a preset code.
- `npm run ui:shadcn:init:base -- radix` (or `base`) to select UI primitives at init time.
- `npm run ui:shadcn:mcp:init:codex` to generate shadcn MCP config for Codex clients.
- `npm run skills:list` to inspect installed project skills.
- `npm run skills:restore` to restore project skills from `skills-lock.json`.

## Optional Codex Tooling Checks

- `npm run test:workflow-check`
- `npm run test:agent-contract`
- `npm run test:skill-graph`
- `npm run test:model-check`
- `npm run test:codex-cli-check`

## Local Google OAuth

- Keep local callback origin explicit in `.env.local`:
  - `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN=http://localhost:3000`
- In Supabase Dashboard -> Authentication -> URL Configuration, ensure redirect allow-list includes:
  - `http://localhost:3000/auth/callback`
  - `http://127.0.0.1:3000/auth/callback` (if you run on `127.0.0.1`)
  - `http://localhost:3000/auth/reset-password`
  - `http://127.0.0.1:3000/auth/reset-password` (if you run on `127.0.0.1`)

## Machine-Readable Endpoints

- `https://autobazar123.sk/llms.txt`
- `https://autobazar123.sk/sitemap.xml`

## CI Security Automation

- Dependabot config: `.github/dependabot.yml`
- Dependabot safe patch auto-merge: `.github/workflows/dependabot-safe-automerge.yml`
- CodeQL workflow: `.github/workflows/codeql.yml`
- Master fast gate workflow: `.github/workflows/master-fast-gate.yml`
- Production smoke rollback workflow: `.github/workflows/production-smoke-rollback.yml`
- OWASP ZAP baseline workflow: `.github/workflows/owasp-zap-baseline.yml`
- Required secret for scheduled ZAP scans: `ZAP_TARGET_URL` (staging URL recommended)
- Optional repository variable for smoke checks: `PRODUCTION_SMOKE_URL` (defaults to `https://autobazar123.sk`)
