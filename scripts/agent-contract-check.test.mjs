import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { validateAgentContract } from "./agent-contract-check.mjs";

const validContract = {
  version: 1,
  repository: "owner/repo",
  riskTierRules: {
    high: ["src/**"],
    low: ["**"],
  },
  requiredChecksByTier: {
    high: ["test:a"],
    low: ["test:a"],
  },
  docsSyncRules: [
    {
      requiredDocs: ["docs/a.md"],
    },
  ],
  reviewPolicy: {
    requireCurrentHeadEvidence: true,
    rejectStaleReviewState: true,
    allowAutoResolveBotOnlyThreads: true,
  },
};

test("validateAgentContract accepts valid contract", () => {
  const root = mkdtempSync(join(tmpdir(), "contract-check-"));
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs/a.md"), "doc", "utf8");

  const result = validateAgentContract(validContract, { "test:a": "echo ok" }, root);
  assert.deepEqual(result.errors, []);
});

test("validateAgentContract fails when low fallback is missing", () => {
  const root = mkdtempSync(join(tmpdir(), "contract-check-"));
  const invalid = {
    ...validContract,
    riskTierRules: { high: ["src/**"] },
  };
  const result = validateAgentContract(invalid, { "test:a": "echo ok" }, root);
  assert.ok(result.errors.some((value) => value.includes("riskTierRules.low")));
});
