"use client";

import HomeSearchFilters from "@/components/HomeSearchFilters";

export default function HomeHero() {
    return (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-background-secondary via-background to-background-tertiary" />
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent-subtle opacity-70 blur-3xl" />
                <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-digital-subtle opacity-60 blur-3xl" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-15" />
            </div>

            <div className="container-main relative z-10 w-full pt-28 sm:pt-32">
                <div className="grid grid-cols-1 xl:grid-cols-[1.05fr,0.95fr] items-center gap-12 xl:gap-16">
                    <div className="text-center xl:text-left space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background-secondary border border-border shadow-sm justify-center xl:justify-start">
                            <span className="w-2 h-2 rounded-full bg-accent" />
                            <span className="text-xs font-semibold text-text-secondary tracking-widest uppercase">Trusted Marketplace</span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-semibold text-text-primary leading-[1.05]">
                            Find the car that fits your life.
                        </h1>

                        <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto xl:mx-0 leading-relaxed">
                            Premium listings, verified sellers, and a search that feels effortless from the first tap.
                        </p>

                        <div className="flex flex-wrap items-center justify-center xl:justify-start gap-6 sm:gap-8 pt-2">
                            <Stat number="1,200+" label="Premium Cars" />
                            <div className="w-px h-12 bg-border hidden sm:block" />
                            <Stat number="98%" label="Verified Dealers" />
                            <div className="w-px h-12 bg-border hidden sm:block" />
                            <Stat number="24/7" label="Support" />
                        </div>
                    </div>

                    <div className="w-full max-w-xl mx-auto xl:mx-0">
                        <div className="card p-2">
                            <div className="rounded-[calc(var(--radius-lg)-6px)] border border-border-subtle bg-background-secondary p-6 sm:p-8">
                                <h3 className="text-text-primary text-xl font-display mb-6 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
                                    Start your search
                                </h3>
                                <HomeSearchFilters />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Stat({ number, label }: { number: string; label: string }) {
    return (
        <div className="text-center sm:text-left">
            <div className="text-3xl font-display font-semibold text-text-primary">{number}</div>
            <div className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">{label}</div>
        </div>
    );
}
