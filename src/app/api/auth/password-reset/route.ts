import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordRecoveryEmail } from "@/lib/email/send-auth-emails";

export const runtime = "nodejs";

const PasswordResetSchema = z.object({
  email: z.string().email(),
});

function getRequestOrigin(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedHost) {
    return `${forwardedProto || "https"}://${forwardedHost}`;
  }

  const host = request.headers.get("host");
  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "https://autobazar123.sk";
}

function isUserNotFoundError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("not found") || lower.includes("invalid email");
}

export async function POST(request: NextRequest) {
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
  const redirectTo = `${getRequestOrigin(request)}/auth/reset-password`;

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
