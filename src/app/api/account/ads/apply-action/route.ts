import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  rejectWhenInvalidCsrf,
  rejectWhenStrictRateLimited,
  requireAuthenticatedUser,
} from "@/lib/api/route-helpers";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getListingOperationPriceCents,
  type ListingActionOperation,
} from "@/lib/pricing/config";
import { getPricingConfig } from "@/lib/pricing/server";

const ApplyActionSchema = z
  .object({
    adId: z.string().uuid(),
    operation: z.enum(["prolong_basic", "prolong_premium", "prolong_top"]),
  })
  .strict();

function getRateLimitIdentifier(request: NextRequest) {
  return createRateLimitIdentifier("account_ads_apply_action", request.headers);
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server nie je nakonfigurovaný." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ApplyActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná akcia." }, { status: 400 });
  }

  const { data: ad } = await admin
    .from("ads")
    .select("id, seller_id")
    .eq("id", parsed.data.adId)
    .maybeSingle();

  if (!ad?.id) {
    return NextResponse.json({ error: "Inzerát sa nenašiel." }, { status: 404 });
  }

  if (ad.seller_id !== user.id) {
    return NextResponse.json({ error: "Nemáte prístup k tomuto inzerátu." }, { status: 403 });
  }

  const config = await getPricingConfig();
  const operation = parsed.data.operation satisfies ListingActionOperation;
  const priceCents = getListingOperationPriceCents(config, operation);

  if (priceCents > 0) {
    return NextResponse.json(
      {
        ok: true,
        adId: ad.id,
        checkoutRequired: true,
        operation,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await admin.rpc("apply_private_listing_action", {
    p_actor_user_id: user.id,
    p_ad_id: ad.id,
    p_operation: operation,
    p_transaction_id: null,
  });

  if (error || !data?.success) {
    return NextResponse.json(
      { error: error?.message || data?.error || "Nepodarilo sa upraviť inzerát." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      adId: ad.id,
      status: data.status,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
