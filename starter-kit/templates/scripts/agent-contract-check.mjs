#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_CONTRACT_PATH = "contracts/agent-contract.json";

function parseArgs(argv) {
  const options = {
    contractPath: DEFAULT_CONTRACT_PATH,
    root: process.cwd(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--contract" && argv[i + 1]) {
      options.contractPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--root" && argv[i + 1]) {
      options.root = argv[i + 1];
      i += 1;
    }
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function validateAgentContract(contract, packageScripts = {}, rootDir = process.cwd()) {
  const errors = [];
  const warnings = [];

  if (!contract || typeof contract !== "object") {
    errors.push("contract must be an object");
    return { errors, warnings };
  }

  if (typeof contract.version !== "number" || contract.version < 1) {
    errors.push("contract.version must be >= 1");
  }

  if (typeof contract.repository !== "string" || !contract.repository.includes("/")) {
    errors.push("contract.repository must be in owner/repo format");
  }

  const tiers = contract.riskTierRules || {};
  const tierNames = Object.keys(tiers);
  if (tierNames.length === 0) {
    errors.push("riskTierRules must define at least one tier");
  }

  if (!Array.isArray(tiers.low) || !tiers.low.includes("**")) {
    errors.push("riskTierRules.low must include '**' as fallback");
  }

  const requiredChecksByTier = contract.requiredChecksByTier || {};
  for (const tier of tierNames) {
    const checks = requiredChecksByTier[tier];
    if (!Array.isArray(checks) || checks.length === 0) {
      errors.push(`requiredChecksByTier.${tier} must be a non-empty array`);
      continue;
    }

    for (const check of checks) {
      if (typeof check !== "string" || check.trim().length === 0) {
        errors.push(`required check in tier '${tier}' must be a non-empty string`);
        continue;
      }
      if (!packageScripts[check]) {
        errors.push(`required check '${check}' for tier '${tier}' is missing from package.json scripts`);
      }
    }
  }

  for (const rule of contract.docsSyncRules || []) {
    const docs = rule.requiredDocs || [];
    if (!Array.isArray(docs) || docs.length === 0) {
      errors.push("each docsSyncRules entry must include requiredDocs");
      continue;
    }

    for (const docPath of docs) {
      if (!existsSync(resolve(rootDir, docPath))) {
        errors.push(`required doc missing: ${docPath}`);
      }
    }
  }

  const reviewPolicy = contract.reviewPolicy || {};
  const requiredBooleanFlags = [
    "requireCurrentHeadEvidence",
    "rejectStaleReviewState",
    "allowAutoResolveBotOnlyThreads",
  ];
  for (const flag of requiredBooleanFlags) {
    if (typeof reviewPolicy[flag] !== "boolean") {
      warnings.push(`reviewPolicy.${flag} should be boolean`);
    }
  }

  return { errors, warnings };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const contractPath = resolve(args.root, args.contractPath);

  if (!existsSync(contractPath)) {
    console.error(`AGENT CONTRACT CHECK FAILED: contract file not found (${args.contractPath})`);
    process.exit(1);
  }

  const packagePath = resolve(args.root, "package.json");
  if (!existsSync(packagePath)) {
    console.error("AGENT CONTRACT CHECK FAILED: package.json not found");
    process.exit(1);
  }

  const contract = readJson(contractPath);
  const packageJson = readJson(packagePath);
  const scripts = packageJson.scripts || {};

  const result = validateAgentContract(contract, scripts, args.root);
  for (const warning of result.warnings) {
    console.warn(`AGENT CONTRACT CHECK WARNING: ${warning}`);
  }
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`AGENT CONTRACT CHECK FAILED: ${error}`);
    }
    process.exit(1);
  }

  console.log("AGENT CONTRACT CHECK: OK");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
