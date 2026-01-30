"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HomeFeatures() {
    const tCta = useTranslations("cta");

    const features = [
        {
            icon: <RocketIcon />,
            title: "Okamžité zverejnenie",
            description: "Váš inzerát bude online do niekoľkých sekúnd od odoslania.",
        },
        {
            icon: <ShieldIcon />,
            title: "Bezpečné transakcie",
            description: "Všetky platby sú šifrované a chránené modernými technológiami.",
        },
        {
            icon: <PriceIcon />,
            title: "Transparentné ceny",
            description: "Žiadne skryté poplatky. Platíte len za to, čo skutočne využijete.",
        },
    ];

    return (
        <>
            {/* Features Section */}
            <section className="section bg-[#fafafa]">
                <div className="container-main">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-[family-name:var(--font-display)] font-semibold text-[#0a0a0a] mb-4">
                            Prečo si vybrať nás
                        </h2>
                        <p className="text-[#525252] max-w-2xl mx-auto">
                            Sme moderná platforma, ktorá spája predajcov a kupujúcich. 
                            Naším cieľom je bezpečný a transparentný obchod.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {features.map((feature, index) => (
                            <FeatureCard
                                key={index}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section bg-white">
                <div className="container-main">
                    <div className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-8 sm:p-12 lg:p-16 text-center">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-[family-name:var(--font-display)] font-semibold text-white mb-4 max-w-2xl mx-auto">
                            {tCta("title")}
                        </h2>
                        <p className="text-[#a3a3a3] mb-8 max-w-xl mx-auto">
                            {tCta("subtitle")}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                            <Link
                                href="/pridat-inzerat"
                                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 text-sm font-medium text-white bg-[#2563eb] rounded-md hover:bg-[#1d4ed8] active:scale-[0.98] transition-all"
                            >
                                {tCta("addListingFree")}
                            </Link>
                            <Link
                                href="/ceny"
                                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 text-sm font-medium text-white border border-white/20 rounded-md hover:bg-white/10 hover:border-white/30 transition-all"
                            >
                                {tCta("viewPricing")}
                            </Link>
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
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-[#e5e5e5] hover:border-[#d4d4d4] transition-colors">
            <div className="w-12 h-12 rounded-lg bg-[#fafafa] flex items-center justify-center text-[#0a0a0a] mb-5">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">{title}</h3>
            <p className="text-sm text-[#737373] leading-relaxed">{description}</p>
        </div>
    );
}

// Icons
function RocketIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function PriceIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
    );
}
