import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeDeploySourceReadiness,
  parseGitStatusShortBranch,
} from "./check-deploy-source-readiness.mjs";

test("parseGitStatusShortBranch extracts branch and ahead/behind counts", () => {
  assert.deepEqual(
    parseGitStatusShortBranch("## master...origin/master [ahead 63]\nM  package.json\n"),
    {
      branch: "master",
      upstream: "origin/master",
      ahead: 63,
      behind: 0,
    },
  );

  assert.deepEqual(
    parseGitStatusShortBranch("## launch-source...origin/master [ahead 2, behind 1]\n"),
    {
      branch: "launch-source",
      upstream: "origin/master",
      ahead: 2,
      behind: 1,
    },
  );
});

test("analyzeDeploySourceReadiness blocks dirty current-worktree source deploys", () => {
  const result = analyzeDeploySourceReadiness({
    statusShortBranch: "## master...origin/master [ahead 63]\n",
    stagedNameStatus:
      "M\tpackage.json\n" +
      "A\tscripts/check-launch-blockers.mjs\n",
    unstagedNameStatus:
      "M\tnext.config.ts\n" +
      "D\tpublic/llms.txt\n",
    untrackedPaths: [
      "scripts/discover-otomoto-taxonomy.ts",
      "src/lib/vehicle-taxonomy/candidate-store.ts",
      "supabase/migrations/20260619214332_add_vehicle_taxonomy_metadata.sql",
    ],
    hasVercelIgnore: false,
    vercelIgnoreContent: "",
    projectName: "autobazar123",
    projectId: "prj_123",
  });

  assert.equal(result.ok, false);
  assert.match(result.evidence, /project=autobazar123 \(prj_123\)/u);
  assert.match(result.evidence, /branch=master upstream=origin\/master ahead=63 behind=0/u);
  assert.match(result.evidence, /stagedFiles=2/u);
  assert.match(result.evidence, /unstagedFiles=2/u);
  assert.match(result.evidence, /untrackedFiles=3/u);
  assert.match(result.evidence, /No root \.vercelignore found/u);
  assert.match(result.evidence, /Dirty deploy source/u);
  assert.doesNotMatch(result.evidence, /Deferred taxonomy source present/u);
});

test("analyzeDeploySourceReadiness requires Vercel ignore coverage for operator artifacts", () => {
  const result = analyzeDeploySourceReadiness({
    statusShortBranch: "## launch-preview\n",
    stagedNameStatus: "",
    unstagedNameStatus: "",
    untrackedPaths: [],
    hasVercelIgnore: true,
    vercelIgnoreContent:
      "output/**\n" +
      "playwright-report/**\n",
    projectName: "autobazar123",
    projectId: "prj_123",
  });

  assert.equal(result.ok, false);
  assert.match(result.evidence, /Missing \.vercelignore launch-risk exclusions/u);
  assert.match(result.evidence, /supabase\/\*\*/u);
  assert.match(result.evidence, /scripts\/discover-\*-taxonomy\.ts/u);
  assert.match(result.evidence, /scripts\/sync-\*-taxonomy\.ts/u);
  assert.match(result.evidence, /scripts\/promote-approved-taxonomy-candidates\.ts/u);
  assert.match(result.evidence, /scripts\/import-jato-taxonomy\.ts/u);
  assert.match(result.evidence, /src\/lib\/vehicle-taxonomy\/otomoto\*\.ts/u);
});

test("analyzeDeploySourceReadiness passes a clean reviewed source", () => {
  const result = analyzeDeploySourceReadiness({
    statusShortBranch: "## launch-preview\n",
    stagedNameStatus: "",
    unstagedNameStatus: "",
    untrackedPaths: [],
    hasVercelIgnore: true,
    vercelIgnoreContent:
      "supabase/**\n" +
      "scripts/discover-*-taxonomy.ts\n" +
      "scripts/sync-*-taxonomy.ts\n" +
      "scripts/promote-approved-taxonomy-candidates.ts\n" +
      "scripts/import-jato-taxonomy.ts\n" +
      "src/lib/vehicle-taxonomy/autobazar-eu*.ts\n" +
      "src/lib/vehicle-taxonomy/candidate-store*.ts\n" +
      "src/lib/vehicle-taxonomy/candidates*.ts\n" +
      "src/lib/vehicle-taxonomy/mobile-de*.ts\n" +
      "src/lib/vehicle-taxonomy/normalize.ts\n" +
      "src/lib/vehicle-taxonomy/otomoto*.ts\n" +
      "src/lib/vehicle-taxonomy/public.test.ts\n" +
      "src/lib/vehicle-taxonomy/wikidata.ts\n",
    projectName: "autobazar123",
    projectId: "prj_123",
  });

  assert.equal(result.ok, true);
  assert.match(result.evidence, /deploy-source-readiness: OK/u);
  assert.match(result.evidence, /stagedFiles=0/u);
  assert.match(result.evidence, /unstagedFiles=0/u);
  assert.match(result.evidence, /untrackedFiles=0/u);
});
