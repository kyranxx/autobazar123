"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";



const TABS = [
    { id: "overview", label: "Prehľad", icon: "📊" },
    { id: "moderation", label: "Moderácia", icon: "🔍" },
    { id: "users", label: "Používatelia", icon: "👥" },
    { id: "revenue", label: "Príjmy", icon: "💰" },
    { id: "settings", label: "Nastavenia", icon: "⚙️" },
];

interface Stats {
    totalUsers: number;
    totalAds: number;
    activeAds: number;
    pendingModeration: number;
    dealerAccounts: number;
    todayRegistrations: number;
}

interface Revenue {
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalCredits: number;
    stripeRevenue: number;
}

interface PendingAd {
    id: string;
    brand: string;
    model: string;
    seller: string;
    photos: number;
    created_at: string;
    flags: string[];
}

interface SupabasePendingAd {
    id: string;
    photos_json?: string[];
    created_at: string;
    brands?: { name: string };
    models?: { name: string };
    profiles?: { email: string };
}

export default function AdminDashboardClient() {
    const { user, loading, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [isMfaVerified, setIsMfaVerified] = useState(false);
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalAds: 0,
        activeAds: 0,
        pendingModeration: 0,
        dealerAccounts: 0,
        todayRegistrations: 0,
    });
    const [revenue] = useState<Revenue>({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        totalCredits: 0,
        stripeRevenue: 0,
    });
    const [pendingAds, setPendingAds] = useState<PendingAd[]>([]);

    // Fetch admin data
    useEffect(() => {
        if (!user || !isAdmin || !isMfaVerified) return;

        const fetchData = async () => {
            const supabase = createClient();

            try {
                // Get stats
                const [
                    { count: totalUsers },
                    { count: totalAds },
                    { count: activeAds },
                    { count: pendingCount },
                ] = await Promise.all([
                    supabase.from("profiles").select("id", { count: "exact", head: true }),
                    supabase.from("ads").select("id", { count: "exact", head: true }),
                    supabase.from("ads").select("id", { count: "exact", head: true }).eq("status", "active"),
                    supabase.from("ads").select("id", { count: "exact", head: true }).eq("status", "pending"),
                ]);

                setStats({
                    totalUsers: totalUsers || 0,
                    totalAds: totalAds || 0,
                    activeAds: activeAds || 0,
                    pendingModeration: pendingCount || 0,
                    dealerAccounts: 0,
                    todayRegistrations: 0,
                });

                // Get pending ads for moderation
                const { data: pendingData } = await supabase
                    .from("ads")
                    .select(`
                        id,
                        photos_json,
                        created_at,
                        brands:brand_id (name),
                        models:model_id (name),
                        profiles:seller_id (email)
                    `)
                    .eq("status", "pending")
                    .order("created_at", { ascending: false })
                    .limit(20);

                if (pendingData) {
                    const formatted: PendingAd[] = (pendingData as unknown as SupabasePendingAd[]).map((ad) => ({
                        id: ad.id,
                        brand: ad.brands?.name || "Neznáma",
                        model: ad.models?.name || "Model",
                        seller: ad.profiles?.email || "N/A",
                        photos: ad.photos_json?.length || 0,
                        created_at: ad.created_at,
                        flags: [],
                    }));
                    setPendingAds(formatted);
                }
            } catch (err) {
                console.error("Error fetching admin data:", err);
            }
        };

        fetchData();
    }, [user, isAdmin]);

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

    if (!user || !isAdmin) {
        return (
            <main className="pt-24 pb-16 min-h-screen">
                <div className="mx-auto max-w-lg px-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
                        <span className="text-3xl">🔒</span>
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">
                        Prístup zamietnutý
                    </h1>
                    <p className="text-secondary mb-6">
                        Táto stránka je dostupná len pre administrátorov.
                    </p>
                    <Link href="/" className="text-accent hover:underline">
                        Späť na hlavnú stránku
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <MFAGuard onVerified={() => setIsMfaVerified(true)}>
            <main className="pt-20 pb-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="py-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">👑</span>
                            <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
                        </div>
                        <p className="text-secondary">Správa platformy Autobazar123</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-3 lg:grid-cols-6">
                        <QuickStat label="Používatelia" value={stats.totalUsers} />
                        <QuickStat label="Inzeráty" value={stats.totalAds} />
                        <QuickStat label="Aktívne" value={stats.activeAds} color="success" />
                        <QuickStat label="Čakajúce" value={stats.pendingModeration} color="warning" />
                        <QuickStat label="Dealeri" value={stats.dealerAccounts} />
                        <QuickStat label="Dnes registrovaní" value={stats.todayRegistrations} color="accent" />
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
                    {activeTab === "overview" && <OverviewTab stats={stats} revenue={revenue} />}
                    {activeTab === "moderation" && <ModerationTab pendingAds={pendingAds} />}
                    {activeTab === "users" && <UsersTab />}
                    {activeTab === "revenue" && <RevenueTab revenue={revenue} />}
                    {activeTab === "settings" && <SettingsTab />}
                </div>
            </main>
        </MFAGuard>
    );
}

function QuickStat({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color?: "success" | "warning" | "accent";
}) {
    const colorClasses = {
        success: "text-success",
        warning: "text-warning",
        accent: "text-accent",
    };

    const colorClass = color ? colorClasses[color] : "text-primary";

    return (
        <div className="p-4 rounded-xl border border-border">
            <p className={`text-2xl font-bold ${colorClass}`}>
                {value.toLocaleString()}
            </p>
            <p className="text-sm text-secondary">{label}</p>
        </div>
    );
}

// Overview Tab
function OverviewTab({
    stats,
    revenue,
}: {
    stats: Stats;
    revenue: Revenue;
}) {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Card */}
            <div className="p-6 rounded-2xl border border-border">
                <h3 className="font-semibold text-primary mb-4">Príjmy</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-secondary">Dnes</p>
                        <p className="text-xl font-bold text-primary">{revenue.today} €</p>
                    </div>
                    <div>
                        <p className="text-sm text-secondary">Tento týždeň</p>
                        <p className="text-xl font-bold text-primary">{revenue.thisWeek} €</p>
                    </div>
                    <div>
                        <p className="text-sm text-secondary">Tento mesiac</p>
                        <p className="text-xl font-bold text-accent">{revenue.thisMonth} €</p>
                    </div>
                </div>
            </div>

            {/* Activity Card */}
            <div className="p-6 rounded-2xl border border-border">
                <h3 className="font-semibold text-primary mb-4">Aktivita dnes</h3>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-secondary">Nové registrácie</span>
                        <span className="font-medium text-primary">{stats.todayRegistrations}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Nové inzeráty</span>
                        <span className="font-medium text-primary">12</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Predané vozidlá</span>
                        <span className="font-medium text-success">5</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Čakajúce na schválenie</span>
                        <span className="font-medium text-warning">{stats.pendingModeration}</span>
                    </div>
                </div>
            </div>

            {/* Recent Actions */}
            <div className="p-6 rounded-2xl border border-border lg:col-span-2">
                <h3 className="font-semibold text-primary mb-4">Posledné akcie</h3>
                <div className="space-y-3">
                    {[
                        { action: "Nový inzerát", user: "jan@example.com", time: "5 min", type: "add" },
                        { action: "Platba za kredity", user: "maria@gmail.com", time: "12 min", type: "payment" },
                        { action: "Registrácia dealera", user: "automax@sk.com", time: "25 min", type: "register" },
                        { action: "Inzerát označený ako predaný", user: "peter@email.sk", time: "1 hod", type: "sold" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                            <span className="text-lg">
                                {item.type === "add" && "📝"}
                                {item.type === "payment" && "💰"}
                                {item.type === "register" && "👤"}
                                {item.type === "sold" && "✅"}
                            </span>
                            <div className="flex-1">
                                <p className="font-medium text-primary">{item.action}</p>
                                <p className="text-sm text-secondary">{item.user}</p>
                            </div>
                            <span className="text-sm text-tertiary">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Moderation Tab
function ModerationTab({ pendingAds }: { pendingAds: PendingAd[] }) {
    const [selectedAds, setSelectedAds] = useState<string[]>([]);

    const toggleSelect = (id: string) => {
        setSelectedAds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const approveSelected = () => {
        alert(`Schválených ${selectedAds.length} inzerátov`);
        setSelectedAds([]);
    };

    const rejectSelected = () => {
        alert(`Zamietnutých ${selectedAds.length} inzerátov`);
        setSelectedAds([]);
    };

    return (
        <div>
            {/* Bulk Actions */}
            {selectedAds.length > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-surface flex items-center justify-between">
                    <span className="text-sm text-secondary">
                        Vybraných: <span className="font-semibold text-primary">{selectedAds.length}</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={rejectSelected}
                            className="px-4 py-2 rounded-lg border border-error text-error text-sm font-medium hover:bg-error/5"
                        >
                            Zamietnuť
                        </button>
                        <button
                            onClick={approveSelected}
                            className="px-4 py-2 rounded-lg bg-success text-white text-sm font-medium hover:bg-success/90"
                        >
                            Schváliť
                        </button>
                    </div>
                </div>
            )}

            {/* Pending Ads */}
            <div className="space-y-4">
                {pendingAds.map((ad) => (
                    <div
                        key={ad.id}
                        className={`p-4 rounded-xl border transition-all ${selectedAds.includes(ad.id)
                            ? "border-accent bg-accent/5"
                            : "border-border"
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <input
                                type="checkbox"
                                checked={selectedAds.includes(ad.id)}
                                onChange={() => toggleSelect(ad.id)}
                                className="mt-1 w-5 h-5 rounded accent-accent"
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-primary">
                                        {ad.brand} {ad.model}
                                    </h4>
                                    <div className="flex gap-2">
                                        {ad.flags.map((flag) => (
                                            <span
                                                key={flag}
                                                className={`px-2 py-0.5 rounded text-xs font-medium ${flag === "new_user"
                                                    ? "bg-warning/10 text-warning"
                                                    : flag === "high_value"
                                                        ? "bg-accent/10 text-accent"
                                                        : "bg-error/10 text-error"
                                                    }`}
                                            >
                                                {flag === "new_user" && "Nový používateľ"}
                                                {flag === "high_value" && "Vysoká hodnota"}
                                                {flag === "no_phone" && "Bez tel. čísla"}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-secondary mb-2">
                                    {ad.seller} • {ad.photos} fotiek • {new Date(ad.created_at).toLocaleString("sk-SK")}
                                </p>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 rounded-lg bg-surface text-sm text-primary hover:bg-surface-hover">
                                        Zobraziť
                                    </button>
                                    <button className="px-3 py-1.5 rounded-lg text-sm text-success hover:bg-success/5">
                                        Schváliť
                                    </button>
                                    <button className="px-3 py-1.5 rounded-lg text-sm text-error hover:bg-error/5">
                                        Zamietnuť
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Users Tab
function UsersTab() {
    const [search, setSearch] = useState("");

    return (
        <div>
            <div className="mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Hľadať používateľa (email, meno)..."
                    className="form-input max-w-md"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border text-left">
                            <th className="py-3 px-4 font-medium text-secondary">Email</th>
                            <th className="py-3 px-4 font-medium text-secondary">Meno</th>
                            <th className="py-3 px-4 font-medium text-secondary">Typ</th>
                            <th className="py-3 px-4 font-medium text-secondary">Kredity</th>
                            <th className="py-3 px-4 font-medium text-secondary">Inzeráty</th>
                            <th className="py-3 px-4 font-medium text-secondary">Registrácia</th>
                            <th className="py-3 px-4 font-medium text-secondary">Akcie</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { email: "jan@example.com", name: "Ján Novák", type: "user", credits: 5, ads: 2, date: "2025-12-15" },
                            { email: "maria@gmail.com", name: "Mária Kováčová", type: "user", credits: 12, ads: 1, date: "2025-11-20" },
                            { email: "automax@sk.com", name: "AutoMax s.r.o.", type: "dealer", credits: 85, ads: 23, date: "2025-10-01" },
                        ].map((user, i) => (
                            <tr key={i} className="border-b border-border hover:bg-surface">
                                <td className="py-3 px-4 text-primary">{user.email}</td>
                                <td className="py-3 px-4 text-primary">{user.name}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.type === "dealer" ? "bg-accent/10 text-accent" : "bg-surface text-secondary"
                                        }`}>
                                        {user.type === "dealer" ? "Dealer" : "Súkromný"}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-primary">{user.credits}</td>
                                <td className="py-3 px-4 text-primary">{user.ads}</td>
                                <td className="py-3 px-4 text-secondary">{user.date}</td>
                                <td className="py-3 px-4">
                                    <button className="text-accent hover:underline text-sm">Detail</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Revenue Tab
function RevenueTab({ revenue }: { revenue: Revenue }) {
    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 rounded-2xl border border-border">
                    <p className="text-sm text-secondary mb-2">Dnes</p>
                    <p className="text-3xl font-bold text-primary">{revenue.today} €</p>
                </div>
                <div className="p-6 rounded-2xl border border-border">
                    <p className="text-sm text-secondary mb-2">Tento týždeň</p>
                    <p className="text-3xl font-bold text-primary">{revenue.thisWeek} €</p>
                </div>
                <div className="p-6 rounded-2xl border border-border">
                    <p className="text-sm text-secondary mb-2">Tento mesiac</p>
                    <p className="text-3xl font-bold text-accent">{revenue.thisMonth} €</p>
                </div>
                <div className="p-6 rounded-2xl border border-border">
                    <p className="text-sm text-secondary mb-2">Celkom (Stripe)</p>
                    <p className="text-3xl font-bold text-success">{revenue.stripeRevenue} €</p>
                </div>
            </div>

            {/* Credit Consumption */}
            <div className="p-6 rounded-2xl border border-border">
                <h3 className="font-semibold text-primary mb-4">Spotreba kreditov (tento mesiac)</h3>
                <div className="space-y-4">
                    {[
                        { action: "Zverejnenie inzerátu", count: 234, credits: 234 },
                        { action: "Topovanie", count: 45, credits: 135 },
                        { action: "Zvýraznenie", count: 67, credits: 134 },
                        { action: "Predĺženie", count: 89, credits: 89 },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <div>
                                <p className="font-medium text-primary">{item.action}</p>
                                <p className="text-sm text-secondary">{item.count}x použité</p>
                            </div>
                            <span className="font-bold text-accent">{item.credits} kr</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Settings Tab
function SettingsTab() {
    const [maintenance, setMaintenance] = useState(false);
    const [mPassword, setMPassword] = useState("autobazar2026");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase
                    .from("site_settings")
                    .select("key, value");

                if (data) {
                    const mMode = data.find(s => s.key === "maintenance_mode");
                    const mPass = data.find(s => s.key === "maintenance_password");

                    if (mMode) setMaintenance(mMode.value === "true" || mMode.value === true);
                    if (mPass) setMPassword(mPass.value);
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [supabase]);

    const handleToggleMaintenance = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked;
        setSaving(true);
        try {
            const { error } = await supabase
                .from("site_settings")
                .upsert({ key: "maintenance_mode", value: String(newValue), updated_at: new Date().toISOString() });

            if (!error) {
                setMaintenance(newValue);
            } else {
                console.error("Maintenance toggle error:", error);
                alert("Nepodarilo sa uložiť nastavenie. Skontrolujte či ste v Supabase spustili priložený SQL kód pre tabuľku 'site_settings'.");
            }
        } catch (err) {
            console.error("Error updating settings:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleSavePassword = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("site_settings")
                .upsert({ key: "maintenance_password", value: mPassword, updated_at: new Date().toISOString() });

            if (!error) {
                alert("Heslo úspešne uložené.");
            } else {
                console.error("Password save error:", error);
                alert("Nepodarilo sa uložiť heslo.");
            }
        } catch (err) {
            console.error("Error updating password:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-lg space-y-6">
            <div className={`p-6 rounded-2xl border border-border transition-opacity ${loading ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-primary">Údržbový režim</h3>
                    {saving && <span className="text-xs text-accent animate-pulse">Ukladám...</span>}
                </div>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={maintenance}
                            onChange={handleToggleMaintenance}
                            disabled={loading || saving}
                            className="w-5 h-5 rounded accent-accent disabled:opacity-50"
                        />
                        <span className="text-secondary">Zapnúť údržbový režim (stránka nedostupná pre verejnosť)</span>
                    </label>

                    {maintenance && (
                        <div className="pt-4 border-t border-border space-y-3">
                            <p className="text-xs text-secondary font-medium">Bypass heslo (pre prístup počas údržby):</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={mPassword}
                                    onChange={(e) => setMPassword(e.target.value)}
                                    placeholder="Zadajte heslo..."
                                    className="flex-1 px-4 py-2 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                                <button
                                    onClick={handleSavePassword}
                                    disabled={saving}
                                    className="px-4 py-2 bg-primary text-background rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    Uložiť heslo
                                </button>
                            </div>
                            <p className="text-[10px] text-tertiary">Toto heslo môžete použiť na stránke /maintenance pre prístup k webu.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 rounded-2xl border border-border">
                <h3 className="font-semibold text-primary mb-4">Iné nastavenia</h3>
                <p className="text-sm text-tertiary">Tu môžete pridať ďalšie globálne nastavenia systému.</p>
            </div>

            <div className="p-6 rounded-2xl border border-border">
                <h3 className="font-semibold text-primary mb-4">Systémové akcie</h3>
                <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 rounded-lg bg-surface text-sm text-primary hover:bg-surface-hover">
                        Vymazať cache
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-surface text-sm text-primary hover:bg-surface-hover">
                        Reindex vyhľadávanie
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-accent text-sm text-white hover:bg-accent-hover">
                        Spustiť cron joby
                    </button>
                </div>
            </div>

            <MFASetup />
        </div>
    );
}

function MFASetup() {
    const [factorId, setFactorId] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "enrolling" | "verifying" | "done">("idle");
    const [isMfaEnabled, setIsMfaEnabled] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        // Check if MFA is already active
        const checkMFA = async () => {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) {
                console.error("MFA list error:", error);
                // If it's a 422, it might mean MFA is not enabled in dashboard
                if (error.status === 422) {
                    setError("MFA nie je v Supabase nastaveniach povolené.");
                } else {
                    setError(error.message);
                }
                return;
            }

            if (data.all.some(f => f.status === 'verified')) {
                setIsMfaEnabled(true);
                setStatus("done");
            } else if (data.all.length > 0) {
                // If there's an unverified factor, let's offer to clear it or continue
                const factor = data.all[0];
                setFactorId(factor.id);
                // We don't have the QR code anymore if it's an existing unverified factor
                // but we can try to re-enroll or let user know
                setError("Máte nedokončenú registráciu MFA. Skúste tlačidlo nižšie pre reset.");
            }
        };
        checkMFA();
    }, [supabase]);

    const handleStartEnroll = async () => {
        setStatus("enrolling");
        setError(null);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                issuer: 'Autobazar123.sk'
            });
            if (error) throw error;

            setFactorId(data.id);
            setQrCode(data.totp.qr_code);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
            setStatus("idle");
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId) return;

        setStatus("verifying");
        setError(null);
        try {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code
            });

            if (verifyError) throw verifyError;

            setIsMfaEnabled(true);
            setStatus("done");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
            setStatus("enrolling");
        }
    };

    const handleUnenroll = async () => {
        if (!confirm("Naozaj chcete vypnúť dvojstupňové overenie?")) return;

        try {
            const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
            if (listError) throw listError;

            if (factors?.all) {
                for (const factor of factors.all) {
                    await supabase.auth.mfa.unenroll({ factorId: factor.id });
                }
            }
            setIsMfaEnabled(false);
            setStatus("idle");
            setFactorId(null);
            setQrCode(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    if (isMfaEnabled) {
        return (
            <div className="p-6 rounded-2xl border border-success/20 bg-success/5">
                <div className="flex items-center gap-3 mb-4 text-success">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className="font-semibold">Dvojstupňové overenie zapnuté</h3>
                </div>
                <p className="text-sm text-secondary mb-4">
                    Váš účet je chránený pomocou Google Authenticator. Pri každom prihlásení do admin panelu bude vyžadovaný kód.
                </p>
                <button
                    onClick={handleUnenroll}
                    className="text-xs text-red-500 hover:underline"
                >
                    Vypnúť dvojstupňové overenie
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl border border-border">
            <h3 className="font-semibold text-primary mb-4">Dvojstupňové overenie (MFA)</h3>

            {(status === "idle" || status === "enrolling") && !qrCode && (
                <div className="space-y-4">
                    <p className="text-sm text-secondary">
                        Zabezpečte svoj administrátorský prístup pomocou Google Authenticator alebo podobnej aplikácie.
                    </p>
                    <button
                        onClick={handleStartEnroll}
                        disabled={status === "enrolling"}
                        className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {status === "enrolling" ? "Pripravujem..." : "Nastaviť overenie"}
                    </button>
                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                            {error}
                            <button
                                onClick={handleUnenroll}
                                className="ml-2 underline font-bold"
                            >
                                Resetovať stav
                            </button>
                        </div>
                    )}
                </div>
            )}

            {(status === "enrolling" || status === "verifying") && qrCode && (
                <div className="space-y-6 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-xl shadow-inner border border-border">
                        <Image src={qrCode} alt="Security Check" className="w-48 h-48" width={192} height={192} unoptimized />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="font-medium text-primary">Naskenujte QR kód</p>
                        <p className="text-xs text-secondary max-w-xs">
                            Otvorte Google Authenticator a pridajte nový účet naskenovaním tohto kódu.
                        </p>
                    </div>
                    <form onSubmit={handleVerify} className="w-full space-y-3">
                        <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            className="w-full text-center tracking-[0.5em] text-xl font-mono px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <button
                            type="submit"
                            disabled={code.length !== 6 || status === "verifying"}
                            className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
                        >
                            {status === "verifying" ? "Overujem..." : "Potvrdiť kód"}
                        </button>
                        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                        <button
                            type="button"
                            onClick={() => {
                                setStatus("idle");
                                setQrCode(null);
                                setError(null);
                            }}
                            className="w-full text-xs text-secondary hover:underline"
                        >
                            Zrušiť
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

function MFAGuard({ children, onVerified }: { children: React.ReactNode, onVerified?: () => void }) {
    const [isMfaVerifiedLocal, setIsMfaVerifiedLocal] = useState<boolean | null>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkMFA = async () => {
            const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (error) {
                console.error("MFA check error:", error);
                setIsMfaVerifiedLocal(true); // Fallback if error
                onVerified?.();
                return;
            }

            // If current level is lower than what's possible, we need challenge
            if (data.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
                setIsMfaVerifiedLocal(false);
            } else {
                setIsMfaVerifiedLocal(true);
                onVerified?.();
            }
        };
        checkMFA();
    }, [supabase, onVerified]);

    const handleChallenge = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsChecking(true);
        setError(null);

        try {
            const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
            if (listError) throw listError;

            const verifiedFactor = factors?.all?.find(f => f.status === 'verified');

            if (!verifiedFactor) {
                setIsMfaVerifiedLocal(true);
                onVerified?.();
                return;
            }

            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: verifiedFactor.id
            });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: verifiedFactor.id,
                challengeId: challengeData.id,
                code
            });

            if (verifyError) throw verifyError;

            setIsMfaVerifiedLocal(true);
            onVerified?.();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Nesprávny kód";
            setError(message);
        } finally {
            setIsChecking(false);
        }
    };

    // ⌨️ Keyboard support (Escape to exit)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMfaVerifiedLocal === false) {
                window.location.href = '/';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMfaVerifiedLocal]);

    // Ref to handle challenge to avoid closing over stale state
    const challengeRef = useRef(handleChallenge);
    challengeRef.current = handleChallenge;

    // 🚀 Auto-submit when 6 digits are entered
    const lastAttemptedCode = useRef("");
    useEffect(() => {
        if (code.length === 6 && !isChecking && code !== lastAttemptedCode.current) {
            lastAttemptedCode.current = code;
            const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
            challengeRef.current(fakeEvent);
        } else if (code.length !== 6) {
            lastAttemptedCode.current = "";
        }
    }, [code, isChecking]);

    if (isMfaVerifiedLocal === null) return null; // Loading

    if (isMfaVerifiedLocal === false) {
        return (
            <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4">
                <div className="bg-background border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 text-center relative border-t-4 border-t-accent">
                    {/* Close Button */}
                    <button
                        onClick={() => window.location.href = '/'}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface transition-colors group"
                        title="Zrušiť a späť na domov"
                    >
                        <svg className="w-5 h-5 text-secondary group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto text-accent">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-primary">Dvojstupňové overenie</h2>
                        <p className="text-sm text-secondary">Zadajte kód z vašej aplikácie Google Authenticator.</p>
                    </div>
                    <form onSubmit={handleChallenge} className="space-y-4">
                        <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-4 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                            autoFocus
                        />
                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                        <button
                            type="submit"
                            disabled={code.length !== 6 || isChecking}
                            className="w-full py-4 bg-accent text-white rounded-2xl font-bold hover:bg-accent-hover transition-colors shadow-lg disabled:opacity-50 relative overflow-hidden"
                        >
                            {isChecking ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Overujem...
                                </span>
                            ) : "Odomknúť"}
                        </button>
                    </form>
                    <p className="text-[10px] text-tertiary">Stlačte ESC pre zrušenie</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
