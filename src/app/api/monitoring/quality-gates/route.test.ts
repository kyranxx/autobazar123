import { describe, expect, it } from "vitest";
import { _internal } from "./route";

describe("quality gate alert helpers", () => {
  it("maps successful conclusions to recovered state", () => {
    expect(_internal.toAlertMessage("success")).toBe("quality_gate_recovered");
  });

  it("maps non-success conclusions to failure state", () => {
    expect(_internal.toAlertMessage("failure")).toBe("quality_gate_failure");
    expect(_internal.toAlertMessage("timed_out")).toBe("quality_gate_failure");
  });

  it("assigns levels by conclusion", () => {
    expect(_internal.toAlertLevel("success")).toBe("info");
    expect(_internal.toAlertLevel("cancelled")).toBe("warn");
    expect(_internal.toAlertLevel("failure")).toBe("error");
  });

  it("builds deterministic fingerprint keys", () => {
    expect(
      _internal.toFingerprint("owner/repo", "accessibility-quality-gate.yml", "main"),
    ).toBe("quality-gate:owner/repo:accessibility-quality-gate.yml:main");
  });
});
