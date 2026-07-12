import { describe, expect, it } from "vitest";
import {
  getResultCountMessageKey,
  getVehicleCountMessageKey,
} from "./result-count-copy";

describe("search result count copy keys", () => {
  it("uses singular keys for one result", () => {
    expect(getVehicleCountMessageKey(1)).toBe("vehicleFound");
    expect(getResultCountMessageKey(1)).toBe("resultsSingle");
  });

  it("uses Slovak few-form keys only for counts 2 through 4", () => {
    for (const count of [2, 3, 4]) {
      expect(getVehicleCountMessageKey(count)).toBe("vehiclesFoundFew");
      expect(getResultCountMessageKey(count)).toBe("resultsFew");
    }
  });

  it("uses many-form keys for zero, five and larger counts", () => {
    for (const count of [0, 5, 14, 22]) {
      expect(getVehicleCountMessageKey(count)).toBe("vehiclesFound");
      expect(getResultCountMessageKey(count)).toBe("results");
    }
  });
});
