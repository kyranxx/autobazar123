"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";
import { locales, type Locale } from "@/i18n/config";

const LOCALE_FLAGS: Record<Locale, { src: string }> = {
  sk: { src: "/flags/sk.svg" },
  en: { src: "/flags/en.svg" },
  hu: { src: "/flags/hu.svg" },
};

const LOCALE_CODES: Record<Locale, string> = {
  sk: "SK",
  en: "EN",
  hu: "HU",
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
  flagsOnly = false,
}: {
  compact?: boolean;
  className?: string;
  tone?: "default" | "inverted";
  flagsOnly?: boolean;
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

  const alternateLocales = locales.filter((value) => value !== selectedLocale);

  const triggerBaseClasses = flagsOnly
    ? "inline-flex h-9 w-11 items-center justify-center rounded-[10px] px-0 text-sm"
    : compact
    ? "inline-flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm"
    : "inline-flex h-10 items-center justify-between gap-2 rounded-full px-2.5 text-sm";

  const triggerToneClasses =
    tone === "inverted"
      ? "border border-white/22 bg-[#0d6c40] text-white shadow-[0_10px_24px_-18px_rgba(0,0,0,0.45)] hover:bg-[#0f7747] focus:ring-white/45"
      : "border border-border-subtle bg-background-secondary text-text-primary hover:bg-background-tertiary focus:ring-accent/30";

  const menuPanelClasses = compact ? "left-0 right-0" : "right-0";

  if (flagsOnly) {
    const closedWidth = 44;
    const openWidth = closedWidth + alternateLocales.length * 36;

    return (
      <div
        className={cn("relative flex h-9 items-center justify-end overflow-hidden", className)}
        ref={menuRef}
        style={{
          width: `${isOpen ? openWidth : closedWidth}px`,
          transition: "width 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="absolute right-0 top-0 flex h-9 flex-row-reverse items-center gap-1">
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="relative z-20 inline-flex h-9 w-11 items-center justify-center rounded-[10px] bg-[#0d6c40] text-white shadow-[0_10px_24px_-18px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#0f7747] focus:outline-none focus:ring-2 focus:ring-white/45"
            aria-label={t("ariaLabel")}
            aria-expanded={isOpen}
          >
            <span className="overflow-hidden rounded-[4px] shadow-[0_1px_0_rgba(255,255,255,0.18)]">
              <Image
                src={LOCALE_FLAGS[selectedLocale].src}
                alt={t(localeFlagKey(selectedLocale))}
                width={24}
                height={16}
                loading="eager"
                className="h-4 w-6 object-cover"
              />
            </span>
          </button>

          {alternateLocales.map((value, index) => (
            <button
              key={value}
              type="button"
              onClick={() => selectLocale(value)}
              className={cn(
                "inline-flex h-9 w-11 items-center justify-center rounded-[10px] bg-[#0d6c40] text-white shadow-[0_10px_24px_-18px_rgba(0,0,0,0.45)] transition-[transform,opacity,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:bg-[#0f7747] focus:outline-none focus:ring-2 focus:ring-white/45",
                isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
              )}
              style={{
                transform: isOpen ? "translateX(0px)" : "translateX(12px)",
                transitionDelay: isOpen ? `${index * 45}ms` : `${(alternateLocales.length - index - 1) * 35}ms`,
              }}
              aria-label={t(localeNameKey(value))}
              title={t(localeNameKey(value))}
            >
              <span className="overflow-hidden rounded-[4px] shadow-[0_1px_0_rgba(255,255,255,0.18)]">
                <Image
                  src={LOCALE_FLAGS[value].src}
                  alt={t(localeFlagKey(value))}
                  width={22}
                  height={15}
                  className="h-[15px] w-[22px] object-cover"
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={cn(
          triggerBaseClasses,
          triggerToneClasses,
          "focus:outline-none focus:ring-2",
        )}
        aria-label={t("ariaLabel")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2">
          <span className="overflow-hidden rounded-[4px] shadow-[0_1px_0_rgba(255,255,255,0.18)]">
            <Image
              src={LOCALE_FLAGS[selectedLocale].src}
              alt={t(localeFlagKey(selectedLocale))}
              width={24}
              height={16}
              loading="eager"
              className="h-4 w-6 object-cover"
            />
          </span>
          <span
            className={cn(
              "font-semibold tracking-[0.12em]",
              compact ? "text-xs" : "text-[11px]",
            )}
          >
            {compact ? t(localeNameKey(selectedLocale)) : LOCALE_CODES[selectedLocale]}
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          menuPanelClasses,
          "absolute top-full z-[160] mt-2 rounded-2xl border p-1.5 shadow-xl",
          tone === "inverted"
            ? "border-white/14 bg-[#0b5131] text-white"
            : "border-border-subtle bg-background-secondary text-text-primary",
          "origin-top-right transition-all duration-150",
          isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
        )}
        role="listbox"
      >
        <div className="flex flex-col gap-1">
          {locales.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectLocale(value)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors",
                selectedLocale === value
                  ? tone === "inverted"
                    ? "bg-[#126e43] text-white"
                    : "bg-accent/10 text-text-primary"
                  : tone === "inverted"
                    ? "text-white/88 hover:bg-[#0f623b]"
                    : "text-text-secondary hover:bg-background-tertiary hover:text-text-primary",
              )}
              aria-label={t(localeNameKey(value))}
              title={t(localeNameKey(value))}
              role="option"
              aria-selected={selectedLocale === value}
            >
              <span className="flex items-center gap-2.5">
                <span className="overflow-hidden rounded-[4px] shadow-[0_1px_0_rgba(255,255,255,0.18)]">
                  <Image
                    src={LOCALE_FLAGS[value].src}
                    alt={t(localeFlagKey(value))}
                    width={22}
                    height={15}
                    className="h-[15px] w-[22px] object-cover"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold tracking-[0.12em]">
                    {LOCALE_CODES[value]}
                  </span>
                  <span
                    className={cn(
                      "block text-xs",
                      tone === "inverted" ? "text-white/72" : "text-text-muted",
                    )}
                  >
                    {t(localeNameKey(value))}
                  </span>
                </span>
              </span>
              {selectedLocale === value ? (
                <CheckIcon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    tone === "inverted" ? "text-white" : "text-accent",
                  )}
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
