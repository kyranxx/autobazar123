# LINKS Ingestion Pipeline

This repository includes a repeatable ingestion pipeline for `LINKS.md`.

## Commands

- `npm run links:ingest` - parse `LINKS.md`, dedupe entries, and write snapshots.
- `npm run test:links-ingest` - run parser/normalization unit tests.

## Outputs

Generated under `output/link_research/links-ingest/`:

- `latest.json` - latest normalized snapshot.
- `links-snapshot-<timestamp>.json` - historical snapshot.
- `summary.md` - compact report with section counts and duplicate list.

## Behavior

1. Parses entries by section (`## TODO`, `## DONE`, etc.).
2. Supports inline annotations after URLs (for example `https://example.com (checked: note)`), while still fetching the canonical URL.
3. Normalizes URL keys for dedupe (host/protocol normalization + tracking parameter strip).
4. Detects duplicate entries across sections.
5. Optionally supports content preview fetch via `--fetch`.

Example:

```bash
node scripts/links-ingest.mjs --fetch --timeout-ms 20000
```
