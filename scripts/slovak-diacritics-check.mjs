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
const FOREIGN_LOCALE_PATHS = new Set([
  path.join("src", "i18n", "messages", "en.json"),
  path.join("src", "i18n", "messages", "hu.json"),
]);
const MIN_DERIVED_KEY_LENGTH = 5;
const MAX_PRINTED_FINDINGS = 200;
const MAX_AMBIGUOUS_OPTIONS = 5;
const STRING_LITERAL_REGEX = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/gu;
const JSX_TEXT_REGEX = />([^<>{]*\p{L}[^<>{]*)</gu;
const WORD_REGEX = /\p{L}+/gu;
const SLOVAK_DIACRITIC_REGEX = /[áäčďéíĺľňóôŕšťúýž]/iu;
const NON_SLOVAK_DIACRITIC_REGEX = /[öőüű]/iu;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripDiacritics(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "");
}

function hasDiacritics(value) {
  return stripDiacritics(value) !== value;
}

function normalizeLookupKey(value) {
  return stripDiacritics(value.trim().toLocaleLowerCase("sk-SK"));
}

function containsSlovakDiacritics(value) {
  return SLOVAK_DIACRITIC_REGEX.test(value) && !NON_SLOVAK_DIACRITIC_REGEX.test(value);
}

function shouldCheckFile(filePath) {
  const normalizedPath = path.normalize(filePath);

  for (const foreignPath of FOREIGN_LOCALE_PATHS) {
    if (
      normalizedPath === foreignPath ||
      normalizedPath.endsWith(`${path.sep}${foreignPath}`)
    ) {
      return false;
    }
  }

  return true;
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

    const normalizedMissing = normalizeLookupKey(missing);
    const normalizedExpected = normalizeLookupKey(expected);
    if (normalizedMissing === "" || normalizedMissing !== normalizedExpected) {
      continue;
    }

    if (!hasDiacritics(expected)) {
      continue;
    }

    dictionary.set(normalizedMissing, expected.trim().toLocaleLowerCase("sk-SK"));
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

function extractSegments(content, extension) {
  if (!CODE_EXTENSIONS.has(extension)) {
    return [{ text: content, startIndex: 0 }];
  }

  const segments = [];

  for (const match of content.matchAll(STRING_LITERAL_REGEX)) {
    const literal = match[0] || "";
    const startIndex = (match.index ?? 0) + 1;
    const innerText = literal.length >= 2 ? literal.slice(1, -1) : "";
    segments.push({ text: innerText, startIndex });
  }

  for (const match of content.matchAll(JSX_TEXT_REGEX)) {
    const innerText = match[1] || "";
    const startIndex = (match.index ?? 0) + 1;
    segments.push({ text: innerText, startIndex });
  }

  return segments.sort((left, right) => left.startIndex - right.startIndex);
}

function shouldIgnoreTokenContext(text, startIndex, length) {
  const prevChar = startIndex > 0 ? text[startIndex - 1] : "";
  const nextChar = startIndex + length < text.length ? text[startIndex + length] : "";

  return (
    prevChar === "/" ||
    nextChar === "/" ||
    prevChar === "-" ||
    nextChar === "-" ||
    prevChar === "_" ||
    nextChar === "_"
  );
}

function applyCase(value, expected) {
  const upperValue = value.toLocaleUpperCase("sk-SK");
  const lowerValue = value.toLocaleLowerCase("sk-SK");

  if (value === upperValue) {
    return expected.toLocaleUpperCase("sk-SK");
  }

  if (
    value.length > 0 &&
    value[0] === value[0].toLocaleUpperCase("sk-SK") &&
    value.slice(1) === value.slice(1).toLocaleLowerCase("sk-SK")
  ) {
    return (
      expected.charAt(0).toLocaleUpperCase("sk-SK") +
      expected.slice(1).toLocaleLowerCase("sk-SK")
    );
  }

  if (value === lowerValue) {
    return expected.toLocaleLowerCase("sk-SK");
  }

  return expected;
}

function countCharacterDifferences(left, right) {
  if (left.length !== right.length) {
    return Number.POSITIVE_INFINITY;
  }

  let differences = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      differences += 1;
    }
  }

  return differences;
}

function shouldCorrectValue(value, expected) {
  if (value.toLocaleLowerCase("sk-SK") === expected) {
    return false;
  }

  if (!hasDiacritics(value)) {
    return true;
  }

  return (
    countCharacterDifferences(value.toLocaleLowerCase("sk-SK"), expected) <= 1
  );
}

function indexToLineColumn(content, index) {
  const lines = content.slice(0, index).split(/\r?\n/u);
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

function findCorrectionsInSegment(text, dictionary) {
  const findings = [];
  WORD_REGEX.lastIndex = 0;

  for (const match of text.matchAll(WORD_REGEX)) {
    const value = match[0] || "";
    const offset = match.index ?? 0;
    const expected = dictionary.get(normalizeLookupKey(value));

    if (!expected) {
      continue;
    }

    if (shouldIgnoreTokenContext(text, offset, value.length)) {
      continue;
    }

    if (!shouldCorrectValue(value, expected)) {
      continue;
    }

    findings.push({
      offset,
      value,
      expected: applyCase(value, expected),
    });
  }

  return findings;
}

function findAmbiguitiesInSegment(text, ambiguousLookup) {
  const findings = [];
  WORD_REGEX.lastIndex = 0;

  for (const match of text.matchAll(WORD_REGEX)) {
    const value = match[0] || "";
    const offset = match.index ?? 0;

    if (shouldIgnoreTokenContext(text, offset, value.length)) {
      continue;
    }

    if (hasDiacritics(value)) {
      continue;
    }

    const options = ambiguousLookup.get(normalizeLookupKey(value));
    if (!options || options.length === 0) {
      continue;
    }

    findings.push({
      offset,
      value,
      options,
    });
  }

  return findings;
}

function replaceInSegment(text, dictionary) {
  let replacements = 0;
  const nextText = text.replace(WORD_REGEX, (...args) => {
    const value = args[0];
    const offset = args[args.length - 2];
    const source = args[args.length - 1];

    if (typeof offset !== "number" || typeof source !== "string") {
      return value;
    }

    if (shouldIgnoreTokenContext(source, offset, value.length)) {
      return value;
    }

    const expected = dictionary.get(normalizeLookupKey(value));
    if (!expected) {
      return value;
    }

    if (!shouldCorrectValue(value, expected)) {
      return value;
    }

    replacements += 1;
    return applyCase(value, expected);
  });

  return {
    text: nextText,
    replacements,
  };
}

function replaceCodeSegments(content, dictionary) {
  let replacements = 0;

  const replaceStringLiteral = content.replace(STRING_LITERAL_REGEX, (literal) => {
    if (literal.length < 2) {
      return literal;
    }

    const quote = literal[0];
    const innerText = literal.slice(1, -1);
    const result = replaceInSegment(innerText, dictionary);
    replacements += result.replacements;
    return `${quote}${result.text}${quote}`;
  });

  const replaceJsxText = replaceStringLiteral.replace(JSX_TEXT_REGEX, (fullMatch, innerText) => {
    const result = replaceInSegment(innerText, dictionary);
    replacements += result.replacements;
    return `>${result.text}<`;
  });

  return {
    content: replaceJsxText,
    replacements,
  };
}

function applyFixes({ content, extension, dictionary }) {
  if (!CODE_EXTENSIONS.has(extension)) {
    return replaceInSegment(content, dictionary);
  }

  return replaceCodeSegments(content, dictionary);
}

function findMissingDiacritics({ content, extension, dictionary }) {
  const findings = [];

  for (const segment of extractSegments(content, extension)) {
    const segmentFindings = findCorrectionsInSegment(segment.text, dictionary);

    for (const finding of segmentFindings) {
      const position = indexToLineColumn(content, segment.startIndex + finding.offset);
      const contextLine = content.split(/\r?\n/u)[position.line - 1] ?? "";
      findings.push({
        line: position.line,
        column: position.column,
        value: finding.value,
        expected: finding.expected,
        context: contextLine.trim(),
      });
    }
  }

  return findings;
}

function findAmbiguousDiacritics({ content, extension, ambiguousLookup }) {
  const findings = [];

  for (const segment of extractSegments(content, extension)) {
    const segmentFindings = findAmbiguitiesInSegment(segment.text, ambiguousLookup);

    for (const finding of segmentFindings) {
      const position = indexToLineColumn(content, segment.startIndex + finding.offset);
      const contextLine = content.split(/\r?\n/u)[position.line - 1] ?? "";
      findings.push({
        line: position.line,
        column: position.column,
        value: finding.value,
        options: finding.options,
        context: contextLine.trim(),
      });
    }
  }

  return findings;
}

function parseArgs(argv) {
  const paths = [];
  let dictionaryPath = DEFAULT_DICTIONARY_PATH;
  let writeMode = false;

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
      continue;
    }

    if (argument === "--write") {
      writeMode = true;
    }
  }

  return {
    targetPaths: paths.length > 0 ? paths : DEFAULT_TARGET_DIRECTORIES,
    dictionaryPath,
    writeMode,
  };
}

function deriveDictionaryFromFiles(files) {
  const candidateCounts = new Map();
  const plainCounts = new Map();

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const extension = path.extname(filePath).toLowerCase();

    for (const segment of extractSegments(content, extension)) {
      WORD_REGEX.lastIndex = 0;

      for (const match of segment.text.matchAll(WORD_REGEX)) {
        const word = (match[0] || "").toLocaleLowerCase("sk-SK");
        const key = normalizeLookupKey(word);
        if (key === "") {
          continue;
        }

        if (!containsSlovakDiacritics(word)) {
          plainCounts.set(key, (plainCounts.get(key) ?? 0) + 1);
          continue;
        }

        const options = candidateCounts.get(key) ?? new Map();
        options.set(word, (options.get(word) ?? 0) + 1);
        candidateCounts.set(key, options);
      }
    }
  }

  const derivedDictionary = new Map();
  const ambiguousLookup = new Map();

  for (const [key, options] of candidateCounts.entries()) {
    if (key.length < MIN_DERIVED_KEY_LENGTH) {
      continue;
    }

    if (options.size !== 1) {
      if ((plainCounts.get(key) ?? 0) > 0) {
        ambiguousLookup.set(
          key,
          [...options.keys()]
            .sort((left, right) => left.localeCompare(right, "sk-SK"))
            .slice(0, MAX_AMBIGUOUS_OPTIONS),
        );
      }
      continue;
    }

    const [[winner, winnerCount]] = [...options.entries()];
    if ((plainCounts.get(key) ?? 0) > winnerCount) {
      continue;
    }

    if (winner) {
      derivedDictionary.set(key, winner);
    }
  }

  return {
    derivedDictionary,
    ambiguousLookup,
  };
}

function buildCombinedDictionary(files, dictionaryPath) {
  const manualDictionary = loadDictionary(path.resolve(ROOT, dictionaryPath));
  const { derivedDictionary, ambiguousLookup } = deriveDictionaryFromFiles(files);
  for (const key of manualDictionary.keys()) {
    ambiguousLookup.delete(key);
  }

  return {
    dictionary: new Map([...derivedDictionary, ...manualDictionary]),
    ambiguousLookup,
  };
}

function runCheck({ targetPaths, dictionaryPath, writeMode = false }) {
  const allFiles = targetPaths.flatMap((targetPath) =>
    collectTextFiles(path.resolve(ROOT, targetPath)),
  );
  const files = allFiles.filter((filePath) => shouldCheckFile(filePath));
  const { dictionary, ambiguousLookup } = buildCombinedDictionary(files, dictionaryPath);

  let fixedFiles = 0;
  let replacements = 0;
  const failures = [];
  const ambiguousFailures = [];

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const originalContent = fs.readFileSync(filePath, "utf8");
    let currentContent = originalContent;

    if (writeMode) {
      const fixed = applyFixes({
        content: originalContent,
        extension,
        dictionary,
      });
      currentContent = fixed.text ?? fixed.content;

      if (fixed.replacements > 0 && currentContent !== originalContent) {
        fs.writeFileSync(filePath, currentContent, "utf8");
        fixedFiles += 1;
        replacements += fixed.replacements;
      }
    }

    const findings = findMissingDiacritics({
      content: currentContent,
      extension,
      dictionary,
    });
    const ambiguousFindings = findAmbiguousDiacritics({
      content: currentContent,
      extension,
      ambiguousLookup,
    });

    if (findings.length > 0) {
      failures.push({
        file: path.relative(ROOT, filePath),
        findings,
      });
    }

    if (ambiguousFindings.length > 0) {
      ambiguousFailures.push({
        file: path.relative(ROOT, filePath),
        findings: ambiguousFindings,
      });
    }
  }

  return {
    failures,
    ambiguousFailures,
    fixedFiles,
    replacements,
  };
}

function printReport(failures, ambiguousFailures) {
  let printed = 0;
  if (failures.length > 0) {
    console.error(
      "sk-diacritics-check: found words without Slovak diacritics:",
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

  if (ambiguousFailures.length > 0) {
    console.error(
      "sk-diacritics-check: ambiguous Slovak words require review:",
    );

    for (const failure of ambiguousFailures) {
      for (const finding of failure.findings) {
        if (printed >= MAX_PRINTED_FINDINGS) {
          console.error(
            `... output truncated after ${MAX_PRINTED_FINDINGS} findings, run with narrower --path if needed.`,
          );
          return;
        }

        console.error(
          `${failure.file}:${finding.line}:${finding.column} "${finding.value}" -> review [${finding.options.join(", ")}]`,
        );
        printed += 1;
      }
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(path.resolve(ROOT, args.dictionaryPath))) {
    console.error(`sk-diacritics-check: dictionary not found: ${args.dictionaryPath}`);
    process.exit(1);
  }

  const result = runCheck(args);
  if (args.writeMode) {
    console.log(
      `sk-diacritics-check: applied ${result.replacements} replacement(s) in ${result.fixedFiles} file(s)`,
    );
  }

  if (result.failures.length > 0 || result.ambiguousFailures.length > 0) {
    printReport(result.failures, result.ambiguousFailures);
    process.exit(1);
  }

  console.log("sk-diacritics-check: OK");
}

if (process.argv[1] === __filename) {
  main();
}

export {
  applyFixes,
  buildWordRegex,
  findAmbiguousDiacritics,
  findMissingDiacritics,
  loadDictionary,
  normalizeDictionary,
  parseArgs,
  runCheck,
  shouldCheckFile,
  shouldIgnoreTokenContext,
};
