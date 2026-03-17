import { NextRequest, NextResponse } from "next/server";
import {
  createCronAdminClient,
  rejectWhenInvalidCronRequest,
} from "@/lib/cron/route-helpers";
import { isExpectedPrerenderBailout } from "@/lib/next/prerender-bailout";
import {
  type SavedSearchFilters,
  savedSearchFiltersToParams,
} from "@/lib/search/saved-searches";
import {
  sendSavedAdAlertEmail,
  sendSavedSearchAlertEmail,
} from "@/lib/email/send-marketplace-alerts";
import { buildAdPath } from "@/lib/cars/ad-path";

type SavedAdAlertRow = {
  user_id: string;
  ad_id: string;
  notify_price_drop: boolean;
  notify_status_change: boolean;
  notify_email: boolean;
  paused: boolean;
  last_alerted_price_eur: number | null;
  last_alerted_status: string | null;
  profiles:
    | { email?: string | null; full_name?: string | null }
    | Array<{ email?: string | null; full_name?: string | null }>
    | null;
  ads:
    | {
        id: string;
        brand?: string | null;
        model?: string | null;
        year?: number | null;
        price_eur?: number | null;
        status?: string | null;
      }
    | Array<{
        id: string;
        brand?: string | null;
        model?: string | null;
        year?: number | null;
        price_eur?: number | null;
        status?: string | null;
      }>
    | null;
};

type SavedSearchRow = {
  id: string;
  label: string;
  query_string: string;
  filters_json: SavedSearchFilters | null;
  notify_email: boolean;
  paused: boolean;
  last_notified_listing_created_at: string | null;
  created_at: string;
  profiles:
    | { email?: string | null; full_name?: string | null }
    | Array<{ email?: string | null; full_name?: string | null }>
    | null;
};

type AlertListingRow = {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  price_eur: number | null;
  location_city: string | null;
  created_at: string;
};

type AdsQueryLike<TQuery> = {
  eq(column: string, value: unknown): TQuery;
  in(column: string, values: unknown[]): TQuery;
  ilike(column: string, value: string): TQuery;
  gte(column: string, value: number): TQuery;
  lte(column: string, value: number): TQuery;
  or(filters: string): TQuery;
};

function getProfile(value: SavedAdAlertRow["profiles"] | SavedSearchRow["profiles"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getAd(value: SavedAdAlertRow["ads"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL
    || process.env.NEXT_PUBLIC_SITE_URL
    || "https://autobazar123.sk"
  );
}

function toStatusLabel(status: string | null | undefined): string | undefined {
  if (!status) return undefined;

  switch (status) {
    case "active":
      return "aktívny";
    case "sold":
      return "predaný";
    case "expired":
      return "expirovaný";
    case "pending":
      return "čaká na schválenie";
    case "rejected":
      return "zamietnutý";
    default:
      return status;
  }
}

function applySavedSearchFilters<TQuery extends AdsQueryLike<TQuery>>(
  query: TQuery,
  filters: SavedSearchFilters,
) {
  let nextQuery = query.eq("status", "active");

  if (filters.brand.length > 0) {
    nextQuery = nextQuery.in("brand", filters.brand);
  }
  if (filters.model) {
    nextQuery = nextQuery.ilike("model", filters.model);
  }
  if (filters.fuel) {
    nextQuery = nextQuery.eq("fuel", filters.fuel);
  }
  if (filters.transmission) {
    nextQuery = nextQuery.eq("transmission", filters.transmission);
  }
  if (filters.bodyStyle) {
    nextQuery = nextQuery.eq("body_style", filters.bodyStyle);
  }
  if (filters.location) {
    nextQuery = nextQuery.ilike("location_city", `%${filters.location.replace(/\s+/g, "%")}%`);
  }
  if (typeof filters.priceFrom === "number") {
    nextQuery = nextQuery.gte("price_eur", filters.priceFrom);
  }
  if (typeof filters.priceTo === "number") {
    nextQuery = nextQuery.lte("price_eur", filters.priceTo);
  }
  if (typeof filters.mileageFrom === "number") {
    nextQuery = nextQuery.gte("mileage_km", filters.mileageFrom);
  }
  if (typeof filters.mileageTo === "number") {
    nextQuery = nextQuery.lte("mileage_km", filters.mileageTo);
  }
  if (typeof filters.yearFrom === "number") {
    nextQuery = nextQuery.gte("year", filters.yearFrom);
  }
  if (typeof filters.yearTo === "number") {
    nextQuery = nextQuery.lte("year", filters.yearTo);
  }
  if (filters.hasServiceBook) {
    nextQuery = nextQuery.eq("has_service_book", true);
  }
  if (filters.notCrashed) {
    nextQuery = nextQuery.eq("not_crashed", true);
  }
  if (filters.boughtInSk) {
    nextQuery = nextQuery.eq("is_bought_in_sk", true);
  }
  if (filters.q) {
    const wildcardQuery = filters.q.replace(/\s+/g, "%");
    nextQuery = nextQuery.or(
      `brand.ilike.%${wildcardQuery}%,model.ilike.%${wildcardQuery}%,location_city.ilike.%${wildcardQuery}%`,
    );
  }

  return nextQuery;
}

export async function GET(request: NextRequest) {
  try {
    const cronError = rejectWhenInvalidCronRequest(request);
    if (cronError) {
      return cronError;
    }

    const supabaseAdmin = createCronAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Cron admin client is not configured" },
        { status: 500 },
      );
    }

    const baseUrl = getBaseUrl();
    let savedAdEmailsSent = 0;
    let savedSearchEmailsSent = 0;

    const { data: savedAdAlertRows, error: savedAdAlertError } = await supabaseAdmin
      .from("saved_ad_alert_preferences")
      .select(
        `
          user_id,
          ad_id,
          notify_price_drop,
          notify_status_change,
          notify_email,
          paused,
          last_alerted_price_eur,
          last_alerted_status,
          profiles:user_id (email, full_name),
          ads:ad_id (id, brand, model, year, price_eur, status)
        `,
      )
      .eq("notify_email", true)
      .eq("paused", false);

    if (savedAdAlertError) {
      throw new Error(savedAdAlertError.message);
    }

    for (const row of ((savedAdAlertRows as SavedAdAlertRow[] | null) || [])) {
      const profile = getProfile(row.profiles);
      const ad = getAd(row.ads);

      if (!profile?.email || !ad?.id) {
        continue;
      }

      const currentPrice = typeof ad.price_eur === "number" ? ad.price_eur : null;
      const previousPrice =
        typeof row.last_alerted_price_eur === "number" ? row.last_alerted_price_eur : null;
      const priceDropAmount =
        row.notify_price_drop
        && currentPrice !== null
        && previousPrice !== null
        && currentPrice < previousPrice
          ? previousPrice - currentPrice
          : null;

      const currentStatus = typeof ad.status === "string" ? ad.status : null;
      const statusLabel =
        row.notify_status_change
        && typeof row.last_alerted_status === "string"
        && currentStatus
        && row.last_alerted_status !== currentStatus
          ? toStatusLabel(currentStatus)
          : undefined;

      if (priceDropAmount === null && !statusLabel) {
        continue;
      }

      const adTitle = `${ad.brand || ""} ${ad.model || ""}`.trim() || "Uložený inzerát";
      const adUrl = `${baseUrl}${buildAdPath({
        id: ad.id,
        brand: ad.brand || "",
        model: ad.model || "",
        year: ad.year || undefined,
      })}`;

      const result = await sendSavedAdAlertEmail({
        to: profile.email,
        fullName: profile.full_name,
        adTitle,
        adUrl,
        priceDropAmount: priceDropAmount ?? undefined,
        currentPriceEur: currentPrice ?? undefined,
        statusLabel,
      });

      if (!result.success) {
        continue;
      }

      savedAdEmailsSent += 1;

      await supabaseAdmin
        .from("saved_ad_alert_preferences")
        .update({
          last_alerted_price_eur: currentPrice,
          last_alerted_status: currentStatus,
          last_alerted_at: new Date().toISOString(),
        })
        .eq("user_id", row.user_id)
        .eq("ad_id", row.ad_id);
    }

    const { data: savedSearchRows, error: savedSearchError } = await supabaseAdmin
      .from("saved_searches")
      .select(
        `
          id,
          label,
          query_string,
          filters_json,
          notify_email,
          paused,
          last_notified_listing_created_at,
          created_at,
          profiles:user_id (email, full_name)
        `,
      )
      .eq("notify_email", true)
      .eq("paused", false);

    if (savedSearchError) {
      throw new Error(savedSearchError.message);
    }

    for (const row of ((savedSearchRows as SavedSearchRow[] | null) || [])) {
      const profile = getProfile(row.profiles);
      if (!profile?.email || !row.filters_json) {
        continue;
      }

      const since = row.last_notified_listing_created_at || row.created_at;
      let query = supabaseAdmin
        .from("ads")
        .select("id, brand, model, year, price_eur, location_city, created_at")
        .gt("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5);

      query = applySavedSearchFilters(query, row.filters_json);

      const { data: listings, error: listingsError } = await query;
      if (listingsError) {
        throw new Error(listingsError.message);
      }

      const listingRows = ((listings as AlertListingRow[] | null) || []);
      if (listingRows.length === 0) {
        continue;
      }

      const resultsPageUrl = `${baseUrl}/vysledky${
        row.query_string ? `?${savedSearchFiltersToParams(row.filters_json).toString()}` : ""
      }`;

      const result = await sendSavedSearchAlertEmail({
        to: profile.email,
        fullName: profile.full_name,
        label: row.label,
        resultsPageUrl,
        listings: listingRows.map((listing) => ({
          title: `${listing.brand || ""} ${listing.model || ""}`.trim() || "Nový inzerát",
          priceEur: listing.price_eur || 0,
          locationCity: listing.location_city,
          href: `${baseUrl}${buildAdPath({
            id: listing.id,
            brand: listing.brand || "",
            model: listing.model || "",
            year: listing.year || undefined,
          })}`,
        })),
      });

      if (!result.success) {
        continue;
      }

      const newestCreatedAt = listingRows.reduce(
        (latest, listing) =>
          listing.created_at > latest ? listing.created_at : latest,
        since,
      );

      savedSearchEmailsSent += 1;

      await supabaseAdmin
        .from("saved_searches")
        .update({ last_notified_listing_created_at: newestCreatedAt })
        .eq("id", row.id);
    }

    return NextResponse.json({
      ok: true,
      savedAdEmailsSent,
      savedSearchEmailsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (!isExpectedPrerenderBailout(error)) {
      console.error("Saved alerts cron failed:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
