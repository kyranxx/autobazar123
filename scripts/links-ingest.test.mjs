import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeUrl,
  parseLinksMarkdown,
  buildSnapshot,
} from "./links-ingest.mjs";

test("normalizeUrl strips tracking params and normalizes host/path", () => {
  const value = normalizeUrl(
    "https://X.com/Foo/status/123?s=46&t=abc&utm_source=test&b=2&a=1",
  );

  assert.equal(value, "https://x.com/Foo/status/123?a=1&b=2");
});

test("parseLinksMarkdown maps entries to TODO and DONE sections", () => {
  const markdown = `
# LINKS

## TODO
https://example.com/a
Note Item

## DONE
https://example.com/b
`;
  const entries = parseLinksMarkdown(markdown);
  assert.equal(entries.length, 3);
  assert.equal(entries[0].section, "TODO");
  assert.equal(entries[0].kind, "url");
  assert.equal(entries[1].section, "TODO");
  assert.equal(entries[1].kind, "note");
  assert.equal(entries[2].section, "DONE");
});

test("buildSnapshot tracks duplicates across sections", () => {
  const entries = [
    {
      value: "https://example.com/a/",
      section: "TODO",
      kind: "url",
      normalized: normalizeUrl("https://example.com/a/"),
    },
    {
      value: "https://example.com/a",
      section: "DONE",
      kind: "url",
      normalized: normalizeUrl("https://example.com/a"),
    },
  ];

  const snapshot = buildSnapshot(entries);
  assert.equal(snapshot.totals.entries, 2);
  assert.equal(snapshot.totals.unique, 1);
  assert.equal(snapshot.totals.duplicates, 1);
  assert.equal(snapshot.duplicates[0].firstSeen.section, "TODO");
});
