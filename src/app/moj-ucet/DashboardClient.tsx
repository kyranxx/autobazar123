"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/config/vat";
import { CREDIT_PACKS, ACTION_COSTS } from "@/config/credits";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";

// Type definitions for ads
interface UserAd {
    id: string;
    brand?: string;
    model?: string;
    year: number;
    price_eur: number;
    mileage_km?: number;
    status: string;
    views?: number;
    views_count?: number;
    inquiries?: number;
    expires_at: string | null;
    is_top_ad: boolean;
    photo?: string;
    photos_json?: string[];
    brands?: { name: string };
    models?: { name: string };
}

interface SavedAd {
    id: string;
    year: number;
    price_eur: number;
    mileage_km?: number;
    location_city?: string;
    fuel?: string;
    photos_json?: string[];
    brands?: { name: string };
    models?: { name: string };
}

// Mock data
const MOCK_MY_ADS = [
    {
        id: "1",
        brand: "Škoda",
        model: "Octavia",
        year: 2019,
        price_eur: 16990,
        status: "active",
        views: 234,
        inquiries: 5,
        expires_at: "2026-02-05",
        is_top_ad: true,
        photo: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&q=80",
    },
    {
        id: "2",
        brand: "BMW",
        model: "Rad 3",
        year: 2018,
        price_eur: 24900,
        status: "active",
        views: 89,
        inquiries: 2,
        expires_at: "2026-01-25",
        is_top_ad: false,
        photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80",
    },
    {
        id: "3",
        brand: "Volkswagen",
        model: "Golf",
        year: 2017,
        price_eur: 12500,
        status: "sold",
        views: 456,
        inquiries: 12,
        expires_at: null,
        is_top_ad: false,
        photo: "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=400&q=80",
    },
];

const MOCK_TRANSACTIONS = [
    { id: "1", type: "top_up", amount: 25, description: "Kúpa kreditov - Predajca", date: "2026-01-05" },
    { id: "2", type: "publish", amount: -1, description: "Zverejnenie inzerátu - Škoda Octavia", date: "2026-01-05" },
    { id: "3", type: "top_ad", amount: -3, description: "TOP inzerát - Škoda Octavia", date: "2026-01-06" },
    { id: "4", type: "publish", amount: -1, description: "Zverejnenie inzerátu - BMW Rad 3", date: "2026-01-06" },
];

const TABS_CONFIG = [
    { id: "ads", labelKey: "myAds", icon: "📋" },
    { id: "credits", labelKey: "credits", icon: "💰" },
    { id: "saved", labelKey: "savedCars", icon: "❤️" },
    { id: "messages", labelKey: "messages", icon: "💬" },
    { id: "settings", labelKey: "settings", icon: "⚙️" },
];

export default function DashboardClient() {
    const { user, profile, loading, signOut } = useAuth();
    const supabase = createClient();
    const t = useTranslations("dashboard");
    const tAuth = useTranslations("auth");
    const tCommon = useTranslations("common");

    // URL state management
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const tabParam = searchParams.get("tab");

    const [activeTab, setActiveTab] = useState(tabParam || "ads");

    // Saved cars state - lifted up to persist across tab changes
    const [savedCarIds, setSavedCarIds] = useState<Set<string>>(new Set());

    // User's real ads from database
    const [userAds, setUserAds] = useState<UserAd[]>([]);
    const [adsLoading, setAdsLoading] = useState(true);



    const loadUserAds = useCallback(async () => {
        if (!user) return;
        setAdsLoading(true);
        try {
            const { data, error } = await supabase
                .from('ads')
                .select(`
                    id, 
                    year, 
                    price_eur, 
                    mileage_km, 
                    status,
                    views_count,
                    is_top_ad,
                    expires_at,
                    photos_json,
                    brands(name),
                    models(name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setUserAds(data as unknown as UserAd[]);
            }
        } catch (err) {
            console.error('Error loading user ads:', err);
        } finally {
            setAdsLoading(false);
        }
    }, [user, supabase]);

    const loadSavedCars = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('saved_ads')
                .select('ad_id')
                .eq('user_id', user.id);

            if (!error && data) {
                setSavedCarIds(new Set(data.map(d => d.ad_id)));
            }
        } catch (err) {
            console.error('Error loading saved cars:', err);
        }
    }, [user, supabase]);

    // Load user's saved cars and ads
    useEffect(() => {
        if (user) {
            loadUserAds();
            loadSavedCars();
        }
    }, [user, loadUserAds, loadSavedCars]);

    const handleUnsaveCar = useCallback(async (adId: string) => {
        if (!user) return;
        try {
            await supabase
                .from('saved_ads')
                .delete()
                .eq('user_id', user.id)
                .eq('ad_id', adId);

            setSavedCarIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(adId);
                return newSet;
            });
        } catch (err) {
            console.error('Error removing saved car:', err);
        }
    }, [user, supabase]);

    const handleSignOutWithRedirect = async () => {
        await signOut();
        router.push('/');
    };

    // Sync URL with state
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        const params = new URLSearchParams(searchParams);
        params.set("tab", tabId);
        router.push(`${pathname}?${params.toString()}`);
    };

    // Sync state with URL if it changes externally
    useEffect(() => {
        if (tabParam && tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
    }, [tabParam, activeTab]);

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
                        {tAuth("loginRequired")}
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

    return (
        <main className="pt-20 pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="py-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-primary">
                                {profile?.full_name || t("user")}
                            </h1>
                            <p className="text-secondary">{user.email}</p>
                        </div>
                    </div>
                    <Link
                        href="/pridat-inzerat"
                        className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
                    >
                        <PlusIcon className="w-5 h-5" />
                        {tCommon("addListing")}
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
                    <StatCard
                        icon="💰"
                        label={t("credits")}
                        value={profile?.credit_balance?.toString() || "0"}
                        action={{ label: t("buy"), onClick: () => handleTabChange("credits") }}
                    />
                    <StatCard
                        icon="📋"
                        label={t("activeAds")}
                        value={MOCK_MY_ADS.filter((ad) => ad.status === "active").length.toString()}
                    />
                    <StatCard
                        icon="👁️"
                        label={t("views")}
                        value={MOCK_MY_ADS.reduce((sum, ad) => sum + ad.views, 0).toString()}
                    />
                    <StatCard
                        icon="💬"
                        label={t("inquiries")}
                        value={MOCK_MY_ADS.reduce((sum, ad) => sum + ad.inquiries, 0).toString()}
                    />
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-border">
                    {TABS_CONFIG.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                ? "bg-accent text-white"
                                : "bg-surface text-secondary hover:text-primary"
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "ads" && <MyAdsTab ads={userAds.length > 0 ? userAds : MOCK_MY_ADS} isLoading={adsLoading} onRefresh={loadUserAds} />}
                {activeTab === "credits" && <CreditsTab transactions={MOCK_TRANSACTIONS} balance={profile?.credit_balance || 0} />}
                {activeTab === "saved" && <SavedTab savedCarIds={savedCarIds} onUnsave={handleUnsaveCar} />}
                {activeTab === "messages" && <MessagesTab />}
                {activeTab === "settings" && <SettingsTab profile={profile} signOut={handleSignOutWithRedirect} />}
            </div>
        </main>
    );
}

// My Ads Tab
function MyAdsTab({ ads, isLoading, onRefresh }: { ads: UserAd[]; isLoading: boolean; onRefresh: () => void }) {
    const router = useRouter();
    const { user } = useAuth();
    const supabase = createClient();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const t = useTranslations("dashboard");
    const tCommon = useTranslations("common");

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return { label: t("active"), class: "bg-success/10 text-success" };
            case "sold":
                return { label: t("sold"), class: "bg-secondary/10 text-secondary" };
            case "expired":
                return { label: t("expired"), class: "bg-error/10 text-error" };
            case "pending":
                return { label: t("pending"), class: "bg-warning/10 text-warning" };
            default:
                return { label: status, class: "bg-surface text-secondary" };
        }
    };

    const getDaysRemaining = (dateStr: string | null) => {
        if (!dateStr) return null;
        const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    const handleViewAd = (adId: string) => {
        router.push(`/auto/${adId}`);
    };

    const handleEditAd = (adId: string) => {
        router.push(`/upravit-inzerat/${adId}`);
    };

    const handleMarkAsSold = async (adId: string) => {
        setActionLoading(adId);
        try {
            const { error } = await supabase
                .from('ads')
                .update({ status: 'sold' })
                .eq('id', adId);

            if (!error) {
                onRefresh();
            }
        } catch (err) {
            console.error('Error marking as sold:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const [boostLoading, setBoostLoading] = useState<string | null>(null);
    const [boostSuccess, setBoostSuccess] = useState<string | null>(null);

    const handleBoostAd = async (adId: string) => {
        if (!user?.id) return;
        setBoostLoading(adId);

        try {
            // Check if user has enough credits
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (!profile || profile.credits < 3) {
                alert('Nemáte dostatok kreditov. Potrebujete 3 kredity na topovanie.');
                setBoostLoading(null);
                return;
            }

            // Deduct credits
            await supabase
                .from('profiles')
                .update({ credits: profile.credits - 3 })
                .eq('id', user.id);

            // Set ad as TOP for 7 days
            const topUntil = new Date();
            topUntil.setDate(topUntil.getDate() + 7);

            const { error } = await supabase
                .from('ads')
                .update({
                    is_top_ad: true,
                    top_until: topUntil.toISOString()
                })
                .eq('id', adId);

            if (!error) {
                setBoostSuccess(adId);
                setTimeout(() => setBoostSuccess(null), 3000);
                onRefresh();
            }
        } catch (err) {
            console.error('Error boosting ad:', err);
        } finally {
            setBoostLoading(null);
        }
    };

    // Helper to get brand/model name from nested objects or direct properties
    const getBrandName = (ad: UserAd) => ad.brands?.name || ad.brand || t("unknown");
    const getModelName = (ad: UserAd) => ad.models?.name || ad.model || '';
    const getPhoto = (ad: UserAd) => {
        if (ad.photo) return ad.photo;
        if (ad.photos_json && ad.photos_json.length > 0) return ad.photos_json[0];
        return 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80';
    };
    const getViews = (ad: UserAd) => ad.views || ad.views_count || 0;
    const getInquiries = (ad: UserAd) => ad.inquiries || 0;

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border bg-background animate-pulse">
                        <div className="w-32 h-24 rounded-xl bg-surface" />
                        <div className="flex-1 space-y-3">
                            <div className="h-5 bg-surface rounded w-1/2" />
                            <div className="h-4 bg-surface rounded w-1/3" />
                            <div className="h-4 bg-surface rounded w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {ads.length === 0 ? (
                <div className="text-center py-12">
                    <CarIcon className="w-16 h-16 mx-auto text-tertiary mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2">{t("noAdsYet")}</h3>
                    <p className="text-secondary mb-4">{t("addFirstAd")}</p>
                    <Link
                        href="/pridat-inzerat"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        {t("addFirstListing")}
                    </Link>
                </div>
            ) : (
                ads.map((ad) => {
                    const status = getStatusBadge(ad.status);
                    const daysRemaining = getDaysRemaining(ad.expires_at);
                    const isActionLoading = actionLoading === ad.id;

                    return (
                        <div
                            key={ad.id}
                            className="flex gap-4 p-4 rounded-2xl border border-border bg-background hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => handleViewAd(ad.id)}
                        >
                            {/* Photo */}
                            <div className="relative w-32 h-24 rounded-xl overflow-hidden shrink-0">
                                <Image
                                    src={getPhoto(ad)}
                                    alt={`${getBrandName(ad)} ${getModelName(ad)}`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                    sizes="(max-width: 768px) 128px, 128px"
                                />
                                {ad.is_top_ad && (
                                    <span className="absolute top-1 left-1 px-2 py-0.5 rounded bg-accent text-white text-xs font-semibold">
                                        TOP
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                                            {getBrandName(ad)} {getModelName(ad)}
                                        </h3>
                                        <p className="text-sm text-secondary">
                                            {ad.year} • {formatCurrency(ad.price_eur)}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-4 mt-2 text-sm text-secondary">
                                    <span className="flex items-center gap-1">
                                        <EyeIcon className="w-4 h-4" />
                                        {getViews(ad)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageIcon className="w-4 h-4" />
                                        {getInquiries(ad)}
                                    </span>
                                    {daysRemaining !== null && (
                                        <span className={`flex items-center gap-1 ${daysRemaining <= 3 ? "text-error" : ""}`}>
                                            <ClockIcon className="w-4 h-4" />
                                            {daysRemaining} {t("days")}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                {ad.status === "active" && (
                                    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleEditAd(ad.id)}
                                            className="px-3 py-1.5 rounded-lg bg-surface text-sm font-medium text-primary hover:bg-surface-hover transition-colors"
                                        >
                                            {tCommon("edit")}
                                        </button>
                                        <button
                                            onClick={() => handleBoostAd(ad.id)}
                                            disabled={boostLoading === ad.id || ad.is_top_ad}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${boostSuccess === ad.id
                                                ? "bg-success/10 text-success"
                                                : ad.is_top_ad
                                                    ? "bg-accent text-white"
                                                    : "bg-accent/10 text-accent hover:bg-accent/20"
                                                }`}
                                        >
                                            {boostLoading === ad.id ? t("boosting") : boostSuccess === ad.id ? t("boosted") : ad.is_top_ad ? t("alreadyTop") : t("boostCredits")}
                                        </button>
                                        <button
                                            onClick={() => handleMarkAsSold(ad.id)}
                                            disabled={isActionLoading}
                                            className="px-3 py-1.5 rounded-lg text-sm text-secondary hover:text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                                        >
                                            {isActionLoading ? t("saving") : t("markAsSold")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

// Credits Tab
function CreditsTab({
    transactions,
    balance,
}: {
    transactions: typeof MOCK_TRANSACTIONS;
    balance: number;
}) {
    const t = useTranslations("dashboard");

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Left - Buy Credits */}
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-primary mb-4">{t("buyCredits")}</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {CREDIT_PACKS.map((pack) => (
                            <div
                                key={pack.id}
                                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer hover:border-accent ${pack.featured ? "border-accent bg-accent/5" : "border-border"
                                    }`}
                            >
                                {pack.featured && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold">
                                        {t("popular")}
                                    </span>
                                )}
                                <p className="text-2xl font-bold text-primary">{pack.credits}</p>
                                <p className="text-sm text-secondary">{t("creditsWord")}</p>
                                <p className="mt-3 text-xl font-bold text-accent">{pack.price} €</p>
                                {pack.discount > 0 && (
                                    <span className="text-xs text-success font-medium">
                                        {t("savePercent", { percent: pack.discount })}
                                    </span>
                                )}
                                <button className="w-full mt-4 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors">
                                    {t("buy")}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing Info */}
                <div className="p-6 rounded-2xl bg-surface">
                    <h3 className="font-semibold text-primary mb-4">{t("actionPricing")}</h3>
                    <div className="space-y-3">
                        {ACTION_COSTS.map((action) => (
                            <div key={action.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-primary">{action.nameSk}</p>
                                    <p className="text-sm text-secondary">{action.descriptionSk}</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-accent">{action.credits} kr</span>
                                    <p className="text-xs text-secondary">{action.duration}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right - Balance & History */}
            <div className="space-y-6">
                <div className="p-6 rounded-2xl border border-border text-center">
                    <p className="text-sm text-secondary mb-2">{t("yourBalance")}</p>
                    <p className="text-4xl font-bold text-accent">{balance}</p>
                    <p className="text-secondary">{t("creditsWord")}</p>
                </div>

                <div className="p-6 rounded-2xl border border-border">
                    <h3 className="font-semibold text-primary mb-4">{t("transactionHistory")}</h3>
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-primary">{tx.description}</p>
                                    <p className="text-xs text-secondary">{tx.date}</p>
                                </div>
                                <span
                                    className={`font-bold ${tx.amount > 0 ? "text-success" : "text-primary"}`}
                                >
                                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Saved Tab (functional with persistent state)
function SavedTab({ savedCarIds, onUnsave }: { savedCarIds: Set<string>; onUnsave: (id: string) => void }) {
    const supabase = createClient();
    const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const t = useTranslations("dashboard");
    const tFuel = useTranslations("fuel");

    // Load saved ads details
    useEffect(() => {
        const loadSavedAds = async () => {
            if (savedCarIds.size === 0) {
                setSavedAds([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('ads')
                    .select(`
                        id,
                        year,
                        price_eur,
                        mileage_km,
                        location_city,
                        fuel,
                        photos_json,
                        brands(name),
                        models(name)
                    `)
                    .in('id', Array.from(savedCarIds));

                if (!error && data) {
                    setSavedAds(data as unknown as SavedAd[]);
                }
            } catch (err) {
                console.error('Error loading saved ads:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSavedAds();
    }, [savedCarIds, supabase]);

    // Helper functions
    const getBrandName = (ad: SavedAd) => ad.brands?.name || t("unknown");
    const getModelName = (ad: SavedAd) => ad.models?.name || '';
    const getPhoto = (ad: SavedAd) => {
        if (ad.photos_json && ad.photos_json.length > 0) return ad.photos_json[0];
        return 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80';
    };
    const getFuelLabel = (fuel: string) => {
        const labels: Record<string, string> = {
            petrol: tFuel('petrol'),
            diesel: tFuel('diesel'),
            electric: tFuel('electric'),
            hybrid: tFuel('hybrid'),
            lpg: tFuel('lpg'),
            cng: tFuel('cng'),
        };
        return labels[fuel] || fuel;
    };

    const handleUnsaveClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        onUnsave(id);
    };

    if (isLoading) {
        return (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-border overflow-hidden animate-pulse">
                        <div className="aspect-[16/10] bg-surface" />
                        <div className="p-4 space-y-3">
                            <div className="h-5 bg-surface rounded w-3/4" />
                            <div className="h-4 bg-surface rounded w-1/2" />
                            <div className="h-6 bg-surface rounded w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (savedAds.length === 0) {
        return (
            <div className="text-center py-12">
                <HeartIcon className="w-16 h-16 mx-auto text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">{t("savedAds")}</h3>
                <p className="text-secondary mb-4">
                    {t("clickHeartToSave")}
                </p>
                <Link
                    href="/auta"
                    className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
                >
                    {t("browseCars")}
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-primary">
                    {t("savedAds")} ({savedAds.length})
                </h3>
                <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                    <input type="checkbox" className="rounded accent-accent" defaultChecked />
                    {t("priceDropNotifications")}
                </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {savedAds.map((ad) => (
                    <Link
                        key={ad.id}
                        href={`/auto/${ad.id}`}
                        className="rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all group"
                    >
                        <div className="relative aspect-[16/10]">
                            <Image
                                src={getPhoto(ad)}
                                alt={`${getBrandName(ad)} ${getModelName(ad)}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            <button
                                onClick={(e) => handleUnsaveClick(e, ad.id)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center text-error hover:bg-background hover:scale-110 transition-all"
                                title={t("removeFromSaved")}
                            >
                                ❤️
                            </button>
                        </div>
                        <div className="p-4">
                            <h4 className="font-semibold text-primary group-hover:text-accent transition-colors">
                                {getBrandName(ad)} {getModelName(ad)}
                            </h4>
                            <p className="text-sm text-secondary mt-1">
                                {ad.year} • {ad.mileage_km?.toLocaleString()} km • {ad.location_city || 'Slovensko'}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xl font-bold text-accent">
                                    {ad.price_eur?.toLocaleString()} €
                                </span>
                            </div>
                            <p className="text-xs text-tertiary mt-2">
                                {getFuelLabel(ad.fuel || '')}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// Messages Tab (functional)
function MessagesTab() {
    // Mock conversations
    const MOCK_CONVERSATIONS = [
        {
            id: "c1",
            otherUser: "Martin K.",
            carTitle: "Škoda Octavia 2.0 TDI",
            carPhoto: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=100&q=80",
            lastMessage: "Áno, auto je stále dostupné. Kedy by ste mohli prísť na obhliadku?",
            lastMessageTime: "2026-01-07T10:30:00Z",
            unread: 2,
            isMyAd: true,
        },
        {
            id: "c2",
            otherUser: "AutoMax Žilina",
            carTitle: "Mercedes GLC 220d",
            carPhoto: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=100&q=80",
            lastMessage: "Ďakujeme za záujem. Môžeme vám poslať viac fotiek?",
            lastMessageTime: "2026-01-06T16:45:00Z",
            unread: 0,
            isMyAd: false,
        },
        {
            id: "c3",
            otherUser: "Jozef N.",
            carTitle: "BMW Rad 3",
            carPhoto: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=100&q=80",
            lastMessage: "Aká je najnižšia cena?",
            lastMessageTime: "2026-01-05T09:15:00Z",
            unread: 0,
            isMyAd: true,
        },
    ];

    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const t = useTranslations("dashboard");

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return date.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
        if (diffDays === 1) return t("yesterday");
        return date.toLocaleDateString("sk-SK");
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;
        alert(`Správa odoslaná: ${replyText}`);
        setReplyText("");
    };

    if (MOCK_CONVERSATIONS.length === 0) {
        return (
            <div className="text-center py-12">
                <MessageIcon className="w-16 h-16 mx-auto text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">{t("noMessages")}</h3>
                <p className="text-secondary">
                    {t("messagesWillAppear")}
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Conversations List */}
            <div className="lg:col-span-1 space-y-2">
                <h3 className="text-lg font-semibold text-primary mb-4">{t("conversations")}</h3>
                {MOCK_CONVERSATIONS.map((conv) => (
                    <button
                        key={conv.id}
                        onClick={() => setActiveConversation(conv.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${activeConversation === conv.id
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/30"
                            }`}
                    >
                        <div className="flex gap-3">
                            <Image
                                src={conv.carPhoto}
                                alt={conv.carTitle}
                                width={48}
                                height={48}
                                className="rounded-lg object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-primary truncate">{conv.otherUser}</span>
                                    <span className="text-xs text-tertiary shrink-0">{formatTime(conv.lastMessageTime)}</span>
                                </div>
                                <p className="text-sm text-secondary truncate">{conv.carTitle}</p>
                                <p className="text-sm text-tertiary truncate mt-1">{conv.lastMessage}</p>
                            </div>
                            {conv.unread > 0 && (
                                <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0">
                                    {conv.unread}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Conversation Detail */}
            <div className="lg:col-span-2">
                {activeConversation ? (
                    <div className="rounded-2xl border border-border h-full flex flex-col">
                        {/* Header */}
                        {(() => {
                            const conv = MOCK_CONVERSATIONS.find((c) => c.id === activeConversation);
                            if (!conv) return null;
                            return (
                                <div className="p-4 border-b border-border flex items-center gap-4">
                                    <Image src={conv.carPhoto} alt="" width={48} height={48} className="rounded-lg object-cover" />
                                    <div>
                                        <p className="font-semibold text-primary">{conv.otherUser}</p>
                                        <p className="text-sm text-secondary">{conv.carTitle}</p>
                                    </div>
                                    {conv.isMyAd && (
                                        <span className="ml-auto px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                            {t("yourAd")}
                                        </span>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Messages */}
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-[300px] bg-surface/30">
                            <div className="flex justify-start">
                                <div className="max-w-[80%] p-3 rounded-2xl bg-surface">
                                    <p className="text-sm text-primary">Dobrý deň, mám záujem o vaše vozidlo. Je stále dostupné?</p>
                                    <p className="text-xs text-tertiary mt-1">10:15</p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <div className="max-w-[80%] p-3 rounded-2xl bg-accent text-white">
                                    <p className="text-sm">Áno, auto je stále dostupné. Kedy by ste mohli prísť na obhliadku?</p>
                                    <p className="text-xs text-white/70 mt-1">10:30</p>
                                </div>
                            </div>
                        </div>

                        {/* Reply Input */}
                        <div className="p-4 border-t border-border flex gap-3">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={t("writeMessage")}
                                className="form-input flex-1"
                                onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                            />
                            <button
                                onClick={handleSendReply}
                                className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover"
                            >
                                {t("send")}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border h-full flex items-center justify-center p-12">
                        <div className="text-center">
                            <MessageIcon className="w-12 h-12 mx-auto text-tertiary mb-4" />
                            <p className="text-secondary">{t("selectConversation")}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Settings Tab - simplified, name change removed per user request
function SettingsTab({
    profile,
    signOut,
}: {
    profile: { full_name?: string | null; phone?: string | null } | null;
    signOut: () => Promise<void>;
}) {
    const supabase = createClient();
    const { user } = useAuth();
    const [phone, setPhone] = useState(profile?.phone || "");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const t = useTranslations("dashboard");
    const tCommon = useTranslations("common");

    const handleSavePhone = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ phone })
                .eq('id', user.id);

            if (error) {
                setSaveMessage({ type: 'error', text: t("saveFailed") });
            } else {
                setSaveMessage({ type: 'success', text: t("changesSaved") });
            }
        } catch (_err) {
            setSaveMessage({ type: 'error', text: t("saveFailed") });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-lg space-y-8">
            {/* Profile Info - Read Only */}
            <div className="p-6 rounded-2xl border border-border bg-surface/50">
                <h2 className="text-lg font-semibold text-primary mb-4">{t("accountInfo")}</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-secondary">{t("name")}</span>
                        <span className="font-medium text-primary">{profile?.full_name || t("notProvided")}</span>
                    </div>
                    <p className="text-xs text-tertiary">
                        {t("contactAdminToChangeName")}
                    </p>
                </div>
            </div>

            {/* Contact Info - Editable */}
            <div className="p-6 rounded-2xl border border-border">
                <h2 className="text-lg font-semibold text-primary mb-4">{t("contactInfo")}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">{t("phoneNumber")}</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+421 XXX XXX XXX"
                            className="form-input"
                        />
                        <p className="text-xs text-tertiary mt-1">
                            {t("phoneVisibility")}
                        </p>
                    </div>

                    {saveMessage && (
                        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${saveMessage.type === 'success'
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error'
                            }`}>
                            {saveMessage.text}
                        </div>
                    )}

                    <button
                        onClick={handleSavePhone}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                    >
                        {isSaving ? tCommon("loading") : t("saveChanges")}
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded-2xl border border-error/30 bg-error/5">
                <h2 className="text-lg font-semibold text-error mb-2">{t("dangerZone")}</h2>
                <p className="text-sm text-secondary mb-4">
                    {t("logoutWarning")}
                </p>
                <button
                    onClick={signOut}
                    className="px-6 py-2.5 rounded-lg bg-error text-white font-semibold hover:bg-error/90 transition-colors"
                >
                    {tCommon("logout")}
                </button>
            </div>
        </div>
    );
}

// Components
function StatCard({
    icon,
    label,
    value,
    action,
}: {
    icon: string;
    label: string;
    value: string;
    action?: { label: string; onClick: () => void };
}) {
    return (
        <div className="p-4 rounded-2xl border border-border bg-background">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{icon}</span>
                {action && (
                    <button
                        onClick={action.onClick}
                        className="text-xs text-accent font-medium hover:underline"
                    >
                        {action.label}
                    </button>
                )}
            </div>
            <p className="text-2xl font-bold text-primary">{value}</p>
            <p className="text-sm text-secondary">{label}</p>
        </div>
    );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function EyeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function MessageIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}

function CarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.6-1.2-.9-1.9-.9h-3.8c-.8 0-1.5.3-2 .9C5.2 8.6 4 10 4 10s-2.7.6-4.5 1.1C-1.3 11.3-2 12.1-2 13v3c0 .6.4 1 1 1h2m4 0h10m-14 0a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
    );
}
