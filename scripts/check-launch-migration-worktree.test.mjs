import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  analyzeLaunchMigrationWorktree,
  BLOCKED_TAXONOMY_MIGRATION,
  parseArgs,
  REQUIRED_LAUNCH_MIGRATIONS,
} from "./check-launch-migration-worktree.mjs";

function createRoot(files = REQUIRED_LAUNCH_MIGRATIONS) {
  const root = mkdtempSync(path.join(tmpdir(), "launch-migration-worktree-"));
  const migrationsDir = path.join(root, "supabase", "migrations");
  mkdirSync(migrationsDir, { recursive: true });

  for (const fileName of files) {
    writeFileSync(path.join(migrationsDir, fileName), "-- test migration\n");
  }

  return root;
}

test("passes when required launch migrations are present and clean", () => {
  const root = createRoot();

  const result = analyzeLaunchMigrationWorktree({
    root,
    statusLines: [],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("fails when migration status has dirty entries", () => {
  const root = createRoot();

  const result = analyzeLaunchMigrationWorktree({
    root,
    statusLines: ["?? supabase/migrations/20260619214332_add_vehicle_taxonomy_metadata.sql"],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /uncommitted or untracked/u);
});

test("fails when the launch worktree has dirty non-migration entries", () => {
  const root = createRoot();

  const result = analyzeLaunchMigrationWorktree({
    root,
    statusLines: [],
    worktreeStatusLines: [" M src/app/api/stripe/webhook/route.ts"],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /worktree has uncommitted or untracked changes/u);
});

test("fails when the taxonomy metadata migration is present", () => {
  const root = createRoot([...REQUIRED_LAUNCH_MIGRATIONS, BLOCKED_TAXONOMY_MIGRATION]);

  const result = analyzeLaunchMigrationWorktree({
    root,
    statusLines: [],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /not part of the payment\/RLS launch lane/u);
});

test("allows the taxonomy metadata migration only with explicit override", () => {
  const root = createRoot([...REQUIRED_LAUNCH_MIGRATIONS, BLOCKED_TAXONOMY_MIGRATION]);

  const result = analyzeLaunchMigrationWorktree({
    root,
    statusLines: [],
    allowTaxonomyMetadata: true,
  });

  assert.equal(result.ok, true);
});

test("parses root and explicit taxonomy override arguments", () => {
  const options = parseArgs(["--root=C:/tmp/example", "--allow-taxonomy-metadata"]);

  assert.equal(options.root, path.resolve("C:/tmp/example"));
  assert.equal(options.allowTaxonomyMetadata, true);
});

test("parses root as a separate argument for runbook copy-paste", () => {
  const options = parseArgs(["--root", "C:/tmp/example"]);

  assert.equal(options.root, path.resolve("C:/tmp/example"));
});
