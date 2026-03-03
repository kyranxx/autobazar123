import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sanitizePlainText } from "@/lib/security/sanitize-text";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkStrictRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const ContactSubjectSchema = z.enum([
  "general",
  "technical",
  "billing",
  "partnership",
]);

const ContactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Meno je prilis kratke.")
    .max(100, "Meno je prilis dlhe.")
    .transform((value) => sanitizePlainText(value))
    .refine((value) => value.length >= 2, {
      message: "Meno je prilis kratke.",
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Neplatny email.")
    .max(254, "Neplatny email."),
  subject: z
    .union([ContactSubjectSchema, z.literal("")])
    .transform((value) => (value === "" ? "general" : value)),
  message: z
    .string()
    .trim()
    .min(10, "Správa je prilis kratka.")
    .max(2000, "Správa je prilis dlha.")
    .transform((value) => sanitizePlainText(value))
    .refine((value) => value.length >= 10, {
      message: "Správa je prilis kratka.",
    }),
});

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-client-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = await checkStrictRateLimit(`contact_submit:${ip}`);

  if (!rate.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Prilis vela pokusov. Skuste znova neskor.",
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
      { ok: false, error: "Neplatne údaje kontaktneho formulara." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Server nie je nakonfigurovany." },
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
      { ok: false, error: "Nepodarilo sa odoslať správu. Skuste znova neskor." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
