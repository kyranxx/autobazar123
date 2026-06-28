import { beforeEach, describe, expect, it, vi } from "vitest";

const callOrder: string[] = [];
const connectionMock = vi.fn(async (..._args: unknown[]) => {
  callOrder.push("connection");
});
const getPublicVehicleTaxonomyMock = vi.fn(async (..._args: unknown[]) => {
  callOrder.push("taxonomy");
  return {
    brands: [{ id: "brand-1", name: "Skoda", slug: "skoda", isPopular: true }],
    modelsByBrandId: {
      "brand-1": [{ id: "model-1", name: "Octavia", slug: "octavia" }],
    },
  };
});

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>(
    "next/server",
  );

  return {
    ...actual,
    connection: (...args: unknown[]) => connectionMock(...args),
  };
});

vi.mock("@/lib/vehicle-taxonomy/public", () => ({
  getPublicVehicleTaxonomy: (...args: unknown[]) =>
    getPublicVehicleTaxonomyMock(...args),
}));

import { GET } from "./route";

describe("GET /api/vehicle-taxonomy", () => {
  beforeEach(() => {
    callOrder.length = 0;
    vi.clearAllMocks();
  });

  it("waits for a request boundary before loading cached taxonomy data", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(payload).toEqual({
      brands: [
        { id: "brand-1", name: "Skoda", slug: "skoda", isPopular: true },
      ],
      modelsByBrandId: {
        "brand-1": [{ id: "model-1", name: "Octavia", slug: "octavia" }],
      },
    });
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=3600",
    );
    expect(callOrder).toEqual(["connection", "taxonomy"]);
  });
});
