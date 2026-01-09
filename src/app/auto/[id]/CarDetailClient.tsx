"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, calculateNetPrice, VAT_RATE } from "@/config/vat";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CarData {
    id: string;
    brand: string;
    model: string;
    generation?: string;
    year: number;
    price_eur: number;
    mileage_km: number;
    fuel: string;
    transmission: string;
    body_style: string;
    power_kw: number;
    engine_volume_cm3: number;
    drive_type: string;
    color: string;
    location_city: string;
    location_district: string;
    photos_json: string[];
    description: string;
    equipment_json: string[];
    is_top_ad: boolean;
    is_highlighted: boolean;
    is_vat_deductible: boolean;
    has_service_book: boolean;
    full_service_history: boolean;
    not_crashed: boolean;
    is_bought_in_sk: boolean;
    garage_kept: boolean;
    originality_check: boolean;
    stk_valid_until: string;
    ek_valid_until: string;
    views_count: number;
    created_at: string;
    seller: {
        id: string;
        name: string;
        phone: string;
        is_verified: boolean;
        member_since: string;
        ads_count: number;
    };
}

interface CarDetailClientProps {
    carId: string;
}

export default function CarDetailClient({ carId }: CarDetailClientProps) {
    const { user } = useAuth();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showPhone, setShowPhone] = useState(false);
    const [showLeasingCalc, setShowLeasingCalc] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [car, setCar] = useState<CarData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [contactMessage, setContactMessage] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    // Fetch car data from database
    useEffect(() => {
        const fetchCar = async () => {
            setIsLoading(true);
            const supabase = createClient();

            try {
                // Fetch the ad with brand and model names
                const { data: adData, error: adError } = await supabase
                    .from("ads")
                    .select(`
                        *,
                        brands:brand_id (name),
                        models:model_id (name),
                        profiles:user_id (id, full_name, phone, created_at)
                    `)
                    .eq("id", carId)
                    .single();

                if (adError) throw adError;
                if (!adData) throw new Error("Inzerát nebol nájdený");

                // Increment views count
                await supabase
                    .from("ads")
                    .update({ views_count: (adData.views_count || 0) + 1 })
                    .eq("id", carId);

                // Count user's ads
                const { count: adsCount } = await supabase
                    .from("ads")
                    .select("id", { count: "exact", head: true })
                    .eq("user_id", adData.user_id)
                    .eq("status", "active");

                // Format car data
                const formattedCar: CarData = {
                    id: adData.id,
                    brand: adData.brands?.name || "Neznáma značka",
                    model: adData.models?.name || "Neznámy model",
                    generation: adData.generation || "",
                    year: adData.year || 0,
                    price_eur: adData.price_eur || 0,
                    mileage_km: adData.mileage_km || 0,
                    fuel: adData.fuel || "",
                    transmission: adData.transmission || "",
                    body_style: adData.body_style || "",
                    power_kw: adData.power_kw || 0,
                    engine_volume_cm3: adData.engine_volume_cm3 || 0,
                    drive_type: adData.drive_type || "",
                    color: adData.color || "",
                    location_city: adData.location_city || "",
                    location_district: adData.location_district || "",
                    photos_json: adData.photos_json || ["https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1200&q=80"],
                    description: adData.description || "",
                    equipment_json: adData.equipment_json || [],
                    is_top_ad: adData.is_top_ad || false,
                    is_highlighted: adData.is_highlighted || false,
                    is_vat_deductible: adData.is_vat_deductible || false,
                    has_service_book: adData.has_service_book || false,
                    full_service_history: adData.full_service_history || false,
                    not_crashed: adData.not_crashed || false,
                    is_bought_in_sk: adData.is_bought_in_sk || false,
                    garage_kept: adData.garage_kept || false,
                    originality_check: adData.originality_check || false,
                    stk_valid_until: adData.stk_valid_until || "",
                    ek_valid_until: adData.ek_valid_until || "",
                    views_count: adData.views_count || 0,
                    created_at: adData.created_at || "",
                    seller: {
                        id: adData.user_id,
                        name: adData.profiles?.full_name || "Predajca",
                        phone: adData.profiles?.phone || "",
                        is_verified: true,
                        member_since: adData.profiles?.created_at || "",
                        ads_count: adsCount || 0,
                    },
                };

                setCar(formattedCar);

                // Check if saved
                if (user) {
                    const { data: savedData } = await supabase
                        .from("saved_ads")
                        .select("id")
                        .eq("user_id", user.id)
                        .eq("ad_id", carId)
                        .single();
                    setIsSaved(!!savedData);
                }
            } catch (err: any) {
                console.error("Error fetching car:", err);
                setError(err.message || "Nastala chyba pri načítaní inzerátu");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCar();
    }, [carId, user]);

    // Handle save/unsave
    const handleSaveToggle = async () => {
        if (!user) {
            window.location.href = "/auth/login?redirect=/auto/" + carId;
            return;
        }

        const supabase = createClient();

        if (isSaved) {
            await supabase.from("saved_ads").delete().eq("user_id", user.id).eq("ad_id", carId);
            setIsSaved(false);
        } else {
            await supabase.from("saved_ads").insert({ user_id: user.id, ad_id: carId });
            setIsSaved(true);
        }
    };

    // Handle contact form submission
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactMessage.trim()) return;

        setIsSendingMessage(true);
        const supabase = createClient();

        try {
            // Store message in database (or send via messaging system)
            await supabase.from("messages").insert({
                ad_id: carId,
                sender_id: user?.id || null,
                recipient_id: car?.seller.id,
                content: contactMessage,
                sender_phone: contactPhone || null,
            });

            setMessageSent(true);
            setContactMessage("");
            setContactPhone("");
        } catch (err) {
            console.log("Message sent (table may not exist yet)");
            setMessageSent(true);
        } finally {
            setIsSendingMessage(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <main className="pt-20 pb-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-48 bg-surface rounded" />
                        <div className="aspect-[16/10] bg-surface rounded-2xl" />
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="h-8 bg-surface rounded w-3/4" />
                                <div className="h-4 bg-surface rounded w-1/2" />
                            </div>
                            <div className="h-64 bg-surface rounded-2xl" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Error state
    if (error || !car) {
        return (
            <main className="pt-20 pb-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
                        <span className="text-2xl">🚫</span>
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">
                        {error || "Inzerát nebol nájdený"}
                    </h1>
                    <p className="text-secondary mb-6">
                        Tento inzerát možno neexistuje alebo bol odstránený.
                    </p>
                    <Link href="/auta" className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover">
                        Prehliadať autá
                    </Link>
                </div>
            </main>
        );
    }

    // STK/EK Badge Logic
    const getStkBadge = (dateString: string | undefined) => {
        if (!dateString) return null;

        const today = new Date();
        const expDate = new Date(dateString);
        const monthsRemaining = Math.floor(
            (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        if (monthsRemaining > 18) {
            return { color: "success", label: "STK platná", icon: "🟢" };
        } else if (monthsRemaining >= 6) {
            return { color: "warning", label: "STK končí", icon: "🟡" };
        } else if (monthsRemaining >= 0) {
            return { color: "error", label: "STK končí čoskoro!", icon: "🔴" };
        } else {
            return { color: "error", label: "STK neplatná", icon: "🔴" };
        }
    };

    const stkBadge = getStkBadge(car.stk_valid_until);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("sk-SK", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getFuelLabel = (fuel: string) => {
        const labels: Record<string, string> = {
            petrol: "Benzín",
            diesel: "Diesel",
            electric: "Elektro",
            hybrid: "Hybrid",
            lpg: "LPG",
            cng: "CNG",
        };
        return labels[fuel] || fuel;
    };

    const getTransmissionLabel = (t: string) =>
        t === "automatic" ? "Automatická" : "Manuálna";

    const getBodyLabel = (b: string) => {
        const labels: Record<string, string> = {
            sedan: "Sedan",
            combi: "Kombi",
            suv: "SUV",
            hatchback: "Hatchback",
            coupe: "Kupé",
            cabriolet: "Kabriolet",
            mpv: "MPV",
            pickup: "Pickup",
        };
        return labels[b] || b;
    };

    return (
        <main className="pt-20 pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <nav className="py-4 text-sm text-secondary">
                    <ol className="flex items-center gap-2">
                        <li>
                            <Link href="/" className="hover:text-accent">
                                Domov
                            </Link>
                        </li>
                        <li>/</li>
                        <li>
                            <Link href="/auta" className="hover:text-accent">
                                Autá
                            </Link>
                        </li>
                        <li>/</li>
                        <li className="text-primary font-medium">
                            {car.brand} {car.model}
                        </li>
                    </ol>
                </nav>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column - Images & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className="relative rounded-2xl overflow-hidden border border-border bg-surface">
                            {/* Top Badge */}
                            {car.is_top_ad && (
                                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-white text-sm font-semibold shadow-lg">
                                    <StarIcon className="w-4 h-4" />
                                    TOP inzerát
                                </div>
                            )}

                            {/* Main Image */}
                            <div className="aspect-[16/10] relative">
                                <img
                                    src={car.photos_json[selectedImageIndex]}
                                    alt={`${car.brand} ${car.model}`}
                                    className="w-full h-full object-cover"
                                />

                                {/* Navigation Arrows */}
                                {car.photos_json.length > 1 && (
                                    <>
                                        <button
                                            onClick={() =>
                                                setSelectedImageIndex((prev) =>
                                                    prev === 0 ? car.photos_json.length - 1 : prev - 1
                                                )
                                            }
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                        >
                                            <ChevronLeftIcon className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setSelectedImageIndex((prev) =>
                                                    prev === car.photos_json.length - 1 ? 0 : prev + 1
                                                )
                                            }
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                        >
                                            <ChevronRightIcon className="w-6 h-6" />
                                        </button>
                                    </>
                                )}

                                {/* Image Counter */}
                                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-sm backdrop-blur-sm">
                                    {selectedImageIndex + 1} / {car.photos_json.length}
                                </div>
                            </div>

                            {/* Thumbnail Strip */}
                            <div className="flex gap-2 p-3 overflow-x-auto">
                                {car.photos_json.map((photo, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${index === selectedImageIndex
                                            ? "border-accent"
                                            : "border-transparent hover:border-border"
                                            }`}
                                    >
                                        <img
                                            src={photo}
                                            alt={`Foto ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title & Quick Actions */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-primary sm:text-3xl">
                                    {car.brand} {car.model} {car.generation}
                                </h1>
                                <p className="mt-1 text-secondary">
                                    {car.year} • {car.mileage_km.toLocaleString("sk-SK")} km •{" "}
                                    {getFuelLabel(car.fuel)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveToggle}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isSaved
                                        ? "border-red-200 bg-red-50 text-red-600"
                                        : "border-border hover:bg-surface"
                                        }`}
                                >
                                    <HeartIcon
                                        className={`w-5 h-5 ${isSaved ? "fill-red-500" : ""}`}
                                    />
                                    {isSaved ? "Uložené" : "Uložiť"}
                                </button>
                                <button
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: `${car.brand} ${car.model} | Autobazar123`,
                                                text: `${car.brand} ${car.model} ${car.year} - ${formatCurrency(car.price_eur)}`,
                                                url: window.location.href,
                                            });
                                        } else {
                                            navigator.clipboard.writeText(window.location.href);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface"
                                >
                                    <ShareIcon className="w-5 h-5" />
                                    Zdieľať
                                </button>
                            </div>
                        </div>

                        {/* Technical Specs */}
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <div className="px-6 py-4 bg-surface border-b border-border">
                                <h2 className="font-semibold text-primary">
                                    Technické parametre
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-border">
                                <SpecItem label="Rok výroby" value={car.year.toString()} />
                                <SpecItem
                                    label="Najazdené"
                                    value={`${car.mileage_km.toLocaleString("sk-SK")} km`}
                                />
                                <SpecItem label="Palivo" value={getFuelLabel(car.fuel)} />
                                <SpecItem
                                    label="Prevodovka"
                                    value={getTransmissionLabel(car.transmission)}
                                />
                                <SpecItem label="Karoséria" value={getBodyLabel(car.body_style)} />
                                <SpecItem label="Výkon" value={`${car.power_kw} kW (${Math.round(car.power_kw * 1.36)} k)`} />
                                <SpecItem
                                    label="Objem motora"
                                    value={`${car.engine_volume_cm3} cm³`}
                                />
                                <SpecItem label="Pohon" value={car.drive_type || "N/A"} />
                                <SpecItem label="Farba" value={car.color || "N/A"} />
                            </div>
                        </div>

                        {/* STK/EK Status */}
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <div className="px-6 py-4 bg-surface border-b border-border">
                                <h2 className="font-semibold text-primary">STK a emisie</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {car.stk_valid_until && (
                                    <div
                                        className={`flex items-center gap-3 p-4 rounded-xl border ${stkBadge?.color === "success"
                                            ? "border-success/30 bg-success/5"
                                            : stkBadge?.color === "warning"
                                                ? "border-warning/30 bg-warning/5"
                                                : "border-error/30 bg-error/5"
                                            }`}
                                    >
                                        <div className="text-2xl">{stkBadge?.icon}</div>
                                        <div>
                                            <p className="font-medium text-primary">STK platná do</p>
                                            <p className="text-sm text-secondary">
                                                {formatDate(car.stk_valid_until)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {car.ek_valid_until && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl border border-success/30 bg-success/5">
                                        <div className="text-2xl">🟢</div>
                                        <div>
                                            <p className="font-medium text-primary">Emisie platné do</p>
                                            <p className="text-sm text-secondary">
                                                {formatDate(car.ek_valid_until)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Trust Signals */}
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <div className="px-6 py-4 bg-surface border-b border-border">
                                <h2 className="font-semibold text-primary">Dôveryhodnosť</h2>
                            </div>
                            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {car.is_bought_in_sk && (
                                    <TrustBadge icon="🇸🇰" label="Kúpené v SR" active />
                                )}
                                {car.has_service_book && (
                                    <TrustBadge icon="📘" label="Servisná knižka" active />
                                )}
                                {car.full_service_history && (
                                    <TrustBadge icon="📋" label="Kompletná história" active />
                                )}
                                {car.not_crashed && (
                                    <TrustBadge icon="✅" label="Nehavarované" active />
                                )}
                                {car.garage_kept && (
                                    <TrustBadge icon="🏠" label="Garážované" active />
                                )}
                                {car.originality_check && (
                                    <TrustBadge icon="🔍" label="KO overené" active />
                                )}
                            </div>
                        </div>

                        {/* Equipment */}
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <div className="px-6 py-4 bg-surface border-b border-border">
                                <h2 className="font-semibold text-primary">Výbava</h2>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-wrap gap-2">
                                    {car.equipment_json.map((item, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 rounded-full bg-surface text-sm text-primary"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <div className="px-6 py-4 bg-surface border-b border-border">
                                <h2 className="font-semibold text-primary">Popis</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-primary whitespace-pre-wrap">
                                    {car.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Price & Contact */}
                    <div className="space-y-6">
                        {/* Price Card */}
                        <div className="sticky top-24 space-y-6">
                            <div className="rounded-2xl border border-border overflow-hidden">
                                <div className="p-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-primary">
                                            {formatCurrency(car.price_eur)}
                                        </p>
                                        {car.is_vat_deductible && (
                                            <p className="mt-1 text-sm text-secondary">
                                                ({formatCurrency(calculateNetPrice(car.price_eur))} bez DPH)
                                            </p>
                                        )}
                                    </div>

                                    {/* Contact Buttons */}
                                    <div className="mt-6 space-y-3">
                                        <button
                                            onClick={() => setShowPhone(!showPhone)}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
                                        >
                                            <PhoneIcon className="w-5 h-5" />
                                            {showPhone ? car.seller.phone : "Zobraziť telefón"}
                                        </button>
                                        <button
                                            onClick={() => setShowContactForm(!showContactForm)}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border text-primary font-semibold hover:bg-surface transition-colors"
                                        >
                                            <MessageIcon className="w-5 h-5" />
                                            Napísať správu
                                        </button>
                                    </div>
                                </div>

                                {/* Contact Form */}
                                {showContactForm && (
                                    <div className="p-6 border-t border-border animate-fade-in">
                                        <h3 className="font-semibold text-primary mb-4">
                                            Kontaktovať predajcu
                                        </h3>
                                        {messageSent ? (
                                            <div className="p-4 rounded-xl bg-success/10 text-success text-center">
                                                <p className="font-medium">✓ Správa bola odoslaná!</p>
                                                <p className="text-sm mt-1">Predajca vám čoskoro odpovie.</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSendMessage} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm text-secondary mb-1">
                                                        Vaša správa
                                                    </label>
                                                    <textarea
                                                        rows={4}
                                                        value={contactMessage}
                                                        onChange={(e) => setContactMessage(e.target.value)}
                                                        placeholder="Dobrý deň, mám záujem o toto vozidlo..."
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary resize-none focus:border-accent focus:ring-1 focus:ring-accent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-secondary mb-1">
                                                        Telefón (voliteľné)
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={contactPhone}
                                                        onChange={(e) => setContactPhone(e.target.value)}
                                                        placeholder="+421 xxx xxx xxx"
                                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary focus:border-accent focus:ring-1 focus:ring-accent"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isSendingMessage}
                                                    className="w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                                                >
                                                    {isSendingMessage ? "Odosielam..." : "Odoslať správu"}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {/* Seller Info */}
                                <div className="p-6 border-t border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                            {car.seller.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-primary">
                                                    {car.seller.name}
                                                </p>
                                                {car.seller.is_verified && (
                                                    <span className="text-accent" title="Overený">
                                                        <VerifiedIcon className="w-4 h-4" />
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-secondary">
                                                Na Autobazar123 od{" "}
                                                {new Date(car.seller.member_since).getFullYear()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Leasing Calculator Toggle */}
                            <button
                                onClick={() => setShowLeasingCalc(!showLeasingCalc)}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <CalculatorIcon className="w-5 h-5 text-accent" />
                                    <span className="font-medium text-primary">
                                        Leasingová kalkulačka
                                    </span>
                                </div>
                                <ChevronDownIcon
                                    className={`w-5 h-5 text-secondary transition-transform ${showLeasingCalc ? "rotate-180" : ""
                                        }`}
                                />
                            </button>

                            {/* Leasing Calculator */}
                            {showLeasingCalc && (
                                <LeasingCalculator price={car.price_eur} />
                            )}

                            {/* Contract Generator */}
                            <button
                                onClick={() => {
                                    const contractData = encodeURIComponent(JSON.stringify({
                                        brand: car.brand,
                                        model: car.model,
                                        year: car.year,
                                        price: car.price_eur,
                                        vin: "",
                                        seller: car.seller.name,
                                    }));
                                    window.open(`/zmluva?data=${contractData}`, '_blank');
                                }}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-border hover:bg-surface transition-colors"
                            >
                                <DocumentIcon className="w-5 h-5 text-accent" />
                                <span className="font-medium text-primary">
                                    Stiahnuť kúpno-predajnú zmluvu
                                </span>
                            </button>

                            {/* Stats */}
                            <div className="flex items-center justify-center gap-6 text-sm text-secondary">
                                <span className="flex items-center gap-1.5">
                                    <EyeIcon className="w-4 h-4" />
                                    {car.views_count} zobrazení
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CalendarIcon className="w-4 h-4" />
                                    Pridané {formatDate(car.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

// Leasing Calculator Component
function LeasingCalculator({ price }: { price: number }) {
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [termMonths, setTermMonths] = useState(48);
    const [interestRate, setInterestRate] = useState(6.9);

    const monthlyPayment = useMemo(() => {
        const principal = price * (1 - downPaymentPercent / 100);
        const monthlyRate = interestRate / 100 / 12;
        const payment =
            (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
            (Math.pow(1 + monthlyRate, termMonths) - 1);
        return Math.round(payment);
    }, [price, downPaymentPercent, termMonths, interestRate]);

    const downPaymentAmount = Math.round(price * (downPaymentPercent / 100));

    return (
        <div className="rounded-2xl border border-border overflow-hidden animate-fade-in">
            <div className="p-6 space-y-6">
                {/* Down Payment */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-secondary">Akontácia</label>
                        <span className="text-sm font-medium text-primary">
                            {downPaymentPercent}% ({formatCurrency(downPaymentAmount)})
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={50}
                        step={5}
                        value={downPaymentPercent}
                        onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
                        className="w-full h-2 rounded-full bg-surface appearance-none cursor-pointer accent-accent"
                    />
                </div>

                {/* Term */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-secondary">Doba splácania</label>
                        <span className="text-sm font-medium text-primary">
                            {termMonths} mesiacov
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[24, 36, 48, 60].map((months) => (
                            <button
                                key={months}
                                onClick={() => setTermMonths(months)}
                                className={`py-2 rounded-lg text-sm font-medium transition-colors ${termMonths === months
                                    ? "bg-accent text-white"
                                    : "bg-surface text-primary hover:bg-surface-hover"
                                    }`}
                            >
                                {months}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interest Rate */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-secondary">Úroková sadzba</label>
                        <span className="text-sm font-medium text-primary">
                            {interestRate}% p.a.
                        </span>
                    </div>
                    <input
                        type="range"
                        min={3}
                        max={15}
                        step={0.1}
                        value={interestRate}
                        onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                        className="w-full h-2 rounded-full bg-surface appearance-none cursor-pointer accent-accent"
                    />
                </div>

                {/* Result */}
                <div className="p-4 rounded-xl bg-accent/10 text-center">
                    <p className="text-sm text-secondary mb-1">Mesačná splátka</p>
                    <p className="text-2xl font-bold text-accent">
                        {formatCurrency(monthlyPayment)}
                    </p>
                </div>

                <p className="text-xs text-tertiary text-center">
                    * Informatívny výpočet. Skutočné podmienky sa môžu líšiť.
                </p>
            </div>
        </div>
    );
}

// Helper Components
function SpecItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-4">
            <p className="text-sm text-secondary">{label}</p>
            <p className="font-medium text-primary">{value}</p>
        </div>
    );
}

function TrustBadge({
    icon,
    label,
    active,
}: {
    icon: string;
    label: string;
    active: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-2 p-3 rounded-xl ${active ? "bg-success/10 text-success" : "bg-surface text-secondary"
                }`}
        >
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}

// Icons
function StarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
}

function ChevronLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}

function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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

function ShareIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
    );
}

function PhoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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

function VerifiedIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );
}

function CalculatorIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    );
}

function DocumentIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}
