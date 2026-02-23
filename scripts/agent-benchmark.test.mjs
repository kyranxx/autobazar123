import test from "node:test";
import assert from "node:assert/strict";

import {
  validateSuite,
  createReportTemplate,
  scoreReport,
} from "./agent-benchmark.mjs";

const suite = {
  name: "demo-suite",
  tasks: [
    { id: "a", title: "Task A", weight: 1 },
    { id: "b", title: "Task B", weight: 2 },
  ],
};

test("validateSuite accepts valid suite", () => {
  assert.deepEqual(validateSuite(suite), []);
});

test("createReportTemplate creates all task entries", () => {
  const template = createReportTemplate(suite);
  assert.equal(template.evaluations.length, 2);
  assert.equal(template.evaluations[0].taskId, "a");
});

test("scoreReport computes weighted score and grade", () => {
  const report = {
    evaluations: [
      { taskId: "a", status: "pass", score: 100 },
      { taskId: "b", status: "partial", score: 50 },
    ],
  };
  const result = scoreReport(suite, report);
  assert.equal(result.errors.length, 0);
  assert.equal(result.summary.finalScore, 66.67);
  assert.equal(result.summary.grade, "D");
});

test("scoreReport fails on unknown task id", () => {
  const report = {
    evaluations: [
      { taskId: "a", status: "pass", score: 100 },
      { taskId: "b", status: "pass", score: 100 },
      { taskId: "unknown", status: "pass", score: 100 },
    ],
  };
  const result = scoreReport(suite, report);
  assert.equal(result.errors.length, 1);
});
