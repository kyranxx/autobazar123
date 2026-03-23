"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
import {
  renderInvoiceEmail,
  renderPasswordResetEmail,
  renderPaymentConfirmationEmail,
  renderPaymentFailureEmail,
  renderRegistrationConfirmationEmail,
} from "@/lib/email/react-email-templates";
import {
  enqueueModerationDecisionEmailJob,
  scheduleQueuedEmailDrain,
} from "@/lib/email/jobs";
import { recordServerAnalyticsEvent } from "@/lib/analytics/server";
import { ADS_CACHE_TAGS } from "@/lib/cache/tags";
import { COMPANY_INFO } from "@/config/company";
import { getBaseUrl } from "@/lib/site-url";
import { revalidatePath, revalidateTag } from "next/cache";

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
  sellerPhone: string | null;
  sellerCreatedAt: string | null;
  photos: number;
  price: number;
  created_at: string;
  status: "pending" | "active";
  reviewType: "submission" | "reported" | "submission_and_reported";
  moderationSubmittedAt: string | null;
  rejectionNote: string | null;
  reportCount: number;
  latestReportAt: string | null;
  reports: Array<{
    id: string;
    category: string;
    details: string;
    created_at: string;
    reporterId: string | null;
  }>;
  flags: string[];
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  credit_balance: number;
  created_at: string;
  is_dealer: boolean;
  dealer_id: string | null;
  dealer_is_verified: boolean;
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

export interface DealerVerificationRequest {
  id: string;
  dealer_id: string;
  dealer_name: string;
  dealer_slug: string;
  owner_email: string;
  request_note: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface AdminEmailDelivery {
  id: string;
  email_type: string;
  template_key: string;
  recipient_email: string;
  subject: string;
  status: "sent" | "failed";
  provider: string;
  provider_message_id: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  html_preview: string | null;
  created_at: string;
}

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "spam";
  created_at: string;
  updated_at: string;
}

export interface AdminEmailTemplateExample {
  id: string;
  name: string;
  templateKey: string;
  subject: string;
  html: string;
}

export interface AdminNotification {
  id: string;
  kind: string;
  level: "info" | "warn" | "error" | "critical";
  category: string;
  source: "fallback" | "quality_gate" | "system";
  title: string;
  description: string;
  createdAt: string;
  requestId: string | null;
}

type AdminEmailDeliveryNotificationRow = {
  id: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: "sent" | "failed";
  error_message: string | null;
  created_at: string;
};

type AdminPaymentNotificationRow = {
  id: string;
  transaction_id: string;
  notification_type: string;
  user_email: string;
  email_status: string;
  error_message: string | null;
  created_at: string;
};

export interface PerformanceSloDashboard {
  windowHours: number;
  totalSamples: number;
  routeCount: number;
  lastIngestedAt: string | null;
  rows: SloMetricRow[];
}

export interface FounderDashboardSummary {
  windowDays: number;
  paidAdsPosted: number;
  previousPaidAdsPosted: number;
  paidFeaturePurchases: number;
  previousPaidFeaturePurchases: number;
  revenueFromAdsAndFeatures: number;
  previousRevenueFromAdsAndFeatures: number;
  listingViews: number;
  previousListingViews: number;
  soldListings: number;
  previousSoldListings: number;
  medianDaysToSale: number | null;
  previousMedianDaysToSale: number | null;
  repeatSellers: number;
  previousRepeatSellers: number;
  repeatPayingSellers: number;
  previousRepeatPayingSellers: number;
  dailySeries: Array<{
    date: string;
    paidAdsPosted: number;
    paidFeaturePurchases: number;
    revenueFromAdsAndFeatures: number;
    listingViews: number;
    soldListings: number;
  }>;
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

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function getEventNameFromSystemLogMetadata(metadata: unknown): string | null {
  const record = asRecord(metadata);
  const eventName = record?.eventName;
  return typeof eventName === "string" ? eventName : null;
}

function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function startOfRollingWindow(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function formatUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseUtcDateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return formatUtcDateKey(new Date(parsed));
}

function revalidateAdSurfaces() {
  for (const tag of ADS_CACHE_TAGS) {
    revalidateTag(tag, "max");
  }
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
      .from("dealers")
      .select("id", { count: "exact", head: true }),
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

export async function getFounderDashboardSummary(days = 30): Promise<FounderDashboardSummary> {
  const { supabase } = await requireAdmin();
  const now = new Date();
  const windowDays = [7, 30, 90].includes(days) ? days : 30;
  const currentStart = startOfRollingWindow(now, windowDays);
  const previousStart = startOfRollingWindow(currentStart, windowDays);
  const currentStartIso = currentStart.toISOString();
  const previousStartIso = previousStart.toISOString();

  const [
    { data: monthlyTransactions, error: transactionsError },
    { data: monthlySoldAds, error: soldError },
    { data: sellerAds, error: sellerAdsError },
    { data: allSpendingRows, error: spendingError },
    { data: analyticsEventLogs, error: analyticsLogsError },
  ] = await Promise.all([
    supabase
      .from("credit_transactions")
      .select("action_type, amount, user_id, created_at")
      .gte("created_at", previousStartIso),
    supabase
      .from("ads")
      .select("published_at, sold_at")
      .not("sold_at", "is", null)
      .gte("sold_at", previousStartIso),
    supabase
      .from("ads")
      .select("seller_id, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("credit_transactions")
      .select("user_id, amount, created_at")
      .lt("amount", 0),
    supabase
      .from("system_logs")
      .select("metadata, created_at")
      .eq("message", "analytics_event")
      .gte("created_at", previousStartIso),
  ]);

  if (transactionsError) throw new Error(transactionsError.message);
  if (soldError) throw new Error(soldError.message);
  if (sellerAdsError) throw new Error(sellerAdsError.message);
  if (spendingError) throw new Error(spendingError.message);
  if (analyticsLogsError) throw new Error(analyticsLogsError.message);

  const monetizedActionTypes = new Set([
    "publish",
    "boost",
    "top_ad",
    "highlight",
    "dealer_bulk_top",
    "dealer_bulk_highlight",
    "dealer_bulk_bump",
    "dealer_bulk_prolong",
  ]);
  const paidFeatureActionTypes = new Set([
    "boost",
    "top_ad",
    "highlight",
    "dealer_bulk_top",
    "dealer_bulk_highlight",
  ]);

  const monthlyRows =
    (monthlyTransactions as {
      action_type?: string | null;
      amount?: number | null;
      user_id?: string | null;
      created_at?: string | null;
    }[] | null) || [];
  const soldRows =
    (monthlySoldAds as {
      published_at?: string | null;
      sold_at?: string | null;
    }[] | null) || [];
  const sellerAdRows =
    (sellerAds as { seller_id?: string | null; created_at?: string | null }[] | null) || [];
  const allSpending =
    (allSpendingRows as {
      user_id?: string | null;
      amount?: number | null;
      created_at?: string | null;
    }[] | null) || [];
  const analyticsLogs =
    (analyticsEventLogs as { metadata?: unknown; created_at?: string | null }[] | null) || [];

  const isCurrentWindow = (iso: string | null | undefined) =>
    Boolean(iso && iso >= currentStartIso);
  const isPreviousWindow = (iso: string | null | undefined) =>
    Boolean(iso && iso >= previousStartIso && iso < currentStartIso);

  const paidAdsPosted = monthlyRows.filter(
    (row) => row.action_type === "publish" && isCurrentWindow(row.created_at),
  ).length;
  const previousPaidAdsPosted = monthlyRows.filter(
    (row) => row.action_type === "publish" && isPreviousWindow(row.created_at),
  ).length;

  const paidFeaturePurchases = monthlyRows.filter(
    (row) => paidFeatureActionTypes.has(row.action_type || "") && isCurrentWindow(row.created_at),
  ).length;
  const previousPaidFeaturePurchases = monthlyRows.filter(
    (row) =>
      paidFeatureActionTypes.has(row.action_type || "") && isPreviousWindow(row.created_at),
  ).length;

  const revenueFromAdsAndFeatures = monthlyRows
    .filter((row) => monetizedActionTypes.has(row.action_type || "") && isCurrentWindow(row.created_at))
    .reduce((sum, row) => sum + Math.abs(Math.trunc(row.amount || 0)), 0);
  const previousRevenueFromAdsAndFeatures = monthlyRows
    .filter((row) => monetizedActionTypes.has(row.action_type || "") && isPreviousWindow(row.created_at))
    .reduce((sum, row) => sum + Math.abs(Math.trunc(row.amount || 0)), 0);

  const listingViews = analyticsLogs.filter(
    (row) =>
      getEventNameFromSystemLogMetadata(row.metadata) === "listing_viewed" &&
      isCurrentWindow(row.created_at),
  ).length;
  const previousListingViews = analyticsLogs.filter(
    (row) =>
      getEventNameFromSystemLogMetadata(row.metadata) === "listing_viewed" &&
      isPreviousWindow(row.created_at),
  ).length;

  const soldListings = soldRows.filter((row) => isCurrentWindow(row.sold_at)).length;
  const previousSoldListings = soldRows.filter((row) =>
    isPreviousWindow(row.sold_at),
  ).length;

  const currentDaysToSaleValues = soldRows.flatMap((row) => {
    if (!row.published_at || !row.sold_at) return [];
    const publishedMs = Date.parse(row.published_at);
    const confirmedMs = Date.parse(row.sold_at);
    if (
      Number.isNaN(publishedMs) ||
      Number.isNaN(confirmedMs) ||
      confirmedMs < publishedMs ||
      !isCurrentWindow(row.sold_at)
    ) {
      return [];
    }
    return [(confirmedMs - publishedMs) / (1000 * 60 * 60 * 24)];
  });
  const previousDaysToSaleValues = soldRows.flatMap((row) => {
    if (!row.published_at || !row.sold_at) return [];
    const publishedMs = Date.parse(row.published_at);
    const confirmedMs = Date.parse(row.sold_at);
    if (
      Number.isNaN(publishedMs) ||
      Number.isNaN(confirmedMs) ||
      confirmedMs < publishedMs ||
      !isPreviousWindow(row.sold_at)
    ) {
      return [];
    }
    return [(confirmedMs - publishedMs) / (1000 * 60 * 60 * 24)];
  });

  const currentWindowSellers = new Set(
    sellerAdRows
      .filter((row) => row.created_at && row.created_at >= currentStartIso && row.seller_id)
      .map((row) => row.seller_id as string),
  );
  const priorSellers = new Set(
    sellerAdRows
      .filter((row) => row.created_at && row.created_at < currentStartIso && row.seller_id)
      .map((row) => row.seller_id as string),
  );
  const repeatSellers = Array.from(currentWindowSellers).filter((sellerId) =>
    priorSellers.has(sellerId),
  ).length;

  const previousWindowSellers = new Set(
    sellerAdRows
      .filter(
        (row) =>
          row.created_at &&
          row.created_at >= previousStartIso &&
          row.created_at < currentStartIso &&
          row.seller_id,
      )
      .map((row) => row.seller_id as string),
  );
  const olderSellers = new Set(
    sellerAdRows
      .filter((row) => row.created_at && row.created_at < previousStartIso && row.seller_id)
      .map((row) => row.seller_id as string),
  );
  const previousRepeatSellers = Array.from(previousWindowSellers).filter((sellerId) =>
    olderSellers.has(sellerId),
  ).length;

  const currentWindowPayers = new Set(
    allSpending
      .filter((row) => row.created_at && row.created_at >= currentStartIso && row.user_id)
      .map((row) => row.user_id as string),
  );
  const priorPayers = new Set(
    allSpending
      .filter((row) => row.created_at && row.created_at < currentStartIso && row.user_id)
      .map((row) => row.user_id as string),
  );
  const repeatPayingSellers = Array.from(currentWindowPayers).filter((userId) =>
    priorPayers.has(userId),
  ).length;

  const previousWindowPayers = new Set(
    allSpending
      .filter(
        (row) =>
          row.created_at &&
          row.created_at >= previousStartIso &&
          row.created_at < currentStartIso &&
          row.user_id,
      )
      .map((row) => row.user_id as string),
  );
  const olderPayers = new Set(
    allSpending
      .filter((row) => row.created_at && row.created_at < previousStartIso && row.user_id)
      .map((row) => row.user_id as string),
  );
  const previousRepeatPayingSellers = Array.from(previousWindowPayers).filter((userId) =>
    olderPayers.has(userId),
  ).length;

  const dailySeriesMap = new Map<
    string,
    {
      date: string;
      paidAdsPosted: number;
      paidFeaturePurchases: number;
      revenueFromAdsAndFeatures: number;
      listingViews: number;
      soldListings: number;
    }
  >();

  for (let index = windowDays - 1; index >= 0; index -= 1) {
    const day = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
    const dateKey = formatUtcDateKey(day);
    dailySeriesMap.set(dateKey, {
      date: dateKey,
      paidAdsPosted: 0,
      paidFeaturePurchases: 0,
      revenueFromAdsAndFeatures: 0,
      listingViews: 0,
      soldListings: 0,
    });
  }

  for (const row of monthlyRows) {
    if (!isCurrentWindow(row.created_at)) continue;
    const dateKey = parseUtcDateKey(row.created_at);
    if (!dateKey) continue;
    const current = dailySeriesMap.get(dateKey);
    if (!current) continue;

    if (row.action_type === "publish") {
      current.paidAdsPosted += 1;
    }

    if (paidFeatureActionTypes.has(row.action_type || "")) {
      current.paidFeaturePurchases += 1;
    }

    if (monetizedActionTypes.has(row.action_type || "")) {
      current.revenueFromAdsAndFeatures += Math.abs(Math.trunc(row.amount || 0));
    }
  }

  for (const row of analyticsLogs) {
    if (!isCurrentWindow(row.created_at)) continue;
    if (getEventNameFromSystemLogMetadata(row.metadata) !== "listing_viewed") continue;
    const dateKey = parseUtcDateKey(row.created_at);
    if (!dateKey) continue;
    const current = dailySeriesMap.get(dateKey);
    if (!current) continue;
    current.listingViews += 1;
  }

  for (const row of soldRows) {
    if (!isCurrentWindow(row.sold_at)) continue;
    const dateKey = parseUtcDateKey(row.sold_at);
    if (!dateKey) continue;
    const current = dailySeriesMap.get(dateKey);
    if (!current) continue;
    current.soldListings += 1;
  }

  return {
    windowDays,
    paidAdsPosted,
    previousPaidAdsPosted,
    paidFeaturePurchases,
    previousPaidFeaturePurchases,
    revenueFromAdsAndFeatures,
    previousRevenueFromAdsAndFeatures,
    listingViews,
    previousListingViews,
    soldListings,
    previousSoldListings,
    medianDaysToSale: calculateMedian(currentDaysToSaleValues),
    previousMedianDaysToSale: calculateMedian(previousDaysToSaleValues),
    repeatSellers,
    previousRepeatSellers,
    repeatPayingSellers,
    previousRepeatPayingSellers,
    dailySeries: Array.from(dailySeriesMap.values()),
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
  const [{ data: pendingAdsData, error: pendingAdsError }, { data: openReportsData, error: openReportsError }] =
    await Promise.all([
      supabase
        .from("ads")
        .select(
          `
          id,
          status,
          price_eur,
          photos_json,
          created_at,
          description,
          moderation_submitted_at,
          moderation_rejection_note,
          brands:brand_id (name),
          models:model_id (name),
          profiles:seller_id (id, email, phone, created_at)
        `,
        )
        .eq("status", "pending")
        .order("moderation_submitted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("listing_reports")
        .select("id, ad_id, category, details, created_at, reporter_id")
        .in("status", ["open", "reviewing"])
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

  if (pendingAdsError) {
    throw new Error(pendingAdsError.message);
  }

  if (openReportsError) {
    throw new Error(openReportsError.message);
  }

  const pendingRows = (pendingAdsData as Record<string, unknown>[] | null) || [];
  const openReports =
    ((openReportsData as {
      id: string;
      ad_id: string;
      category: string;
      details: string;
      created_at: string;
      reporter_id: string | null;
    }[] | null) || []);

  const reportMap = new Map<string, typeof openReports>();
  for (const report of openReports) {
    const reports = reportMap.get(report.ad_id) || [];
    reports.push(report);
    reportMap.set(report.ad_id, reports);
  }

  const reportOnlyAdIds = [...new Set(openReports.map((report) => report.ad_id))].filter(
    (adId) => !pendingRows.some((ad) => ad.id === adId),
  );

  let reportedAdsRows: Record<string, unknown>[] = [];
  if (reportOnlyAdIds.length > 0) {
    const { data: reportedAdsData, error: reportedAdsError } = await supabase
      .from("ads")
      .select(
        `
        id,
        status,
        price_eur,
        photos_json,
        created_at,
        description,
        moderation_submitted_at,
        moderation_rejection_note,
        brands:brand_id (name),
        models:model_id (name),
        profiles:seller_id (id, email, phone, created_at)
      `,
      )
      .in("id", reportOnlyAdIds)
      .order("created_at", { ascending: false });

    if (reportedAdsError) {
      throw new Error(reportedAdsError.message);
    }

    reportedAdsRows = (reportedAdsData as Record<string, unknown>[] | null) || [];
  }

  const combinedRows = [...pendingRows, ...reportedAdsRows];
  if (combinedRows.length === 0) return [];

  const sellerIds = [...new Set(
    combinedRows
      .map((ad) => {
        const profile = ad.profiles as { id?: string } | null;
        return profile?.id || null;
      })
      .filter((value): value is string => Boolean(value)),
  )];

  const { data: sellerAdsData, error: sellerAdsError } = await supabase
    .from("ads")
    .select("seller_id, status")
    .in("seller_id", sellerIds);

  if (sellerAdsError) {
    throw new Error(sellerAdsError.message);
  }

  const sellerStats = new Map<
    string,
    { active: number; pending: number; rejected: number; total: number }
  >();

  for (const row of ((sellerAdsData as { seller_id: string; status: string }[] | null) || [])) {
    const current = sellerStats.get(row.seller_id) || {
      active: 0,
      pending: 0,
      rejected: 0,
      total: 0,
    };
    current.total += 1;
    if (row.status === "active") current.active += 1;
    if (row.status === "pending") current.pending += 1;
    if (row.status === "rejected") current.rejected += 1;
    sellerStats.set(row.seller_id, current);
  }

  return combinedRows.map((ad) => {
    const brands = ad.brands as { name?: string } | null;
    const models = ad.models as { name?: string } | null;
    const profile = ad.profiles as {
      id?: string;
      email?: string;
      phone?: string | null;
      created_at?: string | null;
    } | null;
    const photos = ad.photos_json as string[] | null;
    const sellerId = profile?.id || "";
    const sellerSummary = sellerStats.get(sellerId) || {
      active: 0,
      pending: 0,
      rejected: 0,
      total: 0,
    };
    const reports = reportMap.get((ad.id as string) || "") || [];
    const reportCount = reports.length;
    const reviewType =
      (ad.status as string) === "pending"
        ? reportCount > 0
          ? "submission_and_reported"
          : "submission"
        : "reported";

    const sellerCreatedAt = profile?.created_at || null;
    const sellerAgeDays = sellerCreatedAt
      ? Math.floor(
          (Date.now() - new Date(sellerCreatedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const flags: string[] = [];
    if (reportCount > 0) flags.push("reported");
    if (reportCount >= 3) flags.push("multiple_reports");
    if (sellerAgeDays !== null && sellerAgeDays <= 7) flags.push("new_seller");
    if (((ad.price_eur as number) || 0) >= 40000) flags.push("high_value");
    if ((photos?.length || 0) < 2) flags.push("low_photos");
    if (!profile?.phone) flags.push("no_phone");
    if (sellerSummary.rejected >= 2) flags.push("seller_rejections");
    if (typeof ad.description === "string" && ad.description.length > 1600) {
      flags.push("long_description");
    }
    if (
      typeof ad.description === "string" &&
      /(whatsapp|telegram|western union|wire transfer|crypto|gift card|prepayment|deposit in advance)/i.test(
        ad.description,
      )
    ) {
      flags.push("suspicious_terms");
    }
    if (
      typeof ad.description === "string" &&
      /(https?:\/\/|www\.|@gmail\.|@hotmail\.|@outlook\.)/i.test(ad.description)
    ) {
      flags.push("external_contact");
    }
    if (typeof ad.description === "string" && /([!?.,])\1{4,}/.test(ad.description)) {
      flags.push("excessive_characters");
    }

    return {
      id: ad.id as string,
      brand: brands?.name || "Neznáma",
      model: models?.name || "Model",
      seller: profile?.email || "N/A",
      sellerId,
      sellerPhone: profile?.phone || null,
      sellerCreatedAt,
      photos: photos?.length || 0,
      price: (ad.price_eur as number) || 0,
      created_at: ad.created_at as string,
      status: ((ad.status as string) === "pending" ? "pending" : "active") as
        | "pending"
        | "active",
      reviewType,
      moderationSubmittedAt: (ad.moderation_submitted_at as string | null) || null,
      rejectionNote: (ad.moderation_rejection_note as string | null) || null,
      reportCount,
      latestReportAt: reports[0]?.created_at || null,
      reports: reports.map((report) => ({
        id: report.id,
        category: report.category,
        details: report.details,
        created_at: report.created_at,
        reporterId: report.reporter_id,
      })),
      flags,
    };
  });
}

export async function approveAd(adId: string) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });
  const nowIso = new Date().toISOString();
  const { data: currentAd, error: currentAdError } = await supabase
    .from("ads")
    .select("status, published_at, expires_at, brand, model, seller_id, dealer_id")
    .eq("id", adId)
    .single();

  if (currentAdError || !currentAd) {
    throw new Error(currentAdError?.message || "Ad not found");
  }

  const shouldActivate = currentAd.status !== "active";
  const expiresAtIso = shouldActivate
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : currentAd.expires_at;

  const { error } = await supabase
    .from("ads")
    .update({
      status: "active",
      published_at: shouldActivate ? nowIso : currentAd.published_at,
      expires_at: expiresAtIso,
      moderation_reviewed_at: nowIso,
      moderation_reviewed_by: userId,
      moderation_rejection_note: null,
      updated_at: nowIso,
    })
    .eq("id", adId);

  if (error) throw new Error(error.message);

  const { error: reportsError } = await supabase
    .from("listing_reports")
    .update({
      status: "dismissed",
      reviewed_at: nowIso,
      reviewed_by: userId,
      resolution_note: "Approved during moderation review.",
      updated_at: nowIso,
    })
    .eq("ad_id", adId)
    .in("status", ["open", "reviewing"]);

  if (reportsError) {
    throw new Error(reportsError.message);
  }

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("email, full_name, notify_moderation_email")
    .eq("id", currentAd.seller_id)
    .maybeSingle();

  if (sellerProfile?.email && sellerProfile.notify_moderation_email !== false) {
    const emailJob = await enqueueModerationDecisionEmailJob({
      to: sellerProfile.email,
      fullName: sellerProfile.full_name,
      adTitle: `${currentAd.brand} ${currentAd.model}`.trim(),
      decision: "approved",
      dashboardUrl: `${getBaseUrl()}/moj-ucet?tab=ads`,
    });

    if (!emailJob.ok) {
      console.error("Failed to queue moderation approval email:", emailJob.error);
    } else {
      scheduleQueuedEmailDrain({
        batchSize: 5,
        jobTypes: ["moderation_decision"],
      });
    }
  }

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "approve_ad",
    target_type: "ad",
    target_id: adId,
    created_at: new Date().toISOString(),
  });

  await recordServerAnalyticsEvent("listing_approved", {
    adId,
    approvalMethod: "admin_moderation",
    sellerType: currentAd.dealer_id ? "dealer" : "private",
  });

  revalidateAdSurfaces();
  revalidatePath("/admin");
  return { success: true };
}

export async function rejectAd(adId: string, reason?: string) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });
  const nowIso = new Date().toISOString();
  const { data: currentAd, error: currentAdError } = await supabase
    .from("ads")
    .select("brand, model, seller_id, dealer_id")
    .eq("id", adId)
    .single();

  if (currentAdError || !currentAd) {
    throw new Error(currentAdError?.message || "Ad not found");
  }

  const { error } = await supabase
    .from("ads")
    .update({
      status: "rejected",
      published_at: null,
      expires_at: null,
      moderation_reviewed_at: nowIso,
      moderation_reviewed_by: userId,
      moderation_rejection_note: reason?.trim() || null,
      updated_at: nowIso,
    })
    .eq("id", adId);

  if (error) throw new Error(error.message);

  const { error: reportsError } = await supabase
    .from("listing_reports")
    .update({
      status: "resolved",
      reviewed_at: nowIso,
      reviewed_by: userId,
      resolution_note: reason?.trim() || "Rejected during moderation review.",
      updated_at: nowIso,
    })
    .eq("ad_id", adId)
    .in("status", ["open", "reviewing"]);

  if (reportsError) throw new Error(reportsError.message);

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("email, full_name, notify_moderation_email")
    .eq("id", currentAd.seller_id)
    .maybeSingle();

  if (sellerProfile?.email && sellerProfile.notify_moderation_email !== false) {
    const emailJob = await enqueueModerationDecisionEmailJob({
      to: sellerProfile.email,
      fullName: sellerProfile.full_name,
      adTitle: `${currentAd.brand} ${currentAd.model}`.trim(),
      decision: "rejected",
      reviewNote: reason?.trim() || null,
      dashboardUrl: `${getBaseUrl()}/moj-ucet?tab=ads`,
    });

    if (!emailJob.ok) {
      console.error("Failed to queue moderation rejection email:", emailJob.error);
    } else {
      scheduleQueuedEmailDrain({
        batchSize: 5,
        jobTypes: ["moderation_decision"],
      });
    }
  }

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "reject_ad",
    target_type: "ad",
    target_id: adId,
    details: { reason },
    created_at: new Date().toISOString(),
  });

  await recordServerAnalyticsEvent("listing_removed_by_moderation", {
    adId,
    removalReason: "admin_rejection",
    sellerType: currentAd.dealer_id ? "dealer" : "private",
  });

  revalidateAdSurfaces();
  revalidatePath("/admin");
  return { success: true };
}

export async function dismissListingReports(adId: string, note?: string) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("listing_reports")
    .update({
      status: "dismissed",
      reviewed_at: nowIso,
      reviewed_by: userId,
      resolution_note: note?.trim() || "Reports dismissed after moderation review.",
      updated_at: nowIso,
    })
    .eq("ad_id", adId)
    .in("status", ["open", "reviewing"]);

  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "approve_ad",
    target_type: "ad",
    target_id: adId,
    details: { reportDisposition: "dismissed", note: note?.trim() || null },
    created_at: nowIso,
  });

  revalidateAdSurfaces();
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
    .select("id, email, full_name, credit_balance, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data: profiles, error: profilesError } = await query;
  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if (!profiles || profiles.length === 0) return [];

  const profileIds = profiles.map((profile) => profile.id);
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin role lookup");
  }

  const { data: admins, error: adminsError } = await adminClient
    .from("site_admins")
    .select("user_id");
  if (adminsError) {
    throw new Error(adminsError.message);
  }
  const adminIds = new Set(admins?.map((a) => a.user_id) || []);

  const { data: dealerRows, error: dealerRowsError } = await supabase
    .from("dealers")
    .select("id, owner_id, is_verified")
    .in("owner_id", profileIds);
  if (dealerRowsError) {
    throw new Error(dealerRowsError.message);
  }
  const dealerOwnerIds = new Set(dealerRows?.map((dealer) => dealer.owner_id) || []);
  const dealerMetaByOwnerId = new Map(
    (dealerRows || []).map((dealer) => [dealer.owner_id, dealer]),
  );

  const { data: adData, error: adDataError } = await supabase
    .from("ads")
    .select("seller_id")
    .in("seller_id", profileIds);
  if (adDataError) {
    throw new Error(adDataError.message);
  }

  const adCountMap = new Map<string, number>();
  adData?.forEach((ad) => {
    adCountMap.set(ad.seller_id, (adCountMap.get(ad.seller_id) || 0) + 1);
  });

  return profiles.map(
    (profile) => {
      const isDealer = dealerOwnerIds.has(profile.id);

      return {
        ...profile,
        is_dealer: isDealer,
        dealer_id: dealerMetaByOwnerId.get(profile.id)?.id || null,
        dealer_is_verified: Boolean(dealerMetaByOwnerId.get(profile.id)?.is_verified),
        ad_count: adCountMap.get(profile.id) || 0,
        is_banned: false,
        role: adminIds.has(profile.id)
          ? "admin"
          : isDealer
            ? "dealer"
            : "user",
      } as AdminUser;
    },
  );
}

export async function setDealerVerification(
  dealerId: string,
  isVerified: boolean,
) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });

  const { error } = await supabase
    .from("dealers")
    .update({ is_verified: isVerified })
    .eq("id", dealerId);

  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: isVerified ? "verify_dealer" : "unverify_dealer",
    target_type: "dealer",
    target_id: dealerId,
    details: { isVerified },
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return { success: true };
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

  const { data, error } = await supabase
    .from("feature_flags")
    .select("*")
    .order("key", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }

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

export async function createFeatureFlag(
  key: string,
  description: string,
): Promise<FeatureFlag> {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });

  const createdAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("feature_flags")
    .insert({
      key,
      description,
      enabled: false,
      created_at: createdAt,
      updated_at: createdAt,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to create feature flag");

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "update_site_settings",
    target_type: "setting",
    target_id: key,
    details: { action: "created" },
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return data as FeatureFlag;
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

export async function getDealerVerificationRequests(): Promise<DealerVerificationRequest[]> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("dealer_verification_requests")
    .select(
      `
        id,
        dealer_id,
        request_note,
        status,
        admin_note,
        created_at,
        reviewed_at,
        dealers:dealer_id (name, slug, owner_id),
        profiles:requester_user_id (email)
      `,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return ((data as Array<Record<string, unknown>> | null) || []).map((row) => {
    const dealer = row.dealers as { name?: string; slug?: string } | null;
    const profile = row.profiles as { email?: string } | null;

    return {
      id: row.id as string,
      dealer_id: row.dealer_id as string,
      dealer_name: dealer?.name || "Dealer",
      dealer_slug: dealer?.slug || "",
      owner_email: profile?.email || "unknown",
      request_note: (row.request_note as string) || "",
      status: (row.status as DealerVerificationRequest["status"]) || "pending",
      admin_note: (row.admin_note as string | null) || null,
      created_at: row.created_at as string,
      reviewed_at: (row.reviewed_at as string | null) || null,
    };
  });
}

export async function reviewDealerVerificationRequest(
  requestId: string,
  dealerId: string,
  decision: "approved" | "rejected",
  adminNote?: string,
) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });
  const nowIso = new Date().toISOString();

  const { error: requestError } = await supabase
    .from("dealer_verification_requests")
    .update({
      status: decision,
      admin_note: adminNote?.trim() || null,
      reviewed_at: nowIso,
      reviewed_by: userId,
    })
    .eq("id", requestId);

  if (requestError) {
    throw new Error(requestError.message);
  }

  if (decision === "approved") {
    const { error: dealerError } = await supabase
      .from("dealers")
      .update({ is_verified: true })
      .eq("id", dealerId);

    if (dealerError) {
      throw new Error(dealerError.message);
    }
  }

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: decision === "approved" ? "verify_dealer" : "unverify_dealer",
    target_type: "dealer",
    target_id: dealerId,
    details: {
      requestId,
      decision,
      adminNote: adminNote?.trim() || null,
    },
    created_at: nowIso,
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

function normalizeNotificationLevel(value: string | null | undefined): AdminNotification["level"] {
  if (value === "info" || value === "warn" || value === "error" || value === "critical") {
    return value;
  }
  return "info";
}

function toMetadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function mapSystemLogToNotification(log: {
  id: string;
  level: string;
  category: string;
  message: string;
  request_id: string | null;
  metadata: unknown;
  created_at: string;
}): AdminNotification {
  const metadata = toMetadataRecord(log.metadata);
  const level = normalizeNotificationLevel(log.level);

  if (log.message === "fallback_activated") {
    const fallbackKey =
      typeof metadata?.fallbackKey === "string" ? metadata.fallbackKey : "unknown";
    const summary =
      typeof metadata?.summary === "string"
        ? metadata.summary
        : "Fallback path activated.";
    return {
      id: log.id,
      kind: log.message,
      level,
      category: log.category,
      source: "fallback",
      title: `Fallback activated: ${fallbackKey}`,
      description: summary,
      createdAt: log.created_at,
      requestId: log.request_id,
    };
  }

  if (log.message === "fallback_threshold_crossed") {
    const fallbackKey =
      typeof metadata?.fallbackKey === "string" ? metadata.fallbackKey : "unknown";
    const observedCount =
      typeof metadata?.observedCount === "number" ? metadata.observedCount : null;
    const thresholdCount =
      typeof metadata?.thresholdCount === "number" ? metadata.thresholdCount : null;
    const windowMinutes =
      typeof metadata?.thresholdWindowMinutes === "number"
        ? metadata.thresholdWindowMinutes
        : null;
    const summary =
      observedCount !== null && thresholdCount !== null && windowMinutes !== null
        ? `${observedCount} activations in ${windowMinutes}m window (threshold ${thresholdCount}).`
        : "Fallback threshold crossed.";

    return {
      id: log.id,
      kind: log.message,
      level,
      category: log.category,
      source: "fallback",
      title: `Fallback threshold crossed: ${fallbackKey}`,
      description: summary,
      createdAt: log.created_at,
      requestId: log.request_id,
    };
  }

  if (log.message === "quality_gate_failure" || log.message === "quality_gate_recovered") {
    const workflowFile =
      typeof metadata?.workflowFile === "string" ? metadata.workflowFile : "unknown";
    const conclusion =
      typeof metadata?.conclusion === "string" ? metadata.conclusion : "unknown";
    const stateLabel =
      log.message === "quality_gate_failure" ? "Quality gate failure" : "Quality gate recovered";

    return {
      id: log.id,
      kind: log.message,
      level,
      category: log.category,
      source: "quality_gate",
      title: `${stateLabel}: ${workflowFile}`,
      description: `Conclusion: ${conclusion}`,
      createdAt: log.created_at,
      requestId: log.request_id,
    };
  }

  return {
    id: log.id,
    kind: log.message,
    level,
    category: log.category,
    source: "system",
    title: log.message,
    description:
      typeof metadata?.errorMessage === "string"
        ? metadata.errorMessage
        : "System notification",
    createdAt: log.created_at,
    requestId: log.request_id,
  };
}

function mapEmailDeliveryToNotification(
  delivery: AdminEmailDeliveryNotificationRow,
): AdminNotification {
  return {
    id: delivery.id,
    kind: `email_delivery_${delivery.status}`,
    level: delivery.status === "failed" ? "error" : "info",
    category: "email",
    source: "system",
    title: `Email delivery failed: ${delivery.email_type}`,
    description: delivery.error_message
      ? `${delivery.subject} -> ${delivery.recipient_email} (${delivery.error_message})`
      : `${delivery.subject} -> ${delivery.recipient_email}`,
    createdAt: delivery.created_at,
    requestId: null,
  };
}

function mapPaymentNotificationToAdminNotification(
  notification: AdminPaymentNotificationRow,
): AdminNotification {
  const isFailure =
    notification.email_status === "failed" || notification.notification_type === "failure";

  return {
    id: notification.id,
    kind: `payment_notification_${notification.notification_type}_${notification.email_status}`,
    level: isFailure ? "error" : "info",
    category: "payment",
    source: "system",
    title: isFailure
      ? `Payment notification failed: ${notification.notification_type}`
      : `Payment notification: ${notification.notification_type}`,
    description: notification.error_message
      ? `${notification.user_email} (${notification.error_message})`
      : notification.user_email,
    createdAt: notification.created_at,
    requestId: notification.transaction_id,
  };
}

export async function getAdminNotifications(limit = 80): Promise<AdminNotification[]> {
  const { supabase } = await requireAdmin();
  const safeLimit = Math.min(Math.max(Math.round(limit), 10), 200);

  const [systemLogsResult, emailFailuresResult, paymentFailuresResult] = await Promise.all([
    supabase
      .from("system_logs")
      .select("id, level, category, message, request_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(safeLimit),
    supabase
      .from("email_deliveries")
      .select("id, email_type, recipient_email, subject, status, error_message, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(Math.min(safeLimit, 40)),
    supabase
      .from("payment_notifications")
      .select("id, transaction_id, notification_type, user_email, email_status, error_message, created_at")
      .or("email_status.eq.failed,notification_type.eq.failure")
      .order("created_at", { ascending: false })
      .limit(Math.min(safeLimit, 40)),
  ]);

  if (systemLogsResult.error) {
    throw new Error(systemLogsResult.error.message);
  }
  if (emailFailuresResult.error) {
    throw new Error(emailFailuresResult.error.message);
  }
  if (paymentFailuresResult.error) {
    throw new Error(paymentFailuresResult.error.message);
  }

  const rows =
    (systemLogsResult.data as {
      id: string;
      level: string;
      category: string;
      message: string;
      request_id: string | null;
      metadata: unknown;
      created_at: string;
    }[] | null) || [];

  const notifications = [
    ...rows
      .filter((row) => {
        return (
          row.message === "fallback_activated" ||
          row.message === "fallback_threshold_crossed" ||
          row.message === "quality_gate_failure" ||
          row.message === "quality_gate_recovered" ||
          row.level === "warn" ||
          row.level === "error" ||
          row.level === "critical"
        );
      })
      .map(mapSystemLogToNotification),
    ...(((emailFailuresResult.data as AdminEmailDeliveryNotificationRow[] | null) || []).map(
      mapEmailDeliveryToNotification,
    )),
    ...(((paymentFailuresResult.data as AdminPaymentNotificationRow[] | null) || []).map(
      mapPaymentNotificationToAdminNotification,
    )),
  ];

  return notifications
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 40);
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

const EMAIL_SORT_FIELDS = ["created_at", "email_type", "status"] as const;

type EmailSortField = (typeof EMAIL_SORT_FIELDS)[number];
type SortDirection = "asc" | "desc";

function normalizeEmailSortField(sortBy?: string): EmailSortField {
  if (sortBy && EMAIL_SORT_FIELDS.includes(sortBy as EmailSortField)) {
    return sortBy as EmailSortField;
  }

  return "created_at";
}

function normalizeSortDirection(direction?: string): SortDirection {
  return direction === "asc" ? "asc" : "desc";
}

function getBaseAppUrl() {
  return getBaseUrl();
}

export async function getEmailDeliveries(options?: {
  emailType?: string;
  status?: "sent" | "failed";
  sortBy?: string;
  direction?: "asc" | "desc";
  limit?: number;
}): Promise<AdminEmailDelivery[]> {
  const { supabase } = await requireAdmin();
  const sortBy = normalizeEmailSortField(options?.sortBy);
  const direction = normalizeSortDirection(options?.direction);
  const limit = Math.min(Math.max(options?.limit || 200, 1), 500);

  let query = supabase
    .from("email_deliveries")
    .select("*")
    .order(sortBy, { ascending: direction === "asc" })
    .limit(limit);

  if (options?.emailType && options.emailType !== "all") {
    query = query.eq("email_type", options.emailType);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data as AdminEmailDelivery[] | null) || [];
}

export async function getContactMessages(options?: {
  subject?: string;
  status?: "new" | "in_progress" | "resolved" | "spam";
  limit?: number;
}): Promise<AdminContactMessage[]> {
  const { supabase } = await requireAdmin();
  const limit = Math.min(Math.max(options?.limit || 20, 1), 100);

  let query = supabase
    .from("contact_messages")
    .select("id, name, email, subject, message, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.subject) {
    query = query.eq("subject", options.subject);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data as AdminContactMessage[] | null) || [];
}

export async function updateContactMessageStatus(
  messageId: string,
  status: AdminContactMessage["status"],
) {
  const { userId, supabase } = await requireAdmin({ requireMfa: true });

  const { error } = await supabase
    .from("contact_messages")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "update_site_settings",
    target_type: "setting",
    target_id: `contact_message:${messageId}`,
    details: { status },
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function getEmailTemplateExamples(): Promise<AdminEmailTemplateExample[]> {
  await requireAdmin();
  const appUrl = getBaseAppUrl();

  const [
    registrationHtml,
    passwordResetHtml,
    paymentConfirmationHtml,
    paymentFailureHtml,
    invoiceHtml,
  ] = await Promise.all([
    renderRegistrationConfirmationEmail({
      userName: "Test Používateľ",
      confirmationUrl: `${appUrl}/auth/confirm?token=sample-token`,
      loginUrl: `${appUrl}/auth/login`,
    }),
    renderPasswordResetEmail({
      userName: "Test Používateľ",
      resetUrl: `${appUrl}/auth/reset-password?token=sample-token`,
      supportEmail: COMPANY_INFO.supportEmail,
    }),
    renderPaymentConfirmationEmail({
      userName: "Test Používateľ",
      credits: 40,
      amount: 89.99,
      currency: "eur",
      invoiceUrl: `${appUrl}/faktury/sample`,
      transactionId: "txn_sample_123",
      dashboardUrl: `${appUrl}/moj-ucet`,
    }),
    renderPaymentFailureEmail({
      userName: "Test Používateľ",
      amount: 24.99,
      currency: "eur",
      reason: "Nedostatocny zostatok",
      retryUrl: `${appUrl}/kredity`,
    }),
    renderInvoiceEmail({
      userName: "Test Používateľ",
      invoiceUrl: `${appUrl}/faktury/sample`,
    }),
  ]);

  return [
    {
      id: "registration-confirmation",
      name: "Potvrdenie registrácie",
      templateKey: "registration_confirmation",
      subject: "Potvrďte registráciu na Autobazar123",
      html: registrationHtml,
    },
    {
      id: "password-reset",
      name: "Obnovenie hesla",
      templateKey: "password_reset",
      subject: "Obnova hesla k účtu Autobazar123",
      html: passwordResetHtml,
    },
    {
      id: "payment-confirmation",
      name: "Potvrdenie platby",
      templateKey: "payment_confirmation",
      subject: "Platba potvrdená",
      html: paymentConfirmationHtml,
    },
    {
      id: "payment-failure",
      name: "Neuspesna platba",
      templateKey: "payment_failure",
      subject: "Platba sa nepodarila",
      html: paymentFailureHtml,
    },
    {
      id: "invoice",
      name: "Faktúra",
      templateKey: "invoice",
      subject: "Vaša faktúra",
      html: invoiceHtml,
    },
  ];
}
