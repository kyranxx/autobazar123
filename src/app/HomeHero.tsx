"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import ActiveAdsCount from "@/components/ActiveAdsCount";
import HomeSearchFilters from "@/components/HomeSearchFilters";

export default function HomeHero() {
    const t = useTranslations("hero");

    return (
        <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 bg-white">
            <div className="container-main">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-background-secondary border border-border">
                        <ActiveAdsCount />
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-text-primary mb-4">
                        {t("title")}
                    </h1>
                    <p className="text-base sm:text-lg text-text-secondary mb-8 sm:mb-12 max-w-xl mx-auto">
                        Moderný bazár áut pre náročných. Overení predajcovia, preverené vozidlá.
                    </p>

                    {/* Search box */}
                    <div className="bg-background-secondary rounded-xl p-2 sm:p-3 border border-border">
                        <HomeSearchFilters />
                    </div>

                    {/* Quick stats */}
                    <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-8">
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
        <div className="text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-display font-semibold text-text-primary">
                {value}
            </div>
            <div className="text-xs sm:text-sm text-text-tertiary mt-1">
                {label}
            </div>
        </div>
    );
}
