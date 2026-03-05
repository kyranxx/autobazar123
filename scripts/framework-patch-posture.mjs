#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_POLICY_PATH = "config/security-release-policy.json";
const DEFAULT_CONFIG = {
  enforceReactDomVersionParity: true,
  packages: [
    { name: "next", maxLagDays: 7 },
    { name: "react", maxLagDays: 14 },
    { name: "react-dom", maxLagDays: 14 },
  ],
};

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    policy: DEFAULT_POLICY_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root" && argv[index + 1]) {
      args.root = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--policy" && argv[index + 1]) {
      args.policy = argv[index + 1];
      index += 1;
      continue;
    }
  }

  return args;
}

function loadJson(pathname) {
  return JSON.parse(readFileSync(pathname, "utf8"));
}

function mergeConfig(policyConfig = {}) {
  const packages = Array.isArray(policyConfig.packages)
    ? policyConfig.packages
    : DEFAULT_CONFIG.packages;

  return {
    enforceReactDomVersionParity:
      policyConfig.enforceReactDomVersionParity ?? DEFAULT_CONFIG.enforceReactDomVersionParity,
    packages: packages.map((item) => ({
      name: item.name,
      maxLagDays: Number.isFinite(item.maxLagDays)
        ? item.maxLagDays
        : DEFAULT_CONFIG.packages.find((base) => base.name === item.name)?.maxLagDays ?? 14,
    })),
  };
}

export function parseSemver(version) {
  if (typeof version !== "string") {
    return null;
  }
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function compareSemver(left, right) {
  const leftParsed = typeof left === "string" ? parseSemver(left) : left;
  const rightParsed = typeof right === "string" ? parseSemver(right) : right;
  if (!leftParsed || !rightParsed) {
    return null;
  }

  if (leftParsed.major !== rightParsed.major) {
    return leftParsed.major > rightParsed.major ? 1 : -1;
  }
  if (leftParsed.minor !== rightParsed.minor) {
    return leftParsed.minor > rightParsed.minor ? 1 : -1;
  }
  if (leftParsed.patch !== rightParsed.patch) {
    return leftParsed.patch > rightParsed.patch ? 1 : -1;
  }
  return 0;
}

function getInstalledVersions(rootDir) {
  const packageJsonPath = resolve(rootDir, "package.json");
  const lockPath = resolve(rootDir, "package-lock.json");
  const packageJson = loadJson(packageJsonPath);
  const lock = loadJson(lockPath);

  const declared = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const lockPackages = lock.packages || {};
  const installed = {};

  for (const name of Object.keys(declared)) {
    const lockKey = `node_modules/${name}`;
    if (lockPackages[lockKey]?.version) {
      installed[name] = lockPackages[lockKey].version;
      continue;
    }

    // Fallback: only accept an exact version in package.json when lock data is missing.
    const exact = parseSemver(declared[name]) ? declared[name] : null;
    if (exact) {
      installed[name] = exact;
    }
  }

  return installed;
}

async function fetchRegistryPackageMeta(name) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
  if (!response.ok) {
    throw new Error(`registry request failed for ${name} (${response.status})`);
  }

  const payload = await response.json();
  return {
    latest: payload?.["dist-tags"]?.latest ?? null,
    time: payload?.time ?? {},
  };
}

function formatDays(value) {
  return `${value} day${value === 1 ? "" : "s"}`;
}

export function evaluateFrameworkPatchPosture(config, installedVersions, registryMeta, now = new Date()) {
  const errors = [];
  const warnings = [];

  for (const pkg of config.packages) {
    const name = pkg.name;
    const installed = installedVersions[name];
    if (!installed) {
      errors.push(`framework package missing from lockfile/install graph: ${name}`);
      continue;
    }

    const installedSemver = parseSemver(installed);
    if (!installedSemver) {
      errors.push(`unable to parse installed semver for ${name}: ${installed}`);
      continue;
    }

    const meta = registryMeta[name];
    if (!meta || !meta.latest) {
      warnings.push(`registry metadata unavailable for ${name}; skipping freshness check`);
      continue;
    }

    const latest = meta.latest;
    const latestSemver = parseSemver(latest);
    if (!latestSemver) {
      warnings.push(`unable to parse latest semver for ${name}: ${latest}`);
      continue;
    }

    const relation = compareSemver(installedSemver, latestSemver);
    if (relation === null) {
      warnings.push(`failed semver comparison for ${name}`);
      continue;
    }

    if (relation >= 0) {
      continue;
    }

    const latestReleaseRaw = meta.time?.[latest];
    const latestReleaseDate = latestReleaseRaw ? new Date(latestReleaseRaw) : null;
    const latestReleaseValid =
      latestReleaseDate instanceof Date && !Number.isNaN(latestReleaseDate.getTime());
    const latestAgeDays = latestReleaseValid
      ? Math.floor((now.getTime() - latestReleaseDate.getTime()) / DAY_IN_MS)
      : null;

    if (latestSemver.major > installedSemver.major) {
      warnings.push(
        `${name} has a newer major release (${installed} -> ${latest}); review upgrade plan`,
      );
      continue;
    }

    const lagDetails =
      latestAgeDays === null
        ? "release age unavailable"
        : `latest published ${formatDays(latestAgeDays)} ago`;

    if (latestAgeDays !== null && latestAgeDays > pkg.maxLagDays) {
      errors.push(
        `${name} is outside patch posture window (${installed} -> ${latest}, ${lagDetails}, max ${formatDays(pkg.maxLagDays)})`,
      );
      continue;
    }

    warnings.push(
      `${name} update pending within grace window (${installed} -> ${latest}, ${lagDetails}, max ${formatDays(pkg.maxLagDays)})`,
    );
  }

  if (config.enforceReactDomVersionParity) {
    const react = installedVersions.react;
    const reactDom = installedVersions["react-dom"];
    if (react && reactDom && react !== reactDom) {
      errors.push(
        `react/react-dom parity check failed (react=${react}, react-dom=${reactDom})`,
      );
    }
  }

  return { errors, warnings };
}

export async function runFrameworkPatchPostureGate(options = {}) {
  const rootDir = options.root ?? process.cwd();
  const policyPath = resolve(rootDir, options.policy ?? DEFAULT_POLICY_PATH);
  const policy = loadJson(policyPath);
  const config = mergeConfig(policy.frameworkPatchPosture);
  const installed = getInstalledVersions(rootDir);

  const registryEntries = await Promise.all(
    config.packages.map(async (pkg) => {
      try {
        const meta = await fetchRegistryPackageMeta(pkg.name);
        return [pkg.name, meta];
      } catch (error) {
        return [pkg.name, { latest: null, time: {}, error: String(error?.message ?? error) }];
      }
    }),
  );

  const registryMeta = Object.fromEntries(registryEntries);
  const evaluation = evaluateFrameworkPatchPosture(config, installed, registryMeta, options.now);

  for (const pkg of config.packages) {
    const meta = registryMeta[pkg.name];
    if (meta?.error) {
      console.warn(`FRAMEWORK PATCH POSTURE WARNING: ${pkg.name}: ${meta.error}`);
    }
  }

  for (const warning of evaluation.warnings) {
    console.warn(`FRAMEWORK PATCH POSTURE WARNING: ${warning}`);
  }

  if (evaluation.errors.length > 0) {
    for (const error of evaluation.errors) {
      console.error(`FRAMEWORK PATCH POSTURE FAILED: ${error}`);
    }
    return 1;
  }

  console.log("FRAMEWORK PATCH POSTURE: OK");
  return 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const status = await runFrameworkPatchPostureGate({
    root: args.root,
    policy: args.policy,
  });
  process.exit(status);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`FRAMEWORK PATCH POSTURE FAILED: ${error?.message ?? error}`);
    process.exit(1);
  });
}
