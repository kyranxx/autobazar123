#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_MESSAGES_DIR = path.join("src", "i18n", "messages");
const TARGET_LOCALES = ["sk", "hu"];
const WORD_REGEX = /\p{L}+/gu;
const MAX_PRINTED_FINDINGS = 200;
const MAX_AMBIGUOUS_OPTIONS = 5;
const MIN_DERIVED_KEY_LENGTH = 4;
const LOCALE_CONFIG = {
  sk: {
    name: "Slovak",
    manualDictionaryPath: path.join("scripts", "slovak-diacritics-dictionary.json"),
    diacriticRegex: /[áäčďéíĺľňóôŕšťúýž]/iu,
  },
  hu: {
    name: "Hungarian",
    manualDictionaryPath: path.join("scripts", "hungarian-diacritics-dictionary.json"),
    diacriticRegex: /[áéíóöőúüű]/iu,
  },
};

function parseArgs(argv) {
  const args = {
    rootDir: process.cwd(),
    messagesDir: DEFAULT_MESSAGES_DIR,
    writeMode: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--root" && argv[i + 1]) {
      args.rootDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--messages-dir" && argv[i + 1]) {
      args.messagesDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--write") {
      args.writeMode = true;
    }
  }

  return args;
}

function stripDiacritics(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "");
}

function hasDiacritics(value) {
  return stripDiacritics(value) !== value;
}

function normalizeLookupKey(value, locale) {
  return stripDiacritics(value.trim().toLocaleLowerCase(locale));
}

function containsLocaleDiacritics(value, localeConfig) {
  return localeConfig.diacriticRegex.test(value);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function flattenCatalog(node, prefix = "", entries = []) {
  if (typeof node === "string") {
    entries.push({ key: prefix, value: node });
    return entries;
  }

  if (!isPlainObject(node)) {
    return entries;
  }

  for (const [key, value] of Object.entries(node)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    flattenCatalog(value, nextPrefix, entries);
  }

  return entries;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadCatalogEntries(filePath) {
  const content = loadJson(filePath);
  return flattenCatalog(content);
}

function applyCase(value, expected, locale) {
  const upperValue = value.toLocaleUpperCase(locale);
  const lowerValue = value.toLocaleLowerCase(locale);

  if (value === upperValue) {
    return expected.toLocaleUpperCase(locale);
  }

  if (
    value.length > 0 &&
    value[0] === value[0].toLocaleUpperCase(locale) &&
    value.slice(1) === value.slice(1).toLocaleLowerCase(locale)
  ) {
    return expected.charAt(0).toLocaleUpperCase(locale) + expected.slice(1).toLocaleLowerCase(locale);
  }

  if (value === lowerValue) {
    return expected.toLocaleLowerCase(locale);
  }

  return expected;
}

function normalizeManualDictionary(rawDictionary, locale) {
  const dictionary = new Map();

  for (const [missing, expected] of Object.entries(rawDictionary ?? {})) {
    if (
      typeof missing !== "string" ||
      typeof expected !== "string" ||
      missing.trim().length === 0 ||
      expected.trim().length === 0
    ) {
      continue;
    }

    const normalizedMissing = normalizeLookupKey(missing, locale);
    const normalizedExpected = normalizeLookupKey(expected, locale);

    if (normalizedMissing !== normalizedExpected || !hasDiacritics(expected)) {
      continue;
    }

    dictionary.set(normalizedMissing, expected.trim().toLocaleLowerCase(locale));
  }

  return dictionary;
}

function loadManualDictionary(rootDir, locale) {
  const localeConfig = LOCALE_CONFIG[locale];
  const dictionaryPath = path.resolve(rootDir, localeConfig.manualDictionaryPath);

  if (!fs.existsSync(dictionaryPath)) {
    return new Map();
  }

  return normalizeManualDictionary(loadJson(dictionaryPath), locale);
}

function deriveDictionary(entries, locale) {
  const localeConfig = LOCALE_CONFIG[locale];
  const accentedCounts = new Map();
  const plainCounts = new Map();

  for (const entry of entries) {
    WORD_REGEX.lastIndex = 0;

    for (const match of entry.value.matchAll(WORD_REGEX)) {
      const value = match[0] ?? "";
      const normalizedValue = value.toLocaleLowerCase(locale);
      const key = normalizeLookupKey(normalizedValue, locale);
      if (!key) {
        continue;
      }

      if (!containsLocaleDiacritics(normalizedValue, localeConfig)) {
        plainCounts.set(key, (plainCounts.get(key) ?? 0) + 1);
        continue;
      }

      const options = accentedCounts.get(key) ?? new Map();
      options.set(normalizedValue, (options.get(normalizedValue) ?? 0) + 1);
      accentedCounts.set(key, options);
    }
  }

  const dictionary = new Map();
  const ambiguousLookup = new Map();

  for (const [key, options] of accentedCounts.entries()) {
    if (key.length < MIN_DERIVED_KEY_LENGTH) {
      continue;
    }

    const ranked = [...options.entries()].sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0], locale);
    });

    if (ranked.length === 0) {
      continue;
    }

    const topCount = ranked[0][1];
    const topOptions = ranked.filter((entry) => entry[1] === topCount).map((entry) => entry[0]);

    if (topOptions.length > 1) {
      if ((plainCounts.get(key) ?? 0) > 0) {
        ambiguousLookup.set(key, topOptions.slice(0, MAX_AMBIGUOUS_OPTIONS));
      }
      continue;
    }

    dictionary.set(key, ranked[0][0]);
  }

  return {
    dictionary,
    ambiguousLookup,
  };
}

function shouldIgnoreTokenContext(text, startIndex, length) {
  const previousChar = startIndex > 0 ? text[startIndex - 1] : "";
  const nextChar = startIndex + length < text.length ? text[startIndex + length] : "";

  return (
    previousChar === "/" ||
    nextChar === "/" ||
    previousChar === "-" ||
    nextChar === "-" ||
    previousChar === "_" ||
    nextChar === "_"
  );
}

function findMissingDiacritics(entries, locale, dictionary) {
  const findings = [];

  for (const entry of entries) {
    WORD_REGEX.lastIndex = 0;
    for (const match of entry.value.matchAll(WORD_REGEX)) {
      const value = match[0] ?? "";
      const offset = match.index ?? 0;

      if (shouldIgnoreTokenContext(entry.value, offset, value.length)) {
        continue;
      }

      if (hasDiacritics(value)) {
        continue;
      }

      const expected = dictionary.get(normalizeLookupKey(value, locale));
      if (!expected) {
        continue;
      }

      findings.push({
        key: entry.key,
        value,
        expected: applyCase(value, expected, locale),
      });
    }
  }

  return findings;
}

function findAmbiguousDiacritics(entries, locale, ambiguousLookup) {
  const findings = [];

  for (const entry of entries) {
    WORD_REGEX.lastIndex = 0;
    for (const match of entry.value.matchAll(WORD_REGEX)) {
      const value = match[0] ?? "";
      const offset = match.index ?? 0;

      if (shouldIgnoreTokenContext(entry.value, offset, value.length)) {
        continue;
      }

      if (hasDiacritics(value)) {
        continue;
      }

      const options = ambiguousLookup.get(normalizeLookupKey(value, locale));
      if (!options || options.length === 0) {
        continue;
      }

      findings.push({
        key: entry.key,
        value,
        options,
      });
    }
  }

  return findings;
}

function shouldCorrectValue(value, expected, locale) {
  if (value.toLocaleLowerCase(locale) === expected) {
    return false;
  }
  if (hasDiacritics(value)) {
    return false;
  }
  return true;
}

function replaceWordsInText(text, locale, dictionary) {
  let replacements = 0;
  const nextText = text.replace(WORD_REGEX, (...args) => {
    const value = args[0];
    const offset = args[args.length - 2];
    const source = args[args.length - 1];

    if (typeof value !== "string" || typeof offset !== "number" || typeof source !== "string") {
      return value;
    }

    if (shouldIgnoreTokenContext(source, offset, value.length)) {
      return value;
    }

    const expected = dictionary.get(normalizeLookupKey(value, locale));
    if (!expected || !shouldCorrectValue(value, expected, locale)) {
      return value;
    }

    replacements += 1;
    return applyCase(value, expected, locale);
  });

  return {
    text: nextText,
    replacements,
  };
}

function applyFixesToCatalog(node, locale, dictionary) {
  if (typeof node === "string") {
    return replaceWordsInText(node, locale, dictionary);
  }

  if (!isPlainObject(node)) {
    return {
      node,
      replacements: 0,
    };
  }

  const nextNode = {};
  let replacements = 0;

  for (const [key, value] of Object.entries(node)) {
    const result = applyFixesToCatalog(value, locale, dictionary);
    nextNode[key] = result.node ?? result.text ?? value;
    replacements += result.replacements ?? 0;
  }

  return {
    node: nextNode,
    replacements,
  };
}

export function runI18nLocaleDiacriticsCheck({
  rootDir = process.cwd(),
  messagesDir = DEFAULT_MESSAGES_DIR,
  writeMode = false,
} = {}) {
  const errors = [];
  const findingsByLocale = new Map();
  const ambiguousByLocale = new Map();
  let fixedFiles = 0;
  let replacements = 0;
  const absoluteMessagesDir = path.resolve(rootDir, messagesDir);

  for (const locale of TARGET_LOCALES) {
    const localeConfig = LOCALE_CONFIG[locale];
    const filePath = path.join(absoluteMessagesDir, `${locale}.json`);
    if (!fs.existsSync(filePath)) {
      errors.push(
        `i18n-diacritics: missing ${localeConfig.name} locale file ${path.relative(rootDir, filePath).replaceAll("\\", "/")}`,
      );
      continue;
    }

    const catalogJson = loadJson(filePath);
    const entries = flattenCatalog(catalogJson);
    const manualDictionary = loadManualDictionary(rootDir, locale);
    const { dictionary: derivedDictionary, ambiguousLookup } = deriveDictionary(entries, locale);

    for (const key of manualDictionary.keys()) {
      ambiguousLookup.delete(key);
    }

    const mergedDictionary = new Map([...derivedDictionary, ...manualDictionary]);
    let finalEntries = entries;

    if (writeMode) {
      const fixed = applyFixesToCatalog(catalogJson, locale, mergedDictionary);
      if ((fixed.replacements ?? 0) > 0) {
        const nextContent = `${JSON.stringify(fixed.node, null, 2)}\n`;
        const previousContent = fs.readFileSync(filePath, "utf8");
        if (nextContent !== previousContent) {
          fs.writeFileSync(filePath, nextContent, "utf8");
          fixedFiles += 1;
          replacements += fixed.replacements ?? 0;
        }
      }
      finalEntries = loadCatalogEntries(filePath);
    }

    const findings = findMissingDiacritics(finalEntries, locale, mergedDictionary);
    const ambiguousFindings = findAmbiguousDiacritics(finalEntries, locale, ambiguousLookup);

    if (findings.length > 0) {
      findingsByLocale.set(locale, findings);
    }
    if (ambiguousFindings.length > 0) {
      ambiguousByLocale.set(locale, ambiguousFindings);
    }
  }

  return {
    errors,
    findingsByLocale,
    ambiguousByLocale,
    fixedFiles,
    replacements,
  };
}

function printReport(result) {
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }

  let printed = 0;
  if (result.findingsByLocale.size > 0) {
    console.error("i18n-diacritics: missing locale diacritics found:");
    for (const [locale, findings] of result.findingsByLocale.entries()) {
      for (const finding of findings) {
        if (printed >= MAX_PRINTED_FINDINGS) {
          console.error(
            `... output truncated after ${MAX_PRINTED_FINDINGS} findings, rerun with narrower scope if needed.`,
          );
          return;
        }
        console.error(`${locale}.${finding.key}: "${finding.value}" -> "${finding.expected}"`);
        printed += 1;
      }
    }
  }

  if (result.ambiguousByLocale.size > 0) {
    console.error("i18n-diacritics: ambiguous locale words require review:");
    for (const [locale, findings] of result.ambiguousByLocale.entries()) {
      for (const finding of findings) {
        if (printed >= MAX_PRINTED_FINDINGS) {
          console.error(
            `... output truncated after ${MAX_PRINTED_FINDINGS} findings, rerun with narrower scope if needed.`,
          );
          return;
        }
        console.error(
          `${locale}.${finding.key}: "${finding.value}" -> review [${finding.options.join(", ")}]`,
        );
        printed += 1;
      }
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = runI18nLocaleDiacriticsCheck(args);

  if (args.writeMode) {
    console.log(
      `i18n-diacritics: applied ${result.replacements} replacement(s) in ${result.fixedFiles} file(s)`,
    );
  }

  if (result.errors.length > 0 || result.findingsByLocale.size > 0 || result.ambiguousByLocale.size > 0) {
    printReport(result);
    process.exit(1);
  }

  console.log("i18n-diacritics: OK");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export {
  applyCase,
  applyFixesToCatalog,
  deriveDictionary,
  findAmbiguousDiacritics,
  findMissingDiacritics,
  flattenCatalog,
  hasDiacritics,
  normalizeLookupKey,
  normalizeManualDictionary,
  stripDiacritics,
};
