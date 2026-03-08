import { describe, expect, it } from "vitest";
import { mergePersistentRefinementOptions } from "./FilterSidebar";

describe("mergePersistentRefinementOptions", () => {
  it("keeps previously seen brand options visible after one brand is selected", () => {
    const persistedItems = [
      { value: "Audi", label: "Audi", count: 24, isRefined: false },
      { value: "BMW", label: "BMW", count: 18, isRefined: false },
      { value: "Skoda", label: "Skoda", count: 31, isRefined: false },
    ];
    const liveItems = [{ value: "Audi", label: "Audi", count: 24, isRefined: true }];

    expect(
      mergePersistentRefinementOptions(persistedItems, liveItems, ["Audi"]),
    ).toEqual([
      { value: "Audi", label: "Audi", count: 24, isRefined: true },
      { value: "Skoda", label: "Skoda", count: 31, isRefined: false },
      { value: "BMW", label: "BMW", count: 18, isRefined: false },
    ]);
  });

  it("injects selected brands that are temporarily missing from live facet values", () => {
    const persistedItems = [{ value: "BMW", label: "BMW", count: 18, isRefined: false }];

    expect(
      mergePersistentRefinementOptions(persistedItems, [], ["Volvo"]),
    ).toEqual([
      { value: "Volvo", label: "Volvo", count: 0, isRefined: true },
      { value: "BMW", label: "BMW", count: 18, isRefined: false },
    ]);
  });
});
