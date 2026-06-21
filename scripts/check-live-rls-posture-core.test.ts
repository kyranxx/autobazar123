import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyLiveRlsProbe,
  evaluateLiveRlsPosture,
  type LiveRlsProbeResult,
} from "./check-live-rls-posture-core";

test("classifies denied and empty anon probes as safe", () => {
  assert.equal(
    classifyLiveRlsProbe({
      name: "profiles.email",
      target: "public.profiles.email",
      rowCount: 0,
      errorCode: "42501",
      errorMessage: "permission denied for table profiles",
    }),
    "denied",
  );

  assert.equal(
    classifyLiveRlsProbe({
      name: "dealers raw table",
      target: "public.dealers",
      rowCount: 0,
    }),
    "empty",
  );

  const evaluation = evaluateLiveRlsPosture([
    {
      name: "profiles.email",
      target: "public.profiles.email",
      rowCount: 0,
      errorCode: "42501",
      errorMessage: "permission denied for table profiles",
    },
    {
      name: "dealers raw table",
      target: "public.dealers",
      rowCount: 0,
    },
  ]);

  assert.equal(evaluation.ok, true);
  assert.deepEqual(evaluation.errors, []);
  assert.deepEqual(evaluation.summary, {
    total: 2,
    safe: 2,
    leaked: 0,
    probeErrors: 0,
  });
});

test("reports leaked rows without carrying row values into output", () => {
  const rawProbeWithAccidentalValue = {
    name: "profiles.email",
    target: "public.profiles.email",
    rowCount: 1,
    sampleValue: "private-user@example.com",
  } as LiveRlsProbeResult & { sampleValue: string };

  const evaluation = evaluateLiveRlsPosture([rawProbeWithAccidentalValue]);

  assert.equal(evaluation.ok, false);
  assert.deepEqual(evaluation.summary, {
    total: 1,
    safe: 0,
    leaked: 1,
    probeErrors: 0,
  });
  assert.deepEqual(evaluation.errors, [
    "profiles.email returned 1 row(s) to the anon client.",
  ]);
  assert.doesNotMatch(JSON.stringify(evaluation), /private-user@example\.com/);
});

test("treats probe runner errors as operational failures", () => {
  const evaluation = evaluateLiveRlsPosture([
    {
      name: "profiles.phone",
      target: "public.profiles.phone",
      rowCount: 0,
      probeError: "fetch failed",
    },
  ]);

  assert.equal(evaluation.ok, false);
  assert.deepEqual(evaluation.summary, {
    total: 1,
    safe: 0,
    leaked: 0,
    probeErrors: 1,
  });
  assert.deepEqual(evaluation.errors, [
    "profiles.phone probe could not complete: fetch failed",
  ]);
});

test("treats unexpected PostgREST errors as operational failures", () => {
  assert.equal(
    classifyLiveRlsProbe({
      name: "profiles.email",
      target: "public.profiles.email",
      rowCount: 0,
      errorCode: "PGRST204",
      errorMessage: "Could not find the email column of profiles in the schema cache",
    }),
    "probe_error",
  );

  const evaluation = evaluateLiveRlsPosture([
    {
      name: "profiles.email",
      target: "public.profiles.email",
      rowCount: 0,
      errorCode: "PGRST204",
      errorMessage:
        "Could not find the email column of profiles in the schema cache",
    },
  ]);

  assert.equal(evaluation.ok, false);
  assert.deepEqual(evaluation.summary, {
    total: 1,
    safe: 0,
    leaked: 0,
    probeErrors: 1,
  });
  assert.deepEqual(evaluation.errors, [
    "profiles.email probe could not complete: PGRST204 Could not find the email column of profiles in the schema cache",
  ]);
});
