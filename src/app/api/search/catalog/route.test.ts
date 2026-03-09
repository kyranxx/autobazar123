import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAnonClientMock } = vi.hoisted(() => ({
  getAnonClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/anon", () => ({
  getAnonClient: getAnonClientMock,
}));

vi.mock("@/lib/algolia", () => ({
  transformCarToAlgoliaRecord: vi.fn((value) => value),
}));

import { GET } from "./route";

describe("GET /api/search/catalog", () => {
  beforeEach(() => {
    getAnonClientMock.mockReset();
  });

  it("fails open with empty records when Supabase lookup fails", async () => {
    getAnonClientMock.mockImplementation(() => {
      throw new Error("boom");
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ records: [], degraded: true });
    expect(response.headers.get("Cache-Control")).toContain("max-age=30");
  });
});
