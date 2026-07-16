#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const REQUIRED_REDIS_ENV_GROUPS = [
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_KV_REST_API_URL"],
  ["UPSTASH_REDIS_REST_TOKEN", "UPSTASH_REDIS_REST_KV_REST_API_TOKEN"],
];

const REQUIRED_PRODUCTION_ENV_VARS = [
  "NEXT_PUBLIC_APP_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "ALGOLIA_SYNC_SECRET",
];

function normalizeEnvValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function shouldEnforceProdRateLimitEnv(env = process.env) {
  const explicitGuard = normalizeEnvValue(env.CHECK_PROD_RATE_LIMIT_ENV) === "true";
  if (explicitGuard) {
    return true;
  }

  const target =
    normalizeEnvValue(env.RELEASE_ENV) ||
    normalizeEnvValue(env.SECURITY_RELEASE_TARGET) ||
    normalizeEnvValue(env.VERCEL_ENV);

  return target === "production";
}

export function findMissingRequiredEnvVars(env = process.env) {
  const missingRedisKeys = REQUIRED_REDIS_ENV_GROUPS
    .filter((keys) =>
      keys.every((key) => {
        const value = env[key];
        return typeof value !== "string" || value.trim().length === 0;
      }),
    )
    .map(([canonicalKey]) => canonicalKey);

  const missingProductionKeys = REQUIRED_PRODUCTION_ENV_VARS.filter((key) => {
    const value = env[key];
    return typeof value !== "string" || value.trim().length === 0;
  });

  return [...missingRedisKeys, ...missingProductionKeys];
}

export function runProdRateLimitEnvGuard(env = process.env, io = console) {
  if (!shouldEnforceProdRateLimitEnv(env)) {
    io.log(
      "PRODUCTION ENV CHECK: skipped (not a production-target release).",
    );
    return 0;
  }

  const missing = findMissingRequiredEnvVars(env);
  if (missing.length > 0) {
    io.error(
      `PRODUCTION ENV CHECK FAILED: missing required env vars: ${missing.join(", ")}`,
    );
    io.error(
      "Set these variables in the production environment before build/deploy.",
    );
    return 1;
  }

  io.log(
    "PRODUCTION ENV CHECK: OK (production release-critical env vars are configured).",
  );
  return 0;
}

function main() {
  const exitCode = runProdRateLimitEnvGuard(process.env, console);
  process.exit(exitCode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
