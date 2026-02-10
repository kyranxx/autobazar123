import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedCars from "@/components/FeaturedCars";
import RecentlySoldFeed from "@/components/RecentlySoldFeed";
import HomeHero from "./HomeHero";
import HomeFeatures from "./HomeFeatures";
import Link from "next/link";

// Regenerate page every 10 minutes (ISR)
export const revalidate = 600;

// Skeleton loaders for Suspense boundaries
function FeaturedCarsSkeleton() {
  return (
    <section className="section bg-background-secondary">
      <div className="container-main">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-48 bg-background-secondary rounded-lg skeleton" />
            <div className="mt-2 h-4 w-64 bg-background-secondary rounded-lg skeleton" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-background-secondary overflow-hidden"
            >
              <div className="aspect-[4/3] bg-background-secondary skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-32 bg-background-secondary rounded skeleton" />
                <div className="h-4 w-24 bg-background-secondary rounded skeleton" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 bg-background-secondary rounded skeleton" />
                  <div className="h-6 w-16 bg-background-secondary rounded skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center sm:hidden">
          <div className="btn btn-outline w-full h-10 bg-background-secondary rounded-lg skeleton" />
        </div>
      </div>
    </section>
  );
}

function RecentlySoldSkeleton() {
  return (
    <section className="section bg-background-secondary">
      <div className="container-main">
        <div className="mb-8">
          <div className="h-8 w-32 bg-background-secondary rounded-lg mb-4 skeleton" />
          <div className="h-4 w-96 max-w-full bg-background-secondary rounded-lg skeleton" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-background-secondary p-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-md bg-background-secondary skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-background-secondary rounded skeleton" />
                  <div className="h-3 w-20 bg-background-secondary rounded skeleton" />
                  <div className="h-5 w-16 bg-background-secondary rounded skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main id="main-content">
        {/* Full Screen Hero */}
        <HomeHero />

        {/* Immersive Featured Section */}
        <section className="section section-muted">
          <div className="container-main">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-4">
              <div>
                <span className="text-accent font-bold uppercase tracking-widest text-xs mb-2 block">
                  Prémiový výber
                </span>
                <h2 className="text-4xl sm:text-6xl font-display font-medium text-text-primary">
                  Najnovšie ponuky
                </h2>
              </div>
              <Link
                href="/vysledky"
                className="group hidden sm:inline-flex items-center gap-2 text-lg font-medium border-b border-text-primary pb-1 hover:text-accent hover:border-accent transition-colors"
              >
                Zobraziť všetky{" "}
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>

            <Suspense fallback={<FeaturedCarsSkeleton />}>
              <FeaturedCars />
            </Suspense>

            <div className="mt-12 text-center sm:hidden">
              <Link
                href="/vysledky"
                className="btn btn-outline w-full rounded-full"
              >
                Zobraziť všetky
              </Link>
            </div>
          </div>
        </section>

        {/* Recently Sold */}
        <Suspense fallback={<RecentlySoldSkeleton />}>
          <RecentlySoldFeed />
        </Suspense>

        <HomeFeatures />
      </main>
      <Footer />
    </div>
  );
}
