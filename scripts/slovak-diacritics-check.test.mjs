import test from "node:test";
import assert from "node:assert/strict";

import {
  applyFixes,
  buildWordRegex,
  findMissingDiacritics,
  normalizeDictionary,
  parseArgs,
} from "./slovak-diacritics-check.mjs";

test("findMissingDiacritics reports missing accents in code string literals", () => {
  const dictionary = normalizeDictionary({
    spravu: "spr\u00e1vu",
    odoslat: "odosla\u0165",
  });
  const findings = findMissingDiacritics({
    content: 'const message = "Chcem odoslat spravu.";',
    extension: ".ts",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(findings.length, 2);
  assert.equal(findings[0].value.toLowerCase(), "odoslat");
  assert.equal(findings[0].expected, "odosla\u0165");
  assert.equal(findings[1].value.toLowerCase(), "spravu");
  assert.equal(findings[1].expected, "spr\u00e1vu");
});

test("findMissingDiacritics ignores non-literal identifiers in code files", () => {
  const dictionary = normalizeDictionary({
    odoslat: "odosla\u0165",
  });
  const findings = findMissingDiacritics({
    content: "const odoslatSpravu = true;",
    extension: ".ts",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(findings.length, 0);
});

test("findMissingDiacritics skips URL and slug fragments", () => {
  const dictionary = normalizeDictionary({
    moj: "m\u00f4j",
    ucet: "\u00fa\u010det",
  });
  const findings = findMissingDiacritics({
    content: 'const route = "/moj-ucet";',
    extension: ".ts",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(findings.length, 0);
});

test("applyFixes rewrites plain text and preserves simple capitalization", () => {
  const dictionary = normalizeDictionary({
    spravu: "spr\u00e1vu",
    odoslat: "odosla\u0165",
  });
  const result = applyFixes({
    content: "Prosim Odoslat spravu.",
    extension: ".md",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(result.replacements, 2);
  assert.equal(result.text, "Prosim Odosla\u0165 spr\u00e1vu.");
});

test("parseArgs supports custom path, dictionary, and write mode", () => {
  const args = parseArgs([
    "--path=src",
    "--path",
    "docs",
    "--dictionary=scripts/custom.json",
    "--write",
  ]);

  assert.deepEqual(args.targetPaths, ["src", "docs"]);
  assert.equal(args.dictionaryPath, "scripts/custom.json");
  assert.equal(args.writeMode, true);
});
