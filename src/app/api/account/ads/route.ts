import { NextRequest, NextResponse } from "next/server";
import {
  parseJsonBody,
  rejectWhenInvalidCsrf,
  rejectWhenStrictRateLimited,
  requireAuthenticatedUser,
} from "@/lib/api/route-helpers";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildListingInsertPayload,
  listingMutationSchema,
  sellerAdMutationBodySchema,
} from "@/lib/validation/listings";

function getAccountAdsMutationRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("account_ads_mutation", request.headers);
}

async function resolveListingNames(params: {
  brandId: string;
  modelId: string;
}) {
  const supabase = await createClient();

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name")
    .eq("id", params.brandId)
    .maybeSingle();

  if (!brand?.name) {
    return { ok: false as const, error: "Neplatná značka." };
  }

  const { data: model } = await supabase
    .from("models")
    .select("id, name, brand_id")
    .eq("id", params.modelId)
    .maybeSingle();

  if (!model?.name || model.brand_id !== params.brandId) {
    return { ok: false as const, error: "Neplatný model." };
  }

  return {
    ok: true as const,
    brandName: brand.name,
    modelName: model.name,
  };
}

async function requireOwnedAd(adId: string, userId: string) {
  const supabase = await createClient();
  const { data: ad, error } = await supabase
    .from("ads")
    .select("id, seller_id")
    .eq("id", adId)
    .maybeSingle();

  if (error || !ad) {
    return { ok: false as const, status: 404, error: "Inzerát sa nenašiel." };
  }

  if (ad.seller_id !== userId) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const };
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getAccountAdsMutationRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, listingMutationSchema);
  if (!parsed) {
    return NextResponse.json({ error: "Neplatné údaje inzerátu." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("publish_ad_with_credits", {
    p_ad_data: buildListingInsertPayload(parsed),
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Nepodarilo sa vytvoriť inzerát." },
      { status: 400 },
    );
  }

  if (!data?.success) {
    return NextResponse.json(
      {
        error: data?.error || "Nepodarilo sa vytvoriť inzerát.",
        required: typeof data?.required === "number" ? data.required : undefined,
        currentBalance:
          typeof data?.current_balance === "number" ? data.current_balance : undefined,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      adId: data.ad_id,
      newBalance: data.new_balance,
      status: data.status,
      autoPublished: data.auto_published,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getAccountAdsMutationRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, sellerAdMutationBodySchema);
  if (!parsed) {
    return NextResponse.json({ error: "Neplatné údaje inzerátu." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server nie je nakonfigurovaný." }, { status: 500 });
  }

  const ownedAd = await requireOwnedAd(
    parsed.mode === "quick" ? parsed.quickEdit.adId : parsed.adId,
    user.id,
  );
  if (!ownedAd.ok) {
    return NextResponse.json({ error: ownedAd.error }, { status: ownedAd.status });
  }

  if (parsed.mode === "quick") {
    const { error } = await admin
      .from("ads")
      .update({
        price_eur: parsed.quickEdit.priceEur,
        mileage_km: parsed.quickEdit.mileageKm,
        description: parsed.quickEdit.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.quickEdit.adId)
      .eq("seller_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Nepodarilo sa uložiť úpravy." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: true, adId: parsed.quickEdit.adId },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const listingNames = await resolveListingNames({
    brandId: parsed.listing.brandId,
    modelId: parsed.listing.modelId,
  });

  if (!listingNames.ok) {
    return NextResponse.json({ error: listingNames.error }, { status: 400 });
  }

  const { error } = await admin
    .from("ads")
    .update({
      brand_id: parsed.listing.brandId,
      model_id: parsed.listing.modelId,
      brand: listingNames.brandName,
      model: listingNames.modelName,
      generation: parsed.listing.generation,
      year: parsed.listing.year,
      price_eur: parsed.listing.priceEur,
      mileage_km: parsed.listing.mileageKm,
      fuel: parsed.listing.fuel,
      transmission: parsed.listing.transmission,
      body_style: parsed.listing.bodyStyle,
      power_kw: parsed.listing.powerKw,
      engine_volume_cm3: parsed.listing.engineVolumeCm3,
      drive_type: parsed.listing.driveType,
      color: parsed.listing.color,
      location_city: parsed.listing.locationCity,
      location_district: parsed.listing.locationDistrict,
      description: parsed.listing.description,
      is_bought_in_sk: parsed.listing.isBoughtInSk,
      is_vat_deductible: parsed.listing.isVatDeductible,
      has_service_book: parsed.listing.hasServiceBook,
      full_service_history: parsed.listing.fullServiceHistory,
      originality_check: parsed.listing.originalityCheck,
      garage_kept: parsed.listing.garageKept,
      not_crashed: parsed.listing.notCrashed,
      is_imported: parsed.listing.isImported,
      warranty_expiration: parsed.listing.stkValidUntil,
      photos_json: parsed.listing.photoUrls,
      equipment_json: parsed.listing.equipment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.adId)
    .eq("seller_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Nepodarilo sa uložiť úpravy." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { ok: true, adId: parsed.adId },
    { headers: { "Cache-Control": "no-store" } },
  );
}
