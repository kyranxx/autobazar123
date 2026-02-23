#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_INPUT = "LINKS.md";
const DEFAULT_OUTPUT_DIR = "output/link_research/links-ingest";
const TRACKING_QUERY_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "s",
  "t",
]);

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value.trim());
}

export function normalizeUrl(rawValue) {
  const value = rawValue.trim();
  if (!isHttpUrl(value)) {
    return value.toLowerCase();
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return value.toLowerCase();
  }

  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.hash = "";

  const trimmedPath = parsed.pathname.replace(/\/+$/g, "");
  parsed.pathname = trimmedPath === "" ? "/" : trimmedPath;

  const keptParams = [];
  for (const [key, paramValue] of parsed.searchParams.entries()) {
    const lowerKey = key.toLowerCase();
    if (TRACKING_QUERY_KEYS.has(lowerKey)) {
      continue;
    }
    keptParams.push([key, paramValue]);
  }

  keptParams.sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });

  parsed.search = "";
  for (const [key, paramValue] of keptParams) {
    parsed.searchParams.append(key, paramValue);
  }

  return parsed.toString();
}

export function parseLinksMarkdown(content) {
  const lines = content.split(/\r?\n/);
  let section = "UNSCOPED";
  const entries = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionMatch = trimmed.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      section = sectionMatch[1].trim().toUpperCase();
      continue;
    }

    if (trimmed.startsWith("#")) continue;

    const kind = isHttpUrl(trimmed) ? "url" : "note";
    const normalized = kind === "url" ? normalizeUrl(trimmed) : trimmed.toLowerCase();

    entries.push({
      value: trimmed,
      section,
      kind,
      normalized,
    });
  }

  return entries;
}

export function buildSnapshot(entries) {
  const seen = new Map();
  const duplicates = [];
  const uniqueEntries = [];
  const countsBySection = {};

  for (const entry of entries) {
    countsBySection[entry.section] = (countsBySection[entry.section] || 0) + 1;

    if (seen.has(entry.normalized)) {
      duplicates.push({
        duplicate: entry,
        firstSeen: seen.get(entry.normalized),
      });
      continue;
    }

    seen.set(entry.normalized, entry);
    uniqueEntries.push(entry);
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      entries: entries.length,
      unique: uniqueEntries.length,
      duplicates: duplicates.length,
    },
    countsBySection,
    uniqueEntries,
    duplicates,
  };
}

export async function fetchPreview(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "accept": "text/markdown, text/plain, text/html;q=0.9",
        "user-agent": "autobazar123-links-ingest/1.0",
      },
      signal: controller.signal,
    });
    const body = await response.text();
    const compact = body.replace(/\s+/g, " ").trim();
    return {
      ok: response.ok,
      status: response.status,
      title: extractTitleFromBody(body),
      snippet: compact.slice(0, 280),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      title: null,
      snippet: null,
      error: String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractTitleFromBody(body) {
  const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) return titleMatch[1].trim();

  const markdownTitle = body.match(/^Title:\s*(.+)$/im);
  if (markdownTitle?.[1]) return markdownTitle[1].trim();

  return null;
}

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    outputDir: DEFAULT_OUTPUT_DIR,
    fetch: false,
    timeoutMs: 15000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input" && argv[i + 1]) {
      options.input = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--output-dir" && argv[i + 1]) {
      options.outputDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--timeout-ms" && argv[i + 1]) {
      options.timeoutMs = Number.parseInt(argv[i + 1], 10) || options.timeoutMs;
      i += 1;
      continue;
    }
    if (arg === "--fetch") {
      options.fetch = true;
    }
  }

  return options;
}

function buildSummaryMarkdown(inputPath, snapshot) {
  const lines = [];
  lines.push("# Links Ingestion Summary");
  lines.push("");
  lines.push(`- Input: \`${inputPath}\``);
  lines.push(`- Generated: ${snapshot.generatedAt}`);
  lines.push(`- Total entries: ${snapshot.totals.entries}`);
  lines.push(`- Unique entries: ${snapshot.totals.unique}`);
  lines.push(`- Duplicates: ${snapshot.totals.duplicates}`);
  lines.push("");
  lines.push("## Sections");
  lines.push("");

  for (const [section, count] of Object.entries(snapshot.countsBySection)) {
    lines.push(`- ${section}: ${count}`);
  }

  lines.push("");
  lines.push("## Duplicates");
  lines.push("");

  if (snapshot.duplicates.length === 0) {
    lines.push("- none");
  } else {
    for (const duplicate of snapshot.duplicates) {
      lines.push(
        `- \`${duplicate.duplicate.value}\` (first seen in ${duplicate.firstSeen.section})`,
      );
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

export async function runLinksIngest(cliArgs = process.argv.slice(2)) {
  const args = parseArgs(cliArgs);
  const inputPath = resolve(process.cwd(), args.input);
  const outputDir = resolve(process.cwd(), args.outputDir);
  mkdirSync(outputDir, { recursive: true });

  const content = readFileSync(inputPath, "utf8");
  const entries = parseLinksMarkdown(content);
  const snapshot = buildSnapshot(entries);

  if (args.fetch) {
    for (const entry of snapshot.uniqueEntries) {
      if (entry.kind !== "url") continue;
      // Sequential by default to avoid accidental endpoint bursts.
      entry.preview = await fetchPreview(entry.value, args.timeoutMs);
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const stampedOutput = join(outputDir, `links-snapshot-${stamp}.json`);
  const latestOutput = join(outputDir, "latest.json");
  const summaryOutput = join(outputDir, "summary.md");

  writeFileSync(stampedOutput, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  writeFileSync(latestOutput, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  writeFileSync(summaryOutput, buildSummaryMarkdown(args.input, snapshot), "utf8");

  return {
    snapshot,
    outputs: {
      stampedOutput,
      latestOutput,
      summaryOutput,
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runLinksIngest()
    .then((result) => {
      console.log("LINKS INGEST OK");
      console.log(`- Snapshot: ${result.outputs.stampedOutput}`);
      console.log(`- Latest:   ${result.outputs.latestOutput}`);
      console.log(`- Summary:  ${result.outputs.summaryOutput}`);
      console.log(`- Unique: ${result.snapshot.totals.unique}`);
      console.log(`- Duplicates: ${result.snapshot.totals.duplicates}`);
    })
    .catch((error) => {
      console.error("LINKS INGEST FAILED");
      console.error(error);
      process.exit(1);
    });
}
