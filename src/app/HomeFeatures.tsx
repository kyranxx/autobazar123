"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HomeFeatures() {
    const tSections = useTranslations("sections");
    const tFeatures = useTranslations("features");
    const tCta = useTranslations("cta");

    return (
        <>
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
        </>
    );
}

// Helper Components
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
