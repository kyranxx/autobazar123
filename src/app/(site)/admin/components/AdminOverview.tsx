"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/shadcn/card";
import { Badge } from "@/components/ui/shadcn/badge";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  getAdminStats,
  getPerformanceSloDashboard,
  getRevenueStats,
  getRecentActivity,
  type AdminStats,
  type PerformanceSloDashboard,
  type RevenueStats,
} from "../actions";

interface Activity {
  type: "ad" | "user" | "payment" | "sold";
  action: string;
  user: string;
  time: string;
}

function StatCard({
  label,
  value,
  trend,
  icon,
  variant = "default",
}: {
  label: string;
  value: number | string;
  trend?: { value: number; positive: boolean };
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "accent";
}) {
  const variantStyles = {
    default: "from-background-tertiary to-background-muted",
    success: "from-success-subtle to-digital-subtle",
    warning: "from-warning-subtle to-accent-subtle",
    accent: "from-accent-subtle to-warning-subtle",
  };

  const iconStyles = {
    default: "bg-background-muted text-text-secondary",
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    accent: "bg-accent-subtle text-accent",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${variantStyles[variant]} p-5 border border-border-subtle`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-text-primary">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${trend.positive ? "text-success" : "text-error"}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    trend.positive
                      ? "M5 10l7-7m0 0l7 7m-7-7v18"
                      : "M19 14l-7 7m0 0l-7-7m7 7V3"
                  }
                />
              </svg>
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>{icon}</div>
      </div>
    </div>
  );
}

function RevenueCard({
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
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {["revenue-loading-1", "revenue-loading-2", "revenue-loading-3"].map(
              (skeletonKey) => (
              <div key={skeletonKey}>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-accent to-primary">
        <div className="flex items-center gap-2 text-white mb-4">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="font-semibold">Príjmy</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-white">
          <div>
            <p className="text-white/70 text-sm">Dnes</p>
            <p className="text-2xl font-bold">{revenue.today} €</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Tento týždeň</p>
            <p className="text-2xl font-bold">{revenue.thisWeek} €</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Tento mesiac</p>
            <p className="text-2xl font-bold">{revenue.thisMonth} €</p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-background-secondary">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Celkové kredity v systéme</span>
          <Badge variant="accent">
            {revenue.totalCredits.toLocaleString()} kr
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function ActivityFeed({
  activities,
  loading,
}: {
  activities: Activity[];
  loading: boolean;
}) {
  const getIcon = (type: string) => {
    switch (type) {
      case "ad":
        return "📝";
      case "user":
        return "👤";
      case "payment":
        return "💰";
      case "sold":
        return "✅";
      default:
        return "📌";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posledná aktivita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              "activity-loading-1",
              "activity-loading-2",
              "activity-loading-3",
              "activity-loading-4",
            ].map((skeletonKey) => (
              <div key={skeletonKey} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10" variant="circular" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Posledná aktivita</CardTitle>
        <Badge variant="default">Živé</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.length === 0 ? (
            <p className="text-text-secondary text-sm py-4 text-center">
              Žiadna nedávna aktivita
            </p>
          ) : (
            activities.map((item) => (
              <div
                key={`${item.type}-${item.action}-${item.user}-${item.time}`}
                className="flex items-center gap-4 py-3 border-b border-border-subtle last:border-0 hover:bg-surface-hover rounded-lg px-2 -mx-2 transition-colors"
              >
                <span className="text-xl w-10 h-10 flex items-center justify-center bg-background-tertiary rounded-full">
                  {getIcon(item.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {item.action}
                  </p>
                  <p className="text-sm text-text-secondary truncate">
                    {item.user}
                  </p>
                </div>
                <span className="text-sm text-text-muted whitespace-nowrap">
                  {item.time}
                </span>
              </div>
            ))
          )}
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
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((key) => (
              <div key={`perf-loading-${key}`} className="grid grid-cols-5 gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Performance SLO</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="default">{dashboard.windowHours}h window</Badge>
          <Badge variant="accent">{dashboard.totalSamples} samples</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-text-secondary">
          <span>Routes: {dashboard.routeCount}</span>
          <span className="mx-2">•</span>
          <span>
            Last ingest:{" "}
            {dashboard.lastIngestedAt
              ? new Date(dashboard.lastIngestedAt).toLocaleString()
              : "No data yet"}
          </span>
        </div>

        {dashboard.rows.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-background-tertiary p-4 text-sm text-text-secondary">
            No production web-vitals data ingested yet. Route-level p50/p95 will appear after traffic.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-text-secondary">
                  <th className="px-2 py-2 font-medium">Route</th>
                  <th className="px-2 py-2 font-medium">Metric</th>
                  <th className="px-2 py-2 font-medium">Samples</th>
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rýchle akcie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-tertiary hover:bg-surface-hover transition-colors">
            <div className="p-3 rounded-full bg-accent/10 text-accent">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-primary">
              Pridať admina
            </span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-tertiary hover:bg-surface-hover transition-colors">
            <div className="p-3 rounded-full bg-success/10 text-success">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-primary">
              Schváliť všetky
            </span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-tertiary hover:bg-surface-hover transition-colors">
            <div className="p-3 rounded-full bg-warning/10 text-warning">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-primary">
              Obnoviť cache
            </span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-tertiary hover:bg-surface-hover transition-colors">
            <div className="p-3 rounded-full bg-digital-subtle text-digital">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-primary">
              Export dát
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminOverview() {
  const [dashboardData, setDashboardData] = useState<{
    stats: AdminStats | null;
    revenue: RevenueStats | null;
    performance: PerformanceSloDashboard | null;
    activities: Activity[];
    loading: boolean;
  }>({
    stats: null,
    revenue: null,
    performance: null,
    activities: [],
    loading: true,
  });

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "prave teraz";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hod`;
    return `${Math.floor(diff / 86400)} dni`;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, revenueData, activityData, performanceData] = await Promise.all([
          getAdminStats(),
          getRevenueStats(),
          getRecentActivity(),
          getPerformanceSloDashboard(24),
        ]);
        const formattedActivities: Activity[] = [
          ...activityData.recentAds.map((ad) => {
            const profiles = ad.profiles as
              | { email?: string }
              | { email?: string }[]
              | null;
            const email = Array.isArray(profiles)
              ? profiles[0]?.email
              : profiles?.email;
            return {
              type: "ad" as const,
              action: "Nový inzerát",
              user: email || "N/A",
              time: formatTimeAgo(ad.created_at),
            };
          }),
          ...activityData.recentUsers.map((user) => ({
            type: "user" as const,
            action: "Nová registrácia",
            user: user.email,
            time: formatTimeAgo(user.created_at),
          })),
        ]
          .sort((a, b) => a.time.localeCompare(b.time))
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
        setDashboardData((prev) => ({ ...prev, loading: false }));
      }
    }
    fetchData();
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
  };
  const defaultPerformance: PerformanceSloDashboard = {
    windowHours: 24,
    totalSamples: 0,
    routeCount: 0,
    lastIngestedAt: null,
    rows: [],
  };

  const displayStats = dashboardData.stats || defaultStats;
  const displayRevenue = dashboardData.revenue || defaultRevenue;
  const displayPerformance = dashboardData.performance || defaultPerformance;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {dashboardData.loading ? (
          Array(6)
            .fill(0)
            .map((_, index) => (
              <div
                key={`stats-loading-${index + 1}`}
                className="p-5 rounded-xl border border-border-subtle"
              >
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
        ) : (
          <>
            <StatCard
              label="Používatelia"
              value={displayStats.totalUsers}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              }
            />
            <StatCard
              label="Inzeráty"
              value={displayStats.totalAds}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              }
            />
            <StatCard
              label="Aktívne"
              value={displayStats.activeAds}
              variant="success"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <StatCard
              label="Čakajúce"
              value={displayStats.pendingModeration}
              variant="warning"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <StatCard
              label="Dealeri"
              value={displayStats.dealerAccounts}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
            />
            <StatCard
              label="Dnes registrovaní"
              value={displayStats.todayRegistrations}
              variant="accent"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              }
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueCard revenue={displayRevenue} loading={dashboardData.loading} />
        <QuickActions />
      </div>

      <PerformanceSloPanel
        dashboard={displayPerformance}
        loading={dashboardData.loading}
      />

      <div className="grid gap-6 lg:grid-cols-1">
        <ActivityFeed
          activities={dashboardData.activities}
          loading={dashboardData.loading}
        />
      </div>
    </div>
  );
}




