"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  getAdminNotifications,
  getAdminStats,
  getFounderDashboardSummary,
  getPerformanceSloDashboard,
  getRecentActivity,
  getRevenueStats,
  type AdminNotification,
  type AdminStats,
  type FounderDashboardSummary,
  type PerformanceSloDashboard,
  type RevenueStats,
} from "../actions";
import { formatSkDateTime } from "@/utils/date-format";

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

function formatDelta(current: number | null, previous: number | null, inverse = false): string {
  if (current === null || previous === null) return "vs previous N/A";
  const diff = current - previous;
  if (diff === 0) return "vs previous 0";
  const signed = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  return inverse ? `vs previous ${signed} lower is better` : `vs previous ${signed}`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildSparklinePoints(values: number[], width = 240, height = 72): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function StatCard({
  label,
  value,
  tone = "default",
  helper,
  href,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "accent" | "success" | "warning";
  helper?: string;
  href?: string;
}) {
  const toneClasses = {
    default: "border-border-subtle bg-background-secondary",
    accent: "border-accent/20 bg-accent/5",
    success: "border-success/20 bg-success/5",
    warning: "border-warning/20 bg-warning/5",
  };

  const content = (
    <>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">
        {typeof value === "number" ? value.toLocaleString("sk-SK") : value}
      </p>
      {helper ? <p className="mt-2 text-xs text-text-muted">{helper}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`block rounded-2xl border p-5 transition-colors hover:border-accent ${toneClasses[tone]}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={`rounded-2xl border p-5 ${toneClasses[tone]}`}>{content}</div>;
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
              Stripe cashflow a dealer zostatky bez prepínania do ďalšej sekcie.
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
              <p className="text-xs uppercase tracking-wide text-text-muted">Dealer zostatok v systéme</p>
              <p className="mt-2 text-xl font-semibold text-text-primary">
                {formatCurrency(revenue.totalDealerBalanceEur)}
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

function FounderDashboardSection({
  founder,
  loading,
  rangeDays,
  onRangeChange,
}: {
  founder: FounderDashboardSummary;
  loading: boolean;
  rangeDays: 7 | 30 | 90;
  onRangeChange: (days: 7 | 30 | 90) => void;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Founder dashboard</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={`founder-loading-${index + 1}`} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const dailySeries = Array.isArray(founder.dailySeries) ? founder.dailySeries : [];

  const exportFounderCsv = () => {
    downloadCsv(`founder-dashboard-${rangeDays}d.csv`, [
      ["metric", "current", "previous"],
      ["paid_ads_posted", String(founder.paidAdsPosted), String(founder.previousPaidAdsPosted)],
      [
        "paid_feature_purchases",
        String(founder.paidFeaturePurchases),
        String(founder.previousPaidFeaturePurchases),
      ],
      [
        "listing_revenue_eur",
        String(founder.revenueFromAdsAndFeatures),
        String(founder.previousRevenueFromAdsAndFeatures),
      ],
      ["listing_views", String(founder.listingViews), String(founder.previousListingViews)],
      ["sold_listings", String(founder.soldListings), String(founder.previousSoldListings)],
      [
        "median_days_to_sale",
        founder.medianDaysToSale === null ? "" : founder.medianDaysToSale.toFixed(1),
        founder.previousMedianDaysToSale === null
          ? ""
          : founder.previousMedianDaysToSale.toFixed(1),
      ],
      ["repeat_sellers", String(founder.repeatSellers), String(founder.previousRepeatSellers)],
      [
        "repeat_paying_sellers",
        String(founder.repeatPayingSellers),
        String(founder.previousRepeatPayingSellers),
      ],
      [],
      ["date", "paid_ads_posted", "paid_feature_purchases", "listing_revenue_eur", "listing_views", "sold_listings"],
      ...dailySeries.map((entry) => [
        entry.date,
        String(entry.paidAdsPosted),
        String(entry.paidFeaturePurchases),
        String(entry.revenueFromAdsAndFeatures),
        String(entry.listingViews),
        String(entry.soldListings),
      ]),
    ]);
  };

  const trendMetrics = [
    {
      label: "Tržby z platených akcií",
      values: dailySeries.map((entry) => entry.revenueFromAdsAndFeatures),
      latest: formatCurrency(founder.revenueFromAdsAndFeatures),
      stroke: "var(--color-success)",
    },
    {
      label: "Platené inzeráty",
      values: dailySeries.map((entry) => entry.paidAdsPosted),
      latest: founder.paidAdsPosted.toLocaleString("sk-SK"),
      stroke: "var(--color-primary)",
    },
    {
      label: "Predané inzeráty",
      values: dailySeries.map((entry) => entry.soldListings),
      latest: founder.soldListings.toLocaleString("sk-SK"),
      stroke: "var(--color-accent)",
    },
  ] as const;

  return (
    <Card>
      <CardHeader className="border-b border-border-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Zakladateľský dashboard</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Najdôležitejšie čísla pre firmu: peniaze, výkon inzercie, predaje a návrat predajcov.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                type="button"
                size="sm"
                variant={rangeDays === days ? "secondary" : "outline"}
                onClick={() => onRangeChange(days as 7 | 30 | 90)}
              >
                {days}d
              </Button>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={exportFounderCsv}>
              Exportovať CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Platené inzeráty"
            value={founder.paidAdsPosted}
            tone="accent"
            helper={formatDelta(founder.paidAdsPosted, founder.previousPaidAdsPosted)}
            href="/admin/money"
          />
          <StatCard
            label="Platené Exclusive / Premium"
            value={founder.paidFeaturePurchases}
            tone="accent"
            helper={formatDelta(
              founder.paidFeaturePurchases,
              founder.previousPaidFeaturePurchases,
            )}
            href="/admin/money"
          />
          <StatCard
            label="Tržby z platených akcií"
            value={formatCurrency(founder.revenueFromAdsAndFeatures)}
            tone="success"
            helper={formatDelta(
              founder.revenueFromAdsAndFeatures,
              founder.previousRevenueFromAdsAndFeatures,
            )}
            href="/admin/money"
          />
          <StatCard
            label="Zobrazenia inzerátov"
            value={founder.listingViews}
            helper={formatDelta(founder.listingViews, founder.previousListingViews)}
            href="/admin/traffic"
          />
          <StatCard
            label="Predané inzeráty"
            value={founder.soldListings}
            tone="success"
            helper={formatDelta(founder.soldListings, founder.previousSoldListings)}
            href="/admin/today"
          />
          <StatCard
            label="Medián dní do predaja"
            value={
              founder.medianDaysToSale === null
                ? "N/A"
                : founder.medianDaysToSale.toFixed(1)
            }
            helper={formatDelta(
              founder.medianDaysToSale,
              founder.previousMedianDaysToSale,
              true,
            )}
          />
          <StatCard
            label="Vracajúci sa predajcovia"
            value={founder.repeatSellers}
            helper={formatDelta(founder.repeatSellers, founder.previousRepeatSellers)}
            href="/admin/today"
          />
          <StatCard
            label="Vracajúci sa platiaci predajcovia"
            value={founder.repeatPayingSellers}
            helper={formatDelta(
              founder.repeatPayingSellers,
              founder.previousRepeatPayingSellers,
            )}
            href="/admin/money"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {trendMetrics.map((metric) => {
            const polylinePoints = buildSparklinePoints(metric.values);
            return (
              <div
                key={metric.label}
                className="rounded-xl border border-border-subtle bg-background-secondary p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-primary">{metric.label}</p>
                  <span className="text-sm font-semibold text-text-primary">{metric.latest}</span>
                </div>
                <div className="rounded-lg border border-border-subtle bg-background p-3">
                  <svg viewBox="0 0 240 72" className="h-20 w-full" aria-hidden="true">
                    <polyline
                      fill="none"
                      stroke={metric.stroke}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={polylinePoints}
                    />
                  </svg>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                    <span>pred {rangeDays} dňami</span>
                    <span>dnes</span>
                  </div>
                </div>
              </div>
            );
          })}
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
              ? formatSkDateTime(dashboard.lastIngestedAt)
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
                  <th className="p-2 font-medium">Trasa</th>
                  <th className="p-2 font-medium">Metrika</th>
                  <th className="p-2 font-medium">Vzorky</th>
                  <th className="p-2 font-medium">p50 (ms)</th>
                  <th className="p-2 font-medium">p95 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.rows.slice(0, 18).map((row) => (
                  <tr
                    key={`${row.route}-${row.metricName}`}
                    className="border-b border-border-subtle/60 text-text-primary"
                  >
                    <td className="p-2 font-mono text-xs">{row.route}</td>
                    <td className="p-2">{row.metricName}</td>
                    <td className="p-2">{row.sampleCount}</td>
                    <td className="p-2">{Math.round(row.p50)}</td>
                    <td className="p-2">{Math.round(row.p95)}</td>
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

function AppNotificationsPanel({
  notifications,
  loading,
}: {
  notifications: AdminNotification[];
  loading: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "critical" | "fallback" | "quality_gate" | "system"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "critical_first">("newest");

  const criticalCount = notifications.filter(
    (item) => item.level === "critical" || item.kind === "fallback_threshold_crossed",
  ).length;

  const levelBadgeVariant: Record<
    AdminNotification["level"],
    "default" | "secondary" | "destructive" | "accent"
  > = {
    info: "secondary",
    warn: "default",
    error: "destructive",
    critical: "destructive",
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "fallback") return item.source === "fallback";
      if (activeFilter === "quality_gate") return item.source === "quality_gate";
      if (activeFilter === "system") return item.source === "system";
      return (
        item.level === "critical" ||
        item.level === "error" ||
        item.kind === "fallback_threshold_crossed"
      );
    });
  }, [activeFilter, notifications]);

  const sortedNotifications = useMemo(() => {
    const sorted = [...filteredNotifications];

    if (sortBy === "newest") {
      sorted.sort(
        (leftItem, rightItem) =>
          new Date(rightItem.createdAt).getTime() - new Date(leftItem.createdAt).getTime(),
      );
      return sorted;
    }

    if (sortBy === "oldest") {
      sorted.sort(
        (leftItem, rightItem) =>
          new Date(leftItem.createdAt).getTime() - new Date(rightItem.createdAt).getTime(),
      );
      return sorted;
    }

    const severityRank: Record<AdminNotification["level"], number> = {
      critical: 4,
      error: 3,
      warn: 2,
      info: 1,
    };

    sorted.sort((leftItem, rightItem) => {
      const rankDiff = severityRank[rightItem.level] - severityRank[leftItem.level];
      if (rankDiff !== 0) return rankDiff;
      return new Date(rightItem.createdAt).getTime() - new Date(leftItem.createdAt).getTime();
    });
    return sorted;
  }, [filteredNotifications, sortBy]);

  function compactDescription(description: string): string {
    if (description.length <= 120) return description;
    return `${description.slice(0, 117)}...`;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>App notifikacie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={`notif-loading-${key}`} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>App notifikacie</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{notifications.length} udalostí</Badge>
            <Badge variant={criticalCount > 0 ? "destructive" : "secondary"}>
              Kritické: {criticalCount}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={activeFilter === "all" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              Všetko
            </Button>
            <Button
              type="button"
              variant={activeFilter === "critical" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("critical")}
            >
              Kritické
            </Button>
            <Button
              type="button"
              variant={activeFilter === "fallback" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("fallback")}
            >
              Fallbacky
            </Button>
            <Button
              type="button"
              variant={activeFilter === "quality_gate" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("quality_gate")}
            >
              Quality gates
            </Button>
            <Button
              type="button"
              variant={activeFilter === "system" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("system")}
            >
              System
            </Button>
          </div>

          <label className="text-sm text-text-secondary">
            Sort:
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "newest" | "oldest" | "critical_first")
              }
              className="ml-2 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              <option value="newest">Newest</option>
              <option value="critical_first">Critical first</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {sortedNotifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-secondary">
            Aktuálne nie sú nové upozornenia pre tento filter.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedNotifications.slice(0, 24).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border-subtle bg-background-secondary px-4 py-3"
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-text-primary">{item.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.source}</Badge>
                    <Badge variant={levelBadgeVariant[item.level]}>
                      {item.level.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">{compactDescription(item.description)}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {formatSkDateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-text-muted">
          V prehľade sú zamerne iba skratene notifikacie. Plne detaily sú v sekcii Logy.
        </p>
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
              <Skeleton className="size-10" variant="circular" />
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

export function AdminOverview({
  initialSearchParams = "",
  initialFounderRange = null,
}: {
  initialSearchParams?: string;
  initialFounderRange?: number | null;
}) {
  const { replace } = useRouter();
  const requestedRange = initialFounderRange;
  const founderRangeDays =
    requestedRange === 7 || requestedRange === 30 || requestedRange === 90
      ? (requestedRange as 7 | 30 | 90)
      : 30;
  const [dashboardData, setDashboardData] = useState<{
    stats: AdminStats | null;
    revenue: RevenueStats | null;
    founder: FounderDashboardSummary | null;
    performance: PerformanceSloDashboard | null;
    activities: ActivityItem[];
    notifications: AdminNotification[];
    loading: boolean;
  }>({
    stats: null,
    revenue: null,
    founder: null,
    performance: null,
    activities: [],
    notifications: [],
    loading: true,
  });

  const handleFounderRangeChange = (days: 7 | 30 | 90) => {
    if (days === founderRangeDays) {
      return;
    }

    const params = new URLSearchParams(initialSearchParams);
    params.set("founderRange", String(days));
    replace(`/admin/today?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    async function fetchData() {
      const [statsResult, revenueResult, founderResult, activityResult, performanceResult, notificationsResult] =
        await Promise.allSettled([
          getAdminStats(),
          getRevenueStats(),
          getFounderDashboardSummary(founderRangeDays),
          getRecentActivity(),
          getPerformanceSloDashboard(24),
          getAdminNotifications(120),
        ]);

      const activityData =
        activityResult.status === "fulfilled"
          ? activityResult.value
          : { recentAds: [], recentUsers: [] };

      if (statsResult.status === "rejected") {
        console.warn("Admin overview stats unavailable:", statsResult.reason);
      }
      if (revenueResult.status === "rejected") {
        console.warn("Admin overview revenue unavailable:", revenueResult.reason);
      }
      if (founderResult.status === "rejected") {
        console.warn("Admin overview founder metrics unavailable:", founderResult.reason);
      }
      if (activityResult.status === "rejected") {
        console.warn("Admin overview activity unavailable:", activityResult.reason);
      }
      if (performanceResult.status === "rejected") {
        console.warn("Admin overview performance unavailable:", performanceResult.reason);
      }
      if (notificationsResult.status === "rejected") {
        console.warn("Admin overview notifications unavailable:", notificationsResult.reason);
      }

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
        stats: statsResult.status === "fulfilled" ? statsResult.value : null,
        revenue: revenueResult.status === "fulfilled" ? revenueResult.value : null,
        founder: founderResult.status === "fulfilled" ? founderResult.value : null,
        performance:
          performanceResult.status === "fulfilled" ? performanceResult.value : null,
        activities: formattedActivities,
        notifications:
          notificationsResult.status === "fulfilled" ? notificationsResult.value : [],
        loading: false,
      });
    }

    void fetchData();
  }, [founderRangeDays]);

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
    totalDealerBalanceEur: 0,
    stripeRevenue: 0,
    stripeStatus: {
      webhookStatus: "idle",
      lastProcessedAt: null,
      failedEventsLast24h: 0,
      recentEvents: 0,
    },
  };
  const defaultFounder: FounderDashboardSummary = {
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
  const defaultPerformance: PerformanceSloDashboard = {
    windowHours: 24,
    totalSamples: 0,
    routeCount: 0,
    lastIngestedAt: null,
    rows: [],
  };

  const stats = dashboardData.stats || defaultStats;
  const revenue = dashboardData.revenue || defaultRevenue;
  const founder = dashboardData.founder || defaultFounder;
  const performance = dashboardData.performance || defaultPerformance;

  return (
    <div className="space-y-6">
      <FounderDashboardSection
        founder={founder}
        loading={dashboardData.loading}
        rangeDays={founderRangeDays}
        onRangeChange={handleFounderRangeChange}
      />

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

      <AppNotificationsPanel
        notifications={dashboardData.notifications}
        loading={dashboardData.loading}
      />

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
