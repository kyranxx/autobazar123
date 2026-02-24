import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { timingSafeEqual } from "node:crypto";
import { createMaintenanceBypassToken } from "@/lib/security/maintenance-bypass";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  // Avoid timing attacks by comparing buffers with the same length.
  const len = Math.max(aBuf.length, bBuf.length);
  const aPadded = Buffer.alloc(len);
  const bPadded = Buffer.alloc(len);
  aBuf.copy(aPadded);
  bBuf.copy(bPadded);

  return timingSafeEqual(aPadded, bPadded) && aBuf.length === bBuf.length;
}

export async function POST(request: NextRequest) {
  const rateIdentifier = createRateLimitIdentifier(
    "maintenance_unlock",
    request.headers,
  );

  const rate = await checkStrictRateLimit(rateIdentifier, {
    failOpenOnInfrastructureError: true,
  });
  if (!rate.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many attempts. Please try again later.",
        limit: rate.limit,
        remaining: rate.remaining,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000)),
          ),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const password =
    typeof (body as { password?: unknown }).password === "string"
      ? ((body as { password: string }).password || "").trim()
      : "";

  if (!password) {
    return jsonError("Password required.", 400);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonError("Server misconfigured.", 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "maintenance_password")
    .maybeSingle();

  if (error) {
    console.error("Maintenance unlock lookup failed:", error);
    return jsonError("Unable to verify password.", 500);
  }

  const expected = typeof data?.value === "string" ? data.value : "";
  if (!expected) {
    // Avoid leaking whether the password exists; this is mainly for operators.
    return jsonError("Maintenance bypass is not configured.", 503);
  }

  if (!safeEqual(password, expected)) {
    return jsonError("Invalid password.", 401);
  }

  const bypassSecret = process.env.MAINTENANCE_BYPASS_SECRET;
  if (!bypassSecret) {
    return jsonError("Server misconfigured.", 500);
  }

  const token = await createMaintenanceBypassToken(bypassSecret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "maintenance_bypass",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });
  return response;
}
