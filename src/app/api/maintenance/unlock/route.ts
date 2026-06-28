import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { timingSafeEqual } from "node:crypto";
import {
  createMaintenanceBypassToken,
  resolveMaintenanceBypassSecret,
} from "@/lib/security/maintenance-bypass";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";


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

const MaintenanceUnlockBodySchema = z
  .object({
    password: z.string().trim().min(1).max(512),
  })
  .strict();

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const rateIdentifier = createRateLimitIdentifier(
    "maintenance_unlock",
    request.headers,
  );

  let rate: Awaited<ReturnType<typeof checkStrictRateLimit>>;
  try {
    rate = await checkStrictRateLimit(rateIdentifier);
  } catch (error) {
    console.error("Maintenance unlock rate limit check failed:", error);
    return jsonError("Rate limiting is temporarily unavailable.", 503);
  }

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

  const body = await request.json().catch(() => null);
  const parsed = MaintenanceUnlockBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Password required.", 400);
  }
  const { password } = parsed.data;

  const passwordStr = process.env.MAINTENANCE_UNLOCK_PASSWORD || "";
  const expected = passwordStr.trim();
  if (!expected) {
    return jsonError("Maintenance bypass is not configured.", 503);
  }

  if (!safeEqual(password, expected)) {
    return jsonError("Invalid password.", 401);
  }

  const bypassSecret = resolveMaintenanceBypassSecret();
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
