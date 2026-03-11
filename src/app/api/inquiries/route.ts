import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  submitInquiry,
  type InquiryInsertClient,
} from "@/lib/inquiries/submit-inquiry";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";


const SubmitInquirySchema = z.object({
  adId: z.string().uuid(),
  recipientId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000),
  captchaToken: z.string().min(1),
});

const DeleteInquirySchema = z.object({
  inquiryId: z.string().uuid(),
});

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-client-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const payload = await request.json().catch(() => null);
  const parsed = SubmitInquirySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatne údaje správy." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const captcha = await verifyTurnstileToken({
    token: parsed.data.captchaToken,
    remoteIp: getClientIp(request),
    action: "inquiry_submit",
  });

  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  const { data: ad, error: adError } = await supabase
    .from("ads")
    .select("id, seller_id")
    .eq("id", parsed.data.adId)
    .single();

  if (adError || !ad) {
    return NextResponse.json({ error: "Inzerát sa nenasiel." }, { status: 404 });
  }

  const isAdSeller = ad.seller_id === user.id;
  const recipientId = parsed.data.recipientId || ad.seller_id;

  if (!recipientId || recipientId === user.id) {
    return NextResponse.json(
      { error: "Nie je možné odoslať správu tomuto prijemcovi." },
      { status: 400 },
    );
  }

  if (!isAdSeller && recipientId !== ad.seller_id) {
    return NextResponse.json(
      { error: "Správu pre tento inzerát môžete odoslať iba predajcovi." },
      { status: 403 },
    );
  }

  if (isAdSeller) {
    const { count, error: pairError } = await supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("ad_id", parsed.data.adId)
      .or(
        `sender_id.eq.${recipientId},recipient_id.eq.${recipientId}`,
      );

    if (pairError || !count) {
      return NextResponse.json(
        { error: "Na odpoveď je potrebna existujuca konverzacia." },
        { status: 400 },
      );
    }
  }

  const result = await submitInquiry(supabase as unknown as InquiryInsertClient, {
    adId: parsed.data.adId,
    senderId: user.id,
    recipientId,
    message: parsed.data.message,
    phone: null,
  });

  if (!result.ok) {
    const status = result.error.includes("Prilis vela sprav") ? 429 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = DeleteInquirySchema.safeParse(query);

  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatne id správy." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", parsed.data.inquiryId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Správa sa nenašla." }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
