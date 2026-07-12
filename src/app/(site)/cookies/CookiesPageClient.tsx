"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import {
  MarketplaceArticleCard,
  MarketplaceBadge,
  MarketplaceContainer,
  MarketplaceHero,
  MarketplacePageShell,
  MarketplaceSection,
} from "@/components/ui/MarketplacePage";
import type { BreadcrumbTrailItem } from "@/lib/seo/breadcrumbs";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_CHANGED_EVENT,
  DEFAULT_COOKIE_CONSENT,
  parseCookieConsent,
  type CookieConsent,
} from "@/lib/privacy/cookie-consent";

type CookieToggleKey = "analytics" | "marketing";

type CookieCategory = {
  key: CookieToggleKey | "necessary";
  title: string;
  description: string;
  required: boolean;
};

function getCookiePageCopy(locale: string): {
  heroEyebrow: string;
  title: string;
  description: string;
  categoriesTitle: string;
  requiredBadge: string;
  retentionTitle: string;
  retentionItems: string[];
  privacyPrefix: string;
  privacyLink: string;
  save: string;
  reject: string;
  accept: string;
  saved: string;
  categories: CookieCategory[];
} {
  if (locale.startsWith("ro")) {
    return {
      heroEyebrow: "Centru confidențialitate",
      title: "Setări cookie",
      description:
        "Aici gestionezi consimțământul pentru cookie-urile opționale. Cookie-urile necesare sunt mereu active, pentru că fără ele platforma nu poate funcționa sigur.",
      categoriesTitle: "Categorii de cookie-uri",
      requiredBadge: "Obligatoriu",
      retentionTitle: "Cât timp păstrăm cookie-urile",
      retentionItems: [
        "Cookie-uri necesare: pe durata sesiunii sau maximum 12 luni.",
        "Cookie-uri analitice: în mod normal până la 14 luni.",
        "Cookie-uri de marketing: în mod normal până la 13 luni.",
      ],
      privacyPrefix:
        "Informații detaliate despre prelucrarea datelor personale sunt pe pagina",
      privacyLink: "Politica de confidențialitate",
      save: "Salvează selecția",
      reject: "Respinge opționalele",
      accept: "Acceptă tot",
      saved: "Setările cookie au fost salvate.",
      categories: [
        {
          key: "necessary",
          title: "Cookie-uri necesare",
          description:
            "Necesare pentru autentificare, securitate, menținerea sesiunii și funcționarea de bază a site-ului.",
          required: true,
        },
        {
          key: "analytics",
          title: "Cookie-uri analitice",
          description:
            "Ajută la măsurarea performanței site-ului, identificarea erorilor și îmbunătățirea experienței.",
          required: false,
        },
        {
          key: "marketing",
          title: "Cookie-uri de marketing",
          description:
            "Permit personalizarea campaniilor, măsurarea rezultatelor și limitarea reclamelor repetitive.",
          required: false,
        },
      ],
    };
  }

  return {
    heroEyebrow: "Privacy center",
    title: "Nastavenia cookies",
    description:
      "Tu spravujete súhlas s nepovinnými cookies. Nevyhnutné cookies sú aktívne vždy, pretože bez nich platforma nemôže spoľahlivo fungovať.",
    categoriesTitle: "Kategórie cookies",
    requiredBadge: "Povinné",
    retentionTitle: "Ako dlho cookies uchovávame",
    retentionItems: [
      "Nevyhnutné cookies: počas relácie alebo maximálne 12 mesiacov.",
      "Analytické cookies: štandardne do 14 mesiacov.",
      "Marketingové cookies: štandardne do 13 mesiacov.",
    ],
    privacyPrefix:
      "Detailné informácie o spracovaní osobných údajov sú na stránke",
    privacyLink: "Ochrana osobných údajov",
    save: "Uložiť výber",
    reject: "Odmietnuť voliteľné",
    accept: "Prijať všetko",
    saved: "Nastavenia cookies boli úspešne uložené.",
    categories: [
      {
        key: "necessary",
        title: "Nevyhnutné cookies",
        description:
          "Nutné pre prihlásenie, bezpečnosť, udržanie relácie a základné fungovanie stránky.",
        required: true,
      },
      {
        key: "analytics",
        title: "Analytické cookies",
        description:
          "Pomáhajú merať výkon webu, odhaľovať chyby a zlepšovať používateľský zážitok.",
        required: false,
      },
      {
        key: "marketing",
        title: "Marketingové cookies",
        description:
          "Umožňujú personalizovať kampane, merať ich úspešnosť a obmedziť opakované reklamy.",
        required: false,
      },
    ],
  };
}

function loadStoredConsent(): CookieConsent {
  if (typeof window === "undefined") {
    return DEFAULT_COOKIE_CONSENT;
  }

  return parseCookieConsent(localStorage.getItem(COOKIE_CONSENT_KEY)) || DEFAULT_COOKIE_CONSENT;
}

export default function CookiesPage({
  breadcrumbItems,
}: {
  breadcrumbItems: BreadcrumbTrailItem[];
}) {
  const locale = useLocale();
  const copy = getCookiePageCopy(locale);
  const [consent, setConsent] = useState<CookieConsent>(() => loadStoredConsent());
  const [saved, setSaved] = useState(false);

  const saveConsent = (next: CookieConsent) => {
    const payload = { ...next, timestamp: Date.now() };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, {
        detail: payload,
      }),
    );
    setConsent(payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setToggle = (key: CookieToggleKey, value: boolean) => {
    setConsent((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: 0,
    });
  };

  const rejectOptional = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: 0,
    });
  };

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          eyebrow={copy.heroEyebrow}
          title={copy.title}
          description={copy.description}
          breadcrumbs={<BreadcrumbTrail items={breadcrumbItems} />}
        />

        <MarketplaceSection title={copy.categoriesTitle}>
          <div className="space-y-4">
            {copy.categories.map((category) => {
              const toggleKey = category.key as CookieToggleKey;
              const enabled = category.required || consent[toggleKey];

              return (
                <MarketplaceArticleCard key={category.key}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-primary">{category.title}</h2>
                        {category.required ? (
                          <MarketplaceBadge>{copy.requiredBadge}</MarketplaceBadge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-secondary">
                        {category.description}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <button
                        type="button"
                        disabled={category.required}
                        aria-label={category.title}
                        aria-pressed={enabled}
                        onClick={() => {
                          if (category.required) return;
                          setToggle(toggleKey, !consent[toggleKey]);
                        }}
                        className={`flex h-8 w-14 items-center rounded-full border px-1 transition-colors ${
                          enabled
                            ? "justify-end border-accent bg-accent"
                            : "justify-start border-border bg-background-muted"
                        } ${category.required ? "opacity-70" : ""}`}
                      >
                        <span className="size-6 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </div>
                </MarketplaceArticleCard>
              );
            })}
          </div>
        </MarketplaceSection>

        <MarketplaceArticleCard>
          <h2 className="text-lg font-semibold text-primary">{copy.retentionTitle}</h2>
          <div className="market-readable">
            <ul className="list-disc">
              {copy.retentionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              {copy.privacyPrefix}{" "}
              <Link
                href="/ochrana-udajov"
                className="font-medium text-primary underline underline-offset-4 hover:text-accent"
              >
                {copy.privacyLink}
              </Link>
              .
            </p>
          </div>
        </MarketplaceArticleCard>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => saveConsent(consent)}
            className="market-action-secondary"
          >
            {copy.save}
          </button>
          <button type="button" onClick={rejectOptional} className="market-action-secondary">
            {copy.reject}
          </button>
          <button type="button" onClick={acceptAll} className="market-action-primary">
            {copy.accept}
          </button>
        </div>

        {saved ? (
          <p className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-primary">
            {copy.saved}
          </p>
        ) : null}
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}
