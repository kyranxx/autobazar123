import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  DEFAULT_TARGET_REQUIREMENTS,
  DEFAULT_VERCEL_CLI_PACKAGE,
  LOCAL_PRODUCTION_AUDIT_ENV_PULL_KEYS,
  LOCAL_PRODUCTION_AUDIT_SENSITIVE_ENV_NAMES,
  analyzeVercelEnvTarget,
  buildVercelEnvListJsonInvocation,
  buildVercelEnvPullInvocation,
  formatVercelEnvValueReport,
  hasEffectiveEnvValue,
  parseArgs,
  parseEnvText,
  parseEnvMetadataJson,
  resolveVercelCliPackage,
  runVercelEnvValueCheck,
} from "./check-vercel-env-values.mjs";

test("default Vercel env requirements separate pull-readable values from sensitive metadata", () => {
  assert.deepEqual(
    DEFAULT_TARGET_REQUIREMENTS.map((requirement) => requirement.target),
    ["preview", "production"],
  );
  assert.deepEqual(LOCAL_PRODUCTION_AUDIT_ENV_PULL_KEYS, [
    "UPSTASH_REDIS_REST_URL",
  ]);
  assert.deepEqual(LOCAL_PRODUCTION_AUDIT_SENSITIVE_ENV_NAMES, [
    "UPSTASH_REDIS_REST_TOKEN",
  ]);

  for (const requirement of DEFAULT_TARGET_REQUIREMENTS) {
    assert.deepEqual(requirement.requiredPullKeys, LOCAL_PRODUCTION_AUDIT_ENV_PULL_KEYS);
    assert.deepEqual(
      requirement.requiredSensitiveNames,
      LOCAL_PRODUCTION_AUDIT_SENSITIVE_ENV_NAMES,
    );
    assert.ok(!requirement.requiredPullKeys.includes("STRIPE_SECRET_KEY"));
    assert.ok(!requirement.requiredPullKeys.includes("STRIPE_WEBHOOK_SECRET"));
    assert.ok(!requirement.requiredPullKeys.includes("RESEND_API_KEY"));
  }
});

test("parseEnvText and hasEffectiveEnvValue handle quoted blanks and real values", () => {
  const env = parseEnvText(`
UPSTASH_REDIS_REST_URL="https://example.upstash.io"
UPSTASH_REDIS_REST_TOKEN=""
STRIPE_SECRET_KEY='   '
RESEND_API_KEY=re_secret_value
`);

  assert.equal(hasEffectiveEnvValue(env, "UPSTASH_REDIS_REST_URL"), true);
  assert.equal(hasEffectiveEnvValue(env, "UPSTASH_REDIS_REST_TOKEN"), false);
  assert.equal(hasEffectiveEnvValue(env, "STRIPE_SECRET_KEY"), false);
  assert.equal(hasEffectiveEnvValue(env, "RESEND_API_KEY"), true);
});

test("parseEnvMetadataJson extracts key and type only", () => {
  const metadata = parseEnvMetadataJson(JSON.stringify([
    { key: "UPSTASH_REDIS_REST_TOKEN", type: "sensitive", value: "secret-token" },
    { name: "UPSTASH_REDIS_REST_URL", type: "encrypted", value: "https://example.com" },
  ]));

  assert.equal(metadata.get("UPSTASH_REDIS_REST_TOKEN")?.type, "sensitive");
  assert.equal(metadata.get("UPSTASH_REDIS_REST_URL")?.type, "encrypted");
});

test("analyzeVercelEnvTarget reports only missing key names, not secret values", () => {
  const result = analyzeVercelEnvTarget({
    target: "production",
    requiredPullKeys: [
      "UPSTASH_REDIS_REST_URL",
      "STRIPE_SECRET_KEY",
    ],
    requiredSensitiveNames: ["UPSTASH_REDIS_REST_TOKEN"],
    metadataText: JSON.stringify([
      { key: "UPSTASH_REDIS_REST_TOKEN", type: "sensitive", value: "super-secret-token" },
    ]),
    envText:
      "UPSTASH_REDIS_REST_URL=https://example.upstash.io\n" +
      "UPSTASH_REDIS_REST_TOKEN=super-secret-token\n" +
      "STRIPE_SECRET_KEY=\n",
  });
  const report = formatVercelEnvValueReport({
    ok: result.ok,
    targets: [result],
    tempDirRemoved: true,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.missingPullKeys, ["STRIPE_SECRET_KEY"]);
  assert.deepEqual(result.missingSensitiveNames, []);
  assert.match(report, /STRIPE_SECRET_KEY/u);
  assert.doesNotMatch(report, /super-secret-token/u);
});

test("analyzeVercelEnvTarget passes when token is sensitive metadata and absent from pull output", () => {
  const result = analyzeVercelEnvTarget({
    target: "preview",
    requiredPullKeys: ["UPSTASH_REDIS_REST_URL"],
    requiredSensitiveNames: ["UPSTASH_REDIS_REST_TOKEN"],
    envText: "UPSTASH_REDIS_REST_URL=https://example.upstash.io\n",
    metadataText: JSON.stringify([
      { key: "UPSTASH_REDIS_REST_TOKEN", type: "sensitive" },
      { key: "UPSTASH_REDIS_REST_URL", type: "encrypted" },
    ]),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.missingPullKeys, []);
  assert.deepEqual(result.missingSensitiveNames, []);
  assert.deepEqual(result.nonSensitiveNames, []);
});

test("analyzeVercelEnvTarget blocks when required token is not marked sensitive", () => {
  const result = analyzeVercelEnvTarget({
    target: "preview",
    requiredPullKeys: ["UPSTASH_REDIS_REST_URL"],
    requiredSensitiveNames: ["UPSTASH_REDIS_REST_TOKEN"],
    envText: "UPSTASH_REDIS_REST_URL=https://example.upstash.io\n",
    metadataText: JSON.stringify([
      { key: "UPSTASH_REDIS_REST_TOKEN", type: "encrypted" },
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.nonSensitiveNames, ["UPSTASH_REDIS_REST_TOKEN"]);
});

test("runVercelEnvValueCheck deletes temporary env files after inspection", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "vercel-env-test-"));
  const result = runVercelEnvValueCheck({
    tempRoot,
    requirements: [
      {
        target: "preview",
        requiredPullKeys: ["UPSTASH_REDIS_REST_URL"],
        requiredSensitiveNames: ["UPSTASH_REDIS_REST_TOKEN"],
      },
      {
        target: "production",
        requiredPullKeys: ["UPSTASH_REDIS_REST_URL", "STRIPE_SECRET_KEY"],
        requiredSensitiveNames: ["UPSTASH_REDIS_REST_TOKEN"],
      },
    ],
    pullTargetEnv({ target, outputFile }) {
      const envText =
        target === "preview"
          ? "UPSTASH_REDIS_REST_URL=https://preview.upstash.io\n"
          : "UPSTASH_REDIS_REST_URL=\nSTRIPE_SECRET_KEY=sk_live_test\n";
      writeFileSync(outputFile, envText, "utf8");
      return { exitCode: 0 };
    },
    listTargetMetadata({ target }) {
      const rows =
        target === "preview"
          ? [{ key: "UPSTASH_REDIS_REST_TOKEN", type: "sensitive" }]
          : [{ key: "UPSTASH_REDIS_REST_TOKEN", type: "sensitive" }];
      return { exitCode: 0, stdout: JSON.stringify(rows) };
    },
  });
  const report = formatVercelEnvValueReport(result);

  assert.equal(result.ok, false);
  assert.equal(result.tempDirRemoved, true);
  assert.deepEqual(result.targets[0].missingPullKeys, []);
  assert.deepEqual(result.targets[1].missingPullKeys, ["UPSTASH_REDIS_REST_URL"]);
  assert.match(report, /tempFilesDeleted=yes/u);
  assert.doesNotMatch(report, /sk_live_test/u);
});

test("runVercelEnvValueCheck treats vercel pull failures as blockers", () => {
  const result = runVercelEnvValueCheck({
    requirements: [
      {
        target: "preview",
        requiredPullKeys: ["UPSTASH_REDIS_REST_URL"],
        requiredSensitiveNames: ["UPSTASH_REDIS_REST_TOKEN"],
      },
    ],
    pullTargetEnv() {
      return {
        exitCode: 1,
        error: "not authenticated",
      };
    },
  });
  const report = formatVercelEnvValueReport(result);

  assert.equal(result.ok, false);
  assert.equal(result.targets[0].pullFailed, true);
  assert.match(report, /vercel env pull failed for preview/u);
  assert.match(report, /not authenticated/u);
});

test("runVercelEnvValueCheck treats metadata failures as blockers", () => {
  const result = runVercelEnvValueCheck({
    requirements: [
      {
        target: "preview",
        requiredPullKeys: ["UPSTASH_REDIS_REST_URL"],
        requiredSensitiveNames: ["UPSTASH_REDIS_REST_TOKEN"],
      },
    ],
    pullTargetEnv({ outputFile }) {
      writeFileSync(outputFile, "UPSTASH_REDIS_REST_URL=https://example.upstash.io\n", "utf8");
      return { exitCode: 0 };
    },
    listTargetMetadata() {
      return { exitCode: 1, error: "not authenticated" };
    },
  });
  const report = formatVercelEnvValueReport(result);

  assert.equal(result.ok, false);
  assert.equal(result.targets[0].metadataFailed, true);
  assert.match(report, /env ls --format json failed/u);
});

test("buildVercelEnvPullInvocation and buildVercelEnvListJsonInvocation wrap npx safely", () => {
  assert.deepEqual(
    buildVercelEnvPullInvocation("preview", "C:\\Temp\\preview.env", "win32"),
    {
      command: "cmd.exe",
      args: [
        "/d",
        "/s",
        "/c",
        `npx ${DEFAULT_VERCEL_CLI_PACKAGE} env pull C:\\Temp\\preview.env --environment=preview --yes`,
      ],
    },
  );
  assert.deepEqual(
    buildVercelEnvPullInvocation("production", "/tmp/prod.env", "linux"),
    {
      command: "npx",
      args: [
        DEFAULT_VERCEL_CLI_PACKAGE,
        "env",
        "pull",
        "/tmp/prod.env",
        "--environment=production",
        "--yes",
      ],
    },
  );
  assert.deepEqual(buildVercelEnvListJsonInvocation("preview", "win32"), {
    command: "cmd.exe",
    args: ["/d", "/s", "/c", `npx ${DEFAULT_VERCEL_CLI_PACKAGE} env ls preview --format json`],
  });
  assert.deepEqual(buildVercelEnvListJsonInvocation("production", "linux"), {
    command: "npx",
    args: [
      DEFAULT_VERCEL_CLI_PACKAGE,
      "env",
      "ls",
      "production",
      "--format",
      "json",
    ],
  });
});

test("resolveVercelCliPackage defaults to the verified stable package and supports override", () => {
  assert.equal(resolveVercelCliPackage({}), DEFAULT_VERCEL_CLI_PACKAGE);
  assert.equal(
    resolveVercelCliPackage({ VERCEL_CLI_PACKAGE: " vercel@latest " }),
    "vercel@latest",
  );
});

test("parseArgs supports json and help", () => {
  assert.deepEqual(parseArgs(["--json"]), { json: true, help: false });
  assert.deepEqual(parseArgs(["--help"]), { json: false, help: true });
});
