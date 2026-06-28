#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

export const LOCAL_PRODUCTION_AUDIT_ENV_PULL_KEYS = [
  "UPSTASH_REDIS_REST_URL",
];
export const LOCAL_PRODUCTION_AUDIT_SENSITIVE_ENV_NAMES = [
  "UPSTASH_REDIS_REST_TOKEN",
];
export const DEFAULT_VERCEL_CLI_PACKAGE = "vercel@54.14.5";

export const DEFAULT_TARGET_REQUIREMENTS = ["preview", "production"].map((target) => ({
  target,
  requiredPullKeys: LOCAL_PRODUCTION_AUDIT_ENV_PULL_KEYS,
  requiredSensitiveNames: LOCAL_PRODUCTION_AUDIT_SENSITIVE_ENV_NAMES,
}));

export function resolveVercelCliPackage(env = process.env) {
  const configuredPackage = env.VERCEL_CLI_PACKAGE;
  return typeof configuredPackage === "string" && configuredPackage.trim()
    ? configuredPackage.trim()
    : DEFAULT_VERCEL_CLI_PACKAGE;
}

export function parseEnvText(text) {
  return dotenv.parse(text);
}

export function hasEffectiveEnvValue(env, key) {
  const value = env[key];
  return typeof value === "string" && value.trim().length > 0;
}

export function parseEnvMetadataJson(text) {
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed?.envs ?? parsed?.environmentVariables ?? [];

  const metadata = new Map();
  for (const row of rows) {
    const key = row?.key ?? row?.name;
    if (typeof key !== "string" || !key) {
      continue;
    }

    metadata.set(key, {
      key,
      type: typeof row.type === "string" ? row.type : "",
    });
  }

  return metadata;
}

export function analyzeVercelEnvTarget({
  target,
  envText,
  metadataText = "[]",
  requiredPullKeys = [],
  requiredSensitiveNames = [],
}) {
  const env = parseEnvText(envText);
  const metadata = parseEnvMetadataJson(metadataText);
  const missingPullKeys = requiredPullKeys.filter((key) => !hasEffectiveEnvValue(env, key));
  const missingSensitiveNames = requiredSensitiveNames.filter((key) => !metadata.has(key));
  const nonSensitiveNames = requiredSensitiveNames.filter((key) => {
    const row = metadata.get(key);
    return row && row.type !== "sensitive";
  });

  return {
    target,
    ok:
      missingPullKeys.length === 0 &&
      missingSensitiveNames.length === 0 &&
      nonSensitiveNames.length === 0,
    checkedPullKeys: [...requiredPullKeys],
    checkedSensitiveNames: [...requiredSensitiveNames],
    missingPullKeys,
    missingSensitiveNames,
    nonSensitiveNames,
  };
}

function quoteArg(arg) {
  if (/^[A-Za-z0-9:_./=+@\\-]+$/u.test(arg)) {
    return arg;
  }

  return JSON.stringify(arg);
}

export function buildVercelEnvPullInvocation(
  target,
  outputFile,
  platform = process.platform,
  vercelCliPackage = DEFAULT_VERCEL_CLI_PACKAGE,
) {
  const args = [
    vercelCliPackage,
    "env",
    "pull",
    outputFile,
    `--environment=${target}`,
    "--yes",
  ];

  if (platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", ["npx", ...args].map(quoteArg).join(" ")],
    };
  }

  return {
    command: "npx",
    args,
  };
}

export function buildVercelEnvListJsonInvocation(
  target,
  platform = process.platform,
  vercelCliPackage = DEFAULT_VERCEL_CLI_PACKAGE,
) {
  const args = [
    vercelCliPackage,
    "env",
    "ls",
    target,
    "--format",
    "json",
  ];

  if (platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", ["npx", ...args].map(quoteArg).join(" ")],
    };
  }

  return {
    command: "npx",
    args,
  };
}

function pullVercelEnvToFile({ target, outputFile, vercelCliPackage }) {
  const invocation = buildVercelEnvPullInvocation(
    target,
    outputFile,
    process.platform,
    vercelCliPackage,
  );
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 5,
    shell: false,
  });

  if (result.error) {
    return {
      exitCode: 1,
      error: result.error.message,
    };
  }

  return {
    exitCode: result.status ?? 1,
  };
}

function listVercelEnvMetadata({ target, vercelCliPackage }) {
  const invocation = buildVercelEnvListJsonInvocation(
    target,
    process.platform,
    vercelCliPackage,
  );
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 5,
    shell: false,
  });

  if (result.error) {
    return {
      exitCode: 1,
      stdout: result.stdout ?? "",
      error: result.error.message,
    };
  }

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
  };
}

export function runVercelEnvValueCheck({
  requirements = DEFAULT_TARGET_REQUIREMENTS,
  tempRoot = os.tmpdir(),
  pullTargetEnv = pullVercelEnvToFile,
  listTargetMetadata = listVercelEnvMetadata,
  vercelCliPackage = resolveVercelCliPackage(),
} = {}) {
  const tempDir = mkdtempSync(path.join(tempRoot, "autobazar123-vercel-env-"));
  const targets = [];

  try {
    for (const requirement of requirements) {
      const outputFile = path.join(tempDir, `${requirement.target}.env.local`);
      const pullResult = pullTargetEnv({
        target: requirement.target,
        outputFile,
        vercelCliPackage,
      });

      if (pullResult.exitCode !== 0) {
        targets.push({
          target: requirement.target,
          ok: false,
          checkedPullKeys: [...requirement.requiredPullKeys],
          checkedSensitiveNames: [...requirement.requiredSensitiveNames],
          missingPullKeys: [...requirement.requiredPullKeys],
          missingSensitiveNames: [...requirement.requiredSensitiveNames],
          nonSensitiveNames: [],
          pullFailed: true,
          pullExitCode: pullResult.exitCode,
          error: pullResult.error,
        });
        continue;
      }

      const metadataResult = listTargetMetadata({
        target: requirement.target,
        vercelCliPackage,
      });

      if (metadataResult.exitCode !== 0) {
        targets.push({
          target: requirement.target,
          ok: false,
          checkedPullKeys: [...requirement.requiredPullKeys],
          checkedSensitiveNames: [...requirement.requiredSensitiveNames],
          missingPullKeys: [],
          missingSensitiveNames: [...requirement.requiredSensitiveNames],
          nonSensitiveNames: [],
          metadataFailed: true,
          metadataExitCode: metadataResult.exitCode,
          error: metadataResult.error,
        });
        continue;
      }

      const envText = readFileSync(outputFile, "utf8");
      targets.push(
        analyzeVercelEnvTarget({
          target: requirement.target,
          envText,
          metadataText: metadataResult.stdout,
          requiredPullKeys: requirement.requiredPullKeys,
          requiredSensitiveNames: requirement.requiredSensitiveNames,
        }),
      );
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  const ok = targets.every((target) => target.ok);

  return {
    ok,
    exitCode: ok ? 0 : 1,
    targets,
    tempDirRemoved: !existsSync(tempDir),
    vercelCliPackage,
  };
}

export function formatVercelEnvValueReport(result) {
  const lines = [
    `vercel-env-values: ${result.ok ? "OK" : "BLOCKED"}`,
    "Checks pull-readable Upstash values and sensitive Upstash metadata.",
    "No secret values are printed. Temporary Vercel env files are deleted after inspection.",
    `vercelCliPackage=${result.vercelCliPackage ?? DEFAULT_VERCEL_CLI_PACKAGE}`,
  ];

  for (const target of result.targets) {
    lines.push("");
    lines.push(`[${target.ok ? "PASS" : "BLOCKER"}] ${target.target}`);
    lines.push(`checkedPullReadableKeys=${target.checkedPullKeys.length}`);
    lines.push(`checkedSensitiveMetadataNames=${target.checkedSensitiveNames.length}`);

    if (target.pullFailed) {
      lines.push(`vercel env pull failed for ${target.target} (exitCode=${target.pullExitCode}).`);
      if (target.error) {
        lines.push(`error=${target.error}`);
      }
      continue;
    }

    if (target.metadataFailed) {
      lines.push(
        `vercel env ls --format json failed for ${target.target} ` +
          `(exitCode=${target.metadataExitCode}).`,
      );
      if (target.error) {
        lines.push(`error=${target.error}`);
      }
      continue;
    }

    if (target.missingPullKeys.length === 0) {
      lines.push("all pull-readable keys have effective non-empty values");
    } else {
      lines.push(`missingOrEmptyPullReadable=${target.missingPullKeys.join(", ")}`);
    }

    if (target.missingSensitiveNames.length === 0 && target.nonSensitiveNames.length === 0) {
      lines.push("all sensitive metadata names exist with type=sensitive");
    } else {
      if (target.missingSensitiveNames.length > 0) {
        lines.push(`missingSensitiveMetadata=${target.missingSensitiveNames.join(", ")}`);
      }
      if (target.nonSensitiveNames.length > 0) {
        lines.push(`notMarkedSensitive=${target.nonSensitiveNames.join(", ")}`);
      }
    }

    if (target.checkedSensitiveNames.length > 0) {
      lines.push(`runtimeSmokeStillRequired=${target.checkedSensitiveNames.join(", ")}`);
    }
  }

  lines.push("");
  lines.push(`tempFilesDeleted=${result.tempDirRemoved ? "yes" : "no"}`);

  return lines.join("\n");
}

export function parseArgs(argv) {
  const options = {
    json: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printUsage() {
  console.log(`Usage: npm run check:vercel-env-values -- [--json]

Pulls Preview and Production Vercel environment variables into a temporary OS
folder, verifies pull-readable Upstash values have effective non-empty values,
checks sensitive Upstash token metadata with "vercel env ls --format json",
deletes the temporary files, and prints only key names/status. No secret values
are printed.

This intentionally does not treat every sensitive Vercel runtime secret as a
pull-readable value. Some sensitive secrets require provider/dashboard or cloud
runtime smoke verification instead.
`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const result = runVercelEnvValueCheck();
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatVercelEnvValueReport(result));
  }
  process.exitCode = result.exitCode;
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entrypoint === fileURLToPath(import.meta.url)) {
  main();
}
