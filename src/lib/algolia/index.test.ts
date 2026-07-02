import { describe, expect, it } from "vitest";
import { transformCarToAlgoliaRecord } from "./index";

describe("transformCarToAlgoliaRecord", () => {
  it("keeps the source market code on indexed records", () => {
    const record = transformCarToAlgoliaRecord({
      id: "ad-1",
      market_code: "RO",
      brands: { name: "Dacia" },
      models: { name: "Duster" },
    });

    expect(record.market_code).toBe("RO");
  });

  it("defaults records without a known market code to Slovakia", () => {
    const record = transformCarToAlgoliaRecord({
      id: "ad-2",
      market_code: "CZ",
      brands: { name: "Skoda" },
      models: { name: "Octavia" },
    });

    expect(record.market_code).toBe("SK");
  });
});
