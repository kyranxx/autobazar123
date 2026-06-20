import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicCarData } from "./public-car-detail";

const createAdminClientMock = vi.fn();

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
      id: "ad-1",
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

    const result = await getPublicCarData("ad-1");

    expect(result?.id).toBe("ad-1");
    expect(result?.seller.phone).toBe("+421900000000");
    expect(fromMock).toHaveBeenCalledWith("ads");
    expect(adsQuery.select).toHaveBeenCalledWith(
      "*, seller:profiles!seller_id (id, full_name, phone, is_verified, created_at)",
    );
    expect(adsQuery.eq).toHaveBeenCalledWith("id", "ad-1");
    expect(adsQuery.eq).toHaveBeenCalledWith("status", "active");
    expect(adsQuery.eq).toHaveBeenCalledWith("is_hidden", false);
    expect(adsQuery.maybeSingle).toHaveBeenCalledOnce();
  });

  it("fails closed when the admin client is not configured", async () => {
    createAdminClientMock.mockReturnValue(null);

    await expect(getPublicCarData("ad-1")).resolves.toBeNull();
  });
});
