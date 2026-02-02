"use client";

import HomeSearchFilters from "@/components/HomeSearchFilters";

export default function HomeHero() {
    return (
        <section className="section-hero">
            <div className="container-main">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-center font-semibold tracking-tight mb-10">
                        Nájdi svoje <span className="text-text-secondary">auto</span>
                    </h1>

                    <div className="bg-white rounded-xl p-6 sm:p-8 border border-border">
                        <HomeSearchFilters />
                    </div>
                </div>
            </div>
        </section>
    );
}
