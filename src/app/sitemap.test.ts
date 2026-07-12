import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sitemap, { buildSitemapForMarket } from "./sitemap";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

type AdsQueryRow = {
  id: string;
  updated_at: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  location_city?: string | null;
  brands?: { slug?: string | null } | null;
  models?: { slug?: string | null } | null;
};

function createSupabaseClientMock(ads: AdsQueryRow[] = []) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(async () => ({ data: ads })),
  };
  const from = vi.fn(() => query);

  return { from, query };
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
    brands: { slug: "skoda" },
    models: { slug: "octavia" },
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
  });

  it("does not include noindex routes like /kredity", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain("https://www.autobazar123.sk/kredity");
  });

  it("keeps key indexable search and inventory-backed taxonomy routes", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseClientMock([createAdRow(1)]) as never,
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://www.autobazar123.sk/vysledky");
    expect(urls).toContain("https://www.autobazar123.sk/skoda");
    expect(urls).toContain("https://www.autobazar123.sk/skoda/octavia");
    expect(urls).toContain("https://www.autobazar123.sk/auto/ad-1-skoda-octavia-2020");
    expect(urls).not.toContain("https://www.autobazar123.sk/skoda/octavia/bratislava");
  });

  it("does not create taxonomy pages when active ads lack canonical taxonomy slugs", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseClientMock([
        createAdRow(1, { brands: null, models: null }),
      ]) as never,
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://www.autobazar123.sk/auto/ad-1-skoda-octavia-2020");
    expect(urls).not.toContain("https://www.autobazar123.sk/skoda");
    expect(urls).not.toContain("https://www.autobazar123.sk/skoda/octavia");
  });

  it("does not include city pSEO pages when active inventory is below launch threshold", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseClientMock(Array.from({ length: 9 }, (_, index) => createAdRow(index))) as never,
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain("https://www.autobazar123.sk/skoda/octavia/bratislava");
  });

  it("includes city pSEO pages after active inventory reaches launch threshold", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseClientMock(Array.from({ length: 10 }, (_, index) => createAdRow(index))) as never,
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://www.autobazar123.sk/skoda/octavia/bratislava");
  });

  it("filters indexed inventory to the Slovak market", async () => {
    const supabase = createSupabaseClientMock([createAdRow(1)]);
    mockedCreateClient.mockReturnValue(supabase as never);

    await sitemap();

    expect(supabase.query.eq).toHaveBeenCalledWith("status", "active");
    expect(supabase.query.eq).toHaveBeenCalledWith("is_hidden", false);
    expect(supabase.query.eq).toHaveBeenCalledWith("market_code", "SK");
  });

  it("builds Romanian sitemap URLs and filters Romanian inventory", async () => {
    const supabase = createSupabaseClientMock([
      createAdRow(1, { brand: "Dacia", model: "Duster", brands: { slug: "dacia" }, models: { slug: "duster" } }),
    ]);
    mockedCreateClient.mockReturnValue(supabase as never);

    const entries = await buildSitemapForMarket("RO");
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://www.autobazar123.ro/masini");
    expect(urls).toContain("https://www.autobazar123.ro/dealeri");
    expect(urls).toContain("https://www.autobazar123.ro/preturi");
    expect(urls).toContain("https://www.autobazar123.ro/despre-noi");
    expect(urls).toContain("https://www.autobazar123.ro/dacia");
    expect(urls).toContain("https://www.autobazar123.ro/masina/ad-1-dacia-duster-2020");
    expect(urls).not.toContain("https://www.autobazar123.ro/vysledky");
    expect(urls).not.toContain("https://www.autobazar123.ro/predajcovia");
    expect(supabase.query.eq).toHaveBeenCalledWith("market_code", "RO");
  });

  it("has a public HTML sitemap page for users and crawlers", () => {
    expect(existsSync("src/app/site-map/page.tsx")).toBe(true);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey;
  });
});
