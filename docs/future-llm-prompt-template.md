# Future LLM Prompt Template

Copy-paste this into future sessions:

```text
Implement this task in this repo using existing governance and gates.

Rules:
- Follow AGENTS.md and the repo workflow checklist.
- Keep changes minimal and production-safe.
- Update docs when scripts/workflows/gates change.
- Do not mark done until the relevant checks from AGENTS.md pass. Use `npm run easy:quick` for default product changes and `npm run easy:full` for release-level work.

Deliverables:
1) Code changes
2) Tests/verification output summary
3) Updated tasks/todo.md review section
4) Commit and push

If links are blocked:
- Use manual evidence in `output/link_research/manual/<slug>/` (screenshots/video).
- Classify each blocked item as `usable`, `partial`, or `blocked`.
```
