import { describe, expect, it } from "vitest";
import { buildVehicleTaxonomy } from "./public";

describe("buildVehicleTaxonomy", () => {
  it("deduplicates model names within each brand before exposing public taxonomy", () => {
    const taxonomy = buildVehicleTaxonomy(
      [{ id: "brand-vw", name: "Volkswagen", slug: "volkswagen", is_popular: true }],
      [
        { id: "model-id3-a", brand_id: "brand-vw", name: "ID.3", slug: "id3" },
        { id: "model-id3-b", brand_id: "brand-vw", name: "ID.3", slug: "id-3" },
        { id: "model-id4-a", brand_id: "brand-vw", name: "ID.4", slug: "id4" },
        { id: "model-id4-b", brand_id: "brand-vw", name: "ID.4", slug: "id-4" },
        { id: "model-passat", brand_id: "brand-vw", name: "Passat", slug: "passat" },
      ],
    );

    expect(taxonomy.modelsByBrandId["brand-vw"]).toEqual([
      { id: "model-id3-b", name: "ID.3", slug: "id-3", isPopular: false },
      { id: "model-id4-b", name: "ID.4", slug: "id-4", isPopular: false },
      { id: "model-passat", name: "Passat", slug: "passat", isPopular: false },
    ]);
  });
});
