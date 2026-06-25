"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  getAdminNotifications,
  getAdminStats,
  getFounderDashboardSummary,
  getRevenueStats,
  type AdminNotification,
  type AdminStats,
  type FounderDashboardSummary,
  type RevenueStats,
} from "../actions";

type AdminTodayState = {
  stats: AdminStats | null;
  revenue: RevenueStats | null;
  founder: FounderDashboardSummary | null;
  notifications: AdminNotification[];
  loading: boolean;
  partialError: boolean;
};

type Tone = "success" | "warning" | "error" | "accent" | "secondary";
type AdminTodayLocale = "sk" | "en";

type AdminTodayCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  usersButton: string;
  adsButton: string;
  tasksTitle: string;
  tasksSubtitle: string;
  statusWaiting: string;
  statusCalm: string;
  actionNeeded: string;
  actionOk: string;
  partialError: string;
  taskModeration: string;
  taskModerationHelper: string;
  taskPayments: string;
  taskPaymentsHelper: string;
  taskTechnical: string;
  taskTechnicalHelper: string;
  taskTodayAds: string;
  taskTodayAdsHelper: string;
  numbersTitle: string;
  numbersSubtitle: string;
  rangeDaysLabel: string;
  usersMetric: string;
  dealersPrefix: string;
  activeAdsMetric: string;
  allAdsPrefix: string;
  pendingMetric: string;
  pendingHelper: string;
  monthlyRevenueMetric: string;
  todayPrefix: string;
  stripeTotalMetric: string;
  dealerBalancePrefix: string;
  paidAdsMetric: string;
  daysPrefix: string;
  daysSuffix: string;
  paidFeaturesMetric: string;
  paidFeaturesHelper: string;
  listingViewsMetric: string;
  listingViewsHelper: string;
};

const ADMIN_TODAY_COPY: Record<AdminTodayLocale, AdminTodayCopy> = {
  sk: {
    eyebrow: "Admin",
    title: "Čo treba riešiť dnes",
    subtitle:
      "Najprv úlohy, potom čísla. Bez technického šumu na prvej obrazovke.",
    usersButton: "Používatelia",
    adsButton: "Inzeráty",
    tasksTitle: "Dnešné úlohy",
    tasksSubtitle: "Veci, ktoré majú v admine dostať prednosť.",
    statusWaiting: "Niečo čaká",
    statusCalm: "Pokoj",
    actionNeeded: "Riešiť",
    actionOk: "OK",
    partialError: "Niektoré dáta sa nenačítali. Skús obnoviť stránku.",
    taskModeration: "Schváliť inzeráty",
    taskModerationHelper: "Inzeráty čakajú na kontrolu.",
    taskPayments: "Skontrolovať platby",
    taskPaymentsHelper: "Chyby Stripe za posledných 24 hodín.",
    taskTechnical: "Pozrieť technické hlásenia",
    taskTechnicalHelper: "Iba chyby a kritické upozornenia.",
    taskTodayAds: "Nové inzeráty dnes",
    taskTodayAdsHelper: "Rýchla kontrola rastu ponuky.",
    numbersTitle: "Najdôležitejšie čísla",
    numbersSubtitle: "Používatelia, inzeráty a peniaze bez ďalších tabuliek.",
    rangeDaysLabel: "30 dní",
    usersMetric: "Používatelia",
    dealersPrefix: "Predajcovia",
    activeAdsMetric: "Aktívne inzeráty",
    allAdsPrefix: "Všetky",
    pendingMetric: "Čaká na schválenie",
    pendingHelper: "Treba pozrieť pred zverejnením",
    monthlyRevenueMetric: "Príjmy tento mesiac",
    todayPrefix: "Dnes",
    stripeTotalMetric: "Stripe spolu",
    dealerBalancePrefix: "Dealer zostatok",
    paidAdsMetric: "Platené inzeráty",
    daysPrefix: "Za",
    daysSuffix: "dní",
    paidFeaturesMetric: "Platené služby",
    paidFeaturesHelper: "Premium, Exclusive a podobné zvýhodnenia",
    listingViewsMetric: "Zobrazenia inzerátov",
    listingViewsHelper: "Detail inzerátu",
  },
  en: {
    eyebrow: "Admin",
    title: "What needs attention today",
    subtitle:
      "Tasks first, then numbers. No technical noise on the first screen.",
    usersButton: "Users",
    adsButton: "Listings",
    tasksTitle: "Today’s tasks",
    tasksSubtitle: "The admin items that should be handled first.",
    statusWaiting: "Needs attention",
    statusCalm: "Calm",
    actionNeeded: "Handle",
    actionOk: "OK",
    partialError: "Some data did not load. Try refreshing the page.",
    taskModeration: "Approve listings",
    taskModerationHelper: "Listings waiting for review.",
    taskPayments: "Check payments",
    taskPaymentsHelper: "Stripe errors in the last 24 hours.",
    taskTechnical: "Check technical alerts",
    taskTechnicalHelper: "Only errors and critical alerts.",
    taskTodayAds: "New listings today",
    taskTodayAdsHelper: "Quick check of supply growth.",
    numbersTitle: "Most important numbers",
    numbersSubtitle: "Users, listings, and money without extra tables.",
    rangeDaysLabel: "30 days",
    usersMetric: "Users",
    dealersPrefix: "Dealers",
    activeAdsMetric: "Active listings",
    allAdsPrefix: "All",
    pendingMetric: "Waiting for approval",
    pendingHelper: "Review before publishing",
    monthlyRevenueMetric: "Revenue this month",
    todayPrefix: "Today",
    stripeTotalMetric: "Stripe total",
    dealerBalancePrefix: "Dealer balance",
    paidAdsMetric: "Paid listings",
    daysPrefix: "Last",
    daysSuffix: "days",
    paidFeaturesMetric: "Paid features",
    paidFeaturesHelper: "Premium, Exclusive and similar boosts",
    listingViewsMetric: "Listing views",
    listingViewsHelper: "Listing detail views",
  },
};

const DATE_LOCALES: Record<AdminTodayLocale, string> = {
  sk: "sk-SK",
  en: "en-GB",
};

const EMPTY_STATS: AdminStats = {
  totalUsers: 0,
  totalAds: 0,
  activeAds: 0,
  pendingModeration: 0,
  dealerAccounts: 0,
  todayRegistrations: 0,
  todayAds: 0,
  soldToday: 0,
};

const EMPTY_REVENUE: RevenueStats = {
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
  totalDealerBalanceEur: 0,
  stripeRevenue: 0,
  stripeStatus: {
    webhookStatus: "idle",
    lastProcessedAt: null,
    failedEventsLast24h: 0,
    recentEvents: 0,
  },
};

const EMPTY_FOUNDER: FounderDashboardSummary = {
  windowDays: 30,
  paidAdsPosted: 0,
  previousPaidAdsPosted: 0,
  paidFeaturePurchases: 0,
  previousPaidFeaturePurchases: 0,
  revenueFromAdsAndFeatures: 0,
  previousRevenueFromAdsAndFeatures: 0,
  listingViews: 0,
  previousListingViews: 0,
  soldListings: 0,
  previousSoldListings: 0,
  medianDaysToSale: null,
  previousMedianDaysToSale: null,
  repeatSellers: 0,
  previousRepeatSellers: 0,
  repeatPayingSellers: 0,
  previousRepeatPayingSellers: 0,
  dailySeries: [],
};

function getAdminTodayLocale(locale: string): AdminTodayLocale {
  return locale === "en" ? "en" : "sk";
}

function formatNumber(value: number, adminLocale: AdminTodayLocale) {
  return value.toLocaleString(DATE_LOCALES[adminLocale]);
}

function formatCurrency(value: number, adminLocale: AdminTodayLocale) {
  return `${value.toLocaleString(DATE_LOCALES[adminLocale])} €`;
}

function getProblemCount(notifications: AdminNotification[]) {
  return notifications.filter(
    (notification) =>
      notification.level === "error" || notification.level === "critical",
  ).length;
}

function toneForCount(count: number, calmTone: Tone = "success"): Tone {
  return count > 0 ? "warning" : calmTone;
}

function TodayTask({
  adminLocale,
  copy,
  label,
  value,
  helper,
  href,
  tone,
}: {
  adminLocale: AdminTodayLocale;
  copy: AdminTodayCopy;
  label: string;
  value: number;
  helper: string;
  href: string;
  tone: Tone;
}) {
  const needsAction = value > 0;

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-background-secondary px-4 py-3 transition-colors hover:border-accent"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text-primary">{label}</span>
        <span className="mt-1 block text-sm text-text-muted">{helper}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="text-2xl font-bold text-text-primary">
          {formatNumber(value, adminLocale)}
        </span>
        <Badge variant={needsAction ? tone : "success"}>
          {needsAction ? copy.actionNeeded : copy.actionOk}
        </Badge>
      </span>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  helper,
  href,
}: {
  label: string;
  value: string;
  helper?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
      {helper ? <p className="mt-2 text-sm text-text-muted">{helper}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-border-subtle bg-background-secondary p-4 transition-colors hover:border-accent"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-background-secondary p-4">
      {content}
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={`admin-today-loading-${index + 1}`}
          className="rounded-lg border border-border-subtle bg-background-secondary p-4"
        >
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function AdminToday({
  initialFounderRange = null,
}: {
  initialFounderRange?: number | null;
}) {
  const adminLocale = getAdminTodayLocale(useLocale());
  const copy = ADMIN_TODAY_COPY[adminLocale];
  const requestedRange = initialFounderRange;
  const founderRangeDays =
    requestedRange === 7 || requestedRange === 30 || requestedRange === 90
      ? requestedRange
      : 30;
  const [state, setState] = useState<AdminTodayState>({
    stats: null,
    revenue: null,
    founder: null,
    notifications: [],
    loading: true,
    partialError: false,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchTodayData() {
      const [statsResult, revenueResult, founderResult, notificationsResult] =
        await Promise.allSettled([
          getAdminStats(),
          getRevenueStats(),
          getFounderDashboardSummary(founderRangeDays),
          getAdminNotifications(40),
        ]);

      if (!mounted) return;

      const partialError = [
        statsResult,
        revenueResult,
        founderResult,
        notificationsResult,
      ].some((result) => result.status === "rejected");

      if (partialError) {
        console.warn("Admin today data partially unavailable", {
          stats:
            statsResult.status === "rejected" ? statsResult.reason : undefined,
          revenue:
            revenueResult.status === "rejected" ? revenueResult.reason : undefined,
          founder:
            founderResult.status === "rejected" ? founderResult.reason : undefined,
          notifications:
            notificationsResult.status === "rejected"
              ? notificationsResult.reason
              : undefined,
        });
      }

      setState({
        stats: statsResult.status === "fulfilled" ? statsResult.value : null,
        revenue:
          revenueResult.status === "fulfilled" ? revenueResult.value : null,
        founder:
          founderResult.status === "fulfilled" ? founderResult.value : null,
        notifications:
          notificationsResult.status === "fulfilled"
            ? notificationsResult.value
            : [],
        loading: false,
        partialError,
      });
    }

    void fetchTodayData();

    return () => {
      mounted = false;
    };
  }, [founderRangeDays]);

  const stats = state.stats ?? EMPTY_STATS;
  const revenue = state.revenue ?? EMPTY_REVENUE;
  const founder = state.founder ?? EMPTY_FOUNDER;
  const paymentErrors = revenue.stripeStatus?.failedEventsLast24h ?? 0;
  const problemCount = getProblemCount(state.notifications);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              {copy.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-text-primary">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              {copy.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/users">{copy.usersButton}</Link>
            </Button>
            <Button asChild variant="accent" size="sm">
              <Link href="/admin/ads">{copy.adsButton}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="border-b border-border-subtle">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{copy.tasksTitle}</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                {copy.tasksSubtitle}
              </p>
            </div>
            {state.loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <Badge
                variant={
                  stats.pendingModeration + paymentErrors + problemCount > 0
                    ? "warning"
                    : "success"
                }
              >
                {stats.pendingModeration + paymentErrors + problemCount > 0
                  ? copy.statusWaiting
                  : copy.statusCalm}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {state.loading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : (
            <>
              {state.partialError ? (
                <div className="rounded-lg border border-warning/30 bg-warning-subtle px-4 py-3 text-sm text-warning">
                  {copy.partialError}
                </div>
              ) : null}
              <TodayTask
                adminLocale={adminLocale}
                copy={copy}
                label={copy.taskModeration}
                value={stats.pendingModeration}
                helper={copy.taskModerationHelper}
                href="/admin/ads"
                tone={toneForCount(stats.pendingModeration)}
              />
              <TodayTask
                adminLocale={adminLocale}
                copy={copy}
                label={copy.taskPayments}
                value={paymentErrors}
                helper={copy.taskPaymentsHelper}
                href="/admin/money"
                tone={paymentErrors > 0 ? "error" : "success"}
              />
              <TodayTask
                adminLocale={adminLocale}
                copy={copy}
                label={copy.taskTechnical}
                value={problemCount}
                helper={copy.taskTechnicalHelper}
                href="/admin/technical"
                tone={problemCount > 0 ? "error" : "success"}
              />
              <TodayTask
                adminLocale={adminLocale}
                copy={copy}
                label={copy.taskTodayAds}
                value={stats.todayAds}
                helper={copy.taskTodayAdsHelper}
                href="/admin/ads"
                tone="accent"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border-subtle">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{copy.numbersTitle}</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                {copy.numbersSubtitle}
              </p>
            </div>
            <Badge variant="secondary">{copy.rangeDaysLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {state.loading ? (
            <LoadingCards />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label={copy.usersMetric}
                value={formatNumber(stats.totalUsers, adminLocale)}
                helper={`${copy.dealersPrefix}: ${formatNumber(stats.dealerAccounts, adminLocale)}`}
                href="/admin/users"
              />
              <MetricCard
                label={copy.activeAdsMetric}
                value={formatNumber(stats.activeAds, adminLocale)}
                helper={`${copy.allAdsPrefix}: ${formatNumber(stats.totalAds, adminLocale)}`}
                href="/admin/ads"
              />
              <MetricCard
                label={copy.pendingMetric}
                value={formatNumber(stats.pendingModeration, adminLocale)}
                helper={copy.pendingHelper}
                href="/admin/ads"
              />
              <MetricCard
                label={copy.monthlyRevenueMetric}
                value={formatCurrency(revenue.thisMonth, adminLocale)}
                helper={`${copy.todayPrefix}: ${formatCurrency(revenue.today, adminLocale)}`}
                href="/admin/money"
              />
              <MetricCard
                label={copy.stripeTotalMetric}
                value={formatCurrency(revenue.stripeRevenue, adminLocale)}
                helper={`${copy.dealerBalancePrefix}: ${formatCurrency(revenue.totalDealerBalanceEur, adminLocale)}`}
                href="/admin/money"
              />
              <MetricCard
                label={copy.paidAdsMetric}
                value={formatNumber(founder.paidAdsPosted, adminLocale)}
                helper={`${copy.daysPrefix} ${formatNumber(founder.windowDays, adminLocale)} ${copy.daysSuffix}`}
                href="/admin/money"
              />
              <MetricCard
                label={copy.paidFeaturesMetric}
                value={formatNumber(founder.paidFeaturePurchases, adminLocale)}
                helper={copy.paidFeaturesHelper}
                href="/admin/money"
              />
              <MetricCard
                label={copy.listingViewsMetric}
                value={formatNumber(founder.listingViews, adminLocale)}
                helper={copy.listingViewsHelper}
                href="/admin/traffic"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
