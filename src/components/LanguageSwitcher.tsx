"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import Image from "next/image";
import { cn } from "@/utils/cn";

function SlovakFlag({ className = "w-5 h-4" }: { className?: string }) {
    return (
        <div className={cn("relative flex-shrink-0", className)}>
            <Image src="/flags/sk.png" alt="Slovenčina" fill className="object-cover" sizes="32px" />
        </div>
    );
}

function UKFlag({ className = "w-5 h-4" }: { className?: string }) {
    return (
        <div className={cn("relative flex-shrink-0", className)}>
            <Image src="/flags/gb.png" alt="English" fill className="object-cover" sizes="32px" />
        </div>
    );
}

function HungarianFlag({ className = "w-5 h-4" }: { className?: string }) {
    return (
        <div className={cn("relative flex-shrink-0", className)}>
            <Image src="/flags/hu.png" alt="Magyar" fill className="object-cover" sizes="32px" />
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
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
        setCurrentLocale(locale);
        setIsOpen(false);
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
                className={cn(
                    "flex items-center gap-3 px-4 py-2 border border-border rounded-full bg-white hover:bg-surface transition-all duration-300",
                    isPending && "opacity-70"
                )}
            >
                <div className="w-5 h-3 overflow-hidden rounded-[1px]">
                    <CurrentFlag className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    {currentLocale}
                </span>
                <ChevronDownIcon className={cn("w-3 h-3 text-secondary opacity-40 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-44 bg-white border border-border/40 rounded-2xl shadow-premium z-[100] animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
                    {locales.map((locale) => {
                        const Flag = FlagComponents[locale];
                        const isActive = currentLocale === locale;
                        return (
                            <button
                                key={locale}
                                onClick={() => handleLocaleChange(locale)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors border-b border-border/10 last:border-0",
                                    isActive ? "bg-surface text-primary" : "text-primary hover:bg-surface/50"
                                )}
                            >
                                <div className="w-5 h-3 overflow-hidden rounded-[1px] shrink-0">
                                    <Flag className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-widest flex-1">{localeNames[locale]}</span>
                                {isActive && (
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}
