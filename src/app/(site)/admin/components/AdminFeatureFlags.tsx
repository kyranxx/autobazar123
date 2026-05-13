"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Input } from "@/components/ui/shadcn/input";
import { Modal } from "@/components/ui/shadcn/modal";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { toast } from "sonner";
import {
  getFeatureFlags,
  toggleFeatureFlag,
  createFeatureFlag,
  type FeatureFlag,
} from "../actions";

type AdminLocale = "sk" | "en";

function normalizeLocale(locale: string): AdminLocale {
  return locale === "en" ? "en" : "sk";
}

function formatUpdatedAt(locale: AdminLocale, value: string) {
  return new Date(value).toLocaleString(locale === "en" ? "en-GB" : "sk-SK");
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
  const toggleLabel = flag.enabled
    ? t("toggleLabelEnabled", { key: flag.key })
    : t("toggleLabelDisabled", { key: flag.key });

  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-medium text-text-primary font-mono break-all">
            {flag.key}
          </h4>
          <Badge variant={flag.enabled ? "success" : "default"} size="sm">
            {flag.enabled ? t("statusActive") : t("statusInactive")}
          </Badge>
        </div>
        {flag.description ? (
          <p className="text-sm text-text-secondary">{flag.description}</p>
        ) : null}
        <p className="text-xs text-text-muted mt-1">
          {t("updatedAt")}: {formatUpdatedAt(locale, flag.updated_at)}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={isProcessing}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-accent/40 ${
          isProcessing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
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

function CreateFlagModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (key: string, description: string) => Promise<void>;
}) {
  const t = useTranslations("adminFeatureFlags");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    startTransition(async () => {
      try {
        await onCreate(
          key.trim().toLowerCase().replace(/\s+/g, "_"),
          description.trim(),
        );
        setKey("");
        setDescription("");
        onClose();
      } catch (error) {
        console.error("Failed to create flag:", error);
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={t("createModalTitle")} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("createModalName")}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t("createModalNamePlaceholder")}
          hint={t("createModalNameHint")}
        />
        <div>
          <label
            htmlFor="feature-flag-description"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {t("createModalDescription")}
          </label>
          <textarea
            id="feature-flag-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("createModalDescriptionPlaceholder")}
            className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="accent" loading={isPending}>
            {t("create")}
          </Button>
        </div>
      </form>
    </Modal>
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
  const [createModalOpen, setCreateModalOpen] = useState(false);

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

  const handleCreate = async (key: string, description: string) => {
    if (!user) return;

    try {
      const createdFlag = await createFeatureFlag(key, description);
      setFlagState((prev) => ({ ...prev, flags: [createdFlag, ...prev.flags] }));
      toast.success(t("createSuccess"));
    } catch (caughtError) {
      console.error("Failed to create flag:", caughtError);
      toast.error(t("createError"));
      throw caughtError;
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
              <div className="flex items-center gap-2">
                <Badge variant="success">{t("activeCount", { count: enabledCount })}</Badge>
                <Badge variant="default">{t("inactiveCount", { count: disabledCount })}</Badge>
              </div>
              <Button variant="secondary" size="sm" onClick={() => void fetchFlags()}>
                {t("refresh")}
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
              >
                <svg
                  className="size-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {t("newFlag")}
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
              <Button
                variant="accent"
                size="sm"
                className="mt-4"
                onClick={() => setCreateModalOpen(true)}
              >
                {t("emptyCreate")}
              </Button>
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

      <CreateFlagModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
