"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Badge } from "@/components/ui/shadcn/badge";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  getAdminStats,
  getPerformanceSloDashboard,
  getRecentActivity,
  getRevenueStats,
  type AdminStats,
  type PerformanceSloDashboard,
  type RevenueStats,
} from "../actions";

interface ActivityItem {
  type: "ad" | "user";
  action: string;
  user: string;
  relativeTime: string;
  createdAt: number;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diff < 60) return "práve teraz";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("sk-SK")} €`;
}

function StatCard({
  label,
  value,
  tone = "default",
  helper,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "accent" | "success" | "warning";
  helper?: string;
}) {
  const toneClasses = {
    default: "border-border-subtle bg-background-secondary",
    accent: "border-accent/20 bg-accent/5",
    success: "border-success/20 bg-success/5",
    warning: "border-warning/20 bg-warning/5",
  };

  return (
    <div className={`rounded-2xl border p-5 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">
        {typeof value === "number" ? value.toLocaleString("sk-SK") : value}
      </p>
      {helper ? <p className="mt-2 text-xs text-text-muted">{helper}</p> : null}
    </div>
  );
}

function RevenueSummaryCard({
  revenue,
  loading,
}: {
  revenue: RevenueStats;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Príjmy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {["today", "week", "month"].map((key) => (
            <div key={key}>
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-border-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Príjmy</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Stripe cashflow a kredity bez prepínania do ďalšej sekcie.
            </p>
          </div>
          <Badge variant="accent">{formatCurrency(revenue.stripeRevenue)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Dnes</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {formatCurrency(revenue.today)}
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Tento týždeň</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {formatCurrency(revenue.thisWeek)}
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Tento mesiac</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {formatCurrency(revenue.thisMonth)}
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4 sm:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">Kredity v systéme</p>
              <p className="mt-2 text-xl font-semibold text-text-primary">
                {revenue.totalCredits.toLocaleString("sk-SK")} kr
              </p>
            </div>
            <div className="text-right text-sm text-text-secondary">
              <p>
                Webhook 24h:{" "}
                {revenue.stripeStatus?.recentEvents?.toLocaleString("sk-SK") ?? 0}
              </p>
              <p>
                Chyby 24h:{" "}
                {revenue.stripeStatus?.failedEventsLast24h?.toLocaleString("sk-SK") ?? 0}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OperationsSnapshot({
  stats,
  revenue,
  performance,
  loading,
}: {
  stats: AdminStats;
  revenue: RevenueStats;
  performance: PerformanceSloDashboard;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prevádzkový snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const activeRate =
    stats.totalAds > 0 ? Math.round((stats.activeAds / stats.totalAds) * 100) : 0;
  const moderationRate =
    stats.totalAds > 0 ? Math.round((stats.pendingModeration / stats.totalAds) * 100) : 0;
  const avgRevenuePerActiveAd =
    stats.activeAds > 0 ? Math.round(revenue.thisMonth / stats.activeAds) : 0;
  const stripeHealthLabel =
    revenue.stripeStatus?.webhookStatus === "healthy"
      ? "Stabilné"
      : revenue.stripeStatus?.webhookStatus === "degraded"
        ? "Pozor"
        : "Bez aktivity";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prevádzkový snapshot</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Aktivácia inventára</p>
          <p className="mt-2 text-xl font-semibold text-text-primary">{activeRate}%</p>
          <p className="mt-1 text-sm text-text-secondary">
            {stats.activeAds.toLocaleString("sk-SK")} z {stats.totalAds.toLocaleString("sk-SK")} inzerátov je aktívnych.
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Moderácia</p>
          <p className="mt-2 text-xl font-semibold text-text-primary">{moderationRate}%</p>
          <p className="mt-1 text-sm text-text-secondary">
            {stats.pendingModeration.toLocaleString("sk-SK")} inzerátov čaká na zásah.
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Priemerný mesačný výnos / aktívny inzerát</p>
          <p className="mt-2 text-xl font-semibold text-text-primary">{formatCurrency(avgRevenuePerActiveAd)}</p>
          <p className="mt-1 text-sm text-text-secondary">
            Pomáha odhaliť slabší dopyt alebo cenové diery.
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Monitorovanie výkonu</p>
          <p className="mt-2 text-xl font-semibold text-text-primary">
            {performance.totalSamples.toLocaleString("sk-SK")} vzoriek
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {performance.routeCount.toLocaleString("sk-SK")} trás, stav Stripe: {stripeHealthLabel}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceSloPanel({
  dashboard,
  loading,
}: {
  dashboard: PerformanceSloDashboard;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance SLO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((key) => (
            <div key={`perf-loading-${key}`} className="grid grid-cols-5 gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Performance SLO</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">{dashboard.windowHours}h okno</Badge>
          <Badge variant="accent">{dashboard.totalSamples} vzoriek</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-text-secondary">
          <span>Trasy: {dashboard.routeCount}</span>
          <span className="mx-2">•</span>
          <span>
            Posledný ingest:{" "}
            {dashboard.lastIngestedAt
              ? new Date(dashboard.lastIngestedAt).toLocaleString("sk-SK")
              : "Zatiaľ bez dát"}
          </span>
        </div>

        {dashboard.rows.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-background-secondary p-4 text-sm text-text-secondary">
            Produkčné web-vitals sa ešte nezbierali. Route-level p50/p95 sa zobrazia po
            prvých reálnych návštevách.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-text-secondary">
                  <th className="px-2 py-2 font-medium">Trasa</th>
                  <th className="px-2 py-2 font-medium">Metrika</th>
                  <th className="px-2 py-2 font-medium">Vzorky</th>
                  <th className="px-2 py-2 font-medium">p50 (ms)</th>
                  <th className="px-2 py-2 font-medium">p95 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.rows.slice(0, 18).map((row) => (
                  <tr
                    key={`${row.route}-${row.metricName}`}
                    className="border-b border-border-subtle/60 text-text-primary"
                  >
                    <td className="px-2 py-2 font-mono text-xs">{row.route}</td>
                    <td className="px-2 py-2">{row.metricName}</td>
                    <td className="px-2 py-2">{row.sampleCount}</td>
                    <td className="px-2 py-2">{Math.round(row.p50)}</td>
                    <td className="px-2 py-2">{Math.round(row.p95)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    "Skontrolovať čakajúcu moderáciu",
    "Pozrieť Stripe stav a chybové webhooky",
    "Skontrolovať feature flagy pred release",
    "Prejsť posledné admin logy",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontrolný zoznam operátora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <div
            key={action}
            className="rounded-xl border border-border-subtle bg-background-secondary px-4 py-3 text-sm text-text-primary"
          >
            {action}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityFeed({
  activities,
  loading,
}: {
  activities: ActivityItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posledná aktivita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((key) => (
            <div key={key} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" variant="circular" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Posledná aktivita</CardTitle>
        <Badge variant="default">Živé</Badge>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-secondary">
            V posledných minútach nie je nová aktivita.
          </p>
        ) : (
          <div className="space-y-2">
            {activities.map((item) => (
              <div
                key={`${item.type}-${item.user}-${item.createdAt}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-background-secondary px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">{item.action}</p>
                  <p className="truncate text-sm text-text-secondary">{item.user}</p>
                </div>
                <div className="text-right text-xs text-text-muted">
                  <p>{item.relativeTime}</p>
                  <p>{item.type === "ad" ? "Inzerát" : "Používateľ"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminOverview() {
  const [dashboardData, setDashboardData] = useState<{
    stats: AdminStats | null;
    revenue: RevenueStats | null;
    performance: PerformanceSloDashboard | null;
    activities: ActivityItem[];
    loading: boolean;
  }>({
    stats: null,
    revenue: null,
    performance: null,
    activities: [],
    loading: true,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, revenueData, activityData, performanceData] = await Promise.all([
          getAdminStats(),
          getRevenueStats(),
          getRecentActivity(),
          getPerformanceSloDashboard(24),
        ]);

        const formattedActivities: ActivityItem[] = [
          ...activityData.recentAds.map((ad) => {
            const profiles = ad.profiles as
              | { email?: string }
              | { email?: string }[]
              | null;
            const email = Array.isArray(profiles) ? profiles[0]?.email : profiles?.email;

            return {
              type: "ad" as const,
              action: "Nový inzerát",
              user: email || "N/A",
              relativeTime: formatTimeAgo(ad.created_at),
              createdAt: new Date(ad.created_at).getTime(),
            };
          }),
          ...activityData.recentUsers.map((user) => ({
            type: "user" as const,
            action: "Nová registrácia",
            user: user.email,
            relativeTime: formatTimeAgo(user.created_at),
            createdAt: new Date(user.created_at).getTime(),
          })),
        ]
          .sort((leftItem, rightItem) => rightItem.createdAt - leftItem.createdAt)
          .slice(0, 8);

        setDashboardData({
          stats: statsData,
          revenue: revenueData,
          performance: performanceData,
          activities: formattedActivities,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        setDashboardData((currentState) => ({ ...currentState, loading: false }));
      }
    }

    void fetchData();
  }, []);

  const defaultStats: AdminStats = {
    totalUsers: 0,
    totalAds: 0,
    activeAds: 0,
    pendingModeration: 0,
    dealerAccounts: 0,
    todayRegistrations: 0,
    todayAds: 0,
    soldToday: 0,
  };
  const defaultRevenue: RevenueStats = {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalCredits: 0,
    stripeRevenue: 0,
    recentTransactions: [],
    creditConsumption: [],
    stripeStatus: {
      webhookStatus: "idle",
      lastProcessedAt: null,
      failedEventsLast24h: 0,
      recentEvents: 0,
    },
  };
  const defaultPerformance: PerformanceSloDashboard = {
    windowHours: 24,
    totalSamples: 0,
    routeCount: 0,
    lastIngestedAt: null,
    rows: [],
  };

  const stats = dashboardData.stats || defaultStats;
  const revenue = dashboardData.revenue || defaultRevenue;
  const performance = dashboardData.performance || defaultPerformance;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardData.loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`stats-loading-${index + 1}`}
              className="rounded-2xl border border-border-subtle p-5"
            >
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Používatelia" value={stats.totalUsers} />
            <StatCard label="Všetky inzeráty" value={stats.totalAds} />
            <StatCard label="Aktívne inzeráty" value={stats.activeAds} tone="success" />
            <StatCard
              label="Čaká na moderáciu"
              value={stats.pendingModeration}
              tone="warning"
            />
            <StatCard label="Dealer účty" value={stats.dealerAccounts} />
            <StatCard
              label="Nové registrácie dnes"
              value={stats.todayRegistrations}
              tone="accent"
            />
            <StatCard label="Nové inzeráty dnes" value={stats.todayAds} tone="accent" />
            <StatCard
              label="Mesačný Stripe obrat"
              value={formatCurrency(revenue.thisMonth)}
              helper="Viditeľné priamo v prehľade"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <RevenueSummaryCard revenue={revenue} loading={dashboardData.loading} />
        <QuickActions />
      </div>

      <OperationsSnapshot
        stats={stats}
        revenue={revenue}
        performance={performance}
        loading={dashboardData.loading}
      />

      <PerformanceSloPanel dashboard={performance} loading={dashboardData.loading} />

      <ActivityFeed activities={dashboardData.activities} loading={dashboardData.loading} />
    </div>
  );
}
