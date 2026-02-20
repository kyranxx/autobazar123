import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationConfirmationEmail } from "@/lib/email/send-auth-emails";
import { checkStrictRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().trim().min(1).max(120),
});

function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://autobazar123.sk"
  );
}

function isAlreadyRegisteredError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("already") || lower.includes("registered");
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = await checkStrictRateLimit(`register:${ip}`);
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
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const fullName = parsed.data.fullName.trim();
  const redirectTo = `${getAppOrigin()}/auth/callback`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password: parsed.data.password,
    options: {
      redirectTo,
      data: { full_name: fullName },
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error.message)) {
      return NextResponse.json({ ok: true, alreadyRegistered: true });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const confirmationUrl = data?.properties?.action_link;
  if (!confirmationUrl) {
    return NextResponse.json(
      { error: "Registration link was not generated" },
      { status: 500 },
    );
  }

  const emailResult = await sendRegistrationConfirmationEmail({
    email,
    fullName,
    confirmationUrl,
  });

  if (!emailResult.success) {
    return NextResponse.json(
      { error: emailResult.error || "Failed to send confirmation email" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, alreadyRegistered: false });
}
