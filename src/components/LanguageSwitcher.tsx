"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { ChevronDownIcon } from "@/components/ui/Icons";

function SlovakFlag({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <div className={cn("relative flex-shrink-0", className)}>
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

function UKFlag({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <div className={cn("relative flex-shrink-0", className)}>
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

function HungarianFlag({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <div className={cn("relative flex-shrink-0", className)}>
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

const FlagComponents: Record<
  Locale,
  React.ComponentType<{ className?: string }>
> = {
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

  useEffect(() => {
    const localeCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE="))
      ?.split("=")[1];

    if (localeCookie && locales.includes(localeCookie as Locale)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initializing from cookie on mount
      setCurrentLocale(localeCookie as Locale);
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocaleChange = useCallback(
    (locale: Locale) => {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
      setCurrentLocale(locale);
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    },
    [router],
  );

  const CurrentFlag = FlagComponents[currentLocale];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 border border-border rounded-md bg-white hover:bg-background-secondary transition-colors text-sm",
          isPending && "opacity-70",
        )}
      >
        <CurrentFlag className="w-4 h-3 object-cover" />
        <span className="font-medium text-text-primary uppercase">
          {currentLocale}
        </span>
        <ChevronDownIcon
          className={cn(
            "w-3.5 h-3.5 text-text-tertiary transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-border rounded-md shadow-lg z-[100] overflow-hidden">
          {locales.map((locale) => {
            const Flag = FlagComponents[locale];
            const isActive = currentLocale === locale;
            return (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-background-secondary text-text-primary"
                    : "text-text-secondary hover:bg-background-secondary",
                )}
              >
                <Flag className="w-4 h-3 object-cover shrink-0" />
                <span className="font-medium flex-1">
                  {localeNames[locale]}
                </span>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
