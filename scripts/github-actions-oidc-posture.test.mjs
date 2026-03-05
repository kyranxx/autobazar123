import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { evaluateGitHubActionsOidcPosture } from "./github-actions-oidc-posture.mjs";

function createFixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), "oidc-posture-"));
  mkdirSync(join(root, ".github/workflows"), { recursive: true });
  return root;
}

test("evaluateGitHubActionsOidcPosture passes with required workflow markers", () => {
  const root = createFixtureRoot();
  const workflowContent = `
permissions:
  contents: read
jobs:
  gate:
    permissions:
      contents: read
      id-token: write
    steps:
      - id: oidc-token
        run: |
          echo "$ACTIONS_ID_TOKEN_REQUEST_URL"
      - run: |
          curl -H "Authorization: Bearer $QUALITY_ALERT_OIDC_TOKEN" "$QUALITY_ALERT_WEBHOOK_URL"
`;
  writeFileSync(
    join(root, ".github/workflows/accessibility-quality-gate.yml"),
    workflowContent,
    "utf8",
  );
  writeFileSync(
    join(root, ".github/workflows/performance-budget-gate.yml"),
    workflowContent,
    "utf8",
  );

  const result = evaluateGitHubActionsOidcPosture(root);
  assert.deepEqual(result.errors, []);
});

test("evaluateGitHubActionsOidcPosture reports missing markers", () => {
  const root = createFixtureRoot();
  writeFileSync(
    join(root, ".github/workflows/accessibility-quality-gate.yml"),
    "name: missing",
    "utf8",
  );
  writeFileSync(
    join(root, ".github/workflows/performance-budget-gate.yml"),
    "name: missing",
    "utf8",
  );

  const result = evaluateGitHubActionsOidcPosture(root);
  assert.ok(result.errors.length > 0);
  assert.ok(result.errors.some((error) => error.includes("id-token: write")));
});

