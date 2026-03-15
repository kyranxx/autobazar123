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


const UpdatePhoneBodySchema = z
  .object({
    phone: z
      .union([z.string().trim().max(32), z.null()])
      .transform((value) =>
        typeof value === "string" ? (value.length ? value : null) : null,
      ),
  })
  .strict();

export function getAccountPhoneRateLimitIdentifier(
  request: NextRequest,
): string {
  return createRateLimitIdentifier("account_phone_update", request.headers);
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getAccountPhoneRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, UpdatePhoneBodySchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid phone payload" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ phone: parsed.phone })
    .eq("id", user.id);

  if (error) {
    console.error("Account phone update failed:", error);
    return NextResponse.json(
      { error: "Unable to update phone right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
