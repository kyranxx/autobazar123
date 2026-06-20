import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseJsonBody,
  rejectWhenInvalidCsrfToken,
  rejectWhenStrictRateLimited,
} from "@/lib/api/route-helpers";
import { rejectWhenRuntimeEnvMissing } from "@/lib/api/runtime-env";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAuthRequestOrigin } from "@/lib/auth/request-origin";
import { buildEmailVerificationCallbackUrl } from "@/lib/auth/email-verification-link";
import { getRegisterResendRateLimitIdentifier } from "@/lib/api/rate-limit-identifiers";
import {
  enqueueRegistrationConfirmationEmailJob,
  scheduleQueuedEmailDrain,
} from "@/lib/email/jobs";
import { assertRuntimeEnvConfigured } from "@/lib/env";

const ResendSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
}).strict();

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
    getRegisterResendRateLimitIdentifier(request),
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

  const parsed = await parseJsonBody(request, ResendSchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid email payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const email = parsed.email.trim().toLowerCase();
  const redirectTo = `${resolveAuthRequestOrigin(request)}/auth/callback`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("Registration resend failed:", error);
    return NextResponse.json(
      { error: "Unable to resend confirmation right now." },
      { status: 400 },
    );
  }

  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) {
    return NextResponse.json(
      { error: "Confirmation token was not generated" },
      { status: 500 },
    );
  }
  const confirmationUrl = buildEmailVerificationCallbackUrl(
    resolveAuthRequestOrigin(request),
    tokenHash,
  );

  const enqueueResult = await enqueueRegistrationConfirmationEmailJob({
    email,
    fullName: data.user.user_metadata?.["full_name"] as string | undefined,
    confirmationUrl,
  });

  if (!enqueueResult.ok) {
    return NextResponse.json(
      { error: enqueueResult.error || "Failed to queue confirmation email" },
      { status: 503 },
    );
  }

  scheduleQueuedEmailDrain({
    batchSize: 5,
    jobTypes: ["auth_register_confirmation"],
  });

  return NextResponse.json({ ok: true });
}
