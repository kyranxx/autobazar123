"use client";

import { useTranslations } from "next-intl";
import LifestyleCategories from "@/components/LifestyleCategories";
import ActiveAdsCount from "@/components/ActiveAdsCount";
import HomeSearchFilters from "@/components/HomeSearchFilters";

export default function HomeHero() {
    const t = useTranslations("hero");
    const tTrust = useTranslations("trust");

    return (
        <>
            {/* Hero Section - BOLD DARK THEME */}
            <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden bg-background">
                {/* Dramatic Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Large lime glow */}
                    <div className="absolute w-[800px] h-[800px] -top-40 left-1/2 -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
                    {/* Secondary orange glow */}
                    <div className="absolute w-[400px] h-[400px] top-1/2 -right-20 rounded-full opacity-30 blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.4) 0%, transparent 70%)' }} />
                    {/* Grid overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(196,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(196,255,0,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Badge */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-6">
                            <ActiveAdsCount />
                        </div>

                        {/* Main Headline - BOLD */}
                        <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-6">
                            <span className="text-primary">{t("title")}</span>{" "}
                            <span className="text-accent">{t("titleHighlight")}</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl text-secondary max-w-2xl mx-auto mb-2">
                            Nájdite svoje vysnívané auto medzi tisíckami overených ponúk
                        </p>
                    </div>

                    {/* Search Card - Dark Glass */}
                    <div className="mx-auto max-w-5xl mb-12">
                        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-border p-4 sm:p-6 shadow-xl">
                            <HomeSearchFilters />
                        </div>
                    </div>

                    {/* Trust Signals - Vibrant */}
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                        <TrustBadge icon={<ShieldIcon />} text={tTrust("verifiedDealers")} />
                        <TrustBadge icon={<ClockIcon />} text={tTrust("instantPublish")} />
                        <TrustBadge icon={<CheckCircleIcon />} text={tTrust("securePayments")} />
                        <TrustBadge icon={<StarIcon />} text={tTrust("premiumQuality")} />
                    </div>
                </div>
            </section>

            {/* Categories - Dark Section */}
            <section className="py-12 sm:py-16 bg-surface border-y border-border">
                <LifestyleCategories />
            </section>
        </>
    );
}

// Trust Badge Component - Vibrant lime accent
function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface border border-border hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 group cursor-default">
            <span className="text-accent group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-sm font-semibold text-primary">{text}</span>
        </div>
    );
}

// Icons with bolder stroke
function ShieldIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function StarIcon() {
    return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    );
}

