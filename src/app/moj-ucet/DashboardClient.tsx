"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { formatCurrency } from "@/config/vat";
import { CREDIT_PACKS, ACTION_COSTS } from "@/config/credits";

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

const TABS = [
    { id: "ads", label: "Moje inzeráty", icon: "📋" },
    { id: "credits", label: "Kredity", icon: "💰" },
    { id: "saved", label: "Uložené", icon: "❤️" },
    { id: "messages", label: "Správy", icon: "💬" },
    { id: "settings", label: "Nastavenia", icon: "⚙️" },
];

export default function DashboardClient() {
    const { user, profile, loading, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState("ads");

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
                        Pre prístup k účtu sa musíte prihlásiť
                    </h1>
                    <Link
                        href="/auth/login"
                        className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold"
                    >
                        Prihlásiť sa
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
                                {profile?.full_name || "Používateľ"}
                            </h1>
                            <p className="text-secondary">{user.email}</p>
                        </div>
                    </div>
                    <Link
                        href="/pridat-inzerat"
                        className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Pridať inzerát
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
                    <StatCard
                        icon="💰"
                        label="Kredity"
                        value={profile?.credit_balance?.toString() || "0"}
                        action={{ label: "Kúpiť", onClick: () => setActiveTab("credits") }}
                    />
                    <StatCard
                        icon="📋"
                        label="Aktívne inzeráty"
                        value={MOCK_MY_ADS.filter((ad) => ad.status === "active").length.toString()}
                    />
                    <StatCard
                        icon="👁️"
                        label="Zobrazenia"
                        value={MOCK_MY_ADS.reduce((sum, ad) => sum + ad.views, 0).toString()}
                    />
                    <StatCard
                        icon="💬"
                        label="Dopyty"
                        value={MOCK_MY_ADS.reduce((sum, ad) => sum + ad.inquiries, 0).toString()}
                    />
                </div>

                {/* Tabs Navigation */}
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
                {activeTab === "ads" && <MyAdsTab ads={MOCK_MY_ADS} />}
                {activeTab === "credits" && <CreditsTab transactions={MOCK_TRANSACTIONS} balance={profile?.credit_balance || 0} />}
                {activeTab === "saved" && <SavedTab />}
                {activeTab === "messages" && <MessagesTab />}
                {activeTab === "settings" && <SettingsTab profile={profile} signOut={signOut} />}
            </div>
        </main>
    );
}

// My Ads Tab
function MyAdsTab({ ads }: { ads: typeof MOCK_MY_ADS }) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return { label: "Aktívny", class: "bg-success/10 text-success" };
            case "sold":
                return { label: "Predané", class: "bg-secondary/10 text-secondary" };
            case "expired":
                return { label: "Expirovaný", class: "bg-error/10 text-error" };
            default:
                return { label: status, class: "bg-surface text-secondary" };
        }
    };

    const getDaysRemaining = (dateStr: string | null) => {
        if (!dateStr) return null;
        const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    return (
        <div className="space-y-4">
            {ads.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-secondary mb-4">Zatiaľ nemáte žiadne inzeráty</p>
                    <Link
                        href="/pridat-inzerat"
                        className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold"
                    >
                        Pridať prvý inzerát
                    </Link>
                </div>
            ) : (
                ads.map((ad) => {
                    const status = getStatusBadge(ad.status);
                    const daysRemaining = getDaysRemaining(ad.expires_at);

                    return (
                        <div
                            key={ad.id}
                            className="flex gap-4 p-4 rounded-2xl border border-border bg-background hover:shadow-md transition-shadow"
                        >
                            {/* Photo */}
                            <div className="relative w-32 h-24 rounded-xl overflow-hidden shrink-0">
                                <img
                                    src={ad.photo}
                                    alt={`${ad.brand} ${ad.model}`}
                                    className="w-full h-full object-cover"
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
                                        <h3 className="font-semibold text-primary">
                                            {ad.brand} {ad.model}
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
                                        {ad.views}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageIcon className="w-4 h-4" />
                                        {ad.inquiries}
                                    </span>
                                    {daysRemaining !== null && (
                                        <span className={`flex items-center gap-1 ${daysRemaining <= 3 ? "text-error" : ""}`}>
                                            <ClockIcon className="w-4 h-4" />
                                            {daysRemaining} dní
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                {ad.status === "active" && (
                                    <div className="flex gap-2 mt-3">
                                        <button className="px-3 py-1.5 rounded-lg bg-surface text-sm font-medium text-primary hover:bg-surface-hover">
                                            Upraviť
                                        </button>
                                        <button className="px-3 py-1.5 rounded-lg bg-accent/10 text-sm font-medium text-accent hover:bg-accent/20">
                                            Topovať (3 kr)
                                        </button>
                                        <button className="px-3 py-1.5 rounded-lg text-sm text-secondary hover:text-error">
                                            Označiť ako predané
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
    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Left - Buy Credits */}
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-primary mb-4">Kúpiť kredity</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {CREDIT_PACKS.map((pack) => (
                            <div
                                key={pack.id}
                                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer hover:border-accent ${pack.featured ? "border-accent bg-accent/5" : "border-border"
                                    }`}
                            >
                                {pack.featured && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold">
                                        Obľúbené
                                    </span>
                                )}
                                <p className="text-2xl font-bold text-primary">{pack.credits}</p>
                                <p className="text-sm text-secondary">kreditov</p>
                                <p className="mt-3 text-xl font-bold text-accent">{pack.price} €</p>
                                {pack.discount > 0 && (
                                    <span className="text-xs text-success font-medium">
                                        Ušetríte {pack.discount}%
                                    </span>
                                )}
                                <button className="w-full mt-4 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors">
                                    Kúpiť
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing Info */}
                <div className="p-6 rounded-2xl bg-surface">
                    <h3 className="font-semibold text-primary mb-4">Cenník akcií</h3>
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
                    <p className="text-sm text-secondary mb-2">Váš zostatok</p>
                    <p className="text-4xl font-bold text-accent">{balance}</p>
                    <p className="text-secondary">kreditov</p>
                </div>

                <div className="p-6 rounded-2xl border border-border">
                    <h3 className="font-semibold text-primary mb-4">História transakcií</h3>
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

// Saved Tab (placeholder)
function SavedTab() {
    return (
        <div className="text-center py-12">
            <HeartIcon className="w-16 h-16 mx-auto text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">Žiadne uložené inzeráty</h3>
            <p className="text-secondary mb-4">
                Kliknite na srdce pri inzeráte pre jeho uloženie
            </p>
            <Link
                href="/auta"
                className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold"
            >
                Prezerať autá
            </Link>
        </div>
    );
}

// Messages Tab (placeholder)
function MessagesTab() {
    return (
        <div className="text-center py-12">
            <MessageIcon className="w-16 h-16 mx-auto text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">Žiadne správy</h3>
            <p className="text-secondary">
                Tu sa zobrazia správy od záujemcov o vaše inzeráty
            </p>
        </div>
    );
}

// Settings Tab
function SettingsTab({
    profile,
    signOut,
}: {
    profile: { full_name?: string | null; phone?: string | null } | null;
    signOut: () => Promise<void>;
}) {
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [phone, setPhone] = useState(profile?.phone || "");

    return (
        <div className="max-w-lg space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-primary mb-4">Profil</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Meno</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Telefón</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+421 XXX XXX XXX"
                            className="form-input"
                        />
                    </div>
                    <button className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover">
                        Uložiť zmeny
                    </button>
                </div>
            </div>

            <hr className="border-border" />

            <div>
                <h2 className="text-xl font-semibold text-primary mb-4">Nebezpečná zóna</h2>
                <button
                    onClick={signOut}
                    className="px-6 py-2.5 rounded-lg border border-error text-error font-semibold hover:bg-error/5"
                >
                    Odhlásiť sa
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
