#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_VERCEL_RUNTIME_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "NEXT_PUBLIC_ALGOLIA_APP_ID",
  "NEXT_PUBLIC_ALGOLIA_SEARCH_KEY",
  "ALGOLIA_ADMIN_KEY",
  "ALGOLIA_SYNC_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "CRON_SECRET",
  "MAINTENANCE_UNLOCK_PASSWORD",
  "MAINTENANCE_BYPASS_SECRET",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
];
export const DEFAULT_VERCEL_CLI_PACKAGE = "vercel@54.14.5";

export const DEFAULT_TARGET_REQUIREMENTS = ["preview", "production"].map((target) => ({
  target,
  requiredNames: REQUIRED_VERCEL_RUNTIME_ENV_NAMES,
}));

export function resolveVercelCliPackage(env = process.env) {
  const configuredPackage = env.VERCEL_CLI_PACKAGE;
  return typeof configuredPackage === "string" && configuredPackage.trim()
    ? configuredPackage.trim()
    : DEFAULT_VERCEL_CLI_PACKAGE;
}

function quoteArg(arg) {
  if (/^[A-Za-z0-9:_./=+@\\-]+$/u.test(arg)) {
    return arg;
  }

  return JSON.stringify(arg);
}

export function buildVercelEnvListInvocation(
  target,
  platform = process.platform,
  vercelCliPackage = DEFAULT_VERCEL_CLI_PACKAGE,
) {
  const args = [vercelCliPackage, "env", "ls", target];

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

function listVercelEnvTarget({ target, vercelCliPackage }) {
  const invocation = buildVercelEnvListInvocation(
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
      stderr: `${result.stderr ?? ""}\n${result.error.message}`.trim(),
    };
  }

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function parseVercelEnvListNames(output) {
  const names = new Set();

  for (const line of output.split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]+)\s+\S+/u);
    if (!match) {
      continue;
    }

    const name = match[1];
    if (name === "Vercel") {
      continue;
    }

    names.add(name);
  }

  return names;
}

export function analyzeVercelEnvNameTarget({ target, output, requiredNames }) {
  const presentNames = parseVercelEnvListNames(output);
  const missingNames = requiredNames.filter((name) => !presentNames.has(name));

  return {
    target,
    ok: missingNames.length === 0,
    checkedNames: [...requiredNames],
    presentCount: presentNames.size,
    missingNames,
  };
}

export function runVercelEnvNameCheck({
  requirements = DEFAULT_TARGET_REQUIREMENTS,
  listTargetEnv = listVercelEnvTarget,
  vercelCliPackage = resolveVercelCliPackage(),
} = {}) {
  const targets = [];

  for (const requirement of requirements) {
    const listResult = listTargetEnv({
      target: requirement.target,
      vercelCliPackage,
    });

    if (listResult.exitCode !== 0) {
      targets.push({
        target: requirement.target,
        ok: false,
        checkedNames: [...requirement.requiredNames],
        presentCount: 0,
        missingNames: [...requirement.requiredNames],
        listFailed: true,
        listExitCode: listResult.exitCode,
        error: [listResult.stderr, listResult.stdout]
          .filter((value) => value && value.trim())
          .join("\n")
          .trim(),
      });
      continue;
    }

    targets.push(
      analyzeVercelEnvNameTarget({
        target: requirement.target,
        output: listResult.stdout,
        requiredNames: requirement.requiredNames,
      }),
    );
  }

  const ok = targets.every((target) => target.ok);

  return {
    ok,
    exitCode: ok ? 0 : 1,
    targets,
    vercelCliPackage,
  };
}

export function formatVercelEnvNameReport(result) {
  const lines = [
    `vercel-env-names: ${result.ok ? "OK" : "BLOCKED"}`,
    "Checks Preview and Production Vercel env metadata names only.",
    "No secret values are printed or pulled.",
    `vercelCliPackage=${result.vercelCliPackage ?? DEFAULT_VERCEL_CLI_PACKAGE}`,
  ];

  for (const target of result.targets) {
    lines.push("");
    lines.push(`[${target.ok ? "PASS" : "BLOCKER"}] ${target.target}`);
    lines.push(`checkedNames=${target.checkedNames.length}`);
    lines.push(`metadataNamesFound=${target.presentCount}`);

    if (target.listFailed) {
      lines.push(`vercel env ls failed for ${target.target} (exitCode=${target.listExitCode}).`);
      if (target.error) {
        lines.push(`error=${target.error}`);
      }
      continue;
    }

    if (target.missingNames.length === 0) {
      lines.push("all required metadata names found");
    } else {
      lines.push(`missingNames=${target.missingNames.join(", ")}`);
    }
  }

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
  console.log(`Usage: npm run check:vercel-env-names -- [--json]

Runs "vercel env ls" for Preview and Production and verifies that the expected
runtime env variable names exist in Vercel metadata. This is a secret-safe
metadata check only. It does not prove sensitive values are readable to local
CLI commands or valid in cloud runtime.
`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const result = runVercelEnvNameCheck();
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatVercelEnvNameReport(result));
  }
  process.exitCode = result.exitCode;
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entrypoint === fileURLToPath(import.meta.url)) {
  main();
}
