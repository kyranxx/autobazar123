"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  getHomepageAnalyticsDashboard,
  type AdminHomepageAnalyticsDashboard,
} from "../analytics-actions";

function AnalyticsStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-background-secondary p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
      <p className="mt-2 text-xs text-text-muted">{helper}</p>
    </div>
  );
}

export function AdminAnalytics() {
  const [dashboard, setDashboard] = useState<AdminHomepageAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const nextDashboard = await getHomepageAnalyticsDashboard();
        setDashboard(nextDashboard);
      } catch (error) {
        console.warn("Admin analytics unavailable:", error);
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`analytics-loading-${index + 1}`} className="rounded-2xl border border-border-subtle p-5">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const summary = dashboard?.summary ?? {
    searches24h: 0,
    searches7d: 0,
    ctaClicks24h: 0,
    ctaClicks7d: 0,
    featuredListingClicks24h: 0,
    featuredListingClicks7d: 0,
    averagePreviewCount7d: null,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsStatCard
          label="Vyhľadávania"
          value={summary.searches24h.toLocaleString("sk-SK")}
          helper={`7 dní: ${summary.searches7d.toLocaleString("sk-SK")}`}
        />
        <AnalyticsStatCard
          label="Kliky na CTA"
          value={summary.ctaClicks24h.toLocaleString("sk-SK")}
          helper={`7 dní: ${summary.ctaClicks7d.toLocaleString("sk-SK")}`}
        />
        <AnalyticsStatCard
          label="Otvorenia TOP inzerátov"
          value={summary.featuredListingClicks24h.toLocaleString("sk-SK")}
          helper={`7 dní: ${summary.featuredListingClicks7d.toLocaleString("sk-SK")}`}
        />
        <AnalyticsStatCard
          label="Priemerný preview výsledkov"
          value={
            summary.averagePreviewCount7d !== null
              ? summary.averagePreviewCount7d.toLocaleString("sk-SK")
              : "—"
          }
          helper="Pri odoslaní homepage vyhľadávania za posledných 7 dní"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Rozpad udalostí</CardTitle>
            <Badge variant="secondary">7 dní</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {(dashboard?.eventBreakdown ?? []).length === 0 ? (
              <p className="text-sm text-text-secondary">Zatiaľ bez udalostí.</p>
            ) : (
              dashboard?.eventBreakdown.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-border-subtle bg-background-secondary px-4 py-3"
                >
                  <p className="text-sm font-medium text-text-primary">{row.label}</p>
                  <Badge variant="outline">{row.count.toLocaleString("sk-SK")}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Homepage CTA rozpad</CardTitle>
            <Badge variant="secondary">7 dní</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {(dashboard?.ctaBreakdown ?? []).length === 0 ? (
              <p className="text-sm text-text-secondary">Zatiaľ bez CTA klikov.</p>
            ) : (
              dashboard?.ctaBreakdown.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-border-subtle bg-background-secondary px-4 py-3"
                >
                  <p className="text-sm font-medium text-text-primary">{row.label}</p>
                  <Badge variant="outline">{row.count.toLocaleString("sk-SK")}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Posledné záznamy trackingu</CardTitle>
          <Badge variant="secondary">Live-ish</Badge>
        </CardHeader>
        <CardContent>
          {(dashboard?.recentEvents ?? []).length === 0 ? (
            <p className="text-sm text-text-secondary">Zatiaľ bez nových udalostí.</p>
          ) : (
            <div className="space-y-2">
              {dashboard?.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-border-subtle bg-background-secondary px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-text-primary">{event.label}</p>
                    <Badge variant="outline">{event.eventName}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span>{event.pagePath || "bez cesty"}</span>
                    <span>{new Date(event.createdAt).toLocaleString("sk-SK")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
