"use client";

import HomeSearchFilters from "@/components/HomeSearchFilters";

export default function HomeHero() {
    return (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#0f172a]">
            {/* 1. Immersive Video/Image Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay transform scale-105 animate-slow-zoom" />
            </div>

            <div className="container-main relative z-20 w-full pt-32 sm:pt-40">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-12 xl:gap-20">

                    {/* 2. Emotive Copy - "Soul" */}
                    <div className="flex-1 text-center xl:text-left space-y-8 max-w-2xl mx-auto xl:mx-0">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-fade-in-up justify-center xl:justify-start">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            <span className="text-sm font-medium text-white/80 tracking-wide uppercase">Premium Marketplace</span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-medium text-white leading-[1.1] tracking-tight animate-fade-in-up delay-100">
                            Drive your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 italic font-light">legacy.</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-400 font-light max-w-lg mx-auto xl:mx-0 leading-relaxed animate-fade-in-up delay-200">
                            Discover a curated collection of vehicles that match your ambition. Transparency in every detail.
                        </p>

                        <div className="flex flex-wrap items-center justify-center xl:justify-start gap-6 sm:gap-8 pt-4 animate-fade-in-up delay-300">
                            <Stat number="1,200+" label="Premium Cars" />
                            <div className="w-px h-12 bg-white/10 hidden sm:block" />
                            <Stat number="98%" label="Verified Dealers" />
                            <div className="w-px h-12 bg-white/10 hidden sm:block" />
                            <Stat number="24/7" label="VIP Support" />
                        </div>
                    </div>

                    {/* 3. The "Wizard" - Floating Glass Interface */}
                    <div className="w-full max-w-xl animate-fade-in-up delay-500 mx-auto xl:mx-0 mt-8 xl:mt-0">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-2 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/5">
                                <h3 className="text-white text-xl font-display mb-6 flex items-center gap-2">
                                    <span className="text-accent">●</span> Find your match
                                </h3>
                                <HomeSearchFilters />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block text-white/30">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>
    );
}

function Stat({ number, label }: { number: string; label: string }) {
    return (
        <div className="text-center sm:text-left">
            <div className="text-3xl font-display font-medium text-white">{number}</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider font-medium">{label}</div>
        </div>
    );
}
