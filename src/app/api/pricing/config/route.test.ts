import { beforeEach, describe, expect, it, vi } from "vitest";

const callOrder: string[] = [];
const connectionMock = vi.fn(async () => {
  callOrder.push("connection");
});
const getPricingSnapshotMock = vi.fn(async () => {
  callOrder.push("snapshot");
  return {
    config: { version: 1 },
    summary: { privateListing: "free" },
  };
});

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>(
    "next/server",
  );

  return {
    ...actual,
    connection: () => connectionMock(),
  };
});

vi.mock("@/lib/pricing/server", () => ({
  getPricingSnapshot: () => getPricingSnapshotMock(),
}));

import { GET } from "./route";

describe("GET /api/pricing/config", () => {
  beforeEach(() => {
    callOrder.length = 0;
    vi.clearAllMocks();
  });

  it("waits for a request boundary before loading mutable pricing config", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(payload).toEqual({
      config: { version: 1 },
      summary: { privateListing: "free" },
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(callOrder).toEqual(["connection", "snapshot"]);
  });
});
