# LINKS Ingestion

This project includes a repeatable ingestion pipeline for `LINKS.md`.

## Commands

- `npm run starter:links` - parse and snapshot links.
- `npm run test:links-ingest` - run ingestion unit tests.

## Output

- `output/link_research/links-ingest/latest.json`
- `output/link_research/links-ingest/links-snapshot-<timestamp>.json`
- `output/link_research/links-ingest/summary.md`

## Manual Evidence Path

If a link is blocked by login or bot-protection:

1. Capture screenshots manually.
2. Save them under `output/link_research/manual/<slug>/`.
3. Add the folder path beside that link in `LINKS.md`.
4. Mark extraction confidence as `usable`, `partial`, or `blocked`.
