import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";
import { createAdminClient } from "@/lib/supabase/admin";

const MarkSoldSchema = z.object({
  adId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const payload = await request.json().catch(() => null);
  const parsed = MarkSoldSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatné ID inzerátu." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: ad, error: adError } = await supabase
    .from("ads")
    .select("id, seller_id, dealer_id, status")
    .eq("id", parsed.data.adId)
    .maybeSingle();

  if (adError || !ad) {
    return NextResponse.json({ error: "Inzerát sa nenašiel." }, { status: 404 });
  }

  if (ad.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ad.status !== "active") {
    return NextResponse.json(
      { error: "Ako predané možno označiť len aktívny inzerát." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await admin
    .from("ads")
    .update({
      status: "sold",
      sold_at: nowIso,
      sale_confirmed_at: nowIso,
      sale_confirmation_method: "seller_dashboard_manual",
      sale_confirmed_by: user.id,
      updated_at: nowIso,
      is_hidden: false,
    })
    .eq("id", parsed.data.adId)
    .eq("seller_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: true,
      adId: parsed.data.adId,
      sellerType: ad.dealer_id ? "dealer" : "private",
      confirmationMethod: "seller_dashboard_manual",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
