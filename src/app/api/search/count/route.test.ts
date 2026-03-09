import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAnonClientMock } = vi.hoisted(() => ({
  getAnonClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/anon", () => ({
  getAnonClient: getAnonClientMock,
}));

import { GET, parseSearchCountFilters } from "./route";

beforeEach(() => {
  getAnonClientMock.mockReset();
});

describe("parseSearchCountFilters", () => {
  it("normalizes search preview filters into safe query inputs", () => {
    const filters = parseSearchCountFilters(
      new URLSearchParams({
        q: "Audi, A4; Bratislava<script>",
        brand: "Audi",
        model: "A4",
        fuel: "Diesel",
        transmission: "Automatic",
        bodyStyle: "SUV",
        location: "Banska Bystrica",
        priceFrom: "12000 EUR",
        priceTo: "30000",
        yearFrom: "2018",
        yearTo: "2024",
        hasServiceBook: "true",
        notCrashed: "true",
        boughtInSk: "false",
      }),
    );

    expect(filters).toEqual({
      q: "Audi A4 Bratislava script",
      brand: ["Audi"],
      model: "A4",
      fuel: "diesel",
      transmission: "automatic",
      bodyStyle: "suv",
      location: "Banska Bystrica",
      priceFrom: 12000,
      priceTo: 30000,
      yearFrom: 2018,
      yearTo: 2024,
      hasServiceBook: true,
      notCrashed: true,
      boughtInSk: false,
    });
  });

  it("fails open with count 0 when Supabase search preview lookup is unavailable", async () => {
    getAnonClientMock.mockImplementation(() => {
      throw new Error("boom");
    });

    const response = await GET(new NextRequest("http://localhost/api/search/count?q=audi"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 0, degraded: true });
    expect(response.headers.get("Cache-Control")).toContain("max-age=15");
  });
});
