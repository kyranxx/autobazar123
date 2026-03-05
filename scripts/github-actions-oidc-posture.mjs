#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_RULES = [
  {
    file: ".github/workflows/accessibility-quality-gate.yml",
    markers: [
      "id-token: write",
      "ACTIONS_ID_TOKEN_REQUEST_URL",
      "id: oidc-token",
      "Authorization: Bearer $QUALITY_ALERT_OIDC_TOKEN",
      "QUALITY_ALERT_WEBHOOK_URL",
    ],
  },
  {
    file: ".github/workflows/performance-budget-gate.yml",
    markers: [
      "id-token: write",
      "ACTIONS_ID_TOKEN_REQUEST_URL",
      "id: oidc-token",
      "Authorization: Bearer $QUALITY_ALERT_OIDC_TOKEN",
      "QUALITY_ALERT_WEBHOOK_URL",
    ],
  },
];

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--root" && argv[i + 1]) {
      args.root = argv[i + 1];
      i += 1;
    }
  }

  return args;
}

export function evaluateGitHubActionsOidcPosture(rootDir, rules = DEFAULT_RULES) {
  const errors = [];

  for (const rule of rules) {
    const fullPath = resolve(rootDir, rule.file);
    if (!existsSync(fullPath)) {
      errors.push(`workflow file missing: ${rule.file}`);
      continue;
    }

    const content = readFileSync(fullPath, "utf8");
    for (const marker of rule.markers) {
      if (!content.includes(marker)) {
        errors.push(`marker '${marker}' missing in ${rule.file}`);
      }
    }
  }

  return { errors };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = evaluateGitHubActionsOidcPosture(args.root);

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`OIDC POSTURE CHECK FAILED: ${error}`);
    }
    process.exit(1);
  }

  console.log("OIDC POSTURE CHECK OK: required workflow markers are present.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

