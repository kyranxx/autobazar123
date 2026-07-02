#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const TARGET_DIRECTORIES = ["src"];
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mdx",
  ".txt",
]);
const EXCLUDED_PATH_SEGMENTS = new Set([
  "node_modules",
  ".next",
  ".git",
  "output",
  "dist",
  "build",
  "coverage",
]);
const SUSPICIOUS_PATTERN = /[\u0080-\u009f\u0139\u00C4\u00C5\u00C3\u0111\uFFFD]/u;
const LEGACY_ENCODINGS = ["cp1250-loose", "cp1250", "windows-1252", "latin1"];
const EXTRA_CHARACTERS = [
  "•",
  "→",
  "←",
  "§",
  "✓",
  "✅",
  "…",
  "„",
  "“",
  "”",
  "’",
  "‘",
  "–",
  "—",
  "€",
  "™",
  "⚡",
  "🏪",
  "⚙️",
  "⏱️",
  "✨",
  "⭐",
  "✉️",
  "📝",
  "📊",
  "📷",
  "👁️",
  "📈",
  "📍",
  "📤",
  "📅",
  "🌐",
  "🕐",
];

const DECODERS = {
  cp1250: new TextDecoder("windows-1250"),
  "windows-1252": new TextDecoder("windows-1252"),
  latin1: new TextDecoder("latin1"),
};
const REPAIR_MAP = buildRepairMap();

function buildRepairMap() {
  const map = new Map();
  const candidates = new Set(EXTRA_CHARACTERS);

  for (let codePoint = 0x00a0; codePoint <= 0x024f; codePoint += 1) {
    candidates.add(String.fromCodePoint(codePoint));
  }

  for (const char of candidates) {
    const utf8Bytes = Buffer.from(char, "utf8");
    for (const encoding of LEGACY_ENCODINGS) {
      const mojibake = decodeBytesAsLegacyText(utf8Bytes, encoding);
      if (
        mojibake !== char &&
        /[^\x00-\x7f]/u.test(mojibake) &&
        !map.has(mojibake)
      ) {
        map.set(mojibake, char);
      }
    }
  }

  return [...map.entries()].sort((left, right) => right[0].length - left[0].length);
}

function decodeBytesAsLegacyText(bytes, encoding) {
  if (encoding !== "cp1250-loose") {
    return DECODERS[encoding].decode(bytes);
  }

  let decoded = "";
  for (const byte of bytes) {
    const single = DECODERS.cp1250.decode(Uint8Array.from([byte]));
    if ((single === "?" || single === "\uFFFD") && byte !== 0x3f) {
      decoded += String.fromCharCode(byte);
      continue;
    }
    decoded += single;
  }
  return decoded;
}

function shouldSkipPath(filePath) {
  const normalized = filePath.split(path.sep);
  return normalized.some((segment) => EXCLUDED_PATH_SEGMENTS.has(segment));
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

function repairText(text) {
  let repaired = text;
  for (let pass = 0; pass < 3; pass += 1) {
    let changedInPass = false;

    for (const [bad, good] of REPAIR_MAP) {
      if (!repaired.includes(bad)) {
        continue;
      }
      const next = repaired.split(bad).join(good);
      if (next !== repaired) {
        repaired = next;
        changedInPass = true;
      }
    }

    if (!changedInPass) {
      break;
    }
  }

  return repaired;
}

function findMojibakeLines(text) {
  const lines = text.split(/\r?\n/u);
  const findings = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (SUSPICIOUS_PATTERN.test(lines[index])) {
      findings.push({
        line: index + 1,
        text: lines[index].trim(),
      });
    }
  }

  return findings;
}

function main() {
  const writeMode = process.argv.includes("--write");
  const files = TARGET_DIRECTORIES.flatMap((directory) =>
    collectTextFiles(path.join(ROOT, directory)),
  );

  let repairedFiles = 0;
  const failures = [];

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, "utf8");
    const repaired = repairText(original);
    const relativePath = path.relative(ROOT, filePath);

    if (writeMode && repaired !== original) {
      fs.writeFileSync(filePath, repaired, "utf8");
      repairedFiles += 1;
    }

    const findings = findMojibakeLines(writeMode ? repaired : original);
    if (findings.length > 0) {
      failures.push({
        file: relativePath,
        findings,
      });
    }
  }

  if (writeMode) {
    console.log(`text-encoding-guard: repaired ${repairedFiles} file(s)`);
  }

  if (failures.length > 0) {
    console.error("text-encoding-guard: detected suspicious mojibake markers:");
    for (const failure of failures) {
      for (const finding of failure.findings.slice(0, 5)) {
        console.error(`${failure.file}:${finding.line}: ${finding.text}`);
      }
      if (failure.findings.length > 5) {
        console.error(
          `${failure.file}: ... ${failure.findings.length - 5} additional line(s) omitted`,
        );
      }
    }
    process.exit(1);
  }

  console.log("text-encoding-guard: OK");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export { findMojibakeLines, repairText };
