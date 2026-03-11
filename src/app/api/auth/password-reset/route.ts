import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordRecoveryEmail } from "@/lib/email/send-auth-emails";
import { resolveAuthRequestOrigin } from "@/lib/auth/request-origin";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";


const PasswordResetSchema = z.object({
  email: z.string().email(),
}).strict();

export function getPasswordResetRateLimitIdentifier(
  request: NextRequest,
): string {
  return createRateLimitIdentifier("auth_password_reset", request.headers);
}

function isUserNotFoundError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("not found") || lower.includes("invalid email");
}

function buildAppPasswordResetUrl(origin: string, tokenHash: string): string {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: "recovery",
  });

  return `${origin}/auth/reset-password?${params.toString()}`;
}

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const rate = await checkStrictRateLimit(
    getPasswordResetRateLimitIdentifier(request),
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
  const parsed = PasswordResetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const origin = resolveAuthRequestOrigin(request);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${origin}/auth/reset-password`,
    },
  });

  if (error) {
    // Avoid account enumeration - treat unknown emails as successful response.
    if (isUserNotFoundError(error.message)) {
      return NextResponse.json({ ok: true });
    }

    console.error("Password reset link generation failed:", error);
    return NextResponse.json(
      { error: "Unable to process password reset right now." },
      { status: 400 },
    );
  }

  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) {
    return NextResponse.json(
      { error: "Reset token was not generated" },
      { status: 500 },
    );
  }

  const resetUrl = buildAppPasswordResetUrl(origin, tokenHash);

  const emailResult = await sendPasswordRecoveryEmail({
    email,
    fullName: data.user.user_metadata?.["full_name"] as string | undefined,
    resetUrl,
  });

  if (!emailResult.success) {
    return NextResponse.json(
      { error: emailResult.error || "Failed to send password reset email" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
