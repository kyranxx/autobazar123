import { describe, expect, it } from "vitest";
import { findBrandInQuery, findModelInQuery } from "./search";

describe("findBrandInQuery", () => {
  it("finds a one-word alias", () => {
    const result = findBrandInQuery("hľadám skoda octavia", [
      "Škoda",
      "Volkswagen",
    ]);
    expect(result).toBe("Škoda");
  });

  it("finds a two-word alias", () => {
    const result = findBrandInQuery("alfa romeo stelvio", ["Alfa Romeo"]);
    expect(result).toBe("Alfa Romeo");
  });

  it("returns null when alias exists but brand is unavailable", () => {
    const result = findBrandInQuery("skoda octavia", ["BMW"]);
    expect(result).toBeNull();
  });

  it("matches available brand directly with accent normalization", () => {
    const result = findBrandInQuery("citroen c4", ["Citroën", "Opel"]);
    expect(result).toBe("Citroën");
  });

  it("returns null when no brand token is present", () => {
    const result = findBrandInQuery("predam auto rychlo", ["Škoda"]);
    expect(result).toBeNull();
  });
});

describe("findModelInQuery", () => {
  it("finds model by alias token", () => {
    const result = findModelInQuery("hľadám octavia combi", ["Octavia", "Fabia"]);
    expect(result).toBe("Octavia");
  });

  it("removes brand and brand alias before model lookup", () => {
    const result = findModelInQuery("vw golf", ["Golf", "Passat"], "Volkswagen");
    expect(result).toBe("Golf");
  });

  it("matches model directly when exact token is present", () => {
    const result = findModelInQuery("superb sportline", ["Superb"]);
    expect(result).toBe("Superb");
  });

  it("returns null when model alias exists but available models do not contain it", () => {
    const result = findModelInQuery("octavia", ["Fabia"]);
    expect(result).toBeNull();
  });

  it("returns null when query becomes empty after brand removal", () => {
    const result = findModelInQuery("skoda", ["Octavia"], "Škoda");
    expect(result).toBeNull();
  });
});
