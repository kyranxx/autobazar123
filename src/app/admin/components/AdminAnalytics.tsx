"use client";

import { formatSkDateTime } from "@/utils/date-format";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { ExternalLinkIcon } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  getHomepageAnalyticsDashboard,
  type AdminHomepageAnalyticsDashboard,
} from "../analytics-actions";

const GA4_URL = "https://analytics.google.com/analytics/web/";
const SEARCH_CONSOLE_URL =
  "https://search.google.com/search-console?resource_id=sc-domain%3Aautobazar123.sk";

type AdminAnalyticsLocale = "sk" | "en";

type AdminAnalyticsCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ga4Action: string;
  searchConsoleAction: string;
  googleToolsTitle: string;
  googleToolsText: string;
  ga4Description: string;
  searchConsoleDescription: string;
  sevenDays: (value: string) => string;
  searchesToday: string;
  importantClicks: string;
  featuredOpenings: string;
  averageFoundCars: string;
  averageFoundCarsHelper: string;
  homepageSearchesTitle: string;
  homepageSearchesHelper: string;
  homepageSearchesEmpty: string;
  eventsTitle: string;
  eventsHelper: string;
  eventsEmpty: string;
  ctaTitle: string;
  ctaHelper: string;
  ctaEmpty: string;
  recentTitle: string;
  recentHelper: string;
  recentBadge: string;
  recentEmpty: string;
  noPage: string;
};

const ADMIN_ANALYTICS_COPY: Record<AdminAnalyticsLocale, AdminAnalyticsCopy> = {
  sk: {
    eyebrow: "Admin",
    title: "Návštevnosť a SEO",
    subtitle:
      "Na čo je táto stránka: rýchlo vidieť, či ľudia hľadajú autá, klikajú na dôležité tlačidlá a otvárajú odporúčané inzeráty. Tieto čísla nenahrádzajú GA4 ani Search Console.",
    ga4Action: "Otvoriť GA4",
    searchConsoleAction: "Otvoriť Search Console",
    googleToolsTitle: "Google nástroje",
    googleToolsText:
      "Tu sú iba rýchle signály z nášho webu. Odkiaľ ľudia prišli, SEO dotazy a výkon stránok rieš v Google nástrojoch.",
    ga4Description: "Návštevnosť, zdroje návštev, kampane a správanie ľudí na webe.",
    searchConsoleDescription:
      "SEO dotazy, stránky z Googlu, kliky, zobrazenia a technické problémy indexácie.",
    sevenDays: (value) => `Za 7 dní: ${value}`,
    searchesToday: "Hľadania dnes",
    importantClicks: "Kliky na dôležité tlačidlá",
    featuredOpenings: "Otvorenia odporúčaných inzerátov",
    averageFoundCars: "Priemer nájdených áut",
    averageFoundCarsHelper: "Pri hľadaní na úvodnej stránke za 7 dní",
    homepageSearchesTitle: "Čo hľadali na úvodnej stránke",
    homepageSearchesHelper:
      "Slová z vyhľadávania. Pomáha to s ponukou áut aj SEO témami.",
    homepageSearchesEmpty: "Zatiaľ nemáme hľadané slová.",
    eventsTitle: "Čo ľudia robili na webe",
    eventsHelper: "Iba hlavné akcie, ktoré si sledujeme priamo v aplikácii.",
    eventsEmpty: "Zatiaľ nemáme zaznamenané hlavné akcie.",
    ctaTitle: "Kliky na hlavné tlačidlá",
    ctaHelper: "Ktoré časti úvodnej stránky posielajú ľudí ďalej.",
    ctaEmpty: "Zatiaľ nemáme kliky na hlavné tlačidlá.",
    recentTitle: "Posledné dôležité udalosti",
    recentHelper: "Krátky zoznam pre kontrolu, či meranie prichádza.",
    recentBadge: "Posledné",
    recentEmpty: "Zatiaľ bez nových udalostí.",
    noPage: "bez stránky",
  },
  en: {
    eyebrow: "Admin",
    title: "Traffic and SEO",
    subtitle:
      "Why this page exists: quickly see whether people search for cars, click important buttons, and open featured listings. These numbers do not replace GA4 or Search Console.",
    ga4Action: "Open GA4",
    searchConsoleAction: "Open Search Console",
    googleToolsTitle: "Google tools",
    googleToolsText:
      "These are only quick signals from our website. Use Google tools for traffic sources, SEO queries, and page performance.",
    ga4Description: "Traffic, visit sources, campaigns, and what people do on the website.",
    searchConsoleDescription:
      "SEO queries, Google landing pages, clicks, impressions, and indexing issues.",
    sevenDays: (value) => `7 days: ${value}`,
    searchesToday: "Searches today",
    importantClicks: "Important button clicks",
    featuredOpenings: "Featured listing openings",
    averageFoundCars: "Average found cars",
    averageFoundCarsHelper: "Homepage search preview average for 7 days",
    homepageSearchesTitle: "What people searched on the homepage",
    homepageSearchesHelper: "Search words. Helps with car supply and SEO topics.",
    homepageSearchesEmpty: "No searched words yet.",
    eventsTitle: "What people did on the website",
    eventsHelper: "Only the main actions we track directly in the app.",
    eventsEmpty: "No main actions recorded yet.",
    ctaTitle: "Main button clicks",
    ctaHelper: "Which homepage areas send people onward.",
    ctaEmpty: "No main button clicks yet.",
    recentTitle: "Latest important events",
    recentHelper: "A short list to check whether measurement is coming in.",
    recentBadge: "Latest",
    recentEmpty: "No new events yet.",
    noPage: "no page",
  },
};

function getAdminAnalyticsLocale(locale: string): AdminAnalyticsLocale {
  return locale === "en" ? "en" : "sk";
}

function formatNumber(value: number, locale: AdminAnalyticsLocale) {
  return value.toLocaleString(locale === "en" ? "en-US" : "sk-SK");
}

function formatAdminDateTime(value: string, locale: AdminAnalyticsLocale) {
  if (locale === "sk") {
    return formatSkDateTime(value);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US");
}

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
    <div className="rounded-lg border border-border-subtle bg-background-secondary p-4">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
      <p className="mt-2 text-sm text-text-muted">{helper}</p>
    </div>
  );
}

function ExternalToolLink({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-background-secondary p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <a href={href} target="_blank" rel="noreferrer">
            {action}
            <ExternalLinkIcon className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function BreakdownList({
  title,
  helper,
  emptyText,
  rows,
  locale,
}: {
  title: string;
  helper: string;
  emptyText: string;
  rows: { label: string; count: number }[];
  locale: AdminAnalyticsLocale;
}) {
  return (
    <Card>
      <CardHeader className="border-b border-border-subtle">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-sm text-text-secondary">{helper}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-6">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-border-subtle bg-background-secondary px-4 py-3 text-sm text-text-secondary">
            {emptyText}
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-background-secondary px-4 py-3"
            >
              <p className="min-w-0 text-sm font-medium text-text-primary">{row.label}</p>
              <Badge variant="outline">{formatNumber(row.count, locale)}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function LoadingAnalyticsCards() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`analytics-loading-${index + 1}`}
            className="rounded-lg border border-border-subtle bg-background-secondary p-4"
          >
            <Skeleton className="mb-3 h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </>
  );
}

export function AdminAnalytics() {
  const adminLocale = getAdminAnalyticsLocale(useLocale());
  const copy = ADMIN_ANALYTICS_COPY[adminLocale];
  const [analyticsState, setAnalyticsState] = useState<{
    dashboard: AdminHomepageAnalyticsDashboard | null;
    loading: boolean;
  }>({
    dashboard: null,
    loading: true,
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const nextDashboard = await getHomepageAnalyticsDashboard();
        setAnalyticsState({ dashboard: nextDashboard, loading: false });
      } catch (error) {
        console.warn("Admin traffic data unavailable:", error);
        setAnalyticsState({ dashboard: null, loading: false });
      }
    }

    void loadDashboard();
  }, []);

  const dashboard = analyticsState.dashboard;
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
      <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              {copy.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-text-primary">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {copy.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={GA4_URL} target="_blank" rel="noreferrer">
                {copy.ga4Action}
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>
            <Button asChild variant="accent" size="sm">
              <a href={SEARCH_CONSOLE_URL} target="_blank" rel="noreferrer">
                {copy.searchConsoleAction}
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="border-b border-border-subtle">
          <div>
            <CardTitle>{copy.googleToolsTitle}</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              {copy.googleToolsText}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-2">
          <ExternalToolLink
            title="GA4"
            description={copy.ga4Description}
            href={GA4_URL}
            action={copy.ga4Action}
          />
          <ExternalToolLink
            title="Google Search Console"
            description={copy.searchConsoleDescription}
            href={SEARCH_CONSOLE_URL}
            action={copy.searchConsoleAction}
          />
        </CardContent>
      </Card>

      {analyticsState.loading ? (
        <LoadingAnalyticsCards />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsStatCard
              label={copy.searchesToday}
              value={formatNumber(summary.searches24h, adminLocale)}
              helper={copy.sevenDays(formatNumber(summary.searches7d, adminLocale))}
            />
            <AnalyticsStatCard
              label={copy.importantClicks}
              value={formatNumber(summary.ctaClicks24h, adminLocale)}
              helper={copy.sevenDays(formatNumber(summary.ctaClicks7d, adminLocale))}
            />
            <AnalyticsStatCard
              label={copy.featuredOpenings}
              value={formatNumber(summary.featuredListingClicks24h, adminLocale)}
              helper={copy.sevenDays(
                formatNumber(summary.featuredListingClicks7d, adminLocale),
              )}
            />
            <AnalyticsStatCard
              label={copy.averageFoundCars}
              value={
                summary.averagePreviewCount7d !== null
                  ? formatNumber(summary.averagePreviewCount7d, adminLocale)
                  : "-"
              }
              helper={copy.averageFoundCarsHelper}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <BreakdownList
              title={copy.homepageSearchesTitle}
              helper={copy.homepageSearchesHelper}
              emptyText={copy.homepageSearchesEmpty}
              rows={dashboard?.searchBreakdown ?? []}
              locale={adminLocale}
            />
            <BreakdownList
              title={copy.eventsTitle}
              helper={copy.eventsHelper}
              emptyText={copy.eventsEmpty}
              rows={dashboard?.eventBreakdown ?? []}
              locale={adminLocale}
            />
            <BreakdownList
              title={copy.ctaTitle}
              helper={copy.ctaHelper}
              emptyText={copy.ctaEmpty}
              rows={dashboard?.ctaBreakdown ?? []}
              locale={adminLocale}
            />
            <Card>
              <CardHeader className="border-b border-border-subtle">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{copy.recentTitle}</CardTitle>
                    <p className="mt-1 text-sm text-text-secondary">
                      {copy.recentHelper}
                    </p>
                  </div>
                  <Badge variant="secondary">{copy.recentBadge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {(dashboard?.recentEvents ?? []).length === 0 ? (
                  <p className="rounded-lg border border-border-subtle bg-background-secondary px-4 py-3 text-sm text-text-secondary">
                    {copy.recentEmpty}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboard?.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-lg border border-border-subtle bg-background-secondary px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-text-primary">{event.label}</p>
                          <Badge variant="outline">{event.eventName}</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                          <span>{event.pagePath || copy.noPage}</span>
                          <span>{formatAdminDateTime(event.createdAt, adminLocale)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
