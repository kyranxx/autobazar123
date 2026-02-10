import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: { status: string; latency: number };
    api: { status: string; latency: number };
    stripe: { status: string };
    email: { status: string };
  };
  uptime: number;
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();

  try {
    // Check database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          checks: {
            database: { status: "unavailable", latency: 0 },
            api: { status: "ok", latency: Date.now() - startTime },
            stripe: {
              status: process.env.STRIPE_SECRET_KEY ? "ok" : "unconfigured",
            },
            email: {
              status: process.env.EMAIL_PROVIDER ? "ok" : "unconfigured",
            },
          },
          uptime: process.uptime(),
        },
        { status: 503 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const dbStart = Date.now();

    // Quick database check
    const { error: dbError } = await supabase.from("ads").select("id").limit(1);

    const dbLatency = Date.now() - dbStart;

    // Check Stripe
    const stripeStatus = process.env.STRIPE_SECRET_KEY ? "ok" : "unconfigured";

    // Check email
    const emailStatus = process.env.EMAIL_PROVIDER ? "ok" : "unconfigured";

    const isHealthy = !dbError && stripeStatus === "ok" && emailStatus === "ok";

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
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
      { status: isHealthy ? 200 : 503 },
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: "error", latency: 0 },
          api: { status: "error", latency: Date.now() - startTime },
          stripe: { status: "unknown" },
          email: { status: "unknown" },
        },
        uptime: process.uptime(),
      },
      { status: 503 },
    );
  }
}
