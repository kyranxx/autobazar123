import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordRecoveryEmail } from "@/lib/email/send-auth-emails";
import { checkStrictRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const PasswordResetSchema = z.object({
  email: z.string().email(),
});

function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://autobazar123.sk"
  );
}

function isUserNotFoundError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("not found") || lower.includes("invalid email");
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = await checkStrictRateLimit(`password-reset:${ip}`);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)) },
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
  const redirectTo = `${getAppOrigin()}/auth/reset-password`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo,
    },
  });

  if (error) {
    // Avoid account enumeration - treat unknown emails as successful response.
    if (isUserNotFoundError(error.message)) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const resetUrl = data?.properties?.action_link;
  if (!resetUrl) {
    return NextResponse.json(
      { error: "Reset link was not generated" },
      { status: 500 },
    );
  }

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
