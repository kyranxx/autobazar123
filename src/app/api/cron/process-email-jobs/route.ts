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
    if (result.failed > 0 || result.requeued > 0) {
      const failure =
        result.failed > 0
          ? {
              code: "email_jobs_failed",
              summary: "Queued email processing reported failed jobs",
            }
          : {
              code: "email_jobs_requeued",
              summary: "Queued email processing requeued jobs",
            };

      return NextResponse.json(
        {
          ok: false,
          degraded: true,
          ...result,
          failure,
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
