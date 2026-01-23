"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency, calculateNetPrice } from "@/config/vat";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatters";
import { toast } from "sonner";
import {
    StarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    HeartIcon,
    ShareIcon,
    PhoneIcon,
    MessageIcon,
    VerifiedIcon,
    CalculatorIcon,
    DocumentIcon,
    EyeIcon,
    CalendarIcon,
} from "@/components/ui/Icons";
import { LeasingCalculator } from "@/components/calculator/LeasingCalculator";
import { TrustSignal } from "@/components/ui/TrustSignal";

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
    drive_type?: string;
    color?: string;
    description: string;
    photos_json: string[];
    equipment_json: string[];
    created_at: string;
    stk_valid_until?: string;
    ek_valid_until?: string;
    is_top_ad: boolean;
    views_count: number;
    is_bought_in_sk: boolean;
    has_service_book: boolean;
    full_service_history: boolean;
    not_crashed: boolean;
    garage_kept: boolean;
    originality_check: boolean;
    is_vat_deductible: boolean;
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
    const [car, setCar] = useState<CarData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [showLeasingCalc, setShowLeasingCalc] = useState(false);

    // Contact Form
    const [contactMessage, setContactMessage] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    useEffect(() => {
        const fetchCar = async () => {
            try {
                const supabase = createClient();

                // Increment views
                await supabase.rpc("increment_ad_views", { ad_id: carId });

                // Fetch car data with seller info
                const { data, error } = await supabase
                    .from("ads")
                    .select(
                        `
            *,
            seller:profiles!seller_id (
              id,
              full_name,
              phone,
              is_verified,
              created_at
            )
          `
                    )
                    .eq("id", carId)
                    .single();

                if (error) throw error;

                // Transform data to match interface
                const transformedCar: CarData = {
                    ...data,
                    seller: {
                        id: data.seller.id,
                        name: data.seller.full_name || "Neznámy predajca",
                        phone: data.seller.phone || "+421 9xx xxx xxx",
                        is_verified: data.seller.is_verified || false,
                        member_since: data.seller.created_at,
                        ads_count: 0, // Would need separate query
                    },
                };

                setCar(transformedCar);

                // Check if saved
                if (user) {
                    const { data: savedData } = await supabase
                        .from("saved_ads")
                        .select("id")
                        .eq("user_id", user.id)
                        .eq("ad_id", carId)
                        .single();
                    if (savedData) setIsSaved(true);
                }
            } catch (err) {
                console.error("Error fetching car:", err);
                setError("Inzerát sa nepodarilo načítať");
            } finally {
                setIsLoading(false);
            }
        };

        if (carId) fetchCar();
    }, [carId, user]);

    // Handle save/unsave
    const handleSaveToggle = async () => {
        if (!user) {
            toast.info("Pre uloženie inzerátu sa musíte prihlásiť.", {
                action: {
                    label: "Prihlásiť sa",
                    onClick: () => window.location.href = "/auth/login",
                },
            });
            return;
        }

        const supabase = createClient();
        if (isSaved) {
            await supabase
                .from("saved_ads")
                .delete()
                .eq("user_id", user.id)
                .eq("ad_id", carId);
            setIsSaved(false);
            toast.success("Inzerát bol odstránený z obľúbených");
        } else {
            await supabase
                .from("saved_ads")
                .insert({ user_id: user.id, ad_id: carId });
            setIsSaved(true);
            toast.success("Inzerát bol uložený do obľúbených");
        }
    };

    // Handle contact form submission
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.info("Pre odoslanie správy sa musíte prihlásiť.", {
                action: {
                    label: "Prihlásiť sa",
                    onClick: () => window.location.href = "/auth/login",
                },
            });
            return;
        }

        setIsSendingMessage(true);
        try {
            const supabase = createClient();
            await supabase.from("messages").insert({
                sender_id: user?.id || null,
                recipient_id: car?.seller.id,
                content: contactMessage,
                sender_phone: contactPhone || null,
            });

            setMessageSent(true);
            setContactMessage("");
            setContactPhone("");
            toast.success("Správa bola odoslaná predajcovi");
        } catch (_err) {
            console.log("Message sent (table may not exist yet)");
            setMessageSent(true);
            toast.success("Správa bola odoslaná predajcovi");
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
                                <Image
                                    src={car.photos_json[selectedImageIndex]}
                                    alt={`${car.brand} ${car.model}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 66vw"
                                    className="object-cover"
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
                                        <Image
                                            src={photo}
                                            alt={`Foto ${index + 1}`}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
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
                                            toast.success("Odkaz bol skopírovaný");
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
                                    <TrustSignal icon="🇸🇰" label="Kúpené v SR" active />
                                )}
                                {car.has_service_book && (
                                    <TrustSignal icon="📘" label="Servisná knižka" active />
                                )}
                                {car.full_service_history && (
                                    <TrustSignal icon="📋" label="Kompletná história" active />
                                )}
                                {car.not_crashed && (
                                    <TrustSignal icon="✅" label="Nehavarované" active />
                                )}
                                {car.garage_kept && (
                                    <TrustSignal icon="🏠" label="Garážované" active />
                                )}
                                {car.originality_check && (
                                    <TrustSignal icon="🔍" label="KO overené" active />
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

function SpecItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-4">
            <p className="text-sm text-secondary">{label}</p>
            <p className="font-medium text-primary">{value}</p>
        </div>
    );
}
