"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { HeroSearchBar } from "@/components/AlgoliaInstantSearch";
import LifestyleCategories from "@/components/LifestyleCategories";
import FeaturedCars from "@/components/FeaturedCars";
import RecentlySoldFeed from "@/components/RecentlySoldFeed";
import ActiveAdsCount from "@/components/ActiveAdsCount";

export default function HomePageClient() {
    const t = useTranslations("hero");
    const tTrust = useTranslations("trust");
    const tSections = useTranslations("sections");
    const tFeatures = useTranslations("features");
    const tCta = useTranslations("cta");

    return (
        <main>
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

            {/* Featured Cars */}
            <section className="py-10 sm:py-14">
                <FeaturedCars />
            </section>

            {/* Recently Sold */}
            <section className="py-10 sm:py-14 bg-surface border-y border-border">
                <RecentlySoldFeed />
            </section>

            {/* Why Autobazar123 Section */}
            <section className="py-10 sm:py-14 bg-accent-subtle">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                            {tSections("whyUs")}
                        </h2>
                        <p className="mt-3 text-secondary max-w-xl mx-auto">
                            {tSections("whyUsSubtitle")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <FeatureCard
                            icon={<RocketIcon />}
                            title={tFeatures("instantPublish.title")}
                            description={tFeatures("instantPublish.description")}
                        />
                        <FeatureCard
                            icon={<LockIcon />}
                            title={tFeatures("secureTransactions.title")}
                            description={tFeatures("secureTransactions.description")}
                        />
                        <FeatureCard
                            icon={<ChartIcon />}
                            title={tFeatures("transparentPricing.title")}
                            description={tFeatures("transparentPricing.description")}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-10 sm:py-14 bg-gradient-to-r from-accent to-blue-700 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                        {tCta("title")}
                    </h2>
                    <p className="mt-4 text-lg opacity-80 max-w-xl mx-auto">
                        {tCta("subtitle")}
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/pridat-inzerat"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-accent font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-[0.98] transition-all"
                        >
                            {tCta("addListingFree")}
                            <span>→</span>
                        </Link>
                        <Link
                            href="/ceny"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/40 text-white font-medium hover:bg-white/10 hover:border-white/60 transition-all"
                        >
                            {tCta("viewPricing")}
                        </Link>
                    </div>
                </div>
            </section>
        </main>
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

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="group relative p-6 rounded-2xl border border-accent/20 bg-white shadow-sm hover:shadow-lg hover:border-accent/40 transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-2 text-sm text-secondary">{description}</p>
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

function RocketIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
}

function ChartIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}
