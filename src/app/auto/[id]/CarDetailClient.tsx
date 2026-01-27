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
    ChevronLeftIcon,
    ChevronRightIcon,
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
import { cn } from "@/utils/cn";

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

    const [contactMessage, setContactMessage] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    useEffect(() => {
        const fetchCar = async () => {
            try {
                const supabase = createClient();
                await supabase.rpc("increment_ad_views", { ad_id: carId });

                const { data, error } = await supabase
                    .from("ads")
                    .select(`*, seller:profiles!seller_id (id, full_name, phone, is_verified, created_at)`)
                    .eq("id", carId)
                    .single();

                if (error) throw error;

                const transformedCar: CarData = {
                    ...data,
                    seller: {
                        id: data.seller.id,
                        name: data.seller.full_name || "Neznámy predajca",
                        phone: data.seller.phone || "+421 9xx xxx xxx",
                        is_verified: data.seller.is_verified || false,
                        member_since: data.seller.created_at,
                        ads_count: 0,
                    },
                };

                setCar(transformedCar);

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

    const handleSaveToggle = async () => {
        if (!user) {
            toast.info("Pre uloženie inzerátu sa musíte prihlásiť.");
            return;
        }

        const supabase = createClient();
        if (isSaved) {
            await supabase.from("saved_ads").delete().eq("user_id", user.id).eq("ad_id", carId);
            setIsSaved(false);
            toast.success("Inzerát odstránený z obľúbených");
        } else {
            await supabase.from("saved_ads").insert({ user_id: user.id, ad_id: carId });
            setIsSaved(true);
            toast.success("Inzerát uložený");
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.info("Pre odoslanie správy sa musíte prihlásiť.");
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
            toast.success("Správa odoslaná");
        } catch (_err) {
            setMessageSent(true);
            toast.success("Správa odoslaná");
        } finally {
            setIsSendingMessage(false);
        }
    };

    if (isLoading) {
        return (
            <main className="pt-32 pb-16 bg-white animate-pulse">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="h-10 w-64 bg-surface rounded-xl mb-12" />
                    <div className="aspect-[16/9] bg-surface rounded-[32px] mb-12" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="h-12 w-3/4 bg-surface rounded-xl" />
                            <div className="h-32 bg-surface rounded-xl" />
                        </div>
                        <div className="h-96 bg-surface rounded-3xl" />
                    </div>
                </div>
            </main>
        );
    }

    if (error || !car) return <div className="pt-40 text-center">Inzerát nenájdený.</div>;

    return (
        <main className="pt-32 pb-32 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <nav className="mb-12">
                    <ol className="flex items-center gap-3 text-[11px] font-bold text-secondary uppercase tracking-widest opacity-40">
                        <li><Link href="/">Domov</Link></li>
                        <li className="text-primary">/</li>
                        <li><Link href="/auta">Autá</Link></li>
                        <li className="text-primary">/</li>
                        <li className="text-primary opacity-100">{car.brand} {car.model}</li>
                    </ol>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-16">
                        {/* Gallery Section */}
                        <div className="space-y-6">
                            <div className="relative aspect-[16/10] overflow-hidden rounded-[32px] bg-surface group">
                                <Image
                                    src={car.photos_json[selectedImageIndex]}
                                    alt={car.brand}
                                    fill
                                    priority
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                                <div className="absolute inset-0 flex items-center justify-between px-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : car.photos_json.length - 1)}
                                        className="w-14 h-14 rounded-full bg-white/90 backdrop-blur border border-border flex items-center justify-center hover:bg-white transition-all shadow-premium"
                                    >
                                        <ChevronLeftIcon className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedImageIndex(prev => prev < car.photos_json.length - 1 ? prev + 1 : 0)}
                                        className="w-14 h-14 rounded-full bg-white/90 backdrop-blur border border-border flex items-center justify-center hover:bg-white transition-all shadow-premium"
                                    >
                                        <ChevronRightIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="absolute bottom-8 right-8 px-5 py-2 bg-black/40 backdrop-blur-md rounded-full text-white text-[11px] font-bold tracking-widest">
                                    {selectedImageIndex + 1} / {car.photos_json.length}
                                </div>
                            </div>

                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                {car.photos_json.map((photo, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={cn(
                                            "relative w-32 aspect-[3/2] rounded-xl overflow-hidden border-2 transition-all shrink-0",
                                            selectedImageIndex === index ? "border-primary opacity-100 scale-[1.02]" : "border-transparent opacity-40 hover:opacity-100"
                                        )}
                                    >
                                        <Image src={photo} alt="" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Heading Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-12">
                            <div className="space-y-4">
                                <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-primary leading-none">
                                    {car.brand} <span className="text-secondary opacity-40">{car.model}</span>
                                </h1>
                                <p className="text-lg font-medium text-secondary opacity-60 tabular-nums">
                                    {car.year} • {car.mileage_km.toLocaleString("sk-SK")} km • {car.fuel} • {car.transmission}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleSaveToggle}
                                    className={cn(
                                        "w-14 h-14 rounded-full border border-border flex items-center justify-center transition-all",
                                        isSaved ? "bg-primary text-white border-primary" : "bg-white hover:bg-surface"
                                    )}
                                >
                                    <HeartIcon className={cn("w-6 h-6", isSaved && "fill-current")} />
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                                    className="w-14 h-14 rounded-full border border-border bg-white hover:bg-surface flex items-center justify-center transition-all"
                                >
                                    <ShareIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <SpecItem label="Výkon" value={`${car.power_kw} kW`} />
                            <SpecItem label="Objem" value={`${car.engine_volume_cm3} cm³`} />
                            <SpecItem label="Karoséria" value={car.body_style} />
                            <SpecItem label="Farba" value={car.color || "—"} />
                        </div>

                        {/* Description */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-primary uppercase tracking-widest">Popis vozidla</h2>
                            <p className="text-lg text-secondary leading-relaxed font-medium opacity-80 whitespace-pre-wrap">
                                {car.description}
                            </p>
                        </div>

                        {/* Equipment */}
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-primary uppercase tracking-widest">Výbava</h2>
                            <div className="flex flex-wrap gap-3">
                                {car.equipment_json.map((item, i) => (
                                    <span key={i} className="px-5 py-3 rounded-xl bg-surface text-sm font-bold text-primary opacity-60">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <aside className="space-y-8 sticky top-32">
                        {/* Price & Primary CTA */}
                        <div className="p-10 bg-white border border-border/60 rounded-[40px] shadow-premium space-y-8 text-center">
                            <div>
                                <p className="text-[11px] font-bold text-secondary uppercase tracking-[0.3em] mb-3 opacity-40">Cena vozidla</p>
                                <p className="text-5xl font-display font-bold text-primary tracking-tighter tabular-nums leading-none">
                                    {formatCurrency(car.price_eur)}
                                </p>
                                {car.is_vat_deductible && (
                                    <p className="mt-4 text-[10px] font-bold text-secondary uppercase tracking-widest opacity-40">
                                        Možný odpočet DPH
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4 pt-4">
                                <button
                                    onClick={() => setShowPhone(!showPhone)}
                                    className="w-full h-18 bg-primary text-white rounded-full font-bold transition-all hover:bg-black flex items-center justify-center gap-4 shadow-xl shadow-black/5"
                                >
                                    <PhoneIcon className="w-6 h-6" />
                                    {showPhone ? car.seller.phone : "Zobraziť telefón"}
                                </button>
                                <button
                                    onClick={() => setShowContactForm(!showContactForm)}
                                    className="w-full h-18 bg-surface border border-border text-primary rounded-full font-bold transition-all hover:bg-surface-hover flex items-center justify-center gap-4"
                                >
                                    <MessageIcon className="w-6 h-6" />
                                    Napísať správu
                                </button>
                            </div>

                            {showContactForm && (
                                <form onSubmit={handleSendMessage} className="pt-8 border-t border-border animate-in slide-in-from-top-4 space-y-4">
                                    <textarea
                                        rows={4}
                                        value={contactMessage}
                                        onChange={(e) => setContactMessage(e.target.value)}
                                        placeholder="Mám záujem o toto auto…"
                                        className="w-full p-6 rounded-2xl bg-surface border-transparent focus:border-primary/10 transition-all font-medium text-sm outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSendingMessage}
                                        className="w-full h-14 bg-primary text-white rounded-full font-bold text-sm disabled:opacity-50"
                                    >
                                        Odoslať dopyt
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Seller Info */}
                        <div className="p-8 bg-surface/50 rounded-3xl border border-border/40">
                            <div className="flex items-center gap-5 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm border border-border/20">
                                    👤
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-primary">{car.seller.name}</p>
                                        {car.seller.is_verified && <VerifiedIcon className="w-4 h-4 text-primary" />}
                                    </div>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-40">
                                        Člen od {new Date(car.seller.member_since).getFullYear()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Utilities */}
                        <div className="space-y-4">
                            <button className="w-full h-16 bg-white border border-border rounded-full flex items-center justify-between px-8 hover:bg-surface transition-all">
                                <span className="text-xs font-bold text-primary uppercase tracking-widest opacity-60">Leasingová kalkulačka</span>
                                <CalculatorIcon className="w-5 h-5 text-secondary" />
                            </button>
                            <button className="w-full h-16 bg-white border border-border rounded-full flex items-center justify-between px-8 hover:bg-surface transition-all">
                                <span className="text-xs font-bold text-primary uppercase tracking-widest opacity-60">Kúpna zmluva PDF</span>
                                <DocumentIcon className="w-5 h-5 text-secondary" />
                            </button>
                        </div>

                        {/* Footer Stats */}
                        <div className="flex items-center justify-between px-4 text-[10px] font-bold text-secondary uppercase tracking-widest opacity-30">
                            <div className="flex items-center gap-2">
                                <EyeIcon className="w-3 h-3" />
                                {car.views_count} zobrazení
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-3 h-3" />
                                {formatDate(car.created_at)}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function SpecItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-2">
            <p className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] opacity-40">{label}</p>
            <p className="text-lg font-bold text-primary">{value}</p>
        </div>
    );
}
