import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { sanitizePlainText } from "@/lib/security/sanitize-text";

const ALLOWED_SUBJECTS = [
  "general",
  "technical",
  "billing",
  "partnership",
] as const;

export async function POST(request: NextRequest) {
  // Server-side rate limiting keyed to client IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimitResult = await checkStrictRateLimit(`contact:${ip}`);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    email?: unknown;
    subject?: unknown;
    message?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim() : "";
  const subject =
    typeof body.subject === "string" ? body.subject.trim() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 },
    );
  }

  if (!(ALLOWED_SUBJECTS as readonly string[]).includes(subject)) {
    return NextResponse.json(
      { error: "Invalid subject value." },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 },
    );
  }

  const sanitizedName = sanitizePlainText(name);
  const sanitizedMessage = sanitizePlainText(message);

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: sanitizedName,
    email,
    subject,
    message: sanitizedMessage,
    status: "new",
  });

  if (error) {
    console.error("Contact form DB insert failed:", error.message);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
