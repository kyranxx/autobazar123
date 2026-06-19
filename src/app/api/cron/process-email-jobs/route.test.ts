import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const {
  processQueuedEmailJobsMock,
  rejectWhenInvalidCronRequestMock,
} = vi.hoisted(() => ({
  processQueuedEmailJobsMock: vi.fn(),
  rejectWhenInvalidCronRequestMock: vi.fn(),
}));

vi.mock("@/lib/cron/route-helpers", () => ({
  rejectWhenInvalidCronRequest: rejectWhenInvalidCronRequestMock,
}));

vi.mock("@/lib/email/jobs", () => ({
  processQueuedEmailJobs: (...args: unknown[]) =>
    processQueuedEmailJobsMock(...args),
}));

import { GET } from "./route";

function createRequest(): NextRequest {
  return new NextRequest("http://localhost/api/cron/process-email-jobs", {
    method: "GET",
  });
}

describe("GET /api/cron/process-email-jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rejectWhenInvalidCronRequestMock.mockReturnValue(null);
    processQueuedEmailJobsMock.mockResolvedValue({
      claimed: 0,
      sent: 0,
      requeued: 0,
      failed: 0,
    });
  });

  it("returns degraded when queued email processing reports failed jobs", async () => {
    processQueuedEmailJobsMock.mockResolvedValue({
      claimed: 2,
      sent: 1,
      requeued: 0,
      failed: 1,
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({
      ok: false,
      degraded: true,
      claimed: 2,
      sent: 1,
      requeued: 0,
      failed: 1,
      failure: {
        code: "email_jobs_failed",
        summary: "Queued email processing reported failed jobs",
      },
    });
  });

  it("returns the cron auth rejection response before processing jobs", async () => {
    rejectWhenInvalidCronRequestMock.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    expect(processQueuedEmailJobsMock).not.toHaveBeenCalled();
  });
});
