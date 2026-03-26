import { describe, expect, it } from "vitest";
import {
  createVincarioControlSum,
  decodeVinWithVincario,
  isNormalizedVin,
  mapVincarioDecodeEntriesToListingVinData,
  normalizeVinInput,
} from "./decode";

describe("normalizeVinInput", () => {
  it("uppercases and strips whitespace", () => {
    expect(normalizeVinInput(" wvw zzz1jz3w386752 ")).toBe("WVWZZZ1JZ3W386752");
  });
});

describe("isNormalizedVin", () => {
  it("accepts only valid VIN characters", () => {
    expect(isNormalizedVin("WVWZZZ1JZ3W386752")).toBe(true);
    expect(isNormalizedVin("WVWZZZ1JZ3W38675I")).toBe(false);
  });
});

describe("createVincarioControlSum", () => {
  it("creates the expected Vincario request signature", () => {
    expect(
      createVincarioControlSum(
        "WVWZZZ1JZ3W386752",
        "api-key",
        "secret-key",
      ),
    ).toHaveLength(10);
  });
});

describe("mapVincarioDecodeEntriesToListingVinData", () => {
  it("maps Vincario labels into listing-compatible values", () => {
    expect(
      mapVincarioDecodeEntriesToListingVinData("WVWZZZ1JZ3W386752", [
        { label: "Make", value: "Volkswagen" },
        { label: "Model", value: "Golf" },
        { label: "Model Year", value: "2003" },
        { label: "Body", value: "Hatchback" },
        { label: "Fuel Type - Primary", value: "Diesel" },
        { label: "Transmission", value: "Manual" },
        { label: "Displacement (ccm)", value: "1896" },
        { label: "Drive", value: "Front-Wheel Drive" },
      ]),
    ).toEqual({
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
});

describe("decodeVinWithVincario", () => {
  it("rejects invalid VIN input before calling the provider", async () => {
    await expect(
      decodeVinWithVincario("invalid-vin", "api-key", "secret-key", async () => {
        throw new Error("should not reach provider");
      }),
    ).rejects.toThrow("VIN must be a valid 17-character code.");
  });
});
