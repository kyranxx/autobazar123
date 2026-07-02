import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchSingleIndexMock } = vi.hoisted(() => ({
  searchSingleIndexMock: vi.fn(),
}));

vi.mock("@/lib/algolia", () => ({
  getCarsIndexName: () => "ads",
  searchSingleIndex: searchSingleIndexMock,
}));

import { GET } from "./route";
import { parseSavedSearchFilters } from "@/lib/search/saved-searches";
beforeEach(() => {
  searchSingleIndexMock.mockReset();
});

describe("parseSavedSearchFilters", () => {
  it("normalizes search preview filters into safe query inputs", () => {
    const filters = parseSavedSearchFilters(
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

  it("uses Algolia count preview for homepage filters", async () => {
    searchSingleIndexMock.mockResolvedValue({
      nbHits: 42,
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/search/count?q=bmw&brand=BMW&priceFrom=12000&priceTo=30000",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 42 });
    expect(searchSingleIndexMock).toHaveBeenCalledWith({
      indexName: "ads",
      searchParams: {
        query: "bmw",
        facetFilters: [["brand:BMW"]],
        numericFilters: ["price_eur>=12000", "price_eur<=30000"],
        filters: "market_code:SK",
        hitsPerPage: 0,
      },
    });
  });

  it("uses the request host market for count preview filters", async () => {
    searchSingleIndexMock.mockResolvedValue({
      nbHits: 7,
    });

    const response = await GET(
      new NextRequest("https://www.autobazar123.ro/api/search/count?brand=Dacia"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 7 });
    expect(searchSingleIndexMock).toHaveBeenCalledWith({
      indexName: "ads",
      searchParams: {
        query: "",
        facetFilters: [["brand:Dacia"]],
        filters: "market_code:RO",
        hitsPerPage: 0,
      },
    });
  });

  it("fails open with count 0 when Algolia search preview lookup is unavailable", async () => {
    searchSingleIndexMock.mockRejectedValue(new Error("boom"));

    const response = await GET(new NextRequest("http://localhost/api/search/count?q=audi"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 0, degraded: true });
    expect(response.headers.get("Cache-Control")).toContain("max-age=15");
  });
});
