import test from "node:test";
import assert from "node:assert/strict";

import {
  applyFixes,
  buildWordRegex,
  findAmbiguousDiacritics,
  findMissingDiacritics,
  normalizeDictionary,
  parseArgs,
  shouldCheckFile,
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

test("findMissingDiacritics reports missing accents in JSX text nodes", () => {
  const dictionary = normalizeDictionary({
    preco: "pre\u010do",
    kupujuci: "kupuj\u00faci",
  });
  const findings = findMissingDiacritics({
    content: "return <div>Preco kupujuci volia Autobazar123</div>;",
    extension: ".tsx",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(findings.length, 2);
  assert.equal(findings[0].expected, "Pre\u010do");
  assert.equal(findings[1].expected, "kupuj\u00faci");
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

test("applyFixes repairs words that are only partially accented", () => {
  const dictionary = normalizeDictionary({
    predchadzajuca: "predch\u00e1dzaj\u00faca",
  });
  const result = applyFixes({
    content: 'const label = "Predchadzaj\u00faca fotografia";',
    extension: ".ts",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(result.replacements, 1);
  assert.equal(result.content, 'const label = "Predch\u00e1dzaj\u00faca fotografia";');
});

test("findMissingDiacritics does not rewrite already-accented different words", () => {
  const dictionary = normalizeDictionary({
    dat: "da\u0165",
  });
  const findings = findMissingDiacritics({
    content: 'const message = "Na\u010d\u00edtavanie d\u00e1t zlyhalo.";',
    extension: ".ts",
    dictionary,
    wordRegex: buildWordRegex(dictionary),
  });

  assert.equal(findings.length, 0);
});

test("findAmbiguousDiacritics reports review-needed words", () => {
  const findings = findAmbiguousDiacritics({
    content: "return <div>Dat si pozor</div>;",
    extension: ".tsx",
    ambiguousLookup: new Map([["dat", ["dať", "dát"]]]),
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].value, "Dat");
  assert.deepEqual(findings[0].options, ["dať", "dát"]);
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

test("normalizeDictionary keeps only same-word diacritic pairs", () => {
  const dictionary = normalizeDictionary({
    predajna: "predajňa",
    broken: "iné slovo",
  });

  assert.equal(dictionary.get("predajna"), "predajňa");
  assert.equal(dictionary.has("broken"), false);
});

test("shouldCheckFile skips foreign locale catalogs", () => {
  assert.equal(
    shouldCheckFile("C:/repo/src/i18n/messages/sk.json"),
    true,
  );
  assert.equal(
    shouldCheckFile("C:/repo/src/i18n/messages/en.json"),
    false,
  );
  assert.equal(
    shouldCheckFile("C:/repo/src/i18n/messages/hu.json"),
    false,
  );
  assert.equal(
    shouldCheckFile("C:/repo/src/i18n/messages/ro.json"),
    false,
  );
});
