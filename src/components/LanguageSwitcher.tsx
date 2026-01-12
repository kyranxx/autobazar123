"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import Image from "next/image";

// Flag components using PNG images
function SlovakFlag({ className = "w-5 h-4" }: { className?: string }) {
    return (
        <div className={`relative ${className} flex-shrink-0`}>
            <Image
                src="/flags/sk.png"
                alt="Slovenčina"
                fill
                className="object-cover"
                sizes="32px"
            />
        </div>
    );
}

function UKFlag({ className = "w-5 h-4" }: { className?: string }) {
    return (
        <div className={`relative ${className} flex-shrink-0`}>
            <Image
                src="/flags/gb.png"
                alt="English"
                fill
                className="object-cover"
                sizes="32px"
            />
        </div>
    );
}

function HungarianFlag({ className = "w-5 h-4" }: { className?: string }) {
    return (
        <div className={`relative ${className} flex-shrink-0`}>
            <Image
                src="/flags/hu.png"
                alt="Magyar"
                fill
                className="object-cover"
                sizes="32px"
            />
        </div>
    );
}

const FlagComponents: Record<Locale, React.ComponentType<{ className?: string }>> = {
    sk: SlovakFlag,
    en: UKFlag,
    hu: HungarianFlag,
};

export default function LanguageSwitcher() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
        if (typeof document !== 'undefined') {
            const localeCookie = document.cookie
                .split("; ")
                .find((row) => row.startsWith("NEXT_LOCALE="))
                ?.split("=")[1];

            if (localeCookie && locales.includes(localeCookie as Locale)) {
                return localeCookie as Locale;
            }
        }
        return "sk";
    });

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLocaleChange = useCallback((locale: Locale) => {
        // Set cookie with 1 year expiry - wrapped in callback to avoid render-time mutation
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
        setCurrentLocale(locale);
        setIsOpen(false);
        // Use Next.js router refresh for faster switching (revalidates server components)
        startTransition(() => {
            router.refresh();
        });
    }, [router]);

    const CurrentFlag = FlagComponents[currentLocale];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-accent/5 hover:border-accent/30 transition-all duration-200 ${isPending ? 'opacity-70' : ''}`}
                aria-label="Change language"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                {isPending ? (
                    <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                    <CurrentFlag className="w-6 h-4 rounded-sm shadow-sm" />
                )}
                <span className="text-sm font-medium text-primary hidden sm:inline">
                    {currentLocale.toUpperCase()}
                </span>
                <svg
                    className={`w-4 h-4 text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-48 py-2 bg-white rounded-xl border border-border shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    role="listbox"
                    aria-label="Select language"
                >
                    {locales.map((locale) => {
                        const Flag = FlagComponents[locale];
                        return (
                            <button
                                key={locale}
                                onClick={() => handleLocaleChange(locale)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/5 transition-colors ${currentLocale === locale
                                    ? "bg-accent/10 text-accent font-medium"
                                    : "text-primary"
                                    }`}
                                role="option"
                                aria-selected={currentLocale === locale}
                            >
                                <Flag className="w-6 h-4 rounded-sm shadow-sm" />
                                <span className="text-sm">{localeNames[locale]}</span>
                                {currentLocale === locale && (
                                    <svg
                                        className="w-4 h-4 ml-auto text-accent"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
