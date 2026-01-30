"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/config/vat";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatters";
import { toast } from "sonner";
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

    const [contactMessage, setContactMessage] = useState("");
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
            <main className="pt-20 pb-16 animate-pulse">
                <div className="container-main">
                    <div className="h-4 w-32 bg-background-secondary rounded mb-8" />
                    <div className="aspect-video bg-background-secondary rounded-lg mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-8 w-3/4 bg-background-secondary rounded" />
                            <div className="h-24 bg-background-secondary rounded" />
                        </div>
                        <div className="h-64 bg-background-secondary rounded-lg" />
                    </div>
                </div>
            </main>
        );
    }

    if (error || !car) return (
        <main className="pt-32 pb-16">
            <div className="container-main text-center">
                <p className="text-text-secondary">Inzerát nenájdený.</p>
                <Link href="/auta" className="text-accent hover:underline mt-4 inline-block">
                    Späť na autá
                </Link>
            </div>
        </main>
    );

    return (
        <main className="pt-20 pb-16">
            <div className="container-main">
                {/* Breadcrumbs */}
                <nav className="mb-6">
                    <ol className="flex items-center gap-2 text-sm text-text-tertiary">
                        <li><Link href="/" className="hover:text-text-primary transition-colors">Domov</Link></li>
                        <li>/</li>
                        <li><Link href="/auta" className="hover:text-text-primary transition-colors">Autá</Link></li>
                        <li>/</li>
                        <li className="text-text-primary font-medium">{car.brand} {car.model}</li>
                    </ol>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Gallery */}
                        <div className="space-y-4">
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-background-secondary">
                                <Image
                                    src={car.photos_json[selectedImageIndex]}
                                    alt={`${car.brand} ${car.model}`}
                                    fill
                                    priority
                                    className="object-cover"
                                />

                                {/* Navigation arrows */}
                                {car.photos_json.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : car.photos_json.length - 1)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                                        >
                                            <ChevronLeftIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedImageIndex(prev => prev < car.photos_json.length - 1 ? prev + 1 : 0)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                                        >
                                            <ChevronRightIcon className="w-5 h-5" />
                                        </button>
                                    </>
                                )}

                                {/* Image counter */}
                                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 rounded text-white text-xs font-medium">
                                    {selectedImageIndex + 1} / {car.photos_json.length}
                                </div>
                            </div>

                            {/* Thumbnails */}
                            {car.photos_json.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {car.photos_json.map((photo, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImageIndex(index)}
                                            className={cn(
                                                "relative w-20 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors",
                                                selectedImageIndex === index 
                                                    ? "border-text-primary" 
                                                    : "border-transparent hover:border-border"
                                            )}
                                        >
                                            <Image src={photo} alt="" fill className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Heading */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
                                    {car.brand} {car.model}
                                </h1>
                                <p className="text-text-secondary mt-1">
                                    {car.year} • {car.mileage_km.toLocaleString("sk-SK")} km • {car.fuel} • {car.transmission}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveToggle}
                                    className={cn(
                                        "w-10 h-10 rounded-md border flex items-center justify-center transition-colors",
                                        isSaved 
                                            ? "bg-text-primary text-white border-text-primary" 
                                            : "border-border hover:border-border-strong"
                                    )}
                                >
                                    <HeartIcon className={cn("w-5 h-5", isSaved && "fill-current")} />
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                                    className="w-10 h-10 rounded-md border border-border flex items-center justify-center hover:border-border-strong transition-colors"
                                >
                                    <ShareIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <SpecItem label="Výkon" value={`${car.power_kw} kW`} />
                            <SpecItem label="Objem" value={`${car.engine_volume_cm3} cm³`} />
                            <SpecItem label="Karoséria" value={car.body_style} />
                            <SpecItem label="Farba" value={car.color || "—"} />
                        </div>

                        {/* Description */}
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary mb-3">Popis vozidla</h2>
                            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                                {car.description}
                            </p>
                        </div>

                        {/* Equipment */}
                        {car.equipment_json?.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary mb-3">Výbava</h2>
                                <div className="flex flex-wrap gap-2">
                                    {car.equipment_json.map((item, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-background-secondary rounded-md text-sm text-text-secondary">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-4 lg:sticky lg:top-24">
                        {/* Price Card */}
                        <div className="bg-white border border-border rounded-lg p-6">
                            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Cena vozidla</p>
                            <p className="text-3xl font-display font-semibold text-text-primary tabular-nums">
                                {formatCurrency(car.price_eur)}
                            </p>
                            {car.is_vat_deductible && (
                                <p className="mt-2 text-xs text-text-tertiary">
                                    Možný odpočet DPH
                                </p>
                            )}

                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => setShowPhone(!showPhone)}
                                    className="btn-primary w-full py-3"
                                >
                                    {showPhone ? car.seller.phone : "Zobraziť telefón"}
                                </button>
                                <button
                                    onClick={() => setShowContactForm(!showContactForm)}
                                    className="btn-secondary w-full py-3"
                                >
                                    Napísať správu
                                </button>
                            </div>

                            {/* Contact Form */}
                            {showContactForm && (
                                <form onSubmit={handleSendMessage} className="mt-6 pt-6 border-t border-border">
                                    <textarea
                                        rows={4}
                                        value={contactMessage}
                                        onChange={(e) => setContactMessage(e.target.value)}
                                        placeholder="Mám záujem o toto auto..."
                                        className="input resize-none mb-3"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSendingMessage}
                                        className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
                                    >
                                        {isSendingMessage ? "Odosielanie..." : "Odoslať dopyt"}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Seller Info */}
                        <div className="bg-background-secondary rounded-lg p-6">
                            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-4">Predajca</p>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl border border-border">
                                    👤
                                </div>
                                <div>
                                    <p className="font-medium text-text-primary flex items-center gap-1.5">
                                        {car.seller.name}
                                        {car.seller.is_verified && (
                                            <span className="text-success" title="Overený predajca">✓</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-text-tertiary">
                                        Člen od {new Date(car.seller.member_since).getFullYear()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-text-muted px-2">
                            <span>{car.views_count} zobrazení</span>
                            <span>{formatDate(car.created_at)}</span>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function SpecItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-medium text-text-primary">{value}</p>
        </div>
    );
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
    );
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
    );
}
