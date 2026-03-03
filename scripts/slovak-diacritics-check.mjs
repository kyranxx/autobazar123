#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.cwd();
const DEFAULT_TARGET_DIRECTORIES = ["src"];
const DEFAULT_DICTIONARY_PATH = path.join(
  __dirname,
  "slovak-diacritics-dictionary.json",
);
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mdx",
  ".txt",
  ".html",
  ".css",
]);
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const EXCLUDED_PATH_SEGMENTS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  "output",
  ".vercel",
]);
const MAX_PRINTED_FINDINGS = 200;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasDiacritics(value) {
  return /[áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]/u.test(value);
}

function shouldSkipPath(filePath) {
  const normalizedSegments = filePath.split(path.sep);
  return normalizedSegments.some((segment) => EXCLUDED_PATH_SEGMENTS.has(segment));
}

function collectTextFiles(directoryPath, results = []) {
  if (!fs.existsSync(directoryPath)) {
    return results;
  }

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (shouldSkipPath(entryPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      collectTextFiles(entryPath, results);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (TEXT_EXTENSIONS.has(extension)) {
      results.push(entryPath);
    }
  }

  return results;
}

function normalizeDictionary(rawDictionary) {
  const dictionary = new Map();
  for (const [missing, expected] of Object.entries(rawDictionary)) {
    if (
      typeof missing !== "string" ||
      typeof expected !== "string" ||
      missing.trim() === "" ||
      expected.trim() === ""
    ) {
      continue;
    }

    const normalizedMissing = missing.trim().toLowerCase();
    if (hasDiacritics(normalizedMissing)) {
      continue;
    }

    dictionary.set(normalizedMissing, expected.trim());
  }
  return dictionary;
}

function loadDictionary(dictionaryPath) {
  const fileContent = fs.readFileSync(dictionaryPath, "utf8");
  const parsed = JSON.parse(fileContent);
  return normalizeDictionary(parsed);
}

function buildWordRegex(dictionary) {
  const keys = [...dictionary.keys()].sort((left, right) => right.length - left.length);
  if (keys.length === 0) {
    return null;
  }
  return new RegExp(`\\b(?:${keys.map(escapeRegExp).join("|")})\\b`, "giu");
}

function extractSegments(line, extension) {
  if (!CODE_EXTENSIONS.has(extension)) {
    return [{ text: line, offset: 0 }];
  }

  const segments = [];
  const stringLiteralRegex = /`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"/gu;
  for (const match of line.matchAll(stringLiteralRegex)) {
    const matchText = match[0] || "";
    const offset = match.index ?? 0;
    const innerText = matchText.length >= 2 ? matchText.slice(1, -1) : "";
    segments.push({ text: innerText, offset: offset + 1 });
  }

  return segments;
}

function findMissingDiacritics({ content, extension, dictionary, wordRegex }) {
  const findings = [];
  if (!wordRegex) {
    return findings;
  }

  const lines = content.split(/\r?\n/u);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const segments = extractSegments(line, extension);

    for (const segment of segments) {
      wordRegex.lastIndex = 0;
      for (const match of segment.text.matchAll(wordRegex)) {
        const value = match[0] || "";
        const key = value.toLowerCase();
        const expected = dictionary.get(key);
        if (!expected || value === expected || hasDiacritics(value)) {
          continue;
        }

        findings.push({
          line: lineIndex + 1,
          column: segment.offset + (match.index ?? 0) + 1,
          value,
          expected,
          context: line.trim(),
        });
      }
    }
  }

  return findings;
}

function parseArgs(argv) {
  const paths = [];
  let dictionaryPath = DEFAULT_DICTIONARY_PATH;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--path" && argv[index + 1]) {
      paths.push(argv[index + 1]);
      index += 1;
      continue;
    }

    if (argument.startsWith("--path=")) {
      const value = argument.split("=")[1];
      if (value) {
        paths.push(value);
      }
      continue;
    }

    if (argument === "--dictionary" && argv[index + 1]) {
      dictionaryPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith("--dictionary=")) {
      const value = argument.split("=")[1];
      if (value) {
        dictionaryPath = value;
      }
    }
  }

  return {
    targetPaths: paths.length > 0 ? paths : DEFAULT_TARGET_DIRECTORIES,
    dictionaryPath,
  };
}

function runCheck({ targetPaths, dictionaryPath }) {
  const dictionary = loadDictionary(path.resolve(ROOT, dictionaryPath));
  const wordRegex = buildWordRegex(dictionary);
  const files = targetPaths.flatMap((targetPath) =>
    collectTextFiles(path.resolve(ROOT, targetPath)),
  );

  const failures = [];

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, "utf8");
    const findings = findMissingDiacritics({
      content,
      extension,
      dictionary,
      wordRegex,
    });

    if (findings.length > 0) {
      failures.push({
        file: path.relative(ROOT, filePath),
        findings,
      });
    }
  }

  return failures;
}

function printReport(failures) {
  let printed = 0;
  console.error(
    "sk-diacritics-check: found words without Slovak diacritics (dictionary-based):",
  );

  for (const failure of failures) {
    for (const finding of failure.findings) {
      if (printed >= MAX_PRINTED_FINDINGS) {
        console.error(
          `... output truncated after ${MAX_PRINTED_FINDINGS} findings, run with narrower --path if needed.`,
        );
        return;
      }

      console.error(
        `${failure.file}:${finding.line}:${finding.column} "${finding.value}" -> "${finding.expected}"`,
      );
      printed += 1;
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(path.resolve(ROOT, args.dictionaryPath))) {
    console.error(`sk-diacritics-check: dictionary not found: ${args.dictionaryPath}`);
    process.exit(1);
  }

  const failures = runCheck(args);
  if (failures.length > 0) {
    printReport(failures);
    process.exit(1);
  }

  console.log("sk-diacritics-check: OK");
}

if (process.argv[1] === __filename) {
  main();
}

export {
  buildWordRegex,
  findMissingDiacritics,
  loadDictionary,
  normalizeDictionary,
  parseArgs,
  runCheck,
};
