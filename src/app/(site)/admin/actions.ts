"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/rbac";
import { assertAdminMfaAssurance } from "@/lib/auth/admin-mfa";
import {
  buildCheckoutAmountBySessionMap,
  calculateStripeRevenueTotals,
  summarizeCreditConsumption,
  summarizeTopUpTransactions,
  type ProcessedCheckoutLog,
  type TopUpTransactionInput,
} from "@/lib/admin/revenue";
import {
  buildSloDashboardSnapshot,
  toWebVitalSample,
  type SloMetricRow,
} from "@/lib/performance/slo";
import { revalidatePath } from "next/cache";

export interface AdminStats {
  totalUsers: number;
  totalAds: number;
  activeAds: number;
  pendingModeration: number;
  dealerAccounts: number;
  todayRegistrations: number;
  todayAds: number;
  soldToday: number;
}

export interface RevenueStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalCredits: number;
  stripeRevenue: number;
  recentTransactions?: RevenueTransaction[];
  creditConsumption?: RevenueCreditConsumption[];
  stripeStatus?: RevenueStripeStatus;
}

export interface RevenueTransaction {
  id: string;
  userEmail: string;
  amountEur: number | null;
  credits: number;
  createdAt: string;
  status: "succeeded" | "failed" | "pending";
}

export interface RevenueCreditConsumption {
  actionType: string;
  label: string;
  count: number;
  credits: number;
}

export interface RevenueStripeStatus {
  webhookStatus: "healthy" | "degraded" | "idle";
  lastProcessedAt: string | null;
  failedEventsLast24h: number;
  recentEvents: number;
}

export interface PendingAd {
  id: string;
  brand: string;
  model: string;
  seller: string;
  sellerId: string;
  photos: number;
  price: number;
  created_at: string;
  flags: string[];
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  credit_balance: number;
  created_at: string;
  is_dealer: boolean;
  ad_count: number;
  is_banned: boolean;
  role: "user" | "dealer" | "admin";
}

export interface SystemLog {
  id: string;
  level: string;
  category: string;
  message: string;
  request_id: string | null;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  error_stack: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface PerformanceSloDashboard {
  windowHours: number;
  totalSamples: number;
  routeCount: number;
  lastIngestedAt: string | null;
  rows: SloMetricRow[];
}

type RequireAdminOptions = {
  requireMfa?: boolean;
};

async function requireAdmin(options: RequireAdminOptions = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");
  await requireRole(user.id, "admin");

  if (options.requireMfa) {
    await assertAdminMfaAssurance(supabase);
  }

  return { userId: user.id, supabase };
}

const STRIPE_LOG_PAGE_SIZE = 1000;
const STRIPE_LOG_MAX_PAGES = 50;

type CheckoutLogRow = {
  processed_at: string | null;
  metadata: unknown;
};

type TopUpRow = {
  id: string;
  amount: number;
  payment_status: string | null;
  stripe_session_id: string | null;
  created_at: string;
  profiles: { email?: string | null } | { email?: string | null }[] | null;
};

function getProfileEmail(
  value: TopUpRow["profiles"],
): string {
  if (Array.isArray(value)) {
    return value[0]?.email || "unknown";
  }

  return value?.email || "unknown";
}

async function fetchProcessedCheckoutLogs(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ProcessedCheckoutLog[]> {
  const logs: ProcessedCheckoutLog[] = [];

  for (let page = 0; page < STRIPE_LOG_MAX_PAGES; page += 1) {
    const from = page * STRIPE_LOG_PAGE_SIZE;
    const to = from + STRIPE_LOG_PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("stripe_webhook_logs")
      .select("processed_at, metadata")
      .eq("event_type", "checkout.session.completed")
      .eq("status", "processed")
      .order("processed_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data as CheckoutLogRow[] | null) || [];
    logs.push(
      ...rows.map((row) => ({
        processedAt: row.processed_at,
        metadata: row.metadata,
      })),
    );

    if (rows.length < STRIPE_LOG_PAGE_SIZE) {
      break;
    }
  }

  return logs;
}

export async function getAdminStats(): Promise<AdminStats> {
  const { supabase } = await requireAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    { count: totalUsers },
    { count: totalAds },
    { count: activeAds },
    { count: pendingCount },
    { count: dealerCount },
    { count: todayRegs },
    { count: todayAdsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("ads").select("id", { count: "exact", head: true }),
    supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_dealer", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
    supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
  ]);

  return {
    totalUsers: totalUsers || 0,
    totalAds: totalAds || 0,
    activeAds: activeAds || 0,
    pendingModeration: pendingCount || 0,
    dealerAccounts: dealerCount || 0,
    todayRegistrations: todayRegs || 0,
    todayAds: todayAdsCount || 0,
    soldToday: 0,
  };
}

export async function getRevenueStats(): Promise<RevenueStats> {
  const { supabase } = await requireAdmin();
  const now = new Date();
  const monthStartIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
  const last24HoursIso = new Date(
    now.getTime() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const processedCheckoutLogsPromise = fetchProcessedCheckoutLogs(supabase);

  const [
    { data: credits },
    { data: topUpTransactionsRaw },
    { data: creditConsumptionRaw },
    { data: latestWebhook },
    { count: failedWebhooksCount },
    { count: recentWebhooksCount },
    processedCheckoutLogs,
  ] = await Promise.all([
    supabase.from("profiles").select("credit_balance"),
    supabase
      .from("credit_transactions")
      .select(
        `
        id,
        amount,
        payment_status,
        stripe_session_id,
        created_at,
        profiles:user_id (email)
      `,
      )
      .eq("action_type", "top_up")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("credit_transactions")
      .select("action_type, amount")
      .lt("amount", 0)
      .gte("created_at", monthStartIso),
    supabase
      .from("stripe_webhook_logs")
      .select("processed_at")
      .order("processed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("stripe_webhook_logs")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("processed_at", last24HoursIso),
    supabase
      .from("stripe_webhook_logs")
      .select("id", { count: "exact", head: true })
      .gte("processed_at", last24HoursIso),
    processedCheckoutLogsPromise,
  ]);

  const totalCredits = (credits || []).reduce(
    (sum, profile) => sum + (profile.credit_balance || 0),
    0,
  );
  const revenueTotals = calculateStripeRevenueTotals(processedCheckoutLogs, now);
  const amountBySessionId = buildCheckoutAmountBySessionMap(processedCheckoutLogs);

  const topUpTransactions = ((topUpTransactionsRaw as TopUpRow[] | null) || []).map(
    (transaction): TopUpTransactionInput => ({
      id: transaction.id,
      userEmail: getProfileEmail(transaction.profiles),
      credits: transaction.amount || 0,
      paymentStatus: transaction.payment_status,
      stripeSessionId: transaction.stripe_session_id,
      createdAt: transaction.created_at,
    }),
  );

  const recentTransactions = summarizeTopUpTransactions(
    topUpTransactions,
    amountBySessionId,
  );

  const creditConsumption = summarizeCreditConsumption(
    ((creditConsumptionRaw as { action_type: string | null; amount: number | null }[] | null) ||
      []).map((row) => ({
      actionType: row.action_type,
      amount: row.amount,
    })),
  );

  const failedEventsLast24h = failedWebhooksCount || 0;
  const recentEvents = recentWebhooksCount || 0;
  const stripeStatus: RevenueStripeStatus = {
    webhookStatus:
      recentEvents === 0 && !latestWebhook?.processed_at
        ? "idle"
        : failedEventsLast24h > 0
          ? "degraded"
          : "healthy",
    lastProcessedAt: latestWebhook?.processed_at || null,
    failedEventsLast24h,
    recentEvents,
  };

  return {
    today: revenueTotals.today,
    thisWeek: revenueTotals.thisWeek,
    thisMonth: revenueTotals.thisMonth,
    totalCredits,
    stripeRevenue: revenueTotals.total,
    recentTransactions,
    creditConsumption,
    stripeStatus,
  };
}

export async function getPendingAds(): Promise<PendingAd[]> {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("ads")
    .select(
      `
      id,
      price,
      photos_json,
      created_at,
      brands:brand_id (name),
      models:model_id (name),
      profiles:seller_id (id, email)
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data) return [];

  return data.map((ad: Record<string, unknown>) => {
    const brands = ad.brands as { name?: string } | null;
    const models = ad.models as { name?: string } | null;
    const profiles = ad.profiles as { id?: string; email?: string } | null;
    const photos = ad.photos_json as string[] | null;

    return {
      id: ad.id as string,
      brand: brands?.name || "Neznáma",
      model: models?.name || "Model",
      seller: profiles?.email || "N/A",
      sellerId: profiles?.id || "",
      photos: photos?.length || 0,
      price: (ad.price as number) || 0,
      created_at: ad.created_at as string,
      flags: [],
    };
  });
}

export async function approveAd(adId: string) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });

  const { error } = await supabase
    .from("ads")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", adId);

  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "approve_ad",
    target_type: "ad",
    target_id: adId,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function rejectAd(adId: string, reason?: string) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });

  const { error } = await supabase
    .from("ads")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", adId);

  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "reject_ad",
    target_type: "ad",
    target_id: adId,
    details: { reason },
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function getAdminUsers(
  search?: string,
  limit = 100,
): Promise<AdminUser[]> {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, credit_balance, created_at, is_dealer")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data: profiles } = await query;

  if (!profiles) return [];

  const { data: admins } = await supabase.from("site_admins").select("user_id");
  const adminIds = new Set(admins?.map((a) => a.user_id) || []);

  const { data: adData } = await supabase
    .from("ads")
    .select("seller_id")
    .in(
      "seller_id",
      profiles.map((p) => p.id),
    );

  const adCountMap = new Map<string, number>();
  adData?.forEach((ad) => {
    adCountMap.set(ad.seller_id, (adCountMap.get(ad.seller_id) || 0) + 1);
  });

  return profiles.map(
    (profile) =>
      ({
        ...profile,
        ad_count: adCountMap.get(profile.id) || 0,
        is_banned: false,
        role: adminIds.has(profile.id)
          ? "admin"
          : profile.is_dealer
            ? "dealer"
            : "user",
      }) as AdminUser,
  );
}

export async function banUser(userId: string, reason?: string) {
  const { userId: adminId, supabase } = await requireAdmin({ requireMfa: true });

  await supabase.from("admin_audit_logs").insert({
    admin_id: adminId,
    action: "ban_user",
    target_type: "user",
    target_id: userId,
    details: { reason },
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateUserCredits(
  userId: string,
  newCredits: number,
  previousCredits: number,
) {
  const { userId: adminId, supabase } = await requireAdmin({ requireMfa: true });

  const { error } = await supabase
    .from("profiles")
    .update({ credit_balance: newCredits })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_logs").insert({
    admin_id: adminId,
    action: "update_user_credits",
    target_type: "user",
    target_id: userId,
    details: { previousCredits, newCredits },
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function getSystemLogs(
  level?: string,
  category?: string,
  limit = 100,
): Promise<SystemLog[]> {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (level) query = query.eq("level", level);
  if (category) query = query.eq("category", category);

  const { data } = await query;
  return (data as SystemLog[]) || [];
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as AuditLog[]) || [];
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("feature_flags")
    .select("*")
    .order("key", { ascending: true });

  return (data as FeatureFlag[]) || [];
}

export async function toggleFeatureFlag(flagId: string, enabled: boolean) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });

  const { data: flag } = await supabase
    .from("feature_flags")
    .select("key")
    .eq("id", flagId)
    .single();

  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", flagId);

  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "update_site_settings",
    target_type: "setting",
    target_id: flag?.key || flagId,
    details: { enabled },
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function createFeatureFlag(key: string, description: string) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });

  const { error } = await supabase.from("feature_flags").insert({
    key,
    description,
    enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "update_site_settings",
    target_type: "setting",
    target_id: key,
    details: { action: "created" },
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function getSiteSettings(): Promise<SiteSetting[]> {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("site_settings")
    .select("key, value, updated_at")
    .order("key", { ascending: true });

  return (data as SiteSetting[]) || [];
}

export async function updateSiteSetting(key: string, value: string) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });

  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();

  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "update_site_settings",
    target_type: "setting",
    target_id: key,
    details: { previousValue: existing?.value, newValue: value },
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function getRecentActivity() {
  const { supabase } = await requireAdmin();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const [{ data: recentAds }, { data: recentUsers }] = await Promise.all([
    supabase
      .from("ads")
      .select("id, created_at, status, profiles:seller_id (email)")
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, email, created_at")
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    recentAds: recentAds || [],
    recentUsers: recentUsers || [],
  };
}

export async function getPerformanceSloDashboard(
  windowHours = 24,
): Promise<PerformanceSloDashboard> {
  const { supabase } = await requireAdmin();
  const safeWindowHours = Number.isFinite(windowHours)
    ? Math.max(1, Math.min(Math.round(windowHours), 168))
    : 24;

  const since = new Date(Date.now() - safeWindowHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("system_logs")
    .select("metadata, created_at")
    .eq("message", "web_vital")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(error.message);
  }

  const samples = ((data as { metadata: Record<string, unknown> | null; created_at: string }[] | null) || [])
    .map((row) => toWebVitalSample(row.metadata, row.created_at))
    .filter((sample): sample is NonNullable<typeof sample> => !!sample);

  const snapshot = buildSloDashboardSnapshot(samples);

  return {
    windowHours: safeWindowHours,
    totalSamples: snapshot.totalSamples,
    routeCount: snapshot.routeCount,
    lastIngestedAt: samples[0]?.timestamp || null,
    rows: snapshot.rows
      .sort((a, b) => {
        if (a.sampleCount === b.sampleCount) {
          if (a.route === b.route) return a.metricName.localeCompare(b.metricName);
          return a.route.localeCompare(b.route);
        }
        return b.sampleCount - a.sampleCount;
      })
      .slice(0, 60),
  };
}
