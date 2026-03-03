import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWordRegex,
  findMissingDiacritics,
  normalizeDictionary,
  parseArgs,
} from "./slovak-diacritics-check.mjs";

test("findMissingDiacritics reports missing accents in code string literals", () => {
  const dictionary = normalizeDictionary({
    spravu: "správu",
    odoslat: "odoslať",
  });
  const findings = findMissingDiacritics({
    content: 'const message = "Chcem odoslat spravu.";',
    extension: ".ts",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(findings.length, 2);
  assert.equal(findings[0].value.toLowerCase(), "odoslat");
  assert.equal(findings[0].expected, "odoslať");
  assert.equal(findings[1].value.toLowerCase(), "spravu");
  assert.equal(findings[1].expected, "správu");
});

test("findMissingDiacritics ignores non-literal identifiers in code files", () => {
  const dictionary = normalizeDictionary({
    odoslat: "odoslať",
  });
  const findings = findMissingDiacritics({
    content: "const odoslatSpravu = true;",
    extension: ".ts",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(findings.length, 0);
});

test("findMissingDiacritics scans plain text files", () => {
  const dictionary = normalizeDictionary({
    inzerat: "inzerát",
  });
  const findings = findMissingDiacritics({
    content: "Novy inzerat bol pridany.",
    extension: ".md",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].value.toLowerCase(), "inzerat");
});

test("parseArgs supports custom path and dictionary overrides", () => {
  const args = parseArgs([
    "--path=src",
    "--path",
    "docs",
    "--dictionary=scripts/custom.json",
  ]);

  assert.deepEqual(args.targetPaths, ["src", "docs"]);
  assert.equal(args.dictionaryPath, "scripts/custom.json");
});
