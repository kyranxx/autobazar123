"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/config/vat";
import { DEALER_BULK_TIERS } from "@/config/credits";
import {
  applyDealerBulkActionLocally,
  calculateDealerBulkTotals,
  type DealerBulkActionId,
} from "@/lib/dealer/bulk-actions";
import { buildDealerPublicProfilePath } from "@/lib/dealer/public-profile-path";
import { useTranslations } from "next-intl";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { toast } from "sonner";
import {
  VerifiedIcon,
  ExternalLinkIcon,
  PlusIcon,
} from "@/components/ui/Icons";

const TABS = [
  { id: "ads", label: "Inzeráty", icon: "📝" },
  { id: "bulk", label: "Hromadné akcie", icon: "⚡" },
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
  created_at: string;
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
  credit_balance?: number | null;
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
      selectAll={selectAll}
      toggleSelectAll={toggleSelectAll}
      toggleSelect={toggleSelect}
      selectedCount={selectedCount}
      loadingAds={loadingAds}
      adsError={adsError}
      totalInquiries={totalInquiries}
      setAds={setAds}
      setSelectAllValue={setSelectAllValue}
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
  selectAll,
  toggleSelectAll,
  toggleSelect,
  selectedCount,
  loadingAds,
  adsError,
  totalInquiries,
  setAds,
  setSelectAllValue,
}: {
  dealer: DealerProfile;
  profile: DealerDashboardProfile;
  ads: Ad[];
  activeAds: Ad[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  t: ReturnType<typeof useTranslations>;
  selectAll: boolean;
  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  selectedCount: number;
  loadingAds: boolean;
  adsError: string | null;
  totalInquiries: number;
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
  setSelectAllValue: (value: boolean) => void;
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
              href={buildDealerPublicProfilePath(dealer.slug)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-primary hover:bg-surface"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              {t("viewStorefront")}
            </Link>
            <Link
              href="/moj-ucet?tab=create"
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
            label="Kredity"
            value={profile?.credit_balance?.toString() || "0"}
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
                    TOP
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
                  {ad.is_highlighted && <span>✨ Zvýraznený</span>}
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
}: {
  ads: Ad[];
  selectedCount: number;
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
  setSelectAllValue: (value: boolean) => void;
}) {
  const supabase = createClient();
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const bulkActions: Array<{
    id: DealerBulkActionId;
    label: string;
    icon: string;
  }> = [
    { id: "prolong", label: "Predĺžiť o 30 dni", icon: "P" },
    { id: "top", label: "Topovať (7 dni)", icon: "T" },
    { id: "highlight", label: "Zvyraznit (7 dni)", icon: "Z" },
    { id: "bump", label: "Posunut nahor", icon: "B" },
  ];

  const discount = calculateDealerBulkTotals("prolong", selectedCount).discountPercent;

  const handleBulkAction = async (
    actionId: DealerBulkActionId,
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

    const totals = calculateDealerBulkTotals(actionId, selectedAdIds.length);

    const confirmed = window.confirm(
      `Aplikovat "${actionLabel}" na ${selectedAdIds.length} inzeratov?\n\nCena: ${totals.baseCost} kreditov\nZlava: -${totals.discountAmount} kreditov (${totals.discountPercent}%)\nSpolu: ${totals.finalCost} kreditov`,
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setProcessingActionId(actionId);

    const { data, error } = await supabase.rpc("dealer_apply_bulk_action", {
      p_action: actionId,
      p_ad_ids: selectedAdIds,
    });

    setProcessingActionId(null);

    if (error) {
      setFeedback({
        type: "error",
        message: `Akciu sa nepodarilo spracovat: ${error.message}`,
      });
      return;
    }

    const result = data as
      | {
          success?: boolean;
          error?: string;
          applied_count?: number;
          credits_spent?: number;
          new_balance?: number;
        }
      | null;

    if (!result?.success) {
      setFeedback({
        type: "error",
        message: result?.error || "Akciu sa nepodarilo vykonat.",
      });
      return;
    }

    const nowIso = new Date().toISOString();
    setAds((prev) =>
      applyDealerBulkActionLocally(prev, actionId, selectedAdIds, nowIso),
    );
    setSelectAllValue(false);

    setFeedback({
      type: "success",
      message: `Akcia "${actionLabel}" bola aplikovana na ${result.applied_count || selectedAdIds.length} inzeratov. Spotrebovane kredity: ${result.credits_spent || totals.finalCost}. Zostatok: ${result.new_balance ?? "?"}.`,
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 p-4 rounded-xl bg-surface border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-secondary">Vybranych inzerátov:</span>
          <span className="text-xl font-bold text-primary">{selectedCount}</span>
        </div>
        {selectedCount > 0 && discount > 0 && (
          <p className="text-sm text-success font-medium">
            Ziskavate {discount}% zlavu za hromadnu akciu.
          </p>
        )}
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

      <div className="mb-8">
        <h3 className="text-sm font-medium text-secondary mb-3">Zlavy pre dealerov</h3>
        <div className="flex gap-2 flex-wrap">
          {DEALER_BULK_TIERS.map((tier) => (
            <div
              key={tier.minAds}
              className={`px-3 py-2 rounded-lg border text-sm ${
                selectedCount >= tier.minAds && selectedCount <= tier.maxAds
                  ? "border-accent bg-accent/10 text-accent font-medium"
                  : "border-border text-secondary"
              }`}
            >
              {tier.minAds}-{tier.maxAds === Infinity ? "INF" : tier.maxAds} inzeratov: -
              {tier.discount}%
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {bulkActions.map((action) => {
          const totals = calculateDealerBulkTotals(action.id, selectedCount);
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
                <p className="text-sm text-secondary">
                  {totals.baseCost > 0
                    ? `${Math.round(totals.baseCost / selectedCount)} kr / inzerat`
                    : "0 kr / inzerát"}
                </p>
              </div>
              <div className="text-right">
                {totals.discountPercent > 0 && selectedCount > 0 && (
                  <p className="text-xs text-secondary line-through">{totals.baseCost} kr</p>
                )}
                <p className="font-bold text-accent">
                  {isProcessing ? "..." : `${totals.finalCost} kr`}
                </p>
              </div>
            </button>
          );
        })}
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

