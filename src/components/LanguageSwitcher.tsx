"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { cn } from "@/utils/cn";
import { locales, type Locale } from "@/i18n/config";

const LOCALE_FLAGS: Record<Locale, { src: string; alt: string }> = {
  sk: { src: "/flags/sk.svg", alt: "Slovensko" },
  en: { src: "/flags/en.svg", alt: "United Kingdom" },
  hu: { src: "/flags/hu.svg", alt: "Magyarország" },
};

const LOCALE_NAMES: Record<Locale, string> = {
  sk: "Slovenčina",
  en: "English",
  hu: "Magyar",
};

function applyLocalePreference(nextLocale: Locale) {
  if (typeof document !== "undefined") {
    document.cookie = `NEXT_LOCALE=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

function normalizeLocale(value: string): Locale {
  const candidate = value.slice(0, 2) as Locale;
  return locales.includes(candidate) ? candidate : "sk";
}

export default function LanguageSwitcher({
  compact = false,
  className,
  tone = "default",
}: {
  compact?: boolean;
  className?: string;
  tone?: "default" | "inverted";
}) {
  const locale = normalizeLocale(useLocale());
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedLocale(locale);
  }, [locale]);

  const selectLocale = (locale: Locale) => {
    if (!locales.includes(locale)) return;
    setSelectedLocale(locale);
    setIsOpen(false);
    applyLocalePreference(locale);
  };

  return (
    <div className={cn("relative flex items-center", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={cn(
          "inline-flex h-7 w-10 items-center justify-center rounded-[4px] text-sm transition-colors",
          "focus:outline-none focus:ring-2",
          tone === "inverted"
            ? "bg-transparent text-white hover:bg-white/15 focus:ring-white/45"
            : "bg-background-secondary text-text-primary hover:bg-background-tertiary focus:ring-accent/30",
          compact && "w-10",
        )}
        aria-label="Výber jazyka"
        aria-expanded={isOpen}
      >
        <Image
          src={LOCALE_FLAGS[selectedLocale].src}
          alt={LOCALE_FLAGS[selectedLocale].alt}
          width={24}
          height={16}
          className="h-4 w-6 object-cover"
        />
      </button>

      <div
        className={cn(
          "absolute right-0 top-full z-[90] mt-2 rounded-xl border border-border-subtle bg-background-secondary p-1 shadow-lg",
          "origin-top-right transition-all duration-150",
          isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
        )}
      >
        <div className="flex items-center gap-1">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => selectLocale(locale)}
              className={cn(
                "flex h-8 w-10 items-center justify-center rounded-[4px] border transition-colors",
                selectedLocale === locale
                  ? "border-accent bg-accent/15"
                  : "border-transparent hover:bg-background-tertiary",
              )}
              aria-label={LOCALE_NAMES[locale]}
              title={LOCALE_NAMES[locale]}
            >
              <Image
                src={LOCALE_FLAGS[locale].src}
                alt={LOCALE_FLAGS[locale].alt}
                width={22}
                height={15}
                className="h-[15px] w-[22px] object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
