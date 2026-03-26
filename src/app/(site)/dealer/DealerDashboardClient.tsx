"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/config/vat";
import { buildDealerPublicProfilePath } from "@/lib/dealer/public-profile-path";
import { useTranslations } from "next-intl";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { createCsrfHeaders } from "@/lib/security/client-csrf";
import { toast } from "sonner";
import {
  VerifiedIcon,
  ExternalLinkIcon,
  PlusIcon,
} from "@/components/ui/Icons";
import {
  formatPriceCents,
  type DealerTopupPackageId,
  type ListingActionOperation,
} from "@/lib/pricing/config";

const TABS = [
  { id: "ads", label: "Inzeráty", icon: "📝" },
  { id: "bulk", label: "Hromadné akcie", icon: "⚡" },
  { id: "billing", label: "Platby", icon: "💶" },
  { id: "storefront", label: "Predajňa", icon: "🏪" },
  { id: "analytics", label: "Štatistiky", icon: "📊" },
  { id: "settings", label: "Nastavenia", icon: "⚙️" },
];

interface DealerProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  website_url?: string;
  is_verified: boolean;
  prepaid_balance_cents?: number;
  created_at: string;
}

interface DealerTopupDisplayPackage {
  id: DealerTopupPackageId;
  label: string;
  value: string;
}

interface Ad {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_eur: number;
  status: string;
  created_at?: string;
  views_count: number;
  expires_at?: string;
  top_expires_at?: string;
  highlight_expires_at?: string;
  is_top_ad: boolean;
  is_highlighted: boolean;
  photos_json?: string[];
  selected: boolean;
}

type DealerDashboardProfile = {
  email?: string | null;
} | null;

const normalizeAdStatus = (status: string | null | undefined): string =>
  (status ?? "").trim().toLowerCase();

const isActiveAdStatus = (status: string | null | undefined): boolean =>
  normalizeAdStatus(status) === "active";

const sortAdsActiveFirst = (ads: Ad[]): Ad[] =>
  [...ads].sort((left, right) => {
    const leftActive = isActiveAdStatus(left.status);
    const rightActive = isActiveAdStatus(right.status);

    if (leftActive !== rightActive) {
      return leftActive ? -1 : 1;
    }

    const leftCreatedAt = left.created_at
      ? new Date(left.created_at).getTime()
      : 0;
    const rightCreatedAt = right.created_at
      ? new Date(right.created_at).getTime()
      : 0;

    return rightCreatedAt - leftCreatedAt;
  });

export default function DealerDashboardClient() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("ads");
  const [pricingSummary, setPricingSummary] = useState({
    basic: "Zadarmo / 28 dní",
    premium: "4,99 € / 28 dní",
    top: "9,99 € / 28 dní",
  });
  const [dealerTopups, setDealerTopups] = useState<DealerTopupDisplayPackage[]>([
    { id: "dealer_100", label: "100 €", value: "108 €" },
    { id: "dealer_300", label: "300 €", value: "345 €" },
    { id: "dealer_1000", label: "1000 €", value: "1200 €" },
  ]);
  const [dealerState, setDealerState] = useState<{
    dealer: DealerProfile | null;
    loadingDealer: boolean;
    dealerError: string | null;
  }>({
    dealer: null,
    loadingDealer: false,
    dealerError: null,
  });
  const [adsState, setAdsState] = useState<{
    ads: Ad[];
    selectAll: boolean;
    loadingAds: boolean;
    adsError: string | null;
    totalInquiries: number;
  }>({
    ads: [],
    selectAll: false,
    loadingAds: false,
    adsError: null,
    totalInquiries: 0,
  });
  const t = useTranslations("dealer");
  const tCommon = useTranslations("common");
  const supabase = createClient();
  const { dealer, loadingDealer, dealerError } = dealerState;
  const { ads, selectAll, loadingAds, adsError, totalInquiries } = adsState;

  // Check if user is a dealer
  const isDealer = !!dealer;

  // Fetch dealer profile on mount
  useEffect(() => {
    if (!user) return;

    const fetchDealerProfile = async () => {
      setDealerState((prev) => ({
        ...prev,
        loadingDealer: true,
        dealerError: null,
      }));

      let resolvedDealer: DealerProfile | null | undefined = undefined;
      let resolvedError: string | null = null;
      try {
        const { data, error } = await supabase
          .from("dealers")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // No dealer found - user is not a dealer
            resolvedDealer = null;
          } else {
            console.error("Dealer fetch error:", error);
            resolvedError = error.message;
          }
        } else if (data) {
          resolvedDealer = data as DealerProfile;
        }
      } catch (err) {
        console.error("Exception fetching dealer:", err);
        resolvedError = err instanceof Error ? err.message : "Unknown error";
      }

      setDealerState((prev) => ({
        dealer: resolvedDealer === undefined ? prev.dealer : resolvedDealer,
        loadingDealer: false,
        dealerError: resolvedError,
      }));
    };

    fetchDealerProfile();
  }, [user, supabase]);

  // Fetch ads for the dealer
  useEffect(() => {
    if (!dealer) return;

    const fetchDealerAds = async () => {
      setAdsState((prev) => ({
        ...prev,
        loadingAds: true,
        adsError: null,
      }));

      let resolvedAds: Ad[] | undefined = undefined;
      let resolvedError: string | null = null;
      let resolvedTotalInquiries: number | undefined = undefined;
      try {
        const { data, error } = await supabase
          .from("ads")
          .select(
            `
                        id,
                        brand,
                        model,
                        year,
                        price_eur,
                        status,
                        created_at,
                        views_count,
                        expires_at,
                        top_expires_at,
                        highlight_expires_at,
                        is_top_ad,
                        is_highlighted,
                        photos_json
                    `,
          )
          .eq("dealer_id", dealer.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Ads fetch error:", error);
          resolvedError = error.message;
        } else if (data) {
          // Transform data and add selected property
          const transformedAds = data.map((ad: Record<string, unknown>) => ({
            ...ad,
            selected: false,
          }));
          resolvedAds = sortAdsActiveFirst(transformedAds as Ad[]);

          const adIds = resolvedAds.map((ad) => ad.id);
          if (adIds.length === 0) {
            resolvedTotalInquiries = 0;
          } else {
            const { count, error: inquiriesError } = await supabase
              .from("inquiries")
              .select("id", { count: "exact", head: true })
              .in("ad_id", adIds);

            if (inquiriesError) {
              console.error("Inquiries count fetch error:", inquiriesError);
            } else {
              resolvedTotalInquiries = count ?? 0;
            }
          }
        }
      } catch (err) {
        console.error("Exception fetching ads:", err);
        resolvedError = err instanceof Error ? err.message : "Unknown error";
      }

      setAdsState((prev) => ({
        ...prev,
        ads: resolvedAds ?? prev.ads,
        loadingAds: false,
        adsError: resolvedError,
        totalInquiries:
          resolvedTotalInquiries ?? (resolvedAds ? 0 : prev.totalInquiries),
      }));
    };

    fetchDealerAds();
  }, [dealer, supabase]);

  useEffect(() => {
    let cancelled = false;

    async function loadPricingSummary() {
      try {
        const response = await fetch("/api/pricing/config", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | {
              config?: {
                dealerTopups?: Array<{
                  id?: DealerTopupPackageId;
                  label?: string;
                  priceCents?: number;
                  bonusCents?: number;
                }>;
              };
              summary?: {
                basic?: string;
                premium?: string;
                top?: string;
              };
            }
          | null;

        if (!cancelled && response.ok && payload?.summary) {
          setPricingSummary({
            basic: payload.summary.basic || "Zadarmo / 28 dní",
            premium: payload.summary.premium || "4,99 € / 28 dní",
            top: payload.summary.top || "9,99 € / 28 dní",
          });
          if (Array.isArray(payload.config?.dealerTopups) && payload.config.dealerTopups.length > 0) {
            setDealerTopups(
              payload.config.dealerTopups
                .filter(
                  (
                    entry,
                  ): entry is {
                    id: DealerTopupPackageId;
                    label: string;
                    priceCents: number;
                    bonusCents: number;
                  } =>
                    (entry?.id === "dealer_100"
                    || entry?.id === "dealer_300"
                    || entry?.id === "dealer_1000")
                    && typeof entry.label === "string"
                    && typeof entry.priceCents === "number"
                    && typeof entry.bonusCents === "number",
                )
                .map((entry) => ({
                  id: entry.id,
                  label: entry.label,
                  value: formatPriceCents(entry.priceCents + entry.bonusCents),
                })),
            );
          }
        }
      } catch {
        // Keep defaults.
      }
    }

    void loadPricingSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface" />
          <div className="h-4 w-32 rounded bg-surface" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            {t("loginRequired")}
          </h1>
          <Link
            href="/auth/login"
            className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold"
          >
            {tCommon("login")}
          </Link>
        </div>
      </main>
    );
  }

  if (!isDealer) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-3xl">🏪</span>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            {t("becomeDealer")}
          </h1>
          <p className="text-secondary mb-6">{t("dealerBenefits")}</p>
          <Link
            href="/dealer/registracia"
            className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold"
          >
            {t("registerDealership")}
          </Link>
        </div>
      </main>
    );
  }

  // Show loading for dealer and ads
  if (loadingDealer) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface" />
          <div className="h-4 w-32 rounded bg-surface" />
        </div>
      </main>
    );
  }

  // Show error if dealer fetch failed
  if (dealerError) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            Chyba pri načítavaní profilu
          </h1>
          <p className="text-secondary mb-6">{dealerError}</p>
          <Link
            href="/"
            className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold"
          >
            {tCommon("back")}
          </Link>
        </div>
      </main>
    );
  }

  const selectedCount = ads.filter((ad) => ad.selected).length;
  const activeAds = ads.filter((ad) => isActiveAdStatus(ad.status));
  const setAds: React.Dispatch<React.SetStateAction<Ad[]>> = (next) => {
    setAdsState((prev) => ({
      ...prev,
      ads: typeof next === "function" ? next(prev.ads) : next,
    }));
  };
  const setSelectAllValue = (value: boolean) => {
    setAdsState((prev) => ({
      ...prev,
      selectAll: value,
    }));
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setAdsState((prev) => ({
      ...prev,
      selectAll: newSelectAll,
      ads: prev.ads.map((ad) => ({
        ...ad,
        selected: isActiveAdStatus(ad.status) ? newSelectAll : false,
      })),
    }));
  };

  const toggleSelect = (id: string) => {
    setAdsState((prev) => ({
      ...prev,
      ads: prev.ads.map((ad) =>
        ad.id === id ? { ...ad, selected: !ad.selected } : ad,
      ),
    }));
  };

  return (
    <DealerDashboardMainContent
      dealer={dealer}
      profile={profile}
      ads={ads}
      activeAds={activeAds}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      t={t}
      tCommon={tCommon}
      selectAll={selectAll}
      toggleSelectAll={toggleSelectAll}
      toggleSelect={toggleSelect}
      selectedCount={selectedCount}
      loadingAds={loadingAds}
      adsError={adsError}
      totalInquiries={totalInquiries}
      setAds={setAds}
      setSelectAllValue={setSelectAllValue}
      pricingSummary={pricingSummary}
      dealerTopups={dealerTopups}
    />
  );
}

function DealerDashboardMainContent({
  dealer,
  profile,
  ads,
  activeAds,
  activeTab,
  setActiveTab,
  t,
  tCommon,
  selectAll,
  toggleSelectAll,
  toggleSelect,
  selectedCount,
  loadingAds,
  adsError,
  totalInquiries,
  setAds,
  setSelectAllValue,
  pricingSummary,
  dealerTopups,
}: {
  dealer: DealerProfile;
  profile: DealerDashboardProfile;
  ads: Ad[];
  activeAds: Ad[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  selectAll: boolean;
  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  selectedCount: number;
  loadingAds: boolean;
  adsError: string | null;
  totalInquiries: number;
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
  setSelectAllValue: (value: boolean) => void;
  pricingSummary: {
    basic: string;
    premium: string;
    top: string;
  };
  dealerTopups: DealerTopupDisplayPackage[];
}) {
  return (
    <main className="pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8 flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {dealer.logo_url && (
              <Image
                src={dealer.logo_url}
                alt={dealer.name}
                width={64}
                height={64}
                className="rounded-xl object-cover border border-border"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-primary">{dealer.name}</h1>
                {dealer.is_verified && (
                  <span className="text-accent" title="Overený dealer">
                    <VerifiedIcon className="w-5 h-5" />
                  </span>
                )}
              </div>
              <p className="text-secondary">{dealer.address || ""}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/moj-ucet"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-primary hover:bg-surface"
            >
              {tCommon("myAccount")}
            </Link>
            <Link
              href={buildDealerPublicProfilePath(dealer.slug)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-primary hover:bg-surface"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              {t("viewStorefront")}
            </Link>
            <Link
              href="/pridat-inzerat"
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover"
            >
              <PlusIcon className="w-5 h-5" />
              {t("addListing")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4 lg:grid-cols-5">
          <StatCard
            icon="\u{1F4B0}"
            label="Zostatok"
            value={`${((dealer.prepaid_balance_cents || 0) / 100).toLocaleString("sk-SK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} €`}
          />
          <StatCard
            icon="\u{1F4CB}"
            label="Aktívne"
            value={activeAds.length.toString()}
          />
          <StatCard
            icon="\u{1F441}\u{FE0F}"
            label="Zobrazenia"
            value={ads
              .reduce((s, a) => s + (a.views_count || 0), 0)
              .toLocaleString()}
          />
          <StatCard
            icon="\u{1F4AC}"
            label="Dopyty"
            value={totalInquiries.toString()}
          />
          <StatCard
            icon="\u{2705}"
            label="Predané"
            value={ads.filter((a) => a.status === "sold").length.toString()}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "bg-surface text-secondary hover:text-primary"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "ads" && (
          <AdsTab
            ads={ads}
            selectAll={selectAll}
            toggleSelectAll={toggleSelectAll}
            toggleSelect={toggleSelect}
            selectedCount={selectedCount}
            loading={loadingAds}
            error={adsError}
          />
        )}
        {activeTab === "bulk" && (
          <BulkActionsTab
            ads={ads}
            selectedCount={selectedCount}
            setAds={setAds}
            setSelectAllValue={setSelectAllValue}
            pricingSummary={pricingSummary}
          />
        )}
        {activeTab === "billing" && (
          <BillingTab
            dealer={dealer}
            pricingSummary={pricingSummary}
            dealerTopups={dealerTopups}
          />
        )}
        {activeTab === "storefront" && (
          <StorefrontTab dealer={dealer} profile={profile} />
        )}
        {activeTab === "analytics" && (
          <AnalyticsTab ads={ads} totalInquiries={totalInquiries} />
        )}
        {activeTab === "settings" && <SettingsTab dealer={dealer} />}
      </div>
    </main>
  );
}

// Ads Tab
function AdsTab({
  ads,
  selectAll,
  toggleSelectAll,
  toggleSelect,
  selectedCount,
  loading = false,
  error = null,
}: {
  ads: Ad[];
  selectAll: boolean;
  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  selectedCount: number;
  loading?: boolean;
  error?: string | null;
}) {
  const tCommon = useTranslations("common");

  // Memoize the getDaysRemaining function to avoid Date.now() calls during render
  const getDaysRemaining = useCallback((dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const now = Date.now();
    const days = Math.ceil(
      (new Date(dateStr).getTime() - now) / (1000 * 60 * 60 * 24),
    );
    return days > 0 ? days : 0;
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface" />
          <div className="h-4 w-40 rounded bg-surface" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 rounded-xl border border-error/20 bg-error-subtle">
        <p className="text-error font-medium">
          Chyba pri načítavaní inzerátov
        </p>
        <p className="text-error text-sm mt-2">{error}</p>
      </div>
    );
  }

  // Show empty state
  if (ads.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl border border-dashed border-border">
        <p className="text-secondary">Zatiaľ nemáte žiadne inzeráty</p>
      </div>
    );
  }

  return (
    <div>
      {/* Selection Header */}
      <div className="flex items-center justify-between mb-4 p-4 rounded-xl bg-surface">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-5 h-5 rounded border-border accent-accent"
          />
          <span className="text-sm font-medium text-primary">
            Vybrať všetky ({ads.filter((a) => isActiveAdStatus(a.status)).length})
          </span>
        </label>

        {selectedCount > 0 && (
          <span className="text-sm text-secondary">
            Vybraných:{" "}
            <span className="font-semibold text-accent">{selectedCount}</span>
          </span>
        )}
      </div>

      {/* Ads List */}
      <div className="space-y-3">
        {ads.map((ad) => {
          const daysRemaining = getDaysRemaining(ad.expires_at);
          const normalizedStatus = normalizeAdStatus(ad.status);

          return (
            <div
              key={ad.id}
              className={`flex gap-4 p-4 rounded-xl border transition-all ${
                ad.selected
                  ? "border-accent bg-accent/5"
                  : "border-border bg-background hover:border-accent/30"
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={ad.selected}
                onChange={() => toggleSelect(ad.id)}
                disabled={!isActiveAdStatus(ad.status)}
                className="mt-1 w-5 h-5 rounded border-border accent-accent disabled:opacity-50"
              />

              {/* Photo */}
              <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0 bg-surface">
                {ad.photos_json && ad.photos_json.length > 0 ? (
                  <Image
                    src={optimizeCloudflareImage(ad.photos_json[0], {
                      width: 336,
                      height: 240,
                      fit: "cover",
                      quality: 82,
                      format: "auto",
                    })}
                    alt={`${ad.brand} ${ad.model}`}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    📷
                  </div>
                )}
                {ad.is_top_ad && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-accent text-white text-xs font-semibold">
                    Exclusive
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-primary">
                      {ad.brand} {ad.model}
                    </h3>
                    <p className="text-sm text-secondary">
                      {ad.year} • {formatCurrency(ad.price_eur)}
                    </p>
                  </div>
                  {/* status + edit */}
                  <div className="flex items-center gap-2">
                    {normalizedStatus === "active" ? (
                      <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                        Aktívny
                      </span>
                    ) : normalizedStatus === "expired" ? (
                      <span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                        Expirovaný
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                        Predané
                      </span>
                    )}
                    <Link
                      href={`/upravit-inzerat/${ad.id}`}
                      className="px-2.5 py-1 rounded-md border border-border text-xs font-medium text-primary hover:bg-surface"
                    >
                      {tCommon("edit")}
                    </Link>
                  </div>
                </div>

                <div className="flex gap-4 mt-2 text-sm text-secondary">
                  <span>👁️ {ad.views_count || 0}</span>
                  <span>💬 0</span>
                  {daysRemaining !== null && (
                    <span className={daysRemaining <= 5 ? "text-error" : ""}>
                      ⏱️ {daysRemaining} dní
                    </span>
                  )}
                  {ad.is_highlighted && <span>✨ Premium</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Bulk Actions Tab
function BulkActionsTab({
  ads,
  selectedCount,
  setAds,
  setSelectAllValue,
  pricingSummary,
}: {
  ads: Ad[];
  selectedCount: number;
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
  setSelectAllValue: (value: boolean) => void;
  pricingSummary: {
    basic: string;
    premium: string;
    top: string;
  };
}) {
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const parsePriceValue = useCallback((label: string) => {
    const match = label.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
  }, []);

  const bulkActions: Array<{
    id: ListingActionOperation;
    label: string;
    icon: string;
    priceLabel: string;
  }> = [
    { id: "prolong_basic", label: "Predĺžiť o 28 dní", icon: "P", priceLabel: pricingSummary.basic },
    { id: "prolong_premium", label: "Premium na 28 dní", icon: "PR", priceLabel: pricingSummary.premium },
    { id: "prolong_top", label: "Exclusive na 28 dní", icon: "EX", priceLabel: pricingSummary.top },
  ];

  const handleBulkAction = async (
    actionId: ListingActionOperation,
    actionLabel: string,
  ) => {
    if (processingActionId) {
      return;
    }

    const selectedAdIds = ads
      .filter((ad) => ad.selected && isActiveAdStatus(ad.status))
      .map((ad) => ad.id);

    if (selectedAdIds.length === 0) {
      setFeedback({
        type: "error",
        message: "Najprv vyberte aktívne inzeráty v zalozke Inzeráty.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Aplikovať "${actionLabel}" na ${selectedAdIds.length} inzerátov?`,
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setProcessingActionId(actionId);

    try {
      const response = await fetch("/api/dealer/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...createCsrfHeaders(),
        },
        body: JSON.stringify({
          adIds: selectedAdIds,
          operation: actionId,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            appliedCount?: number;
            amountCents?: number;
            newBalanceCents?: number;
          }
        | null;

      if (!response.ok || !result?.ok) {
        setFeedback({
          type: "error",
          message: result?.error || "Akciu sa nepodarilo vykonať.",
        });
        return;
      }

      const nextExpiration = new Date();
      nextExpiration.setDate(nextExpiration.getDate() + 28);
      const nextExpirationIso = nextExpiration.toISOString();

      setAds((prev) =>
        prev.map((ad) => {
          if (!selectedAdIds.includes(ad.id)) {
            return ad;
          }

          return {
            ...ad,
            selected: false,
            expires_at: nextExpirationIso,
            is_top_ad: actionId === "prolong_top",
            is_highlighted: actionId === "prolong_premium",
          };
        }),
      );
      setSelectAllValue(false);

      if (actionId === "prolong_premium" || actionId === "prolong_top") {
        for (const adId of selectedAdIds) {
          trackAnalyticsEvent("listing_feature_purchased", {
            adId,
            featureType: actionId === "prolong_top" ? "exclusive" : "premium",
            purchaseSurface: "dealer_bulk",
            valueEur:
              actionId === "prolong_top"
                ? parsePriceValue(pricingSummary.top)
                : parsePriceValue(pricingSummary.premium),
          });
        }
      }

      setFeedback({
        type: "success",
        message: `Akcia "${actionLabel}" bola aplikovaná na ${result.appliedCount || selectedAdIds.length} inzerátov.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Akciu sa nepodarilo vykonať.",
      });
    } finally {
      setProcessingActionId(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 p-4 rounded-xl bg-surface border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-secondary">Vybraných inzerátov:</span>
          <span className="text-xl font-bold text-primary">{selectedCount}</span>
        </div>
        <p className="text-sm text-secondary">
          Rovnaké ceny ako pre bežných predajcov. Výhoda dealera je v predplatenom zostatku.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/30 bg-error/10 text-error"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {bulkActions.map((action) => {
          const isProcessing = processingActionId === action.id;

          return (
            <button
              key={action.id}
              onClick={() => handleBulkAction(action.id, action.label)}
              disabled={selectedCount === 0 || !!processingActionId}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="text-2xl">{action.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-semibold text-primary">{action.label}</p>
                <p className="text-sm text-secondary">{action.priceLabel}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-accent">
                  {isProcessing ? "..." : action.priceLabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BillingTab({
  dealer,
  pricingSummary,
  dealerTopups,
}: {
  dealer: DealerProfile;
  pricingSummary: {
    basic: string;
    premium: string;
    top: string;
  };
  dealerTopups: DealerTopupDisplayPackage[];
}) {
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);

  const handleTopup = async (packageId: DealerTopupPackageId) => {
    setLoadingPackageId(packageId);

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `dealer-topup-${packageId}-${Date.now()}`;

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": idempotencyKey,
          ...createCsrfHeaders(),
        },
        body: JSON.stringify({
          type: "dealer_topup",
          packageId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; url?: string }
        | null;

      if (!response.ok || !payload?.url) {
        toast.error(payload?.error || "Nepodarilo sa vytvoriť platbu.");
        return;
      }

      window.location.href = payload.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nepodarilo sa vytvoriť platbu.");
    } finally {
      setLoadingPackageId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
          Predplatený inzertný zostatok
        </p>
        <p className="mt-2 text-3xl font-bold text-primary">
          {((dealer.prepaid_balance_cents || 0) / 100).toLocaleString("sk-SK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} €
        </p>
        <p className="mt-2 text-sm text-secondary">
          Dobite si zostatok a používajte rovnaké ceny ako bežní predajcovia.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {dealerTopups.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-border bg-background p-5">
            <p className="text-lg font-semibold text-primary">{entry.label}</p>
            <p className="mt-2 text-sm text-secondary">Získate spolu {entry.value}</p>
            <button
              type="button"
              onClick={() => void handleTopup(entry.id)}
              disabled={loadingPackageId === entry.id}
              className="mt-4 w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {loadingPackageId === entry.id ? "Spracovávam..." : "Dobiť zostatok"}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-background p-6">
        <h3 className="font-semibold text-primary">Ceny akcií</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface p-4">
            <p className="text-sm font-medium text-primary">Predĺžiť</p>
            <p className="mt-1 text-sm text-secondary">{pricingSummary.basic}</p>
          </div>
          <div className="rounded-xl bg-surface p-4">
            <p className="text-sm font-medium text-primary">Premium</p>
            <p className="mt-1 text-sm text-secondary">{pricingSummary.premium}</p>
          </div>
          <div className="rounded-xl bg-surface p-4">
            <p className="text-sm font-medium text-primary">Exclusive</p>
            <p className="mt-1 text-sm text-secondary">{pricingSummary.top}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Storefront Tab
interface StorefrontTabProps {
  dealer: DealerProfile;
  profile: DealerDashboardProfile;
}

function StorefrontTab({ dealer, profile }: StorefrontTabProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="p-6 rounded-2xl border border-border">
        <h3 className="font-semibold text-primary mb-4">
          Verejný profil predajne
        </h3>
        <p className="text-secondary mb-4">
          URL vašej predajne:{" "}
          <a
            href={buildDealerPublicProfilePath(dealer.slug)}
            className="text-accent hover:underline"
            target="_blank"
          >
            autobazar123.sk{buildDealerPublicProfilePath(dealer.slug)}
          </a>
        </p>

        <div className="p-4 rounded-xl bg-surface">
          <div className="flex items-center gap-4 mb-4">
            {dealer.logo_url && (
              <Image
                src={dealer.logo_url}
                alt={dealer.name}
                width={64}
                height={64}
                className="rounded-xl object-cover"
              />
            )}
            <div>
              <h4 className="font-semibold text-primary">{dealer.name}</h4>
              <p className="text-sm text-secondary">{dealer.address || ""}</p>
            </div>
          </div>
          <p className="text-sm text-secondary">{dealer.description || ""}</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border">
        <h3 className="font-semibold text-primary mb-4">Kontaktné údaje</h3>
        <div className="space-y-3 text-sm">
          {dealer.phone && (
            <div className="flex justify-between">
              <span className="text-secondary">Telefón:</span>
              <span className="text-primary">{dealer.phone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-secondary">Email:</span>
            <span className="text-primary">{profile?.email || "N/A"}</span>
          </div>
          {dealer.website_url && (
            <div className="flex justify-between">
              <span className="text-secondary">Web:</span>
              <span className="text-accent">{dealer.website_url}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Analytics Tab
function AnalyticsTab({
  ads,
  totalInquiries,
}: {
  ads: Ad[];
  totalInquiries: number;
}) {
  const totalViews = ads.reduce((s, a) => s + (a.views_count || 0), 0);
  const conversionRate =
    totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(2) : "0";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-6 rounded-2xl border border-border text-center">
          <p className="text-3xl font-bold text-primary">
            {totalViews.toLocaleString()}
          </p>
          <p className="text-secondary">Celkové zobrazenia</p>
        </div>
        <div className="p-6 rounded-2xl border border-border text-center">
          <p className="text-3xl font-bold text-primary">{totalInquiries}</p>
          <p className="text-secondary">Celkové dopyty</p>
        </div>
        <div className="p-6 rounded-2xl border border-border text-center">
          <p className="text-3xl font-bold text-accent">{conversionRate}%</p>
          <p className="text-secondary">Konverzný pomer</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border">
        <h3 className="font-semibold text-primary mb-4">
          Top inzeráty podľa zobrazení
        </h3>
        <div className="space-y-3">
          {[...ads]
            .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
            .slice(0, 5)
            .map((ad, index) => (
              <div key={ad.id} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-sm font-medium text-secondary">
                  {index + 1}
                </span>
                <Image
                  src={optimizeCloudflareImage(
                    ad.photos_json?.[0] || "/placeholder-car.jpg",
                    {
                      width: 96,
                      height: 64,
                      fit: "cover",
                      quality: 80,
                      format: "auto",
                    },
                  )}
                  alt=""
                  width={48}
                  height={32}
                  className="rounded object-cover"
                />
                <span className="flex-1 font-medium text-primary">
                  {ad.brand} {ad.model}
                </span>
                <span className="text-secondary">
                  {ad.views_count || 0} zobrazení
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Settings Tab
function SettingsTab({ dealer }: { dealer: DealerProfile }) {
  const [requestNote, setRequestNote] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [verificationState, setVerificationState] = useState<{
    isLoading: boolean;
    requests: Array<{
      id: string;
      request_note: string;
      status: "pending" | "approved" | "rejected";
      admin_note: string | null;
      created_at: string;
      reviewed_at: string | null;
    }>;
  }>({
    isLoading: true,
    requests: [],
  });

  useEffect(() => {
    let isMounted = true;

    async function loadVerificationState() {
      try {
        const response = await fetch("/api/account/dealer-verification");
        const payload = (await response.json().catch(() => null)) as
          | {
              requests?: Array<{
                id: string;
                request_note: string;
                status: "pending" | "approved" | "rejected";
                admin_note: string | null;
                created_at: string;
                reviewed_at: string | null;
              }>;
            }
          | null;

        if (!response.ok) {
          throw new Error(payload && "error" in payload ? String(payload.error) : "Load failed");
        }

        if (!isMounted) return;
        setVerificationState({
          isLoading: false,
          requests: payload?.requests ?? [],
        });
      } catch (error) {
        console.error("Failed to load dealer verification state:", error);
        if (!isMounted) return;
        setVerificationState({ isLoading: false, requests: [] });
      }
    }

    void loadVerificationState();

    return () => {
      isMounted = false;
    };
  }, []);

  const latestRequest = verificationState.requests[0] ?? null;
  const hasPendingRequest = latestRequest?.status === "pending";

  const handleSubmitVerificationRequest = async () => {
    setIsSubmittingRequest(true);
    try {
      const response = await fetch("/api/account/dealer-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestNote }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            request?: {
              id: string;
              request_note: string;
              status: "pending" | "approved" | "rejected";
              admin_note: string | null;
              created_at: string;
              reviewed_at: string | null;
            };
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.request) {
        throw new Error(payload?.error || "Submit failed");
      }

      setVerificationState((current) => ({
        ...current,
        requests: [payload.request!, ...current.requests],
      }));
      setRequestNote("");
      toast.success("Žiadosť o overenie bola odoslaná.");
    } catch (error) {
      console.error("Failed to submit dealer verification request:", error);
      toast.error("Žiadosť sa nepodarilo odoslať.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-primary">Overenie dealera</h3>
            <p className="mt-1 text-sm text-secondary">
              {dealer.is_verified
                ? "Vaša predajňa je overená."
                : "Požiadajte o overenie, aby ste získali dôveryhodný odznak."}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              dealer.is_verified
                ? "bg-success/10 text-success"
                : hasPendingRequest
                  ? "bg-warning/10 text-warning"
                  : "bg-background-muted text-text-secondary"
            }`}
          >
            {dealer.is_verified ? "Overený dealer" : hasPendingRequest ? "Čaká na schválenie" : "Neoverený"}
          </span>
        </div>

        {!dealer.is_verified && !hasPendingRequest ? (
          <div className="mt-4 space-y-3">
            <textarea
              id="dealer-settings-verification-request"
              value={requestNote}
              onChange={(event) => setRequestNote(event.target.value)}
              rows={4}
              placeholder="Krátko doplňte, prečo má byť predajňa overená."
              className="form-input resize-none"
            />
            <button
              type="button"
              onClick={() => void handleSubmitVerificationRequest()}
              disabled={isSubmittingRequest}
              className="rounded-lg bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {isSubmittingRequest ? "Odosielam..." : "Požiadať o overenie"}
            </button>
          </div>
        ) : null}

        {verificationState.isLoading ? (
          <p className="mt-4 text-sm text-secondary">Načítavam históriu žiadostí...</p>
        ) : latestRequest ? (
          <div className="mt-4 rounded-xl bg-surface p-4 text-sm">
            <p className="font-medium text-primary">
              Posledná žiadosť: {new Date(latestRequest.created_at).toLocaleDateString("sk-SK")}
            </p>
            {latestRequest.request_note ? (
              <p className="mt-2 text-secondary">{latestRequest.request_note}</p>
            ) : null}
            {latestRequest.admin_note ? (
              <p className="mt-2 text-text-muted">Poznámka admina: {latestRequest.admin_note}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="font-semibold text-primary mb-4">Údaje predajne</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="dealer-settings-company-name"
              className="block text-sm font-medium text-primary mb-2"
            >
              Názov firmy
            </label>
            <input
              id="dealer-settings-company-name"
              type="text"
              defaultValue={dealer.name}
              className="form-input"
            />
          </div>
          <div>
            <label
              htmlFor="dealer-settings-description"
              className="block text-sm font-medium text-primary mb-2"
            >
              Popis
            </label>
            <textarea
              id="dealer-settings-description"
              rows={3}
              defaultValue={dealer.description || ""}
              className="form-input resize-none"
            />
          </div>
          <div>
            <label
              htmlFor="dealer-settings-address"
              className="block text-sm font-medium text-primary mb-2"
            >
              Adresa
            </label>
            <input
              id="dealer-settings-address"
              type="text"
              defaultValue={dealer.address || ""}
              className="form-input"
            />
          </div>
          <button className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover">
            Uložiť zmeny
          </button>
        </div>
      </div>
    </div>
  );
}

// Components
function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border">
      <span className="text-xl">{icon}</span>
      <p className="text-2xl font-bold text-primary mt-2">{value}</p>
      <p className="text-sm text-secondary">{label}</p>
    </div>
  );
}
