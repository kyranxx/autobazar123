"use client";

import { useState, useEffect } from "react";

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
    power_from?: number;
    power_to?: number;
    location_city?: string;
    is_bought_in_sk?: boolean;
    has_service_book?: boolean;
    not_crashed?: boolean;
}

interface FilterSidebarProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    brands: { id: string; name: string; slug: string }[];
    models: { id: string; name: string; brand_id: string }[];
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

const FUEL_OPTIONS = [
    { value: "petrol", label: "Benzín" },
    { value: "diesel", label: "Diesel" },
    { value: "electric", label: "Elektro" },
    { value: "hybrid", label: "Hybrid" },
    { value: "lpg", label: "LPG" },
    { value: "cng", label: "CNG" },
];

const TRANSMISSION_OPTIONS = [
    { value: "manual", label: "Manuál" },
    { value: "automatic", label: "Automat" },
];

const BODY_OPTIONS = [
    { value: "sedan", label: "Sedan" },
    { value: "combi", label: "Kombi" },
    { value: "suv", label: "SUV" },
    { value: "hatchback", label: "Hatchback" },
    { value: "coupe", label: "Kupé" },
    { value: "cabriolet", label: "Kabriolet" },
    { value: "mpv", label: "MPV" },
    { value: "pickup", label: "Pickup" },
    { value: "commercial", label: "Úžitkové" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 35 }, (_, i) => currentYear - i);
const PRICE_OPTIONS = [
    1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000,
    75000, 100000, 150000, 200000,
];
const MILEAGE_OPTIONS = [
    5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 200000, 250000, 300000,
];
const POWER_OPTIONS = [50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500];

export default function FilterSidebar({
    filters,
    onFilterChange,
    brands,
    models,
    isMobileOpen = false,
    onMobileClose,
}: FilterSidebarProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(["brand", "price", "year"])
    );

    const [availableModels, setAvailableModels] = useState<typeof models>([]);

    // Update available models when brand changes
    useEffect(() => {
        if (filters.brand_id) {
            setAvailableModels(models.filter((m) => m.brand_id === filters.brand_id));
        } else {
            setAvailableModels([]);
        }
    }, [filters.brand_id, models]);

    const toggleSection = (section: string) => {
        const newSet = new Set(expandedSections);
        if (newSet.has(section)) {
            newSet.delete(section);
        } else {
            newSet.add(section);
        }
        setExpandedSections(newSet);
    };

    const updateFilter = <K extends keyof FilterState>(
        key: K,
        value: FilterState[K]
    ) => {
        const newFilters = { ...filters, [key]: value };
        // Reset model when brand changes
        if (key === "brand_id") {
            newFilters.model_id = undefined;
        }
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        onFilterChange({});
    };

    const activeFilterCount = Object.values(filters).filter(
        (v) => v !== undefined && v !== ""
    ).length;

    const sidebarContent = (
        <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <FilterIcon className="w-5 h-5 text-accent" />
                    <h2 className="font-semibold text-primary">Filtre</h2>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-accent text-white text-xs font-medium">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-accent hover:text-accent-hover font-medium"
                    >
                        Vymazať
                    </button>
                )}
            </div>

            {/* Filter Sections */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Brand & Model */}
                <FilterSection
                    title="Značka a model"
                    isExpanded={expandedSections.has("brand")}
                    onToggle={() => toggleSection("brand")}
                >
                    <div className="space-y-3">
                        <Select
                            label="Značka"
                            value={filters.brand_id || ""}
                            onChange={(v) => updateFilter("brand_id", v || undefined)}
                            options={brands.map((b) => ({ value: b.id, label: b.name }))}
                            placeholder="Všetky značky"
                        />
                        <Select
                            label="Model"
                            value={filters.model_id || ""}
                            onChange={(v) => updateFilter("model_id", v || undefined)}
                            options={availableModels.map((m) => ({
                                value: m.id,
                                label: m.name,
                            }))}
                            placeholder="Všetky modely"
                            disabled={!filters.brand_id}
                        />
                    </div>
                </FilterSection>

                {/* Price */}
                <FilterSection
                    title="Cena"
                    isExpanded={expandedSections.has("price")}
                    onToggle={() => toggleSection("price")}
                >
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Od"
                            value={filters.price_from?.toString() || ""}
                            onChange={(v) =>
                                updateFilter("price_from", v ? parseInt(v) : undefined)
                            }
                            options={PRICE_OPTIONS.map((p) => ({
                                value: p.toString(),
                                label: `${p.toLocaleString("sk-SK")} €`,
                            }))}
                            placeholder="Min"
                        />
                        <Select
                            label="Do"
                            value={filters.price_to?.toString() || ""}
                            onChange={(v) =>
                                updateFilter("price_to", v ? parseInt(v) : undefined)
                            }
                            options={PRICE_OPTIONS.map((p) => ({
                                value: p.toString(),
                                label: `${p.toLocaleString("sk-SK")} €`,
                            }))}
                            placeholder="Max"
                        />
                    </div>
                </FilterSection>

                {/* Year */}
                <FilterSection
                    title="Rok výroby"
                    isExpanded={expandedSections.has("year")}
                    onToggle={() => toggleSection("year")}
                >
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Od"
                            value={filters.year_from?.toString() || ""}
                            onChange={(v) =>
                                updateFilter("year_from", v ? parseInt(v) : undefined)
                            }
                            options={YEAR_OPTIONS.map((y) => ({
                                value: y.toString(),
                                label: y.toString(),
                            }))}
                            placeholder="Min"
                        />
                        <Select
                            label="Do"
                            value={filters.year_to?.toString() || ""}
                            onChange={(v) =>
                                updateFilter("year_to", v ? parseInt(v) : undefined)
                            }
                            options={YEAR_OPTIONS.map((y) => ({
                                value: y.toString(),
                                label: y.toString(),
                            }))}
                            placeholder="Max"
                        />
                    </div>
                </FilterSection>

                {/* Mileage */}
                <FilterSection
                    title="Najazdené km"
                    isExpanded={expandedSections.has("mileage")}
                    onToggle={() => toggleSection("mileage")}
                >
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Od"
                            value={filters.mileage_from?.toString() || ""}
                            onChange={(v) =>
                                updateFilter("mileage_from", v ? parseInt(v) : undefined)
                            }
                            options={MILEAGE_OPTIONS.map((m) => ({
                                value: m.toString(),
                                label: `${m.toLocaleString("sk-SK")} km`,
                            }))}
                            placeholder="Min"
                        />
                        <Select
                            label="Do"
                            value={filters.mileage_to?.toString() || ""}
                            onChange={(v) =>
                                updateFilter("mileage_to", v ? parseInt(v) : undefined)
                            }
                            options={MILEAGE_OPTIONS.map((m) => ({
                                value: m.toString(),
                                label: `${m.toLocaleString("sk-SK")} km`,
                            }))}
                            placeholder="Max"
                        />
                    </div>
                </FilterSection>

                {/* Fuel Type */}
                <FilterSection
                    title="Palivo"
                    isExpanded={expandedSections.has("fuel")}
                    onToggle={() => toggleSection("fuel")}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {FUEL_OPTIONS.map((option) => (
                            <Chip
                                key={option.value}
                                label={option.label}
                                selected={filters.fuel === option.value}
                                onClick={() =>
                                    updateFilter(
                                        "fuel",
                                        filters.fuel === option.value ? undefined : option.value
                                    )
                                }
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Transmission */}
                <FilterSection
                    title="Prevodovka"
                    isExpanded={expandedSections.has("transmission")}
                    onToggle={() => toggleSection("transmission")}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {TRANSMISSION_OPTIONS.map((option) => (
                            <Chip
                                key={option.value}
                                label={option.label}
                                selected={filters.transmission === option.value}
                                onClick={() =>
                                    updateFilter(
                                        "transmission",
                                        filters.transmission === option.value
                                            ? undefined
                                            : option.value
                                    )
                                }
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Body Type */}
                <FilterSection
                    title="Typ karosérie"
                    isExpanded={expandedSections.has("body")}
                    onToggle={() => toggleSection("body")}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {BODY_OPTIONS.map((option) => (
                            <Chip
                                key={option.value}
                                label={option.label}
                                selected={filters.body_style === option.value}
                                onClick={() =>
                                    updateFilter(
                                        "body_style",
                                        filters.body_style === option.value ? undefined : option.value
                                    )
                                }
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Power */}
                <FilterSection
                    title="Výkon (kW)"
                    isExpanded={expandedSections.has("power")}
                    onToggle={() => toggleSection("power")}
                >
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Od"
                            value={filters.power_from?.toString() || ""}
                            onChange={(v) =>
                                updateFilter("power_from", v ? parseInt(v) : undefined)
                            }
                            options={POWER_OPTIONS.map((p) => ({
                                value: p.toString(),
                                label: `${p} kW`,
                            }))}
                            placeholder="Min"
                        />
                        <Select
                            label="Do"
                            value={filters.power_to?.toString() || ""}
                            onChange={(v) =>
                                updateFilter("power_to", v ? parseInt(v) : undefined)
                            }
                            options={POWER_OPTIONS.map((p) => ({
                                value: p.toString(),
                                label: `${p} kW`,
                            }))}
                            placeholder="Max"
                        />
                    </div>
                </FilterSection>

                {/* Trust Signals */}
                <FilterSection
                    title="Dôveryhodnosť"
                    isExpanded={expandedSections.has("trust")}
                    onToggle={() => toggleSection("trust")}
                >
                    <div className="space-y-2">
                        <Checkbox
                            label="Kúpené v SR"
                            checked={filters.is_bought_in_sk || false}
                            onChange={(v) => updateFilter("is_bought_in_sk", v || undefined)}
                        />
                        <Checkbox
                            label="Servisná knižka"
                            checked={filters.has_service_book || false}
                            onChange={(v) => updateFilter("has_service_book", v || undefined)}
                        />
                        <Checkbox
                            label="Nehavarované"
                            checked={filters.not_crashed || false}
                            onChange={(v) => updateFilter("not_crashed", v || undefined)}
                        />
                    </div>
                </FilterSection>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-80 shrink-0">
                <div className="sticky top-20 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                    {sidebarContent}
                </div>
            </aside>

            {/* Mobile Slide-out Panel */}
            {isMobileOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={onMobileClose}
                    />
                    <div className="fixed inset-y-0 left-0 w-full max-w-md bg-background z-50 lg:hidden animate-slide-in-right">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="font-semibold text-primary">Filtre</h2>
                            <button
                                onClick={onMobileClose}
                                className="p-2 rounded-full hover:bg-surface"
                                aria-label="Zavrieť"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto h-[calc(100vh-130px)]">
                            {sidebarContent}
                        </div>
                        <div className="p-4 border-t border-border">
                            <button
                                onClick={onMobileClose}
                                className="w-full py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
                            >
                                Zobraziť výsledky
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

// Filter Section Component
function FilterSection({
    title,
    isExpanded,
    onToggle,
    children,
}: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-border pb-4 last:border-b-0">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full py-2 text-left"
            >
                <span className="text-sm font-medium text-primary">{title}</span>
                <ChevronIcon
                    className={`w-4 h-4 text-secondary transition-transform ${isExpanded ? "rotate-180" : ""
                        }`}
                />
            </button>
            {isExpanded && <div className="mt-3">{children}</div>}
        </div>
    );
}

// Select Component
function Select({
    label,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
}: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <div>
            {label && (
                <label className="block text-xs text-secondary mb-1">{label}</label>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

// Chip Component
function Chip({
    label,
    selected,
    onClick,
}: {
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selected
                ? "bg-accent text-white"
                : "bg-surface text-secondary hover:bg-surface-hover"
                }`}
        >
            {label}
        </button>
    );
}

// Checkbox Component
function Checkbox({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-3 py-1 cursor-pointer group">
            <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${checked
                    ? "bg-accent border-accent"
                    : "border-border group-hover:border-accent"
                    }`}
            >
                {checked && <CheckIcon className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm text-primary">{label}</span>
        </label>
    );
}

// Icons
function FilterIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
    );
}

function ChevronIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function CloseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
