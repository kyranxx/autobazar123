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

- `SessionStart` injects project purpose, workflow, git state, open todo items, and the default verification reminder.
- `Stop` emits a non-blocking reminder about review/lessons updates and the default verification commands.
