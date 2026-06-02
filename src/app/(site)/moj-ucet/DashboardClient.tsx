"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  type FormEventHandler,
  type KeyboardEvent,
} from "react";
import { useForm } from "react-hook-form";
import type { FieldErrors, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/config/vat";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { toast } from "sonner";
import { buildAdPath } from "@/lib/cars/ad-path";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { createCsrfHeaders } from "@/lib/security/client-csrf";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import {
  createQuickEditFormSchema,
  type QuickEditFormData,
  type QuickEditFormInput,
} from "@/lib/validation/listings";
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
import TurnstileCaptcha from "@/components/security/TurnstileCaptcha";
import { SavedSearchesPanel } from "@/components/account/SavedSearchesPanel";
import {
  AdsIcon,
  SavedIcon,
  MessagesIcon,
  SettingsIcon,
} from "@/components/ui/DashboardIcons";
import type { ListingActionOperation } from "@/lib/pricing/config";

const EmbeddedAdWizard = dynamic(() => import("../pridat-inzerat/AdWizardClient"), {
  ssr: false,
});

interface DashboardClientProps {
  vinDecodingEnabled?: boolean;
  initialSearchParams?: string;
  initialTab?: string | null;
  submitted?: string | null;
  updated?: string | null;
}

type DealerMetaState = {
  hasDealer: boolean;
  name: string | null;
};

// Type definitions for ads
interface UserAd {
  id: string;
  brand?: string;
  model?: string;
  year: number;
  price_eur: number;
  mileage_km?: number;
  description?: string;
  fuel?: string;
  transmission?: string;
  location_city?: string;
  created_at?: string | null;
  status: string;
  moderation_rejection_note?: string | null;
  views?: number;
  views_count?: number;
  inquiries?: number;
  expires_at: string | null;
  is_top_ad: boolean;
  is_highlighted?: boolean;
  photo?: string;
  photos_json?: string[];
  brands?: { name: string };
  models?: { name: string };
}

type MyAdsTabUiState = {
  actionLoading: string | null;
  editingAd: UserAd | null;
  isSavingEdit: boolean;
  featureLoadingKey: string | null;
  resubmitLoading: string | null;
};

const initialMyAdsTabUiState: MyAdsTabUiState = {
  actionLoading: null,
  editingAd: null,
  isSavingEdit: false,
  featureLoadingKey: null,
  resubmitLoading: null,
};

function myAdsTabUiReducer(
  state: MyAdsTabUiState,
  patch: Partial<MyAdsTabUiState>,
): MyAdsTabUiState {
  return { ...state, ...patch };
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

type SavedTabCacheEntry = {
  key: string;
  savedAds: SavedAd[];
  preferences: Record<string, SavedAdAlertPreference>;
  alertsSupported: boolean;
};

const SAVED_TAB_CACHE = new Map<string, SavedTabCacheEntry>();

function sortAdsActiveFirst(ads: UserAd[]): UserAd[] {
  return ads.toSorted(
    (left, right) =>
      Number(right.status === "active") - Number(left.status === "active"),
  );
}

async function loadPricingSummaryConfig(): Promise<{
  prolong?: string;
  premium?: string;
  top?: string;
} | null> {
  const response = await fetch("/api/pricing/config", { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as
    | {
        summary?: {
          prolong?: string;
          premium?: string;
          top?: string;
        };
      }
    | null;

  return response.ok ? (payload?.summary ?? null) : null;
}

function buildSavedTabCacheKey(userId: string, adIds: string[]): string {
  const sortedIds = adIds.toSorted();
  return `${userId}:${sortedIds.join(",")}`;
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

const TABS_CONFIG = [
  { id: "ads", labelKey: "myAds", Icon: AdsIcon },
  { id: "create", labelKey: "addListingTab", Icon: PlusIcon },
  { id: "saved", labelKey: "savedCars", Icon: SavedIcon },
  { id: "messages", labelKey: "messages", Icon: MessagesIcon },
  { id: "settings", labelKey: "settings", Icon: SettingsIcon },
];

type MessageConversation = ReturnType<typeof mapInquiriesToConversations>[number];

type MessagesTabCacheEntry = {
  conversations: MessageConversation[];
  activeConversation: string | null;
};

const MESSAGES_TAB_CACHE = new Map<string, MessagesTabCacheEntry>();

function DashboardLoadingState() {
  return (
    <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="size-16 rounded-full bg-surface" />
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
        <h1 className="text-2xl font-semibold text-primary mb-4">{title}</h1>
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

export default function DashboardClient(props: DashboardClientProps) {
  return useDashboardClientView(props);
}

function useDashboardClientView({
  vinDecodingEnabled = false,
  initialSearchParams = "",
  initialTab = null,
  submitted = null,
  updated = null,
}: DashboardClientProps) {
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
  const [avatarErrorUrl, setAvatarErrorUrl] = useState<string | null>(null);

  // URL state management
  const { replace } = useRouter();
  const pathname = usePathname();
  const tabParam = initialTab;
  const isValidTabParam = tabParam
    ? TABS_CONFIG.some((tab) => tab.id === tabParam)
    : false;
  const activeTab = isValidTabParam && tabParam ? tabParam : "ads";
  const [dealerMeta, updateDealerMeta] = useReducer(
    (_state: DealerMetaState, nextState: DealerMetaState) => nextState,
    {
      hasDealer: false,
      name: null,
    },
  );
  const [pricingSummary, setPricingSummary] = useState({
    prolong: "Zadarmo / 28 dní",
    premium: "4,99 € / 28 dní",
    top: "9,99 € / 28 dní",
  });

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
                    description,
                    fuel,
                    transmission,
                    location_city,
                    status,
                    moderation_rejection_note,
                    views_count,
                    is_top_ad,
                    is_highlighted,
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
    let cancelled = false;

    async function loadDealerMeta() {
      if (!user) {
        updateDealerMeta({ hasDealer: false, name: null });
        return;
      }

      try {
        const { data, error } = await supabase
          .from("dealers")
          .select("id, name")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (cancelled) {
          return;
        }

        if (error || !data) {
          updateDealerMeta({ hasDealer: false, name: null });
          return;
        }

        updateDealerMeta({
          hasDealer: true,
          name: typeof data.name === "string" ? data.name : null,
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading dealer meta:", error);
          updateDealerMeta({ hasDealer: false, name: null });
        }
      }
    }

    void loadDealerMeta();

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  useEffect(() => {
    let cancelled = false;

    async function loadPricingSummary() {
      try {
        const summary = await loadPricingSummaryConfig();

        if (!cancelled && summary) {
          setPricingSummary({
            prolong: summary.prolong || "Zadarmo / 28 dní",
            premium: summary.premium || "4,99 € / 28 dní",
            top: summary.top || "9,99 € / 28 dní",
          });
        }
      } catch {
        // Keep default summary.
      }
    }

    void loadPricingSummary();

    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    if (!submitted && !updated) {
      return;
    }

    if (submitted === "1") {
      toast.success("Inzerát bol odoslaný na schválenie.");
    }
    if (updated === "1") {
      toast.success("Inzerát bol uložený.");
    }

    const params = new URLSearchParams(initialSearchParams);
    params.delete("submitted");
    params.delete("updated");
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [initialSearchParams, pathname, replace, submitted, updated]);

  // Sync URL with state
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab && tabParam === tabId) {
      return;
    }

    const params = new URLSearchParams(initialSearchParams);
    params.set("tab", tabId);
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeTab, initialSearchParams, pathname, replace, tabParam]);

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
    <main className="market-page pb-16 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          avatarUrl={avatarUrl ?? undefined}
          avatarErrorUrl={avatarErrorUrl}
          onAvatarError={setAvatarErrorUrl}
          avatarAlt={profile?.full_name || user.email || t("user") || "Používateľ"}
          userInitial={userInitial}
          dealerMeta={dealerMeta}
          dashboardHeading={t("dashboardHeading")}
          dealerDashboardAvailableLabel={t("dealerDashboardAvailable")}
          dealerDashboardLabel={t("dealerDashboard")}
          addListingLabel={tCommon("addListing")}
        />

        <DashboardTabNav
          activeTab={activeTab}
          pricingSummary={pricingSummary}
          onTabChange={handleTabChange}
          getLabel={(labelKey) => t(labelKey) || labelKey}
        />

        <section className={activeTab === "create" ? "" : "min-w-0"}>
          {activeTab === "ads" && (
            <MyAdsTab
              ads={adsState.userAds}
              isLoading={adsState.adsLoading}
              onRefresh={loadUserAds}
              pricingSummary={pricingSummary}
            />
          )}
          {activeTab === "create" && (
            <CreateListingTab vinDecodingEnabled={vinDecodingEnabled} />
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
        </section>
      </div>
    </main>
  );
}

function DashboardHeader({
  avatarUrl,
  avatarErrorUrl,
  onAvatarError,
  avatarAlt,
  userInitial,
  dealerMeta,
  dashboardHeading,
  dealerDashboardAvailableLabel,
  dealerDashboardLabel,
  addListingLabel,
}: {
  avatarUrl?: string;
  avatarErrorUrl: string | null;
  onAvatarError: (url: string | null) => void;
  avatarAlt: string;
  userInitial: string;
  dealerMeta: DealerMetaState;
  dashboardHeading: string;
  dealerDashboardAvailableLabel: string;
  dealerDashboardLabel: string;
  addListingLabel: string;
}) {
  return (
    <div className="market-panel mb-4 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-center gap-4">
        <div className="relative flex size-14 items-center justify-center overflow-hidden rounded-xl border border-primary/12 bg-primary/5 text-xl font-bold text-primary sm:size-16">
          {avatarUrl && avatarErrorUrl !== avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={avatarAlt}
              fill
              sizes="64px"
              className="object-cover"
              onError={() => onAvatarError(avatarUrl)}
            />
          ) : (
            userInitial
          )}
        </div>
        <div>
          <p className="market-kicker">Môj účet</p>
          <h1 className="mt-1 !text-3xl font-display font-semibold text-text-primary sm:!text-4xl">
            {dashboardHeading}
          </h1>
          {dealerMeta.hasDealer ? (
            <p className="mt-1 text-sm text-secondary">
              {dealerMeta.name
                ? `${dealerMeta.name} • ${dealerDashboardAvailableLabel}`
                : dealerDashboardAvailableLabel}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {dealerMeta.hasDealer ? (
          <Link
            href="/dealer"
            className="market-action-secondary inline-flex items-center gap-2 px-5 py-3 text-sm"
          >
            {dealerDashboardLabel}
          </Link>
        ) : null}
        <Link
          href="/moj-ucet?tab=create"
          className="market-action-primary hidden items-center gap-2 px-6 py-3 text-sm sm:inline-flex"
        >
          <PlusIcon className="size-5" />
          {addListingLabel}
        </Link>
      </div>
    </div>
  );
}

function DashboardTabNav({
  activeTab,
  pricingSummary,
  onTabChange,
  getLabel,
}: {
  activeTab: string;
  pricingSummary: { premium: string; top: string };
  onTabChange: (tabId: string) => void;
  getLabel: (labelKey: (typeof TABS_CONFIG)[number]["labelKey"]) => string;
}) {
  return (
    <div className="market-panel mb-5 p-2">
      <div className="mb-2 rounded-xl border border-accent/15 bg-accent/5 px-4 py-3 text-sm text-primary sm:hidden">
        Inzerát teraz zdarma. Premium {pricingSummary.premium}. Exclusive {pricingSummary.top}.
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
        {TABS_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all sm:justify-start ${
              activeTab === tab.id
                ? "border-transparent bg-primary text-white shadow-sm"
                : "border-border bg-background text-primary hover:bg-background-muted"
            }`}
          >
            <tab.Icon className="size-5" />
            {getLabel(tab.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

// My Ads Tab
type MyAdsTabProps = {
  ads: UserAd[];
  isLoading: boolean;
  onRefresh: () => void;
  pricingSummary: {
    prolong: string;
    premium: string;
    top: string;
  };
};

function MyAdsTab(props: MyAdsTabProps) {
  return useMyAdsTabView(props);
}

function useMyAdsTabView({
  ads,
  isLoading,
  onRefresh,
  pricingSummary,
}: MyAdsTabProps) {
  const { push } = useRouter();
  const { user } = useAuth();
  const [myAdsUiState, updateMyAdsUiState] = useReducer(
    myAdsTabUiReducer,
    initialMyAdsTabUiState,
  );
  const {
    actionLoading,
    editingAd,
    isSavingEdit,
    featureLoadingKey,
    resubmitLoading,
  } = myAdsUiState;
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const quickEditForm = useForm<QuickEditFormInput, unknown, QuickEditFormData>({
    resolver: zodResolver(
      createQuickEditFormSchema({
        invalidPrice: "Zadajte platnú cenu.",
        invalidMileage: "Zadajte platný počet kilometrov.",
        invalidDescription: "Popis je príliš dlhý.",
      }),
    ),
    defaultValues: {
      priceEur: "",
      mileageKm: "",
      description: "",
    },
  });
  const {
    register: registerQuickEditField,
    handleSubmit: handleQuickEditSubmit,
    reset: resetQuickEditForm,
    formState: { errors: quickEditErrors },
  } = quickEditForm;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: t("active"), class: "bg-success text-white" };
      case "sold":
        return { label: t("sold"), class: "bg-secondary text-white" };
      case "expired":
        return { label: t("expired"), class: "bg-error text-white" };
      case "pending":
        return { label: t("pending"), class: "bg-warning text-primary" };
      case "rejected":
        return { label: t("rejected"), class: "bg-error/15 text-error" };
      default:
        return { label: status, class: "bg-background-muted text-primary" };
    }
  };

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return null;
    const days = Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days > 0 ? days : 0;
  };

  const handleViewAd = (ad: UserAd) => {
    push(
      buildAdPath({
        id: ad.id,
        brand: getBrandName(ad),
        model: getModelName(ad),
        year: ad.year,
      }),
    );
  };

  const openQuickEdit = (ad: UserAd) => {
    updateMyAdsUiState({ editingAd: ad });
  };

  useEffect(() => {
    if (!editingAd) {
      resetQuickEditForm({
        priceEur: "",
        mileageKm: "",
        description: "",
      });
      return;
    }

    resetQuickEditForm({
      priceEur: String(editingAd.price_eur ?? ""),
      mileageKm:
        typeof editingAd.mileage_km === "number"
          ? String(editingAd.mileage_km)
          : "",
      description: editingAd.description ?? "",
    });
  }, [editingAd, resetQuickEditForm]);

  const closeQuickEdit = () => {
    if (isSavingEdit) return;
    updateMyAdsUiState({ editingAd: null });
    resetQuickEditForm({
      priceEur: "",
      mileageKm: "",
      description: "",
    });
  };

  const submitQuickEdit = handleQuickEditSubmit(async (values) => {
    if (!editingAd || !user?.id) return;

    updateMyAdsUiState({ isSavingEdit: true });
    try {
      const response = await fetch("/api/account/ads", {
        method: "PATCH",
        headers: createCsrfHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          mode: "quick",
          quickEdit: {
            adId: editingAd.id,
            priceEur: values.priceEur,
            mileageKm: values.mileageKm,
            description: values.description,
          },
        }),
      });

      await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(tErrors("generic"));
        return;
      }

      toast.success(tCommon("saved"));
      closeQuickEdit();
      onRefresh();
    } catch (error) {
      console.error("Quick edit failed:", error);
      toast.error(tErrors("generic"));
    } finally {
      updateMyAdsUiState({ isSavingEdit: false });
    }
  });

  const handleMarkAsSold = async (adId: string) => {
    updateMyAdsUiState({ actionLoading: adId });
    try {
      const response = await fetch("/api/account/ads/mark-sold", {
        method: "POST",
        headers: createCsrfHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ adId }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            adId?: string;
            sellerType?: "private" | "dealer";
            confirmationMethod?: "seller_dashboard_manual";
          }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || tErrors("generic"));
        return;
      }

      trackAnalyticsEvent("listing_marked_sold", {
        adId,
        markedVia: "dashboard",
      });
      if (payload?.sellerType && payload?.confirmationMethod) {
        trackAnalyticsEvent("sale_confirmed", {
          adId,
          sellerType: payload.sellerType,
          confirmationMethod: payload.confirmationMethod,
        });
      }
      onRefresh();
    } catch (err) {
      console.error("Error marking as sold:", err);
      toast.error(tErrors("generic"));
    } finally {
      updateMyAdsUiState({ actionLoading: null });
    }
  };

  const parsePriceValue = useCallback((label: string) => {
    const match = label.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
  }, []);

  const handleFeatureAction = useCallback(
    async (adId: string, operation: ListingActionOperation) => {
      if (!user?.id) return;

      const loadingKey = `${adId}:${operation}`;
      updateMyAdsUiState({ featureLoadingKey: loadingKey });

      try {
        const response = await fetch("/api/account/ads/apply-action", {
          method: "POST",
          headers: createCsrfHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ adId, operation }),
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              error?: string;
              checkoutRequired?: boolean;
              operation?: ListingActionOperation;
            }
          | null;

        if (!response.ok || !payload?.ok) {
          toast.error(payload?.error || tErrors("generic"));
          return;
        }

        if (payload.checkoutRequired && payload.operation) {
          const idempotencyKey =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `checkout-${payload.operation}-${Date.now()}`;

          const checkoutResponse = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: createCsrfHeaders({
              "Content-Type": "application/json",
              "idempotency-key": idempotencyKey,
            }),
            body: JSON.stringify({
              type: "private_listing_action",
              adId,
              operation: payload.operation,
            }),
          });

          const checkoutPayload = (await checkoutResponse.json().catch(() => null)) as
            | { error?: string; url?: string }
            | null;

          if (!checkoutResponse.ok || !checkoutPayload?.url) {
            toast.error(checkoutPayload?.error || "Nepodarilo sa vytvoriť platbu.");
            return;
          }

          window.location.href = checkoutPayload.url;
          return;
        }

        if (operation === "prolong_premium" || operation === "prolong_top") {
          trackAnalyticsEvent("listing_feature_purchased", {
            adId,
            featureType: operation === "prolong_top" ? "exclusive" : "premium",
            purchaseSurface: "account_dashboard",
            valueEur:
              operation === "prolong_top"
                ? parsePriceValue(pricingSummary.top)
                : parsePriceValue(pricingSummary.premium),
          });
        }

        toast.success("Inzerát bol aktualizovaný.");
        onRefresh();
      } catch (err) {
        console.error("Error applying listing action:", err);
        toast.error(tErrors("generic"));
      } finally {
        updateMyAdsUiState({ featureLoadingKey: null });
      }
    },
    [onRefresh, parsePriceValue, pricingSummary.premium, pricingSummary.top, tErrors, user?.id],
  );

  const handleResubmitForApproval = async (ad: UserAd) => {
    updateMyAdsUiState({ resubmitLoading: ad.id });
    try {
      const response = await fetch("/api/account/ads/resubmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; status?: "active" | "pending" }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Nepodarilo sa znovu odoslať inzerát.");
        return;
      }

      const listingLifecyclePayload = {
        adId: ad.id,
        photosCount: ad.photos_json?.length || 0,
        brand: getBrandName(ad) || undefined,
        model: getModelName(ad) || undefined,
        locationCity: ad.location_city || undefined,
      };

      if (payload?.status === "active") {
        trackAnalyticsEvent("listing_published", listingLifecyclePayload);
        toast.success("Inzerát bol znovu publikovaný.");
      } else {
        trackAnalyticsEvent("listing_submitted", listingLifecyclePayload);
        toast.success("Inzerát bol znovu odoslaný na schválenie.");
      }

      onRefresh();
    } catch {
      toast.error("Nepodarilo sa znovu odoslať inzerát.");
    } finally {
      updateMyAdsUiState({ resubmitLoading: null });
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          "myads-skeleton-1",
          "myads-skeleton-2",
          "myads-skeleton-3",
          "myads-skeleton-4",
          "myads-skeleton-5",
        ].map(
          (skeletonKey) => (
          <div
            key={skeletonKey}
            className="market-card animate-pulse space-y-3 bg-background p-4"
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
        <div className="market-panel mx-auto max-w-xl p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-primary/12 bg-primary/5 text-primary">
            <CarIcon className="size-8" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-primary">
            {t("noAdsYet")}
          </h3>
          <p className="text-secondary mb-4">{t("addFirstAd")}</p>
          <Link
            href="/moj-ucet?tab=create"
            className="market-action-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
          >
            <PlusIcon className="size-5" />
            {t("addFirstListing")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ads.map((ad) => {
            const status = getStatusBadge(ad.status);
            const daysRemaining = getDaysRemaining(ad.expires_at);
            const isActionLoading = actionLoading === ad.id;

            return (
              <article
                key={ad.id}
                role="button"
                tabIndex={0}
                className="market-card cursor-pointer overflow-hidden bg-background"
                onClick={() => handleViewAd(ad)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleViewAd(ad);
                  }
                }}
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={getPhoto(ad)}
                    alt={`${getBrandName(ad)} ${getModelName(ad)}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
                  />
                  {ad.is_top_ad && (
                    <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                      Exclusive
                    </span>
                  )}
                  {ad.is_highlighted && (
                    <span className="absolute left-2 top-10 rounded-md bg-warning px-2 py-0.5 text-xs font-semibold text-primary">
                      Premium
                    </span>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-medium ${status.class}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">
                      {getBrandName(ad)} {getModelName(ad)}
                    </h3>
                    <p className="mt-1 text-base font-semibold text-primary">
                      {formatCurrency(ad.price_eur)}
                    </p>
                  </div>

                  {ad.status === "rejected" && ad.moderation_rejection_note ? (
                    <div className="rounded-xl border border-error/20 bg-error/5 p-3 text-sm">
                      <p className="font-semibold text-error">Dôvod zamietnutia</p>
                      <p className="mt-1 text-text-secondary">{ad.moderation_rejection_note}</p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-primary/80">
                    <span>{ad.year || t("notProvided")}</span>
                    <span>{formatMileage(ad.mileage_km)}</span>
                    <span className="capitalize">{ad.fuel || t("notProvided")}</span>
                    <span className="capitalize">{ad.transmission || t("notProvided")}</span>
                    <span>{ad.location_city || t("notProvided")}</span>
                    <span>{formatCreatedAt(ad.created_at)}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-primary/75">
                    <span className="flex items-center gap-1 rounded-full bg-background-muted px-2 py-1">
                      <EyeIcon className="size-4" />
                      {getViews(ad)}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-background-muted px-2 py-1">
                      <MessageIcon className="size-4" />
                      {getInquiries(ad)}
                    </span>
                    {daysRemaining !== null && (
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                          daysRemaining <= 3
                            ? "bg-error text-white"
                            : "bg-background-muted text-primary/75"
                        }`}
                      >
                        <ClockIcon className="size-4" />
                        {daysRemaining} {t("days")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={`/upravit-inzerat/${ad.id}`}
                      className="market-action-secondary min-h-10 px-3 py-1.5 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tCommon("edit")}
                    </Link>
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openQuickEdit(ad);
                      }}
                      className="market-action-secondary min-h-10 px-3 py-1.5 text-sm"
                    >
                      Rýchla úprava
                    </button>
                    {ad.status === "active" && (
                      <>
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleFeatureAction(ad.id, "prolong_top");
                          }}
                          disabled={featureLoadingKey === `${ad.id}:prolong_top`}
                          className="market-action-primary min-h-10 px-3 py-1.5 text-sm disabled:opacity-50"
                        >
                          {featureLoadingKey === `${ad.id}:prolong_top`
                            ? t("saving")
                            : `Exclusive ${pricingSummary.top}`}
                        </button>
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleFeatureAction(ad.id, "prolong_premium");
                          }}
                          disabled={featureLoadingKey === `${ad.id}:prolong_premium`}
                          className="market-action-secondary min-h-10 border-warning bg-warning/10 px-3 py-1.5 text-sm disabled:opacity-50"
                        >
                          {featureLoadingKey === `${ad.id}:prolong_premium`
                            ? t("saving")
                            : `Premium ${pricingSummary.premium}`}
                        </button>
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleFeatureAction(ad.id, "prolong_basic");
                          }}
                          disabled={featureLoadingKey === `${ad.id}:prolong_basic`}
                          className="market-action-secondary min-h-10 px-3 py-1.5 text-sm disabled:opacity-50"
                        >
                          {featureLoadingKey === `${ad.id}:prolong_basic`
                            ? t("saving")
                            : `Predĺžiť ${pricingSummary.prolong}`}
                        </button>
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleMarkAsSold(ad.id);
                          }}
                          disabled={isActionLoading}
                          className="market-action-primary min-h-10 px-3 py-1.5 text-sm disabled:opacity-50"
                        >
                          {isActionLoading ? t("saving") : t("markAsSold")}
                        </button>
                      </>
                    )}
                    {ad.status === "rejected" && (
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleResubmitForApproval(ad);
                        }}
                        disabled={resubmitLoading === ad.id}
                        className="market-action-secondary min-h-10 border-warning bg-warning/10 px-3 py-1.5 text-sm disabled:opacity-50"
                      >
                        {resubmitLoading === ad.id
                          ? "Odosielanie..."
                          : "Odoslať znova na schválenie"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <QuickEditAdModal
        isOpen={!!editingAd}
        isSaving={isSavingEdit}
        errors={quickEditErrors}
        onClose={closeQuickEdit}
        onSubmit={submitQuickEdit}
        registerField={registerQuickEditField}
        saveLabel={tCommon("save")}
        savingLabel={t("saving")}
      />
    </div>
  );
}

function QuickEditAdModal({
  isOpen,
  isSaving,
  errors,
  onClose,
  onSubmit,
  registerField,
  saveLabel,
  savingLabel,
}: {
  isOpen: boolean;
  isSaving: boolean;
  errors: FieldErrors<QuickEditFormInput>;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  registerField: UseFormRegister<QuickEditFormInput>;
  saveLabel: string;
  savingLabel: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Zavrieť rýchlu úpravu"
      />
      <div className="relative z-[121] w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-6">
        <h3 className="text-lg font-semibold text-primary">Rýchla úprava inzerátu</h3>
        <p className="mt-1 text-sm text-secondary">Upravte iba cenu, kilometre a popis.</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <QuickEditNumberField
            id="quick-edit-price"
            label="Cena (EUR)"
            min={1}
            required
            registration={registerField("priceEur")}
            error={errors.priceEur?.message}
          />
          <QuickEditNumberField
            id="quick-edit-mileage"
            label="Kilometre"
            min={0}
            registration={registerField("mileageKm")}
            error={errors.mileageKm?.message}
          />
          <div>
            <label htmlFor="quick-edit-description" className="mb-1 block text-sm font-medium text-primary">
              Popis
            </label>
            <textarea
              id="quick-edit-description"
              {...registerField("description")}
              rows={4}
              maxLength={4000}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            {errors.description ? (
              <p className="mt-1 text-xs text-error">{errors.description.message}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-background-muted disabled:opacity-60"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {isSaving ? savingLabel : saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickEditNumberField({
  id,
  label,
  min,
  required = false,
  registration,
  error,
}: {
  id: string;
  label: string;
  min: number;
  required?: boolean;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-primary">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        step={1}
        {...registration}
        className="h-10 w-full rounded-lg border border-border px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
        required={required}
      />
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}

function CreateListingTab({
  vinDecodingEnabled = false,
}: {
  vinDecodingEnabled?: boolean;
}) {
  return (
    <section>
      <EmbeddedAdWizard embedded vinDecodingEnabled={vinDecodingEnabled} />
    </section>
  );
}

// Saved Tab (functional with persistent state)
type SavedTabProps = {
  savedCarIds: Set<string>;
  onUnsave: (id: string) => void;
};

function SavedTab({
  savedCarIds,
  onUnsave,
}: SavedTabProps) {
  return useSavedTabView({ savedCarIds, onUnsave });
}

function useSavedTabView({
  savedCarIds,
  onUnsave,
}: SavedTabProps) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();
  const savedAdIds = useMemo(() => Array.from(savedCarIds), [savedCarIds]);
  const cacheKey = useMemo(
    () => (user ? buildSavedTabCacheKey(user.id, savedAdIds) : null),
    [savedAdIds, user],
  );
  const cachedState = cacheKey ? SAVED_TAB_CACHE.get(cacheKey) : null;
  const [savedState, setSavedState] = useState<{
    savedAds: SavedAd[];
    preferences: Record<string, SavedAdAlertPreference>;
    isLoading: boolean;
    alertsSupported: boolean;
    isBulkUpdating: boolean;
    updatingAdId: string | null;
  }>(() => ({
    savedAds: cachedState?.savedAds || [],
    preferences: cachedState?.preferences || {},
    isLoading: !cachedState,
    alertsSupported: cachedState?.alertsSupported ?? true,
    isBulkUpdating: false,
    updatingAdId: null,
  }));
  const t = useTranslations("dashboard");
  const tFuel = useTranslations("fuel");

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
    if (!user || !cacheKey) return;

    if (savedAdIds.length === 0) {
      SAVED_TAB_CACHE.set(cacheKey, {
        key: cacheKey,
        savedAds: [],
        preferences: {},
        alertsSupported: true,
      });
      setSavedState((prev) => ({
        ...prev,
        savedAds: [],
        preferences: {},
        isLoading: false,
      }));
      return;
    }

    const cached = SAVED_TAB_CACHE.get(cacheKey);
    setSavedState((prev) => ({
      ...prev,
      isLoading: !cached,
    }));

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
      SAVED_TAB_CACHE.set(cacheKey, {
        key: cacheKey,
        savedAds: nextSavedAds,
        preferences: preferencesByAdId,
        alertsSupported,
      });
    } catch (err) {
      console.error("Error loading saved ads:", err);
      setSavedState((prev) => ({
        ...prev,
        savedAds: [],
        preferences: {},
        isLoading: false,
      }));
    }
  }, [cacheKey, createDefaultPreference, savedAdIds, supabase, user]);

  useEffect(() => {
    if (!cacheKey) return;
    const cached = SAVED_TAB_CACHE.get(cacheKey);
    if (!cached) return;

    setSavedState((prev) => ({
      ...prev,
      savedAds: cached.savedAds,
      preferences: cached.preferences,
      alertsSupported: cached.alertsSupported,
      isLoading: false,
    }));
  }, [cacheKey]);

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
        case "rejected":
          return t("rejected");
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
              className="market-card animate-pulse overflow-hidden"
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
      <div className="market-panel mx-auto max-w-xl p-8 text-center sm:p-10">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-primary/12 bg-primary/5 text-primary">
          <HeartIcon className="size-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-primary">{t("savedAds")}</h3>
        <p className="text-secondary mb-4">{t("clickHeartToSave")}</p>
        <Link
          href="/vysledky"
          className="market-action-primary inline-flex px-6 py-3 text-sm"
        >
          {t("browseCars")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 rounded-xl border border-primary/10 bg-primary/5 p-4 sm:p-5">
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

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              void applyPreferenceToAll({ paused: true });
            }}
            disabled={!savedState.alertsSupported || savedState.isBulkUpdating}
            className="market-action-primary px-3 py-2 text-sm disabled:opacity-50"
          >
            {t("pauseAllAlerts")}
          </button>
          <button
            type="button"
            onClick={() => {
              void applyPreferenceToAll({ paused: false });
            }}
            disabled={!savedState.alertsSupported || savedState.isBulkUpdating}
            className="market-action-secondary border-primary bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {t("resumeAllAlerts")}
          </button>
          <button
            type="button"
            onClick={() => {
              void applyPreferenceToAll({ notify_email: true, notify_push: false });
            }}
            disabled={!savedState.alertsSupported || savedState.isBulkUpdating}
            className="market-action-primary px-3 py-2 text-sm disabled:opacity-50"
          >
            {t("notifyByEmail")}
          </button>
          <button
            type="button"
            onClick={() => {
              void applyPreferenceToAll({ notify_email: false, notify_push: true });
            }}
            disabled={!savedState.alertsSupported || savedState.isBulkUpdating}
            className="market-action-secondary border-primary bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
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
              className="market-card overflow-hidden bg-background"
            >
              <Link
                href={buildAdPath({
                  id: ad.id,
                  brand: getBrandName(ad),
                  model: getModelName(ad),
                  year: ad.year,
                })}
                className="relative block aspect-[16/10]"
              >
                <Image
                  src={getPhoto(ad)}
                  alt={`${getBrandName(ad)} ${getModelName(ad)}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={buildAdPath({
                      id: ad.id,
                      brand: getBrandName(ad),
                      model: getModelName(ad),
                      year: ad.year,
                    })}
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

                <div className="mt-4 rounded-xl border border-border-strong bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {t("alertSettings")}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        preference.paused
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {preference.paused ? t("alertsPaused") : t("active")}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-secondary">
                    {t("baselineAtSave")}: {preference.baseline_price_eur?.toLocaleString("sk-SK") || ad.price_eur?.toLocaleString("sk-SK")} EUR
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="flex items-center justify-between gap-3 rounded-lg bg-background-muted px-2.5 py-2 text-[12px] font-medium text-primary">
                      <span>{t("notifyOnPriceDrop")}</span>
                      <input
                        name={`saved-alert-price-drop-${ad.id}`}
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
                        checked={preference.notify_price_drop}
                        disabled={!savedState.alertsSupported || savedState.isBulkUpdating || savedState.updatingAdId === ad.id}
                        onChange={(e) => {
                          void updatePreference(ad.id, { notify_price_drop: e.target.checked });
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-lg bg-background-muted px-2.5 py-2 text-[12px] font-medium text-primary">
                      <span>{t("notifyOnStatusChange")}</span>
                      <input
                        name={`saved-alert-status-change-${ad.id}`}
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
                        checked={preference.notify_status_change}
                        disabled={!savedState.alertsSupported || savedState.isBulkUpdating || savedState.updatingAdId === ad.id}
                        onChange={(e) => {
                          void updatePreference(ad.id, { notify_status_change: e.target.checked });
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-lg bg-background-muted px-2.5 py-2 text-[12px] font-medium text-primary">
                      <span>{t("notifyOnSimilarCars")}</span>
                      <input
                        name={`saved-alert-similar-${ad.id}`}
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
                        checked={preference.notify_similar}
                        disabled={!savedState.alertsSupported || savedState.isBulkUpdating || savedState.updatingAdId === ad.id}
                        onChange={(e) => {
                          void updatePreference(ad.id, { notify_similar: e.target.checked });
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-lg bg-background-muted px-2.5 py-2 text-[12px] font-medium text-primary">
                      <span>{t("notifyByEmail")}</span>
                      <input
                        name={`saved-alert-email-${ad.id}`}
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
                        checked={preference.notify_email}
                        disabled={!savedState.alertsSupported || savedState.isBulkUpdating || savedState.updatingAdId === ad.id}
                        onChange={(e) => {
                          void updatePreference(ad.id, { notify_email: e.target.checked });
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-lg bg-background-muted px-2.5 py-2 text-[12px] font-medium text-primary sm:col-span-2">
                      <span>{t("pauseThisAlert")}</span>
                      <input
                        name={`saved-alert-pause-${ad.id}`}
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-border-strong accent-accent disabled:opacity-70"
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

      <SavedSearchesPanel />
    </div>
  );
}
// Messages Tab (functional)
type MessagesTabState = {
  conversations: MessageConversation[];
  activeConversation: string | null;
  isLoading: boolean;
  error: string;
};

type MessagesTabStateAction =
  | MessagesTabState
  | ((current: MessagesTabState) => MessagesTabState);

type MessagesTabUiState = {
  replyMessage: string;
  replyCaptchaToken: string | null;
  captchaInstanceKey: number;
  isSendingReply: boolean;
  isDeletingMessage: boolean;
  isUpdatingQualification: boolean;
  isMobileConversationOpen: boolean;
};

function messagesTabStateReducer(
  state: MessagesTabState,
  action: MessagesTabStateAction,
): MessagesTabState {
  return typeof action === "function" ? action(state) : action;
}

function messagesTabUiReducer(
  state: MessagesTabUiState,
  patch: Partial<MessagesTabUiState> | ((current: MessagesTabUiState) => MessagesTabUiState),
): MessagesTabUiState {
  return typeof patch === "function" ? patch(state) : { ...state, ...patch };
}

function normalizeInquiryRows(data: unknown): InquiryRow[] {
  if (!Array.isArray(data)) return [];

  return data.map((entry) => {
    const row = entry as InquiryRow & { ads?: InquiryRow["ads"] | InquiryRow["ads"][] };
    const adValue = Array.isArray(row.ads) ? (row.ads[0] ?? null) : (row.ads ?? null);
    return { ...row, ads: adValue };
  });
}

function mapProfileNames(data: unknown): Record<string, string> {
  if (!Array.isArray(data)) return {};
  const result: Record<string, string> = {};

  for (const entry of data) {
    const row = entry as { id?: string; full_name?: string | null };
    if (typeof row.id !== "string") continue;
    result[row.id] =
      typeof row.full_name === "string" && row.full_name.trim().length > 0
        ? row.full_name.trim()
        : "Používateľ";
  }

  return result;
}

function MessagesTab() {
  return useMessagesTabView();
}

function useMessagesTabView() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslations("dashboard");
  const userId = user?.id ?? null;
  const cachedMessages = userId ? MESSAGES_TAB_CACHE.get(userId) : null;
  const [messagesState, updateMessagesState] = useReducer(
    messagesTabStateReducer,
    {
      conversations: cachedMessages?.conversations || [],
      activeConversation:
        cachedMessages?.activeConversation || (cachedMessages?.conversations[0]?.id ?? null),
      isLoading: !cachedMessages,
      error: "",
    },
  );
  const [reloadToken, requestMessagesReload] = useReducer((value: number) => value + 1, 0);
  const [messageUiState, updateMessageUiState] = useReducer(messagesTabUiReducer, {
    replyMessage: "",
    replyCaptchaToken: null,
    captchaInstanceKey: 0,
    isSendingReply: false,
    isDeletingMessage: false,
    isUpdatingQualification: false,
    isMobileConversationOpen: false,
  });
  const {
    replyMessage,
    replyCaptchaToken,
    captchaInstanceKey,
    isSendingReply,
    isDeletingMessage,
    isUpdatingQualification,
    isMobileConversationOpen,
  } = messageUiState;

  useEffect(() => {
    if (!userId) {
      updateMessagesState({
        conversations: [],
        activeConversation: null,
        isLoading: false,
        error: "",
      });
      return;
    }

    const cached = MESSAGES_TAB_CACHE.get(userId);
    if (!cached) {
      updateMessagesState({
        conversations: [],
        activeConversation: null,
        isLoading: true,
        error: "",
      });
      return;
    }

    updateMessagesState({
      conversations: cached.conversations,
      activeConversation:
        cached.activeConversation || (cached.conversations[0]?.id ?? null),
      isLoading: false,
      error: "",
    });
  }, [userId]);

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
      if (!userId) {
        if (isCancelled) return;
        updateMessagesState({
          conversations: [],
          activeConversation: null,
          isLoading: false,
          error: "",
        });
        return;
      }

      if (!isCancelled) {
        updateMessagesState((prev) => ({
          ...prev,
          isLoading: prev.conversations.length === 0,
          error: "",
        }));
      }

      if (isCancelled) return;

      const { data, error } = await supabase
        .from("inquiries")
        .select(
          "id, sender_id, recipient_id, message, is_read, is_qualified, qualified_at, created_at, ads(id, brand, model, photos_json, seller_id)",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (!isCancelled) {
        if (error) {
          updateMessagesState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message || "Nepodarilo sa načítať správy.",
          }));
        } else {
          const inquiryRows = normalizeInquiryRows(data);
          const userIdSet = new Set<string>();
          for (const row of inquiryRows) {
            if (row.sender_id) {
              userIdSet.add(row.sender_id);
            }
            if (row.recipient_id) {
              userIdSet.add(row.recipient_id);
            }
          }
          const userIds = Array.from(userIdSet);

          let profileNames: Record<string, string> = {};
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", userIds);
            if (!isCancelled) {
              profileNames = mapProfileNames(profiles);
            }
          }

          if (!isCancelled) {
            const conversations = mapInquiriesToConversations(
              inquiryRows,
              userId,
              profileNames,
            );

            updateMessagesState((prev) => {
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
          }
        }
      }
    };

    queueMicrotask(() => {
      void run();
    });

    return () => {
      isCancelled = true;
    };
  }, [supabase, userId, reloadToken]);

  const activeConversation = messagesState.activeConversation
    ? messagesState.conversations.find(
        (conv) => conv.id === messagesState.activeConversation,
      ) || null
    : null;

  useEffect(() => {
    if (!userId) return;
    MESSAGES_TAB_CACHE.set(userId, {
      conversations: messagesState.conversations,
      activeConversation: messagesState.activeConversation,
    });
  }, [userId, messagesState.activeConversation, messagesState.conversations]);

  useEffect(() => {
    if (!activeConversation) {
      updateMessageUiState({ isMobileConversationOpen: false });
    }
  }, [activeConversation]);

  useEffect(() => {
    updateMessageUiState((current) => ({
      ...current,
      replyMessage: "",
      replyCaptchaToken: null,
      captchaInstanceKey: current.captchaInstanceKey + 1,
    }));
  }, [messagesState.activeConversation]);

  const markConversationRead = useCallback(
    async (conversationId: string, unread: number) => {
      if (unread === 0) return;

      updateMessagesState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, unread: 0 } : conv,
        ),
      }));

      await supabase.from("inquiries").update({ is_read: true }).eq("id", conversationId);
    },
    [supabase],
  );

  const sendReply = useCallback(async () => {
    if (!activeConversation?.adId || !activeConversation.counterpartyId) {
      toast.error("Nie je možné odoslať odpoveď pre túto správu.");
      return;
    }

    if (!replyMessage.trim()) {
      return;
    }

    if (!replyCaptchaToken) {
      toast.error("Pred odoslaním potvrďte captcha.");
      return;
    }

    updateMessageUiState({ isSendingReply: true });
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adId: activeConversation.adId,
          recipientId: activeConversation.counterpartyId,
          message: replyMessage,
          captchaToken: replyCaptchaToken,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Nepodarilo sa odoslať odpoveď.");
        return;
      }

      toast.success("Odpoveď bola odoslaná.");
      updateMessageUiState((current) => ({
        ...current,
        replyMessage: "",
        replyCaptchaToken: null,
        captchaInstanceKey: current.captchaInstanceKey + 1,
      }));
      requestMessagesReload();
    } catch {
      toast.error("Nepodarilo sa odoslať odpoveď.");
    } finally {
      updateMessageUiState({ isSendingReply: false });
    }
  }, [activeConversation, replyCaptchaToken, replyMessage]);

  const handleDeleteMessage = useCallback(async () => {
    if (!activeConversation?.inquiryId) return;

    const confirmed = window.confirm("Naozaj chcete vymazať túto správu?");
    if (!confirmed) return;

    updateMessageUiState({ isDeletingMessage: true });
    try {
      const response = await fetch(
        `/api/inquiries?inquiryId=${encodeURIComponent(activeConversation.inquiryId)}`,
        { method: "DELETE" },
      );
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Nepodarilo sa vymazať správu.");
        return;
      }

      toast.success("Správa bola vymazaná.");
      requestMessagesReload();
    } catch {
      toast.error("Nepodarilo sa vymazať správu.");
    } finally {
      updateMessageUiState({ isDeletingMessage: false });
    }
  }, [activeConversation]);

  const handleQualificationToggle = useCallback(async () => {
    if (!activeConversation?.inquiryId || !activeConversation.adId) return;
    if (!activeConversation.canQualify) return;

    updateMessageUiState({ isUpdatingQualification: true });
    try {
      const nextQualified = !activeConversation.isQualified;
      const response = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: activeConversation.inquiryId,
          isQualified: nextQualified,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            inquiryId?: string;
            adId?: string;
            isQualified?: boolean;
            wasQualifiedBefore?: boolean;
          }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Nepodarilo sa upraviť kvalitu leadu.");
        return;
      }

      const resolvedQualified = Boolean(payload?.isQualified);
      updateMessagesState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conversation) =>
          conversation.id === activeConversation.inquiryId
            ? {
                ...conversation,
                isQualified: resolvedQualified,
                qualifiedAt: resolvedQualified ? new Date().toISOString() : null,
              }
            : conversation,
        ),
      }));

      if (resolvedQualified) {
        if (!payload?.wasQualifiedBefore) {
          trackAnalyticsEvent("lead_qualified", {
            leadId: activeConversation.inquiryId,
            adId: activeConversation.adId,
            qualificationMethod: "seller_dashboard_manual",
          });
        }
        toast.success(t("leadQualifiedSuccess"));
      } else {
        toast.success(t("leadQualificationRemoved"));
      }
    } catch {
      toast.error("Nepodarilo sa upraviť kvalitu leadu.");
    } finally {
      updateMessageUiState({ isUpdatingQualification: false });
    }
  }, [activeConversation, t]);

  const handleReplyKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isSendingReply && replyMessage.trim() && replyCaptchaToken) {
        void sendReply();
      }
    }
  };

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
      <div className="rounded-xl border border-error/30 bg-error/5 p-6 text-center">
        <p className="text-sm text-error mb-4">{messagesState.error}</p>
        <button
          type="button"
          onClick={() => {
            requestMessagesReload();
          }}
          className="market-action-primary px-5 py-2 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (messagesState.conversations.length === 0) {
    return (
      <div className="market-panel mx-auto max-w-xl p-8 text-center sm:p-10">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-primary/12 bg-primary/5 text-primary">
          <MessageIcon className="size-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-primary">
          {t("noMessages")}
        </h3>
        <p className="text-secondary">{t("messagesWillAppear")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div
        className={`${isMobileConversationOpen ? "hidden lg:block" : "block"} lg:col-span-1 space-y-2`}
      >
        <h3 className="text-lg font-semibold text-primary mb-4">
          {t("conversations")}
        </h3>
        {messagesState.conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => {
              updateMessagesState((prev) => ({
                ...prev,
                activeConversation: conversation.id,
              }));
              updateMessageUiState({ isMobileConversationOpen: true });
              void markConversationRead(conversation.id, conversation.unread);
            }}
            className={`w-full rounded-xl border p-4 text-left transition-all ${
              messagesState.activeConversation === conversation.id
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/30"
            }`}
          >
            <div className="flex gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={optimizeCloudflareImage(conversation.carPhoto, {
                    width: 96,
                    height: 96,
                    fit: "cover",
                    quality: 80,
                    format: "auto",
                  })}
                  alt={conversation.carTitle}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-primary truncate">
                    {conversation.counterpartyName}
                  </span>
                  <span className="text-xs text-tertiary shrink-0">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-secondary truncate">
                  {conversation.carTitle}
                </p>
                <p className="text-xs text-tertiary truncate mt-0.5">
                  ID: {conversation.adReference}
                </p>
                <p className="text-sm text-tertiary truncate mt-1">
                  {conversation.lastMessage}
                </p>
              </div>
              {conversation.unread > 0 && (
                <span className="size-5 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0">
                  {conversation.unread}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className={`${isMobileConversationOpen ? "block" : "hidden lg:block"} lg:col-span-2`}>
        {activeConversation ? (
          <div className="market-card flex h-full flex-col">
            <div className="p-4 border-b border-border">
              <button
                type="button"
                onClick={() => updateMessageUiState({ isMobileConversationOpen: false })}
                className="market-action-secondary mb-3 inline-flex min-h-10 items-center px-3 py-1 text-xs lg:hidden"
              >
                Späť na {t("conversations")}
              </button>
              <div className="flex items-center gap-4">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={optimizeCloudflareImage(activeConversation.carPhoto, {
                      width: 96,
                      height: 96,
                      fit: "cover",
                      quality: 80,
                      format: "auto",
                    })}
                    alt={activeConversation.carTitle}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div>
                  <p className="font-semibold text-primary">
                    {activeConversation.counterpartyName}
                  </p>
                  <p className="text-sm text-secondary">
                    {activeConversation.carTitle}
                  </p>
                  <p className="text-xs text-tertiary mt-1">
                    ID inzerátu: {activeConversation.adReference}
                  </p>
                </div>
                {activeConversation.direction === "incoming" && (
                  <span className="ml-auto rounded-md bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {t("yourAd")}
                  </span>
                )}
                {activeConversation.isQualified && (
                  <span className="rounded-md bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    {t("qualifiedLead")}
                  </span>
                )}
              </div>
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
                  <p className="text-xs uppercase tracking-wide font-semibold mb-1 opacity-80">
                    {activeConversation.senderName}
                  </p>
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

            <div className="p-4 border-t border-border bg-background-muted/60 space-y-3">
              <textarea
                id="dashboard-reply-message"
                name="dashboard-reply-message"
                rows={3}
                value={replyMessage}
                onChange={(event) => updateMessageUiState({ replyMessage: event.target.value })}
                onKeyDown={handleReplyKeyDown}
                placeholder="Napíšte odpoveď..."
                className="input resize-none"
              />
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="mb-2 text-xs text-secondary">
                  Pred odoslaním potvrďte captcha.
                </p>
                <TurnstileCaptcha
                  key={`dashboard-reply-${captchaInstanceKey}`}
                  onTokenChange={(token) => updateMessageUiState({ replyCaptchaToken: token })}
                  action="inquiry_submit"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div>
                  <p className="text-xs text-secondary">
                    Enter odošle správu, Shift+Enter vloží nový riadok.
                  </p>
                  {activeConversation.canQualify ? (
                    <p className="mt-1 text-xs text-secondary">
                      {activeConversation.isQualified
                        ? t("leadQualifiedHelp")
                        : t("leadNotQualifiedHelp")}
                    </p>
                  ) : null}
                  {!replyCaptchaToken ? (
                    <p className="mt-1 text-xs text-accent">
                      Odoslanie sa aktivuje po potvrdení captcha.
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {activeConversation.canQualify ? (
                    <button
                      type="button"
                      onClick={() => void handleQualificationToggle()}
                      disabled={isUpdatingQualification}
                    className={`market-action-secondary px-4 py-2 text-sm disabled:opacity-50 ${
                        activeConversation.isQualified
                          ? "border border-success/30 text-success hover:bg-success/5"
                          : "border border-border text-primary hover:bg-background"
                      }`}
                    >
                      {isUpdatingQualification
                        ? t("saving")
                        : activeConversation.isQualified
                          ? t("removeLeadQualification")
                          : t("markLeadQualified")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void sendReply()}
                    disabled={isSendingReply || !replyMessage.trim() || !replyCaptchaToken}
                    className="market-action-primary px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {isSendingReply ? "Odosielanie..." : "Odpovedať"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteMessage()}
                    disabled={isDeletingMessage}
                    className="market-action-secondary border-error/30 px-4 py-2 text-sm text-error hover:bg-error/5 disabled:opacity-50"
                  >
                    {isDeletingMessage ? "Mažem..." : "Vymazať správu"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="market-card flex h-full items-center justify-center p-12">
            <div className="text-center">
              <MessageIcon className="size-12 mx-auto text-tertiary mb-4" />
              <p className="text-secondary">{t("selectConversation")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
type SettingsProfile = {
  full_name?: string | null;
  phone?: string | null;
  notify_moderation_email?: boolean;
} | null;

type SettingsStatusMessage = {
  type: "success" | "error";
  text: string;
};

type SettingsTabState = {
  phone: string;
  notifyModerationEmail: boolean;
  isSaving: boolean;
  saveMessage: SettingsStatusMessage | null;
  newPassword: string;
  confirmPassword: string;
  isUpdatingPassword: boolean;
  passwordMessage: SettingsStatusMessage | null;
  deleteConfirm: string;
  isDeletingAccount: boolean;
  deleteMessage: SettingsStatusMessage | null;
};

type SettingsTabAction =
  | { type: "setPhone"; value: string }
  | { type: "setNotifyModerationEmail"; value: boolean }
  | { type: "setIsSaving"; value: boolean }
  | { type: "setSaveMessage"; value: SettingsStatusMessage | null }
  | { type: "setNewPassword"; value: string }
  | { type: "setConfirmPassword"; value: string }
  | { type: "setIsUpdatingPassword"; value: boolean }
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

function settingsTabReducer(
  state: SettingsTabState,
  action: SettingsTabAction,
): SettingsTabState {
  switch (action.type) {
    case "setPhone":
      return { ...state, phone: action.value };
    case "setNotifyModerationEmail":
      return { ...state, notifyModerationEmail: action.value };
    case "setIsSaving":
      return { ...state, isSaving: action.value };
    case "setSaveMessage":
      return { ...state, saveMessage: action.value };
    case "setNewPassword":
      return { ...state, newPassword: action.value };
    case "setConfirmPassword":
      return { ...state, confirmPassword: action.value };
    case "setIsUpdatingPassword":
      return { ...state, isUpdatingPassword: action.value };
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
    notifyModerationEmail: profile?.notify_moderation_email !== false,
    isSaving: false,
    saveMessage: null,
    newPassword: "",
    confirmPassword: "",
    isUpdatingPassword: false,
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
    <div className="market-card bg-surface/50 p-6">
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
  notifyModerationEmail,
  onPhoneChange,
  onPhoneBlur,
  onNotifyModerationEmailChange,
  saveMessage,
  onSave,
  isSaving,
}: {
  phone: string;
  notifyModerationEmail: boolean;
  onPhoneChange: (value: string) => void;
  onPhoneBlur: () => void;
  onNotifyModerationEmailChange: (value: boolean) => void;
  saveMessage: SettingsStatusMessage | null;
  onSave: () => void;
  isSaving: boolean;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  return (
    <div className="market-card p-6">
      <h2 className="text-lg font-semibold text-primary mb-4">{t("contactInfo")}</h2>
      <form
        className="space-y-4"
        action={() => {
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
            name="phone"
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

        <label className="flex items-start gap-3 rounded-xl border border-border p-4">
          <input
            type="checkbox"
            aria-label="Email pri schválení alebo zamietnutí inzerátu"
            checked={notifyModerationEmail}
            onChange={(event) => onNotifyModerationEmailChange(event.target.checked)}
            className="mt-1"
          />
          <div>
            <p className="text-sm font-medium text-primary">
              Email pri schválení alebo zamietnutí inzerátu
            </p>
            <p className="mt-1 text-xs text-tertiary">
              Keď moderácia zmení stav vášho inzerátu, pošleme vám email s výsledkom.
            </p>
          </div>
        </label>

        <SettingsStatusAlert message={saveMessage} />

        <button
          type="submit"
          disabled={isSaving}
          className="market-action-primary px-6 py-2.5 disabled:opacity-50"
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
  isPasswordFormValid,
  onNewPasswordChange,
  onConfirmPasswordChange,
  passwordMessage,
  onChangePassword,
  isUpdatingPassword,
}: {
  newPassword: string;
  confirmPassword: string;
  isPasswordFormValid: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  passwordMessage: SettingsStatusMessage | null;
  onChangePassword: () => void;
  isUpdatingPassword: boolean;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const isSubmitDisabled = isUpdatingPassword || !isPasswordFormValid;

  return (
    <div className="market-card bg-surface/50 p-6">
      <h2 className="text-lg font-semibold text-primary mb-4">{t("security")}</h2>
      <form
        className="space-y-4"
        action={() => {
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
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            className="input"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
          <p className="text-xs text-tertiary mt-1">
            {t("passwordMinLength", { min: MIN_PASSWORD_LENGTH })}
          </p>
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
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            className="input"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        </div>
        <p className="text-xs text-tertiary -mt-1">{t("passwordDirectSetHint")}</p>

        <SettingsStatusAlert message={passwordMessage} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="market-action-primary px-6 py-2.5 disabled:opacity-50"
          >
            {isUpdatingPassword ? tCommon("loading") : t("changePassword")}
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
    <div className="rounded-xl border border-error/30 bg-error/5 p-6">
      <h2 className="text-lg font-semibold text-error mb-2">{t("dangerZone")}</h2>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-secondary mb-4">{t("logoutWarning")}</p>
          <button
            onClick={() => {
              void onSignOut();
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-error px-6 py-2.5 font-semibold text-white transition-colors hover:bg-error/90"
          >
            {tCommon("logout")}
          </button>
        </div>

        <form
          className="pt-6 border-t border-error/20"
          action={() => {
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
            name="deleteConfirm"
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
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-error px-6 py-2.5 font-semibold text-white transition-colors hover:bg-error/90 disabled:opacity-50"
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
  const t = useTranslations("dashboard");
  const [state, dispatch] = useReducer(
    settingsTabReducer,
    profile,
    createInitialSettingsTabState,
  );
  const {
    phone,
    notifyModerationEmail,
    isSaving,
    saveMessage,
    newPassword,
    confirmPassword,
    isUpdatingPassword,
    passwordMessage,
    deleteConfirm,
    isDeletingAccount,
    deleteMessage,
  } = state;

  const isPasswordFormValid =
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword === confirmPassword;

  const handleChangePassword = async () => {
    if (!user) return;

    dispatch({ type: "setIsUpdatingPassword", value: true });
    dispatch({ type: "setPasswordMessage", value: null });

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      dispatch({
        type: "setPasswordMessage",
        value: {
          type: "error",
          text: t("passwordMinLength", { min: MIN_PASSWORD_LENGTH }),
        },
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
      const response = await withTimeout(
        fetch("/api/account/password", {
          method: "POST",
          headers: createCsrfHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            password: newPassword,
          }),
        }),
        REQUEST_TIMEOUT_MS,
      );
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
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
      dispatch({ type: "setNewPassword", value: "" });
      dispatch({ type: "setConfirmPassword", value: "" });
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

      const [phoneResponse, moderationNotificationResponse] = await Promise.all([
        withTimeout(
          fetch("/api/account/phone", {
            method: "POST",
            headers: createCsrfHeaders({
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({
              phone: nextPhone.length ? nextPhone : null,
            }),
          }),
          REQUEST_TIMEOUT_MS,
        ),
        withTimeout(
          fetch("/api/account/notifications/moderation", {
            method: "POST",
            headers: createCsrfHeaders({
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({
              notifyModerationEmail,
            }),
          }),
          REQUEST_TIMEOUT_MS,
        ),
      ]);

      const phonePayload = (await phoneResponse.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      const moderationPayload = (await moderationNotificationResponse.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!phoneResponse.ok || !moderationNotificationResponse.ok) {
        dispatch({
          type: "setSaveMessage",
          value: {
            type: "error",
            text:
              phonePayload?.error ||
              moderationPayload?.error ||
              t("saveFailed"),
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
          headers: createCsrfHeaders({
            "Content-Type": "application/json",
          }),
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
        notifyModerationEmail={notifyModerationEmail}
        onPhoneChange={(value) => dispatch({ type: "setPhone", value })}
        onPhoneBlur={() =>
          dispatch({ type: "setPhone", value: normalizePhoneNumber(phone) })
        }
        onNotifyModerationEmailChange={(value) =>
          dispatch({ type: "setNotifyModerationEmail", value })
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
        isPasswordFormValid={isPasswordFormValid}
        onNewPasswordChange={(value) => dispatch({ type: "setNewPassword", value })}
        onConfirmPasswordChange={(value) =>
          dispatch({ type: "setConfirmPassword", value })
        }
        passwordMessage={passwordMessage}
        onChangePassword={() => {
          void handleChangePassword();
        }}
        isUpdatingPassword={isUpdatingPassword}
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
