"use client";

import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/config/vat";
import { CREDIT_PACKS, ACTION_COSTS } from "@/config/credits";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import {
  mapInquiriesToConversations,
  type InquiryRow,
} from "@/lib/inquiries/conversations";
import {
  PlusIcon,
  EyeIcon,
  MessageIcon,
  ClockIcon,
  HeartIcon,
  CarIcon,
} from "@/components/ui/Icons";
import {
  AdsIcon,
  CreditIcon,
  SavedIcon,
  MessagesIcon,
  SettingsIcon,
} from "@/components/ui/DashboardIcons";

// Type definitions for ads
interface UserAd {
  id: string;
  brand?: string;
  model?: string;
  year: number;
  price_eur: number;
  mileage_km?: number;
  fuel?: string;
  transmission?: string;
  location_city?: string;
  created_at?: string | null;
  status: string;
  views?: number;
  views_count?: number;
  inquiries?: number;
  expires_at: string | null;
  is_top_ad: boolean;
  photo?: string;
  photos_json?: string[];
  brands?: { name: string };
  models?: { name: string };
}

interface SavedAd {
  id: string;
  year: number;
  price_eur: number;
  status: string;
  mileage_km?: number;
  location_city?: string;
  fuel?: string;
  photos_json?: string[];
  brands?: { name: string };
  models?: { name: string };
}

function sortAdsActiveFirst(ads: UserAd[]): UserAd[] {
  return [...ads].sort(
    (left, right) =>
      Number(right.status === "active") - Number(left.status === "active"),
  );
}

interface SavedAdAlertPreference {
  ad_id: string;
  notify_price_drop: boolean;
  notify_status_change: boolean;
  notify_similar: boolean;
  notify_email: boolean;
  notify_push: boolean;
  paused: boolean;
  baseline_price_eur: number | null;
  baseline_status: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
}

const TABS_CONFIG = [
  { id: "ads", labelKey: "myAds", Icon: AdsIcon },
  { id: "credits", labelKey: "credits", Icon: CreditIcon },
  { id: "saved", labelKey: "savedCars", Icon: SavedIcon },
  { id: "messages", labelKey: "messages", Icon: MessagesIcon },
  { id: "settings", labelKey: "settings", Icon: SettingsIcon },
];

function DashboardLoadingState() {
  return (
    <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface" />
        <div className="h-4 w-32 rounded bg-surface" />
      </div>
    </main>
  );
}

function DashboardAuthRequired({
  title,
  loginLabel,
}: {
  title: string;
  loginLabel: string;
}) {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-lg px-4 text-center">
        <h1 className="text-2xl font-bold text-primary mb-4">{title}</h1>
        <Link
          href="/auth/login"
          className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold"
        >
          {loginLabel}
        </Link>
      </div>
    </main>
  );
}

export default function DashboardClient() {
  const { user, profile, loading, signOut } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslations("dashboard");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const identityData = user?.identities?.[0]?.identity_data as
    | Record<string, unknown>
    | undefined;

  const avatarUrl =
    (typeof user?.user_metadata?.avatar_url === "string"
      ? (user.user_metadata.avatar_url as string)
      : undefined) ||
    (typeof user?.user_metadata?.picture === "string"
      ? (user.user_metadata.picture as string)
      : undefined) ||
    (identityData && typeof identityData.avatar_url === "string"
      ? (identityData.avatar_url as string)
      : undefined) ||
    (identityData && typeof identityData.picture === "string"
      ? (identityData.picture as string)
      : undefined) ||
    profile?.avatar_url;

  const userInitial =
    profile?.full_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";
  const displayName =
    profile?.full_name?.trim() || user?.email?.split("@")[0] || t("user");

  const [avatarErrorUrl, setAvatarErrorUrl] = useState<string | null>(null);

  // URL state management
  const router = useRouter();
  const pathname = usePathname();
  const [tabParam, setTabParam] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState(tabParam || "ads");

  useEffect(() => {
    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setTabParam(params.get("tab"));
    };

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);

    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  const [adsState, setAdsState] = useState<{
    savedCarIds: Set<string>;
    userAds: UserAd[];
    adsLoading: boolean;
    hasLoadedAds: boolean;
    hasLoadedSaved: boolean;
  }>({
    savedCarIds: new Set(),
    userAds: [],
    adsLoading: true,
    hasLoadedAds: false,
    hasLoadedSaved: false,
  });

  const loadUserAds = useCallback(async () => {
    if (!user) return;
    setAdsState((prev) => ({ ...prev, adsLoading: true }));
    try {
      const { data, error } = await supabase
        .from("ads")
        .select(
          `
                    id, 
                    year, 
                    price_eur, 
                    mileage_km, 
                    fuel,
                    transmission,
                    location_city,
                    status,
                    views_count,
                    is_top_ad,
                    expires_at,
                    created_at,
                    photos_json,
                    brands(name),
                    models(name)
                `,
        )
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAdsState((prev) => ({
          ...prev,
          userAds: sortAdsActiveFirst(data as unknown as UserAd[]),
        }));
      }
    } catch (err) {
      console.error("Error loading user ads:", err);
    } finally {
      setAdsState((prev) => ({ ...prev, adsLoading: false }));
    }
  }, [user, supabase]);

  const loadSavedCars = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("saved_ads")
        .select("ad_id")
        .eq("user_id", user.id);

      if (!error && data) {
        setAdsState((prev) => ({
          ...prev,
          savedCarIds: new Set(data.map((d) => d.ad_id)),
        }));
      }
    } catch (err) {
      console.error("Error loading saved cars:", err);
    }
  }, [user, supabase]);

  useEffect(() => {
    // When the user changes, reset lazy-load flags so tabs load for the new account.
    setAdsState({
      savedCarIds: new Set(),
      userAds: [],
      adsLoading: true,
      hasLoadedAds: false,
      hasLoadedSaved: false,
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    if (activeTab === "ads" && !adsState.hasLoadedAds) {
      loadUserAds().finally(() =>
        setAdsState((prev) => ({ ...prev, hasLoadedAds: true })),
      );
    }

    if (activeTab === "saved" && !adsState.hasLoadedSaved) {
      loadSavedCars().finally(() =>
        setAdsState((prev) => ({ ...prev, hasLoadedSaved: true })),
      );
    }
  }, [
    user,
    activeTab,
    adsState.hasLoadedAds,
    adsState.hasLoadedSaved,
    loadUserAds,
    loadSavedCars,
  ]);

  const handleUnsaveCar = useCallback(
    async (adId: string) => {
      if (!user) return;
      try {
        await supabase
          .from("saved_ads")
          .delete()
          .eq("user_id", user.id)
          .eq("ad_id", adId);

        setAdsState((prev) => {
          const newSet = new Set(prev.savedCarIds);
          newSet.delete(adId);
          return { ...prev, savedCarIds: newSet };
        });
      } catch (err) {
        console.error("Error removing saved car:", err);
      }
    },
    [user, supabase],
  );

  const handleSignOutWithRedirect = async () => {
    await signOut();
  };

  // Sync URL with state
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync state with URL if it changes externally
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  if (loading) return <DashboardLoadingState />;

  if (!user) {
    return (
      <DashboardAuthRequired
        title={tAuth("loginRequired")}
        loginLabel={tCommon("login")}
      />
    );
  }

  return (
    <main className="pt-12 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {avatarUrl && avatarErrorUrl !== avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile?.full_name || user.email || t("user")}
                  fill
                  sizes="64px"
                  className="object-cover"
                  onError={() => avatarUrl && setAvatarErrorUrl(avatarUrl)}
                />
              ) : (
                userInitial
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary">
                {t("accountInfo")}
              </h1>
              <p className="text-secondary">{displayName}</p>
              <p className="text-sm text-tertiary">{user.email}</p>
            </div>
          </div>
          <Link
            href="/pridat-inzerat"
            className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
          >
            <PlusIcon className="w-5 h-5" />
            {tCommon("addListing")}
          </Link>
        </div>

        {/* Dashboard Menu */}
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 mb-8 border-b border-border pb-6">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
            {TABS_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-3 rounded-xl text-base font-semibold whitespace-nowrap transition-all min-h-[48px] border ${
                  activeTab === tab.id
                    ? "bg-accent text-white shadow-sm border-transparent"
                    : "bg-background text-primary border-border hover:bg-background-muted"
                }`}
              >
                <tab.Icon className="w-5 h-5" />
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "ads" && (
          <MyAdsTab
            ads={adsState.userAds}
            isLoading={adsState.adsLoading}
            onRefresh={loadUserAds}
          />
        )}
        {activeTab === "credits" && (
          <CreditsTab
            transactions={[]}
            balance={profile?.credit_balance || 0}
          />
        )}
        {activeTab === "saved" && (
          <SavedTab savedCarIds={adsState.savedCarIds} onUnsave={handleUnsaveCar} />
        )}
        {activeTab === "messages" && <MessagesTab />}
        {activeTab === "settings" && (
          <SettingsTab
            profile={profile}
            signOut={handleSignOutWithRedirect}
          />
        )}
      </div>
    </main>
  );
}

// My Ads Tab
function MyAdsTab({
  ads,
  isLoading,
  onRefresh,
}: {
  ads: UserAd[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: t("active"), class: "bg-success/10 text-success" };
      case "sold":
        return { label: t("sold"), class: "bg-secondary/10 text-secondary" };
      case "expired":
        return { label: t("expired"), class: "bg-error/10 text-error" };
      case "pending":
        return { label: t("pending"), class: "bg-warning/10 text-warning" };
      default:
        return { label: status, class: "bg-surface text-secondary" };
    }
  };

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return null;
    const days = Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days > 0 ? days : 0;
  };

  const handleViewAd = (adId: string) => {
    router.push(`/auto/${adId}`);
  };

  const handleEditAd = (adId: string) => {
    router.push(`/upravit-inzerat/${adId}`);
  };

  const handleMarkAsSold = async (adId: string) => {
    setActionLoading(adId);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("ads")
        .update({
          status: "sold",
          sold_at: nowIso,
          updated_at: nowIso,
          is_hidden: false,
        })
        .eq("id", adId);

      if (!error) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error marking as sold:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const [boostLoading, setBoostLoading] = useState<string | null>(null);
  const [boostSuccess, setBoostSuccess] = useState<string | null>(null);

  const handleBoostAd = async (adId: string) => {
    if (!user?.id) return;
    setBoostLoading(adId);

    try {
      // Use atomic RPC function to prevent race conditions
      const { data, error } = await supabase.rpc("deduct_and_boost_ad", {
        p_ad_id: adId,
        p_credits_needed: 3,
      });

      if (error) {
        console.error("Error boosting ad:", error);
        alert(tErrors("generic"));
        return;
      }

      if (!data.success) {
        alert(tErrors("notEnoughCredits", { amount: 3 }));
        return;
      }

      setBoostSuccess(adId);
      setTimeout(() => setBoostSuccess(null), 3000);
      onRefresh();
    } catch (err) {
      console.error("Error boosting ad:", err);
    } finally {
      setBoostLoading(null);
    }
  };

  // Helper to get brand/model name from nested objects or direct properties
  const getBrandName = (ad: UserAd) =>
    ad.brands?.name || ad.brand || t("unknown");
  const getModelName = (ad: UserAd) => ad.models?.name || ad.model || "";
  const getPhoto = (ad: UserAd) => {
    if (ad.photo) {
      return optimizeCloudflareImage(ad.photo, {
        width: 384,
        height: 288,
        fit: "cover",
        quality: 82,
        format: "auto",
      });
    }
    if (ad.photos_json && ad.photos_json.length > 0) {
      return optimizeCloudflareImage(ad.photos_json[0], {
        width: 384,
        height: 288,
        fit: "cover",
        quality: 82,
        format: "auto",
      });
    }
    return "/placeholder-car.jpg";
  };
  const getViews = (ad: UserAd) => ad.views || ad.views_count || 0;
  const getInquiries = (ad: UserAd) => ad.inquiries || 0;
  const formatMileage = (value: number | undefined) =>
    typeof value === "number" ? `${value.toLocaleString("sk-SK")} km` : t("notProvided");
  const formatCreatedAt = (value: string | null | undefined) => {
    if (!value) return t("notProvided");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("notProvided");
    return date.toLocaleDateString("sk-SK");
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["myads-skeleton-1", "myads-skeleton-2", "myads-skeleton-3"].map(
          (skeletonKey) => (
          <div
            key={skeletonKey}
            className="rounded-2xl border border-border bg-background animate-pulse p-4 space-y-3"
          >
            <div className="h-40 rounded-xl bg-surface" />
            <div className="space-y-3">
              <div className="h-5 bg-surface rounded w-1/2" />
              <div className="h-4 bg-surface rounded w-1/3" />
              <div className="h-4 bg-surface rounded w-3/4" />
            </div>
          </div>
          ),
        )}
      </div>
    );
  }

  return (
    <div>
      {ads.length === 0 ? (
        <div className="text-center py-12">
          <CarIcon className="w-16 h-16 mx-auto text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">
            {t("noAdsYet")}
          </h3>
          <p className="text-secondary mb-4">{t("addFirstAd")}</p>
          <Link
            href="/pridat-inzerat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            {t("addFirstListing")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => {
            const status = getStatusBadge(ad.status);
            const daysRemaining = getDaysRemaining(ad.expires_at);
            const isActionLoading = actionLoading === ad.id;

            return (
              <article
                key={ad.id}
                role="button"
                tabIndex={0}
                className="rounded-2xl border border-border bg-background hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                onClick={() => handleViewAd(ad.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleViewAd(ad.id);
                  }
                }}
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={getPhoto(ad)}
                    alt={`${getBrandName(ad)} ${getModelName(ad)}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                  {ad.is_top_ad && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-accent text-white text-xs font-semibold">
                      TOP
                    </span>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${status.class}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                      {getBrandName(ad)} {getModelName(ad)}
                    </h3>
                    <p className="text-lg font-bold text-primary mt-1">
                      {formatCurrency(ad.price_eur)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-secondary">
                    <span>{ad.year || t("notProvided")}</span>
                    <span>{formatMileage(ad.mileage_km)}</span>
                    <span>{ad.fuel || t("notProvided")}</span>
                    <span>{ad.transmission || t("notProvided")}</span>
                    <span>{ad.location_city || t("notProvided")}</span>
                    <span>{formatCreatedAt(ad.created_at)}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-secondary">
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" />
                      {getViews(ad)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageIcon className="w-4 h-4" />
                      {getInquiries(ad)}
                    </span>
                    {daysRemaining !== null && (
                      <span
                        className={`flex items-center gap-1 ${daysRemaining <= 3 ? "text-error" : ""}`}
                      >
                        <ClockIcon className="w-4 h-4" />
                        {daysRemaining} {t("days")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAd(ad.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-surface text-sm font-medium text-primary hover:bg-surface-hover transition-colors"
                    >
                      {tCommon("edit")}
                    </button>
                    {ad.status === "active" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBoostAd(ad.id);
                          }}
                          disabled={boostLoading === ad.id || ad.is_top_ad}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                            boostSuccess === ad.id
                              ? "bg-success/10 text-success"
                              : ad.is_top_ad
                                ? "bg-accent text-white"
                                : "bg-accent/10 text-accent hover:bg-accent/20"
                          }`}
                        >
                          {boostLoading === ad.id
                            ? t("boosting")
                            : boostSuccess === ad.id
                              ? t("boosted")
                              : ad.is_top_ad
                                ? t("alreadyTop")
                                : t("boostCredits")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsSold(ad.id);
                          }}
                          disabled={isActionLoading}
                          className="px-3 py-1.5 rounded-lg text-sm text-secondary hover:text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                        >
                          {isActionLoading ? t("saving") : t("markAsSold")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Credits Tab
function CreditsTab({
  transactions,
  balance,
}: {
  transactions: Transaction[];
  balance: number;
}) {
  const t = useTranslations("dashboard");

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left - Buy Credits */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-4">
            {t("buyCredits")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer hover:border-accent ${
                  pack.featured ? "border-accent bg-accent/5" : "border-border"
                }`}
              >
                {pack.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold">
                    {t("popular")}
                  </span>
                )}
                <p className="text-2xl font-bold text-primary">
                  {pack.credits}
                </p>
                <p className="text-sm text-secondary">{t("creditsWord")}</p>
                <p className="mt-3 text-xl font-bold text-accent">
                  {pack.price} €
                </p>
                {pack.discount > 0 && (
                  <span className="text-xs text-success font-medium">
                    {t("savePercent", { percent: pack.discount })}
                  </span>
                )}
                <button className="w-full mt-4 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors">
                  {t("buy")}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Info */}
        <div className="p-6 rounded-2xl bg-surface">
          <h3 className="font-semibold text-primary mb-4">
            {t("actionPricing")}
          </h3>
          <div className="space-y-3">
            {ACTION_COSTS.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-primary">{action.nameSk}</p>
                  <p className="text-sm text-secondary">
                    {action.descriptionSk}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-accent">
                    {action.credits} kr
                  </span>
                  <p className="text-xs text-secondary">{action.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Balance & History */}
      <div className="space-y-6">
        <div className="p-6 rounded-2xl border border-border text-center">
          <p className="text-sm text-secondary mb-2">{t("yourBalance")}</p>
          <p className="text-4xl font-bold text-accent">{balance}</p>
          <p className="text-secondary">{t("creditsWord")}</p>
        </div>

        <div className="p-6 rounded-2xl border border-border">
          <h3 className="font-semibold text-primary mb-4">
            {t("transactionHistory")}
          </h3>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-primary">
                    {tx.description}
                  </p>
                  <p className="text-xs text-secondary">{tx.date}</p>
                </div>
                <span
                  className={`font-bold ${tx.amount > 0 ? "text-success" : "text-primary"}`}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Saved Tab (functional with persistent state)
function SavedTab({
  savedCarIds,
  onUnsave,
}: {
  savedCarIds: Set<string>;
  onUnsave: (id: string) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();
  const [savedState, setSavedState] = useState<{
    savedAds: SavedAd[];
    preferences: Record<string, SavedAdAlertPreference>;
    isLoading: boolean;
    alertsSupported: boolean;
    isBulkUpdating: boolean;
    updatingAdId: string | null;
  }>({
    savedAds: [],
    preferences: {},
    isLoading: true,
    alertsSupported: true,
    isBulkUpdating: false,
    updatingAdId: null,
  });
  const t = useTranslations("dashboard");
  const tFuel = useTranslations("fuel");
  const savedAdIds = useMemo(() => Array.from(savedCarIds), [savedCarIds]);

  const createDefaultPreference = useCallback(
    (ad: SavedAd): SavedAdAlertPreference => ({
      ad_id: ad.id,
      notify_price_drop: true,
      notify_status_change: true,
      notify_similar: false,
      notify_email: true,
      notify_push: false,
      paused: false,
      baseline_price_eur: ad.price_eur || null,
      baseline_status: ad.status || null,
    }),
    [],
  );

  const loadSavedAds = useCallback(async () => {
    if (!user) return;

    if (savedAdIds.length === 0) {
      setSavedState((prev) => ({
        ...prev,
        savedAds: [],
        preferences: {},
        isLoading: false,
      }));
      return;
    }

    setSavedState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { data: adsData, error: adsError } = await supabase
        .from("ads")
        .select(
          `
            id,
            year,
            price_eur,
            mileage_km,
            location_city,
            fuel,
            status,
            photos_json,
            brands(name),
            models(name)
          `,
        )
        .in("id", savedAdIds);

      if (adsError) {
        throw adsError;
      }

      const nextSavedAds = ((adsData || []) as unknown as SavedAd[]).sort(
        (a, b) => (b.year || 0) - (a.year || 0),
      );

      let alertsSupported = true;
      const preferencesByAdId: Record<string, SavedAdAlertPreference> = {};

      const { data: preferenceData, error: preferenceError } = await supabase
        .from("saved_ad_alert_preferences")
        .select(
          `
            ad_id,
            notify_price_drop,
            notify_status_change,
            notify_similar,
            notify_email,
            notify_push,
            paused,
            baseline_price_eur,
            baseline_status
          `,
        )
        .eq("user_id", user.id)
        .in("ad_id", savedAdIds);

      if (preferenceError) {
        alertsSupported = false;
      } else {
        for (const preference of (preferenceData || []) as SavedAdAlertPreference[]) {
          preferencesByAdId[preference.ad_id] = preference;
        }
      }

      const missingDefaults: SavedAdAlertPreference[] = [];
      for (const ad of nextSavedAds) {
        if (!preferencesByAdId[ad.id]) {
          const fallback = createDefaultPreference(ad);
          preferencesByAdId[ad.id] = fallback;
          missingDefaults.push(fallback);
        }
      }

      if (alertsSupported && missingDefaults.length > 0) {
        await supabase.from("saved_ad_alert_preferences").upsert(
          missingDefaults.map((item) => ({
            user_id: user.id,
            ad_id: item.ad_id,
            notify_price_drop: item.notify_price_drop,
            notify_status_change: item.notify_status_change,
            notify_similar: item.notify_similar,
            notify_email: item.notify_email,
            notify_push: item.notify_push,
            paused: item.paused,
            baseline_price_eur: item.baseline_price_eur,
            baseline_status: item.baseline_status,
          })),
          { onConflict: "user_id,ad_id" },
        );
      }

      setSavedState((prev) => ({
        ...prev,
        savedAds: nextSavedAds,
        preferences: preferencesByAdId,
        isLoading: false,
        alertsSupported,
      }));
    } catch (err) {
      console.error("Error loading saved ads:", err);
      setSavedState((prev) => ({
        ...prev,
        savedAds: [],
        preferences: {},
        isLoading: false,
      }));
    }
  }, [createDefaultPreference, savedAdIds, supabase, user]);

  useEffect(() => {
    void loadSavedAds();
  }, [loadSavedAds]);

  const getBrandName = (ad: SavedAd) => ad.brands?.name || t("unknown");
  const getModelName = (ad: SavedAd) => ad.models?.name || "";
  const getPhoto = (ad: SavedAd) => {
    if (ad.photos_json && ad.photos_json.length > 0) {
      return optimizeCloudflareImage(ad.photos_json[0], {
        width: 640,
        height: 400,
        fit: "cover",
        quality: 82,
        format: "auto",
      });
    }
    return "/placeholder-car.jpg";
  };
  const getFuelLabel = (fuel: string) => {
    const labels: Record<string, string> = {
      petrol: tFuel("petrol"),
      diesel: tFuel("diesel"),
      electric: tFuel("electric"),
      hybrid: tFuel("hybrid"),
      lpg: tFuel("lpg"),
      cng: tFuel("cng"),
    };
    return labels[fuel] || fuel;
  };

  const getStatusLabel = useCallback(
    (status: string) => {
      switch (status) {
        case "active":
          return t("active");
        case "sold":
          return t("sold");
        case "expired":
          return t("expired");
        case "pending":
          return t("pending");
        default:
          return status || t("unknown");
      }
    },
    [t],
  );

  const updatePreference = useCallback(
    async (adId: string, patch: Partial<SavedAdAlertPreference>) => {
      if (!user || !savedState.alertsSupported) return;

      const current = savedState.preferences[adId];
      if (!current) return;

      const optimistic = { ...current, ...patch };
      setSavedState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [adId]: optimistic,
        },
        updatingAdId: adId,
      }));

      const { error } = await supabase
        .from("saved_ad_alert_preferences")
        .update({
          notify_price_drop: optimistic.notify_price_drop,
          notify_status_change: optimistic.notify_status_change,
          notify_similar: optimistic.notify_similar,
          notify_email: optimistic.notify_email,
          notify_push: optimistic.notify_push,
          paused: optimistic.paused,
        })
        .eq("user_id", user.id)
        .eq("ad_id", adId);

      if (error) {
        console.error("Error updating alert preference:", error);
        setSavedState((prev) => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            [adId]: current,
          },
        }));
      }

      setSavedState((prev) => ({
        ...prev,
        updatingAdId: prev.updatingAdId === adId ? null : prev.updatingAdId,
      }));
    },
    [savedState.alertsSupported, savedState.preferences, supabase, user],
  );

  const applyPreferenceToAll = useCallback(
    async (patch: Partial<SavedAdAlertPreference>) => {
      if (!user || !savedState.alertsSupported || savedState.savedAds.length === 0) return;

      const previousPreferences = savedState.preferences;
      const adIds = savedState.savedAds.map((ad) => ad.id);
      const nextPreferences = { ...previousPreferences };

      for (const adId of adIds) {
        const current = nextPreferences[adId];
        if (!current) continue;
        nextPreferences[adId] = { ...current, ...patch };
      }

      setSavedState((prev) => ({
        ...prev,
        preferences: nextPreferences,
        isBulkUpdating: true,
      }));

      const { error } = await supabase
        .from("saved_ad_alert_preferences")
        .update({
          notify_price_drop: patch.notify_price_drop,
          notify_status_change: patch.notify_status_change,
          notify_similar: patch.notify_similar,
          notify_email: patch.notify_email,
          notify_push: patch.notify_push,
          paused: patch.paused,
        })
        .eq("user_id", user.id)
        .in("ad_id", adIds);

      if (error) {
        console.error("Error applying bulk alert preference update:", error);
        setSavedState((prev) => ({
          ...prev,
          preferences: previousPreferences,
        }));
      }

      setSavedState((prev) => ({
        ...prev,
        isBulkUpdating: false,
      }));
    },
    [savedState.alertsSupported, savedState.preferences, savedState.savedAds, supabase, user],
  );

  const handleUnsaveClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onUnsave(id);
  };

  const derivedSavedAds = useMemo(() => {
    return savedState.savedAds.map((ad) => {
      const preference = savedState.preferences[ad.id] || createDefaultPreference(ad);
      const baselinePrice =
        typeof preference.baseline_price_eur === "number"
          ? preference.baseline_price_eur
          : ad.price_eur;
      const priceDropAmount =
        baselinePrice && ad.price_eur < baselinePrice ? baselinePrice - ad.price_eur : 0;
      const hasPriceDropSignal =
        preference.notify_price_drop && !preference.paused && priceDropAmount > 0;
      const hasStatusChangeSignal =
        preference.notify_status_change &&
        !preference.paused &&
        Boolean(preference.baseline_status) &&
        preference.baseline_status !== ad.status;

      return {
        ad,
        preference,
        priceDropAmount,
        hasPriceDropSignal,
        hasStatusChangeSignal,
      };
    });
  }, [createDefaultPreference, savedState.preferences, savedState.savedAds]);

  const signalSummary = useMemo(() => {
    const priceDrops = derivedSavedAds.filter((row) => row.hasPriceDropSignal).length;
    const statusChanges = derivedSavedAds.filter((row) => row.hasStatusChangeSignal).length;
    const paused = derivedSavedAds.filter((row) => row.preference.paused).length;
    return { priceDrops, statusChanges, paused };
  }, [derivedSavedAds]);

  if (savedState.isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {["saved-skeleton-1", "saved-skeleton-2", "saved-skeleton-3"].map(
          (skeletonKey) => (
            <div
              key={skeletonKey}
              className="rounded-2xl border border-border overflow-hidden animate-pulse"
            >
              <div className="aspect-[16/10] bg-surface" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-surface rounded w-3/4" />
                <div className="h-4 bg-surface rounded w-1/2" />
                <div className="h-6 bg-surface rounded w-1/3" />
              </div>
            </div>
          ),
        )}
      </div>
    );
  }

  if (savedState.savedAds.length === 0) {
    return (
      <div className="text-center py-12">
        <HeartIcon className="w-16 h-16 mx-auto text-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">{t("savedAds")}</h3>
        <p className="text-secondary mb-4">{t("clickHeartToSave")}</p>
        <Link
          href="/vysledky"
          className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
        >
          {t("browseCars")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary">
              {t("savedAds")} ({savedState.savedAds.length})
            </h3>
            <p className="text-sm text-secondary">{t("savedAlertsDescription")}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="rounded-xl bg-background-muted px-3 py-2 text-center">
              <p className="font-semibold text-primary">{signalSummary.priceDrops}</p>
              <p className="text-tertiary">{t("priceDropped")}</p>
            </div>
            <div className="rounded-xl bg-background-muted px-3 py-2 text-center">
              <p className="font-semibold text-primary">{signalSummary.statusChanges}</p>
              <p className="text-tertiary">{t("statusChanged")}</p>
            </div>
            <div className="rounded-xl bg-background-muted px-3 py-2 text-center">
              <p className="font-semibold text-primary">{signalSummary.paused}</p>
              <p className="text-tertiary">{t("alertsPaused")}</p>
            </div>
          </div>
        </div>

        {!savedState.alertsSupported && (
          <p className="mt-4 text-sm text-warning">{t("alertsUnavailable")}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void applyPreferenceToAll({ paused: true });
            }}
            disabled={!savedState.alertsSupported || savedState.isBulkUpdating}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium text-primary disabled:opacity-50"
          >
            {t("pauseAllAlerts")}
          </button>
          <button
            type="button"
            onClick={() => {
              void applyPreferenceToAll({ paused: false });
            }}
            disabled={!savedState.alertsSupported || savedState.isBulkUpdating}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium text-primary disabled:opacity-50"
          >
            {t("resumeAllAlerts")}
          </button>
          <button
            type="button"
            onClick={() => {
              void applyPreferenceToAll({ notify_email: true, notify_push: false });
            }}
            disabled={!savedState.alertsSupported || savedState.isBulkUpdating}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium text-primary disabled:opacity-50"
          >
            {t("notifyByEmail")}
          </button>
          <button
            type="button"
            onClick={() => {
              void applyPreferenceToAll({ notify_email: false, notify_push: true });
            }}
            disabled={!savedState.alertsSupported || savedState.isBulkUpdating}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium text-primary disabled:opacity-50"
          >
            {t("notifyByPush")}
          </button>
        </div>

        {savedState.isBulkUpdating && (
          <p className="mt-3 text-xs text-tertiary">{t("updatingAlerts")}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {derivedSavedAds.map(
          ({ ad, preference, priceDropAmount, hasPriceDropSignal, hasStatusChangeSignal }) => (
            <div
              key={ad.id}
              className="rounded-2xl border border-border overflow-hidden bg-background hover:shadow-lg transition-all"
            >
              <Link href={`/auto/${ad.id}`} className="relative block aspect-[16/10] group">
                <Image
                  src={getPhoto(ad)}
                  alt={`${getBrandName(ad)} ${getModelName(ad)}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/auto/${ad.id}`}
                    className="font-semibold text-primary hover:text-accent transition-colors"
                  >
                    {getBrandName(ad)} {getModelName(ad)}
                  </Link>
                  <button
                    onClick={(e) => handleUnsaveClick(e, ad.id)}
                    className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-error hover:bg-error/10 transition-colors"
                    title={t("removeFromSaved")}
                  >
                    {t("removeFromSaved")}
                  </button>
                </div>
                <p className="text-sm text-secondary mt-1">
                  {ad.year} - {ad.mileage_km?.toLocaleString()} km - {ad.location_city || "Slovensko"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-bold text-accent">{ad.price_eur?.toLocaleString()} EUR</span>
                  <span className="inline-flex items-center rounded-full bg-background-muted px-2 py-0.5 text-xs font-medium text-secondary">
                    {getStatusLabel(ad.status)}
                  </span>
                </div>
                <p className="text-xs text-tertiary mt-2">{getFuelLabel(ad.fuel || "")}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {hasPriceDropSignal && (
                    <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      {t("priceDropped")}: -{Math.round(priceDropAmount).toLocaleString("sk-SK")} EUR
                    </span>
                  )}
                  {hasStatusChangeSignal && (
                    <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                      {t("statusChanged")}
                    </span>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-border-strong bg-background p-3.5 shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {t("alertSettings")}
                  </p>
                  <p className="mt-1 text-xs text-secondary">
                    {t("baselineAtSave")}: {preference.baseline_price_eur?.toLocaleString("sk-SK") || ad.price_eur?.toLocaleString("sk-SK")} EUR
                  </p>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-[13px] font-medium text-primary">
                      <span>{t("notifyOnPriceDrop")}</span>
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
                        checked={preference.notify_price_drop}
                        disabled={!savedState.alertsSupported || savedState.isBulkUpdating || savedState.updatingAdId === ad.id}
                        onChange={(e) => {
                          void updatePreference(ad.id, { notify_price_drop: e.target.checked });
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-[13px] font-medium text-primary">
                      <span>{t("notifyOnStatusChange")}</span>
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
                        checked={preference.notify_status_change}
                        disabled={!savedState.alertsSupported || savedState.isBulkUpdating || savedState.updatingAdId === ad.id}
                        onChange={(e) => {
                          void updatePreference(ad.id, { notify_status_change: e.target.checked });
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-[13px] font-medium text-primary">
                      <span>{t("notifyOnSimilarCars")}</span>
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
                        checked={preference.notify_similar}
                        disabled={!savedState.alertsSupported || savedState.isBulkUpdating || savedState.updatingAdId === ad.id}
                        onChange={(e) => {
                          void updatePreference(ad.id, { notify_similar: e.target.checked });
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-[13px] font-medium text-primary">
                      <span>{t("notifyByEmail")}</span>
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
                        checked={preference.notify_email}
                        disabled={!savedState.alertsSupported || savedState.isBulkUpdating || savedState.updatingAdId === ad.id}
                        onChange={(e) => {
                          void updatePreference(ad.id, { notify_email: e.target.checked });
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-[13px] font-medium text-primary">
                      <span>{t("pauseThisAlert")}</span>
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
                        checked={preference.paused}
                        disabled={!savedState.alertsSupported || savedState.isBulkUpdating || savedState.updatingAdId === ad.id}
                        onChange={(e) => {
                          void updatePreference(ad.id, { paused: e.target.checked });
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
// Messages Tab (functional)
type MessagesTabState = {
  conversations: ReturnType<typeof mapInquiriesToConversations>;
  activeConversation: string | null;
  isLoading: boolean;
  error: string;
};

function normalizeInquiryRows(data: unknown): InquiryRow[] {
  if (!Array.isArray(data)) return [];

  return data.map((entry) => {
    const row = entry as InquiryRow & { ads?: InquiryRow["ads"] | InquiryRow["ads"][] };
    const adValue = Array.isArray(row.ads) ? (row.ads[0] ?? null) : (row.ads ?? null);
    return { ...row, ads: adValue };
  });
}

function MessagesTab() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslations("dashboard");
  const [messagesState, setMessagesState] = useState<MessagesTabState>({
    conversations: [],
    activeConversation: null,
    isLoading: true,
    error: "",
  });
  const [reloadToken, setReloadToken] = useState(0);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString("sk-SK", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (diffDays === 1) return t("yesterday");
    return date.toLocaleDateString("sk-SK");
  };

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      if (!user?.id) {
        if (isCancelled) return;
        setMessagesState({
          conversations: [],
          activeConversation: null,
          isLoading: false,
          error: "",
        });
        return;
      }

      if (!isCancelled) {
        setMessagesState((prev) => ({ ...prev, isLoading: true, error: "" }));
      }

      const { data, error } = await supabase
        .from("inquiries")
        .select("id, sender_id, message, is_read, created_at, ads(id, brand, model, photos_json, seller_id)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (isCancelled) return;

      if (error) {
        setMessagesState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Nepodarilo sa nacitat spravy.",
        }));
        return;
      }

      const conversations = mapInquiriesToConversations(
        normalizeInquiryRows(data),
        user.id,
      );

      setMessagesState((prev) => {
        const hasActiveSelection =
          !!prev.activeConversation &&
          conversations.some((conv) => conv.id === prev.activeConversation);

        return {
          conversations,
          activeConversation: hasActiveSelection
            ? prev.activeConversation
            : (conversations[0]?.id ?? null),
          isLoading: false,
          error: "",
        };
      });
    };

    queueMicrotask(() => {
      void run();
    });

    return () => {
      isCancelled = true;
    };
  }, [supabase, user, reloadToken]);

  const activeConversation = messagesState.activeConversation
    ? messagesState.conversations.find(
        (conv) => conv.id === messagesState.activeConversation,
      ) || null
    : null;

  if (messagesState.isLoading) {
    return (
      <div className="space-y-3">
        {["messages-skeleton-1", "messages-skeleton-2", "messages-skeleton-3"].map(
          (key) => (
            <div
              key={key}
              className="h-20 rounded-xl border border-border bg-background-muted animate-pulse"
            />
          ),
        )}
      </div>
    );
  }

  if (messagesState.error) {
    return (
      <div className="rounded-2xl border border-error/30 bg-error/5 p-6 text-center">
        <p className="text-sm text-error mb-4">{messagesState.error}</p>
        <button
          type="button"
          onClick={() => {
            setReloadToken((value) => value + 1);
          }}
          className="px-5 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  if (messagesState.conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageIcon className="w-16 h-16 mx-auto text-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">
          {t("noMessages")}
        </h3>
        <p className="text-secondary">{t("messagesWillAppear")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-2">
        <h3 className="text-lg font-semibold text-primary mb-4">
          {t("conversations")}
        </h3>
        {messagesState.conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() =>
              setMessagesState((prev) => ({
                ...prev,
                activeConversation: conversation.id,
              }))
            }
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              messagesState.activeConversation === conversation.id
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/30"
            }`}
          >
            <div className="flex gap-3">
              <Image
                src={optimizeCloudflareImage(conversation.carPhoto, {
                  width: 96,
                  height: 96,
                  fit: "cover",
                  quality: 80,
                  format: "auto",
                })}
                alt={conversation.carTitle}
                width={48}
                height={48}
                className="rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-primary truncate">
                    {conversation.counterpartyLabel}
                  </span>
                  <span className="text-xs text-tertiary shrink-0">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-secondary truncate">
                  {conversation.carTitle}
                </p>
                <p className="text-sm text-tertiary truncate mt-1">
                  {conversation.lastMessage}
                </p>
              </div>
              {conversation.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0">
                  {conversation.unread}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="lg:col-span-2">
        {activeConversation ? (
          <div className="rounded-2xl border border-border h-full flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-4">
              <Image
                src={optimizeCloudflareImage(activeConversation.carPhoto, {
                  width: 96,
                  height: 96,
                  fit: "cover",
                  quality: 80,
                  format: "auto",
                })}
                alt={activeConversation.carTitle}
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
              <div>
                <p className="font-semibold text-primary">
                  {activeConversation.counterpartyLabel}
                </p>
                <p className="text-sm text-secondary">
                  {activeConversation.carTitle}
                </p>
              </div>
              {activeConversation.direction === "incoming" && (
                <span className="ml-auto px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  {t("yourAd")}
                </span>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto min-h-[300px] bg-surface/30">
              <div
                className={`flex ${
                  activeConversation.direction === "incoming"
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    activeConversation.direction === "incoming"
                      ? "bg-surface text-primary"
                      : "bg-accent text-white"
                  }`}
                >
                  <p className="text-sm">{activeConversation.lastMessage}</p>
                  <p
                    className={`text-xs mt-1 ${
                      activeConversation.direction === "incoming"
                        ? "text-tertiary"
                        : "text-white/70"
                    }`}
                  >
                    {formatTime(activeConversation.lastMessageTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-background-muted/60">
              <p className="text-xs text-secondary">
                Priama odpoved v dashboarde este nie je dostupna. Na komunikaciu
                pouzite kontaktne udaje v inzerate.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border h-full flex items-center justify-center p-12">
            <div className="text-center">
              <MessageIcon className="w-12 h-12 mx-auto text-tertiary mb-4" />
              <p className="text-secondary">{t("selectConversation")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
type SettingsProfile = { full_name?: string | null; phone?: string | null } | null;

type SettingsStatusMessage = {
  type: "success" | "error";
  text: string;
};

type SettingsTabState = {
  phone: string;
  isSaving: boolean;
  saveMessage: SettingsStatusMessage | null;
  newPassword: string;
  confirmPassword: string;
  passwordCode: string;
  isAwaitingPasswordCode: boolean;
  isUpdatingPassword: boolean;
  isSendingPasswordReset: boolean;
  passwordMessage: SettingsStatusMessage | null;
  deleteConfirm: string;
  isDeletingAccount: boolean;
  deleteMessage: SettingsStatusMessage | null;
};

type SettingsTabAction =
  | { type: "setPhone"; value: string }
  | { type: "setIsSaving"; value: boolean }
  | { type: "setSaveMessage"; value: SettingsStatusMessage | null }
  | { type: "setNewPassword"; value: string }
  | { type: "setConfirmPassword"; value: string }
  | { type: "setPasswordCode"; value: string }
  | { type: "setIsAwaitingPasswordCode"; value: boolean }
  | { type: "setIsUpdatingPassword"; value: boolean }
  | { type: "setIsSendingPasswordReset"; value: boolean }
  | { type: "setPasswordMessage"; value: SettingsStatusMessage | null }
  | { type: "setDeleteConfirm"; value: string }
  | { type: "setIsDeletingAccount"; value: boolean }
  | { type: "setDeleteMessage"; value: SettingsStatusMessage | null };

const REQUEST_TIMEOUT_MS = 15000;

function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (hasPlus) return `+${digitsOnly}`;
  if (digitsOnly.startsWith("421")) return `+${digitsOnly}`;
  if (digitsOnly.startsWith("0") && digitsOnly.length >= 9) {
    // Slovak local format: 09xx... -> +4219xx...
    return `+421${digitsOnly.slice(1)}`;
  }
  if (digitsOnly.length === 9) return `+421${digitsOnly}`;

  return trimmed;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(new Error("timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function isAal2RequiredError(errorMessage: string | undefined): boolean {
  if (!errorMessage) return false;
  const normalized = errorMessage.toLowerCase();
  return (
    (normalized.includes("aal2") && normalized.includes("required")) ||
    normalized.includes("reauthentication needed") ||
    normalized.includes("reauthentication_required")
  );
}

function settingsTabReducer(
  state: SettingsTabState,
  action: SettingsTabAction,
): SettingsTabState {
  switch (action.type) {
    case "setPhone":
      return { ...state, phone: action.value };
    case "setIsSaving":
      return { ...state, isSaving: action.value };
    case "setSaveMessage":
      return { ...state, saveMessage: action.value };
    case "setNewPassword":
      return { ...state, newPassword: action.value };
    case "setConfirmPassword":
      return { ...state, confirmPassword: action.value };
    case "setPasswordCode":
      return { ...state, passwordCode: action.value };
    case "setIsAwaitingPasswordCode":
      return { ...state, isAwaitingPasswordCode: action.value };
    case "setIsUpdatingPassword":
      return { ...state, isUpdatingPassword: action.value };
    case "setIsSendingPasswordReset":
      return { ...state, isSendingPasswordReset: action.value };
    case "setPasswordMessage":
      return { ...state, passwordMessage: action.value };
    case "setDeleteConfirm":
      return { ...state, deleteConfirm: action.value };
    case "setIsDeletingAccount":
      return { ...state, isDeletingAccount: action.value };
    case "setDeleteMessage":
      return { ...state, deleteMessage: action.value };
    default:
      return state;
  }
}

function createInitialSettingsTabState(profile: SettingsProfile): SettingsTabState {
  return {
    phone: profile?.phone || "",
    isSaving: false,
    saveMessage: null,
    newPassword: "",
    confirmPassword: "",
    passwordCode: "",
    isAwaitingPasswordCode: false,
    isUpdatingPassword: false,
    isSendingPasswordReset: false,
    passwordMessage: null,
    deleteConfirm: "",
    isDeletingAccount: false,
    deleteMessage: null,
  };
}

function SettingsStatusAlert({
  message,
  className = "",
}: {
  message: SettingsStatusMessage | null;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      className={`${className} px-4 py-2 rounded-lg text-sm font-medium ${
        message.type === "success"
          ? "bg-success/10 text-success"
          : "bg-error/10 text-error"
      }`}
    >
      {message.text}
    </div>
  );
}

function SettingsAccountInfoSection({ profile }: { profile: SettingsProfile }) {
  const t = useTranslations("dashboard");

  return (
    <div className="p-6 rounded-2xl border border-border bg-surface/50">
      <h2 className="text-lg font-semibold text-primary mb-4">{t("accountInfo")}</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-secondary">{t("name")}</span>
          <span className="font-medium text-primary">
            {profile?.full_name || t("notProvided")}
          </span>
        </div>
        <p className="text-xs text-tertiary">{t("contactAdminToChangeName")}</p>
      </div>
    </div>
  );
}

function SettingsContactInfoSection({
  phone,
  onPhoneChange,
  onPhoneBlur,
  saveMessage,
  onSave,
  isSaving,
}: {
  phone: string;
  onPhoneChange: (value: string) => void;
  onPhoneBlur: () => void;
  saveMessage: SettingsStatusMessage | null;
  onSave: () => void;
  isSaving: boolean;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  return (
    <div className="p-6 rounded-2xl border border-border">
      <h2 className="text-lg font-semibold text-primary mb-4">{t("contactInfo")}</h2>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div>
          <label
            htmlFor="dashboard-settings-phone"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("phoneNumber")}
          </label>
          <input
            id="dashboard-settings-phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            onBlur={onPhoneBlur}
            placeholder="+421 XXX XXX XXX"
            className="input"
            autoComplete="tel"
          />
          <p className="text-xs text-tertiary mt-1">{t("phoneVisibility")}</p>
        </div>

        <SettingsStatusAlert message={saveMessage} />

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isSaving ? tCommon("loading") : t("saveChanges")}
        </button>
      </form>
    </div>
  );
}

function SettingsSecuritySection({
  newPassword,
  confirmPassword,
  passwordCode,
  isAwaitingPasswordCode,
  isPasswordFormValid,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onPasswordCodeChange,
  passwordMessage,
  onChangePassword,
  isUpdatingPassword,
  isSendingPasswordReset,
}: {
  newPassword: string;
  confirmPassword: string;
  passwordCode: string;
  isAwaitingPasswordCode: boolean;
  isPasswordFormValid: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onPasswordCodeChange: (value: string) => void;
  passwordMessage: SettingsStatusMessage | null;
  onChangePassword: () => void;
  isUpdatingPassword: boolean;
  isSendingPasswordReset: boolean;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const isSubmitDisabled =
    isUpdatingPassword ||
    isSendingPasswordReset ||
    !isPasswordFormValid ||
    (isAwaitingPasswordCode && passwordCode.trim().length === 0);

  return (
    <div className="p-6 rounded-2xl border border-border bg-surface/50">
      <h2 className="text-lg font-semibold text-primary mb-4">{t("security")}</h2>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onChangePassword();
        }}
      >
        <div>
          <label
            htmlFor="dashboard-settings-new-password"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("newPassword")}
          </label>
          <input
            id="dashboard-settings-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            className="input"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <p className="text-xs text-tertiary mt-1">{t("passwordMinLength", { min: 6 })}</p>
        </div>
        <div>
          <label
            htmlFor="dashboard-settings-confirm-password"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("confirmPassword")}
          </label>
          <input
            id="dashboard-settings-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            className="input"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <p className="text-xs text-tertiary -mt-1">{t("passwordResetEmailHint")}</p>

        {isAwaitingPasswordCode && (
          <div>
            <label
              htmlFor="dashboard-settings-password-code"
              className="block text-sm font-medium text-primary mb-2"
            >
              {t("mfaCode")}
            </label>
            <input
              id="dashboard-settings-password-code"
              type="text"
              value={passwordCode}
              onChange={(e) =>
                onPasswordCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
          </div>
        )}

        <SettingsStatusAlert message={passwordMessage} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isUpdatingPassword || isSendingPasswordReset
              ? tCommon("loading")
              : isAwaitingPasswordCode
                ? t("verifyMfaAndChangePassword")
                : t("sendPasswordResetEmail")}
          </button>
        </div>
      </form>
    </div>
  );
}

function SettingsDangerZoneSection({
  onSignOut,
  deleteConfirm,
  onDeleteConfirmChange,
  deleteMessage,
  onDeleteAccount,
  isDeletingAccount,
}: {
  onSignOut: () => Promise<void>;
  deleteConfirm: string;
  onDeleteConfirmChange: (value: string) => void;
  deleteMessage: SettingsStatusMessage | null;
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  return (
    <div className="p-6 rounded-2xl border border-error/30 bg-error/5">
      <h2 className="text-lg font-semibold text-error mb-2">{t("dangerZone")}</h2>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-secondary mb-4">{t("logoutWarning")}</p>
          <button
            onClick={() => {
              void onSignOut();
            }}
            className="px-6 py-2.5 rounded-lg bg-error text-white font-semibold hover:bg-error/90 transition-colors"
          >
            {tCommon("logout")}
          </button>
        </div>

        <form
          className="pt-6 border-t border-error/20"
          onSubmit={(event) => {
            event.preventDefault();
            onDeleteAccount();
          }}
        >
          <h3 className="text-sm font-semibold text-error mb-2">{t("deleteAccount")}</h3>
          <p className="text-sm text-secondary mb-4">{t("deleteAccountWarning")}</p>
          <label
            htmlFor="dashboard-delete-confirm"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("deleteConfirmLabel")}
          </label>
          <input
            id="dashboard-delete-confirm"
            type="text"
            value={deleteConfirm}
            onChange={(e) => onDeleteConfirmChange(e.target.value)}
            className="input"
            placeholder="DELETE"
            autoComplete="off"
          />

          <SettingsStatusAlert message={deleteMessage} className="mt-4" />

          <button
            type="submit"
            disabled={isDeletingAccount || deleteConfirm.trim().toUpperCase() !== "DELETE"}
            className="mt-4 w-full px-6 py-2.5 rounded-lg bg-error text-white font-semibold hover:bg-error/90 transition-colors disabled:opacity-50"
          >
            {isDeletingAccount ? tCommon("loading") : t("deleteAccount")}
          </button>
        </form>
      </div>
    </div>
  );
}

// Settings Tab - simplified, name change removed per user request
function SettingsTab({
  profile,
  signOut,
}: {
  profile: SettingsProfile;
  signOut: () => Promise<void>;
}) {
  const { user, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslations("dashboard");
  const [state, dispatch] = useReducer(
    settingsTabReducer,
    profile,
    createInitialSettingsTabState,
  );
  const {
    phone,
    isSaving,
    saveMessage,
    newPassword,
    confirmPassword,
    passwordCode,
    isAwaitingPasswordCode,
    isUpdatingPassword,
    isSendingPasswordReset,
    passwordMessage,
    deleteConfirm,
    isDeletingAccount,
    deleteMessage,
  } = state;

  const isPasswordFormValid =
    newPassword.length >= 6 && confirmPassword.length >= 6 && newPassword === confirmPassword;

  const updatePasswordRequest = async (password: string, nonce?: string) => {
    const response = await withTimeout(
      fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          ...(nonce ? { nonce } : {}),
        }),
      }),
      REQUEST_TIMEOUT_MS,
    );

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    return { response, payload };
  };

  const clearPasswordForm = () => {
    dispatch({ type: "setNewPassword", value: "" });
    dispatch({ type: "setConfirmPassword", value: "" });
    dispatch({ type: "setPasswordCode", value: "" });
    dispatch({ type: "setIsAwaitingPasswordCode", value: false });
  };

  const handleSendPasswordResetEmail = async (): Promise<boolean> => {
    if (!user?.email) {
      dispatch({
        type: "setPasswordMessage",
        value: { type: "error", text: t("passwordResetEmailFailed") },
      });
      return false;
    }

    dispatch({ type: "setPasswordMessage", value: null });
    dispatch({ type: "setIsSendingPasswordReset", value: true });

    try {
      const { error } = await withTimeout(
        supabase.auth.reauthenticate(),
        REQUEST_TIMEOUT_MS,
      );

      if (error) {
        dispatch({
          type: "setPasswordMessage",
          value: {
            type: "error",
            text: error.message || t("passwordResetEmailFailed"),
          },
        });
        return false;
      }

      dispatch({ type: "setIsAwaitingPasswordCode", value: true });
      dispatch({
        type: "setPasswordMessage",
        value: { type: "success", text: t("passwordResetEmailSent") },
      });
      return true;
    } catch (err) {
      dispatch({
        type: "setPasswordMessage",
        value: {
          type: "error",
          text:
            err instanceof Error && err.message === "timeout"
              ? t("requestTimeout")
              : t("passwordResetEmailFailed"),
        },
      });
      return false;
    } finally {
      dispatch({ type: "setIsSendingPasswordReset", value: false });
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    dispatch({ type: "setIsUpdatingPassword", value: true });
    dispatch({ type: "setPasswordMessage", value: null });

    if (newPassword.length < 6) {
      dispatch({
        type: "setPasswordMessage",
        value: { type: "error", text: t("passwordMinLength", { min: 6 }) },
      });
      dispatch({ type: "setIsUpdatingPassword", value: false });
      return;
    }

    if (newPassword !== confirmPassword) {
      dispatch({
        type: "setPasswordMessage",
        value: { type: "error", text: t("passwordMismatch") },
      });
      dispatch({ type: "setIsUpdatingPassword", value: false });
      return;
    }

    try {
      if (!isAwaitingPasswordCode) {
        await handleSendPasswordResetEmail();
        return;
      }

      const nonce = passwordCode.trim();
      if (!/^\d{6}$/.test(nonce)) {
        dispatch({
          type: "setPasswordMessage",
          value: { type: "error", text: t("mfaCodeInvalid") },
        });
        return;
      }

      const { response, payload } = await updatePasswordRequest(newPassword, nonce);

      if (!response.ok) {
        if (isAal2RequiredError(payload?.error)) {
          await handleSendPasswordResetEmail();
          return;
        }

        const normalizedError = payload?.error?.toLowerCase() || "";
        if (
          normalizedError.includes("otp") ||
          normalizedError.includes("nonce") ||
          normalizedError.includes("reauthentication_not_valid")
        ) {
          dispatch({
            type: "setPasswordMessage",
            value: { type: "error", text: t("mfaCodeInvalid") },
          });
          return;
        }

        dispatch({
          type: "setPasswordMessage",
          value: {
            type: "error",
            text: payload?.error || t("passwordUpdateFailed"),
          },
        });
        return;
      }

      dispatch({
        type: "setPasswordMessage",
        value: { type: "success", text: t("passwordUpdated") },
      });
      clearPasswordForm();
    } catch (err) {
      dispatch({
        type: "setPasswordMessage",
        value: {
          type: "error",
          text:
            err instanceof Error && err.message === "timeout"
              ? t("requestTimeout")
              : t("passwordUpdateFailed"),
        },
      });
    } finally {
      dispatch({ type: "setIsUpdatingPassword", value: false });
    }
  };

  const handleSavePhone = async () => {
    if (!user) return;
    dispatch({ type: "setIsSaving", value: true });
    dispatch({ type: "setSaveMessage", value: null });

    try {
      const nextPhone = normalizePhoneNumber(phone);
      dispatch({ type: "setPhone", value: nextPhone });

      const response = await withTimeout(
        fetch("/api/account/phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: nextPhone.length ? nextPhone : null,
          }),
        }),
        REQUEST_TIMEOUT_MS,
      );

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok) {
        dispatch({
          type: "setSaveMessage",
          value: {
            type: "error",
            text: payload?.error || t("saveFailed"),
          },
        });
      } else {
        dispatch({
          type: "setSaveMessage",
          value: { type: "success", text: t("changesSaved") },
        });
        await refreshProfile().catch(() => undefined);
      }
    } catch (err) {
      dispatch({
        type: "setSaveMessage",
        value: {
          type: "error",
          text:
            err instanceof Error && err.message === "timeout"
              ? t("requestTimeout")
              : t("saveFailed"),
        },
      });
    } finally {
      dispatch({ type: "setIsSaving", value: false });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      dispatch({
        type: "setDeleteMessage",
        value: { type: "error", text: t("deleteConfirmMismatch") },
      });
      return;
    }

    dispatch({ type: "setIsDeletingAccount", value: true });
    dispatch({ type: "setDeleteMessage", value: null });

    try {
      const response = await withTimeout(
        fetch("/api/account/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: "DELETE" }),
        }),
        REQUEST_TIMEOUT_MS,
      );

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok) {
        dispatch({
          type: "setDeleteMessage",
          value: {
            type: "error",
            text: payload?.error || t("deleteFailed"),
          },
        });
        return;
      }

      dispatch({
        type: "setDeleteMessage",
        value: { type: "success", text: t("accountDeleted") },
      });
      window.location.href = "/";
    } catch (err) {
      dispatch({
        type: "setDeleteMessage",
        value: {
          type: "error",
          text:
            err instanceof Error && err.message === "timeout"
              ? t("requestTimeout")
              : t("deleteFailed"),
        },
      });
    } finally {
      dispatch({ type: "setIsDeletingAccount", value: false });
    }
  };

  return (
    <div className="max-w-lg space-y-8">
      <SettingsAccountInfoSection profile={profile} />
      <SettingsContactInfoSection
        phone={phone}
        onPhoneChange={(value) => dispatch({ type: "setPhone", value })}
        onPhoneBlur={() =>
          dispatch({ type: "setPhone", value: normalizePhoneNumber(phone) })
        }
        saveMessage={saveMessage}
        onSave={() => {
          void handleSavePhone();
        }}
        isSaving={isSaving}
      />
      <SettingsSecuritySection
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        passwordCode={passwordCode}
        isAwaitingPasswordCode={isAwaitingPasswordCode}
        isPasswordFormValid={isPasswordFormValid}
        onNewPasswordChange={(value) => dispatch({ type: "setNewPassword", value })}
        onConfirmPasswordChange={(value) =>
          dispatch({ type: "setConfirmPassword", value })
        }
        onPasswordCodeChange={(value) => dispatch({ type: "setPasswordCode", value })}
        passwordMessage={passwordMessage}
        onChangePassword={() => {
          void handleChangePassword();
        }}
        isUpdatingPassword={isUpdatingPassword}
        isSendingPasswordReset={isSendingPasswordReset}
      />
      <SettingsDangerZoneSection
        onSignOut={signOut}
        deleteConfirm={deleteConfirm}
        onDeleteConfirmChange={(value) =>
          dispatch({ type: "setDeleteConfirm", value })
        }
        deleteMessage={deleteMessage}
        onDeleteAccount={() => {
          void handleDeleteAccount();
        }}
        isDeletingAccount={isDeletingAccount}
      />
    </div>
  );
}


