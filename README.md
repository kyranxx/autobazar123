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
- `npm run test:db:rls` (auto-starts the local DB-only Supabase stack via `npx supabase`, resets to checked-in migrations without seeds, and runs the pgTAP suite)
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
- `npm run audit:chrome-console`
- `npm run qc`
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

## Chrome Console Quick Check

- `npm run qc` is the short version.
- `npm run audit:chrome-console` is the explicit version.
- When targeting default local `http://localhost:3000`, the command starts `npm run dev` automatically if the app is not already running.
- Output is written to `output/chrome-console-quick-check/latest.md` and `output/chrome-console-quick-check/latest.json`.
- Optional flags:
  - `npm run qc -- --headed`
  - `npm run qc -- --fail-on-issues`
  - `npm run qc -- --base-url=https://autobazar123.sk`
- Authenticated dashboard/admin coverage uses `E2E_AUTH_EMAIL`, `E2E_AUTH_PASSWORD`, and optional `E2E_AUTH_IS_ADMIN=true`. Without creds, the command still captures guest redirect behavior for protected routes.

## Local Playwright Server Behavior

- `npm run test:web-interface`, `npm run test:a11y`, `npm run test:keyboard`, `npm run test:mobile-matrix`, and the other repo Playwright commands now auto-reuse an already running local Autobazar dev server on `http://localhost:3000` or `http://127.0.0.1:3000`.
- If no local app server is reachable, Playwright still starts its managed dev server automatically.
- The reuse check now waits on `/auth/login`, so an arbitrary process on port `3000` is less likely to be mistaken for the app.
- Local Playwright runs default to `1` worker when they target the shared local dev server, which avoids flaky route-compilation/HMR overlap from parallel workers. Override with `PLAYWRIGHT_WORKERS=<n>` if you explicitly want concurrency.
- Optional overrides:
  - `PLAYWRIGHT_REUSE_SERVER=false` forces Playwright to start its managed server.
  - `PLAYWRIGHT_WEB_SERVER_READY_URL=http://localhost:3000/custom-path` changes the readiness probe if needed.

## Optional Codex Tooling Checks

- `npm run test:workflow-check`
- `npm run test:agent-contract`
- `npm run test:skill-graph`
- `npm run test:model-check`
- `npm run test:codex-cli-check`

## Local Google OAuth

- `NEXT_PUBLIC_SUPABASE_URL` can point to either the default project host (`https://<project-ref>.supabase.co`) or your branded Supabase custom domain once it is activated.
- If you enable a branded Supabase domain, update `NEXT_PUBLIC_SUPABASE_URL` to that branded host so the browser OAuth hop stops exposing the raw Supabase project ref.
- Keep local callback origin explicit in `.env.local`:
  - `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN=http://localhost:3000`
- In Supabase Dashboard -> Authentication -> URL Configuration, ensure redirect allow-list includes:
  - `http://localhost:3000/auth/callback`
  - `http://127.0.0.1:3000/auth/callback` (if you run on `127.0.0.1`)
  - `http://localhost:3000/auth/reset-password`
  - `http://127.0.0.1:3000/auth/reset-password` (if you run on `127.0.0.1`)
- Supabase custom domains are configured in the Supabase dashboard plus DNS; the app side is only the `NEXT_PUBLIC_SUPABASE_URL` switch.

## Machine-Readable Endpoints

- `https://autobazar123.sk/llms.txt`
- `https://autobazar123.sk/sitemap.xml`

## CI Security Automation

- Dependabot config: `.github/dependabot.yml`
- Dependabot safe patch auto-merge: `.github/workflows/dependabot-safe-automerge.yml`
- CodeQL workflow: `.github/workflows/codeql.yml`
- Master fast gate workflow: `.github/workflows/master-fast-gate.yml`
- Production smoke rollback workflow: `.github/workflows/production-postdeploy-smoke.yml`
- OWASP ZAP baseline workflow: `.github/workflows/owasp-zap-baseline.yml`
- Required secret for scheduled ZAP scans: `ZAP_TARGET_URL` (staging URL recommended)
- Optional repository variable for smoke checks: `PRODUCTION_SMOKE_URL` (defaults to `https://autobazar123.sk`)
