import test from "node:test";
import assert from "node:assert/strict";

import { runEasyOps } from "./easy-ops.mjs";

test("easy ops exports callable function", () => {
  assert.equal(typeof runEasyOps, "function");
});
