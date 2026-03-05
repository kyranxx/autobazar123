import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";

export const runtime = "nodejs";

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
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const rate = await checkStrictRateLimit(
    getAccountPhoneRateLimitIdentifier(request),
  );
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))),
        },
      },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdatePhoneBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone payload" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ phone: parsed.data.phone })
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
