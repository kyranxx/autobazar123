import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseJsonBody,
  rejectWhenInvalidCsrf,
  rejectWhenStrictRateLimited,
  requireAuthenticatedUser,
} from "@/lib/api/route-helpers";
import { createClient } from "@/lib/supabase/server";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";

const UpdateModerationNotificationBodySchema = z
  .object({
    notifyModerationEmail: z.boolean(),
  })
  .strict();

export function getModerationNotificationRateLimitIdentifier(
  request: NextRequest,
): string {
  return createRateLimitIdentifier("account_moderation_notification_update", request.headers);
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getModerationNotificationRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, UpdateModerationNotificationBodySchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid moderation notification payload" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ notify_moderation_email: parsed.notifyModerationEmail })
    .eq("id", user.id);

  if (error) {
    console.error("Moderation notification preference update failed:", error);
    return NextResponse.json(
      { error: "Unable to update moderation notifications right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
