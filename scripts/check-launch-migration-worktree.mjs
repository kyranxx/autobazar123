#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_LAUNCH_MIGRATIONS = [
  "20260618174500_harden_profile_dealer_public_reads.sql",
  "20260618193000_align_payment_notifications_billing.sql",
  "20260619120000_add_vehicle_taxonomy_candidates.sql",
  "20260620010000_harden_billing_checkout_atomicity.sql",
];

export const BLOCKED_TAXONOMY_MIGRATION =
  "20260619214332_add_vehicle_taxonomy_metadata.sql";

function printUsage() {
  console.log(`Usage: node scripts/check-launch-migration-worktree.mjs [--root=PATH] [--allow-taxonomy-metadata]

Checks that a launch DB worktree is safe for the payment/RLS migration lane.
Default --root is the current working directory.
`);
}

export function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    allowTaxonomyMetadata: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--allow-taxonomy-metadata") {
      options.allowTaxonomyMetadata = true;
      continue;
    }

    if (arg === "--root") {
      const root = argv[index + 1]?.trim();
      if (!root) {
        throw new Error("Invalid --root. Expected a non-empty path.");
      }
      options.root = path.resolve(root);
      index += 1;
      continue;
    }

    if (arg.startsWith("--root=")) {
      const root = arg.slice("--root=".length).trim();
      if (!root) {
        throw new Error("Invalid --root. Expected a non-empty path.");
      }
      options.root = path.resolve(root);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getMigrationStatus(root) {
  return execFileSync("git", ["-C", root, "status", "--short", "--", "supabase/migrations"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function migrationPath(root, fileName) {
  return path.join(root, "supabase", "migrations", fileName);
}

export function analyzeLaunchMigrationWorktree({
  root,
  statusLines,
  allowTaxonomyMetadata = false,
}) {
  const errors = [];
  const missingRequired = REQUIRED_LAUNCH_MIGRATIONS.filter(
    (fileName) => !existsSync(migrationPath(root, fileName)),
  );
  const blockedTaxonomyMigrationPresent = existsSync(
    migrationPath(root, BLOCKED_TAXONOMY_MIGRATION),
  );

  if (statusLines.length > 0) {
    errors.push(
      [
        "supabase/migrations has uncommitted or untracked changes.",
        "Use a clean launch worktree before remote DB dry-runs or pushes.",
        ...statusLines.map((line) => `  ${line}`),
      ].join("\n"),
    );
  }

  if (missingRequired.length > 0) {
    errors.push(
      [
        "Required launch migration files are missing:",
        ...missingRequired.map((fileName) => `  ${fileName}`),
      ].join("\n"),
    );
  }

  if (blockedTaxonomyMigrationPresent && !allowTaxonomyMetadata) {
    errors.push(
      [
        `Blocked unrelated taxonomy migration is present: ${BLOCKED_TAXONOMY_MIGRATION}`,
        "This migration is not part of the payment/RLS launch lane.",
      ].join("\n"),
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    missingRequired,
    blockedTaxonomyMigrationPresent,
    statusLines,
  };
}

export function formatResult(result, root) {
  if (result.ok) {
    return [
      "launch-migration-worktree: OK",
      `root=${root}`,
      "Required launch migration files are present.",
      "No dirty migration files detected.",
      "Blocked taxonomy metadata migration is absent.",
    ].join("\n");
  }

  return ["launch-migration-worktree: FAILED", `root=${root}`, ...result.errors].join(
    "\n\n",
  );
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const root = path.resolve(options.root);
  const result = analyzeLaunchMigrationWorktree({
    root,
    statusLines: getMigrationStatus(root),
    allowTaxonomyMetadata: options.allowTaxonomyMetadata,
  });

  console.log(formatResult(result, root));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entrypoint === fileURLToPath(import.meta.url)) {
  main();
}
