"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/rbac";

interface AdminAnalyticsSummary {
  searches24h: number;
  searches7d: number;
  ctaClicks24h: number;
  ctaClicks7d: number;
  featuredListingClicks24h: number;
  featuredListingClicks7d: number;
  averagePreviewCount7d: number | null;
}

interface AdminAnalyticsBreakdownRow {
  label: string;
  count: number;
}

interface AdminAnalyticsRecentEvent {
  id: string;
  eventName: string;
  label: string;
  pagePath: string | null;
  createdAt: string;
}

export interface AdminHomepageAnalyticsDashboard {
  summary: AdminAnalyticsSummary;
  eventBreakdown: AdminAnalyticsBreakdownRow[];
  ctaBreakdown: AdminAnalyticsBreakdownRow[];
  searchBreakdown: AdminAnalyticsBreakdownRow[];
  recentEvents: AdminAnalyticsRecentEvent[];
}

type AnalyticsEventRow = {
  id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  await requireRole(user.id, "admin");
  return { supabase };
}

function getMetadataRecord(
  metadata: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  const value = metadata?.[key];
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getPayloadString(
  payload: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

function getPayloadNumber(
  payload: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getEventName(row: AnalyticsEventRow) {
  return getPayloadString(row.metadata, "eventName");
}

function getEventPayload(row: AnalyticsEventRow) {
  return getMetadataRecord(row.metadata, "payload");
}

function getEventPagePath(row: AnalyticsEventRow) {
  return getPayloadString(row.metadata, "pagePath");
}

function getAnalyticsEventLabel(eventName: string | null): string {
  switch (eventName) {
    case "search_query_submitted":
      return "Vyhľadávanie z úvodnej stránky";
    case "homepage_cta_clicked":
      return "Klik na hlavné tlačidlo";
    case "listing_viewed":
      return "Otvorený odporúčaný inzerát";
    default:
      return "Iná udalosť";
  }
}

function getHomepageSurfaceLabel(surface: string | null): string {
  switch (surface) {
    case "home_account":
      return "Účet";
    case "home_seller_panel":
      return "Panel pre predajcov";
    case "home_seller_promo":
      return "Výzva pre predajcov";
    case "home_quick_links":
      return "Rýchle odkazy";
    case "home_quick_search":
      return "Rýchle vyhľadávanie";
    case "home_brand_logos":
      return "Značky áut";
    default:
      return "Iné miesto";
  }
}

function getHomepageCtaLabel(cta: string | null): string {
  switch (cta) {
    case "register":
      return "Registrovať";
    case "sell_car":
      return "Predať auto";
    case "dealers":
      return "Predajcovia";
    case "family_suv":
      return "Rodinné SUV";
    case "city_cars":
      return "Mestské autá";
    case "automatics":
      return "Automaty";
    case "utility":
      return "Úžitkové autá";
    case "motorbikes":
      return "Motorky";
    case "all_cars":
      return "Všetky autá";
    case "view_all_brands":
      return "Všetky značky";
    case "popular_brand":
      return "Obľúbená značka";
    default:
      return "Iné tlačidlo";
  }
}

function buildCtaBreakdownLabel(payload: Record<string, unknown> | null): string {
  return `${getHomepageSurfaceLabel(getPayloadString(payload, "surface"))} / ${getHomepageCtaLabel(
    getPayloadString(payload, "cta"),
  )}`;
}

function normalizeSearchQuery(payload: Record<string, unknown> | null): string {
  const query = getPayloadString(payload, "query")?.trim().toLocaleLowerCase("sk-SK");
  return query || "bez textu";
}

function buildRecentEventLabel(row: AnalyticsEventRow): string {
  const eventName = getEventName(row);
  const payload = getEventPayload(row);

  if (eventName === "search_query_submitted") {
    return `Hľadané slovo: ${normalizeSearchQuery(payload)}`;
  }

  if (eventName === "homepage_cta_clicked") {
    return `Klik: ${buildCtaBreakdownLabel(payload)}`;
  }

  if (eventName === "listing_viewed") {
    return "Otvorený odporúčaný inzerát";
  }

  return "Iná udalosť";
}

function sortBreakdownRows(map: Map<string, number>): AdminAnalyticsBreakdownRow[] {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (left.count === right.count) {
        return left.label.localeCompare(right.label);
      }

      return right.count - left.count;
    });
}

export async function getHomepageAnalyticsDashboard(): Promise<AdminHomepageAnalyticsDashboard> {
  const { supabase } = await requireAuth();
  const now = Date.now();
  const last24HoursIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const last7DaysIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("system_logs")
    .select("id, metadata, created_at")
    .eq("message", "analytics_event")
    .gte("created_at", last7DaysIso)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data as AnalyticsEventRow[] | null) || []).filter(
    (row) => {
      const eventName = getEventName(row);
      const payload = getEventPayload(row);
      const pagePath = getEventPagePath(row);

      return (
        (eventName === "search_query_submitted" && pagePath === "/") ||
        eventName === "homepage_cta_clicked" ||
        (eventName === "listing_viewed" &&
          getPayloadString(payload, "source") === "featured")
      );
    },
  );

  let searches24h = 0;
  let searches7d = 0;
  let ctaClicks24h = 0;
  let ctaClicks7d = 0;
  let featuredListingClicks24h = 0;
  let featuredListingClicks7d = 0;
  let previewCountSum = 0;
  let previewCountSamples = 0;

  const eventBreakdown = new Map<string, number>();
  const ctaBreakdown = new Map<string, number>();
  const searchBreakdown = new Map<string, number>();

  for (const row of rows) {
    const createdAtMs = new Date(row.created_at).getTime();
    const isLast24Hours = createdAtMs >= new Date(last24HoursIso).getTime();
    const eventName = getEventName(row);
    const payload = getEventPayload(row);
    const eventLabel = getAnalyticsEventLabel(eventName);

    eventBreakdown.set(eventLabel, (eventBreakdown.get(eventLabel) ?? 0) + 1);

    if (eventName === "search_query_submitted") {
      searches7d += 1;
      if (isLast24Hours) {
        searches24h += 1;
      }

      const searchQuery = normalizeSearchQuery(payload);
      searchBreakdown.set(
        searchQuery,
        (searchBreakdown.get(searchQuery) ?? 0) + 1,
      );

      const resultCount = getPayloadNumber(payload, "resultCount");
      if (resultCount !== null) {
        previewCountSum += resultCount;
        previewCountSamples += 1;
      }
      continue;
    }

    if (eventName === "homepage_cta_clicked") {
      ctaClicks7d += 1;
      if (isLast24Hours) {
        ctaClicks24h += 1;
      }

      const breakdownLabel = buildCtaBreakdownLabel(payload);
      ctaBreakdown.set(breakdownLabel, (ctaBreakdown.get(breakdownLabel) ?? 0) + 1);
      continue;
    }

    const source = getPayloadString(payload, "source");
    if (eventName === "listing_viewed" && source === "featured") {
      featuredListingClicks7d += 1;
      if (isLast24Hours) {
        featuredListingClicks24h += 1;
      }
    }
  }

  return {
    summary: {
      searches24h,
      searches7d,
      ctaClicks24h,
      ctaClicks7d,
      featuredListingClicks24h,
      featuredListingClicks7d,
      averagePreviewCount7d:
        previewCountSamples > 0 ? Math.round(previewCountSum / previewCountSamples) : null,
    },
    eventBreakdown: sortBreakdownRows(eventBreakdown),
    ctaBreakdown: sortBreakdownRows(ctaBreakdown),
    searchBreakdown: sortBreakdownRows(searchBreakdown).slice(0, 12),
    recentEvents: rows.slice(0, 30).map((row) => ({
      id: row.id,
      eventName: getAnalyticsEventLabel(getEventName(row)),
      label: buildRecentEventLabel(row),
      pagePath: getEventPagePath(row),
      createdAt: row.created_at,
    })),
  };
}
