"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";

// SVG Flag components for proper cross-platform rendering
function SlovakFlag({ className = "w-5 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 512 341" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="341" fill="#EE1C25" />
            <rect width="512" height="227" fill="#0B4EA2" />
            <rect width="512" height="113.7" fill="#FFFFFF" />
            <path fill="#FFFFFF" d="M90.9 283.4c-38.5-11.8-66-47.6-66-89.7 0-42.1 27.5-77.9 66-89.7v-23.4c-51.7 13.2-90 60-90 115.1s38.3 101.9 90 115.1v-27.4z" />
            <path fill="#EE1C25" d="M146.9 124.6c0-23.5-19-42.5-42.5-42.5h-14.2c-23.5 0-42.5 19-42.5 42.5v69.1c0 31.4 17.3 58.8 42.8 73.3l14.2 8.8 14.2-8.8c25.5-14.5 42.8-41.9 42.8-73.3v-69.1h0z" />
            <path fill="#FFFFFF" d="M118.3 181.1h-28.4v-56.5h28.4v56.5zm0 28.4h-28.4v28.4h28.4v-28.4z" />
            <path fill="#0B4EA2" d="M118.3 209.5h-28.4v28.4c9.3 5.5 19 8.5 28.4 0v-28.4z" />
        </svg>
    );
}

function UKFlag({ className = "w-5 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 512 341" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="341" fill="#012169" />
            <path fill="#FFF" d="M0 0l512 341M512 0L0 341" stroke="#FFF" strokeWidth="60" />
            <path fill="#C8102E" d="M0 0l512 341M512 0L0 341" stroke="#C8102E" strokeWidth="40" />
            <path fill="#FFF" d="M256 0v341M0 170.5h512" stroke="#FFF" strokeWidth="100" />
            <path fill="#C8102E" d="M256 0v341M0 170.5h512" stroke="#C8102E" strokeWidth="60" />
        </svg>
    );
}

function HungarianFlag({ className = "w-5 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 512 341" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="341" fill="#FFFFFF" />
            <rect width="512" height="113.7" fill="#CE2939" />
            <rect y="227.3" width="512" height="113.7" fill="#477050" />
        </svg>
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
    const [currentLocale, setCurrentLocale] = useState<Locale>("sk");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get current locale from cookie on mount
    useEffect(() => {
        const localeCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("NEXT_LOCALE="))
            ?.split("=")[1];

        if (localeCookie && locales.includes(localeCookie as Locale)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentLocale(localeCookie as Locale);
        }
    }, []);

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
