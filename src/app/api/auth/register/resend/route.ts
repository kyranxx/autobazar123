import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationConfirmationEmail } from "@/lib/email/send-auth-emails";
import { checkStrictRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const ResendSchema = z.object({
  email: z.string().email(),
});

function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://autobazar123.sk"
  );
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = await checkStrictRateLimit(`register-resend:${ip}`);
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
  const parsed = ResendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const redirectTo = `${getAppOrigin()}/auth/callback`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const confirmationUrl = data?.properties?.action_link;
  if (!confirmationUrl) {
    return NextResponse.json(
      { error: "Confirmation link was not generated" },
      { status: 500 },
    );
  }

  const emailResult = await sendRegistrationConfirmationEmail({
    email,
    fullName: data.user.user_metadata?.["full_name"] as string | undefined,
    confirmationUrl,
  });

  if (!emailResult.success) {
    return NextResponse.json(
      { error: emailResult.error || "Failed to send confirmation email" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
