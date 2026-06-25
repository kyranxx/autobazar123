"use client";

import { useLocale } from "next-intl";
import { useState, useEffect, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Modal } from "@/components/ui/shadcn/modal";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import {
  getPendingAds,
  approveAd,
  dismissListingReports,
  rejectAd,
  type PendingAd,
} from "../actions";
import { buildAdPath } from "@/lib/cars/ad-path";

type AdminModerationLocale = "sk" | "en";

type AdminModerationCopy = {
  approve: string;
  keepOnline: string;
  pendingBadge: string;
  reportedBadge: string;
  view: string;
  reject: string;
  sellerPhone: string;
  queueTitle: string;
  selectAll: string;
  clearAll: string;
  selectedCount: (count: number) => string;
  clearSelection: string;
  rejectAll: string;
  approveAll: string;
  emptyTitle: string;
  emptyDescription: string;
  rejectModalTitle: string;
  rejectModalDescription: string;
  rejectPlaceholder: string;
  cancel: string;
  loadError: string;
  approveSuccess: string;
  approveError: string;
  dismissReportsSuccess: string;
  dismissReportsError: string;
  rejectSuccess: string;
  rejectError: string;
  bulkApproveSuccess: (count: number) => string;
  bulkApproveError: string;
  bulkRejectSuccess: (count: number) => string;
  bulkRejectError: string;
  reportsCount: (count: number) => string;
  photosCount: (count: number) => string;
  selectAd: (label: string) => string;
  flagLabels: Record<string, string>;
};

const ADMIN_MODERATION_COPY: Record<AdminModerationLocale, AdminModerationCopy> = {
  sk: {
    approve: "Schváliť",
    keepOnline: "Ponechať online",
    pendingBadge: "Čaká na schválenie",
    reportedBadge: "Nahlásený inzerát",
    view: "Zobraziť",
    reject: "Zamietnuť",
    sellerPhone: "Tel. číslo",
    queueTitle: "Moderačný front",
    selectAll: "Vybrať všetko",
    clearAll: "Zrušiť všetko",
    selectedCount: (count) => `${count} vybraných`,
    clearSelection: "Zrušiť výber",
    rejectAll: "Zamietnuť všetky",
    approveAll: "Schváliť všetky",
    emptyTitle: "Všetko skontrolované",
    emptyDescription: "Žiadne inzeráty ani hlásenia nečakajú na zásah.",
    rejectModalTitle: "Zamietnuť inzerát",
    rejectModalDescription:
      "Táto poznámka bude viditeľná pre predajcu, aby vedel čo opraviť.",
    rejectPlaceholder: "Dôvod zamietnutia...",
    cancel: "Zrušiť",
    loadError: "Nepodarilo sa načítať moderáciu",
    approveSuccess: "Inzerát schválený",
    approveError: "Nepodarilo sa schváliť inzerát",
    dismissReportsSuccess: "Hlásenia boli uzavreté, inzerát ostáva online",
    dismissReportsError: "Nepodarilo sa uzavrieť hlásenia",
    rejectSuccess: "Inzerát zamietnutý",
    rejectError: "Nepodarilo sa zamietnuť inzerát",
    bulkApproveSuccess: (count) => `${count} inzerátov schválených`,
    bulkApproveError: "Nepodarilo sa schváliť niektoré inzeráty",
    bulkRejectSuccess: (count) => `${count} inzerátov zamietnutých`,
    bulkRejectError: "Nepodarilo sa zamietnuť niektoré inzeráty",
    reportsCount: (count) => `Hlásenia: ${count}`,
    photosCount: (count) => `${count} fotiek`,
    selectAd: (label) => `Vybrať ${label}`,
    flagLabels: {
      new_seller: "Nový predajca",
      high_value: "Vysoká hodnota",
      reported: "Nahlásené",
      multiple_reports: "Viac hlásení",
      no_phone: "Bez tel. čísla",
      low_photos: "Málo fotiek",
      seller_rejections: "História zamietnutí",
      long_description: "Príliš dlhý popis",
      suspicious_terms: "Podozrivé výrazy",
      external_contact: "Kontakt mimo platformy",
      excessive_characters: "Nadmerné znaky",
    },
  },
  en: {
    approve: "Approve",
    keepOnline: "Keep online",
    pendingBadge: "Needs approval",
    reportedBadge: "Reported listing",
    view: "View",
    reject: "Reject listing",
    sellerPhone: "Phone number",
    queueTitle: "Moderation queue",
    selectAll: "Select all",
    clearAll: "Clear all",
    selectedCount: (count) => `${count} selected`,
    clearSelection: "Clear selection",
    rejectAll: "Reject all",
    approveAll: "Approve all",
    emptyTitle: "Everything reviewed",
    emptyDescription: "No listings or reports need action.",
    rejectModalTitle: "Reject listing",
    rejectModalDescription:
      "Seller will see this note, so they know what to fix.",
    rejectPlaceholder: "Reason for rejection...",
    cancel: "Cancel",
    loadError: "Unable to load moderation",
    approveSuccess: "Listing approved",
    approveError: "Unable to approve listing",
    dismissReportsSuccess: "Reports closed, listing stays online",
    dismissReportsError: "Unable to close reports",
    rejectSuccess: "Listing rejected",
    rejectError: "Unable to reject listing",
    bulkApproveSuccess: (count) => `${count} listings approved`,
    bulkApproveError: "Unable to approve some listings",
    bulkRejectSuccess: (count) => `${count} listings rejected`,
    bulkRejectError: "Unable to reject some listings",
    reportsCount: (count) => `Reports: ${count}`,
    photosCount: (count) => `${count} photos`,
    selectAd: (label) => `Select ${label}`,
    flagLabels: {
      new_seller: "New seller",
      high_value: "High value",
      reported: "Reported",
      multiple_reports: "Multiple reports",
      no_phone: "No phone",
      low_photos: "Few photos",
      seller_rejections: "Rejection history",
      long_description: "Very long description",
      suspicious_terms: "Suspicious terms",
      external_contact: "External contact",
      excessive_characters: "Excessive characters",
    },
  },
};

function getAdminModerationLocale(locale: string): AdminModerationLocale {
  return locale === "en" ? "en" : "sk";
}

function formatAdminModerationNumber(
  locale: AdminModerationLocale,
  value: number,
) {
  return value.toLocaleString(locale === "en" ? "en-GB" : "sk-SK");
}

function formatAdminModerationDate(locale: AdminModerationLocale, value: string) {
  return new Date(value).toLocaleDateString(locale === "en" ? "en-GB" : "sk-SK");
}

function ModerationCard({
  ad,
  copy,
  locale,
  isSelected,
  onSelect,
  onApprove,
  onDismissReports,
  onReject,
  isProcessing,
}: {
  ad: PendingAd;
  copy: AdminModerationCopy;
  locale: AdminModerationLocale;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onDismissReports: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  const primaryActionLabel =
    ad.status === "pending" ? copy.approve : copy.keepOnline;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-all duration-200 ${
        isSelected
          ? "border-accent bg-accent/5 ring-2 ring-accent/20"
          : "border-border-subtle hover:border-border-strong hover:shadow-md"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <label className="relative flex items-center">
            <input
              type="checkbox"
              aria-label={copy.selectAd(`${ad.brand} ${ad.model}`)}
              checked={isSelected}
              onChange={onSelect}
              className="peer sr-only"
            />
            <div
              className={`size-5 rounded-md border-2 transition-all cursor-pointer flex items-center justify-center ${
                isSelected
                  ? "bg-accent border-accent"
                  : "border-border-strong hover:border-accent"
              }`}
            >
              {isSelected && (
                <svg
                  className="size-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </label>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="font-semibold text-text-primary truncate">
                {ad.brand} {ad.model}
              </h4>
              <div className="flex items-center gap-2">
                <Badge
                  variant={ad.status === "pending" ? "warning" : "accent"}
                  size="sm"
                >
                  {ad.status === "pending"
                    ? copy.pendingBadge
                    : copy.reportedBadge}
                </Badge>
                <span className="text-lg font-bold text-accent whitespace-nowrap">
                  {formatAdminModerationNumber(locale, ad.price)} €
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {ad.flags.map((flag) => (
                <Badge
                  key={flag}
                  variant={
                    flag === "new_seller"
                      ? "warning"
                      : flag === "high_value" || flag === "reported"
                        ? "accent"
                        : "error"
                  }
                  size="sm"
                >
                  {copy.flagLabels[flag] || flag}
                </Badge>
              ))}
            </div>

            {ad.reportCount > 0 && (
              <div className="mb-4 rounded-xl border border-warning/25 bg-warning/5 p-3">
                <p className="text-sm font-medium text-text-primary">
                  {copy.reportsCount(ad.reportCount)}
                </p>
                <div className="mt-2 space-y-2">
                  {ad.reports.slice(0, 2).map((report) => (
                    <div key={report.id} className="rounded-lg bg-background/70 px-3 py-2 text-xs">
                      <p className="font-semibold uppercase tracking-[0.08em] text-text-primary">
                        {report.category}
                      </p>
                      <p className="mt-1 text-text-secondary">{report.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
              <span className="flex items-center gap-1">
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="truncate max-w-[150px]">{ad.seller}</span>
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {copy.photosCount(ad.photos)}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatAdminModerationDate(locale, ad.created_at)}
              </span>
              {ad.sellerPhone ? (
                <span className="flex items-center gap-1">{copy.sellerPhone}</span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={buildAdPath({
                  id: ad.id,
                  brand: ad.brand,
                  model: ad.model,
                })}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-tertiary text-sm text-text-primary hover:bg-surface-hover transition-colors"
              >
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {copy.view}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={ad.status === "pending" ? onApprove : onDismissReports}
                disabled={isProcessing}
                className="text-success hover:bg-success/10"
              >
                <svg
                  className="size-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {primaryActionLabel}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReject}
                disabled={isProcessing}
                className="text-error hover:bg-error/10"
              >
                <svg
                  className="size-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {copy.reject}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkActionBar({
  selectedCount,
  copy,
  onApproveAll,
  onRejectAll,
  onClear,
  isPending,
}: {
  selectedCount: number;
  copy: AdminModerationCopy;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClear: () => void;
  isPending: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 mb-4 p-4 rounded-xl bg-background-secondary border border-border-subtle shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="accent" size="md">
            {copy.selectedCount(selectedCount)}
          </Badge>
          <button
            onClick={onClear}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {copy.clearSelection}
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRejectAll}
            disabled={isPending}
            className="border-error text-error hover:bg-error/10"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {copy.rejectAll}
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={onApproveAll}
            disabled={isPending}
            loading={isPending}
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            {copy.approveAll}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModerationLoadingState() {
  return (
    <div className="space-y-4">
      {["moderation-skeleton-1", "moderation-skeleton-2", "moderation-skeleton-3"].map((skeletonKey) => (
        <Card key={skeletonKey}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="size-5" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ModerationEmptyState({ copy }: { copy: AdminModerationCopy }) {
  return (
    <Card className="text-center py-16">
      <CardContent>
        <div className="size-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <svg
            className="size-10 text-success"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          {copy.emptyTitle}
        </h3>
        <p className="text-text-secondary">{copy.emptyDescription}</p>
      </CardContent>
    </Card>
  );
}

function ModerationHeader({
  selectedCount,
  totalCount,
  copy,
  onToggleAll,
}: {
  selectedCount: number;
  totalCount: number;
  copy: AdminModerationCopy;
  onToggleAll: () => void;
}) {
  const isAllSelected = selectedCount === totalCount;

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-text-primary">
        {copy.queueTitle}
        <Badge variant="warning" size="md" className="ml-2">
          {totalCount}
        </Badge>
      </h2>
      <button
        onClick={onToggleAll}
        className="text-sm text-text-secondary hover:text-accent transition-colors"
      >
        {isAllSelected ? copy.clearAll : copy.selectAll}
      </button>
    </div>
  );
}

function RejectAdModal({
  open,
  reason,
  copy,
  onReasonChange,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  reason: string;
  copy: AdminModerationCopy;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.rejectModalTitle}
      description={copy.rejectModalDescription}
      size="sm"
    >
      <div className="space-y-4">
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder={copy.rejectPlaceholder}
          className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            {copy.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={isPending}
            className="bg-error hover:bg-error/90"
          >
            {copy.reject}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminModeration() {
  const { user } = useAuth();
  const locale = getAdminModerationLocale(useLocale());
  const copy = ADMIN_MODERATION_COPY[locale];
  const [adsState, setAdsState] = useState<{
    pendingAds: PendingAd[];
    loading: boolean;
  }>({
    pendingAds: [],
    loading: true,
  });
  const [selectionState, setSelectionState] = useState<{
    selectedIds: Set<string>;
    processingIds: Set<string>;
  }>({
    selectedIds: new Set(),
    processingIds: new Set(),
  });
  const [isPending, startTransition] = useTransition();
  const [rejectState, setRejectState] = useState<{
    open: boolean;
    adId: string | null;
    reason: string;
  }>({
    open: false,
    adId: null,
    reason: "",
  });
  const { selectedIds, processingIds } = selectionState;
  const rejectModal = { open: rejectState.open, adId: rejectState.adId };
  const rejectReason = rejectState.reason;

  const setSelectedIds = (
    next: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => {
    setSelectionState((prev) => ({
      ...prev,
      selectedIds:
        typeof next === "function" ? next(prev.selectedIds) : next,
    }));
  };

  const setProcessingIds = (
    next: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => {
    setSelectionState((prev) => ({
      ...prev,
      processingIds:
        typeof next === "function" ? next(prev.processingIds) : next,
    }));
  };

  const setRejectModal = (next: { open: boolean; adId: string | null }) => {
    setRejectState((prev) => ({ ...prev, open: next.open, adId: next.adId }));
  };

  const setRejectReason = (next: string) => {
    setRejectState((prev) => ({ ...prev, reason: next }));
  };

  const closeRejectModal = () => {
    setRejectModal({ open: false, adId: null });
    setRejectReason("");
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const ads = await getPendingAds();
        setAdsState({ pendingAds: ads, loading: false });
      } catch (error) {
        console.error("Failed to fetch pending ads:", error);
        toast.error(copy.loadError);
        setAdsState({ pendingAds: [], loading: false });
      }
    }
    fetchData();
  }, [copy.loadError]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApprove = async (id: string) => {
    if (!user) return;
    setProcessingIds((prev) => new Set(prev).add(id));

    startTransition(async () => {
      try {
        await approveAd(id);
        setAdsState((prev) => ({
          ...prev,
          pendingAds: prev.pendingAds.filter((ad) => ad.id !== id),
        }));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success(copy.approveSuccess);
      } catch (error) {
        console.error("Failed to approve ad:", error);
        toast.error(copy.approveError);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  const handleDismissReports = async (id: string) => {
    if (!user) return;
    setProcessingIds((prev) => new Set(prev).add(id));

    startTransition(async () => {
      try {
        await dismissListingReports(id);
        setAdsState((prev) => ({
          ...prev,
          pendingAds: prev.pendingAds.filter((ad) => ad.id !== id),
        }));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success(copy.dismissReportsSuccess);
      } catch (error) {
        console.error("Failed to dismiss listing reports:", error);
        toast.error(copy.dismissReportsError);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  const handleReject = async () => {
    if (!user || !rejectModal.adId) return;
    const id = rejectModal.adId;
    setProcessingIds((prev) => new Set(prev).add(id));
    closeRejectModal();

    startTransition(async () => {
      try {
        await rejectAd(id, rejectReason || undefined);
        setAdsState((prev) => ({
          ...prev,
          pendingAds: prev.pendingAds.filter((ad) => ad.id !== id),
        }));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setRejectReason("");
        toast.success(copy.rejectSuccess);
      } catch (error) {
        console.error("Failed to reject ad:", error);
        toast.error(copy.rejectError);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  const handleBulkApprove = async () => {
    if (!user || selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    ids.forEach((id) => setProcessingIds((prev) => new Set(prev).add(id)));

    startTransition(async () => {
      try {
        await Promise.all(ids.map((id) => approveAd(id)));
        setAdsState((prev) => ({
          ...prev,
          pendingAds: prev.pendingAds.filter((ad) => !selectedIds.has(ad.id)),
        }));
        setSelectedIds(new Set());
        toast.success(copy.bulkApproveSuccess(ids.length));
      } catch (error) {
        console.error("Failed to bulk approve:", error);
        toast.error(copy.bulkApproveError);
      } finally {
        setProcessingIds(new Set());
      }
    });
  };

  const handleBulkReject = async () => {
    if (!user || selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    ids.forEach((id) => setProcessingIds((prev) => new Set(prev).add(id)));

    startTransition(async () => {
      try {
        await Promise.all(ids.map((id) => rejectAd(id)));
        setAdsState((prev) => ({
          ...prev,
          pendingAds: prev.pendingAds.filter((ad) => !selectedIds.has(ad.id)),
        }));
        setSelectedIds(new Set());
        toast.success(copy.bulkRejectSuccess(ids.length));
      } catch (error) {
        console.error("Failed to bulk reject:", error);
        toast.error(copy.bulkRejectError);
      } finally {
        setProcessingIds(new Set());
      }
    });
  };

  if (adsState.loading) return <ModerationLoadingState />;

  const { pendingAds } = adsState;
  if (pendingAds.length === 0) return <ModerationEmptyState copy={copy} />;

  return (
    <div>
      <BulkActionBar
        selectedCount={selectedIds.size}
        copy={copy}
        onApproveAll={handleBulkApprove}
        onRejectAll={handleBulkReject}
        onClear={() => setSelectedIds(new Set())}
        isPending={isPending}
      />

      <ModerationHeader
        selectedCount={selectedIds.size}
        totalCount={pendingAds.length}
        copy={copy}
        onToggleAll={() => {
          if (selectedIds.size === pendingAds.length) {
            setSelectedIds(new Set());
          } else {
            setSelectedIds(new Set(pendingAds.map((ad) => ad.id)));
          }
        }}
      />

      <div className="space-y-4">
        {pendingAds.map((ad) => (
          <ModerationCard
            key={ad.id}
            ad={ad}
            copy={copy}
            locale={locale}
            isSelected={selectedIds.has(ad.id)}
            onSelect={() => toggleSelect(ad.id)}
            onApprove={() => handleApprove(ad.id)}
            onDismissReports={() => handleDismissReports(ad.id)}
            onReject={() => setRejectModal({ open: true, adId: ad.id })}
            isProcessing={processingIds.has(ad.id)}
          />
        ))}
      </div>

      <RejectAdModal
        open={rejectModal.open}
        reason={rejectReason}
        copy={copy}
        onReasonChange={setRejectReason}
        onClose={closeRejectModal}
        onConfirm={() => {
          void handleReject();
        }}
        isPending={isPending}
      />
    </div>
  );
}
