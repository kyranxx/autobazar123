import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { evaluateSecurityPolicy } from "./security-release-gate.mjs";

function createFixtureTree() {
  const root = mkdtempSync(join(tmpdir(), "security-gate-"));
  mkdirSync(join(root, "src/app/api/account"), { recursive: true });
  mkdirSync(join(root, "src/app/api/account/password"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });

  writeFileSync(
    join(root, "src/app/api/account/password/route.ts"),
    "supabase.auth.getUser();\n// Unauthorized\n",
    "utf8",
  );
  writeFileSync(
    join(root, "docs/PROJECT_PLAYBOOK.md"),
    "Security Baseline\ntest:security:release-gate\n",
    "utf8",
  );
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify(
      {
        scripts: {
          "test:security:release-gate": "node scripts/security-release-gate.mjs",
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  return root;
}

test("evaluateSecurityPolicy returns no errors for satisfied policy", () => {
  const root = createFixtureTree();
  const policy = {
    requiredFiles: ["src/app/api/account/password/route.ts", "docs/PROJECT_PLAYBOOK.md"],
    requiredMarkers: [
      {
        file: "src/app/api/account/password/route.ts",
        markers: ["supabase.auth.getUser", "Unauthorized"],
      },
    ],
    requiredDocTokens: [
      {
        file: "docs/PROJECT_PLAYBOOK.md",
        tokens: ["Security Baseline"],
      },
    ],
    requiredPackageScripts: ["test:security:release-gate"],
  };

  const result = evaluateSecurityPolicy(policy, root);
  assert.deepEqual(result.errors, []);
});

test("evaluateSecurityPolicy reports missing markers", () => {
  const root = createFixtureTree();
  const policy = {
    requiredFiles: ["src/app/api/account/password/route.ts"],
    requiredMarkers: [
      {
        file: "src/app/api/account/password/route.ts",
        markers: ["THIS_MARKER_IS_MISSING"],
      },
    ],
  };

  const result = evaluateSecurityPolicy(policy, root);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /THIS_MARKER_IS_MISSING/);
});
