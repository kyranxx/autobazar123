"use client";

import HomeSearchFilters from "@/components/HomeSearchFilters";
import { CheckCircleIcon } from "@/components/ui/Icons";

export default function HomeHero() {
  return (
    <section className="relative min-h-[60vh] sm:min-h-[65vh] flex items-center bg-background overflow-hidden">
      <div className="container-main relative z-10 py-8 sm:py-12 lg:py-16">
        {/* Hero Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-text-primary leading-tight tracking-tight mb-4">
            Nájdite auto snov
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            Tisíce overených vozidiel od dôveryhodných predajcov.
            <span className="hidden sm:inline"> Bezpečne a jednoducho.</span>
          </p>
        </div>

        {/* Search Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-background/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-border-subtle p-5 sm:p-8 shadow-lg shadow-black/5">
            <HomeSearchFilters />
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-8 sm:mt-10">
          <TrustBadge text="Overení predajcovia" />
          <TrustBadge text="Bezpečné platby" />
          <TrustBadge text="História vozidla" />
        </div>
      </div>
    </section>
  );
}

function TrustBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-text-secondary text-sm">
      <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
