"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { toast } from "sonner";
import {
  getFeatureFlags,
  toggleFeatureFlag,
  type FeatureFlag,
} from "../actions";

type AdminLocale = "sk" | "en";

const CONNECTED_FEATURE_FLAGS = new Set(["vin_decoding"]);

const FEATURE_FLAG_LABELS: Record<
  string,
  { title: string; description: string }
> = {
  vin_decoding: {
    title: "VIN dekódovanie",
    description:
      "Zapne predvyplnenie údajov auta podľa VIN vo formulári inzerátu.",
  },
};

function normalizeLocale(locale: string): AdminLocale {
  return locale === "en" ? "en" : "sk";
}

function formatUpdatedAt(locale: AdminLocale, value: string) {
  return new Date(value).toLocaleString(locale === "en" ? "en-GB" : "sk-SK");
}

function isFlagConnected(flag: FeatureFlag) {
  return CONNECTED_FEATURE_FLAGS.has(flag.key);
}

function getFlagTitle(flag: FeatureFlag) {
  return FEATURE_FLAG_LABELS[flag.key]?.title ?? flag.key;
}

function getFlagDescription(flag: FeatureFlag) {
  return FEATURE_FLAG_LABELS[flag.key]?.description ?? flag.description;
}

function FeatureFlagRow({
  flag,
  onToggle,
  isProcessing,
  locale,
}: {
  flag: FeatureFlag;
  onToggle: () => void;
  isProcessing: boolean;
  locale: AdminLocale;
}) {
  const t = useTranslations("adminFeatureFlags");
  const connected = isFlagConnected(flag);
  const disabled = isProcessing || !connected;
  const toggleLabel = !connected
    ? t("toggleDisabledReason")
    : flag.enabled
      ? t("toggleLabelEnabled", { key: getFlagTitle(flag) })
      : t("toggleLabelDisabled", { key: getFlagTitle(flag) });
  const description = getFlagDescription(flag);

  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b border-border-subtle last:border-0">
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h4 className="font-medium text-text-primary">
            {getFlagTitle(flag)}
          </h4>
          <Badge variant={connected ? "success" : "default"} size="sm">
            {connected ? t("connectedBadge") : t("notConnectedBadge")}
          </Badge>
          <Badge variant={flag.enabled ? "success" : "default"} size="sm">
            {flag.enabled ? t("statusActive") : t("statusInactive")}
          </Badge>
        </div>
        <p className="text-xs text-text-muted">{flag.key}</p>
        {description ? (
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
        ) : null}
        {!connected ? (
          <p className="mt-2 text-sm text-warning">{t("notConnectedHelp")}</p>
        ) : null}
        <p className="mt-2 text-xs text-text-muted">
          {t("updatedAt")}: {formatUpdatedAt(locale, flag.updated_at)}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-accent/40 ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        } ${
          flag.enabled
            ? "border-success bg-success"
            : "border-border-subtle bg-background-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
        }`}
        aria-label={toggleLabel}
        aria-pressed={flag.enabled}
        title={toggleLabel}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            flag.enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function AdminFeatureFlags() {
  const { user } = useAuth();
  const locale = normalizeLocale(useLocale());
  const t = useTranslations("adminFeatureFlags");
  const [flagState, setFlagState] = useState<{
    flags: FeatureFlag[];
    loading: boolean;
    error: string | null;
  }>({
    flags: [],
    loading: true,
    error: null,
  });
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchFlags = useCallback(async () => {
    setFlagState((current) => ({ ...current, loading: true, error: null }));

    try {
      const data = await getFeatureFlags();
      setFlagState({ flags: data, loading: false, error: null });
    } catch (caughtError) {
      console.error("Failed to fetch feature flags:", caughtError);
      setFlagState({ flags: [], loading: false, error: t("fetchError") });
    }
  }, [t]);

  useEffect(() => {
    void fetchFlags();
  }, [fetchFlags, locale]);

  const handleToggle = async (flag: FeatureFlag) => {
    if (!user) return;

    setProcessingIds((prev) => new Set(prev).add(flag.id));

    try {
      await toggleFeatureFlag(flag.id, !flag.enabled);
      setFlagState((prev) => ({
        ...prev,
        flags: prev.flags.map((f) =>
          f.id === flag.id
            ? {
                ...f,
                enabled: !f.enabled,
                updated_at: new Date().toISOString(),
              }
            : f,
        ),
      }));
      toast.success(
        flag.enabled ? t("toggleSuccessDisabled") : t("toggleSuccessEnabled"),
      );
    } catch (caughtError) {
      console.error("Failed to toggle flag:", caughtError);
      toast.error(t("toggleError"));
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(flag.id);
        return next;
      });
    }
  };

  if (flagState.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("loadingTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"].map(
            (skeletonKey) => (
              <div
                key={skeletonKey}
                className="flex items-center justify-between p-4 border-b border-border-subtle"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-7 w-12 rounded-full" />
              </div>
            ),
          )}
        </CardContent>
      </Card>
    );
  }

  const { error, flags } = flagState;
  const enabledCount = flags.filter((f) => f.enabled).length;
  const disabledCount = flags.filter((f) => !f.enabled).length;
  const connectedCount = flags.filter(isFlagConnected).length;
  const lastUpdatedAt = flags[0]?.updated_at
    ? formatUpdatedAt(
        locale,
        flags.toSorted(
          (leftFlag, rightFlag) =>
            new Date(rightFlag.updated_at).getTime() -
            new Date(leftFlag.updated_at).getTime(),
        )[0].updated_at,
      )
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <svg
                  className="size-5 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
                {t("pageTitle")}
              </CardTitle>
              <p className="text-sm text-text-secondary mt-1">
                {t("pageSubtitle")}
              </p>
              {lastUpdatedAt ? (
                <p className="mt-1 text-xs text-text-muted">
                  {t("lastChange")}: {lastUpdatedAt}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">{t("connectedCount", { count: connectedCount })}</Badge>
                <Badge variant="success">{t("activeCount", { count: enabledCount })}</Badge>
                <Badge variant="default">{t("inactiveCount", { count: disabledCount })}</Badge>
              </div>
              <Button variant="secondary" size="sm" onClick={() => void fetchFlags()}>
                {t("refresh")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="border-b border-border-subtle bg-error/5 px-6 py-4 text-sm text-error">
              {error}
            </div>
          ) : null}
          <div className="border-b border-border-subtle bg-background-secondary px-6 py-4 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">{t("ownerNoteTitle")}</p>
            <p className="mt-1">{t("ownerNoteBody")}</p>
          </div>
          {flags.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              <svg
                className="size-12 mx-auto mb-4 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              <p className="font-medium text-text-primary">{t("emptyTitle")}</p>
              <p className="mt-2 text-sm text-text-secondary">
                {t("emptyDescription")}
              </p>
            </div>
          ) : (
            flags.map((flag) => (
              <FeatureFlagRow
                key={flag.id}
                flag={flag}
                onToggle={() => handleToggle(flag)}
                isProcessing={processingIds.has(flag.id)}
                locale={locale}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-background-tertiary/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <svg
              className="size-5 text-text-muted flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-text-secondary">
              <p className="font-medium text-text-primary mb-1">{t("tipTitle")}</p>
              <p>{t("tipBody")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
