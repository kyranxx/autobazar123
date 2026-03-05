import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import sitemap from "./sitemap";

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
};

function createSupabaseClientMock(ads: AdsQueryRow[] = []) {
  const limit = vi.fn(async () => ({ data: ads }));
  const order = vi.fn(() => ({ limit }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return { from };
}

describe("sitemap", () => {
  beforeEach(() => {
    mockedCreateClient.mockReturnValue(createSupabaseClientMock() as never);
  });

  it("does not include noindex routes like /kredity", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain("https://autobazar123.sk/kredity");
  });

  it("keeps key indexable search and taxonomy routes", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://autobazar123.sk/vysledky");
    expect(urls).toContain("https://autobazar123.sk/skoda");
    expect(urls).toContain("https://autobazar123.sk/skoda/octavia");
    expect(urls).toContain("https://autobazar123.sk/skoda/octavia/bratislava");
  });
});
