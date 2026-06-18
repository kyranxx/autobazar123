import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { _internal } from "./route-internals";

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

  it("extracts bearer token from authorization header", () => {
    const request = new NextRequest("https://example.com/api/monitoring/quality-gates", {
      headers: {
        authorization: "Bearer test-token",
      },
    });
    expect(_internal.getBearerToken(request)).toBe("test-token");
  });

  it("authorizes requests with valid shared secret", async () => {
    const request = new NextRequest("https://example.com/api/monitoring/quality-gates", {
      headers: {
        "x-monitoring-secret": "shared-secret",
      },
    });
    await expect(
      _internal.authorizeMonitoringRequest(request, "shared-secret"),
    ).resolves.toEqual({
      ok: true,
      source: "shared_secret",
    });
  });

  it("rejects requests without auth headers", async () => {
    const request = new NextRequest("https://example.com/api/monitoring/quality-gates");
    await expect(
      _internal.authorizeMonitoringRequest(request, "shared-secret"),
    ).resolves.toEqual({
      ok: false,
      status: 401,
      error: "Unauthorized",
    });
  });
});
