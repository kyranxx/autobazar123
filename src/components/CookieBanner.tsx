"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "autobazar123_cookie_consent";

interface CookieConsent {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp: number;
}

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [consent, setConsent] = useState<CookieConsent>({
        necessary: true, // Always required
        analytics: false,
        marketing: false,
        timestamp: 0,
    });

    useEffect(() => {
        // Check if consent already given
        const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (savedConsent) {
            const parsed = JSON.parse(savedConsent) as CookieConsent;
            setConsent(parsed);
            setIsVisible(false);
        } else {
            // Show banner after a short delay
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const saveConsent = (newConsent: CookieConsent) => {
        const consentWithTimestamp = { ...newConsent, timestamp: Date.now() };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp));
        setConsent(consentWithTimestamp);
        setIsVisible(false);
        setShowSettings(false);
    };

    const acceptAll = () => {
        saveConsent({ necessary: true, analytics: true, marketing: true, timestamp: 0 });
    };

    const acceptNecessary = () => {
        saveConsent({ necessary: true, analytics: false, marketing: false, timestamp: 0 });
    };

    const savePreferences = () => {
        saveConsent(consent);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
            <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
                {!showSettings ? (
                    /* Main Banner */
                    <div className="p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🍪</span>
                                    <h3 className="font-semibold text-primary">
                                        Používame cookies
                                    </h3>
                                </div>
                                <p className="text-sm text-secondary">
                                    Na zlepšenie vášho zážitku používame cookies. Nevyhnutné cookies sú
                                    potrebné pre fungovanie stránky. Analytické a marketingové cookies
                                    nám pomáhajú zlepšovať službu.{" "}
                                    <Link href="/ochrana-udajov" className="text-accent hover:underline">
                                        Viac informácií
                                    </Link>
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-surface transition-colors"
                                >
                                    Nastavenia
                                </button>
                                <button
                                    onClick={acceptNecessary}
                                    className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-surface transition-colors"
                                >
                                    Len nevyhnutné
                                </button>
                                <button
                                    onClick={acceptAll}
                                    className="px-6 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
                                >
                                    Prijať všetky
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Settings Panel */
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary">
                                Nastavenia cookies
                            </h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-secondary hover:text-primary"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            {/* Necessary */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-primary">Nevyhnutné</span>
                                        <span className="px-2 py-0.5 rounded text-xs bg-accent/10 text-accent">
                                            Vždy aktívne
                                        </span>
                                    </div>
                                    <p className="text-sm text-secondary mt-1">
                                        Potrebné pre základné fungovanie stránky, prihlásenie a bezpečnosť.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={true}
                                    disabled
                                    className="mt-1 w-5 h-5 rounded accent-accent"
                                />
                            </div>

                            {/* Analytics */}
                            <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                                <div className="flex-1">
                                    <span className="font-medium text-primary">Analytické</span>
                                    <p className="text-sm text-secondary mt-1">
                                        Pomáhajú nám pochopiť, ako používatelia využívajú stránku.
                                        Dáta sú anonymizované.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={consent.analytics}
                                    onChange={(e) =>
                                        setConsent({ ...consent, analytics: e.target.checked })
                                    }
                                    className="mt-1 w-5 h-5 rounded accent-accent cursor-pointer"
                                />
                            </div>

                            {/* Marketing */}
                            <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                                <div className="flex-1">
                                    <span className="font-medium text-primary">Marketingové</span>
                                    <p className="text-sm text-secondary mt-1">
                                        Umožňujú zobrazovať relevantné reklamy na iných stránkach.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={consent.marketing}
                                    onChange={(e) =>
                                        setConsent({ ...consent, marketing: e.target.checked })
                                    }
                                    className="mt-1 w-5 h-5 rounded accent-accent cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={acceptNecessary}
                                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-surface transition-colors"
                            >
                                Len nevyhnutné
                            </button>
                            <button
                                onClick={savePreferences}
                                className="px-6 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
                            >
                                Uložiť nastavenia
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Hook to check cookie consent
export function useCookieConsent() {
    const [consent, setConsent] = useState<CookieConsent | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (saved) {
            setConsent(JSON.parse(saved));
        }
    }, []);

    return consent;
}
