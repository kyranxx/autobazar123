"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Note: metadata must be in a separate server component or layout for client components
// For now, this will work as a client component for the interactive cookie settings

export default function CookiesPage() {
  const defaultPrefs = {
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  };

  const [preferences, setPreferences] = useState(defaultPrefs);
  useEffect(() => {
    const savedPrefs = localStorage.getItem("cookiePreferences");
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);

        setPreferences({ ...defaultPrefs, ...parsed });
      } catch {
        setPreferences(defaultPrefs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaultPrefs is stable
  }, []);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("cookiePreferences", JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem("cookiePreferences", JSON.stringify(allAccepted));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-20 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="py-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl md:text-5xl">
              Nastavenia cookies
            </h1>
            <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
              Upravte si, akĂ© cookies mĂ´Ĺľeme pouĹľĂ­vaĹĄ na zlepĹˇenie vaĹˇej
              skĂşsenosti
            </p>
          </div>

          {/* Cookie Settings */}
          <div className="space-y-6">
            {/* Necessary */}
            <div className="p-6 rounded-2xl border border-border bg-background">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-primary">
                      NevyhnutnĂ© cookies
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                      PovinnĂ©
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-secondary">
                    Tieto cookies sĂş nevyhnutnĂ© pre fungovanie webovej strĂˇnky a
                    nemĂ´Ĺľu byĹĄ vypnutĂ©. ZahĹ•ĹajĂş naprĂ­klad cookies pre
                    prihlĂˇsenie, bezpeÄŤnosĹĄ a zĂˇkladnĂş funkcionalitu.
                  </p>
                </div>
                <div className="shrink-0">
                  <div className="w-12 h-7 rounded-full bg-accent/20 flex items-center justify-end px-1 cursor-not-allowed opacity-70">
                    <div className="w-5 h-5 rounded-full bg-accent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="p-6 rounded-2xl border border-border bg-background">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary">
                    AnalytickĂ© cookies
                  </h3>
                  <p className="mt-2 text-sm text-secondary">
                    Tieto cookies nĂˇm pomĂˇhajĂş pochopiĹĄ, ako nĂˇvĹˇtevnĂ­ci
                    pouĹľĂ­vajĂş naĹˇu strĂˇnku. ZbierajĂş anonymnĂ© Ăşdaje o poÄŤte
                    nĂˇvĹˇtev, zdrojoch nĂˇvĹˇtevnosti a sprĂˇvanĂ­ pouĹľĂ­vateÄľov.
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    aria-label={
                      preferences.analytics
                        ? "Vypnut analyticke cookies"
                        : "Zapnut analyticke cookies"
                    }
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        analytics: !preferences.analytics,
                      })
                    }
                    className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                      preferences.analytics
                        ? "bg-accent justify-end"
                        : "bg-surface justify-start"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full transition-colors ${preferences.analytics ? "bg-white" : "bg-tertiary"}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div className="p-6 rounded-2xl border border-border bg-background">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary">
                    MarketingovĂ© cookies
                  </h3>
                  <p className="mt-2 text-sm text-secondary">
                    Tieto cookies pouĹľĂ­vame na zobrazovanie relevantnĂ˝ch reklĂˇm
                    na naĹˇej strĂˇnke aj mimo nej. PomĂˇhajĂş nĂˇm meraĹĄ ĂşÄŤinnosĹĄ
                    reklamnĂ˝ch kampanĂ­.
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    aria-label={
                      preferences.marketing
                        ? "Vypnut marketingove cookies"
                        : "Zapnut marketingove cookies"
                    }
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        marketing: !preferences.marketing,
                      })
                    }
                    className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                      preferences.marketing
                        ? "bg-accent justify-end"
                        : "bg-surface justify-start"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full transition-colors ${preferences.marketing ? "bg-white" : "bg-tertiary"}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="p-6 rounded-2xl border border-border bg-background">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary">
                    PreferenÄŤnĂ© cookies
                  </h3>
                  <p className="mt-2 text-sm text-secondary">
                    Tieto cookies si pamĂ¤tajĂş vaĹˇe nastavenia a preferencie, ako
                    naprĂ­klad jazykovĂ© nastavenia alebo zobrazenie strĂˇnky, aby
                    ste mali pri ÄŹalĹˇej nĂˇvĹˇteve lepĹˇĂ­ zĂˇĹľitok.
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    aria-label={
                      preferences.preferences
                        ? "Vypnut preferencne cookies"
                        : "Zapnut preferencne cookies"
                    }
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        preferences: !preferences.preferences,
                      })
                    }
                    className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                      preferences.preferences
                        ? "bg-accent justify-end"
                        : "bg-surface justify-start"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full transition-colors ${preferences.preferences ? "bg-white" : "bg-tertiary"}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 rounded-full border border-border text-primary font-semibold hover:bg-surface transition-colors"
              >
                UloĹľiĹĄ mĂ´j vĂ˝ber
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
              >
                PrijaĹĄ vĹˇetky
              </button>
            </div>

            {saved && (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-center">
                âś“ VaĹˇe nastavenia boli uloĹľenĂ©
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-6 rounded-2xl border border-border bg-surface/30">
            <h2 className="text-lg font-semibold text-primary mb-4">
              ÄŚo sĂş cookies?
            </h2>
            <p className="text-sm text-secondary leading-relaxed">
              Cookies sĂş malĂ© textovĂ© sĂşbory, ktorĂ© webovĂ© strĂˇnky ukladajĂş do
              vĂˇĹˇho prehliadaÄŤa. PomĂˇhajĂş nĂˇm zapamĂ¤taĹĄ si vaĹˇe nastavenia,
              analyzovaĹĄ nĂˇvĹˇtevnosĹĄ a zlepĹˇovaĹĄ vaĹˇe skĂşsenosti na naĹˇej
              strĂˇnke. Viac informĂˇciĂ­ nĂˇjdete v naĹˇej{" "}
              <Link
                href="/ochrana-udajov"
                className="text-accent hover:underline"
              >
                politike ochrany osobnĂ˝ch Ăşdajov
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

