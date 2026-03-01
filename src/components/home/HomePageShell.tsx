import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import FeaturedCars from "@/components/FeaturedCars";
import RecentlySoldFeed from "@/components/RecentlySoldFeed";
import HomeSearchFormClient from "@/components/home/HomeSearchFormClient";
import { HOME_THEME, withAlpha } from "@/components/home/theme";

export default function HomePageShell() {
  const vars = {
    "--home-brand": HOME_THEME.brand,
    "--home-link": HOME_THEME.link,
    "--home-cta": HOME_THEME.cta,
    "--home-cta-text": HOME_THEME.ctaText,
    "--home-soft-surface": HOME_THEME.softSurface,
    "--home-dark-surface": HOME_THEME.darkSurface,
    "--home-brand-soft": withAlpha(HOME_THEME.brand, 0.12),
  } as CSSProperties;

  return (
    <div style={vars} className="bg-[var(--home-soft-surface)] text-text-primary">
      <main>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
          <section className="relative overflow-hidden rounded-[36px] bg-[var(--home-dark-surface)] text-white shadow-xl">
            <Image
              src="/hero-forest-champagne.jpg"
              alt="SUV at sunset"
              fill
              className="object-cover"
              style={{ objectPosition: "center 58%" }}
              priority
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(120deg, ${withAlpha(HOME_THEME.brand, 0.74)} 0%, rgba(10,10,10,0.58) 54%, ${withAlpha(HOME_THEME.cta, 0.28)} 100%)`,
              }}
            />
            <div className="relative z-10 p-6 sm:p-10 lg:p-12">
              <span className="inline-flex rounded-full bg-[var(--home-brand-soft)] px-3 py-1 text-xs font-bold tracking-[0.04em]">
                Rýchle hľadanie
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                Nájdite svoje ďalšie auto za pár sekúnd.
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-white/85 sm:text-base">
                Kľúčové filtre sú hore. Ostatné nájdete v rozšírených filtroch.
              </p>

              <HomeSearchFormClient />
            </div>
          </section>

          <section className="mt-10 sm:mt-12">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.08em] text-[var(--home-link)]">
                  Odporúčané inzeráty
                </p>
                <h2 className="mt-2 text-3xl font-display font-semibold text-text-primary sm:text-4xl">
                  Vybrané autá
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
