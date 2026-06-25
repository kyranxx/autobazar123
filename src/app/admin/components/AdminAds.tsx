"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { formatSkDate } from "@/utils/date-format";
import { buildAdPath } from "@/lib/cars/ad-path";
import {
  bulkUpdateAdminListings,
  createAdminListingForUser,
  getAdminListingFormOptions,
  getAdminListings,
  getAdminStats,
  updateAdminListing,
  type AdminListing,
  type AdminListingFormOptions,
  type AdminListingStatus,
  type AdminStats,
} from "../actions";
import { AdminModeration } from "./AdminModeration";

type AdminFuel =
  | "petrol"
  | "diesel"
  | "electric"
  | "hybrid"
  | "lpg"
  | "cng"
  | "hydrogen";
type AdminTransmission = "manual" | "automatic";
type AdminBodyStyle =
  | "sedan"
  | "combi"
  | "suv"
  | "hatchback"
  | "coupe"
  | "cabriolet"
  | "mpv"
  | "pickup"
  | "commercial";

type AdminAdsState = {
  listings: AdminListing[];
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
};

type Notice = {
  type: "success" | "error";
  text: string;
} | null;

type CreateListingForm = {
  sellerId: string;
  brandId: string;
  modelId: string;
  year: string;
  priceEur: string;
  mileageKm: string;
  fuel: AdminFuel;
  transmission: AdminTransmission;
  bodyStyle: AdminBodyStyle;
  locationCity: string;
  description: string;
};

type EditListingForm = {
  priceEur: string;
  mileageKm: string;
  description: string;
  status: AdminListingStatus;
};

const EMPTY_STATS: AdminStats = {
  totalUsers: 0,
  totalAds: 0,
  activeAds: 0,
  pendingModeration: 0,
  dealerAccounts: 0,
  todayRegistrations: 0,
  todayAds: 0,
  soldToday: 0,
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Koncept",
  pending: "Čaká",
  active: "Aktívny",
  sold: "Predané",
  expired: "Expirovaný",
  rejected: "Zamietnutý",
  banned: "Stiahnutý",
};

const STATUS_OPTIONS: AdminListingStatus[] = [
  "draft",
  "pending",
  "active",
  "sold",
  "expired",
  "rejected",
  "banned",
];

const FUEL_OPTIONS: Array<[AdminFuel, string]> = [
  ["diesel", "Diesel"],
  ["petrol", "Benzín"],
  ["hybrid", "Hybrid"],
  ["electric", "Elektro"],
  ["lpg", "LPG"],
  ["cng", "CNG"],
  ["hydrogen", "Vodík"],
];

const BODY_STYLE_OPTIONS: Array<[AdminBodyStyle, string]> = [
  ["combi", "Kombi"],
  ["sedan", "Sedan"],
  ["suv", "SUV"],
  ["hatchback", "Hatchback"],
  ["coupe", "Kupé"],
  ["cabriolet", "Kabriolet"],
  ["mpv", "MPV"],
  ["pickup", "Pickup"],
  ["commercial", "Úžitkové"],
];

const EMPTY_CREATE_FORM: CreateListingForm = {
  sellerId: "",
  brandId: "",
  modelId: "",
  year: String(new Date().getFullYear()),
  priceEur: "",
  mileageKm: "",
  fuel: "diesel",
  transmission: "manual",
  bodyStyle: "combi",
  locationCity: "",
  description: "",
};

function statusVariant(status: string) {
  switch (status) {
    case "active":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "rejected":
    case "banned":
      return "error" as const;
    case "sold":
      return "accent" as const;
    default:
      return "secondary" as const;
  }
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("sk-SK")} €`;
}

function toInteger(value: string) {
  return Number.parseInt(value, 10);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Akcia zlyhala.";
}

function normalizeAdminStatus(status: string): AdminListingStatus {
  return STATUS_OPTIONS.includes(status as AdminListingStatus)
    ? (status as AdminListingStatus)
    : "draft";
}

function StatBox({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-background-secondary p-4">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
      <p className="mt-2 text-sm text-text-muted">{helper}</p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-text-secondary">
      {label}
      {children}
    </label>
  );
}

function ListingRows({
  listings,
  selectedIds,
  allSelected,
  onToggleAll,
  onToggleListing,
  onEdit,
}: {
  listings: AdminListing[];
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleAll: () => void;
  onToggleListing: (listingId: string) => void;
  onEdit: (listing: AdminListing) => void;
}) {
  if (listings.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-text-secondary">
        Nenašli sa žiadne inzeráty.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px]">
        <thead>
          <tr className="border-b border-border-subtle bg-background-tertiary">
            <th className="w-12 px-4 py-3 text-left">
              <input
                type="checkbox"
                aria-label="Vybrať všetky inzeráty"
                checked={allSelected}
                onChange={onToggleAll}
                className="size-4 rounded border-border"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
              Auto
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
              Predajca
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
              Stav
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
              Cena
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
              Km
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
              Fotky
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
              Vytvorené
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
              Akcie
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => {
            const adPath = buildAdPath({
              id: listing.id,
              brand: listing.brand,
              model: listing.model,
              year: listing.year,
            });

            return (
              <tr
                key={listing.id}
                className="border-b border-border-subtle transition-colors hover:bg-surface-hover"
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    aria-label={`Vybrať ${listing.brand} ${listing.model}`}
                    checked={selectedIds.has(listing.id)}
                    onChange={() => onToggleListing(listing.id)}
                    className="size-4 rounded border-border"
                  />
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-text-primary">
                    {listing.brand} {listing.model}
                  </p>
                  {listing.year ? (
                    <p className="mt-1 text-sm text-text-muted">{listing.year}</p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-text-primary">
                    {listing.dealer_name || listing.seller_name || listing.seller_email}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">{listing.seller_email}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={statusVariant(listing.status)}>
                    {STATUS_LABELS[listing.status] || listing.status}
                  </Badge>
                </td>
                <td className="px-4 py-4 font-semibold text-text-primary">
                  {formatCurrency(listing.price_eur)}
                </td>
                <td className="px-4 py-4 text-text-primary">
                  {listing.mileage_km === null
                    ? "-"
                    : listing.mileage_km.toLocaleString("sk-SK")}
                </td>
                <td className="px-4 py-4 text-text-primary">{listing.photos}</td>
                <td className="px-4 py-4 text-sm text-text-secondary">
                  {formatSkDate(listing.created_at)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(listing)}
                    >
                      Upraviť
                    </Button>
                    <Link
                      href={adPath}
                      target="_blank"
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border-subtle px-3 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:text-accent"
                    >
                      Otvoriť
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminAds() {
  const [state, setState] = useState<AdminAdsState>({
    listings: [],
    stats: null,
    loading: true,
    error: null,
  });
  const [formOptions, setFormOptions] =
    useState<AdminListingFormOptions | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkStatus, setBulkStatus] = useState<AdminListingStatus>("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] =
    useState<CreateListingForm>(EMPTY_CREATE_FORM);
  const [editListing, setEditListing] = useState<AdminListing | null>(null);
  const [editForm, setEditForm] = useState<EditListingForm>({
    priceEur: "",
    mileageKm: "",
    description: "",
    status: "draft",
  });
  const [pendingAction, setPendingAction] = useState<
    "create" | "edit" | "bulk" | null
  >(null);

  const refreshAds = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState((current) => ({ ...current, loading: true, error: null }));
    }

    try {
      const [listings, stats, options] = await Promise.all([
        getAdminListings(120),
        getAdminStats(),
        getAdminListingFormOptions(),
      ]);
      setState({ listings, stats, loading: false, error: null });
      setFormOptions(options);
    } catch (error) {
      console.error("Failed to load admin ads:", error);
      setState({
        listings: [],
        stats: null,
        loading: false,
        error: "Inzeráty sa nepodarilo načítať.",
      });
    }
  }, []);

  useEffect(() => {
    void refreshAds();
  }, [refreshAds]);

  useEffect(() => {
    if (!formOptions) return;

    setCreateForm((current) => {
      const nextBrandId = current.brandId || formOptions.brands[0]?.id || "";
      const nextModelId =
        current.modelId ||
        formOptions.models.find((model) => model.brandId === nextBrandId)?.id ||
        "";
      const nextSellerId = current.sellerId || formOptions.sellers[0]?.id || "";

      if (
        nextBrandId === current.brandId &&
        nextModelId === current.modelId &&
        nextSellerId === current.sellerId
      ) {
        return current;
      }

      return {
        ...current,
        sellerId: nextSellerId,
        brandId: nextBrandId,
        modelId: nextModelId,
      };
    });
  }, [formOptions]);

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return state.listings.filter((listing) => {
      const matchesStatus =
        statusFilter === "all" || listing.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        `${listing.brand} ${listing.model} ${listing.seller_email} ${
          listing.dealer_name || ""
        }`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, state.listings, statusFilter]);

  const selectedModelOptions = useMemo(() => {
    if (!formOptions) return [];
    return formOptions.models.filter((model) => model.brandId === createForm.brandId);
  }, [createForm.brandId, formOptions]);

  const stats = state.stats ?? EMPTY_STATS;
  const statusOptions = Array.from(
    new Set([...state.listings.map((listing) => listing.status), ...STATUS_OPTIONS]),
  ).sort();
  const allFilteredSelected =
    filteredListings.length > 0 &&
    filteredListings.every((listing) => selectedIds.has(listing.id));
  const selectedCount = selectedIds.size;

  function toggleListing(listingId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        for (const listing of filteredListings) {
          next.delete(listing.id);
        }
      } else {
        for (const listing of filteredListings) {
          next.add(listing.id);
        }
      }
      return next;
    });
  }

  function openEdit(listing: AdminListing) {
    setEditListing(listing);
    setEditForm({
      priceEur: String(listing.price_eur || ""),
      mileageKm: listing.mileage_km === null ? "" : String(listing.mileage_km),
      description: listing.description || "",
      status: normalizeAdminStatus(listing.status),
    });
  }

  async function handleCreateAd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("create");
    setNotice(null);

    try {
      await createAdminListingForUser({
        sellerId: createForm.sellerId,
        brandId: createForm.brandId,
        modelId: createForm.modelId,
        year: toInteger(createForm.year),
        priceEur: toInteger(createForm.priceEur),
        mileageKm: toInteger(createForm.mileageKm),
        fuel: createForm.fuel,
        transmission: createForm.transmission,
        bodyStyle: createForm.bodyStyle,
        locationCity: createForm.locationCity,
        description: createForm.description,
      });
      setNotice({ type: "success", text: "Koncept inzerátu vytvorený." });
      setCreateOpen(false);
      setCreateForm((current) => ({
        ...EMPTY_CREATE_FORM,
        sellerId: current.sellerId,
        brandId: current.brandId,
        modelId: current.modelId,
      }));
      await refreshAds(false);
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleEditAd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editListing) return;

    setPendingAction("edit");
    setNotice(null);

    try {
      const nextStatus =
        editForm.status === normalizeAdminStatus(editListing.status)
          ? undefined
          : editForm.status;
      await updateAdminListing({
        adId: editListing.id,
        priceEur: toInteger(editForm.priceEur),
        mileageKm: toInteger(editForm.mileageKm),
        description: editForm.description,
        status: nextStatus,
      });
      setNotice({ type: "success", text: "Inzerát uložený." });
      setEditListing(null);
      await refreshAds(false);
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleBulkUpdate() {
    setPendingAction("bulk");
    setNotice(null);

    try {
      await bulkUpdateAdminListings({
        adIds: Array.from(selectedIds),
        status: bulkStatus,
      });
      setNotice({ type: "success", text: "Hromadná zmena uložená." });
      setSelectedIds(new Set());
      await refreshAds(false);
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              Inzeráty
            </p>
            <h1 className="mt-2 text-3xl font-bold text-text-primary">
              Správa inzerátov
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Schvaľovanie, úpravy a ručné vytvorenie inzerátu pre používateľa.
            </p>
          </div>
          <Button
            type="button"
            variant="accent"
            onClick={() => setCreateOpen(true)}
          >
            Vytvoriť inzerát
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {state.loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`admin-ads-stat-loading-${index + 1}`}
              className="rounded-lg border border-border-subtle bg-background-secondary p-4"
            >
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-3 h-3 w-28" />
            </div>
          ))
        ) : (
          <>
            <StatBox
              label="Všetky inzeráty"
              value={stats.totalAds.toLocaleString("sk-SK")}
              helper="Celý katalóg"
            />
            <StatBox
              label="Aktívne"
              value={stats.activeAds.toLocaleString("sk-SK")}
              helper="Viditeľné pre návštevníkov"
            />
            <StatBox
              label="Čaká na schválenie"
              value={stats.pendingModeration.toLocaleString("sk-SK")}
              helper="Treba pozrieť"
            />
            <StatBox
              label="Nové dnes"
              value={stats.todayAds.toLocaleString("sk-SK")}
              helper="Pridané za dnešok"
            />
          </>
        )}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Čaká na kontrolu
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Schvaľovanie nových inzerátov a otvorené hlásenia.
          </p>
        </div>
        <AdminModeration />
      </section>

      <Card padding="none">
        <CardHeader className="border-b border-border-subtle">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Všetky inzeráty</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                Posledných 120 inzerátov v katalógu.
              </p>
            </div>
            <Badge variant="secondary">{filteredListings.length} v zozname</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[240px] flex-1">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Hľadať auto alebo predajcu"
              />
            </div>
            <FormField label="Stav">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 min-w-[180px] rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                <option value="all">Všetky stavy</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status] || status}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {selectedCount > 0 ? (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-accent/25 bg-accent/5 p-3">
              <div className="min-w-[160px] flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  Hromadná zmena
                </p>
                <p className="text-sm text-text-secondary">
                  Vybrané: {selectedCount}
                </p>
              </div>
              <FormField label="Nový stav">
                <select
                  value={bulkStatus}
                  onChange={(event) =>
                    setBulkStatus(event.target.value as AdminListingStatus)
                  }
                  className="h-10 min-w-[180px] rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </FormField>
              <Button
                type="button"
                onClick={() => void handleBulkUpdate()}
                loading={pendingAction === "bulk"}
              >
                Uložiť zmenu
              </Button>
            </div>
          ) : null}

          {notice ? (
            <div
              className={
                notice.type === "success"
                  ? "rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
                  : "rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
              }
            >
              {notice.text}
            </div>
          ) : null}

          {state.error ? (
            <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {state.error}
            </div>
          ) : null}

          {state.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <ListingRows
              listings={filteredListings}
              selectedIds={selectedIds}
              allSelected={allFilteredSelected}
              onToggleAll={toggleAllFiltered}
              onToggleListing={toggleListing}
              onEdit={openEdit}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vytvoriť inzerát</DialogTitle>
            <DialogDescription>
              Vytvorí sa koncept pre vybraného používateľa.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void handleCreateAd(event)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Používateľ">
                <select
                  value={createForm.sellerId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      sellerId: event.target.value,
                    }))
                  }
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                  required
                >
                  {formOptions?.sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.email}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Značka">
                <select
                  value={createForm.brandId}
                  onChange={(event) => {
                    const brandId = event.target.value;
                    const firstModelId =
                      formOptions?.models.find((model) => model.brandId === brandId)
                        ?.id || "";
                    setCreateForm((current) => ({
                      ...current,
                      brandId,
                      modelId: firstModelId,
                    }));
                  }}
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                  required
                >
                  {formOptions?.brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Model">
                <select
                  value={createForm.modelId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      modelId: event.target.value,
                    }))
                  }
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                  required
                >
                  {selectedModelOptions.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Rok">
                <Input
                  type="number"
                  value={createForm.year}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      year: event.target.value,
                    }))
                  }
                  required
                />
              </FormField>
              <FormField label="Cena">
                <Input
                  type="number"
                  value={createForm.priceEur}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      priceEur: event.target.value,
                    }))
                  }
                  required
                />
              </FormField>
              <FormField label="Kilometre">
                <Input
                  type="number"
                  value={createForm.mileageKm}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      mileageKm: event.target.value,
                    }))
                  }
                  required
                />
              </FormField>
              <FormField label="Palivo">
                <select
                  value={createForm.fuel}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      fuel: event.target.value as AdminFuel,
                    }))
                  }
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                >
                  {FUEL_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Prevodovka">
                <select
                  value={createForm.transmission}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      transmission: event.target.value as AdminTransmission,
                    }))
                  }
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                >
                  <option value="manual">Manuál</option>
                  <option value="automatic">Automat</option>
                </select>
              </FormField>
              <FormField label="Karoséria">
                <select
                  value={createForm.bodyStyle}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      bodyStyle: event.target.value as AdminBodyStyle,
                    }))
                  }
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                >
                  {BODY_STYLE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Mesto">
                <Input
                  value={createForm.locationCity}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      locationCity: event.target.value,
                    }))
                  }
                  required
                />
              </FormField>
            </div>
            <FormField label="Popis">
              <textarea
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </FormField>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Zrušiť
              </Button>
              <Button type="submit" loading={pendingAction === "create"}>
                Vytvoriť koncept
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editListing)} onOpenChange={(open) => !open && setEditListing(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Upraviť inzerát</DialogTitle>
            <DialogDescription>
              {editListing
                ? `${editListing.brand} ${editListing.model}`
                : "Vybraný inzerát"}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void handleEditAd(event)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Cena">
                <Input
                  type="number"
                  value={editForm.priceEur}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      priceEur: event.target.value,
                    }))
                  }
                  required
                />
              </FormField>
              <FormField label="Kilometre">
                <Input
                  type="number"
                  value={editForm.mileageKm}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      mileageKm: event.target.value,
                    }))
                  }
                  required
                />
              </FormField>
              <FormField label="Stav">
                <select
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      status: event.target.value as AdminListingStatus,
                    }))
                  }
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Popis">
              <textarea
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </FormField>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditListing(null)}
              >
                Zrušiť
              </Button>
              <Button type="submit" loading={pendingAction === "edit"}>
                Uložiť
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
