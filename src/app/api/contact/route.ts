import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";
import { createContactFormSchema } from "@/lib/validation/forms";

const ContactFormSchema = createContactFormSchema();

export function getContactSubmitRateLimitIdentifier(
  request: NextRequest,
): string {
  return createRateLimitIdentifier("contact_submit", request.headers);
}

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const rate = await checkStrictRateLimit(
    getContactSubmitRateLimitIdentifier(request),
  );

  if (!rate.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Príliš veľa pokusov. Skúste znova neskôr.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))),
        },
      },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = ContactFormSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Neplatné údaje kontaktného formulára." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Server nie je nakonfigurovaný." },
      { status: 500 },
    );
  }

  const { error } = await admin.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    status: "new",
  });

  if (error) {
    console.error("Contact form insert failed:", error);
    return NextResponse.json(
      { ok: false, error: "Nepodarilo sa odoslať správu. Skúste znova neskôr." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
