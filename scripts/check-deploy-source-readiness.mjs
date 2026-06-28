#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEFERRED_TAXONOMY_PATTERNS = [
  /^scripts\/discover-(?:autobazar-eu|mobile-de|otomoto|wikidata)-taxonomy\.ts$/u,
  /^scripts\/promote-approved-taxonomy-candidates\.ts$/u,
  /^src\/lib\/vehicle-taxonomy\/(?:autobazar-eu|candidate-store|candidates|mobile-de|normalize|otomoto|wikidata)(?:\.test)?\.ts$/u,
  /^src\/lib\/vehicle-taxonomy\/public\.test\.ts$/u,
  /^supabase\/migrations\/20260619214332_add_vehicle_taxonomy_metadata\.sql$/u,
];
const REQUIRED_VERCELIGNORE_PATTERNS = [
  "supabase/**",
  "scripts/discover-*-taxonomy.ts",
  "scripts/promote-approved-taxonomy-candidates.ts",
  "scripts/import-jato-taxonomy.ts",
  "src/lib/vehicle-taxonomy/autobazar-eu*.ts",
  "src/lib/vehicle-taxonomy/candidate-store*.ts",
  "src/lib/vehicle-taxonomy/candidates*.ts",
  "src/lib/vehicle-taxonomy/mobile-de*.ts",
  "src/lib/vehicle-taxonomy/normalize.ts",
  "src/lib/vehicle-taxonomy/otomoto*.ts",
  "src/lib/vehicle-taxonomy/public.test.ts",
  "src/lib/vehicle-taxonomy/wikidata.ts",
];

export function parseGitStatusShortBranch(statusShortBranch) {
  const branchLine = statusShortBranch
    .split(/\r?\n/u)
    .find((line) => line.startsWith("## "));

  if (!branchLine) {
    return {
      branch: null,
      upstream: null,
      ahead: 0,
      behind: 0,
    };
  }

  const withoutPrefix = branchLine.slice(3).trim();
  const stateMatch = withoutPrefix.match(/\s+\[(?<state>[^\]]+)\]$/u);
  const state = stateMatch?.groups?.state ?? "";
  const branchSpec = stateMatch ? withoutPrefix.slice(0, stateMatch.index).trim() : withoutPrefix;
  const [branch, upstream = null] = branchSpec.split("...");

  return {
    branch: branch || null,
    upstream,
    ahead: parseStateCount(state, "ahead"),
    behind: parseStateCount(state, "behind"),
  };
}

function parseStateCount(state, label) {
  const match = state.match(new RegExp(`(?:^|,\\s*)${label}\\s+(\\d+)`, "u"));
  return match ? Number.parseInt(match[1], 10) : 0;
}

function countNameStatus(nameStatus) {
  return nameStatus
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function normalizePaths(paths) {
  if (Array.isArray(paths)) {
    return paths.map((filePath) => filePath.replaceAll("\\", "/")).filter(Boolean);
  }

  return String(paths ?? "")
    .split(/\r?\n/u)
    .map((filePath) => filePath.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function findDeferredTaxonomyPaths(paths) {
  return paths.filter((filePath) =>
    DEFERRED_TAXONOMY_PATTERNS.some((pattern) => pattern.test(filePath)),
  );
}

function parseVercelIgnorePatterns(content) {
  return new Set(
    String(content ?? "")
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#")),
  );
}

function findMissingVercelIgnorePatterns(content) {
  const configuredPatterns = parseVercelIgnorePatterns(content);
  return REQUIRED_VERCELIGNORE_PATTERNS.filter(
    (pattern) => !configuredPatterns.has(pattern),
  );
}

export function analyzeDeploySourceReadiness({
  statusShortBranch,
  stagedNameStatus,
  unstagedNameStatus,
  untrackedPaths,
  hasVercelIgnore,
  vercelIgnoreContent,
  projectName,
  projectId,
}) {
  const branch = parseGitStatusShortBranch(statusShortBranch);
  const stagedFiles = countNameStatus(stagedNameStatus);
  const unstagedFiles = countNameStatus(unstagedNameStatus);
  const normalizedUntrackedPaths = normalizePaths(untrackedPaths);
  const untrackedFiles = normalizedUntrackedPaths.length;
  const deferredTaxonomyPaths = findDeferredTaxonomyPaths(normalizedUntrackedPaths);
  const findings = [];

  if (!hasVercelIgnore) {
    findings.push("No root .vercelignore found; Vercel CLI source deploy relies on default exclusions only.");
  } else {
    const missingVercelIgnorePatterns = findMissingVercelIgnorePatterns(vercelIgnoreContent);
    if (missingVercelIgnorePatterns.length > 0) {
      findings.push(
        `Missing .vercelignore launch-risk exclusions: ${missingVercelIgnorePatterns.join(", ")}`,
      );
    }
  }

  if (stagedFiles > 0 || unstagedFiles > 0 || untrackedFiles > 0) {
    findings.push(
      "Dirty deploy source: staged, unstaged, or untracked project files are present.",
    );
  }

  if (deferredTaxonomyPaths.length > 0) {
    findings.push(`Deferred taxonomy source present: ${deferredTaxonomyPaths.join(", ")}`);
  }

  const evidence = [
    `deploy-source-readiness: ${findings.length === 0 ? "OK" : "BLOCKED"}`,
    `project=${projectName ?? "unknown"} (${projectId ?? "unknown"})`,
    `branch=${branch.branch ?? "unknown"} upstream=${branch.upstream ?? "none"} ahead=${branch.ahead} behind=${branch.behind}`,
    `stagedFiles=${stagedFiles}`,
    `unstagedFiles=${unstagedFiles}`,
    `untrackedFiles=${untrackedFiles}`,
    ...findings,
  ].join("\n");

  return {
    ok: findings.length === 0,
    evidence,
  };
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 5,
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n").trim());
  }

  return result.stdout ?? "";
}

function readProjectJson() {
  const projectPath = path.join(process.cwd(), ".vercel", "project.json");
  if (!existsSync(projectPath)) {
    return {};
  }

  return JSON.parse(readFileSync(projectPath, "utf8"));
}

function parseArgs(argv) {
  const options = {
    json: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printUsage() {
  console.log(`Usage: npm run check:deploy-source-readiness -- [--json]

Checks whether the current Vercel CLI deploy source is clean enough for launch
approval. This command is read-only and does not deploy, push, migrate, or send.
`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const project = readProjectJson();
  const vercelIgnorePath = path.join(process.cwd(), ".vercelignore");
  const hasVercelIgnore = existsSync(vercelIgnorePath);
  const result = analyzeDeploySourceReadiness({
    statusShortBranch: runGit(["status", "--short", "--branch"]),
    stagedNameStatus: runGit(["diff", "--cached", "--name-status"]),
    unstagedNameStatus: runGit(["diff", "--name-status"]),
    untrackedPaths: runGit(["ls-files", "--others", "--exclude-standard"]),
    hasVercelIgnore,
    vercelIgnoreContent: hasVercelIgnore ? readFileSync(vercelIgnorePath, "utf8") : "",
    projectName: project.projectName,
    projectId: project.projectId,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.evidence);
  }
  process.exitCode = result.ok ? 0 : 1;
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entrypoint === fileURLToPath(import.meta.url)) {
  main();
}
