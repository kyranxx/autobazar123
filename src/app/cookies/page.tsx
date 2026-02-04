"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Note: metadata must be in a separate server component or layout for client components
// For now, this will work as a client component for the interactive cookie settings

export default function CookiesPage() {
    const defaultPrefs = {
        necessary: true, // Always required
        analytics: false,
        marketing: false,
        preferences: false,
    };

    const [preferences, setPreferences] = useState(defaultPrefs);
    useEffect(() => {
        const savedPrefs = localStorage.getItem("cookiePreferences");
        if (savedPrefs) {
            try {
                const parsed = JSON.parse(savedPrefs);
                setPreferences({ ...defaultPrefs, ...parsed });
            } catch {
                setPreferences(defaultPrefs);
            }
        }
    }, []);

    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        localStorage.setItem("cookiePreferences", JSON.stringify(preferences));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleAcceptAll = () => {
        const allAccepted = {
            necessary: true,
            analytics: true,
            marketing: true,
            preferences: true,
        };
        setPreferences(allAccepted);
        localStorage.setItem("cookiePreferences", JSON.stringify(allAccepted));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-20 pb-16">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Hero */}
                    <div className="py-12 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl md:text-5xl">
                            Nastavenia cookies
                        </h1>
                        <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
                            Upravte si, aké cookies môžeme používať na zlepšenie vašej skúsenosti
                        </p>
                    </div>

                    {/* Cookie Settings */}
                    <div className="space-y-6">
                        {/* Necessary */}
                        <div className="p-6 rounded-2xl border border-border bg-background">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-primary">Nevyhnutné cookies</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                            Povinné
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-secondary">
                                        Tieto cookies sú nevyhnutné pre fungovanie webovej stránky a nemôžu byť vypnuté.
                                        Zahŕňajú napríklad cookies pre prihlásenie, bezpečnosť a základnú funkcionalitu.
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <div className="w-12 h-7 rounded-full bg-accent/20 flex items-center justify-end px-1 cursor-not-allowed opacity-70">
                                        <div className="w-5 h-5 rounded-full bg-accent" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analytics */}
                        <div className="p-6 rounded-2xl border border-border bg-background">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-primary">Analytické cookies</h3>
                                    <p className="mt-2 text-sm text-secondary">
                                        Tieto cookies nám pomáhajú pochopiť, ako návštevníci používajú našu stránku.
                                        Zbierajú anonymné údaje o počte návštev, zdrojoch návštevnosti a správaní používateľov.
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <button
                                        onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                                        className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${preferences.analytics ? "bg-accent justify-end" : "bg-surface justify-start"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full transition-colors ${preferences.analytics ? "bg-white" : "bg-tertiary"}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Marketing */}
                        <div className="p-6 rounded-2xl border border-border bg-background">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-primary">Marketingové cookies</h3>
                                    <p className="mt-2 text-sm text-secondary">
                                        Tieto cookies používame na zobrazovanie relevantných reklám na našej stránke aj mimo nej.
                                        Pomáhajú nám merať účinnosť reklamných kampaní.
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <button
                                        onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                                        className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${preferences.marketing ? "bg-accent justify-end" : "bg-surface justify-start"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full transition-colors ${preferences.marketing ? "bg-white" : "bg-tertiary"}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="p-6 rounded-2xl border border-border bg-background">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-primary">Preferenčné cookies</h3>
                                    <p className="mt-2 text-sm text-secondary">
                                        Tieto cookies si pamätajú vaše nastavenia a preferencie, ako napríklad jazykové nastavenia
                                        alebo zobrazenie stránky, aby ste mali pri ďalšej návšteve lepší zážitok.
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <button
                                        onClick={() => setPreferences({ ...preferences, preferences: !preferences.preferences })}
                                        className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${preferences.preferences ? "bg-accent justify-end" : "bg-surface justify-start"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full transition-colors ${preferences.preferences ? "bg-white" : "bg-tertiary"}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 rounded-full border border-border text-primary font-semibold hover:bg-surface transition-colors"
                            >
                                Uložiť môj výber
                            </button>
                            <button
                                onClick={handleAcceptAll}
                                className="flex-1 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
                            >
                                Prijať všetky
                            </button>
                        </div>

                        {saved && (
                            <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-center">
                                ✓ Vaše nastavenia boli uložené
                            </div>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="mt-12 p-6 rounded-2xl border border-border bg-surface/30">
                        <h2 className="text-lg font-semibold text-primary mb-4">Čo sú cookies?</h2>
                        <p className="text-sm text-secondary leading-relaxed">
                            Cookies sú malé textové súbory, ktoré webové stránky ukladajú do vášho prehliadača.
                            Pomáhajú nám zapamätať si vaše nastavenia, analyzovať návštevnosť a zlepšovať
                            vaše skúsenosti na našej stránke. Viac informácií nájdete v našej{" "}
                            <Link href="/ochrana-udajov" className="text-accent hover:underline">
                                politike ochrany osobných údajov
                            </Link>.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
