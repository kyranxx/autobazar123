"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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

    // URL state management
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const tabParam = searchParams.get("tab");

    const [activeTab, setActiveTab] = useState(tabParam || "ads");

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
    }, [tabParam]);

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
                        action={{ label: "Kúpiť", onClick: () => handleTabChange("credits") }}
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
                            onClick={() => handleTabChange(tab.id)}
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

// Saved Tab (functional)
function SavedTab() {
    // Mock saved ads
    const MOCK_SAVED_ADS = [
        {
            id: "s1",
            brand: "Mercedes-Benz",
            model: "GLC 220d",
            year: 2021,
            price: 42900,
            originalPrice: 45900,
            mileage: 45000,
            fuel: "Diesel",
            location: "Bratislava",
            photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80",
            savedAt: "2026-01-05",
            hasPriceDrop: true,
        },
        {
            id: "s2",
            brand: "Audi",
            model: "Q5 45 TFSI",
            year: 2022,
            price: 52500,
            originalPrice: null,
            mileage: 28000,
            fuel: "Benzín",
            location: "Žilina",
            photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80",
            savedAt: "2026-01-03",
            hasPriceDrop: false,
        },
        {
            id: "s3",
            brand: "BMW",
            model: "X3 xDrive20d",
            year: 2020,
            price: 38900,
            originalPrice: 41500,
            mileage: 67000,
            fuel: "Diesel",
            location: "Košice",
            photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80",
            savedAt: "2026-01-01",
            hasPriceDrop: true,
        },
    ];

    const [savedAds, setSavedAds] = useState(MOCK_SAVED_ADS);

    const handleUnsave = (id: string) => {
        setSavedAds((prev) => prev.filter((ad) => ad.id !== id));
    };

    if (savedAds.length === 0) {
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

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-primary">
                    Uložené inzeráty ({savedAds.length})
                </h3>
                <label className="flex items-center gap-2 text-sm text-secondary">
                    <input type="checkbox" className="rounded accent-accent" defaultChecked />
                    Notifikácie o znížení ceny
                </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {savedAds.map((ad) => (
                    <div
                        key={ad.id}
                        className="rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <div className="relative aspect-[16/10]">
                            <img
                                src={ad.photo}
                                alt={`${ad.brand} ${ad.model}`}
                                className="w-full h-full object-cover"
                            />
                            {ad.hasPriceDrop && (
                                <span className="absolute top-2 left-2 px-2 py-1 rounded bg-success text-white text-xs font-semibold">
                                    📉 Cena klesla!
                                </span>
                            )}
                            <button
                                onClick={() => handleUnsave(ad.id)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center text-error hover:bg-background"
                            >
                                ❤️
                            </button>
                        </div>
                        <div className="p-4">
                            <Link href={`/auto/${ad.id}`} className="font-semibold text-primary hover:text-accent">
                                {ad.brand} {ad.model}
                            </Link>
                            <p className="text-sm text-secondary mt-1">
                                {ad.year} • {ad.mileage.toLocaleString()} km • {ad.location}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xl font-bold text-accent">{ad.price.toLocaleString()} €</span>
                                {ad.originalPrice && (
                                    <span className="text-sm text-secondary line-through">
                                        {ad.originalPrice.toLocaleString()} €
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-tertiary mt-2">
                                Uložené {new Date(ad.savedAt).toLocaleDateString("sk-SK")}
                            </p>
                        </div>
                    </div>
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

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return date.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
        if (diffDays === 1) return "Včera";
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
                <h3 className="text-lg font-semibold text-primary mb-2">Žiadne správy</h3>
                <p className="text-secondary">
                    Tu sa zobrazia správy od záujemcov o vaše inzeráty
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Conversations List */}
            <div className="lg:col-span-1 space-y-2">
                <h3 className="text-lg font-semibold text-primary mb-4">Konverzácie</h3>
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
                            <img
                                src={conv.carPhoto}
                                alt={conv.carTitle}
                                className="w-12 h-12 rounded-lg object-cover shrink-0"
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
                                    <img src={conv.carPhoto} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                    <div>
                                        <p className="font-semibold text-primary">{conv.otherUser}</p>
                                        <p className="text-sm text-secondary">{conv.carTitle}</p>
                                    </div>
                                    {conv.isMyAd && (
                                        <span className="ml-auto px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                            Váš inzerát
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
                                placeholder="Napíšte správu..."
                                className="form-input flex-1"
                                onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                            />
                            <button
                                onClick={handleSendReply}
                                className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover"
                            >
                                Odoslať
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border h-full flex items-center justify-center p-12">
                        <div className="text-center">
                            <MessageIcon className="w-12 h-12 mx-auto text-tertiary mb-4" />
                            <p className="text-secondary">Vyberte konverzáciu pre zobrazenie správ</p>
                        </div>
                    </div>
                )}
            </div>
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
