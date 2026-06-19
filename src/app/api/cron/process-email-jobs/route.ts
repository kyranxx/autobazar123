import { NextRequest, NextResponse } from "next/server";
import { rejectWhenInvalidCronRequest } from "@/lib/cron/route-helpers";
import { processQueuedEmailJobs } from "@/lib/email/jobs";

export async function GET(request: NextRequest) {
  const cronError = rejectWhenInvalidCronRequest(request);
  if (cronError) {
    return cronError;
  }

  try {
    const result = await processQueuedEmailJobs({ batchSize: 25 });
    if (result.failed > 0) {
      return NextResponse.json(
        {
          ok: false,
          degraded: true,
          ...result,
          failure: {
            code: "email_jobs_failed",
            summary: "Queued email processing reported failed jobs",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Process-email-jobs cron failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
