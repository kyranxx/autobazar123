#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function parseUiQualityArgs(argv) {
  return {
    coreOnly: argv.includes("--core-only"),
    skipUnit: argv.includes("--skip-unit"),
  };
}

export function buildUiQualitySteps(options) {
  const steps = [
    {
      id: "web-interface-core",
      command: "npx playwright test tests/web-interface-guidelines.test.ts",
      enabled: true,
    },
    {
      id: "web-interface-sitewide",
      command: "npx playwright test tests/web-interface-sitewide.test.ts",
      enabled: !options.coreOnly,
    },
    {
      id: "ui-unit-tests",
      command:
        "npx vitest run src/components/ui/shadcn/button.test.tsx src/components/ui/shadcn/input.test.tsx src/components/ui/FormField.test.tsx src/components/ui/LoadingSpinner.test.tsx",
      enabled: !options.skipUnit,
    },
  ];

  return steps.filter((step) => step.enabled);
}

function runCommand(command) {
  const isWindows = process.platform === "win32";
  const result = spawnSync(command, {
    shell: isWindows ? "powershell.exe" : true,
    stdio: "inherit",
  });
  return result.status ?? 1;
}

export function runUiQualityGate(argv = process.argv.slice(2)) {
  const options = parseUiQualityArgs(argv);
  const steps = buildUiQualitySteps(options);

  for (const step of steps) {
    console.log(`UI QUALITY GATE RUN: ${step.id}`);
    const status = runCommand(step.command);
    if (status !== 0) {
      console.error(`UI QUALITY GATE FAILED: ${step.id}`);
      return status;
    }
  }

  console.log("UI QUALITY GATE: OK");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const status = runUiQualityGate();
  process.exit(status);
}
