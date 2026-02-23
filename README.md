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
- `docs/easy-mode.md`
- `docs/future-llm-prompt-template.md`

## Local Commands

- `npm run dev`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:unit`
- `npm run test:web-interface`
- `npm run test:ui-qa`
- `npm run test:ui-quality-gate`
- `npm run test:security:policy`
- `npm run test:security:release-gate`
- `npm run test:agent-contract`
- `npm run test:skill-graph`
- `npm run easy:quick`
- `npm run easy:full`
- `npm run links:ingest`
- `npm run bench:agent:list`
- `npm run test:codex-cli-check`
- `npm run test:email:smoke -- your@email.com`

## Local Google OAuth

- Keep local callback origin explicit in `.env.local`:
  - `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN=http://localhost:3000`
- In Supabase Dashboard -> Authentication -> URL Configuration, ensure redirect allow-list includes:
  - `http://localhost:3000/auth/callback`
  - `http://127.0.0.1:3000/auth/callback` (if you run on `127.0.0.1`)
