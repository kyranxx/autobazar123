"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/config/vat";
import { DEALER_BULK_TIERS } from "@/config/credits";
import { useTranslations } from "next-intl";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import {
  VerifiedIcon,
  ExternalLinkIcon,
  PlusIcon,
} from "@/components/ui/Icons";

const TABS = [
  { id: "ads", label: "Inzeráty", icon: "📋" },
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
  views_count: number;
  expires_at?: string;
  is_top_ad: boolean;
  is_highlighted: boolean;
  photos_json?: string[];
  selected: boolean;
}

type DealerDashboardProfile = {
  credit_balance?: number | null;
  email?: string | null;
} | null;

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
  }>({
    ads: [],
    selectAll: false,
    loadingAds: false,
    adsError: null,
  });
  const t = useTranslations("dealer");
  const tCommon = useTranslations("common");
  const supabase = createClient();
  const { dealer, loadingDealer, dealerError } = dealerState;
  const { ads, selectAll, loadingAds, adsError } = adsState;

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
                        views_count,
                        expires_at,
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
          resolvedAds = transformedAds as Ad[];
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
  const activeAds = ads.filter((ad) => ad.status === "active");
  const setAds: React.Dispatch<React.SetStateAction<Ad[]>> = (next) => {
    setAdsState((prev) => ({
      ...prev,
      ads: typeof next === "function" ? next(prev.ads) : next,
    }));
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setAdsState((prev) => ({
      ...prev,
      selectAll: newSelectAll,
      ads: prev.ads.map((ad) => ({
        ...ad,
        selected: ad.status === "active" ? newSelectAll : false,
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
      setAds={setAds}
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
  setAds,
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
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
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
                  <span className="text-accent" title="Overeny dealer">
                    <VerifiedIcon className="w-5 h-5" />
                  </span>
                )}
              </div>
              <p className="text-secondary">{dealer.address || ""}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/dealer/${dealer.slug}`}
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
            label="Kredity"
            value={profile?.credit_balance?.toString() || "0"}
          />
          <StatCard
            icon="\u{1F4CB}"
            label="Aktivne"
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
            value={ads.length > 0 ? "0" : "0"}
          />
          <StatCard
            icon="\u{2705}"
            label="Predane"
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
          />
        )}
        {activeTab === "storefront" && (
          <StorefrontTab dealer={dealer} profile={profile} />
        )}
        {activeTab === "analytics" && <AnalyticsTab ads={ads} />}
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
      <div className="p-6 rounded-xl border border-red-200 bg-red-50">
        <p className="text-red-800 font-medium">
          Chyba pri načítavaní inzerátov
        </p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
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
            Vybrať všetky ({ads.filter((a) => a.status === "active").length})
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
                disabled={ad.status !== "active"}
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
                  {ad.status === "active" ? (
                    <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                      Aktívny
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                      Predané
                    </span>
                  )}
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
  ads: _ads,
  selectedCount,
  setAds: _setAds,
}: {
  ads: Ad[];
  selectedCount: number;
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>;
}) {
  const bulkActions = [
    { id: "prolong", label: "Predĺžiť o 30 dní", icon: "🔄", cost: 1 },
    { id: "top", label: "Topovať (7 dní)", icon: "⭐", cost: 3 },
    { id: "highlight", label: "Zvýrazniť (7 dní)", icon: "✨", cost: 2 },
    { id: "bump", label: "Posunúť nahor", icon: "🚀", cost: 1 },
  ];

  // Calculate discount based on count
  const getDiscount = (count: number): number => {
    const tier = DEALER_BULK_TIERS.find(
      (d) => count >= d.minAds && count <= d.maxAds,
    );
    return tier?.discount || 0;
  };

  const discount = getDiscount(selectedCount);

  const handleBulkAction = (actionId: string, costPerItem: number) => {
    if (selectedCount === 0) {
      alert("Najprv vyberte inzeráty v záložke Inzeráty");
      return;
    }

    const baseCost = selectedCount * costPerItem;
    const discountAmount = Math.round(baseCost * (discount / 100));
    const finalCost = baseCost - discountAmount;

    const confirm = window.confirm(
      `Aplikovať "${actionId}" na ${selectedCount} inzerátov?\n\nCena: ${baseCost} kreditov\nZľava: -${discountAmount} kreditov (${discount}%)\nSpolu: ${finalCost} kreditov`,
    );

    if (confirm) {
      // TODO: Call API
      alert(
        `Akcia "${actionId}" bola úspešne aplikovaná na ${selectedCount} inzerátov!`,
      );
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 p-4 rounded-xl bg-surface border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-secondary">Vybraných inzerátov:</span>
          <span className="text-xl font-bold text-primary">
            {selectedCount}
          </span>
        </div>
        {selectedCount > 0 && discount > 0 && (
          <p className="text-sm text-success font-medium">
            🎉 Získavate {discount}% zľavu za hromadnú akciu!
          </p>
        )}
      </div>

      {/* Discount Tiers */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-secondary mb-3">
          Zľavy pre dealerov
        </h3>
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
              {tier.minAds}-{tier.maxAds === Infinity ? "∞" : tier.maxAds}{" "}
              inzerátov: -{tier.discount}%
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        {bulkActions.map((action) => {
          const baseCost = selectedCount * action.cost;
          const discountAmount = Math.round(baseCost * (discount / 100));
          const finalCost = baseCost - discountAmount;

          return (
            <button
              key={action.id}
              onClick={() => handleBulkAction(action.id, action.cost)}
              disabled={selectedCount === 0}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="text-2xl">{action.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-semibold text-primary">{action.label}</p>
                <p className="text-sm text-secondary">
                  {action.cost} kr / inzerát
                </p>
              </div>
              <div className="text-right">
                {discount > 0 && selectedCount > 0 && (
                  <p className="text-xs text-secondary line-through">
                    {baseCost} kr
                  </p>
                )}
                <p className="font-bold text-accent">{finalCost} kr</p>
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
            href={`/dealer/${dealer.slug}`}
            className="text-accent hover:underline"
            target="_blank"
          >
            autobazar123.sk/dealer/{dealer.slug}
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
function AnalyticsTab({ ads }: { ads: Ad[] }) {
  const totalViews = ads.reduce((s, a) => s + (a.views_count || 0), 0);
  const totalInquiries = 0; // TODO: Implement inquiries table
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
  return (
    <div className="max-w-lg space-y-6">
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

