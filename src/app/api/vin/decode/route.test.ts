import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rejectWhenInvalidCsrfMock = vi.fn();
const rejectWhenStrictRateLimitedMock = vi.fn();
const requireAuthenticatedUserMock = vi.fn();
const parseJsonBodyMock = vi.fn();
const createClientMock = vi.fn();
const getTrimmedEnvMock = vi.fn();
const getFlagsForClientMock = vi.fn();
const decodeVinWithVincarioMock = vi.fn();

vi.mock("@/lib/api/route-helpers", () => ({
  parseJsonBody: (...args: unknown[]) => parseJsonBodyMock(...args),
  rejectWhenInvalidCsrf: (...args: unknown[]) => rejectWhenInvalidCsrfMock(...args),
  rejectWhenStrictRateLimited: (...args: unknown[]) =>
    rejectWhenStrictRateLimitedMock(...args),
  requireAuthenticatedUser: (...args: unknown[]) =>
    requireAuthenticatedUserMock(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

vi.mock("@/lib/env", () => ({
  getTrimmedEnv: (...args: unknown[]) => getTrimmedEnvMock(...args),
}));

vi.mock("@/lib/feature-flags", () => ({
  getFlagsForClient: (...args: unknown[]) => getFlagsForClientMock(...args),
}));

vi.mock("@/lib/vin/decode", () => ({
  decodeVinWithVincario: (...args: unknown[]) => decodeVinWithVincarioMock(...args),
  normalizeVinInput: (value: string) => value.toUpperCase().replace(/\s+/g, "").trim(),
}));

import { POST } from "./route";

function createRequest() {
  return new NextRequest("http://localhost/api/vin/decode", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: "csrf_token=test",
      "x-csrf-token": "test",
    },
    body: JSON.stringify({
      vin: "wvw zzz1jz3w386752",
      modelYear: 2003,
    }),
  });
}

describe("POST /api/vin/decode", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rejectWhenInvalidCsrfMock.mockReturnValue(null);
    rejectWhenStrictRateLimitedMock.mockResolvedValue(null);
    createClientMock.mockResolvedValue({});
    requireAuthenticatedUserMock.mockResolvedValue({ id: "user-123" });
    parseJsonBodyMock.mockResolvedValue({
      vin: "wvw zzz1jz3w386752",
      modelYear: 2003,
    });
    getTrimmedEnvMock.mockImplementation((name: string) => {
      if (name === "VINCARIO_API_KEY") return "api-key";
      if (name === "VINCARIO_SECRET_KEY") return "secret-key";
      return null;
    });
    getFlagsForClientMock.mockResolvedValue({ vin_decoding: true });
    decodeVinWithVincarioMock.mockResolvedValue({
      vin: "WVWZZZ1JZ3W386752",
      makeName: "Volkswagen",
      modelName: "Golf",
      modelYear: 2003,
      bodyStyle: "hatchback",
      fuel: "diesel",
      transmission: "manual",
      engineVolumeCm3: 1896,
      driveType: "front",
      provider: "vincario",
    });
  });

  it("blocks decoding when the admin feature flag is off", async () => {
    getFlagsForClientMock.mockResolvedValue({ vin_decoding: false });

    const response = await POST(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      error: "VIN decoding is currently disabled.",
    });
    expect(decodeVinWithVincarioMock).not.toHaveBeenCalled();
  });

  it("blocks decoding when Vincario credentials are missing", async () => {
    getTrimmedEnvMock.mockReturnValue(null);

    const response = await POST(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      error: "European VIN decoder is not configured.",
    });
    expect(decodeVinWithVincarioMock).not.toHaveBeenCalled();
  });

  it("decodes the VIN when the feature flag and credentials are available", async () => {
    const response = await POST(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      decoded: {
        vin: "WVWZZZ1JZ3W386752",
        makeName: "Volkswagen",
        modelName: "Golf",
        modelYear: 2003,
        bodyStyle: "hatchback",
        fuel: "diesel",
        transmission: "manual",
        engineVolumeCm3: 1896,
        driveType: "front",
        provider: "vincario",
      },
    });
    expect(getFlagsForClientMock).toHaveBeenCalledWith("user-123");
    expect(decodeVinWithVincarioMock).toHaveBeenCalledWith(
      "WVWZZZ1JZ3W386752",
      "api-key",
      "secret-key",
    );
  });
});
