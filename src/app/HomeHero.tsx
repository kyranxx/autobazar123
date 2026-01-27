"use client";

import { useTranslations } from "next-intl";
import LifestyleCategories from "@/components/LifestyleCategories";
import ActiveAdsCount from "@/components/ActiveAdsCount";
import HomeSearchFilters from "@/components/HomeSearchFilters";

export default function HomeHero() {
    const t = useTranslations("hero");

    return (
        <>
            <section className="relative pt-24 pb-16 overflow-hidden bg-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-accent/20 blur-[120px] rounded-full pointer-events-none opacity-40 translate-y-[-20%]" />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white border border-border shadow-sm animate-fade-in-up">
                            <ActiveAdsCount />
                        </div>

                        <div className="max-w-4xl mb-12 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                            <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight text-primary leading-tight">
                                {t("title")}. <span className="text-secondary opacity-40 font-medium">Bazar novej generácie.</span>
                            </h1>
                        </div>

                        {/* Search Section - Moved UP and prominent */}
                        <div className="w-full max-w-5xl mb-24 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                            <div className="relative">
                                {/* Gold Glow behind Search */}
                                <div className="absolute inset-x-8 top-8 bottom-0 bg-accent/30 blur-2xl rounded-[40px] -z-10" />

                                <div className="bg-white rounded-[32px] md:rounded-[40px] border border-border/50 p-2 shadow-2xl shadow-black/5 ring-1 ring-black/5">
                                    <div className="p-3">
                                        <HomeSearchFilters />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trust Signals - Badge Style */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 w-full animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                            <TrustBadge
                                icon={<VerifiedBadgeIcon />}
                                title="Overení predajcovia"
                                text="Každý inzerent prechádza manuálnou verifikáciou pre vašu bezpečnosť."
                            />
                            <TrustBadge
                                icon={<SpeedBadgeIcon />}
                                title="Okamžité zverejnenie"
                                text="Váš inzerát bude online v priebehu niekoľkých sekúnd od odoslania."
                            />
                            <TrustBadge
                                icon={<SecurityBadgeIcon />}
                                title="Bezpečné platby"
                                text="Všetky finančné transakcie a nákupy kreditov sú šifrované."
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-surface/50 border-t border-border/60">
                <LifestyleCategories />
            </section>
        </>
    );
}

function TrustBadge({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
    return (
        <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-white border border-border/60 hover:border-accent/40 hover:shadow-premium transition-all duration-300 group">
            <div className="w-14 h-14 mb-4 text-primary/80 transition-transform duration-500 group-hover:scale-110 group-hover:text-accent group-hover:rotate-3">
                {icon}
            </div>
            <h3 className="text-base font-bold text-primary mb-2">{title}</h3>
            <p className="text-xs text-secondary leading-relaxed opacity-70 font-medium max-w-[240px]">{text}</p>
        </div>
    );
}

// Custom Trust Badge Icons (Noble Minimalist Style)
// Detailed, badge-like icons.

function VerifiedBadgeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M32 4L12 14v16c0 14 20 30 20 30s20-16 20-30V14L32 4z" />
            <path strokeWidth="1.5" d="M32 4L12 14v16c0 14 20 30 20 30s20-16 20-30V14L32 4z" className="opacity-10 fill-current" />
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M22 30l6 6 14-14" />
            <circle cx="32" cy="18" r="1.5" className="fill-current" />
        </svg>
    );
}

function SpeedBadgeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor">
            <circle cx="32" cy="32" r="24" strokeWidth="1.5" />
            <circle cx="32" cy="32" r="24" strokeWidth="1.5" className="opacity-10 fill-current" />
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M32 16v16l10 10" />
            <path strokeWidth="1.5" strokeLinecap="round" d="M32 8v4M56 32h-4M8 32h4M32 56v-4" className="opacity-40" />
        </svg>
    );
}

function SecurityBadgeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor">
            <rect x="16" y="28" width="32" height="24" rx="4" strokeWidth="1.5" />
            <rect x="16" y="28" width="32" height="24" rx="4" strokeWidth="1.5" className="opacity-10 fill-current" />
            <path strokeWidth="1.5" strokeLinecap="round" d="M22 28v-8a10 10 0 0120 0v8" />
            <circle cx="32" cy="40" r="3" strokeWidth="1.5" />
            <path strokeWidth="1.5" strokeLinecap="round" d="M32 43v3" />
        </svg>
    );
}
