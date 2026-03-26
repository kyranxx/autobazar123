# Easy Mode (For You)

If you want a simple validation bundle, use these commands:

## Quick check (fast)

```bash
npm run easy:quick
```

What it does:

- lint
- typecheck
- unit tests

## Full check (ship-ready)

```bash
npm run easy:full
```

What it does:

- lint + typecheck + unit tests
- security release gate
- UI quality gate (core mode)
- analytics taxonomy test
- links-ingestion tests

## When to use them

- `easy:quick` for a fast local preflight.
- `easy:full` for stronger ship-ready confidence.
- These are optional convenience bundles, not an automatic default for every local task.

## Help with blocked links (fast manual assist)

If a link is login-gated or anti-bot blocked, your screenshots help a lot:

1. Open the page yourself.
2. Take clear screenshots of the full post/article (or a short screen recording for long threads).
3. Save files under `output/link_research/manual/<slug>/`.
4. Add one line near that link in `LINKS.md` pointing to the evidence folder.
5. Ask me to ingest that folder and classify extraction confidence as `usable`, `partial`, or `blocked`.
