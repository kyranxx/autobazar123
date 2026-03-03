import { spawnSync } from "node:child_process";

const strictMode = process.env.STRICT_CODEX_CLI_CHECK === "1";

const result = spawnSync("codex", ["--version"], {
  encoding: "utf8",
});

if (result.error) {
  if (strictMode) {
    console.error(`CODEX CLI CHECK FAILED: ${result.error.message}`);
    process.exit(1);
  }

  console.log(`CODEX CLI CHECK SKIPPED: ${result.error.message}`);
  process.exit(0);
}

if (result.status !== 0) {
  const stderr = (result.stderr || "").trim();
  if (strictMode) {
    console.error(`CODEX CLI CHECK FAILED: codex --version exited ${result.status}. ${stderr}`);
    process.exit(1);
  }

  console.log(`CODEX CLI CHECK SKIPPED: codex --version exited ${result.status}. ${stderr}`);
  process.exit(0);
}

const versionText = (result.stdout || "").trim();
if (!versionText) {
  if (strictMode) {
    console.error("CODEX CLI CHECK FAILED: empty version output.");
    process.exit(1);
  }

  console.log("CODEX CLI CHECK SKIPPED: empty version output.");
  process.exit(0);
}

console.log(`CODEX CLI CHECK OK: ${versionText}`);
