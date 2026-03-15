import { NextRequest, NextResponse } from "next/server";
import { isCurrentUserSiteAdmin } from "@/lib/auth/site-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type HealthState = "healthy" | "degraded" | "unhealthy";

interface PublicHealthStatus {
  status: HealthState;
  timestamp: string;
}

interface DetailedHealthStatus extends PublicHealthStatus {
  checks: {
    database: { status: string; latency: number };
    api: { status: string; latency: number };
    stripe: { status: string };
    email: { status: string };
  };
  uptime: number;
}

function getEmailServiceStatus(): string {
  return process.env.RESEND_API_KEY ? "ok" : "unconfigured";
}

export async function GET(
  _request: NextRequest,
): Promise<NextResponse<PublicHealthStatus | DetailedHealthStatus>> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const isAdmin = await isCurrentUserSiteAdmin();
    const supabase = createAdminClient();

    if (!supabase) {
      const status: HealthState = "unhealthy";

      if (!isAdmin) {
        return NextResponse.json({ status, timestamp }, { status: 503 });
      }

      return NextResponse.json(
        {
          status,
          timestamp,
          checks: {
            database: { status: "unavailable", latency: 0 },
            api: { status: "ok", latency: Date.now() - startTime },
            stripe: {
              status: process.env.STRIPE_SECRET_KEY ? "ok" : "unconfigured",
            },
            email: {
              status: getEmailServiceStatus(),
            },
          },
          uptime: process.uptime(),
        },
        { status: 503 },
      );
    }

    const dbStart = Date.now();
    const { error: dbError } = await supabase.from("ads").select("id").limit(1);
    const dbLatency = Date.now() - dbStart;

    const stripeStatus = process.env.STRIPE_SECRET_KEY ? "ok" : "unconfigured";
    const emailStatus = getEmailServiceStatus();

    const isUnhealthy = Boolean(dbError);
    const isDegraded =
      !isUnhealthy && (stripeStatus !== "ok" || emailStatus !== "ok");
    const status: HealthState = isUnhealthy
      ? "unhealthy"
      : isDegraded
        ? "degraded"
        : "healthy";

    const httpStatus = status === "unhealthy" ? 503 : 200;

    if (!isAdmin) {
      return NextResponse.json({ status, timestamp }, { status: httpStatus });
    }

    return NextResponse.json(
      {
        status,
        timestamp,
        checks: {
          database: {
            status: dbError ? "error" : "ok",
            latency: dbLatency,
          },
          api: {
            status: "ok",
            latency: Date.now() - startTime,
          },
          stripe: { status: stripeStatus },
          email: { status: emailStatus },
        },
        uptime: process.uptime(),
      },
      { status: httpStatus },
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "unhealthy", timestamp }, { status: 503 });
  }
}
