#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const checks = [
  {
    file: "AGENTS.md",
    required: [
      "Do not mark tasks done until",
      "starter:full",
    ],
  },
  {
    file: "docs/easy-mode.md",
    required: [
      "starter:quick",
      "starter:full",
      "usable",
      "blocked",
    ],
  },
  {
    file: "docs/future-llm-prompt-template.md",
    required: [
      "contracts/agent-contract.json",
      "starter:full",
      "Commit and push",
    ],
  },
];

let hasError = false;

for (const check of checks) {
  const filePath = resolve(process.cwd(), check.file);
  if (!existsSync(filePath)) {
    console.error(`WORKFLOW CHECK FAILED: missing file ${check.file}`);
    hasError = true;
    continue;
  }

  const content = readFileSync(filePath, "utf8");

  for (const token of check.required) {
    if (!content.includes(token)) {
      console.error(`WORKFLOW CHECK FAILED: '${token}' missing in ${check.file}`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log("WORKFLOW CHECK: OK");
