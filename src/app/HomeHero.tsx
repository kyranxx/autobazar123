"use client";

import { useTranslations } from "next-intl";
import { HeroSearchBar } from "@/components/AlgoliaInstantSearch";
import LifestyleCategories from "@/components/LifestyleCategories";
import ActiveAdsCount from "@/components/ActiveAdsCount";

export default function HomeHero() {
    const t = useTranslations("hero");
    const tTrust = useTranslations("trust");

    return (
        <>
            {/* Hero Section */}
            <section className="relative pt-24 pb-12 sm:pt-28 sm:pb-16 bg-gradient-to-b from-accent-subtle to-background">
                {/* Background gradient decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-gradient-to-br from-accent/10 via-accent/5 to-transparent rounded-full blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Badge */}
                    <div className="flex justify-center mb-5">
                        <ActiveAdsCount />
                    </div>

                    {/* Headline */}
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl">
                            {t("title")}
                            <br />
                            <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
                                {t("titleHighlight")}
                            </span>
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-secondary sm:text-xl">
                            {t("subtitle")}
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="mx-auto mt-8 max-w-4xl">
                        <HeroSearchBar />
                    </div>

                    {/* Trust Signals */}
                    <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
                        <TrustSignal icon={<ShieldIcon />} text={tTrust("verifiedDealers")} />
                        <TrustSignal icon={<ClockIcon />} text={tTrust("instantPublish")} />
                        <TrustSignal icon={<CheckCircleIcon />} text={tTrust("securePayments")} />
                        <TrustSignal icon={<StarIcon />} text={tTrust("premiumQuality")} />
                    </div>
                </div>
            </section>

            {/* Lifestyle Categories */}
            <section className="py-10 sm:py-14 bg-surface border-y border-border">
                <LifestyleCategories />
            </section>
        </>
    );
}

// Helper Components
function TrustSignal({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-secondary">
            <span className="text-accent">{icon}</span>
            <span>{text}</span>
        </div>
    );
}

// Icons
function ShieldIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function StarIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    );
}
