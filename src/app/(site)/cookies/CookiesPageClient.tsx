"use client";

import { useState } from "react";
import Link from "next/link";
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

const COOKIE_CATEGORIES: CookieCategory[] = [
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
];

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
          eyebrow="Privacy center"
          title="Nastavenia cookies"
          description="Tu spravujete súhlas s nepovinnými cookies. Nevyhnutné cookies sú aktívne vždy, pretože bez nich platforma nemôže spoľahlivo fungovať."
          breadcrumbs={<BreadcrumbTrail items={breadcrumbItems} />}
        />

        <MarketplaceSection title="Kategórie cookies">
          <div className="space-y-4">
            {COOKIE_CATEGORIES.map((category) => {
              const toggleKey = category.key as CookieToggleKey;
              const enabled = category.required || consent[toggleKey];

              return (
                <MarketplaceArticleCard key={category.key}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-primary">{category.title}</h2>
                        {category.required ? <MarketplaceBadge>Povinné</MarketplaceBadge> : null}
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
          <h2 className="text-lg font-semibold text-primary">Ako dlho cookies uchovávame</h2>
          <div className="market-readable">
            <ul className="list-disc">
              <li>Nevyhnutné cookies: počas relácie alebo maximálne 12 mesiacov.</li>
              <li>Analytické cookies: štandardne do 14 mesiacov.</li>
              <li>Marketingové cookies: štandardne do 13 mesiacov.</li>
            </ul>
            <p>
              Detailné informácie o spracovaní osobných údajov sú na stránke{" "}
              <Link
                href="/ochrana-udajov"
                className="font-medium text-primary underline underline-offset-4 hover:text-accent"
              >
                Ochrana osobných údajov
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
            Uložiť výber
          </button>
          <button type="button" onClick={rejectOptional} className="market-action-secondary">
            Odmietnuť voliteľné
          </button>
          <button type="button" onClick={acceptAll} className="market-action-primary">
            Prijať všetko
          </button>
        </div>

        {saved ? (
          <p className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-primary">
            Nastavenia cookies boli úspešne uložené.
          </p>
        ) : null}
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}
