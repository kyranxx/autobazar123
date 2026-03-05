import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import FeaturedCars from "@/components/FeaturedCars";
import RecentlySoldFeed from "@/components/RecentlySoldFeed";
import HomeSearchFormClient from "@/components/home/HomeSearchFormClient";
import { HOME_THEME, withAlpha } from "@/components/home/theme";
import { ShieldCheckIcon, SparklesIcon, ZapIcon } from "@/components/ui/Icons";

const HERO_STATS = [
  { value: "8 500+", label: "Aktívnych inzerátov" },
  { value: "24h", label: "Priemerná odozva predajcu" },
  { value: "97%", label: "Overených profilov" },
] as const;

const QUICK_LINKS = [
  { title: "Rodinné SUV", href: "/vysledky?bodyStyle=suv", detail: "Bezpečné a priestranné modely" },
  { title: "Mestské autá", href: "/vysledky?priceTo=10000", detail: "Kompaktná ponuka do 10 000 EUR" },
  { title: "Automaty", href: "/vysledky?transmission=automatic", detail: "Pohodlná jazda bez manuálu" },
] as const;

const BUYER_PROMISES = [
  {
    title: "Overené inzeráty",
    detail: "Kontrolujeme duplicity, podozrivé ceny a nekompletné profily.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Rýchle porovnanie",
    detail: "Vyhľadávanie je nastavené na rozhodnutie do pár minút, nie hodín.",
    icon: ZapIcon,
  },
  {
    title: "Menej hluku",
    detail: "Odporúčania sú zoradené podľa relevancie, nie náhodnej propagácie.",
    icon: SparklesIcon,
  },
] as const;

export default function HomePageShell() {
  const vars = {
    "--home-brand": HOME_THEME.brand,
    "--home-link": HOME_THEME.link,
    "--home-cta": HOME_THEME.cta,
    "--home-cta-text": HOME_THEME.ctaText,
    "--home-soft-surface": HOME_THEME.softSurface,
    "--home-dark-surface": HOME_THEME.darkSurface,
    "--home-brand-soft": withAlpha(HOME_THEME.brand, 0.14),
  } as CSSProperties;

  return (
    <div style={vars} className="relative isolate overflow-hidden bg-[var(--home-soft-surface)] text-text-primary">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-28 left-[8%] h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: withAlpha(HOME_THEME.brand, 0.18) }}
        />
        <div
          className="absolute right-[4%] top-24 h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: withAlpha(HOME_THEME.cta, 0.16) }}
        />
      </div>

      <main className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:pb-16 lg:pt-12">
          <section className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="relative overflow-hidden rounded-[34px] border border-white/25 bg-[var(--home-dark-surface)] text-white shadow-xl">
              <Image
                src="/hero-forest-champagne.jpg"
                alt="SUV on road at sunset"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
                style={{ objectPosition: "center 58%" }}
                priority
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(122deg, ${withAlpha(HOME_THEME.darkSurface, 0.86)} 0%, ${withAlpha(HOME_THEME.brand, 0.76)} 48%, ${withAlpha(HOME_THEME.cta, 0.45)} 100%)`,
                }}
              />

              <div className="relative z-10 p-6 sm:p-10 lg:p-12">
                <p className="inline-flex items-center rounded-full border border-white/30 bg-white/12 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/95">
                  Marketplace pre rozhodnutie bez stresu
                </p>
                <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
                  Nájdite auto, ktoré sedí vášmu životu.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-white/86 sm:text-lg">
                  Vyhľadávanie, porovnanie a overenie ponúk na jednom mieste. Rýchlo sa dostanete k reálnym inzerátom bez zbytočného hluku.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {HERO_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/20 bg-black/16 px-4 py-3 backdrop-blur-sm"
                    >
                      <p className="text-2xl font-black leading-tight text-white">{stat.value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-white/78">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/vysledky"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--home-cta)] px-6 py-3 text-sm font-black text-[var(--home-cta-text)] shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Pozrieť ponuku
                  </Link>
                  <Link
                    href="/moj-ucet?tab=create"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/34 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/16"
                  >
                    Pridať auto na predaj
                  </Link>
                </div>
              </div>
            </div>

            <aside className="rounded-[30px] border border-black/10 bg-white/92 p-5 shadow-lg backdrop-blur-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--home-link)]">
                Personalizované hľadanie
              </p>
              <h2 className="mt-2 text-2xl font-display font-semibold text-text-primary sm:text-3xl">
                Nájdite ideálne auto do 30 sekúnd
              </h2>
              <p className="mt-2 text-sm text-text-secondary sm:text-base">
                Začnite značkou, modelom alebo mestom. Filter sa prispôsobí tomu, čo hľadáte.
              </p>

              <HomeSearchFormClient className="mt-5 border-black/10 bg-white/80 p-0 shadow-none sm:p-0" />
            </aside>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="rounded-3xl border border-black/10 bg-white/88 p-5 shadow-sm backdrop-blur-sm sm:p-6">
              <h2 className="text-xl font-display font-semibold text-text-primary sm:text-2xl">
                Rýchle vstupy do ponuky
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {QUICK_LINKS.map((entry) => (
                  <Link
                    key={entry.title}
                    href={entry.href}
                    className="group rounded-2xl border border-black/10 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--home-link)]/35 hover:shadow-sm"
                  >
                    <p className="text-sm font-black text-text-primary">{entry.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">{entry.detail}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-[var(--home-dark-surface)] p-5 text-white shadow-sm sm:p-6">
              <h2 className="text-xl font-display font-semibold !text-white sm:text-2xl">
                Prečo kupujúci volia Autobazar123
              </h2>
              <ul className="mt-4 space-y-3">
                {BUYER_PROMISES.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl border border-white/18 bg-white/6 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-white/90" />
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-white/78">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-10 sm:mt-12">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--home-link)]">
                  Kurátorský výber
                </p>
                <h2 className="mt-2 text-3xl font-display font-semibold text-text-primary sm:text-4xl">
                  Odporúčané inzeráty
                </h2>
              </div>
              <Link href="/vysledky" className="text-sm font-semibold text-[var(--home-link)] hover:underline">
                Zobraziť všetky
              </Link>
            </div>
            <FeaturedCars />
          </section>
        </div>

        <RecentlySoldFeed />
      </main>
    </div>
  );
}
