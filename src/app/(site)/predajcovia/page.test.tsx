import { describe, expect, it, vi } from "vitest";

const { calls, connectionMock, getVerifiedDealerSummariesMock } = vi.hoisted(() => ({
  calls: [] as string[],
  connectionMock: vi.fn(async () => {
    calls.push("connection");
  }),
  getVerifiedDealerSummariesMock: vi.fn(async () => {
    calls.push("summaries");
    return [];
  }),
}));

vi.mock("next/server", () => ({
  connection: connectionMock,
}));

vi.mock("@/lib/dealer/public", () => ({
  getVerifiedDealerSummaries: getVerifiedDealerSummariesMock,
}));

import DealersPage from "./page";

describe("dealers listing route rendering", () => {
  it("waits for a request before fetching service-role dealer summaries", async () => {
    calls.length = 0;
    connectionMock.mockClear();
    getVerifiedDealerSummariesMock.mockClear();

    await DealersPage();

    expect(calls).toEqual(["connection", "summaries"]);
  });
});
