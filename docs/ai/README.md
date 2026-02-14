# AI Workflow Docs

Use these files to make new chats faster and cheaper while keeping quality high.

## Files
- `docs/ai/new-chat-starter.md`: copy/paste task brief for every new chat.
- `docs/ai/project-context.md`: durable project facts and integration notes.
- `docs/ai/prompt-efficiency.md`: token-saving and context management rules.
- `docs/ai/session-handoff-template.md`: summary to carry context across chats.

## Recommended Order
1. Fill `docs/ai/new-chat-starter.md`.
2. Load only needed sections from `docs/ai/project-context.md`.
3. Follow scoped rules (`src/AGENTS.md`, `supabase/AGENTS.md`, `cloudflare-worker/AGENTS.md`).
4. If the chat gets long, write a handoff from `docs/ai/session-handoff-template.md` and start a fresh chat.
