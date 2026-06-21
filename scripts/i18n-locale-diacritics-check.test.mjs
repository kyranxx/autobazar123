import test from "node:test";
import assert from "node:assert/strict";

import {
  applyCase,
  deriveDictionary,
  findAmbiguousDiacritics,
  findMissingDiacritics,
  flattenCatalog,
  hasDiacritics,
  normalizeLookupKey,
  normalizeManualDictionary,
  stripDiacritics,
} from "./i18n-locale-diacritics-check.mjs";

test("stripDiacritics and hasDiacritics work", () => {
  assert.equal(stripDiacritics("zobraziť"), "zobrazit");
  assert.equal(hasDiacritics("zobraziť"), true);
  assert.equal(hasDiacritics("zobrazit"), false);
});

test("normalizeLookupKey strips accents and lowercases by locale", () => {
  assert.equal(normalizeLookupKey("ÁÁA", "sk"), "aaa");
  assert.equal(normalizeLookupKey("Őssze", "hu"), "ossze");
});

test("normalizeManualDictionary keeps corrections and explicit suppressions", () => {
  const dictionary = normalizeManualDictionary(
    {
      zobrazit: "zobraziť",
      broken: "ine-slovo",
      plain: "plain",
    },
    "sk",
  );

  assert.equal(dictionary.get("zobrazit"), "zobraziť");
  assert.equal(dictionary.has("broken"), false);
  assert.equal(dictionary.get("plain"), "plain");
});

test("flattenCatalog returns nested text entries", () => {
  const entries = flattenCatalog({
    common: {
      cta: "Zobrazit",
      nested: {
        note: "Text",
      },
    },
  });

  assert.deepEqual(entries, [
    { key: "common.cta", value: "Zobrazit" },
    { key: "common.nested.note", value: "Text" },
  ]);
});

test("deriveDictionary identifies accented canonical forms and ambiguities", () => {
  const entries = [
    { key: "a", value: "Zobraziť podrobnosti" },
    { key: "b", value: "Nezobrazit slovo" },
    { key: "c", value: "Dáty daťy daty" },
  ];

  const result = deriveDictionary(entries, "sk");

  assert.equal(result.dictionary.get("zobrazit"), "zobraziť");
  assert.equal(result.ambiguousLookup.has("daty"), true);
});

test("findMissingDiacritics reports plain words that exist in dictionary", () => {
  const findings = findMissingDiacritics(
    [{ key: "common.cta", value: "Zobrazit a odoslat" }],
    "sk",
    new Map([
      ["zobrazit", "zobraziť"],
      ["odoslat", "odoslať"],
    ]),
  );

  assert.equal(findings.length, 2);
  assert.equal(findings[0].expected, "Zobraziť");
  assert.equal(findings[1].expected, "odoslať");
});

test("findAmbiguousDiacritics reports review-needed plain words", () => {
  const findings = findAmbiguousDiacritics(
    [{ key: "common.warn", value: "Dat pozor" }],
    "sk",
    new Map([["dat", ["dať", "dát"]]]),
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0].value, "Dat");
  assert.deepEqual(findings[0].options, ["dať", "dát"]);
});

test("applyCase preserves common capitalization patterns", () => {
  assert.equal(applyCase("zobrazit", "zobraziť", "sk"), "zobraziť");
  assert.equal(applyCase("Zobrazit", "zobraziť", "sk"), "Zobraziť");
  assert.equal(applyCase("ZOBRAZIT", "zobraziť", "sk"), "ZOBRAZIŤ");
});
