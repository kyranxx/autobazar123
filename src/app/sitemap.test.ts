import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { getPublicVehicleTaxonomy } from "@/lib/vehicle-taxonomy/public";
import sitemap from "./sitemap";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/vehicle-taxonomy/public", () => ({
  getPublicVehicleTaxonomy: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedGetPublicVehicleTaxonomy = vi.mocked(getPublicVehicleTaxonomy);

type AdsQueryRow = {
  id: string;
  updated_at: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  location_city?: string | null;
};

function createSupabaseClientMock(ads: AdsQueryRow[] = []) {
  const limit = vi.fn(async () => ({ data: ads }));
  const order = vi.fn(() => ({ limit }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return { from };
}

function createAdRow(
  index: number,
  overrides: Partial<AdsQueryRow> = {},
): AdsQueryRow {
  return {
    id: `ad-${index}`,
    updated_at: "2026-06-20T10:00:00.000Z",
    brand: "Škoda",
    model: "Octavia",
    year: 2020,
    location_city: "Bratislava",
    ...overrides,
  };
}

describe("sitemap", () => {
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mockedCreateClient.mockReturnValue(createSupabaseClientMock() as never);
    mockedGetPublicVehicleTaxonomy.mockResolvedValue({
      brands: [{ id: "brand-skoda", name: "Škoda", slug: "skoda", isPopular: true }],
      modelsByBrandId: {
        "brand-skoda": [
          { id: "model-octavia", name: "Octavia", slug: "octavia", isPopular: false },
        ],
      },
    });
  });

  it("does not include noindex routes like /kredity", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain("https://autobazar123.sk/kredity");
  });

  it("keeps key indexable search and inventory-backed taxonomy routes", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseClientMock([createAdRow(1)]) as never,
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://autobazar123.sk/vysledky");
    expect(urls).toContain("https://autobazar123.sk/skoda");
    expect(urls).toContain("https://autobazar123.sk/skoda/octavia");
    expect(urls).not.toContain("https://autobazar123.sk/skoda/octavia/bratislava");
  });

  it("does not include city pSEO pages when active inventory is below launch threshold", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseClientMock(Array.from({ length: 9 }, (_, index) => createAdRow(index))) as never,
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain("https://autobazar123.sk/skoda/octavia/bratislava");
  });

  it("includes city pSEO pages after active inventory reaches launch threshold", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseClientMock(Array.from({ length: 10 }, (_, index) => createAdRow(index))) as never,
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://autobazar123.sk/skoda/octavia/bratislava");
  });

  it("has a public HTML sitemap page for users and crawlers", () => {
    expect(existsSync("src/app/site-map/page.tsx")).toBe(true);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey;
  });
});
