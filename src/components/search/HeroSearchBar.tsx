"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SearchIcon, XIcon, ArrowIcon } from "@/components/ui/Icons";

export function HeroSearchBar() {
    const router = useRouter();
    const t = useTranslations("search");
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/vysledky?q=${encodeURIComponent(query.trim())}`);
        } else {
            router.push("/vysledky");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        // Navigate immediately when typing (instant search behavior)
        if (value.length >= 2) {
            // Debounce navigation to avoid too many URL updates
            const timeout = setTimeout(() => {
                router.push(`/vysledky?q=${encodeURIComponent(value.trim())}`);
            }, 300);
            return () => clearTimeout(timeout);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div
                className={`relative flex items-center gap-3 p-2 rounded-2xl border-2 transition-all duration-300 bg-white shadow-2xl ${isFocused
                    ? "border-accent shadow-accent/20"
                    : "border-border hover:border-accent/50"
                    }`}
            >
                {/* Search Icon */}
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-blue-600 text-white shrink-0">
                    <SearchIcon className="w-7 h-7" />
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    id="hero-search-input"
                    name="q"
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={t("placeholder") || "Škoda Octavia, BMW, Audi A4..."}
                    className="flex-1 text-lg md:text-xl font-medium text-primary placeholder:text-secondary/60 bg-transparent focus:outline-none py-3"
                    autoComplete="off"
                />

                {/* Clear button */}
                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="p-2 rounded-full hover:bg-surface transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-secondary" />
                    </button>
                )}

                {/* Search Button */}
                <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-blue-600 text-white font-bold hover:from-accent-hover hover:to-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                    <span className="hidden sm:inline">{t("search")}</span>
                    <ArrowIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Quick suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-sm text-secondary">Populárne:</span>
                {["Škoda Octavia", "BMW", "Audi A4", "Mercedes", "VW Golf"].map((suggestion) => (
                    <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                            setQuery(suggestion);
                            router.push(`/vysledky?q=${encodeURIComponent(suggestion)}`);
                        }}
                        className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </form>
    );
}
