# Future LLM Prompt Template

Copy-paste this into future sessions:

```text
Implement this task in this repo using existing governance and gates.

Rules:
- Follow contracts/agent-contract.json.
- Keep changes minimal and production-safe.
- Update docs when scripts/workflows/gates change.
- Do not mark done until `npm run easy:full` passes.

Deliverables:
1) Code changes
2) Tests/verification output summary
3) Updated tasks/todo.md review section
4) Commit and push

If links are blocked:
- Use manual evidence in `output/link_research/manual/<slug>/` (screenshots/video).
- Classify each blocked item as `usable`, `partial`, or `blocked`.
```
