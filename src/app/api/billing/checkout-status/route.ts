import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const { data: dealer } = await admin
    .from("dealers")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: checkout, error } = await admin
    .from("billing_checkout_sessions")
    .select(
      "id, stripe_session_id, checkout_kind, operation_type, status, target_ad_id, paid_at",
    )
    .eq("stripe_session_id", sessionId)
    .eq("actor_user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Nepodarilo sa načítať platbu." }, { status: 500 });
  }

  if (!checkout && dealer?.id) {
    const { data: dealerCheckout, error: dealerError } = await admin
      .from("billing_checkout_sessions")
      .select(
        "id, stripe_session_id, checkout_kind, operation_type, status, target_ad_id, paid_at",
      )
      .eq("stripe_session_id", sessionId)
      .eq("dealer_id", dealer.id)
      .maybeSingle();

    if (dealerError) {
      return NextResponse.json({ error: "Nepodarilo sa načítať platbu." }, { status: 500 });
    }

    return NextResponse.json(
      dealerCheckout || { status: "pending" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    checkout || { status: "pending" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
