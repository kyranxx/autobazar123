## Coding philosophy
    - Never use hacks or workarounds, just correct proper fix/coding. Better work harder and longer then using hacks or workarounds.


## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, stop and re-plan immediately. Do not keep pushing.
- Use plan mode for verification steps, not just building
- Write detailed specs up front to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, use subagents for more parallel compute
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After any correction from the user, update `tasks/lessons.md` with the pattern
- Write rules that prevent repeating the same mistake
- Iterate on these lessons until the mistake rate drops
- Review lessons at session start for the relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between `main` and your changes when relevant
- Ask: "Would a staff engineer approve this?"
- Run tests, check logs, and demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes, pause and ask if there is a more elegant way
- If a fix feels hacky, implement the elegant solution with current understanding
- Skip this for simple, obvious fixes to avoid over-engineering
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report, fix it without hand-holding
- Point at logs, errors, and failing tests, then resolve them
- Require zero context switching from the user
- Fix failing CI tests proactively

## Task Management

1. **Plan First**: Write a plan to `tasks/todo.md` with checkable items.
2. **Verify Plan**: Check in before starting implementation.
3. **Track Progress**: Mark items complete as you go.
4. **Explain Changes**: Provide a high-level summary at each step.
5. **Document Results**: Add a review section to `tasks/todo.md`.
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections.

## Core Principles

- **Simplicity First**: Make every change as simple as possible and impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what is necessary and avoid introducing bugs.

