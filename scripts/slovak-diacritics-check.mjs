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
const STRING_LITERAL_REGEX = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/gu;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasDiacritics(value) {
  return /[\u0300-\u036f]/u.test(value.normalize("NFD"));
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
  for (const match of line.matchAll(STRING_LITERAL_REGEX)) {
    const matchText = match[0] || "";
    const offset = match.index ?? 0;
    const innerText = matchText.length >= 2 ? matchText.slice(1, -1) : "";
    segments.push({ text: innerText, offset: offset + 1 });
  }

  return segments;
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

function replaceInSegment(text, dictionary, wordRegex) {
  if (!wordRegex) {
    return { text, replacements: 0 };
  }

  let replacements = 0;
  const nextText = text.replace(wordRegex, (...args) => {
    const value = args[0];
    const offset = args[args.length - 2];
    const source = args[args.length - 1];

    if (typeof offset !== "number" || typeof source !== "string") {
      return value;
    }

    if (shouldIgnoreTokenContext(source, offset, value.length)) {
      return value;
    }

    const expected = dictionary.get(value.toLowerCase());
    if (!expected || value === expected || hasDiacritics(value)) {
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

function applyFixes({ content, extension, dictionary, wordRegex }) {
  if (!wordRegex) {
    return {
      content,
      replacements: 0,
    };
  }

  if (!CODE_EXTENSIONS.has(extension)) {
    return replaceInSegment(content, dictionary, wordRegex);
  }

  let replacements = 0;
  const nextContent = content.replace(STRING_LITERAL_REGEX, (literal) => {
    if (literal.length < 2) {
      return literal;
    }

    const quote = literal[0];
    const innerText = literal.slice(1, -1);
    const result = replaceInSegment(innerText, dictionary, wordRegex);
    replacements += result.replacements;
    return `${quote}${result.text}${quote}`;
  });

  return {
    content: nextContent,
    replacements,
  };
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
        const offset = match.index ?? 0;
        const key = value.toLowerCase();
        const expected = dictionary.get(key);
        if (!expected || value === expected || hasDiacritics(value)) {
          continue;
        }

        if (shouldIgnoreTokenContext(segment.text, offset, value.length)) {
          continue;
        }

        findings.push({
          line: lineIndex + 1,
          column: segment.offset + offset + 1,
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

function runCheck({ targetPaths, dictionaryPath, writeMode = false }) {
  const dictionary = loadDictionary(path.resolve(ROOT, dictionaryPath));
  const wordRegex = buildWordRegex(dictionary);
  const files = targetPaths.flatMap((targetPath) =>
    collectTextFiles(path.resolve(ROOT, targetPath)),
  );

  let fixedFiles = 0;
  let replacements = 0;
  const failures = [];

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const originalContent = fs.readFileSync(filePath, "utf8");
    let currentContent = originalContent;

    if (writeMode) {
      const fixed = applyFixes({
        content: originalContent,
        extension,
        dictionary,
        wordRegex,
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
      wordRegex,
    });

    if (findings.length > 0) {
      failures.push({
        file: path.relative(ROOT, filePath),
        findings,
      });
    }
  }

  return {
    failures,
    fixedFiles,
    replacements,
  };
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

  const result = runCheck(args);
  if (args.writeMode) {
    console.log(
      `sk-diacritics-check: applied ${result.replacements} replacement(s) in ${result.fixedFiles} file(s)`,
    );
  }

  if (result.failures.length > 0) {
    printReport(result.failures);
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
  findMissingDiacritics,
  loadDictionary,
  normalizeDictionary,
  parseArgs,
  runCheck,
  shouldIgnoreTokenContext,
};
