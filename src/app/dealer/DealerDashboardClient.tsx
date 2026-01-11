"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/config/vat";
import { DEALER_BULK_TIERS } from "@/config/credits";
import { useTranslations } from "next-intl";

// Mock dealer data
const MOCK_DEALER = {
    id: "dealer1",
    business_name: "AutoMax Slovakia s.r.o.",
    slug: "automax-slovakia",
    description: "Prémiové ojazdené vozidlá s garanciou kvality. Pôsobíme na trhu od roku 2010.",
    logo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&q=80",
    address: "Prievozská 14, 821 09 Bratislava",
    phone: "+421 2 1234 5678",
    email: "info@automax.sk",
    website: "https://automax.sk",
    is_verified: true,
    created_at: "2023-02-15",
};

const MOCK_DEALER_ADS = [
    {
        id: "d1",
        brand: "Mercedes-Benz",
        model: "E-Class",
        year: 2021,
        price_eur: 45900,
        status: "active",
        views: 567,
        inquiries: 12,
        expires_at: "2026-02-10",
        is_top_ad: true,
        is_highlighted: true,
        photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80",
        selected: false,
    },
    {
        id: "d2",
        brand: "BMW",
        model: "X5",
        year: 2020,
        price_eur: 52900,
        status: "active",
        views: 423,
        inquiries: 8,
        expires_at: "2026-02-08",
        is_top_ad: false,
        is_highlighted: true,
        photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80",
        selected: false,
    },
    {
        id: "d3",
        brand: "Audi",
        model: "Q7",
        year: 2022,
        price_eur: 67500,
        status: "active",
        views: 312,
        inquiries: 5,
        expires_at: "2026-01-20",
        is_top_ad: false,
        is_highlighted: false,
        photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80",
        selected: false,
    },
    {
        id: "d4",
        brand: "Škoda",
        model: "Superb",
        year: 2023,
        price_eur: 34900,
        status: "active",
        views: 234,
        inquiries: 4,
        expires_at: "2026-01-25",
        is_top_ad: false,
        is_highlighted: false,
        photo: "https://images.unsplash.com/photo-1619976215249-0df5a6f9c1ec?w=400&q=80",
        selected: false,
    },
    {
        id: "d5",
        brand: "Volkswagen",
        model: "Touareg",
        year: 2021,
        price_eur: 48500,
        status: "sold",
        views: 678,
        inquiries: 15,
        expires_at: null,
        is_top_ad: false,
        is_highlighted: false,
        photo: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80",
        selected: false,
    },
];

const TABS = [
    { id: "ads", label: "Inzeráty", icon: "📋" },
    { id: "bulk", label: "Hromadné akcie", icon: "⚡" },
    { id: "storefront", label: "Predajňa", icon: "🏪" },
    { id: "analytics", label: "Štatistiky", icon: "📊" },
    { id: "settings", label: "Nastavenia", icon: "⚙️" },
];

export default function DealerDashboardClient() {
    const { user, profile, loading } = useAuth();
    const [activeTab, setActiveTab] = useState("ads");
    const [ads, setAds] = useState(MOCK_DEALER_ADS);
    const [selectAll, setSelectAll] = useState(false);
    const t = useTranslations("dealer");
    const tCommon = useTranslations("common");

    // Check if user is a dealer (mock for now)
    const isDealer = true; // TODO: Check from profile

    if (loading) {
        return (
            <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-surface" />
                    <div className="h-4 w-32 rounded bg-surface" />
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="pt-24 pb-16 min-h-screen">
                <div className="mx-auto max-w-lg px-4 text-center">
                    <h1 className="text-2xl font-bold text-primary mb-4">
                        {t("loginRequired")}
                    </h1>
                    <Link
                        href="/auth/login"
                        className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold"
                    >
                        {tCommon("login")}
                    </Link>
                </div>
            </main>
        );
    }

    if (!isDealer) {
        return (
            <main className="pt-24 pb-16 min-h-screen">
                <div className="mx-auto max-w-lg px-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-3xl">🏪</span>
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">
                        {t("becomeDealer")}
                    </h1>
                    <p className="text-secondary mb-6">
                        {t("dealerBenefits")}
                    </p>
                    <Link
                        href="/dealer/registracia"
                        className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold"
                    >
                        {t("registerDealership")}
                    </Link>
                </div>
            </main>
        );
    }

    const selectedCount = ads.filter((ad) => ad.selected).length;
    const activeAds = ads.filter((ad) => ad.status === "active");

    const toggleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        setAds(ads.map((ad) => ({ ...ad, selected: ad.status === "active" ? newSelectAll : false })));
    };

    const toggleSelect = (id: string) => {
        setAds(ads.map((ad) => (ad.id === id ? { ...ad, selected: !ad.selected } : ad)));
    };

    return (
        <main className="pt-20 pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="py-8 flex flex-wrap items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Image
                            src={MOCK_DEALER.logo_url}
                            alt={MOCK_DEALER.business_name}
                            width={64}
                            height={64}
                            className="rounded-xl object-cover border border-border"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-primary">
                                    {MOCK_DEALER.business_name}
                                </h1>
                                {MOCK_DEALER.is_verified && (
                                    <span className="text-accent" title="Overený dealer">
                                        <VerifiedIcon className="w-5 h-5" />
                                    </span>
                                )}
                            </div>
                            <p className="text-secondary">{MOCK_DEALER.address}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={`/dealer/${MOCK_DEALER.slug}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-primary hover:bg-surface"
                        >
                            <ExternalLinkIcon className="w-4 h-4" />
                            {t("viewStorefront")}
                        </Link>
                        <Link
                            href="/pridat-inzerat"
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover"
                        >
                            <PlusIcon className="w-5 h-5" />
                            {t("addListing")}
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4 lg:grid-cols-5">
                    <StatCard icon="💰" label="Kredity" value={profile?.credit_balance?.toString() || "0"} />
                    <StatCard icon="📋" label="Aktívne" value={activeAds.length.toString()} />
                    <StatCard icon="👁️" label="Zobrazenia" value={ads.reduce((s, a) => s + a.views, 0).toLocaleString()} />
                    <StatCard icon="💬" label="Dopyty" value={ads.reduce((s, a) => s + a.inquiries, 0).toString()} />
                    <StatCard icon="✅" label="Predané" value={ads.filter((a) => a.status === "sold").length.toString()} />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-border">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                ? "bg-accent text-white"
                                : "bg-surface text-secondary hover:text-primary"
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "ads" && (
                    <AdsTab
                        ads={ads}
                        selectAll={selectAll}
                        toggleSelectAll={toggleSelectAll}
                        toggleSelect={toggleSelect}
                        selectedCount={selectedCount}
                    />
                )}
                {activeTab === "bulk" && (
                    <BulkActionsTab
                        ads={ads}
                        selectedCount={selectedCount}
                        setAds={setAds}
                    />
                )}
                {activeTab === "storefront" && <StorefrontTab dealer={MOCK_DEALER} />}
                {activeTab === "analytics" && <AnalyticsTab ads={ads} />}
                {activeTab === "settings" && <SettingsTab dealer={MOCK_DEALER} />}
            </div>
        </main>
    );
}

// Ads Tab
function AdsTab({
    ads,
    selectAll,
    toggleSelectAll,
    toggleSelect,
    selectedCount,
}: {
    ads: typeof MOCK_DEALER_ADS;
    selectAll: boolean;
    toggleSelectAll: () => void;
    toggleSelect: (id: string) => void;
    selectedCount: number;
}) {
    // Memoize the getDaysRemaining function to avoid Date.now() calls during render
    const getDaysRemaining = useCallback((dateStr: string | null) => {
        if (!dateStr) return null;
        const now = Date.now();
        const days = Math.ceil((new Date(dateStr).getTime() - now) / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    }, []);

    return (
        <div>
            {/* Selection Header */}
            <div className="flex items-center justify-between mb-4 p-4 rounded-xl bg-surface">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded border-border accent-accent"
                    />
                    <span className="text-sm font-medium text-primary">
                        Vybrať všetky ({ads.filter((a) => a.status === "active").length})
                    </span>
                </label>

                {selectedCount > 0 && (
                    <span className="text-sm text-secondary">
                        Vybraných: <span className="font-semibold text-accent">{selectedCount}</span>
                    </span>
                )}
            </div>

            {/* Ads List */}
            <div className="space-y-3">
                {ads.map((ad) => {
                    const daysRemaining = getDaysRemaining(ad.expires_at);

                    return (
                        <div
                            key={ad.id}
                            className={`flex gap-4 p-4 rounded-xl border transition-all ${ad.selected
                                ? "border-accent bg-accent/5"
                                : "border-border bg-background hover:border-accent/30"
                                }`}
                        >
                            {/* Checkbox */}
                            <input
                                type="checkbox"
                                checked={ad.selected}
                                onChange={() => toggleSelect(ad.id)}
                                disabled={ad.status !== "active"}
                                className="mt-1 w-5 h-5 rounded border-border accent-accent disabled:opacity-50"
                            />

                            {/* Photo */}
                            <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0">
                                <Image src={ad.photo} alt={`${ad.brand} ${ad.model}`} fill sizes="112px" className="object-cover" />
                                {ad.is_top_ad && (
                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-accent text-white text-xs font-semibold">
                                        TOP
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-primary">
                                            {ad.brand} {ad.model}
                                        </h3>
                                        <p className="text-sm text-secondary">
                                            {ad.year} • {formatCurrency(ad.price_eur)}
                                        </p>
                                    </div>
                                    {ad.status === "active" ? (
                                        <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                                            Aktívny
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                                            Predané
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-4 mt-2 text-sm text-secondary">
                                    <span>👁️ {ad.views}</span>
                                    <span>💬 {ad.inquiries}</span>
                                    {daysRemaining !== null && (
                                        <span className={daysRemaining <= 5 ? "text-error" : ""}>
                                            ⏱️ {daysRemaining} dní
                                        </span>
                                    )}
                                    {ad.is_highlighted && <span>✨ Zvýraznený</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Bulk Actions Tab
function BulkActionsTab({
    ads: _ads,
    selectedCount,
    setAds: _setAds,
}: {
    ads: typeof MOCK_DEALER_ADS;
    selectedCount: number;
    setAds: React.Dispatch<React.SetStateAction<typeof MOCK_DEALER_ADS>>;
}) {
    const bulkActions = [
        { id: "prolong", label: "Predĺžiť o 30 dní", icon: "🔄", cost: 1 },
        { id: "top", label: "Topovať (7 dní)", icon: "⭐", cost: 3 },
        { id: "highlight", label: "Zvýrazniť (7 dní)", icon: "✨", cost: 2 },
        { id: "bump", label: "Posunúť nahor", icon: "🚀", cost: 1 },
    ];

    // Calculate discount based on count
    const getDiscount = (count: number): number => {
        const tier = DEALER_BULK_TIERS.find(
            (d) => count >= d.minAds && count <= d.maxAds
        );
        return tier?.discount || 0;
    };

    const discount = getDiscount(selectedCount);

    const handleBulkAction = (actionId: string, costPerItem: number) => {
        if (selectedCount === 0) {
            alert("Najprv vyberte inzeráty v záložke Inzeráty");
            return;
        }

        const baseCost = selectedCount * costPerItem;
        const discountAmount = Math.round(baseCost * (discount / 100));
        const finalCost = baseCost - discountAmount;

        const confirm = window.confirm(
            `Aplikovať "${actionId}" na ${selectedCount} inzerátov?\n\nCena: ${baseCost} kreditov\nZľava: -${discountAmount} kreditov (${discount}%)\nSpolu: ${finalCost} kreditov`
        );

        if (confirm) {
            // TODO: Call API
            alert(`Akcia "${actionId}" bola úspešne aplikovaná na ${selectedCount} inzerátov!`);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-6 p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-secondary">Vybraných inzerátov:</span>
                    <span className="text-xl font-bold text-primary">{selectedCount}</span>
                </div>
                {selectedCount > 0 && discount > 0 && (
                    <p className="text-sm text-success font-medium">
                        🎉 Získavate {discount}% zľavu za hromadnú akciu!
                    </p>
                )}
            </div>

            {/* Discount Tiers */}
            <div className="mb-8">
                <h3 className="text-sm font-medium text-secondary mb-3">Zľavy pre dealerov</h3>
                <div className="flex gap-2 flex-wrap">
                    {DEALER_BULK_TIERS.map((tier) => (
                        <div
                            key={tier.minAds}
                            className={`px-3 py-2 rounded-lg border text-sm ${selectedCount >= tier.minAds && selectedCount <= tier.maxAds
                                ? "border-accent bg-accent/10 text-accent font-medium"
                                : "border-border text-secondary"
                                }`}
                        >
                            {tier.minAds}-{tier.maxAds === Infinity ? "∞" : tier.maxAds} inzerátov: -{tier.discount}%
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
                {bulkActions.map((action) => {
                    const baseCost = selectedCount * action.cost;
                    const discountAmount = Math.round(baseCost * (discount / 100));
                    const finalCost = baseCost - discountAmount;

                    return (
                        <button
                            key={action.id}
                            onClick={() => handleBulkAction(action.id, action.cost)}
                            disabled={selectedCount === 0}
                            className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <span className="text-2xl">{action.icon}</span>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-primary">{action.label}</p>
                                <p className="text-sm text-secondary">{action.cost} kr / inzerát</p>
                            </div>
                            <div className="text-right">
                                {discount > 0 && selectedCount > 0 && (
                                    <p className="text-xs text-secondary line-through">{baseCost} kr</p>
                                )}
                                <p className="font-bold text-accent">{finalCost} kr</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Storefront Tab
function StorefrontTab({ dealer }: { dealer: typeof MOCK_DEALER }) {
    return (
        <div className="max-w-2xl space-y-6">
            <div className="p-6 rounded-2xl border border-border">
                <h3 className="font-semibold text-primary mb-4">Verejný profil predajne</h3>
                <p className="text-secondary mb-4">
                    URL vašej predajne:{" "}
                    <a
                        href={`/dealer/${dealer.slug}`}
                        className="text-accent hover:underline"
                        target="_blank"
                    >
                        autobazar123.sk/dealer/{dealer.slug}
                    </a>
                </p>

                <div className="p-4 rounded-xl bg-surface">
                    <div className="flex items-center gap-4 mb-4">
                        <Image
                            src={dealer.logo_url}
                            alt={dealer.business_name}
                            width={64}
                            height={64}
                            className="rounded-xl object-cover"
                        />
                        <div>
                            <h4 className="font-semibold text-primary">{dealer.business_name}</h4>
                            <p className="text-sm text-secondary">{dealer.address}</p>
                        </div>
                    </div>
                    <p className="text-sm text-secondary">{dealer.description}</p>
                </div>
            </div>

            <div className="p-6 rounded-2xl border border-border">
                <h3 className="font-semibold text-primary mb-4">Kontaktné údaje</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-secondary">Telefón:</span>
                        <span className="text-primary">{dealer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Email:</span>
                        <span className="text-primary">{dealer.email}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Web:</span>
                        <span className="text-accent">{dealer.website}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Analytics Tab
function AnalyticsTab({ ads }: { ads: typeof MOCK_DEALER_ADS }) {
    const totalViews = ads.reduce((s, a) => s + a.views, 0);
    const totalInquiries = ads.reduce((s, a) => s + a.inquiries, 0);
    const conversionRate = totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(2) : "0";

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-6 rounded-2xl border border-border text-center">
                    <p className="text-3xl font-bold text-primary">{totalViews.toLocaleString()}</p>
                    <p className="text-secondary">Celkové zobrazenia</p>
                </div>
                <div className="p-6 rounded-2xl border border-border text-center">
                    <p className="text-3xl font-bold text-primary">{totalInquiries}</p>
                    <p className="text-secondary">Celkové dopyty</p>
                </div>
                <div className="p-6 rounded-2xl border border-border text-center">
                    <p className="text-3xl font-bold text-accent">{conversionRate}%</p>
                    <p className="text-secondary">Konverzný pomer</p>
                </div>
            </div>

            <div className="p-6 rounded-2xl border border-border">
                <h3 className="font-semibold text-primary mb-4">Top inzeráty podľa zobrazení</h3>
                <div className="space-y-3">
                    {[...ads]
                        .sort((a, b) => b.views - a.views)
                        .slice(0, 5)
                        .map((ad, index) => (
                            <div key={ad.id} className="flex items-center gap-4">
                                <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-sm font-medium text-secondary">
                                    {index + 1}
                                </span>
                                <Image src={ad.photo} alt="" width={48} height={32} className="rounded object-cover" />
                                <span className="flex-1 font-medium text-primary">
                                    {ad.brand} {ad.model}
                                </span>
                                <span className="text-secondary">{ad.views} zobrazení</span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

// Settings Tab
function SettingsTab({ dealer }: { dealer: typeof MOCK_DEALER }) {
    return (
        <div className="max-w-lg space-y-6">
            <div>
                <h3 className="font-semibold text-primary mb-4">Údaje predajne</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Názov firmy</label>
                        <input type="text" defaultValue={dealer.business_name} className="form-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Popis</label>
                        <textarea rows={3} defaultValue={dealer.description} className="form-input resize-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Adresa</label>
                        <input type="text" defaultValue={dealer.address} className="form-input" />
                    </div>
                    <button className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover">
                        Uložiť zmeny
                    </button>
                </div>
            </div>
        </div>
    );
}

// Components
function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="p-4 rounded-xl border border-border">
            <span className="text-xl">{icon}</span>
            <p className="text-2xl font-bold text-primary mt-2">{value}</p>
            <p className="text-sm text-secondary">{label}</p>
        </div>
    );
}

// Icons
function VerifiedIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );
}

function ExternalLinkIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}
