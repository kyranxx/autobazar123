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

const DealerActionSchema = z
  .object({
    adIds: z.array(z.string().uuid()).min(1),
    operation: z.enum(["prolong_basic", "prolong_premium", "prolong_top"]),
  })
  .strict();

function getRateLimitIdentifier(request: NextRequest) {
  return createRateLimitIdentifier("dealer_actions", request.headers);
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
  const parsed = DealerActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná akcia." }, { status: 400 });
  }

  const config = await getPricingConfig();
  const operation = parsed.data.operation satisfies ListingActionOperation;
  const priceCents = getListingOperationPriceCents(config, operation);

  const { data, error } = await admin.rpc("apply_dealer_balance_action", {
    p_actor_user_id: user.id,
    p_operation: operation,
    p_ad_ids: parsed.data.adIds,
    p_price_cents: priceCents,
  });

  if (error || !data?.success) {
    return NextResponse.json(
      {
        error:
          error?.message
          || data?.error
          || "Nepodarilo sa aplikovať dealer akciu.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      appliedCount: data.applied_count,
      amountCents: data.amount_cents,
      newBalanceCents: data.new_balance_cents,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
