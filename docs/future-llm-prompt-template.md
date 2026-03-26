# Future LLM Prompt Template

Copy-paste this into future sessions:

```text
Implement this task in this repo using existing governance and gates.

Rules:
- Follow AGENTS.md.
- Keep changes minimal and production-safe.
- Update docs only when they are directly relevant to the task.
- Run targeted technical checks appropriate to the touched area and summarize them briefly.
- Push or deploy only if I explicitly ask.

Deliverables:
1) Code changes
2) Short verification summary
3) Risks or blockers, if any

If links are blocked:
- Use manual evidence in `output/link_research/manual/<slug>/` (screenshots/video).
- Classify each blocked item as `usable`, `partial`, or `blocked`.
```
