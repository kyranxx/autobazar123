import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";

const SubmitListingReportSchema = z.object({
  adId: z.string().uuid(),
  category: z.enum([
    "fraud",
    "duplicate",
    "incorrect_info",
    "prohibited",
    "abuse",
    "other",
  ]),
  details: z.string().trim().min(10).max(1000),
  captchaToken: z.string().min(1),
});

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-client-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

function getRequestHostname(request: NextRequest): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || request.nextUrl.hostname;
  return host.split(":")[0]?.toLowerCase() || null;
}

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const rate = await checkStrictRateLimit(
    createRateLimitIdentifier("listing_report_submit", request.headers),
  );
  if (!rate.success) {
    return NextResponse.json(
      { error: "Príliš veľa hlásení. Skúste znova neskôr." },
      { status: 429 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = SubmitListingReportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatné údaje hlásenia." }, { status: 400 });
  }

  const captcha = await verifyTurnstileToken({
    token: parsed.data.captchaToken,
    remoteIp: getClientIp(request),
    action: "listing_report_submit",
    expectedHostname: getRequestHostname(request),
  });

  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server nie je nakonfigurovaný." }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ad, error: adError } = await admin
    .from("ads")
    .select("id, status, seller_id")
    .eq("id", parsed.data.adId)
    .maybeSingle();

  if (adError || !ad || ad.status !== "active") {
    return NextResponse.json({ error: "Inzerát sa nenašiel." }, { status: 404 });
  }

  if (user?.id && user.id === ad.seller_id) {
    return NextResponse.json(
      { error: "Nemôžete nahlásiť vlastný inzerát." },
      { status: 400 },
    );
  }

  if (user?.id) {
    const { data: existingOpenReport } = await admin
      .from("listing_reports")
      .select("id")
      .eq("ad_id", parsed.data.adId)
      .eq("reporter_id", user.id)
      .in("status", ["open", "reviewing"])
      .maybeSingle();

    if (existingOpenReport) {
      return NextResponse.json(
        { ok: true, duplicate: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const { error: insertError } = await admin.from("listing_reports").insert({
    ad_id: parsed.data.adId,
    reporter_id: user?.id || null,
    category: parsed.data.category,
    details: parsed.data.details,
    status: "open",
  });

  if (insertError) {
    return NextResponse.json({ error: "Hlásenie sa nepodarilo uložiť." }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
