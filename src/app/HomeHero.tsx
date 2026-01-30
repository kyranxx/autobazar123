"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import ActiveAdsCount from "@/components/ActiveAdsCount";
import HomeSearchFilters from "@/components/HomeSearchFilters";

export default function HomeHero() {
    const t = useTranslations("hero");

    return (
        <section className="section-hero relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-background" />
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-70" />
            <div className="absolute top-24 -left-24 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-60" />
            <div className="container-main relative">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="badge badge-accent mb-6 mx-auto">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <ActiveAdsCount />
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-text-primary mb-4 text-balance">
                        {t("title")}
                    </h1>
                    <p className="text-base sm:text-lg text-text-secondary mb-8 sm:mb-10 max-w-2xl mx-auto">
                        Moderný bazár áut pre náročných. Overení predajcovia, preverené vozidlá,
                        rýchly a bezpečný proces nákupu aj predaja.
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                        <Link href="/auta" className="btn-primary w-full sm:w-auto">
                            Prehľadať ponuku
                        </Link>
                        <Link href="/pridat-inzerat" className="btn-secondary w-full sm:w-auto">
                            Pridať inzerát zdarma
                        </Link>
                    </div>

                    {/* Search box */}
                    <div className="glass rounded-2xl p-2 sm:p-3 border border-border shadow-sm">
                        <HomeSearchFilters />
                    </div>

                    {/* Trust microcopy */}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-text-tertiary">
                        <span className="badge">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            Overení predajcovia
                        </span>
                        <span className="badge">Ochrana kupujúceho</span>
                        <span className="badge">Financovanie dostupné</span>
                    </div>

                    {/* Quick stats */}
                    <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                        <Stat value="50k+" label="Aktívnych inzerátov" />
                        <Stat value="10k+" label="Spokojných zákazníkov" />
                        <Stat value="500+" label="Overených predajcov" />
                    </div>
                </div>
            </div>
        </section>
    );
}

function Stat({ value, label }: { value: string; label: string }) {
    return (
        <div className="text-center card card-hover py-4 px-4 sm:px-6 bg-white/80">
            <div className="text-xl sm:text-2xl md:text-3xl font-display font-semibold text-text-primary">
                {value}
            </div>
            <div className="text-xs sm:text-sm text-text-tertiary mt-1">
                {label}
            </div>
        </div>
    );
}
