"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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

export default function LanguageSwitcher({
  compact = false,
  className,
  tone = "default",
}: {
  compact?: boolean;
  className?: string;
  tone?: "default" | "inverted";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(() => {
    if (typeof document === "undefined") {
      return "sk";
    }

    const htmlLang = document.documentElement.lang?.slice(0, 2) as
      | Locale
      | undefined;
    if (htmlLang && locales.includes(htmlLang)) {
      return htmlLang;
    }

    const cookieMatch = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    if (!cookieMatch) {
      return "sk";
    }

    const cookieLocale = decodeURIComponent(cookieMatch[1]) as Locale;
    return locales.includes(cookieLocale) ? cookieLocale : "sk";
  });

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          "inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors",
          "focus:outline-none focus:ring-2",
          tone === "inverted"
            ? "border-white/35 bg-white/10 text-white hover:bg-white/20 focus:ring-white/45"
            : "border-border-subtle bg-background-secondary text-text-primary hover:bg-background-tertiary focus:ring-accent/30",
          compact && "w-9",
        )}
        aria-label="Výber jazyka"
        aria-expanded={isOpen}
      >
        <Image
          src={LOCALE_FLAGS[selectedLocale].src}
          alt={LOCALE_FLAGS[selectedLocale].alt}
          width={18}
          height={12}
          className="h-3 w-[18px] rounded-[2px] object-cover"
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
                "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
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
                width={18}
                height={12}
                className="h-3 w-[18px] rounded-[2px] object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
