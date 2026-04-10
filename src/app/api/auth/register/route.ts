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
import { registerRequestSchema } from "@/lib/validation/forms";
import {
  enqueueRegistrationConfirmationEmailJob,
  scheduleQueuedEmailDrain,
} from "@/lib/email/jobs";

export function getRegisterRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("auth_register", request.headers);
}

function isAlreadyRegisteredError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("already") || lower.includes("registered");
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getRegisterRateLimitIdentifier(request),
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

  const parsed = await parseJsonBody(request, registerRequestSchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const email = parsed.email.trim().toLowerCase();
  const fullName = parsed.fullName.trim();
  const redirectTo = `${resolveAuthRequestOrigin(request)}/auth/callback`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password: parsed.password,
    options: {
      redirectTo,
      data: {
        full_name: fullName,
        dealer_interest: parsed.dealerInterest,
      },
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error.message)) {
      return NextResponse.json({ ok: true, alreadyRegistered: true });
    }

    console.error("Registration link generation failed:", error);
    return NextResponse.json(
      { error: "Unable to complete registration right now." },
      { status: 400 },
    );
  }

  const confirmationUrl = data?.properties?.action_link;
  if (!confirmationUrl) {
    return NextResponse.json(
      { error: "Registration link was not generated" },
      { status: 500 },
    );
  }

  const enqueueResult = await enqueueRegistrationConfirmationEmailJob({
    email,
    fullName,
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

  return NextResponse.json({ ok: true, alreadyRegistered: false });
}
