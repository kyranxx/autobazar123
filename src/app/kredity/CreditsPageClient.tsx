"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { CREDIT_PACKS, ACTION_COSTS, CreditPack } from "@/config/credits";

export default function CreditsPageClient() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Implement Stripe Checkout
    const handlePurchase = useCallback(async (pack: CreditPack) => {
        if (!user) {
            router.push("/auth/login?redirect=/kredity");
            return;
        }

        setSelectedPack(pack);
        setIsProcessing(true);

        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    packId: pack.id,
                    userId: user.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Chyba pri vytváraní platby");
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Nepodarilo sa získať platobnú adresu");
            }
        } catch (error) {
            console.error("Stripe Checkout Error:", error);
            alert(error instanceof Error ? error.message : "Chyba pri vytváraní platby. Skúste to prosím neskôr.");
            setIsProcessing(false);
            setSelectedPack(null);
        }
    }, [user, router]);

    return (
        <main className="pt-20 pb-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="py-8 text-center">
                    <h1 className="text-3xl font-bold text-primary sm:text-4xl">
                        Kúpiť kredity
                    </h1>
                    <p className="mt-3 text-lg text-secondary max-w-2xl mx-auto">
                        1 kredit = 1 €. Čím viac kreditov kúpite, tým väčšiu zľavu získate.
                    </p>

                    {user && (
                        <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-surface border border-border">
                            <span className="text-secondary">Váš zostatok:</span>
                            <span className="text-2xl font-bold text-accent">
                                {profile?.credit_balance || 0}
                            </span>
                            <span className="text-secondary">kreditov</span>
                        </div>
                    )}
                </div>

                {/* Credit Packs */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-16">
                    {CREDIT_PACKS.map((pack) => (
                        <div
                            key={pack.id}
                            className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all ${pack.featured
                                ? "border-accent bg-accent/5 shadow-lg scale-105"
                                : "border-border hover:border-accent/50 hover:shadow-md"
                                }`}
                        >
                            {/* Featured Badge */}
                            {pack.featured && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-background text-sm font-bold shadow-md">
                                    Najobľúbenejší
                                </div>
                            )}

                            {/* Discount Badge */}
                            {pack.discount > 0 && (
                                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-bold">
                                    -{pack.discount}%
                                </div>
                            )}

                            {/* Pack Name */}
                            <h3 className="text-lg font-semibold text-primary mb-4">
                                {pack.nameSk}
                            </h3>

                            {/* Credits */}
                            <div className="mb-4">
                                <span className="text-4xl font-bold text-primary">{pack.credits}</span>
                                <span className="text-secondary ml-2">kreditov</span>
                            </div>

                            {/* Price */}
                            <div className="mb-2">
                                <span className="text-3xl font-bold text-accent">{pack.price}€</span>
                            </div>

                            {/* Price per credit */}
                            <p className="text-sm text-secondary mb-6">
                                {(pack.price / pack.credits).toFixed(2)} € / kredit
                            </p>

                            {/* Buy Button */}
                            <button
                                onClick={() => handlePurchase(pack)}
                                disabled={isProcessing && selectedPack?.id === pack.id}
                                className={`mt-auto w-full py-3 rounded-xl font-semibold transition-all ${pack.featured
                                    ? "bg-accent text-white hover:bg-accent-hover"
                                    : "bg-primary text-background hover:opacity-90"
                                    } disabled:opacity-50`}
                            >
                                {isProcessing && selectedPack?.id === pack.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <LoadingSpinner className="w-5 h-5" />
                                        Spracúvam...
                                    </span>
                                ) : (
                                    "Kúpiť"
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* What You Can Do With Credits */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-primary text-center mb-8">
                        Čo môžete robiť s kreditmi?
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {ACTION_COSTS.map((action) => (
                            <div
                                key={action.id}
                                className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-background hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                    <span className="text-2xl">{getActionIcon(action.id)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-semibold text-primary">{action.nameSk}</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-sm font-bold">
                                            {action.credits} kr
                                        </span>
                                    </div>
                                    <p className="text-sm text-secondary mt-1">{action.descriptionSk}</p>
                                    <p className="text-xs text-tertiary mt-1">{action.duration}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-primary text-center mb-8">
                        Často kladené otázky
                    </h2>

                    <div className="space-y-4">
                        <FAQItem
                            question="Ako fungujú kredity?"
                            answer="1 kredit = 1 €. Kredity používate na zverejňovanie inzerátov a prémiové funkcie ako Topovanie alebo Zvýraznenie. Čím väčší balík kúpite, tým väčšiu zľavu získate."
                        />
                        <FAQItem
                            question="Expirujú kredity?"
                            answer="Nie, zakúpené kredity nikdy neexpirujú. Môžete ich použiť kedykoľvek."
                        />
                        <FAQItem
                            question="Môžem dostať refund?"
                            answer="Zakúpené kredity sú nevratné. Ak máte problém s platbou, kontaktujte nás."
                        />
                        <FAQItem
                            question="Aké platobné metódy prijímate?"
                            answer="Prijímame platobné karty (Visa, Mastercard, Maestro) cez bezpečnú platobnú bránu Stripe."
                        />
                        <FAQItem
                            question="Ako rýchlo sa kredity pripíšu?"
                            answer="Kredity sa pripíšu okamžite po úspešnej platbe. Ak sa tak nestane do 5 minút, kontaktujte nás."
                        />
                    </div>
                </div>

                {/* Trust Signals */}
                <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-secondary">
                    <div className="flex items-center gap-2">
                        <ShieldIcon className="w-5 h-5 text-success" />
                        <span className="text-sm">Bezpečná platba cez Stripe</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <LockIcon className="w-5 h-5 text-success" />
                        <span className="text-sm">256-bit SSL šifrovanie</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CardIcon className="w-5 h-5 text-success" />
                        <span className="text-sm">Visa, Mastercard, Maestro</span>
                    </div>
                </div>
            </div>
        </main>
    );
}

// Helper to get action icons
function getActionIcon(actionId: string): string {
    const icons: Record<string, string> = {
        publish: "📝",
        prolong: "🔄",
        top_ad: "⭐",
        highlight: "✨",
        bump: "🚀",
    };
    return icons[actionId] || "💰";
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-border rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-surface transition-colors"
            >
                <span className="font-medium text-primary">{question}</span>
                <ChevronIcon className={`w-5 h-5 text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
                <div className="px-5 pb-5 text-secondary animate-fade-in">
                    {answer}
                </div>
            )}
        </div>
    );
}

// Icons
function LoadingSpinner({ className }: { className?: string }) {
    return (
        <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

function ShieldIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    );
}

function LockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
}

function CardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    );
}
