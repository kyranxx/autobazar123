import { spawnSync } from "node:child_process";

const requestedModel = process.env.REQUESTED_CODEX_MODEL || "gpt-5.3-codex";
const strictMode = process.env.STRICT_MODEL_CHECK === "1";

const prompt = 'Say exactly this sentence and nothing else: "Hello, this is the answer."';

const result = spawnSync(
  "codex",
  [
    "exec",
    "--skip-git-repo-check",
    "-s",
    "read-only",
    "-m",
    requestedModel,
    prompt,
  ],
  {
    encoding: "utf8",
    env: { ...process.env, RUST_LOG: "codex_api::sse::responses=trace" },
  },
);

if (result.error) {
  if (strictMode) {
    console.error(`MODEL CHECK FAILED: codex command unavailable (${result.error.message})`);
    process.exit(1);
  }

  console.log(`MODEL CHECK SKIPPED: codex command unavailable (${result.error.message})`);
  process.exit(0);
}

const stderr = result.stderr || "";
const modelMatches = [...stderr.matchAll(/"model":"([^"]+)"/g)];
const actualModels = [...new Set(modelMatches.map((m) => m[1]))].sort();

if (actualModels.length === 0) {
  if (strictMode) {
    console.error("MODEL CHECK FAILED: no model identifiers found in codex stderr logs.");
    process.exit(1);
  }

  console.log("MODEL CHECK SKIPPED: no model identifiers found in codex stderr logs.");
  process.exit(0);
}

if (actualModels.length === 1 && actualModels[0] === requestedModel) {
  console.log(`MODEL CHECK OK: requested=${requestedModel} actual=${actualModels[0]}`);
  process.exit(0);
}

console.error(
  `MODEL MISMATCH: requested=${requestedModel} actual=${actualModels.join(",")}`,
);
process.exit(1);
