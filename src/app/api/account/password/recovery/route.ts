import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";


const RecoveryPasswordBodySchema = z.object({
  password: z.string().min(6),
  tokenHash: z.string().min(1),
}).strict();

export function parseRecoveryPasswordBody(body: unknown) {
  const parsed = RecoveryPasswordBodySchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export function getRecoveryPasswordRateLimitIdentifier(
  request: NextRequest,
): string {
  return createRateLimitIdentifier("account_password_recovery", request.headers);
}

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const rate = await checkStrictRateLimit(
    getRecoveryPasswordRateLimitIdentifier(request),
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

  const body = await request.json().catch(() => null);
  const parsedBody = parseRecoveryPasswordBody(body);

  if (!parsedBody) {
    return NextResponse.json(
      { error: "Recovery token and password are required" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });

  const {
    data: verificationData,
    error: verificationError,
  } = await publicClient.auth.verifyOtp({
    token_hash: parsedBody.tokenHash,
    type: "recovery",
  });

  if (verificationError || !verificationData.user) {
    if (verificationError) {
      console.warn("Recovery token verification failed:", verificationError);
    }
    return NextResponse.json(
      { error: "Recovery link is invalid or expired" },
      { status: 400 },
    );
  }

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Server not configured for recovery password update" },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error: updateError } = await admin.auth.admin.updateUserById(
    verificationData.user.id,
    {
      password: parsedBody.password,
    },
  );

  if (updateError) {
    console.error("Recovery password update failed:", updateError);
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
