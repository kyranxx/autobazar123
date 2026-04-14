import { NextRequest, NextResponse } from "next/server";
import {
  parseJsonBody,
  rejectWhenInvalidCsrfToken,
  rejectWhenStrictRateLimited,
} from "@/lib/api/route-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAuthRequestOrigin } from "@/lib/auth/request-origin";
import { rejectWhenRuntimeEnvMissing } from "@/lib/api/runtime-env";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { passwordResetRequestSchema } from "@/lib/validation/forms";
import {
  enqueuePasswordRecoveryEmailJob,
  scheduleQueuedEmailDrain,
} from "@/lib/email/jobs";
import { assertRuntimeEnvConfigured } from "@/lib/env";

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
  try {
    assertRuntimeEnvConfigured("authEmail");
  } catch {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const csrfError = rejectWhenInvalidCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getPasswordResetRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const configError = rejectWhenRuntimeEnvMissing(
    "authEmail",
    "Auth email is not configured",
  );
  if (configError) {
    return configError;
  }

  const parsed = await parseJsonBody(request, passwordResetRequestSchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid email payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const email = parsed.email.trim().toLowerCase();
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

  const enqueueResult = await enqueuePasswordRecoveryEmailJob({
    email,
    fullName: data.user.user_metadata?.["full_name"] as string | undefined,
    resetUrl,
  });

  if (!enqueueResult.ok) {
    return NextResponse.json(
      { error: enqueueResult.error || "Failed to queue password reset email" },
      { status: 503 },
    );
  }

  scheduleQueuedEmailDrain({
    batchSize: 5,
    jobTypes: ["auth_password_reset"],
  });

  return NextResponse.json({ ok: true });
}
