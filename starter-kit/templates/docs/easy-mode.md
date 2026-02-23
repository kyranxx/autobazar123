# Easy Mode

Use these two commands only.

## Quick Check

```bash
npm run starter:quick
```

What it runs:

- workflow check
- agent contract check
- security policy static check
- skill graph link check

## Full Check

```bash
npm run starter:full
```

What it runs:

- security release gate
- workflow check
- agent contract check
- skill graph check
- links ingestion test

## If You Want To Help Fast

1. Keep `LINKS.md` updated with new URLs.
2. For blocked pages, add screenshots under `output/link_research/manual/<slug>/`.
3. Add a short note for each screenshot in `LINKS.md`.
4. Ask the agent to ingest and classify each link as `usable`, `partial`, or `blocked`.
