#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function parseMode(argv) {
  const mode = argv[0] || "quick";
  if (mode === "quick" || mode === "full") {
    return mode;
  }
  return "quick";
}

function getSteps(mode) {
  if (mode === "full") {
    return [
      "npm run lint",
      "npx tsc --noEmit",
      "npm run test:unit",
      "npm run test:security:release-gate",
      "node scripts/ui-quality-gate.mjs --core-only",
      "npx vitest run src/lib/analytics/events.test.ts",
      "npm run test:links-ingest",
    ];
  }

  return [
    "npm run lint",
    "npx tsc --noEmit",
    "npm run test:unit",
  ];
}

function runCommand(command) {
  const result = spawnSync(command, {
    shell: process.platform === "win32" ? "powershell.exe" : true,
    stdio: "inherit",
  });
  return result.status ?? 1;
}

export function runEasyOps(argv = process.argv.slice(2)) {
  const mode = parseMode(argv);
  const steps = getSteps(mode);
  console.log(`EASY OPS MODE: ${mode}`);

  for (const step of steps) {
    console.log(`EASY OPS RUN: ${step}`);
    const code = runCommand(step);
    if (code !== 0) {
      console.error(`EASY OPS FAILED: ${step}`);
      return code;
    }
  }

  console.log("EASY OPS: OK");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const code = runEasyOps();
  process.exit(code);
}
