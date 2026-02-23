#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const DEFAULT_POLICY_PATH = "config/security-release-policy.json";

function parseArgs(argv) {
  const args = {
    policy: DEFAULT_POLICY_PATH,
    skipCommands: false,
    root: process.cwd(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--policy" && argv[i + 1]) {
      args.policy = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--root" && argv[i + 1]) {
      args.root = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--skip-commands") {
      args.skipCommands = true;
    }
  }

  return args;
}

function loadJson(pathname) {
  const raw = readFileSync(pathname, "utf8");
  return JSON.parse(raw);
}

export function evaluateSecurityPolicy(policy, rootDir) {
  const errors = [];
  const warnings = [];

  for (const file of policy.requiredFiles || []) {
    const fullPath = resolve(rootDir, file);
    if (!existsSync(fullPath)) {
      errors.push(`required file missing: ${file}`);
    }
  }

  for (const rule of policy.requiredMarkers || []) {
    const fullPath = resolve(rootDir, rule.file);
    if (!existsSync(fullPath)) {
      errors.push(`marker check file missing: ${rule.file}`);
      continue;
    }

    const content = readFileSync(fullPath, "utf8");
    for (const marker of rule.markers || []) {
      if (!content.includes(marker)) {
        errors.push(`marker '${marker}' missing in ${rule.file}`);
      }
    }
  }

  for (const docRule of policy.requiredDocTokens || []) {
    const fullPath = resolve(rootDir, docRule.file);
    if (!existsSync(fullPath)) {
      errors.push(`doc file missing: ${docRule.file}`);
      continue;
    }

    const content = readFileSync(fullPath, "utf8");
    for (const token of docRule.tokens || []) {
      if (!content.includes(token)) {
        errors.push(`doc token '${token}' missing in ${docRule.file}`);
      }
    }
  }

  const packageJsonPath = resolve(rootDir, "package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = loadJson(packageJsonPath);
    const scripts = packageJson.scripts || {};
    for (const scriptName of policy.requiredPackageScripts || []) {
      if (!scripts[scriptName]) {
        errors.push(`required package script missing: ${scriptName}`);
      }
    }
  } else {
    warnings.push("package.json missing; package script checks skipped");
  }

  return { errors, warnings };
}

function runCommand(command, rootDir) {
  const isWindows = process.platform === "win32";
  const result = spawnSync(command, {
    shell: isWindows ? "powershell.exe" : true,
    stdio: "inherit",
    cwd: rootDir,
  });
  return result.status ?? 1;
}

export function runReleaseGate(policy, rootDir, options = {}) {
  const { skipCommands = false } = options;
  const { errors, warnings } = evaluateSecurityPolicy(policy, rootDir);

  for (const warning of warnings) {
    console.warn(`SECURITY GATE WARNING: ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`SECURITY GATE FAILED: ${error}`);
    }
    return 1;
  }

  console.log("SECURITY GATE STATIC POLICY: OK");

  if (skipCommands) {
    return 0;
  }

  for (const command of policy.commands || []) {
    console.log(`SECURITY GATE RUN: ${command}`);
    const status = runCommand(command, rootDir);
    if (status !== 0) {
      console.error(`SECURITY GATE FAILED: command failed (${command})`);
      return status;
    }
  }

  console.log("SECURITY RELEASE GATE: OK");
  return 0;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const policyPath = resolve(args.root, args.policy);

  if (!existsSync(policyPath)) {
    console.error(`SECURITY GATE FAILED: policy file not found at ${args.policy}`);
    process.exit(1);
  }

  const policy = loadJson(policyPath);
  const status = runReleaseGate(policy, args.root, {
    skipCommands: args.skipCommands,
  });
  process.exit(status);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
