import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";


const UpdatePasswordBodySchema = z
  .object({
    password: z.string().min(6),
    nonce: z.string().trim().min(1).optional(),
  })
  .strict();

export function getAccountPasswordRateLimitIdentifier(
  request: NextRequest,
): string {
  return createRateLimitIdentifier("account_password_update", request.headers);
}

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const rate = await checkStrictRateLimit(
    getAccountPasswordRateLimitIdentifier(request),
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
  const parsed = UpdatePasswordBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const { password, nonce } = parsed.data;

  const { error } = await supabase.auth.updateUser({
    password,
    ...(nonce ? { nonce } : {}),
  });

  if (error) {
    console.error("Account password update failed:", error);
    return NextResponse.json(
      { error: "Unable to update password right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
