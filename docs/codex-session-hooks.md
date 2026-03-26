# Codex Session Hooks

This repo provides project-specific Codex `SessionStart` and `Stop` hook scripts in:

- `.codex/hooks/session-start.ps1`
- `.codex/hooks/stop.ps1`

Install the active hook registry on the local machine with:

- `npm run codex:hooks:install`

That command writes the active registry to `~/.codex/hooks.json` and points it at this repo's hook scripts.

Requirements:

- `~/.codex/config.toml` must have `[features]` with `codex_hooks = true`

Behavior:

- `SessionStart` injects only minimal repo context: project purpose, a pointer back to `AGENTS.md`, and lightweight git state.
- `Stop` emits only a minimal git-state summary.
