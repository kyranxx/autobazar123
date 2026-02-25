import test from "node:test";
import assert from "node:assert/strict";

import {
  findMissingRequiredEnvVars,
  runProdRateLimitEnvGuard,
  shouldEnforceProdRateLimitEnv,
} from "./check-prod-rate-limit-env.mjs";

function createIoBuffer() {
  const logs = [];
  const errors = [];
  return {
    io: {
      log: (message) => logs.push(message),
      error: (message) => errors.push(message),
    },
    logs,
    errors,
  };
}

test("shouldEnforceProdRateLimitEnv enforces for production targets", () => {
  assert.equal(
    shouldEnforceProdRateLimitEnv({ RELEASE_ENV: "production" }),
    true,
  );
  assert.equal(
    shouldEnforceProdRateLimitEnv({ VERCEL_ENV: "production" }),
    true,
  );
  assert.equal(
    shouldEnforceProdRateLimitEnv({ CHECK_PROD_RATE_LIMIT_ENV: "true" }),
    true,
  );
  assert.equal(
    shouldEnforceProdRateLimitEnv({ VERCEL_ENV: "preview" }),
    false,
  );
});

test("findMissingRequiredEnvVars detects missing vars", () => {
  assert.deepEqual(
    findMissingRequiredEnvVars({ UPSTASH_REDIS_REST_URL: "https://x" }),
    ["UPSTASH_REDIS_REST_TOKEN"],
  );
});

test("runProdRateLimitEnvGuard skips outside production targets", () => {
  const { io, logs, errors } = createIoBuffer();
  const status = runProdRateLimitEnvGuard({ VERCEL_ENV: "preview" }, io);

  assert.equal(status, 0);
  assert.equal(errors.length, 0);
  assert.match(logs[0], /skipped/);
});

test("runProdRateLimitEnvGuard fails when production vars are missing", () => {
  const { io, errors } = createIoBuffer();
  const status = runProdRateLimitEnvGuard({ RELEASE_ENV: "production" }, io);

  assert.equal(status, 1);
  assert.match(errors[0], /UPSTASH_REDIS_REST_URL/);
  assert.match(errors[0], /UPSTASH_REDIS_REST_TOKEN/);
});

test("runProdRateLimitEnvGuard passes when all production vars exist", () => {
  const { io, logs, errors } = createIoBuffer();
  const status = runProdRateLimitEnvGuard(
    {
      RELEASE_ENV: "production",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
    },
    io,
  );

  assert.equal(status, 0);
  assert.equal(errors.length, 0);
  assert.match(logs[0], /OK/);
});
