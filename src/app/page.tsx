import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedCars from "@/components/FeaturedCars";
import RecentlySoldFeed from "@/components/RecentlySoldFeed";
import HomeHero from "./HomeHero";
import HomeFeatures from "./HomeFeatures";

// Skeleton loaders for Suspense boundaries
function FeaturedCarsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="h-8 w-48 bg-surface rounded-lg skeleton" />
          <div className="mt-2 h-5 w-64 bg-surface rounded-lg skeleton" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white overflow-hidden">
            <div className="aspect-[16/10] bg-surface skeleton" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="h-5 w-32 bg-surface rounded skeleton" />
                  <div className="mt-1 h-4 w-24 bg-surface rounded skeleton" />
                </div>
                <div className="h-6 w-20 bg-surface rounded skeleton" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-6 w-16 bg-surface rounded-full skeleton" />
                <div className="h-6 w-16 bg-surface rounded-full skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentlySoldSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-6">
        <div className="h-8 w-32 bg-success/10 rounded-full mx-auto mb-4 skeleton" />
        <div className="h-8 w-48 bg-surface rounded-lg mx-auto skeleton" />
        <div className="mt-3 h-5 w-96 max-w-full bg-surface rounded-lg mx-auto skeleton" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-surface skeleton" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-surface rounded skeleton" />
                <div className="mt-1 h-3 w-20 bg-surface rounded skeleton" />
                <div className="mt-2 h-5 w-16 bg-surface rounded skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Section - Client Component for interactivity */}
        <HomeHero />

        {/* Featured Cars - Server Component with Suspense for streaming */}
        <section className="py-10 sm:py-14">
          <Suspense fallback={<FeaturedCarsSkeleton />}>
            <FeaturedCars />
          </Suspense>
        </section>

        {/* Recently Sold - Server Component with Suspense for streaming */}
        <section className="py-10 sm:py-14 bg-surface border-y border-border">
          <Suspense fallback={<RecentlySoldSkeleton />}>
            <RecentlySoldFeed />
          </Suspense>
        </section>

        {/* Features & CTA - Client Component for translations */}
        <HomeFeatures />
      </main>
      <Footer />
    </div>
  );
}
