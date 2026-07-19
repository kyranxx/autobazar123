import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/anon", () => ({
  getAnonClient: () => ({
    from: (...args: unknown[]) => fromMock(...args),
  }),
}));

import {
  getPublicVehicleTaxonomy,
  getSeoVehicleTaxonomy,
} from "./public";

function createQuery(data: unknown[]) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    then: (resolve: (value: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve(resolve({ data, error: null })),
  };

  return query;
}

function createPagedQuery(data: unknown[]) {
  let range: [number, number] = [0, 999];
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn((from: number, to: number) => {
      range = [from, to];
      return query;
    }),
    then: (resolve: (value: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve(
        resolve({
          data: data.slice(range[0], range[1] + 1),
          error: null,
        }),
      ),
  };

  return query;
}

describe("vehicle taxonomy readers", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("returns only active brands and active models for public UI taxonomy", async () => {
    const brandQuery = createQuery([
      {
        id: "brand-volvo",
        name: "Volvo",
        slug: "volvo",
        is_popular: false,
      },
    ]);
    const modelQuery = createQuery([
      {
        id: "model-xc40",
        brand_id: "brand-volvo",
        name: "XC40",
        slug: "xc40",
      },
    ]);
    fromMock
      .mockReturnValueOnce(brandQuery)
      .mockReturnValueOnce(modelQuery);

    await expect(getPublicVehicleTaxonomy()).resolves.toEqual({
      brands: [
        {
          id: "brand-volvo",
          name: "Volvo",
          slug: "volvo",
          isPopular: false,
        },
      ],
      modelsByBrandId: {
        "brand-volvo": [
          {
            id: "model-xc40",
            name: "XC40",
            slug: "xc40",
            isPopular: false,
          },
        ],
      },
    });

    expect(brandQuery.eq).toHaveBeenCalledWith("is_active", true);
    expect(modelQuery.eq).toHaveBeenCalledWith("is_active", true);
    expect(brandQuery.range).toHaveBeenCalledWith(0, 999);
    expect(modelQuery.range).toHaveBeenCalledWith(0, 999);
  });

  it("paginates models past Supabase's default 1000-row response cap", async () => {
    const brandQuery = createPagedQuery([
      {
        id: "brand-volvo",
        name: "Volvo",
        slug: "volvo",
        is_popular: false,
      },
    ]);
    const modelRows = Array.from({ length: 1001 }, (_, index) => ({
      id: `model-${index}`,
      brand_id: "brand-volvo",
      name: `Model ${index}`,
      slug: `model-${index}`,
    }));
    const modelQuery = createPagedQuery(modelRows);
    fromMock
      .mockImplementation((table: string) =>
        table === "brands" ? brandQuery : modelQuery,
      );

    const taxonomy = await getPublicVehicleTaxonomy();

    expect(taxonomy.modelsByBrandId["brand-volvo"]).toHaveLength(1001);
    expect(modelQuery.range).toHaveBeenCalledWith(0, 999);
    expect(modelQuery.range).toHaveBeenCalledWith(1000, 1999);
  });

  it("keeps programmatic SEO taxonomy limited to active seo-indexable rows", async () => {
    const brandQuery = createQuery([
      {
        id: "brand-skoda",
        name: "Škoda",
        slug: "skoda",
        is_popular: true,
      },
    ]);
    const modelQuery = createQuery([
      {
        id: "model-octavia",
        brand_id: "brand-skoda",
        name: "Octavia",
        slug: "octavia",
      },
    ]);
    fromMock
      .mockReturnValueOnce(brandQuery)
      .mockReturnValueOnce(modelQuery);

    await expect(getSeoVehicleTaxonomy()).resolves.toMatchObject({
      brands: [{ slug: "skoda" }],
      modelsByBrandId: {
        "brand-skoda": [{ slug: "octavia" }],
      },
    });

    expect(brandQuery.eq).toHaveBeenCalledWith("is_active", true);
    expect(brandQuery.eq).toHaveBeenCalledWith("is_seo_indexable", true);
    expect(modelQuery.eq).toHaveBeenCalledWith("is_active", true);
    expect(modelQuery.eq).toHaveBeenCalledWith("is_seo_indexable", true);
  });
});
