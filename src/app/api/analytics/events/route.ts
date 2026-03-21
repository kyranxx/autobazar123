import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidAnalyticsEventName, validateAnalyticsEvent } from "@/lib/analytics/events";

const analyticsContextSchema = z
  .object({
    pagePath: z.string().trim().min(1).max(160).optional(),
    pageUrl: z.string().trim().min(1).max(500).optional(),
    pageTitle: z.string().trim().min(1).max(180).nullable().optional(),
    referrer: z.string().trim().min(1).max(500).nullable().optional(),
    distinctId: z.string().trim().min(1).max(120).optional(),
  })
  .optional();

const analyticsEventRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
  payload: z.record(z.string(), z.unknown()),
  context: analyticsContextSchema,
});

async function forwardEventToPosthog(input: {
  name: string;
  payload: Record<string, unknown>;
  context?: z.infer<typeof analyticsContextSchema>;
}) {
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();

  if (!posthogHost || !posthogKey) {
    return;
  }

  const distinctId = input.context?.distinctId ?? crypto.randomUUID();
  const response = await fetch(`${posthogHost.replace(/\/$/, "")}/e/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: posthogKey,
      event: input.name,
      properties: {
        distinct_id: distinctId,
        ...input.payload,
        pagePath: input.context?.pagePath ?? null,
        pageUrl: input.context?.pageUrl ?? null,
        pageTitle: input.context?.pageTitle ?? null,
        referrer: input.context?.referrer ?? null,
        source: "autobazar123_first_party_ingest",
      },
      timestamp: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(`PostHog forward failed: ${response.status} ${responseText}`.trim());
  }
}

export async function POST(request: NextRequest) {
  let parsedBody: z.infer<typeof analyticsEventRequestSchema>;

  try {
    const json = await request.json();
    const bodyResult = analyticsEventRequestSchema.safeParse(json);

    if (!bodyResult.success) {
      return NextResponse.json({ error: "invalid_analytics_request" }, { status: 400 });
    }

    parsedBody = bodyResult.data;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isValidAnalyticsEventName(parsedBody.name)) {
    return NextResponse.json({ error: "unknown_event_name" }, { status: 400 });
  }

  const payloadValidation = validateAnalyticsEvent(parsedBody.name, parsedBody.payload);
  if (!payloadValidation.success) {
    return NextResponse.json({ error: "invalid_event_payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ accepted: false, degraded: true }, { status: 202 });
  }

  const { error } = await admin.from("system_logs").insert({
    level: "info",
    category: "system",
    message: "analytics_event",
    metadata: {
      eventName: parsedBody.name,
      payload: payloadValidation.data,
      pagePath: parsedBody.context?.pagePath ?? null,
      pageUrl: parsedBody.context?.pageUrl ?? null,
      pageTitle: parsedBody.context?.pageTitle ?? null,
      referrer: parsedBody.context?.referrer ?? null,
    },
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Analytics event insert failed:", error);
    return NextResponse.json({ accepted: false }, { status: 500 });
  }

  try {
    await forwardEventToPosthog({
      name: parsedBody.name,
      payload: payloadValidation.data,
      context: parsedBody.context,
    });
  } catch (posthogError) {
    console.error("Analytics event PostHog forward failed:", posthogError);
  }

  return NextResponse.json({ accepted: true });
}
