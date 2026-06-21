import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeBranchWorktreeState,
  analyzePackageScriptFileTracking,
  analyzeTrackedCleanupPosture,
  buildLaunchBlockerChecks,
  buildSpawnInvocation,
  evaluateLaunchBlockers,
  formatLaunchBlockerReport,
  mergeCleanupFilePaths,
  parseArgs,
} from "./check-launch-blockers.mjs";

test("buildLaunchBlockerChecks includes the known non-mutating launch gates", () => {
  const checks = buildLaunchBlockerChecks();
  const ids = checks.map((check) => check.id);

  assert.deepEqual(ids, [
    "branch-worktree-state",
    "deploy-source-readiness",
    "package-script-file-tracking",
    "tracked-cleanup-posture",
    "working-tree-diff-check",
    "launch-test-coverage",
    "security-release-gate",
    "dependency-security-audit",
    "payment-release-suite",
    "cron-email-release-suite",
    "fallback-registry",
    "algolia-search",
    "seo-geo-local-gate",
    "local-launch-smoke-targets",
    "upload-release-suite",
    "local-performance-budget",
    "local-lint",
    "local-typecheck",
    "local-production-build",
    "production-bundle-budget",
    "vercel-env-names",
    "vercel-env-values",
    "live-rls-posture",
    "vercel-ppr-lambda-blocker",
    "launch-migration-worktree",
  ]);
  assert.ok(checks.every((check) => check.mutates === false));
  assert.deepEqual(
    checks.find((check) => check.id === "deploy-source-readiness"),
    {
      id: "deploy-source-readiness",
      label: "Vercel deploy source readiness",
      command: "npm",
      args: ["run", "check:deploy-source-readiness"],
      mutates: false,
    },
  );
  assert.deepEqual(
    checks.find((check) => check.id === "package-script-file-tracking"),
    {
      id: "package-script-file-tracking",
      label: "Package-referenced script files are present, tracked, and git-visible",
      commandLine: "package.json local script entrypoint tracking check",
      run: checks.find((check) => check.id === "package-script-file-tracking").run,
      mutates: false,
    },
  );
  assert.deepEqual(
    checks.find((check) => check.id === "working-tree-diff-check"),
    {
      id: "working-tree-diff-check",
      label: "Working tree whitespace/conflict-marker check",
      command: "git",
      args: ["diff", "--check"],
      mutates: false,
    },
  );
  assert.deepEqual(
    checks.find((check) => check.id === "upload-release-suite"),
    {
      id: "upload-release-suite",
      label: "Image upload release suite",
      command: "npm",
      args: ["run", "test:uploads-release"],
      mutates: false,
    },
  );
  assert.deepEqual(
    checks.find((check) => check.id === "local-performance-budget"),
    {
      id: "local-performance-budget",
      label: "Local performance budget gate",
      command: "npm",
      args: ["run", "check:performance-budgets"],
      mutates: false,
    },
  );
  assert.deepEqual(
    checks.find((check) => check.id === "production-bundle-budget"),
    {
      id: "production-bundle-budget",
      label: "Production route bundle budget diagnostic",
      command: "npm",
      args: ["run", "check:production-bundle-budget"],
      mutates: false,
    },
  );
  assert.deepEqual(
    checks.find((check) => check.id === "vercel-env-names"),
    {
      id: "vercel-env-names",
      label: "Vercel env metadata names",
      command: "npm",
      args: ["run", "check:vercel-env-names"],
      mutates: false,
    },
  );
  assert.deepEqual(
    checks.find((check) => check.id === "vercel-env-values"),
    {
      id: "vercel-env-values",
      label: "Vercel Upstash pull-readable value and sensitive metadata check",
      command: "npm",
      args: ["run", "check:vercel-env-values"],
      mutates: false,
    },
  );
});

test("buildLaunchBlockerChecks can include the full Vercel Preview build preflight", () => {
  const checks = buildLaunchBlockerChecks({ includeVercelBuild: true });
  const ids = checks.map((check) => check.id);

  assert.deepEqual(
    ids.slice(-3),
    [
      "vercel-ppr-lambda-blocker",
      "vercel-preview-build",
      "launch-migration-worktree",
    ],
  );
  assert.deepEqual(
    checks.find((check) => check.id === "vercel-preview-build"),
    {
      id: "vercel-preview-build",
      label: "Vercel Preview local build preflight",
      command: "npm",
      args: ["run", "check:vercel-build-preview"],
      mutates: false,
    },
  );
});

test("analyzePackageScriptFileTracking passes for present unignored local script entrypoints", () => {
  const result = analyzePackageScriptFileTracking({
    packageJson: {
      scripts: {
        "check:alpha": "node scripts/alpha.mjs",
        "test:beta": "npx tsx --test scripts/beta.test.ts",
        "test:route": "vitest run src/app/example/route.test.ts",
        "test:cron":
          "vitest run src/app/api/cron/send-alerts/route.test.ts src/lib/cron/route-helpers.test.ts src/lib/fallbacks/registry.test.ts",
      },
    },
    existingPaths: new Set([
      "scripts/alpha.mjs",
      "scripts/beta.test.ts",
      "src/app/example/route.test.ts",
      "src/app/api/cron/send-alerts/route.test.ts",
      "src/lib/cron/route-helpers.test.ts",
      "src/lib/fallbacks/registry.test.ts",
    ]),
    ignoredPaths: new Set(),
    trackedPaths: new Set([
      "scripts/alpha.mjs",
      "scripts/beta.test.ts",
      "src/app/example/route.test.ts",
      "src/app/api/cron/send-alerts/route.test.ts",
      "src/lib/cron/route-helpers.test.ts",
      "src/lib/fallbacks/registry.test.ts",
    ]),
  });

  assert.equal(result.ok, true);
  assert.match(result.evidence, /Scanned 6 package-referenced local file paths/u);
});

test("analyzePackageScriptFileTracking flags missing, gitignored, and untracked local script entrypoints", () => {
  const result = analyzePackageScriptFileTracking({
    packageJson: {
      scripts: {
        "check:missing": "node scripts/missing.mjs",
        "test:ignored": "npx tsx --test scripts/ignored.test.ts",
        "test:untracked": "node scripts/untracked.mjs",
        "external": "npx vercel@54.14.5 build --target=preview --yes",
      },
    },
    existingPaths: new Set(["scripts/ignored.test.ts", "scripts/untracked.mjs"]),
    ignoredPaths: new Set(["scripts/ignored.test.ts"]),
    trackedPaths: new Set(["scripts/ignored.test.ts"]),
  });

  assert.equal(result.ok, false);
  assert.match(result.evidence, /check:missing -> scripts\/missing\.mjs is missing/u);
  assert.match(result.evidence, /test:ignored -> scripts\/ignored\.test\.ts is ignored by git/u);
  assert.match(result.evidence, /test:untracked -> scripts\/untracked\.mjs is untracked by git/u);
  assert.doesNotMatch(result.evidence, /vercel/u);
});

test("analyzeBranchWorktreeState passes for the intended cleaned master-only state", () => {
  const result = analyzeBranchWorktreeState({
    localBranches: "* master b3f3cbb [origin/master: ahead 63] test subject\n",
    remoteBranches: "  origin/HEAD -> origin/master\n  origin/master\n",
    worktrees:
      "worktree C:/Users/User/Desktop/Projects/autobazar123\n" +
      "HEAD b3f3cbb8298165b2831ab21cb0c8a6509d6637ea\n" +
      "branch refs/heads/master\n",
  });

  assert.equal(result.ok, true);
  assert.match(result.evidence, /currentBranch=master/u);
  assert.match(result.evidence, /localBranches=master/u);
  assert.match(result.evidence, /worktrees=1/u);
});

test("analyzeBranchWorktreeState fails on extra branches or worktrees", () => {
  const result = analyzeBranchWorktreeState({
    localBranches:
      "* master b3f3cbb [origin/master: ahead 63] test subject\n" +
      "  feature-old abcdef0 old work\n",
    remoteBranches:
      "  origin/HEAD -> origin/master\n" +
      "  origin/master\n" +
      "  origin/feature-old\n",
    worktrees:
      "worktree C:/repo/main\nHEAD abc\nbranch refs/heads/master\n\n" +
      "worktree C:/repo/extra\nHEAD def\ndetached\n",
  });

  assert.equal(result.ok, false);
  assert.match(result.evidence, /Unexpected local branches: feature-old/u);
  assert.match(result.evidence, /Unexpected remote branches: origin\/feature-old/u);
  assert.match(result.evidence, /Expected exactly 1 worktree, found 2/u);
});

test("analyzeBranchWorktreeState allows extra worktrees only for reviewed deploy-source mode", () => {
  const result = analyzeBranchWorktreeState({
    localBranches: "* master b3f3cbb [origin/master: ahead 63] test subject\n",
    remoteBranches: "  origin/HEAD -> origin/master\n  origin/master\n",
    worktrees:
      "worktree C:/repo/main\nHEAD abc\nbranch refs/heads/master\n\n" +
      "worktree C:/repo/review-source\nHEAD abc\ndetached\n",
    allowExtraWorktrees: true,
  });

  assert.equal(result.ok, true);
  assert.match(result.evidence, /worktrees=2/u);
  assert.match(result.evidence, /extraWorktreesAllowed=true/u);
});

test("analyzeBranchWorktreeState allows a detached reviewed deploy-source worktree in explicit mode", () => {
  const result = analyzeBranchWorktreeState({
    localBranches:
      "* (HEAD detached at 1234567) 1234567 reviewed launch source\n" +
      "  master b3f3cbb [origin/master: ahead 63] test subject\n",
    remoteBranches: "  origin/HEAD -> origin/master\n  origin/master\n",
    worktrees:
      "worktree C:/repo/main\nHEAD abc\nbranch refs/heads/master\n\n" +
      "worktree C:/repo/review-source\nHEAD 1234567\ndetached\n",
    allowExtraWorktrees: true,
  });

  assert.equal(result.ok, true);
  assert.match(result.evidence, /currentBranch=\(detached\)/u);
  assert.match(result.evidence, /localBranches=master/u);
});

test("analyzeBranchWorktreeState allows git branch -vv no-branch detached output in explicit mode", () => {
  const result = analyzeBranchWorktreeState({
    localBranches:
      "* (no branch) 1234567 reviewed launch source\n" +
      "  master b3f3cbb [origin/master: ahead 63] test subject\n",
    remoteBranches: "  origin/HEAD -> origin/master\n  origin/master\n",
    worktrees:
      "worktree C:/repo/main\nHEAD abc\nbranch refs/heads/master\n\n" +
      "worktree C:/repo/review-source\nHEAD 1234567\ndetached\n",
    allowExtraWorktrees: true,
  });

  assert.equal(result.ok, true);
  assert.match(result.evidence, /currentBranch=\(detached\)/u);
  assert.match(result.evidence, /localBranches=master/u);
});

test("analyzeBranchWorktreeState ignores git worktree plus markers on local branches", () => {
  const result = analyzeBranchWorktreeState({
    localBranches:
      "* (no branch) 1234567 reviewed launch source\n" +
      "+ master b3f3cbb (C:/repo/main) [origin/master: ahead 63] test subject\n",
    remoteBranches: "  origin/HEAD -> origin/master\n  origin/master\n",
    worktrees:
      "worktree C:/repo/main\nHEAD abc\nbranch refs/heads/master\n\n" +
      "worktree C:/repo/review-source\nHEAD 1234567\ndetached\n",
    allowExtraWorktrees: true,
  });

  assert.equal(result.ok, true);
  assert.match(result.evidence, /currentBranch=\(detached\)/u);
  assert.match(result.evidence, /localBranches=master/u);
});

test("analyzeBranchWorktreeState allows a launch review branch in explicit mode", () => {
  const result = analyzeBranchWorktreeState({
    localBranches:
      "  master b3f3cbb [origin/master: ahead 63] test subject\n" +
      "* codex/launch-reviewed-source-20260621 1234567 reviewed launch source\n",
    remoteBranches: "  origin/HEAD -> origin/master\n  origin/master\n",
    worktrees:
      "worktree C:/repo/main\nHEAD abc\nbranch refs/heads/master\n\n" +
      "worktree C:/repo/review-source\nHEAD 1234567\nbranch refs/heads/codex/launch-reviewed-source-20260621\n",
    allowExtraWorktrees: true,
  });

  assert.equal(result.ok, true);
  assert.match(result.evidence, /currentBranch=codex\/launch-reviewed-source-20260621/u);
  assert.match(result.evidence, /localBranches=master,codex\/launch-reviewed-source-20260621/u);
});

test("analyzeTrackedCleanupPosture passes clean tracked launch-code files", () => {
  const result = analyzeTrackedCleanupPosture([
    {
      path: "src/lib/example.ts",
      content: "export const value = '+421 XXX XXX XXX';\n",
    },
    {
      path: "scripts/links-ingest.test.mjs",
      content: "test('fixture uses TODO heading', () => '## TODO');\n",
    },
  ]);

  assert.equal(result.ok, true);
  assert.match(result.evidence, /Scanned 1 tracked\/untracked launch-code files/u);
});

test("analyzeTrackedCleanupPosture flags unfinished markers, focused tests, and suppressions", () => {
  const result = analyzeTrackedCleanupPosture([
    {
      path: "src/lib/example.ts",
      content:
        "// TODO remove before launch\n" +
        "test.only('focused', () => {});\n" +
        "// @ts-expect-error temporary type escape\n",
    },
  ]);

  assert.equal(result.ok, false);
  assert.match(result.evidence, /src\/lib\/example\.ts:1: unfinished-code marker/u);
  assert.match(result.evidence, /src\/lib\/example\.ts:2: focused-test leftover/u);
  assert.match(result.evidence, /src\/lib\/example\.ts:3: TypeScript\/eslint suppression/u);
});

test("mergeCleanupFilePaths includes untracked launch-code files without duplicates", () => {
  const paths = mergeCleanupFilePaths({
    trackedPaths: [
      "src/lib/existing.ts",
      "scripts/check-launch-blockers.mjs",
      "scripts/test-algolia.js",
    ],
    untrackedPaths: [
      "src/lib/existing.ts",
      "src/lib/new-audit-helper.ts",
      "docs/private-note.md",
      "scripts/check-launch-blockers.test.mjs",
    ],
  });

  assert.deepEqual(paths, [
    "src/lib/existing.ts",
    "scripts/test-algolia.js",
    "src/lib/new-audit-helper.ts",
  ]);
});

test("evaluateLaunchBlockers continues after failures and returns a release-blocking result", () => {
  const checks = [
    {
      id: "passes",
      label: "Passing check",
      command: "npm",
      args: ["run", "passes"],
      mutates: false,
    },
    {
      id: "blocked",
      label: "Blocked check",
      command: "npm",
      args: ["run", "blocked"],
      mutates: false,
    },
  ];
  const calls = [];

  const result = evaluateLaunchBlockers(checks, {
    runner(check) {
      calls.push(check.id);
      if (check.id === "blocked") {
        return {
          exitCode: 1,
          stdout: "blocked line 1\nblocked line 2",
          stderr: "",
        };
      }
      return {
        exitCode: 0,
        stdout: "ok",
        stderr: "",
      };
    },
  });

  assert.deepEqual(calls, ["passes", "blocked"]);
  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 1);
  assert.equal(result.checks[0].status, "pass");
  assert.equal(result.checks[1].status, "blocker");
  assert.match(result.checks[1].evidence, /blocked line 1/u);
});

test("formatLaunchBlockerReport summarizes pass and blocker states without full noisy logs", () => {
  const result = {
    ok: false,
    checks: [
      {
        id: "pass",
        label: "Passing check",
        status: "pass",
        commandLine: "npm run pass",
        evidence: "one\ntwo\nthree",
      },
      {
        id: "blocker",
        label: "Blocked check",
        status: "blocker",
        commandLine: "npm run blocked",
        evidence: Array.from({ length: 12 }, (_, index) => `line ${index + 1}`).join("\n"),
      },
    ],
  };

  const report = formatLaunchBlockerReport(result, { maxEvidenceLines: 3 });

  assert.match(report, /^launch-blockers: BLOCKED/u);
  assert.match(report, /\[PASS\] Passing check/u);
  assert.match(report, /\[BLOCKER\] Blocked check/u);
  assert.match(report, /line 3/u);
  assert.match(report, /omitted 9 more lines/u);
  assert.doesNotMatch(report, /line 4/u);
});

test("parseArgs supports json output and help", () => {
  assert.deepEqual(parseArgs(["--json"]), { json: true, help: false });
  assert.deepEqual(parseArgs(["--help"]), { json: false, help: true });
  assert.deepEqual(parseArgs(["--include-vercel-build"]), {
    json: false,
    help: false,
    includeVercelBuild: true,
  });
  assert.deepEqual(parseArgs(["--allow-extra-worktrees"]), {
    json: false,
    help: false,
    allowExtraWorktrees: true,
  });
});

test("buildSpawnInvocation wraps npm with cmd.exe on Windows without shell mode", () => {
  assert.deepEqual(buildSpawnInvocation("npm", ["run", "check"], "win32"), {
    command: "cmd.exe",
    args: ["/d", "/s", "/c", "npm run check"],
  });
  assert.deepEqual(buildSpawnInvocation("git", ["status"], "win32"), {
    command: "git",
    args: ["status"],
  });
  assert.deepEqual(buildSpawnInvocation("npm", ["run", "check"], "linux"), {
    command: "npm",
    args: ["run", "check"],
  });
});
