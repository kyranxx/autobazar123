"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { locales, type Locale } from "@/i18n/config";

const LOCALE_FLAGS: Record<Locale, { src: string }> = {
  sk: { src: "/flags/sk.svg" },
  en: { src: "/flags/en.svg" },
  hu: { src: "/flags/hu.svg" },
};

type LocaleNameKey = "localeNames.sk" | "localeNames.en" | "localeNames.hu";
type LocaleFlagKey = "localeFlags.sk" | "localeFlags.en" | "localeFlags.hu";

function localeNameKey(locale: Locale): LocaleNameKey {
  return `localeNames.${locale}` as LocaleNameKey;
}

function localeFlagKey(locale: Locale): LocaleFlagKey {
  return `localeFlags.${locale}` as LocaleFlagKey;
}

function applyLocalePreference(nextLocale: Locale, refresh: () => void) {
  if (typeof document !== "undefined") {
    document.cookie = `NEXT_LOCALE=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  refresh();
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
  const t = useTranslations("languageSwitcher");
  const router = useRouter();
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

  const selectLocale = (nextLocale: Locale) => {
    if (!locales.includes(nextLocale)) return;
    setSelectedLocale(nextLocale);
    setIsOpen(false);
    applyLocalePreference(nextLocale, () => router.refresh());
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
        aria-label={t("ariaLabel")}
        aria-expanded={isOpen}
      >
        <Image
          src={LOCALE_FLAGS[selectedLocale].src}
          alt={t(localeFlagKey(selectedLocale))}
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
          {locales.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectLocale(value)}
              className={cn(
                "flex h-8 w-10 items-center justify-center rounded-[4px] border transition-colors",
                selectedLocale === value
                  ? "border-accent bg-accent/15"
                  : "border-transparent hover:bg-background-tertiary",
              )}
              aria-label={t(localeNameKey(value))}
              title={t(localeNameKey(value))}
            >
              <Image
                src={LOCALE_FLAGS[value].src}
                alt={t(localeFlagKey(value))}
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
