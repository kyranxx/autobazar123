#!/usr/bin/env node

import { readdirSync, statSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATE_ROOT = resolve(__dirname, "templates");

function parseArgs(argv) {
  const args = {
    name: "new-project",
    repo: "owner/new-project",
    target: process.cwd(),
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--name" && argv[i + 1]) {
      args.name = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--repo" && argv[i + 1]) {
      args.repo = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--target" && argv[i + 1]) {
      args.target = resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--force") {
      args.force = true;
    }
  }

  return args;
}

function collectFiles(dir, out = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      collectFiles(fullPath, out);
    } else {
      out.push(fullPath);
    }
  }
  return out;
}

function renderTemplate(content, vars) {
  return content
    .replaceAll("__PROJECT_NAME__", vars.projectName)
    .replaceAll("__REPOSITORY__", vars.repository)
    .replaceAll("__YEAR__", String(new Date().getFullYear()));
}

function readTextFile(pathname) {
  return readFileSync(pathname, "utf8").replace(/^\uFEFF/, "");
}

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function patchPackageScripts(targetDir) {
  const packageJsonPath = join(targetDir, "package.json");
  if (!existsSync(packageJsonPath)) {
    return { changed: false, skipped: true };
  }

  const pkg = JSON.parse(readTextFile(packageJsonPath));
  pkg.scripts = pkg.scripts || {};

  const desiredScripts = {
    "test:workflow-check": "node scripts/workflow-check.mjs",
    "test:agent-contract": "node scripts/agent-contract-check.mjs",
    "test:security:release-gate": "node scripts/security-release-gate.mjs",
    "test:skill-graph": "node scripts/skill-graph-check.mjs",
    "test:links-ingest": "node --test scripts/links-ingest.test.mjs",
    "links:ingest": "node scripts/links-ingest.mjs",
    "easy:quick": "node scripts/easy-ops.mjs quick",
    "easy:full": "node scripts/easy-ops.mjs full",
    "easy:test": "node --test scripts/easy-ops.test.mjs",
    "starter:quick": "npm run easy:quick",
    "starter:full": "npm run easy:full",
    "starter:links": "npm run links:ingest",
    "starter:contract": "npm run test:agent-contract",
    "starter:security": "npm run test:security:release-gate",
    "starter:skill-graph": "npm run test:skill-graph",
  };

  let changed = false;
  for (const [name, value] of Object.entries(desiredScripts)) {
    if (!pkg.scripts[name]) {
      pkg.scripts[name] = value;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  }

  return { changed, skipped: false };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const templateFiles = collectFiles(TEMPLATE_ROOT);
  const created = [];
  const skipped = [];

  const vars = {
    projectName: args.name,
    repository: args.repo,
  };

  for (const sourcePath of templateFiles) {
    const relPath = sourcePath.slice(TEMPLATE_ROOT.length + 1);
    const targetPath = join(args.target, relPath);

    if (existsSync(targetPath) && !args.force) {
      skipped.push(relPath);
      continue;
    }

    ensureDir(targetPath);
    const source = readTextFile(sourcePath);
    const rendered = renderTemplate(source, vars);
    writeFileSync(targetPath, rendered, "utf8");
    created.push(relPath);
  }

  const packagePatch = patchPackageScripts(args.target);

  console.log("STARTER KIT INIT: OK");
  console.log(`- Target: ${args.target}`);
  console.log(`- Created/updated files: ${created.length}`);
  if (skipped.length > 0) {
    console.log(`- Skipped existing files: ${skipped.length}`);
  }
  if (!packagePatch.skipped) {
    console.log(`- package.json scripts patched: ${packagePatch.changed ? "yes" : "already present"}`);
  } else {
    console.log("- package.json scripts patched: skipped (package.json missing)");
  }
  console.log("");
  console.log("Next steps:");
  console.log("1) npm run starter:quick");
  console.log("2) Review AGENTS.md and contracts/agent-contract.json");
  console.log("3) Adjust config/security-release-policy.json for project-specific files");
}

main();
