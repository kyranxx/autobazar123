import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { validateSkillGraph } from "./skill-graph-check.mjs";

test("validateSkillGraph passes when links resolve", () => {
  const root = mkdtempSync(join(tmpdir(), "skill-graph-"));
  mkdirSync(join(root, "maps"), { recursive: true });
  writeFileSync(join(root, "index.md"), "[[maps/a]]\n", "utf8");
  writeFileSync(join(root, "maps/a.md"), "# A\n", "utf8");

  const result = validateSkillGraph(root);
  assert.deepEqual(result.errors, []);
});

test("validateSkillGraph reports missing targets", () => {
  const root = mkdtempSync(join(tmpdir(), "skill-graph-"));
  writeFileSync(join(root, "index.md"), "[[missing/node]]\n", "utf8");

  const result = validateSkillGraph(root);
  assert.equal(result.errors.length, 1);
});
