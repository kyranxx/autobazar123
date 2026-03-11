"use client";

import { useState } from "react";
import Link from "next/link";
import {
  COOKIE_CONSENT_KEY,
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
    title: "Nevyhnutne cookies",
    description:
      "Nutne pre prihlásenie, bezpečnosť, udrzanie relacie a zakladne fungovanie stranky.",
    required: true,
  },
  {
    key: "analytics",
    title: "Analyticke cookies",
    description:
      "Pomahaju merat výkon webu, odhalovat chyby a zlepsovat pouzivatelsky zážitok.",
    required: false,
  },
  {
    key: "marketing",
    title: "Marketingove cookies",
    description:
      "Umoznuju personalizovat kampane, merat ich uspesnost a obmedzit opakovane reklamy.",
    required: false,
  },
];

function loadStoredConsent(): CookieConsent {
  if (typeof window === "undefined") {
    return DEFAULT_COOKIE_CONSENT;
  }

  return parseCookieConsent(localStorage.getItem(COOKIE_CONSENT_KEY)) || DEFAULT_COOKIE_CONSENT;
}

export default function CookiesPage() {
  const [consent, setConsent] = useState<CookieConsent>(() => loadStoredConsent());
  const [saved, setSaved] = useState(false);

  const saveConsent = (next: CookieConsent) => {
    const payload = { ...next, timestamp: Date.now() };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
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
    <main className="min-h-screen bg-background">
      <section className="pt-24 pb-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <header className="rounded-2xl border border-border bg-background p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">Privacy center</p>
            <h1 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Nastavenia cookies
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
              Tu spravujete suhlas s nepovinnymi cookies. Nevyhnutne cookies sú
              aktívne vzdy, pretoze bez nich platforma nemoze spolahlivo fungovat.
            </p>
          </header>

          <div className="mt-8 space-y-4">
            {COOKIE_CATEGORIES.map((category) => (
              <article
                key={category.key}
                className="rounded-2xl border border-border bg-background p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-primary">{category.title}</h2>
                      {category.required && (
                        <span className="rounded-full border border-border bg-background-muted px-2 py-0.5 text-xs font-semibold text-primary">
                          Povinné
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-secondary">
                      {category.description}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      disabled={category.required}
                      onClick={() => {
                        if (category.required) return;
                        const toggleKey = category.key as CookieToggleKey;
                        setToggle(toggleKey, !consent[toggleKey]);
                      }}
                      className={`flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
                        category.required || consent[category.key as CookieToggleKey]
                          ? "justify-end bg-accent"
                          : "justify-start bg-surface"
                      } ${category.required ? "cursor-not-allowed opacity-70" : ""}`}
                      aria-label={category.title}
                    >
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-primary">Ako dlho cookies uchovavame</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-secondary">
              <li>Nevyhnutne cookies: počas relacie alebo maximálne 12 mesiacov.</li>
              <li>Analyticke cookies: standardne do 14 mesiacov.</li>
              <li>Marketingove cookies: standardne do 13 mesiacov.</li>
            </ul>
            <p className="mt-3 text-sm text-secondary">
              Detailne informacie o spracovani osobnych udajov su na stranke{" "}
              <Link
                href="/ochrana-udajov"
                className="font-medium text-primary underline underline-offset-4 hover:text-accent"
              >
                Ochrana osobnych údajov
              </Link>
              .
            </p>
          </section>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => saveConsent(consent)}
              className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-background-muted"
            >
              Uložiť výber
            </button>
            <button
              type="button"
              onClick={rejectOptional}
              className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-background-muted"
            >
              Odmietnuť voliteľné
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Prijat všetko
            </button>
          </div>

          {saved && (
            <p className="mt-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-primary">
              Nastavenia cookies boli úspešne uložené.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
