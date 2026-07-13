import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicCarData } from "./public-car-detail";

const createAdminClientMock = vi.fn();
const AD_ID = "75573f75-b6c0-458c-adf7-c165e5b32e5e";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock(),
}));

function createAdsQueryMock(row: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data: row, error: null })),
  };

  return query;
}

describe("getPublicCarData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches public detail through the admin client with explicit active visibility filters", async () => {
    const row = {
      id: AD_ID,
      brand: "Skoda",
      model: "Octavia",
      year: 2020,
      price_eur: 12000,
      mileage_km: 100000,
      fuel: "Benzín",
      transmission: "Manual",
      body_style: "Kombi",
      seller: {
        id: "seller-1",
        full_name: "Seller",
        phone: "+421900000000",
        is_verified: true,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    };
    const adsQuery = createAdsQueryMock(row);
    const fromMock = vi.fn((table: string) => {
      if (table !== "ads") {
        throw new Error(`Unexpected table ${table}`);
      }

      return adsQuery;
    });
    createAdminClientMock.mockReturnValue({ from: fromMock });

    const result = await getPublicCarData(AD_ID);

    expect(result?.id).toBe(AD_ID);
    expect(result?.seller.phone).toBe("+421900000000");
    expect(fromMock).toHaveBeenCalledWith("ads");
    expect(adsQuery.select).toHaveBeenCalledWith(
      "*, seller:profiles!seller_id (id, full_name, phone, is_verified, created_at)",
    );
    expect(adsQuery.eq).toHaveBeenCalledWith("id", AD_ID);
    expect(adsQuery.eq).toHaveBeenCalledWith("status", "active");
    expect(adsQuery.eq).toHaveBeenCalledWith("is_hidden", false);
    expect(adsQuery.maybeSingle).toHaveBeenCalledOnce();
  });

  it("can restrict public detail to the requested market", async () => {
    const row = {
      id: AD_ID,
      market_code: "RO",
      brand: "Dacia",
      model: "Duster",
      year: 2021,
      price_eur: 14900,
      mileage_km: 82000,
      fuel: "Diesel",
      transmission: "Manual",
      body_style: "SUV",
      seller: null,
    };
    const adsQuery = createAdsQueryMock(row);
    const fromMock = vi.fn(() => adsQuery);
    createAdminClientMock.mockReturnValue({ from: fromMock });

    const result = await getPublicCarData(AD_ID, "RO");

    expect(result?.market_code).toBe("RO");
    expect(adsQuery.eq).toHaveBeenCalledWith("market_code", "RO");
    expect(adsQuery.maybeSingle).toHaveBeenCalledOnce();
  });

  it("executes the builder returned by the market filter", async () => {
    const row = {
      id: AD_ID,
      market_code: "RO",
      brand: "Dacia",
      model: "Duster",
      year: 2021,
      price_eur: 14900,
      mileage_km: 82000,
      fuel: "Diesel",
      transmission: "Manual",
      body_style: "SUV",
      seller: null,
    };
    const filteredQuery = {
      maybeSingle: vi.fn(async () => ({ data: row, error: null })),
    };
    const baseQuery = {
      select: vi.fn(() => baseQuery),
      eq: vi.fn((field: string) =>
        field === "market_code" ? filteredQuery : baseQuery,
      ),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    };
    const fromMock = vi.fn(() => baseQuery);
    createAdminClientMock.mockReturnValue({ from: fromMock });

    const result = await getPublicCarData(AD_ID, "RO");

    expect(result?.market_code).toBe("RO");
    expect(baseQuery.eq).toHaveBeenCalledWith("market_code", "RO");
    expect(filteredQuery.maybeSingle).toHaveBeenCalledOnce();
    expect(baseQuery.maybeSingle).not.toHaveBeenCalled();
  });

  it("fails closed when the admin client is not configured", async () => {
    createAdminClientMock.mockReturnValue(null);

    await expect(getPublicCarData(AD_ID)).resolves.toBeNull();
  });

  it("ignores invalid route params before querying Supabase", async () => {
    const adsQuery = createAdsQueryMock(null);
    const fromMock = vi.fn(() => adsQuery);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    createAdminClientMock.mockReturnValue({ from: fromMock });

    try {
      await expect(getPublicCarData("search-top-1-skoda-exclusive-2022")).resolves.toBeNull();
    } finally {
      consoleErrorSpy.mockRestore();
    }

    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
