import test from "node:test";
import assert from "node:assert/strict";

import {
  compareSemver,
  evaluateFrameworkPatchPosture,
  parseSemver,
} from "./framework-patch-posture.mjs";

const BASE_CONFIG = {
  enforceReactDomVersionParity: true,
  packages: [
    { name: "next", maxLagDays: 7 },
    { name: "react", maxLagDays: 14 },
    { name: "react-dom", maxLagDays: 14 },
  ],
};

test("parseSemver parses stable versions and rejects invalid input", () => {
  assert.deepEqual(parseSemver("16.1.6"), { major: 16, minor: 1, patch: 6 });
  assert.deepEqual(parseSemver("19.2.4-beta.1"), { major: 19, minor: 2, patch: 4 });
  assert.equal(parseSemver("^19.2.4"), null);
  assert.equal(parseSemver(undefined), null);
});

test("compareSemver compares version precedence", () => {
  assert.equal(compareSemver("16.1.6", "16.1.6"), 0);
  assert.equal(compareSemver("16.1.7", "16.1.6"), 1);
  assert.equal(compareSemver("16.1.5", "16.1.6"), -1);
});

test("evaluateFrameworkPatchPosture passes when installed versions are current", () => {
  const result = evaluateFrameworkPatchPosture(
    BASE_CONFIG,
    {
      next: "16.1.6",
      react: "19.2.4",
      "react-dom": "19.2.4",
    },
    {
      next: {
        latest: "16.1.6",
        time: { "16.1.6": "2026-01-27T00:00:00.000Z" },
      },
      react: {
        latest: "19.2.4",
        time: { "19.2.4": "2026-01-26T00:00:00.000Z" },
      },
      "react-dom": {
        latest: "19.2.4",
        time: { "19.2.4": "2026-01-26T00:00:00.000Z" },
      },
    },
    new Date("2026-03-05T00:00:00.000Z"),
  );

  assert.deepEqual(result.errors, []);
});

test("evaluateFrameworkPatchPosture fails when patch lag exceeds grace window", () => {
  const result = evaluateFrameworkPatchPosture(
    BASE_CONFIG,
    {
      next: "16.1.6",
      react: "19.2.3",
      "react-dom": "19.2.3",
    },
    {
      next: {
        latest: "16.1.6",
        time: { "16.1.6": "2026-01-27T00:00:00.000Z" },
      },
      react: {
        latest: "19.2.4",
        time: { "19.2.4": "2026-01-26T00:00:00.000Z" },
      },
      "react-dom": {
        latest: "19.2.3",
        time: { "19.2.3": "2026-01-20T00:00:00.000Z" },
      },
    },
    new Date("2026-03-05T00:00:00.000Z"),
  );

  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /react is outside patch posture window/);
});

test("evaluateFrameworkPatchPosture warns on major upgrades and enforces react parity", () => {
  const result = evaluateFrameworkPatchPosture(
    BASE_CONFIG,
    {
      next: "16.1.6",
      react: "19.2.4",
      "react-dom": "19.2.3",
    },
    {
      next: {
        latest: "17.0.0",
        time: { "17.0.0": "2026-02-28T00:00:00.000Z" },
      },
      react: {
        latest: "19.2.4",
        time: { "19.2.4": "2026-01-26T00:00:00.000Z" },
      },
      "react-dom": {
        latest: "19.2.4",
        time: { "19.2.4": "2026-01-26T00:00:00.000Z" },
      },
    },
    new Date("2026-03-05T00:00:00.000Z"),
  );

  assert.equal(result.errors.length, 2);
  assert.ok(result.errors.some((error) => /outside patch posture window/.test(error)));
  assert.ok(result.errors.some((error) => /react\/react-dom parity check failed/.test(error)));
  assert.ok(result.warnings.some((warning) => warning.includes("newer major release")));
});
