/**
 * Workflow Checklist Guard
 *
 * Validates that required workflow artifacts are in place for this repository:
 *   - docs/codex-workflow-checklist.md exists
 *   - tasks/todo.md exists
 *   - AGENTS.md exists
 *
 * Exits 0 on success, 1 on failure.
 */

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const requiredFiles = [
  "docs/codex-workflow-checklist.md",
  "tasks/todo.md",
  "AGENTS.md",
];

let allPresent = true;

for (const file of requiredFiles) {
  const fullPath = resolve(repoRoot, file);
  if (!existsSync(fullPath)) {
    console.error(`WORKFLOW CHECK FAILED: required file missing: ${file}`);
    allPresent = false;
  }
}

if (!allPresent) {
  process.exit(1);
}

console.log("WORKFLOW CHECK OK: all required workflow artifacts are present.");
process.exit(0);
