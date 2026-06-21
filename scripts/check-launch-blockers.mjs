#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEFAULT_MAX_EVIDENCE_LINES = 10;
const EXPECTED_LOCAL_BRANCH = "master";
const EXPECTED_REMOTE_BRANCHES = ["origin/HEAD -> origin/master", "origin/master"];
const DETACHED_BRANCH_LABEL = "(detached)";
const REVIEW_SOURCE_BRANCH_PATTERN = /^codex\/launch-reviewed-source-/u;
const CLEANUP_SCAN_PATHS = [
  "src",
  "scripts",
  "tests",
  "supabase",
  "package.json",
  "next.config.ts",
  "vercel.json",
  "eslint.config.mjs",
  "vitest.config.ts",
  "playwright.config.ts",
  "tsconfig.json",
];
const CLEANUP_SCAN_EXCLUDED_PATHS = new Set([
  "scripts/check-launch-blockers.mjs",
  "scripts/check-launch-blockers.test.mjs",
  "scripts/links-ingest.test.mjs",
]);
const PACKAGE_SCRIPT_PATH_PATTERN =
  /(?:^|(?<=[\s"'(=]))((?:config|scripts|src|tests|tools)\/[A-Za-z0-9._@%+/-]+\.(?:cjs|js|json|mjs|ps1|ts|tsx))(?=$|[\s"',)])/gu;
const CLEANUP_MARKERS = [
  {
    label: "unfinished-code marker",
    pattern: /\b(?:TODO|FIXME|HACK)\b/u,
  },
  {
    label: "focused-test leftover",
    pattern: /\b(?:test|it|describe)\.only\s*\(/u,
  },
  {
    label: "TypeScript/eslint suppression",
    pattern: /(?:eslint-disable|@ts-ignore|@ts-expect-error)/u,
  },
  {
    label: "placeholder implementation marker",
    pattern: /(?:not implemented|placeholder implementation|fake implementation|stubbed implementation)/iu,
  },
  {
    label: "untyped Supabase helper usage",
    pattern: /(?:createUntypedSupabase|SupabaseClient\s*<\s*any|SupabaseClient\s*<\s*Database\s*,\s*any)/u,
  },
];

export function buildLaunchBlockerChecks({
  includeVercelBuild = false,
  allowExtraWorktrees = false,
} = {}) {
  const checks = [
    {
      id: "branch-worktree-state",
      label: "Branch/worktree cleanup state",
      commandLine:
        "git branch -vv && git branch -r && git worktree list --porcelain" +
        (allowExtraWorktrees ? " [allow extra review-source worktrees]" : ""),
      run: () => runBranchWorktreeCheck({ allowExtraWorktrees }),
      mutates: false,
    },
    {
      id: "deploy-source-readiness",
      label: "Vercel deploy source readiness",
      command: "npm",
      args: ["run", "check:deploy-source-readiness"],
      mutates: false,
    },
    {
      id: "package-script-file-tracking",
      label: "Package-referenced script files are present, tracked, and git-visible",
      commandLine: "package.json local script entrypoint tracking check",
      run: runPackageScriptFileTrackingCheck,
      mutates: false,
    },
    {
      id: "tracked-cleanup-posture",
      label: "Tracked/untracked cleanup/refactor marker posture",
      commandLine: "tracked/untracked launch-code cleanup scan",
      run: runTrackedCleanupCheck,
      mutates: false,
    },
    {
      id: "working-tree-diff-check",
      label: "Working tree whitespace/conflict-marker check",
      command: "git",
      args: ["diff", "--check"],
      mutates: false,
    },
    {
      id: "launch-test-coverage",
      label: "Launch account/data coverage",
      command: "npm",
      args: ["run", "check:launch-test-coverage", "--", "--require-complete"],
      mutates: false,
    },
    {
      id: "security-release-gate",
      label: "Security release gate",
      command: "npm",
      args: ["run", "test:security:release-gate"],
      mutates: false,
    },
    {
      id: "dependency-security-audit",
      label: "Dependency security audit",
      command: "npm",
      args: ["audit", "--json"],
      mutates: false,
    },
    {
      id: "payment-release-suite",
      label: "Payment checkout/webhook release suite",
      command: "npm",
      args: ["run", "test:payments-release"],
      mutates: false,
    },
    {
      id: "cron-email-release-suite",
      label: "Cron/email release suite",
      command: "npm",
      args: ["run", "test:cron-email-release"],
      mutates: false,
    },
    {
      id: "fallback-registry",
      label: "Fallback registry governance",
      command: "npm",
      args: ["run", "list:fallbacks"],
      mutates: false,
    },
    {
      id: "algolia-search",
      label: "Algolia/Supabase search parity",
      command: "npm",
      args: ["run", "check:algolia-search"],
      mutates: false,
    },
    {
      id: "seo-geo-local-gate",
      label: "SEO/GEO local taxonomy and sitemap gate",
      command: "npm",
      args: ["run", "test:seo-taxonomy"],
      mutates: false,
    },
    {
      id: "local-launch-smoke-targets",
      label: "Local launch smoke target coverage",
      command: "npm",
      args: ["run", "test:local-launch-smoke-script"],
      mutates: false,
    },
    {
      id: "upload-release-suite",
      label: "Image upload release suite",
      command: "npm",
      args: ["run", "test:uploads-release"],
      mutates: false,
    },
    {
      id: "local-performance-budget",
      label: "Local performance budget gate",
      command: "npm",
      args: ["run", "check:performance-budgets"],
      mutates: false,
    },
    {
      id: "local-lint",
      label: "Local lint and static text/UI guards",
      command: "npm",
      args: ["run", "lint"],
      mutates: false,
    },
    {
      id: "local-typecheck",
      label: "Local TypeScript route/typecheck",
      command: "npm",
      args: ["run", "typecheck"],
      mutates: false,
    },
    {
      id: "local-production-build",
      label: "Local production build",
      command: "npm",
      args: ["run", "build"],
      mutates: false,
    },
    {
      id: "production-bundle-budget",
      label: "Production route bundle budget diagnostic",
      command: "npm",
      args: ["run", "check:production-bundle-budget"],
      mutates: false,
    },
    {
      id: "vercel-env-names",
      label: "Vercel env metadata names",
      command: "npm",
      args: ["run", "check:vercel-env-names"],
      mutates: false,
    },
    {
      id: "vercel-env-values",
      label: "Vercel Upstash pull-readable value and sensitive metadata check",
      command: "npm",
      args: ["run", "check:vercel-env-values"],
      mutates: false,
    },
    {
      id: "live-rls-posture",
      label: "Live Supabase anon RLS posture",
      command: "npm",
      args: ["run", "check:live-rls-posture", "--", "--json"],
      mutates: false,
    },
    {
      id: "vercel-ppr-lambda-blocker",
      label: "Vercel static-PPR lambda packaging blocker",
      command: "npm",
      args: ["run", "check:vercel-ppr-lambda-blocker"],
      mutates: false,
    },
  ];

  if (includeVercelBuild) {
    checks.push({
      id: "vercel-preview-build",
      label: "Vercel Preview local build preflight",
      command: "npm",
      args: ["run", "check:vercel-build-preview"],
      mutates: false,
    });
  }

  checks.push(
    {
      id: "launch-migration-worktree",
      label: "Launch migration worktree safety",
      command: "npm",
      args: ["run", "check:launch-migration-worktree"],
      mutates: false,
    },
  );

  return checks;
}

function parseLocalBranchLine(line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const withoutCurrentMarker = /^[*+]\s/u.test(trimmed)
    ? trimmed.slice(2).trim()
    : trimmed;
  if (
    withoutCurrentMarker.startsWith("(HEAD detached") ||
    withoutCurrentMarker.startsWith("(no branch)")
  ) {
    return null;
  }

  return withoutCurrentMarker.split(/\s+/u)[0] ?? null;
}

function parseCurrentBranch(localBranches) {
  const currentLine = localBranches
    .split(/\r?\n/u)
    .find((line) => line.trimStart().startsWith("* "));

  if (!currentLine) {
    return null;
  }

  const withoutCurrentMarker = currentLine.trim().slice(2).trim();
  if (
    withoutCurrentMarker.startsWith("(HEAD detached") ||
    withoutCurrentMarker.startsWith("(no branch)")
  ) {
    return DETACHED_BRANCH_LABEL;
  }

  return parseLocalBranchLine(currentLine);
}

function parseLocalBranches(localBranches) {
  return localBranches
    .split(/\r?\n/u)
    .map(parseLocalBranchLine)
    .filter(Boolean);
}

function parseRemoteBranches(remoteBranches) {
  return remoteBranches
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseWorktreeCount(worktrees) {
  return worktrees
    .split(/\r?\n/u)
    .filter((line) => line.startsWith("worktree "))
    .length;
}

function isAllowedReviewSourceCurrentBranch(currentBranch) {
  return currentBranch === EXPECTED_LOCAL_BRANCH ||
    currentBranch === DETACHED_BRANCH_LABEL ||
    REVIEW_SOURCE_BRANCH_PATTERN.test(currentBranch ?? "");
}

export function analyzeBranchWorktreeState({
  localBranches,
  remoteBranches,
  worktrees,
  allowExtraWorktrees = false,
}) {
  const currentBranch = parseCurrentBranch(localBranches);
  const localBranchNames = parseLocalBranches(localBranches);
  const remoteBranchNames = parseRemoteBranches(remoteBranches);
  const worktreeCount = parseWorktreeCount(worktrees);
  const errors = [];

  if (allowExtraWorktrees) {
    if (!isAllowedReviewSourceCurrentBranch(currentBranch)) {
      errors.push(
        `Expected current branch ${EXPECTED_LOCAL_BRANCH}, detached review source, ` +
          `or codex/launch-reviewed-source-* branch, found ${currentBranch ?? "none"}.`,
      );
    }
  } else if (currentBranch !== EXPECTED_LOCAL_BRANCH) {
    errors.push(`Expected current branch ${EXPECTED_LOCAL_BRANCH}, found ${currentBranch ?? "none"}.`);
  }

  const allowedLocalBranches = new Set([EXPECTED_LOCAL_BRANCH]);
  if (
    allowExtraWorktrees &&
    currentBranch &&
    REVIEW_SOURCE_BRANCH_PATTERN.test(currentBranch)
  ) {
    allowedLocalBranches.add(currentBranch);
  }

  const unexpectedLocalBranches = localBranchNames.filter(
    (branch) => !allowedLocalBranches.has(branch),
  );
  if (unexpectedLocalBranches.length > 0) {
    errors.push(`Unexpected local branches: ${unexpectedLocalBranches.join(", ")}`);
  }

  const unexpectedRemoteBranches = remoteBranchNames.filter(
    (branch) => !EXPECTED_REMOTE_BRANCHES.includes(branch),
  );
  if (unexpectedRemoteBranches.length > 0) {
    errors.push(`Unexpected remote branches: ${unexpectedRemoteBranches.join(", ")}`);
  }

  if (allowExtraWorktrees) {
    if (worktreeCount < 1) {
      errors.push(`Expected at least 1 worktree, found ${worktreeCount}.`);
    }
  } else if (worktreeCount !== 1) {
    errors.push(`Expected exactly 1 worktree, found ${worktreeCount}.`);
  }

  const summary = [
    `currentBranch=${currentBranch ?? "none"}`,
    `localBranches=${localBranchNames.join(",") || "none"}`,
    `remoteBranches=${remoteBranchNames.join(",") || "none"}`,
    `worktrees=${worktreeCount}`,
    ...(allowExtraWorktrees ? ["extraWorktreesAllowed=true"] : []),
  ];

  return {
    ok: errors.length === 0,
    evidence: [...summary, ...errors].join("\n"),
  };
}

function collectPackageScriptFileReferences(packageJson) {
  const scripts = packageJson?.scripts && typeof packageJson.scripts === "object"
    ? packageJson.scripts
    : {};
  const references = [];
  const seen = new Set();

  for (const [scriptName, command] of Object.entries(scripts)) {
    if (typeof command !== "string") {
      continue;
    }

    for (const match of command.matchAll(PACKAGE_SCRIPT_PATH_PATTERN)) {
      const filePath = normalizeRepoPath(match[1]);
      const key = `${scriptName}\0${filePath}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      references.push({ scriptName, filePath });
    }
  }

  return references;
}

export function analyzePackageScriptFileTracking({
  packageJson,
  existingPaths,
  ignoredPaths,
  trackedPaths = new Set(),
}) {
  const references = collectPackageScriptFileReferences(packageJson);
  const findings = [];

  for (const reference of references) {
    const label = `${reference.scriptName} -> ${reference.filePath}`;
    if (!existingPaths.has(reference.filePath)) {
      findings.push(`${label} is missing`);
      continue;
    }

    if (ignoredPaths.has(reference.filePath)) {
      findings.push(`${label} is ignored by git`);
      continue;
    }

    if (!trackedPaths.has(reference.filePath)) {
      findings.push(`${label} is untracked by git`);
    }
  }

  if (findings.length > 0) {
    return {
      ok: false,
      evidence: [
        "Package scripts reference local files that are missing, ignored, or untracked:",
        ...findings,
      ].join("\n"),
    };
  }

  return {
    ok: true,
    evidence:
      `Scanned ${references.length} package-referenced local file paths. ` +
      "All exist, are tracked, and are visible to git.",
  };
}

function normalizeRepoPath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function matchesCleanupScanPath(filePath) {
  const normalized = normalizeRepoPath(filePath);
  return CLEANUP_SCAN_PATHS.some(
    (scanPath) => normalized === scanPath || normalized.startsWith(`${scanPath}/`),
  );
}

function shouldScanCleanupPath(filePath) {
  const normalized = normalizeRepoPath(filePath);
  return matchesCleanupScanPath(normalized) && !CLEANUP_SCAN_EXCLUDED_PATHS.has(normalized);
}

export function mergeCleanupFilePaths({ trackedPaths, untrackedPaths }) {
  const paths = [];
  const seen = new Set();

  for (const rawPath of [...trackedPaths, ...untrackedPaths]) {
    if (!rawPath) {
      continue;
    }

    const normalized = normalizeRepoPath(rawPath);
    if (!shouldScanCleanupPath(normalized) || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    paths.push(normalized);
  }

  return paths;
}

function truncateLine(line) {
  const compact = line.trim();
  return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
}

export function analyzeTrackedCleanupPosture(files) {
  const findings = [];
  let scannedFiles = 0;

  for (const file of files) {
    if (!shouldScanCleanupPath(file.path)) {
      continue;
    }

    scannedFiles += 1;
    const lines = file.content.split(/\r?\n/u);
    lines.forEach((line, index) => {
      for (const marker of CLEANUP_MARKERS) {
        marker.pattern.lastIndex = 0;
        if (marker.pattern.test(line)) {
          findings.push(
            `${file.path}:${index + 1}: ${marker.label}: ${truncateLine(line)}`,
          );
          break;
        }
      }
    });
  }

  if (findings.length > 0) {
    return {
      ok: false,
      evidence: ["Found tracked/untracked cleanup/refactor markers:", ...findings].join("\n"),
    };
  }

  return {
    ok: true,
    evidence:
      `Scanned ${scannedFiles} tracked/untracked launch-code files. ` +
      "No unfinished-code markers, focused-test leftovers, TypeScript/eslint suppressions, " +
      "placeholder implementation markers, or explicit untyped Supabase helper usage found.",
  };
}

export function parseArgs(argv) {
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

    if (arg === "--include-vercel-build") {
      options.includeVercelBuild = true;
      continue;
    }

    if (arg === "--allow-extra-worktrees") {
      options.allowExtraWorktrees = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printUsage() {
  console.log(`Usage: npm run check:launch-blockers -- [--json] [--include-vercel-build] [--allow-extra-worktrees]

Runs the current non-mutating launch blocker checks and exits non-zero when any
check still blocks launch readiness. This command does not deploy, push, migrate,
send emails, or mutate provider state.

Options:
  --include-vercel-build  Also run the pinned local Vercel Preview build preflight.
  --allow-extra-worktrees Allow an explicit clean review-source worktree
                          (detached or codex/launch-reviewed-source-*) while
                          keeping branch cleanup strict by default.
`);
}

function quoteArg(arg) {
  if (/^[A-Za-z0-9:_./=+-]+$/u.test(arg)) {
    return arg;
  }

  return JSON.stringify(arg);
}

function commandLineFor(check) {
  if (check.commandLine) {
    return check.commandLine;
  }

  return [check.command, ...check.args].map(quoteArg).join(" ");
}

export function buildSpawnInvocation(command, args, platform = process.platform) {
  if (platform === "win32" && command === "npm") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", [command, ...args].map(quoteArg).join(" ")],
    };
  }

  return { command, args };
}

function runCheck(check) {
  if (check.run) {
    return check.run();
  }

  const invocation = buildSpawnInvocation(check.command, check.args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
    shell: false,
  });

  if (result.error) {
    return {
      exitCode: 1,
      stdout: result.stdout ?? "",
      stderr: `${result.stderr ?? ""}\n${result.error.message}`.trim(),
    };
  }

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
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

function runBranchWorktreeCheck({ allowExtraWorktrees = false } = {}) {
  const result = analyzeBranchWorktreeState({
    localBranches: runGit(["branch", "-vv"]),
    remoteBranches: runGit(["branch", "-r"]),
    worktrees: runGit(["worktree", "list", "--porcelain"]),
    allowExtraWorktrees,
  });

  return {
    exitCode: result.ok ? 0 : 1,
    stdout: result.evidence,
    stderr: "",
  };
}

function readGitIgnoredPaths(filePaths) {
  if (filePaths.length === 0) {
    return new Set();
  }

  const result = spawnSync("git", ["check-ignore", "--stdin"], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: `${filePaths.join("\n")}\n`,
    maxBuffer: 1024 * 1024,
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  const status = result.status ?? 1;
  if (status !== 0 && status !== 1) {
    throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n").trim());
  }

  return new Set(
    (result.stdout ?? "")
      .split(/\r?\n/u)
      .map(normalizeRepoPath)
      .filter(Boolean),
  );
}

function readGitTrackedPaths(filePaths) {
  if (filePaths.length === 0) {
    return new Set();
  }

  const result = spawnSync("git", ["ls-files", "-z", "--", ...filePaths], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n").trim());
  }

  return new Set(
    (result.stdout ?? "")
      .split("\0")
      .map(normalizeRepoPath)
      .filter(Boolean),
  );
}

function runPackageScriptFileTrackingCheck() {
  const packageJson = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
  const references = collectPackageScriptFileReferences(packageJson);
  const filePaths = [...new Set(references.map((reference) => reference.filePath))];
  const existingPaths = new Set(
    filePaths.filter((filePath) => existsSync(path.join(process.cwd(), filePath))),
  );
  const result = analyzePackageScriptFileTracking({
    packageJson,
    existingPaths,
    ignoredPaths: readGitIgnoredPaths(filePaths),
    trackedPaths: readGitTrackedPaths(filePaths),
  });

  return {
    exitCode: result.ok ? 0 : 1,
    stdout: result.evidence,
    stderr: "",
  };
}

function readTrackedCleanupFiles() {
  const trackedOutput = runGit(["ls-files", "-z", "--", ...CLEANUP_SCAN_PATHS]);
  const untrackedOutput = runGit([
    "ls-files",
    "--others",
    "--exclude-standard",
    "-z",
    "--",
    ...CLEANUP_SCAN_PATHS,
  ]);
  const trackedPaths = trackedOutput
    .split("\0")
    .filter(Boolean);
  const untrackedPaths = untrackedOutput
    .split("\0")
    .filter(Boolean);

  return mergeCleanupFilePaths({ trackedPaths, untrackedPaths })
    .map((filePath) => ({
      path: filePath,
      content: readFileSync(path.join(process.cwd(), filePath), "utf8"),
    }));
}

function runTrackedCleanupCheck() {
  const result = analyzeTrackedCleanupPosture(readTrackedCleanupFiles());

  return {
    exitCode: result.ok ? 0 : 1,
    stdout: result.evidence,
    stderr: "",
  };
}

function normalizeEvidence(result) {
  const evidence = [result.stdout, result.stderr]
    .filter((value) => value && value.trim())
    .join("\n")
    .trim();

  return evidence || `No output captured. exitCode=${result.exitCode}`;
}

export function evaluateLaunchBlockers(checks, { runner = runCheck } = {}) {
  const results = [];

  for (const check of checks) {
    let commandResult;
    try {
      commandResult = runner(check);
    } catch (error) {
      commandResult = {
        exitCode: 1,
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
      };
    }

    results.push({
      id: check.id,
      label: check.label,
      status: commandResult.exitCode === 0 ? "pass" : "blocker",
      commandLine: commandLineFor(check),
      mutates: check.mutates,
      exitCode: commandResult.exitCode,
      evidence: normalizeEvidence(commandResult),
    });
  }

  const ok = results.every((result) => result.status === "pass");

  return {
    ok,
    exitCode: ok ? 0 : 1,
    checks: results,
  };
}

function evidenceExcerpt(evidence, maxEvidenceLines) {
  const lines = evidence.split(/\r?\n/u);
  const shown = lines.slice(0, maxEvidenceLines);
  const omitted = lines.length - shown.length;

  if (omitted > 0) {
    shown.push(`... omitted ${omitted} more lines`);
  }

  return shown.map((line) => `  ${line}`).join("\n");
}

export function formatLaunchBlockerReport(
  result,
  { maxEvidenceLines = DEFAULT_MAX_EVIDENCE_LINES } = {},
) {
  const lines = [`launch-blockers: ${result.ok ? "OK" : "BLOCKED"}`];

  for (const check of result.checks) {
    lines.push("");
    lines.push(`[${check.status.toUpperCase()}] ${check.label}`);
    lines.push(`command: ${check.commandLine}`);
    lines.push(evidenceExcerpt(check.evidence, maxEvidenceLines));
  }

  return lines.join("\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const result = evaluateLaunchBlockers(buildLaunchBlockerChecks({
    includeVercelBuild: options.includeVercelBuild === true,
    allowExtraWorktrees: options.allowExtraWorktrees === true,
  }));
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatLaunchBlockerReport(result));
  }
  process.exitCode = result.exitCode;
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entrypoint === fileURLToPath(import.meta.url)) {
  main();
}
