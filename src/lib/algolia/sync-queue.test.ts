import { beforeEach, describe, expect, it, vi } from "vitest";

const algoliaMocks = vi.hoisted(() => ({
  deleteObjects: vi.fn(),
  saveObjects: vi.fn(),
  transformCarToAlgoliaRecord: vi.fn((ad: { id: string; market_code?: string }) => ({
    objectID: ad.id,
    market_code: ad.market_code,
  })),
}));

vi.mock("@/lib/algolia", () => ({
  getAdminClient: () => algoliaMocks,
  getCarsIndexName: () => "ads",
  transformCarToAlgoliaRecord: algoliaMocks.transformCarToAlgoliaRecord,
}));

import { processAlgoliaSyncQueue } from "./sync-queue";

type QueueRow = {
  id: string;
  ad_id: string;
  operation: "upsert" | "delete";
  attempts: number;
  claim_token: string;
};

function createSupabaseMock({
  rows,
  adsById = {},
}: {
  rows: QueueRow[];
  adsById?: Record<string, Record<string, unknown>>;
}) {
  let selectedAdId: string | null = null;

  const adsChain = {
    select: vi.fn(() => adsChain),
    eq: vi.fn((column: string, value: string) => {
      if (column === "id") selectedAdId = value;
      return adsChain;
    }),
    maybeSingle: vi.fn(async () => ({
      data: selectedAdId ? adsById[selectedAdId] ?? null : null,
      error: null,
    })),
  };

  const queueChain = {
    update: vi.fn(() => queueChain),
    eq: vi.fn(() => queueChain),
    is: vi.fn(() => queueChain),
    select: vi.fn(async () => ({ data: [{ id: "processed" }], error: null })),
  };

  return {
    from: vi.fn((table: string) =>
      table === "ads" ? adsChain : queueChain,
    ),
    rpc: vi.fn(async () => ({ data: rows, error: null })),
    queueChain,
  };
}

describe("processAlgoliaSyncQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    algoliaMocks.saveObjects.mockResolvedValue({ taskID: 1 });
    algoliaMocks.deleteObjects.mockResolvedValue({ taskID: 2 });
  });

  it("upserts active visible ads and deletes non-public ads", async () => {
    const supabase = createSupabaseMock({
      rows: [
        {
          id: "queue-active",
          ad_id: "ad-active",
          operation: "upsert",
          attempts: 1,
          claim_token: "token-active",
        },
        {
          id: "queue-hidden",
          ad_id: "ad-hidden",
          operation: "upsert",
          attempts: 1,
          claim_token: "token-hidden",
        },
      ],
      adsById: {
        "ad-active": { id: "ad-active", market_code: "RO", status: "active", is_hidden: false },
        "ad-hidden": { id: "ad-hidden", market_code: "SK", status: "active", is_hidden: true },
      },
    });

    const result = await processAlgoliaSyncQueue({
      supabase: supabase as never,
      algolia: algoliaMocks as never,
    });

    expect(result).toEqual({ claimed: 2, processed: 2, requeued: 0, failed: 0 });
    expect(algoliaMocks.saveObjects).toHaveBeenCalledWith({
      indexName: "ads",
      objects: [{ objectID: "ad-active", market_code: "RO" }],
    });
    expect(algoliaMocks.deleteObjects).toHaveBeenCalledWith({
      indexName: "ads",
      objectIDs: ["ad-hidden"],
    });
    expect(supabase.queueChain.update).toHaveBeenCalledTimes(2);
  });

  it("requeues a failed Algolia operation for a later retry", async () => {
    algoliaMocks.saveObjects.mockRejectedValueOnce(new Error("Algolia unavailable"));
    const supabase = createSupabaseMock({
      rows: [
        {
          id: "queue-retry",
          ad_id: "ad-retry",
          operation: "upsert",
          attempts: 2,
          claim_token: "token-retry",
        },
      ],
      adsById: {
        "ad-retry": { id: "ad-retry", market_code: "SK", status: "active", is_hidden: false },
      },
    });

    const result = await processAlgoliaSyncQueue({
      supabase: supabase as never,
      algolia: algoliaMocks as never,
    });

    expect(result).toEqual({ claimed: 1, processed: 0, requeued: 1, failed: 1 });
    expect(supabase.queueChain.update).toHaveBeenCalledTimes(1);
    expect(algoliaMocks.deleteObjects).not.toHaveBeenCalled();
  });
});
