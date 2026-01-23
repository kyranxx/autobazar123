"use client";

import { XIcon } from "@/components/ui/Icons";
import { useTranslations } from "next-intl";

export interface FilterState {
    brand_id?: string;
    model_id?: string;
    year_from?: number;
    year_to?: number;
    price_from?: number;
    price_to?: number;
    mileage_from?: number;
    mileage_to?: number;
    fuel?: string;
    transmission?: string;
    body_style?: string;
    is_bought_in_sk?: boolean;
    has_service_book?: boolean;
    not_crashed?: boolean;
}

interface FilterSidebarProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    brands: { id: string; name: string }[];
    models: { id: string; name: string; brand_id: string }[];
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

export default function FilterSidebar({
    filters,
    onFilterChange,
    brands,
    models,
    isMobileOpen,
    onMobileClose,
}: FilterSidebarProps) {
    const t = useTranslations("searchFilters");

    const updateFilter = (key: keyof FilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        if (value === "" || value === undefined) {
            delete newFilters[key];
        }
        onFilterChange(newFilters);
    };

    const availableModels = filters.brand_id
        ? models.filter((m) => m.brand_id === filters.brand_id)
        : [];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            <aside
                className={`fixed top-0 left-0 bottom-0 z-50 w-full max-w-xs bg-white p-6 overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0 lg:w-72 lg:block lg:rounded-2xl lg:border lg:border-border lg:h-fit ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between mb-6 lg:hidden">
                    <h2 className="text-xl font-bold text-primary">{t("filters")}</h2>
                    <button onClick={onMobileClose} className="p-2 -mr-2 text-secondary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Brand */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            {t("brand")}
                        </label>
                        <select
                            value={filters.brand_id || ""}
                            onChange={(e) => {
                                updateFilter("brand_id", e.target.value);
                                updateFilter("model_id", undefined);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent"
                        >
                            <option value="">{t("allBrands")}</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Model */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            {t("model")}
                        </label>
                        <select
                            value={filters.model_id || ""}
                            onChange={(e) => updateFilter("model_id", e.target.value)}
                            disabled={!filters.brand_id}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                        >
                            <option value="">{t("allModels")}</option>
                            {availableModels.map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            {t("price")} (€)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder={t("from")}
                                value={filters.price_from || ""}
                                onChange={(e) =>
                                    updateFilter("price_from", e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent"
                            />
                            <input
                                type="number"
                                placeholder={t("to")}
                                value={filters.price_to || ""}
                                onChange={(e) =>
                                    updateFilter("price_to", e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent"
                            />
                        </div>
                    </div>

                    {/* Year */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            {t("year")}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder={t("from")}
                                value={filters.year_from || ""}
                                onChange={(e) =>
                                    updateFilter("year_from", e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent"
                            />
                            <input
                                type="number"
                                placeholder={t("to")}
                                value={filters.year_to || ""}
                                onChange={(e) =>
                                    updateFilter("year_to", e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent"
                            />
                        </div>
                    </div>

                    {/* Mileage */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            {t("mileage")} (km)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder={t("from")}
                                value={filters.mileage_from || ""}
                                onChange={(e) =>
                                    updateFilter("mileage_from", e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent"
                            />
                            <input
                                type="number"
                                placeholder={t("to")}
                                value={filters.mileage_to || ""}
                                onChange={(e) =>
                                    updateFilter("mileage_to", e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent"
                            />
                        </div>
                    </div>

                    {/* Fuel */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            {t("fuel")}
                        </label>
                        <select
                            value={filters.fuel || ""}
                            onChange={(e) => updateFilter("fuel", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent"
                        >
                            <option value="">{t("allFuels")}</option>
                            <option value="petrol">{t("petrol")}</option>
                            <option value="diesel">{t("diesel")}</option>
                            <option value="electric">{t("electric")}</option>
                            <option value="hybrid">{t("hybrid")}</option>
                            <option value="lpg">{t("lpg")}</option>
                            <option value="cng">{t("cng")}</option>
                        </select>
                    </div>

                    {/* Transmission */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            {t("transmission")}
                        </label>
                        <select
                            value={filters.transmission || ""}
                            onChange={(e) => updateFilter("transmission", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-accent focus:border-accent"
                        >
                            <option value="">{t("allTransmissions")}</option>
                            <option value="manual">{t("manual")}</option>
                            <option value="automatic">{t("automatic")}</option>
                        </select>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3 pt-4 border-t border-border">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.is_bought_in_sk || false}
                                onChange={(e) => updateFilter("is_bought_in_sk", e.target.checked)}
                                className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
                            />
                            <span className="text-sm text-primary">{t("boughtInSk")}</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.has_service_book || false}
                                onChange={(e) => updateFilter("has_service_book", e.target.checked)}
                                className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
                            />
                            <span className="text-sm text-primary">{t("serviceBook")}</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.not_crashed || false}
                                onChange={(e) => updateFilter("not_crashed", e.target.checked)}
                                className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
                            />
                            <span className="text-sm text-primary">{t("notCrashed")}</span>
                        </label>
                    </div>

                    <button
                        onClick={() => onFilterChange({})}
                        className="w-full py-2.5 rounded-xl border border-border text-primary font-medium hover:bg-surface transition-colors mt-6"
                    >
                        {t("clearAll")}
                    </button>
                </div>
            </aside>
        </>
    );
}
