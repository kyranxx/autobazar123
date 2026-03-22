import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";
import { createAdminClient } from "@/lib/supabase/admin";

const ResubmitAdSchema = z.object({
  adId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const payload = await request.json().catch(() => null);
  const parsed = ResubmitAdSchema.safeParse(payload);
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
    .select("id, seller_id, status, description")
    .eq("id", parsed.data.adId)
    .maybeSingle();

  if (adError || !ad) {
    return NextResponse.json({ error: "Inzerát sa nenašiel." }, { status: 404 });
  }

  if (ad.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ad.status !== "rejected") {
    return NextResponse.json(
      { error: "Znovu odoslať možno len zamietnutý inzerát." },
      { status: 400 },
    );
  }

  const { data: autoPublishEligible, error: autoPublishError } = await supabase.rpc(
    "is_seller_auto_publish_eligible",
    {
      p_user_id: user.id,
      p_description: ad.description || "",
    },
  );

  if (autoPublishError) {
    return NextResponse.json({ error: autoPublishError.message }, { status: 400 });
  }

  const shouldAutoPublish = Boolean(autoPublishEligible);
  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("ads")
    .update({
      status: shouldAutoPublish ? "active" : "pending",
      published_at: shouldAutoPublish ? nowIso : null,
      expires_at: shouldAutoPublish ? expiresAtIso : null,
      moderation_submitted_at: shouldAutoPublish ? null : nowIso,
      moderation_reviewed_at: null,
      moderation_reviewed_by: null,
      updated_at: nowIso,
    })
    .eq("id", parsed.data.adId)
    .eq("seller_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json(
    { ok: true, status: shouldAutoPublish ? "active" : "pending" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
