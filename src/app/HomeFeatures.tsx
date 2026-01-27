"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/utils/cn";

export default function HomeFeatures() {
    const tSections = useTranslations("sections");
    const tFeatures = useTranslations("features");
    const tCta = useTranslations("cta");

    return (
        <>
            {/* Why Us Section */}
            <section className="py-32 bg-surface">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center text-center mb-20 animate-fade-in-up">
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
                            {tSections("whyUs")}
                        </h2>
                        <p className="text-secondary font-medium max-w-2xl leading-relaxed">
                            {tSections("whyUsSubtitle") || "Sme viac než len bazár. Sme váš partner pri kúpe a predaji preverených vozidiel."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<RocketLaunchIcon />}
                            title={tFeatures("instantPublish.title")}
                            description={tFeatures("instantPublish.description")}
                            delay={100}
                        />
                        <FeatureCard
                            icon={<SecureShieldIcon />}
                            title={tFeatures("secureTransactions.title")}
                            description={tFeatures("secureTransactions.description")}
                            delay={200}
                        />
                        <FeatureCard
                            icon={<FairPriceIcon />}
                            title={tFeatures("transparentPricing.title")}
                            description={tFeatures("transparentPricing.description")}
                            delay={300}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section - DARK MODE Anchoring */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-primary rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden group shadow-2xl shadow-primary/20">

                        {/* Gold Glow Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />

                        <div className="relative z-10 animate-fade-in-up">
                            <h2 className="text-3xl md:text-6xl font-display font-bold text-white mb-10 max-w-4xl mx-auto leading-[1.1]">
                                {tCta("title")}
                            </h2>
                            <p className="text-base md:text-lg text-white/70 font-medium max-w-2xl mx-auto mb-12 px-4">
                                {tCta("subtitle")}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/pridat-inzerat"
                                    className="h-16 px-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shadow-lg shadow-accent/20 hover:bg-[#f5a50b] hover:scale-105 transition-all"
                                >
                                    {tCta("addListingFree")}
                                </Link>
                                <Link
                                    href="/ceny"
                                    className="h-16 px-10 rounded-full border-2 border-white/20 text-white flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-all backdrop-blur-sm"
                                >
                                    {tCta("viewPricing")}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

function FeatureCard({
    icon,
    title,
    description,
    delay = 0,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay?: number;
}) {
    return (
        <div
            className="flex flex-col items-center text-center p-8 rounded-[32px] bg-white border border-border/50 shadow-sm hover:shadow-premium hover:border-accent/30 transition-all duration-300 group"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Icon Circle with Color Pop */}
            <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
                <div className="w-10 h-10">
                    {icon}
                </div>
            </div>
            <h3 className="text-xl font-bold text-primary mb-4">{title}</h3>
            <p className="text-sm text-secondary leading-relaxed font-medium">{description}</p>
        </div>
    );
}

// Icons with Accent Fills

function RocketLaunchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M32 6l-8 16h16L32 6z" className="fill-white/50 group-hover:fill-white/80 transition-colors" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M24 22v26c0 4 8 4 8 4s8 0 8-4V22H24z" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M24 48l-6 8M40 48l6 8" />
            <circle cx="32" cy="32" r="4" strokeWidth="2" className="fill-white" />
        </svg>
    );
}

function SecureShieldIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M32 6L14 14v18c0 16 18 26 18 26s18-10 18-26V14L32 6z" className="fill-white/50 group-hover:fill-white/80 transition-colors" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M32 24v8M32 40v.01" />
            <circle cx="32" cy="32" r="12" strokeWidth="2" className="opacity-20 fill-current" />
        </svg>
    );
}

function FairPriceIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor">
            <rect x="12" y="12" width="40" height="40" rx="8" strokeWidth="2" className="fill-white/50 group-hover:fill-white/80 transition-colors" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M22 42V32M32 42V22M42 42V28" />
            <circle cx="48" cy="16" r="6" strokeWidth="2" className="fill-white" />
            <path strokeWidth="2" strokeLinecap="round" d="M46 16l4 4" />
        </svg>
    );
}
