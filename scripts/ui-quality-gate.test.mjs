import test from "node:test";
import assert from "node:assert/strict";

import { parseUiQualityArgs, buildUiQualitySteps } from "./ui-quality-gate.mjs";

test("parseUiQualityArgs parses flags", () => {
  const parsed = parseUiQualityArgs(["--core-only", "--skip-unit"]);
  assert.equal(parsed.coreOnly, true);
  assert.equal(parsed.skipUnit, true);
});

test("buildUiQualitySteps filters sitewide and unit steps", () => {
  const steps = buildUiQualitySteps({ coreOnly: true, skipUnit: true });
  assert.equal(steps.length, 1);
  assert.equal(steps[0].id, "web-interface-core");
});
