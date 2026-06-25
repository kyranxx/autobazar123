"use client";

import { useState, useEffect, useReducer, useTransition } from "react";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { toast } from "sonner";
import {
  clearAdminCache,
  getSiteSettings,
  getDealerVerificationRequests,
  runAdminCronJob,
  reviewDealerVerificationRequest,
  syncAdminSearchIndex,
  type AdminCronJobId,
  type AdminSystemActionResult,
  type DealerVerificationRequest,
  updateSiteSetting,
  type SiteSetting,
} from "../actions";
import Image from "next/image";
import {
  DEFAULT_PRICING_CONFIG_V1,
  parsePricingConfigValue,
  pricingCentsToEuroInput,
  pricingEuroInputToCents,
  serializePricingConfigValue,
  type PricingConfigV1,
} from "@/lib/pricing/config";

type AdminSettingsLocale = "sk" | "en";

type AdminSettingsCopy = {
  pricingTitle: string;
  activePhase: string;
  growthThreshold: string;
  listingDays: string;
  promotionDays: string;
  phasePrices: string;
  phases: Record<keyof PricingConfigV1["phases"], string>;
  basicPrice: string;
  prolongPrice: string;
  premiumPrice: string;
  topPrice: string;
  priceInEur: string;
  homepageTopLimit: string;
  resultsTopLimit: string;
  resultsPremiumLimit: string;
  dealerTopups: string;
  topupLabel: string;
  topupPrice: string;
  topupBonus: string;
  shortTexts: string;
  globalBanner: string;
  homepageSeller: string;
  dealerBalance: string;
  savePricing: string;
  savingPricing: string;
  pricingSaved: string;
  pricingError: string;
  dealerRequestsTitle: string;
  pendingSuffix: string;
  noDealerRequests: string;
  dealerNote: string;
  dealerNotePlaceholder: string;
  adminNote: string;
  approved: string;
  rejected: string;
  pending: string;
  approve: string;
  rejectWithNote: string;
  dealerApproved: string;
  dealerRejected: string;
  dealerReviewError: string;
  maintenanceTitle: string;
  maintenanceDescription: string;
  maintenanceEnabled: string;
  maintenanceDisabled: string;
  maintenanceToggle: string;
  maintenanceEnabledToast: string;
  maintenanceDisabledToast: string;
  maintenanceError: string;
  maintenanceBypassTitle: string;
  maintenanceBypassDescription: string;
  mfaUnavailableError: string;
  mfaEnabledToast: string;
  mfaDisabledToast: string;
  mfaDisableConfirm: string;
  mfaEnabledTitle: string;
  mfaEnabledDescription: string;
  mfaDisableButton: string;
  mfaTitle: string;
  mfaDescription: string;
  mfaStartButton: string;
  mfaResetButton: string;
  mfaQrAlt: string;
  mfaQrTitle: string;
  mfaQrDescription: string;
  mfaCodeInputLabel: string;
  mfaVerifyButton: string;
  mfaCancelButton: string;
  systemActionsTitle: string;
  systemActionFallbackError: string;
  cacheTitle: string;
  cacheDescription: string;
  cacheButton: string;
  searchTitle: string;
  searchDescription: string;
  searchButton: string;
  cronTitle: string;
  cronDescription: string;
  cronBadge: string;
  runManually: string;
  cronJobs: Record<AdminCronJobId, { label: string; help: string }>;
};

const ADMIN_SETTINGS_COPY: Record<AdminSettingsLocale, AdminSettingsCopy> = {
  sk: {
    pricingTitle: "Cenník a fázy",
    activePhase: "Aktívna fáza",
    growthThreshold: "Koľko aktívnych inzerátov spustí rastovú fázu",
    listingDays: "Trvanie inzerátu (dni)",
    promotionDays: "Trvanie Premium/Exclusive (dni)",
    phasePrices: "Ceny pre jednotlivé fázy",
    phases: {
      launch: "Launch - otvorenie trhu",
      growth: "Growth - rast trhu",
      mature: "Mature - stabilný trh",
    },
    basicPrice: "Cena Basic",
    prolongPrice: "Cena predĺženia",
    premiumPrice: "Cena Premium",
    topPrice: "Cena Exclusive",
    priceInEur: "Cena v EUR",
    homepageTopLimit: "Limit Exclusive na úvodnej stránke",
    resultsTopLimit: "Limit Exclusive vo výsledkoch",
    resultsPremiumLimit: "Limit Premium vo výsledkoch",
    dealerTopups: "Dobitie kreditu pre dealerov",
    topupLabel: "Názov balíka",
    topupPrice: "Cena dobitia",
    topupBonus: "Bonusový kredit",
    shortTexts: "Krátke texty na webe",
    globalBanner: "Horný banner",
    homepageSeller: "Text pre predajcov na úvodnej stránke",
    dealerBalance: "Text pri kredite dealera",
    savePricing: "Uložiť cenník",
    savingPricing: "Ukladám...",
    pricingSaved: "Cenník bol uložený",
    pricingError: "Nepodarilo sa uložiť cenník",
    dealerRequestsTitle: "Žiadosti o overenie dealerov",
    pendingSuffix: "čaká",
    noDealerRequests: "Zatiaľ neprišli žiadne žiadosti.",
    dealerNote: "Poznámka pre dealera",
    dealerNotePlaceholder: "Napíšte krátko, čo má dealer opraviť.",
    adminNote: "Admin poznámka",
    approved: "Schválené",
    rejected: "Zamietnuté",
    pending: "Čaká",
    approve: "Schváliť",
    rejectWithNote: "Zamietnuť s poznámkou",
    dealerApproved: "Dealer bol overený",
    dealerRejected: "Žiadosť bola zamietnutá",
    dealerReviewError: "Nepodarilo sa spracovať žiadosť",
    maintenanceTitle: "Údržbový režim",
    maintenanceDescription:
      "Použite len vtedy, keď musí byť verejný web dočasne zatvorený.",
    maintenanceEnabled: "Web je zatvorený",
    maintenanceDisabled: "Web je otvorený",
    maintenanceToggle: "Dočasne zatvoriť verejný web",
    maintenanceEnabledToast: "Verejný web je zatvorený",
    maintenanceDisabledToast: "Verejný web je otvorený",
    maintenanceError: "Nastavenie údržby sa nepodarilo zmeniť",
    maintenanceBypassTitle: "Serverové heslo",
    maintenanceBypassDescription:
      "Heslo nastavujeme v env MAINTENANCE_UNLOCK_PASSWORD. Admin tu neukladá žiadne heslo.",
    mfaUnavailableError:
      "Prihlasovanie kódom nie je v Supabase zapnuté.",
    mfaEnabledToast: "Prihlásenie kódom je zapnuté",
    mfaDisabledToast: "Prihlásenie kódom je vypnuté",
    mfaDisableConfirm: "Naozaj chcete vypnúť prihlasovanie kódom?",
    mfaEnabledTitle: "Prihlásenie kódom je zapnuté",
    mfaEnabledDescription:
      "Pri prihlásení do adminu zadáte aj kód z aplikácie.",
    mfaDisableButton: "Vypnúť prihlasovanie kódom",
    mfaTitle: "Ochrana admin účtu",
    mfaDescription:
      "Prihlásenie do adminu môžete chrániť kódom z Google Authenticator alebo inej aplikácie.",
    mfaStartButton: "Nastaviť prihlasovanie kódom",
    mfaResetButton: "Resetovať nastavenie",
    mfaQrAlt: "QR kód pre prihlasovanie do adminu",
    mfaQrTitle: "Naskenujte QR kód",
    mfaQrDescription:
      "Otvorte aplikáciu s kódmi a pridajte nový účet naskenovaním tohto kódu.",
    mfaCodeInputLabel: "Šesťmiestny kód z aplikácie",
    mfaVerifyButton: "Potvrdiť kód",
    mfaCancelButton: "Zrušiť",
    systemActionsTitle: "Servisné akcie",
    systemActionFallbackError:
      "Akcia zlyhala. Skúste to znovu alebo ju opravíme v kóde.",
    cacheTitle: "Obnoviť cache stránok",
    cacheDescription:
      "Obnoví verejné stránky a admin pre všetkých návštevníkov. Nemaže používateľov, inzeráty ani platby.",
    cacheButton: "Obnoviť",
    searchTitle: "Reindexovať Algoliu",
    searchDescription:
      "Pošle aktívne inzeráty z databázy do Algolie, aby vyhľadávanie sedelo s webom.",
    searchButton: "Reindexovať",
    cronTitle: "Crony bežia automaticky",
    cronDescription:
      "Vercel ich spúšťa podľa plánu. Ručné spustenie použite len pri kontrole alebo oprave.",
    cronBadge: "Vercel plán",
    runManually: "Spustiť ručne",
    cronJobs: {
      "expire-ads": {
        label: "Expirácie inzerátov",
        help: "Skontroluje staré aktívne inzeráty a skončené Premium/Exclusive.",
      },
      "cleanup-sold": {
        label: "Predané inzeráty",
        help: "Skryje staršie predané autá z verejného zoznamu.",
      },
      "send-alerts": {
        label: "Upozornenia",
        help: "Pošle upozornenia pre uložené autá a vyhľadávania.",
      },
      "process-email-jobs": {
        label: "Čakajúce e-maily",
        help: "Odošle e-maily, ktoré čakajú vo fronte.",
      },
    },
  },
  en: {
    pricingTitle: "Pricing and phases",
    activePhase: "Active phase",
    growthThreshold: "Active listings needed before the growth phase",
    listingDays: "Listing duration (days)",
    promotionDays: "Premium/Exclusive duration (days)",
    phasePrices: "Prices by phase",
    phases: {
      launch: "Market launch",
      growth: "Growth phase",
      mature: "Mature market",
    },
    basicPrice: "Basic price",
    prolongPrice: "Extension price",
    premiumPrice: "Premium price",
    topPrice: "Exclusive price",
    priceInEur: "Price in EUR",
    homepageTopLimit: "Homepage Exclusive limit",
    resultsTopLimit: "Results Exclusive limit",
    resultsPremiumLimit: "Results Premium limit",
    dealerTopups: "Dealer credit top-ups",
    topupLabel: "Package name",
    topupPrice: "Top-up price",
    topupBonus: "Bonus credit",
    shortTexts: "Short website text",
    globalBanner: "Top banner",
    homepageSeller: "Homepage seller text",
    dealerBalance: "Dealer credit text",
    savePricing: "Save pricing",
    savingPricing: "Saving...",
    pricingSaved: "Pricing was saved",
    pricingError: "Could not save pricing",
    dealerRequestsTitle: "Dealer verification requests",
    pendingSuffix: "waiting",
    noDealerRequests: "No requests yet.",
    dealerNote: "Dealer note",
    dealerNotePlaceholder: "Briefly explain what the dealer should fix.",
    adminNote: "Admin note",
    approved: "Approved",
    rejected: "Rejected",
    pending: "Waiting",
    approve: "Approve",
    rejectWithNote: "Reject with note",
    dealerApproved: "Dealer was verified",
    dealerRejected: "Request was rejected",
    dealerReviewError: "Could not process the request",
    maintenanceTitle: "Maintenance mode",
    maintenanceDescription:
      "Only use this when the public website must be temporarily closed.",
    maintenanceEnabled: "The public website is closed",
    maintenanceDisabled: "The public website is open",
    maintenanceToggle: "Temporarily close the public website",
    maintenanceEnabledToast: "The public website is closed",
    maintenanceDisabledToast: "The public website is open",
    maintenanceError: "Could not change maintenance mode",
    maintenanceBypassTitle: "Server password",
    maintenanceBypassDescription:
      "Set the password in MAINTENANCE_UNLOCK_PASSWORD. Admin does not store any password here.",
    mfaUnavailableError: "Code login is not enabled in Supabase settings.",
    mfaEnabledToast: "Code login is enabled",
    mfaDisabledToast: "Code login is disabled",
    mfaDisableConfirm: "Turn off code login for this admin account?",
    mfaEnabledTitle: "Code login is enabled",
    mfaEnabledDescription:
      "When signing in to admin, you also enter a code from your app.",
    mfaDisableButton: "Turn off code login",
    mfaTitle: "Admin account protection",
    mfaDescription:
      "Use a code app when signing in to admin, such as Google Authenticator or a similar app.",
    mfaStartButton: "Set up code login",
    mfaResetButton: "Reset setup",
    mfaQrAlt: "QR code for admin code login",
    mfaQrTitle: "Scan the QR code",
    mfaQrDescription:
      "Open your code app and add a new account by scanning this code.",
    mfaCodeInputLabel: "Six-digit code from the app",
    mfaVerifyButton: "Confirm code",
    mfaCancelButton: "Cancel",
    systemActionsTitle: "Service actions",
    systemActionFallbackError:
      "Action failed. Try again or we will fix it in code.",
    cacheTitle: "Page cache",
    cacheDescription:
      "Refresh pages for visitors and admins. Does not delete users, listings, or payments.",
    cacheButton: "Refresh pages",
    searchTitle: "Search index",
    searchDescription:
      "Update Algolia from active database listings so website search matches the current ads.",
    searchButton: "Update Algolia",
    cronTitle: "Cron runs automatically",
    cronDescription:
      "Vercel runs these jobs on schedule. Use manual run only for checks or fixes.",
    cronBadge: "Vercel schedule",
    runManually: "Run manually",
    cronJobs: {
      "expire-ads": {
        label: "Listing expiry",
        help: "Checks old active listings and ended Premium/Exclusive promotions.",
      },
      "cleanup-sold": {
        label: "Sold listings",
        help: "Hides older sold cars from the public list.",
      },
      "send-alerts": {
        label: "Alerts",
        help: "Sends alerts for saved cars and saved searches.",
      },
      "process-email-jobs": {
        label: "Queued emails",
        help: "Sends emails waiting in the queue.",
      },
    },
  },
};

const PRICING_PHASES: Array<keyof PricingConfigV1["phases"]> = [
  "launch",
  "growth",
  "mature",
];

function getAdminSettingsLocale(locale: string): AdminSettingsLocale {
  return locale === "en" ? "en" : "sk";
}

function MaintenanceCard({
  settings,
  onUpdate,
  copy,
}: {
  settings: SiteSetting[];
  onUpdate: (key: string, value: string) => Promise<void>;
  copy: AdminSettingsCopy;
}) {
  const maintenanceMode = settings.find((s) => s.key === "maintenance_mode");
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const enabled = pendingEnabled ?? maintenanceMode?.value === "true";

  const handleToggle = async () => {
    const newValue = !enabled;
    setPendingEnabled(newValue);
    startTransition(async () => {
      try {
        await onUpdate("maintenance_mode", String(newValue));
        toast.success(
          newValue
            ? copy.maintenanceEnabledToast
            : copy.maintenanceDisabledToast,
        );
      } catch {
        setPendingEnabled(null);
        toast.error(copy.maintenanceError);
      } finally {
        setPendingEnabled(null);
      }
    });
  };

  return (
    <Card className={enabled ? "border-warning/50 bg-warning/5" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <svg
              className="size-5 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {copy.maintenanceTitle}
          </CardTitle>
          <Badge variant={enabled ? "warning" : "default"}>
            {enabled ? copy.maintenanceEnabled : copy.maintenanceDisabled}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {copy.maintenanceDescription}
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={enabled}
                onChange={handleToggle}
                disabled={isPending}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-background-tertiary rounded-full peer peer-checked:bg-warning transition-colors" />
              <div className="absolute left-1 top-1 size-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-text-secondary">{copy.maintenanceToggle}</span>
          </label>

          {enabled && (
            <div className="pt-4 border-t border-border-subtle space-y-3">
              <p className="text-sm font-medium text-text-primary">
                {copy.maintenanceBypassTitle}
              </p>
              <p className="text-xs text-text-muted">
                {copy.maintenanceBypassDescription}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SystemActionsCard({ copy }: { copy: AdminSettingsCopy }) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AdminSystemActionResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const runSystemAction = (
    actionId: string,
    action: () => Promise<AdminSystemActionResult>,
  ) => {
    setPendingAction(actionId);
    startTransition(async () => {
      try {
        const result = await action();
        setLastResult(result);
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : copy.systemActionFallbackError;
        setLastResult({ success: false, message });
        toast.error(message);
      } finally {
        setPendingAction(null);
      }
    });
  };

  const cronJobs: AdminCronJobId[] = [
    "expire-ads",
    "cleanup-sold",
    "send-alerts",
    "process-email-jobs",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.systemActionsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-text-primary">
                  {copy.cacheTitle}
                </p>
                <p className="text-sm text-text-secondary">
                  {copy.cacheDescription}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runSystemAction("cache", clearAdminCache)}
                disabled={isPending}
                loading={pendingAction === "cache"}
              >
                {copy.cacheButton}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-text-primary">
                  {copy.searchTitle}
                </p>
                <p className="text-sm text-text-secondary">
                  {copy.searchDescription}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runSystemAction("search", syncAdminSearchIndex)}
                disabled={isPending}
                loading={pendingAction === "search"}
              >
                {copy.searchButton}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border-subtle p-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-text-primary">
                {copy.cronTitle}
              </p>
              <p className="text-sm text-text-secondary">
                {copy.cronDescription}
              </p>
            </div>
            <Badge variant="default">{copy.cronBadge}</Badge>
          </div>

          <div className="divide-y divide-border-subtle">
            {cronJobs.map((jobId) => {
              const job = copy.cronJobs[jobId];
              return (
                <div
                  key={jobId}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-text-primary">{job.label}</p>
                    <p className="text-sm text-text-secondary">{job.help}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      runSystemAction(`cron:${jobId}`, () =>
                        runAdminCronJob(jobId),
                      )
                    }
                    disabled={isPending}
                    loading={pendingAction === `cron:${jobId}`}
                  >
                    {copy.runManually}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {lastResult ? (
          <div
            className={
              lastResult.success
                ? "rounded-xl border border-success/20 bg-success/5 p-3 text-sm text-success"
                : "rounded-xl border border-error/20 bg-error/5 p-3 text-sm text-error"
            }
            role="status"
          >
            {lastResult.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PricingConfigCard({
  settings,
  onUpdate,
  copy,
}: {
  settings: SiteSetting[];
  onUpdate: (key: string, value: string) => Promise<void>;
  copy: AdminSettingsCopy;
}) {
  const existingValue =
    settings.find((entry) => entry.key === "pricing_config_v1")?.value
    || serializePricingConfigValue(DEFAULT_PRICING_CONFIG_V1);
  const [config, setConfig] = useState<PricingConfigV1>(() =>
    parsePricingConfigValue(existingValue),
  );
  const [isPending, startTransition] = useTransition();

  const updatePhaseValue = (
    phase: keyof PricingConfigV1["phases"],
    field: keyof PricingConfigV1["phases"]["launch"],
    value: number,
  ) => {
    setConfig((current) => ({
      ...current,
      phases: {
        ...current.phases,
        [phase]: {
          ...current.phases[phase],
          [field]: value,
        },
      },
    }));
  };

  const updateTopupValue = (
    index: number,
    field: "priceCents" | "bonusCents" | "label",
    value: number | string,
  ) => {
    setConfig((current) => ({
      ...current,
      dealerTopups: current.dealerTopups.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await onUpdate("pricing_config_v1", serializePricingConfigValue(config));
        toast.success(copy.pricingSaved);
      } catch {
        toast.error(copy.pricingError);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{copy.pricingTitle}</CardTitle>
          <Badge variant="default">{copy.phases[config.phase]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-text-primary">{copy.activePhase}</span>
            <select
              value={config.phase}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  phase: event.target.value as PricingConfigV1["phase"],
                }))
              }
              className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
            >
              {PRICING_PHASES.map((phase) => (
                <option key={phase} value={phase}>
                  {copy.phases[phase]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-text-primary">{copy.growthThreshold}</span>
            <input
              type="number"
              value={config.thresholds.growthActiveAds}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  thresholds: {
                    ...current.thresholds,
                    growthActiveAds: Number(event.target.value) || current.thresholds.growthActiveAds,
                  },
                }))
              }
              className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-text-primary">{copy.listingDays}</span>
            <input
              type="number"
              value={config.durations.listingDays}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  durations: {
                    ...current.durations,
                    listingDays: Number(event.target.value) || current.durations.listingDays,
                  },
                }))
              }
              className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-text-primary">{copy.promotionDays}</span>
            <input
              type="number"
              value={config.durations.promotionDays}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  durations: {
                    ...current.durations,
                    promotionDays: Number(event.target.value) || current.durations.promotionDays,
                  },
                }))
              }
              className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
            />
          </label>
        </div>

        <p className="text-sm font-semibold text-text-primary">{copy.phasePrices}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PRICING_PHASES.map((phase) => (
            <div key={phase} className="rounded-2xl border border-border-subtle p-4">
              <p className="mb-3 text-sm font-semibold text-text-primary">
                {copy.phases[phase]}
              </p>
              <div className="space-y-3">
                <PricingCentsInput
                  label={copy.basicPrice}
                  valueCents={config.phases[phase].basicPriceCents}
                  onChange={(value) => updatePhaseValue(phase, "basicPriceCents", value)}
                  unitLabel={copy.priceInEur}
                />
                <PricingCentsInput
                  label={copy.prolongPrice}
                  valueCents={config.phases[phase].prolongPriceCents}
                  onChange={(value) => updatePhaseValue(phase, "prolongPriceCents", value)}
                  unitLabel={copy.priceInEur}
                />
                <PricingCentsInput
                  label={copy.premiumPrice}
                  valueCents={config.phases[phase].premiumPriceCents}
                  onChange={(value) => updatePhaseValue(phase, "premiumPriceCents", value)}
                  unitLabel={copy.priceInEur}
                />
                <PricingCentsInput
                  label={copy.topPrice}
                  valueCents={config.phases[phase].topPriceCents}
                  onChange={(value) => updatePhaseValue(phase, "topPriceCents", value)}
                  unitLabel={copy.priceInEur}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <PricingNumberInput
            label={copy.homepageTopLimit}
            value={config.homepageTopLimit}
            onChange={(value) => setConfig((current) => ({ ...current, homepageTopLimit: value }))}
          />
          <PricingNumberInput
            label={copy.resultsTopLimit}
            value={config.resultsTopLimit}
            onChange={(value) => setConfig((current) => ({ ...current, resultsTopLimit: value }))}
          />
          <PricingNumberInput
            label={copy.resultsPremiumLimit}
            value={config.resultsPremiumLimit}
            onChange={(value) => setConfig((current) => ({ ...current, resultsPremiumLimit: value }))}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-text-primary">{copy.dealerTopups}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {config.dealerTopups.map((entry, index) => (
              <div key={entry.id} className="rounded-2xl border border-border-subtle p-4">
                <label className="mb-3 block space-y-2 text-sm">
                  <span className="font-medium text-text-primary">{copy.topupLabel}</span>
                  <input
                    type="text"
                    value={entry.label}
                    onChange={(event) => updateTopupValue(index, "label", event.target.value)}
                    className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
                  />
                </label>
                <PricingCentsInput
                  label={copy.topupPrice}
                  valueCents={entry.priceCents}
                  onChange={(value) => updateTopupValue(index, "priceCents", value)}
                  unitLabel={copy.priceInEur}
                />
                <PricingCentsInput
                  label={copy.topupBonus}
                  valueCents={entry.bonusCents}
                  onChange={(value) => updateTopupValue(index, "bonusCents", value)}
                  unitLabel={copy.priceInEur}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-text-primary">{copy.shortTexts}</p>
          <label className="block space-y-2 text-sm">
            <span className="font-medium text-text-primary">{copy.globalBanner}</span>
            <input
              type="text"
              value={config.copy.globalBanner}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  copy: { ...current.copy, globalBanner: event.target.value },
                }))
              }
              className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium text-text-primary">{copy.homepageSeller}</span>
            <input
              type="text"
              value={config.copy.homepageSeller}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  copy: { ...current.copy, homepageSeller: event.target.value },
                }))
              }
              className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium text-text-primary">{copy.dealerBalance}</span>
            <input
              type="text"
              value={config.copy.dealerTopup}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  copy: { ...current.copy, dealerTopup: event.target.value },
                }))
              }
              className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
            />
          </label>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? copy.savingPricing : copy.savePricing}
        </Button>
      </CardFooter>
    </Card>
  );
}

function PricingNumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-text-primary">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
      />
    </label>
  );
}

function PricingCentsInput({
  label,
  valueCents,
  onChange,
  unitLabel,
}: {
  label: string;
  valueCents: number;
  onChange: (value: number) => void;
  unitLabel: string;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-text-primary">{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={pricingCentsToEuroInput(valueCents)}
        onChange={(event) => onChange(pricingEuroInputToCents(event.target.value))}
        className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
      />
      <span className="block text-xs text-text-muted">{unitLabel}</span>
    </label>
  );
}

function DealerVerificationRequestsCard() {
  const adminLocale = getAdminSettingsLocale(useLocale());
  const copy = ADMIN_SETTINGS_COPY[adminLocale];
  const [requests, setRequests] = useState<DealerVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectionNoteById, setRejectionNoteById] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchRequests() {
      try {
        const data = await getDealerVerificationRequests();
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch dealer verification requests:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchRequests();
  }, []);

  const handleReview = async (
    request: DealerVerificationRequest,
    decision: "approved" | "rejected",
  ) => {
    const adminNote =
      decision === "rejected" ? (rejectionNoteById[request.id] || "").trim() : "";

    setBusyId(request.id);
    try {
      await reviewDealerVerificationRequest(
        request.id,
        request.dealer_id,
        decision,
        adminNote,
      );
      setRequests((current) =>
        current.map((entry) =>
          entry.id === request.id
            ? {
                ...entry,
                status: decision,
                admin_note: adminNote || null,
                reviewed_at: new Date().toISOString(),
              }
            : entry,
        ),
      );
      if (decision === "rejected") {
        setRejectionNoteById((current) => {
          const next = { ...current };
          delete next[request.id];
          return next;
        });
      }
      toast.success(
        decision === "approved" ? copy.dealerApproved : copy.dealerRejected,
      );
    } catch (error) {
      console.error("Failed to review dealer verification request:", error);
      toast.error(copy.dealerReviewError);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{copy.dealerRequestsTitle}</CardTitle>
          <Badge variant="default">
            {requests.filter((request) => request.status === "pending").length} {copy.pendingSuffix}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-text-muted">{copy.noDealerRequests}</p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-border-subtle bg-background-secondary p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">{request.dealer_name}</p>
                    <p className="text-xs text-text-secondary">{request.owner_email}</p>
                    {request.request_note ? (
                      <p className="mt-2 text-sm text-text-secondary">{request.request_note}</p>
                    ) : null}
                    {request.admin_note ? (
                      <p className="mt-2 text-xs text-text-muted">
                        {copy.adminNote}: {request.admin_note}
                      </p>
                    ) : null}
                    {request.status === "pending" ? (
                      <label
                        htmlFor={`dealer-rejection-note-${request.id}`}
                        className="mt-3 block space-y-2 text-sm"
                      >
                        <span className="font-medium text-text-primary">
                          {copy.dealerNote}
                        </span>
                        <textarea
                          id={`dealer-rejection-note-${request.id}`}
                          rows={2}
                          value={rejectionNoteById[request.id] || ""}
                          onChange={(event) =>
                            setRejectionNoteById((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          placeholder={copy.dealerNotePlaceholder}
                          className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2"
                        />
                      </label>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        request.status === "approved"
                          ? "success"
                          : request.status === "rejected"
                            ? "error"
                            : "warning"
                      }
                      >
                        {request.status === "approved"
                        ? copy.approved
                        : request.status === "rejected"
                          ? copy.rejected
                          : copy.pending}
                    </Badge>
                    {request.status === "pending" ? (
                      <>
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => void handleReview(request, "approved")}
                          disabled={busyId === request.id}
                        >
                          {copy.approve}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleReview(request, "rejected")}
                          disabled={busyId === request.id}
                        >
                          {copy.rejectWithNote}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type MfaStatus = "idle" | "enrolling" | "verifying" | "done";

interface MfaState {
  factorId: string | null;
  qrCode: string | null;
  code: string;
  error: string | null;
  status: MfaStatus;
  isMfaEnabled: boolean;
}

type MfaAction =
  | { type: "initialize_verified" }
  | { type: "set_factor"; factorId: string }
  | { type: "start_enroll" }
  | { type: "enroll_success"; factorId: string; qrCode: string }
  | { type: "enroll_error"; error: string }
  | { type: "set_code"; code: string }
  | { type: "start_verify" }
  | { type: "verify_success" }
  | { type: "verify_error"; error: string }
  | { type: "set_error"; error: string }
  | { type: "unenroll_success" }
  | { type: "cancel_enroll" };

const initialMfaState: MfaState = {
  factorId: null,
  qrCode: null,
  code: "",
  error: null,
  status: "idle",
  isMfaEnabled: false,
};

function mfaReducer(state: MfaState, action: MfaAction): MfaState {
  switch (action.type) {
    case "initialize_verified":
      return {
        ...state,
        isMfaEnabled: true,
        status: "done",
      };
    case "set_factor":
      return {
        ...state,
        factorId: action.factorId,
      };
    case "start_enroll":
      return {
        ...state,
        status: "enrolling",
        error: null,
      };
    case "enroll_success":
      return {
        ...state,
        factorId: action.factorId,
        qrCode: action.qrCode,
      };
    case "enroll_error":
      return {
        ...state,
        error: action.error,
        status: "idle",
      };
    case "set_code":
      return {
        ...state,
        code: action.code,
      };
    case "start_verify":
      return {
        ...state,
        status: "verifying",
        error: null,
      };
    case "verify_success":
      return {
        ...state,
        isMfaEnabled: true,
        status: "done",
      };
    case "verify_error":
      return {
        ...state,
        error: action.error,
        status: "enrolling",
      };
    case "set_error":
      return {
        ...state,
        error: action.error,
      };
    case "unenroll_success":
      return {
        ...initialMfaState,
      };
    case "cancel_enroll":
      return {
        ...state,
        status: "idle",
        qrCode: null,
        error: null,
      };
    default:
      return state;
  }
}

function MFASetupCard({ copy }: { copy: AdminSettingsCopy }) {
  const [state, dispatch] = useReducer(mfaReducer, initialMfaState);

  const supabase = createClient();

  useEffect(() => {
    const checkMFA = async () => {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        if (listError.status === 422) {
          dispatch({
            type: "set_error",
            error: copy.mfaUnavailableError,
          });
        }
        return;
      }

      if (data.all.some((f) => f.status === "verified")) {
        dispatch({ type: "initialize_verified" });
      } else if (data.all.length > 0) {
        const factor = data.all[0];
        dispatch({ type: "set_factor", factorId: factor.id });
      }
    };

    void checkMFA();
  }, [supabase, copy.mfaUnavailableError]);

  const handleStartEnroll = async () => {
    dispatch({ type: "start_enroll" });

    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Autobazar123.sk",
      });
      if (enrollError) throw enrollError;

      dispatch({
        type: "enroll_success",
        factorId: data.id,
        qrCode: data.totp.qr_code,
      });
    } catch (err: unknown) {
      dispatch({
        type: "enroll_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.factorId) return;

    dispatch({ type: "start_verify" });

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: state.factorId,
        });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: state.factorId,
        challengeId: challengeData.id,
        code: state.code,
      });
      if (verifyError) throw verifyError;

      dispatch({ type: "verify_success" });
      toast.success(copy.mfaEnabledToast);
    } catch (err: unknown) {
      dispatch({
        type: "verify_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleUnenroll = async () => {
    if (!confirm(copy.mfaDisableConfirm)) return;

    try {
      const { data: factors, error: listError } =
        await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      if (factors?.all) {
        await Promise.all(
          factors.all.map((factor) =>
            supabase.auth.mfa.unenroll({ factorId: factor.id }),
          ),
        );
      }

      dispatch({ type: "unenroll_success" });
      toast.success(copy.mfaDisabledToast);
    } catch (err: unknown) {
      dispatch({
        type: "set_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  if (state.isMfaEnabled) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardHeader>
          <div className="flex items-center gap-3 text-success">
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <CardTitle className="text-success">
              {copy.mfaEnabledTitle}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary mb-4">
            {copy.mfaEnabledDescription}
          </p>
          <button
            onClick={handleUnenroll}
            className="text-sm text-error hover:underline"
          >
            {copy.mfaDisableButton}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="size-5 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          {copy.mfaTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(state.status === "idle" || state.status === "enrolling") &&
          !state.qrCode && (
            <div className="space-y-4">
              <p className="text-text-secondary">
                {copy.mfaDescription}
              </p>
              <Button
                onClick={handleStartEnroll}
                disabled={state.status === "enrolling"}
                loading={state.status === "enrolling"}
              >
                {copy.mfaStartButton}
              </Button>
              {state.error && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error">
                  {state.error}
                  <button
                    onClick={handleUnenroll}
                    className="ml-2 underline font-bold"
                  >
                    {copy.mfaResetButton}
                  </button>
                </div>
              )}
            </div>
          )}

        {(state.status === "enrolling" || state.status === "verifying") &&
          state.qrCode && (
            <div className="flex flex-col items-center gap-y-6">
              <div className="bg-white p-4 rounded-xl shadow-inner border border-border">
                <Image
                  src={state.qrCode}
                  alt={copy.mfaQrAlt}
                  className="size-48"
                  width={192}
                  height={192}
                  unoptimized
                />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-text-primary">{copy.mfaQrTitle}</p>
                <p className="text-sm text-text-secondary max-w-xs">
                  {copy.mfaQrDescription}
                </p>
              </div>
              <form onSubmit={handleVerify} className="w-full max-w-xs space-y-3">
                <input
                  type="text"
                  aria-label={copy.mfaCodeInputLabel}
                  maxLength={6}
                  value={state.code}
                  onChange={(e) =>
                    dispatch({
                      type: "set_code",
                      code: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full"
                  disabled={state.code.length !== 6 || state.status === "verifying"}
                  loading={state.status === "verifying"}
                >
                  {copy.mfaVerifyButton}
                </Button>
                {state.error && (
                  <p className="text-sm text-error text-center">{state.error}</p>
                )}
                <button
                  type="button"
                  onClick={() => dispatch({ type: "cancel_enroll" })}
                  className="w-full text-sm text-text-secondary hover:underline"
                >
                  {copy.mfaCancelButton}
                </button>
              </form>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

export function AdminSettings() {
  const adminLocale = getAdminSettingsLocale(useLocale());
  const copy = ADMIN_SETTINGS_COPY[adminLocale];
  const { user } = useAuth();
  const [settingsState, setSettingsState] = useState<{
    settings: SiteSetting[];
    loading: boolean;
  }>({
    settings: [],
    loading: true,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await getSiteSettings();
        setSettingsState({ settings: data, loading: false });
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setSettingsState((current) => ({ ...current, loading: false }));
      }
    }
    fetchSettings();
  }, []);

  const handleUpdateSetting = async (key: string, value: string) => {
    if (!user) return;
    await updateSiteSetting(key, value);
    setSettingsState((prev) => ({
      ...prev,
      settings: prev.settings.map((s) => (s.key === key ? { ...s, value } : s)),
    }));
  };

  if (settingsState.loading) {
    return (
      <div className="max-w-5xl space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <MaintenanceCard
        settings={settingsState.settings}
        onUpdate={handleUpdateSetting}
        copy={copy}
      />
      <PricingConfigCard
        key={settingsState.settings.find((entry) => entry.key === "pricing_config_v1")?.updated_at || "pricing-config"}
        settings={settingsState.settings}
        onUpdate={handleUpdateSetting}
        copy={copy}
      />
      <SystemActionsCard copy={copy} />
      <DealerVerificationRequestsCard />
      <MFASetupCard copy={copy} />
    </div>
  );
}
