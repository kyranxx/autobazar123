import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import {
  rejectWhenInvalidCsrfToken,
  rejectWhenStrictRateLimited,
} from "@/lib/api/route-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";


const RecoveryPasswordBodySchema = z.object({
  password: z.string().min(MIN_PASSWORD_LENGTH),
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
  const csrfError = rejectWhenInvalidCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getRecoveryPasswordRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server not configured for recovery password update" },
      { status: 500 },
    );
  }

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

  const recoveryAccessToken = verificationData.session?.access_token;
  if (recoveryAccessToken) {
    const { error: revokeSessionsError } = await publicClient.auth.admin.signOut(
      recoveryAccessToken,
      "global",
    );
    if (revokeSessionsError) {
      console.error(
        "Recovery-password session revocation failed:",
        revokeSessionsError,
      );
    }
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
