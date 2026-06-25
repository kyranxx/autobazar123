"use client";

import { formatSkDate } from "@/utils/date-format";
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

function ModerationCard({
  ad,
  isSelected,
  onSelect,
  onApprove,
  onDismissReports,
  onReject,
  isProcessing,
}: {
  ad: PendingAd;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onDismissReports: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  const primaryActionLabel =
    ad.status === "pending" ? "Schváliť" : "Ponechať online";

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
                  {ad.status === "pending" ? "Čaká na schválenie" : "Nahlásený inzerát"}
                </Badge>
                <span className="text-lg font-bold text-accent whitespace-nowrap">
                  {ad.price.toLocaleString()} €
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
                  {flag === "new_seller" && "Nový predajca"}
                  {flag === "high_value" && "Vysoká hodnota"}
                  {flag === "reported" && "Nahlásené"}
                  {flag === "multiple_reports" && "Viac hlásení"}
                  {flag === "no_phone" && "Bez tel. čísla"}
                  {flag === "low_photos" && "Málo fotiek"}
                  {flag === "seller_rejections" && "História zamietnutí"}
                  {flag === "long_description" && "Príliš dlhý popis"}
                  {flag === "suspicious_terms" && "Podozrivé výrazy"}
                  {flag === "external_contact" && "Kontakt mimo platformy"}
                  {flag === "excessive_characters" && "Nadmerné znaky"}
                </Badge>
              ))}
            </div>

            {ad.reportCount > 0 && (
              <div className="mb-4 rounded-xl border border-warning/25 bg-warning/5 p-3">
                <p className="text-sm font-medium text-text-primary">
                  Hlásenia: {ad.reportCount}
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
                {ad.photos} fotiek
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
                {formatSkDate(ad.created_at)}
              </span>
              {ad.sellerPhone ? (
                <span className="flex items-center gap-1">Tel. číslo</span>
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
                Zobraziť
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
                Zamietnuť
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
  onApproveAll,
  onRejectAll,
  onClear,
  isPending,
}: {
  selectedCount: number;
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
            {selectedCount} vybraných
          </Badge>
          <button
            onClick={onClear}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Zrušiť výber
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
            Zamietnuť všetky
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
            Schváliť všetky
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

function ModerationEmptyState() {
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
          Všetko skontrolované
        </h3>
        <p className="text-text-secondary">Žiadne inzeráty ani hlásenia nečakajú na zásah.</p>
      </CardContent>
    </Card>
  );
}

function ModerationHeader({
  selectedCount,
  totalCount,
  onToggleAll,
}: {
  selectedCount: number;
  totalCount: number;
  onToggleAll: () => void;
}) {
  const isAllSelected = selectedCount === totalCount;

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-text-primary">
        Moderačný front
        <Badge variant="warning" size="md" className="ml-2">
          {totalCount}
        </Badge>
      </h2>
      <button
        onClick={onToggleAll}
        className="text-sm text-text-secondary hover:text-accent transition-colors"
      >
        {isAllSelected ? "Zrušiť všetko" : "Vybrať všetko"}
      </button>
    </div>
  );
}

function RejectAdModal({
  open,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Zamietnuť inzerát"
      description="Táto poznámka bude viditeľná pre predajcu, aby vedel čo opraviť."
      size="sm"
    >
      <div className="space-y-4">
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Dôvod zamietnutia..."
          className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Zrušiť
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={isPending}
            className="bg-error hover:bg-error/90"
          >
            Zamietnuť
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminModeration() {
  const { user } = useAuth();
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
        toast.error("Nepodarilo sa načítať moderáciu");
        setAdsState({ pendingAds: [], loading: false });
      }
    }
    fetchData();
  }, []);

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
        toast.success("Inzerát schválený");
      } catch (error) {
        console.error("Failed to approve ad:", error);
        toast.error("Nepodarilo sa schváliť inzerát");
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
        toast.success("Hlásenia boli uzavreté, inzerát ostáva online");
      } catch (error) {
        console.error("Failed to dismiss listing reports:", error);
        toast.error("Nepodarilo sa uzavrieť hlásenia");
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
        toast.success("Inzerát zamietnutý");
      } catch (error) {
        console.error("Failed to reject ad:", error);
        toast.error("Nepodarilo sa zamietnuť inzerát");
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
        toast.success(`${ids.length} inzerátov schválených`);
      } catch (error) {
        console.error("Failed to bulk approve:", error);
        toast.error("Nepodarilo sa schváliť niektoré inzeráty");
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
        toast.success(`${ids.length} inzerátov zamietnutých`);
      } catch (error) {
        console.error("Failed to bulk reject:", error);
        toast.error("Nepodarilo sa zamietnuť niektoré inzeráty");
      } finally {
        setProcessingIds(new Set());
      }
    });
  };

  if (adsState.loading) return <ModerationLoadingState />;

  const { pendingAds } = adsState;
  if (pendingAds.length === 0) return <ModerationEmptyState />;

  return (
    <div>
      <BulkActionBar
        selectedCount={selectedIds.size}
        onApproveAll={handleBulkApprove}
        onRejectAll={handleBulkReject}
        onClear={() => setSelectedIds(new Set())}
        isPending={isPending}
      />

      <ModerationHeader
        selectedCount={selectedIds.size}
        totalCount={pendingAds.length}
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
