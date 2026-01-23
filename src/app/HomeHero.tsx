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
            {/* Hero Section - Premium Redesign */}
            <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-16 overflow-hidden hero-pattern bg-gradient-hero">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Large gradient orb */}
                    <div className="deco-circle w-[600px] h-[600px] -top-32 -right-32 opacity-20" />
                    <div className="deco-circle w-[400px] h-[400px] top-1/2 -left-48 opacity-15" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' }} />

                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Badge + Title */}
                    <div className="text-center mb-8">
                        {/* Active Ads Badge */}
                        <div className="inline-flex items-center gap-2 mb-4 animate-slide-up-reveal">
                            <ActiveAdsCount />
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl animate-slide-up-reveal" style={{ animationDelay: '0.1s' }}>
                            {t("title")}{" "}
                            <span className="text-gradient-primary">
                                {t("titleHighlight")}
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto animate-slide-up-reveal" style={{ animationDelay: '0.2s' }}>
                            Nájdite svoje vysnívané auto medzi tisíckami overených ponúk
                        </p>
                    </div>

                    {/* Search Filters - Glass Card Effect */}
                    <div className="mx-auto max-w-5xl animate-slide-up-reveal" style={{ animationDelay: '0.3s' }}>
                        <div className="glass-card rounded-2xl p-2 sm:p-3 shadow-premium">
                            <HomeSearchFilters />
                        </div>
                    </div>

                    {/* Trust Signals - Enhanced with Glass Effect */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4 animate-slide-up-reveal" style={{ animationDelay: '0.4s' }}>
                        <TrustSignal icon={<ShieldIcon />} text={tTrust("verifiedDealers")} />
                        <TrustSignal icon={<ClockIcon />} text={tTrust("instantPublish")} />
                        <TrustSignal icon={<CheckCircleIcon />} text={tTrust("securePayments")} />
                        <TrustSignal icon={<StarIcon />} text={tTrust("premiumQuality")} />
                    </div>
                </div>
            </section>

            {/* Lifestyle Categories - Enhanced Section */}
            <section className="py-10 sm:py-14 bg-surface border-y border-border relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:8rem_8rem] pointer-events-none" />
                <LifestyleCategories />
            </section>
        </>
    );
}

// Enhanced Trust Signal Component
function TrustSignal({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-background/80 backdrop-blur-sm border border-border-light shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300 group">
            <span className="text-accent group-hover:scale-110 transition-transform duration-300">{icon}</span>
            <span className="text-sm font-medium text-primary">{text}</span>
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
