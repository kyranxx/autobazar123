# Easy Mode (For You)

If you want this simpler, use these commands only:

## Quick check (fast)

```bash
npm run easy:quick
```

What it does:

- workflow checklist guard
- agent contract validation
- security static policy guard
- skill graph link integrity

## Full check (ship-ready)

```bash
npm run easy:full
```

What it does:

- full security release gate
- UI quality gate (core mode)
- agent contract + skill graph checks
- analytics taxonomy test
- links-ingestion tests

## What you can do to help (minimal effort, high impact)

1. Keep `LINKS.md` updated with new research links.
2. Run `npm run easy:quick` before asking for implementation.
3. For release-level work, run `npm run easy:full`.
4. In your prompt, include one line:
   - `Use contracts/agent-contract.json and do not mark done until npm run easy:full passes.`

## Help with blocked links (fast manual assist)

If a link is login-gated or anti-bot blocked, your screenshots help a lot:

1. Open the page yourself.
2. Take clear screenshots of the full post/article (or a short screen recording for long threads).
3. Save files under `output/link_research/manual/<slug>/`.
4. Add one line near that link in `LINKS.md` pointing to the evidence folder.
5. Ask me to ingest that folder and classify extraction confidence as `usable`, `partial`, or `blocked`.
