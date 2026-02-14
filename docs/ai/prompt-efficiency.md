# Prompt and Token Efficiency

## Repository-Level Practices
- Keep `AGENTS.md` concise and operational.
- Put stable, detailed knowledge in docs and link to it.
- Use deeper `AGENTS.md` files for directory-specific rules.

## Per-Chat Practices
- Start with `docs/ai/new-chat-starter.md`.
- Keep scope narrow and explicit.
- Avoid replaying full history; include only current task context.
- If the chat becomes long, summarize and start fresh with a handoff.

## Suggested API Practices
These apply when using LLM APIs directly.

- Put stable instructions and reusable context first.
- Put changing task input near the end.
- Reuse conversation state where supported (`previous_response_id` style workflows).
- Prefer compact prompts over repeated long context blocks.
- Cache or memoize static prompt segments where your platform supports prompt caching.

## Practical Flow
1. Use a short brief with exact scope.
2. Load only the docs/files needed for this task.
3. Complete implementation and checks.
4. Write a compact handoff summary for next chat if needed.
