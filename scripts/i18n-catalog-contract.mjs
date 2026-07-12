#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_MESSAGES_DIR = path.join("src", "i18n", "messages");
const DEFAULT_LOCALES = ["sk", "en", "hu", "ro"];
const MAX_REPORTED_KEYS = 25;
const SIMPLE_PLACEHOLDER_REGEX = /\{([A-Za-z0-9_]+)\}/g;
const FORBIDDEN_RO_COPY = [
  "Plumb calificat",
  "Calificarea conducerii",
  "Această anchetă",
  "Rulați migrarea bazei de date",
];

// These values are intentionally identical in Slovak and Romanian because they
// are units, brands, acronyms, numbers, or short terms shared by both languages.
// Keep this list key-scoped: adding new identical SK/RO UI copy must be reviewed
// instead of silently passing as a translation.
const REVIEWED_SHARED_SK_RO_KEYS = new Set([
  "admin.headerTitle",
  "admin.mfa.inputPlaceholder",
  "auth.email",
  "auth.facebook",
  "auth.google",
  "authModal.passwordStrength.na",
  "bodyType.hatchback",
  "bodyType.mpv",
  "bodyType.pickup",
  "bodyType.sedan",
  "bodyType.suv",
  "common.currency",
  "common.km",
  "contact.address",
  "contact.email",
  "dashboard.creditsWord",
  "equipment.ABS",
  "equipment.Android Auto",
  "equipment.Apple CarPlay",
  "equipment.Bluetooth",
  "equipment.ESP",
  "equipment.Isofix",
  "equipment.USB",
  "featuredCars.premiumBadge",
  "filters.max",
  "filters.min",
  "filters.model",
  "filters.title",
  "homePage.sellerPromoPremiumLabel",
  "homeSearch.modelOption",
  "homeSearch.suggestionModel",
  "languageSwitcher.localeNames.ro",
  "navbar.adminLabel",
  "navbar.creditsSuffix",
  "navbar.userInitial",
  "search.model",
  "searchPage.filters",
]);

function parseArgs(argv) {
  const args = {
    rootDir: process.cwd(),
    messagesDir: DEFAULT_MESSAGES_DIR,
    locales: DEFAULT_LOCALES,
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
    if (arg === "--locales" && argv[i + 1]) {
      args.locales = argv[i + 1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      i += 1;
    }
  }

  return args;
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function flattenCatalogNode(node, prefix = "", entries = [], issues = []) {
  if (typeof node === "string") {
    entries.push([prefix, node]);
    return { entries, issues };
  }

  if (!isPlainObject(node)) {
    issues.push(
      `${prefix || "<root>"}: expected string or object, received ${Array.isArray(node) ? "array" : typeof node}`,
    );
    return { entries, issues };
  }

  const keys = Object.keys(node);
  if (keys.length === 0) {
    issues.push(`${prefix || "<root>"}: empty object is not allowed`);
    return { entries, issues };
  }

  for (const key of keys) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    flattenCatalogNode(node[key], nextPrefix, entries, issues);
  }

  return { entries, issues };
}

function extractPlaceholders(text) {
  const placeholders = new Set();
  SIMPLE_PLACEHOLDER_REGEX.lastIndex = 0;
  for (const match of text.matchAll(SIMPLE_PLACEHOLDER_REGEX)) {
    const name = match[1]?.trim();
    if (name) {
      placeholders.add(name);
    }
  }
  return placeholders;
}

function compareSets(reference, target) {
  const missing = [];
  const extra = [];

  for (const value of reference) {
    if (!target.has(value)) {
      missing.push(value);
    }
  }

  for (const value of target) {
    if (!reference.has(value)) {
      extra.push(value);
    }
  }

  return {
    missing: missing.sort(),
    extra: extra.sort(),
  };
}

function formatSample(values) {
  if (values.length <= MAX_REPORTED_KEYS) {
    return values.join(", ");
  }
  return `${values.slice(0, MAX_REPORTED_KEYS).join(", ")} ... (+${values.length - MAX_REPORTED_KEYS} more)`;
}

export function validateCatalogContracts({
  rootDir = process.cwd(),
  messagesDir = DEFAULT_MESSAGES_DIR,
  locales = DEFAULT_LOCALES,
} = {}) {
  const errors = [];
  const absoluteMessagesDir = path.resolve(rootDir, messagesDir);
  const localeEntries = new Map();

  for (const locale of locales) {
    const filePath = path.join(absoluteMessagesDir, `${locale}.json`);
    if (!fs.existsSync(filePath)) {
      errors.push(`i18n-contract: missing locale file ${path.relative(rootDir, filePath).replaceAll("\\", "/")}`);
      continue;
    }

    const catalog = readJsonFile(filePath);
    const { entries, issues } = flattenCatalogNode(catalog);
    if (issues.length > 0) {
      for (const issue of issues) {
        errors.push(`i18n-contract: ${locale} invalid node at ${issue}`);
      }
      continue;
    }

    for (const [keyPath, value] of entries) {
      if (value.trim().length === 0) {
        errors.push(`i18n-contract: ${locale}.${keyPath} is empty`);
      }
      if (value !== value.trim()) {
        errors.push(`i18n-contract: ${locale}.${keyPath} has leading/trailing whitespace`);
      }
      if (locale === "ro") {
        const forbiddenPhrase = FORBIDDEN_RO_COPY.find((phrase) => value.includes(phrase));
        if (forbiddenPhrase) {
          errors.push(
            `i18n-contract: ro.${keyPath} contains forbidden mistranslation "${forbiddenPhrase}"`,
          );
        }
      }
    }

    localeEntries.set(locale, entries);
  }

  const referenceLocale = locales[0];
  const referenceEntries = localeEntries.get(referenceLocale);
  if (!referenceEntries) {
    return { errors };
  }

  const referenceKeys = new Set(referenceEntries.map(([keyPath]) => keyPath));
  const referenceValues = new Map(referenceEntries);

  for (const locale of locales.slice(1)) {
    const targetEntries = localeEntries.get(locale);
    if (!targetEntries) {
      continue;
    }

    const targetKeys = new Set(targetEntries.map(([keyPath]) => keyPath));
    const { missing, extra } = compareSets(referenceKeys, targetKeys);

    if (missing.length > 0) {
      errors.push(
        `i18n-contract: ${locale} missing ${missing.length} key(s): ${formatSample(missing)}`,
      );
    }
    if (extra.length > 0) {
      errors.push(
        `i18n-contract: ${locale} has ${extra.length} unexpected key(s): ${formatSample(extra)}`,
      );
    }

    const targetValues = new Map(targetEntries);
    for (const keyPath of referenceKeys) {
      if (!targetValues.has(keyPath)) {
        continue;
      }
      const expectedPlaceholders = extractPlaceholders(referenceValues.get(keyPath) ?? "");
      const actualPlaceholders = extractPlaceholders(targetValues.get(keyPath) ?? "");
      const placeholderDiff = compareSets(expectedPlaceholders, actualPlaceholders);

      if (placeholderDiff.missing.length > 0 || placeholderDiff.extra.length > 0) {
        errors.push(
          `i18n-contract: placeholder mismatch for ${locale}.${keyPath} (missing: ${
            placeholderDiff.missing.join(", ") || "none"
          }, extra: ${placeholderDiff.extra.join(", ") || "none"})`,
        );
      }
    }
  }

  const skEntries = localeEntries.get("sk");
  const roEntries = localeEntries.get("ro");
  if (skEntries && roEntries) {
    const skValues = new Map(skEntries);
    const roValues = new Map(roEntries);

    for (const [keyPath, skValue] of skValues) {
      if (
        roValues.has(keyPath) &&
        skValue === roValues.get(keyPath) &&
        !REVIEWED_SHARED_SK_RO_KEYS.has(keyPath)
      ) {
        errors.push(
          `i18n-contract: sk.${keyPath} and ro.${keyPath} have the same value; translate the Romanian copy or explicitly review this language-neutral key`,
        );
      }
    }
  }

  return { errors };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = validateCatalogContracts(args);

  if (result.errors.length > 0) {
    console.error("i18n-contract: failed");
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("i18n-contract: OK");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
