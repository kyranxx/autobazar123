import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import FeaturedCars from "@/components/FeaturedCars";
import RecentlySoldFeed from "@/components/RecentlySoldFeed";
import HomeSearchFilters from "@/components/HomeSearchFilters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";

export const revalidate = 300;

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-white to-zinc-100 text-zinc-950">
      <Navbar />

      <main id="main-content" className="pb-20">
        <section className="border-b border-zinc-200/80">
          <div className="container-main py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-display font-semibold leading-[1.02] tracking-tight sm:text-5xl">
                  Vyhľadávanie áut bez chaosu
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 sm:text-lg">
                  Zvoľte značku, model, cenu a ďalšie filtre. Hneď uvidíte ponuky,
                  ktoré dávajú zmysel.
                </p>
              </div>

              <Card className="border-zinc-200 bg-white/95 py-0 shadow-xl shadow-zinc-300/30">
                <CardHeader className="border-b border-zinc-200 px-6 py-5">
                  <CardTitle className="text-lg">Vyhľadávanie vozidiel</CardTitle>
                  <CardDescription>
                    Všetky dôležité filtre na jednom mieste.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 py-6">
                  <HomeSearchFilters />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-50/70 py-14 sm:py-16">
          <div className="container-main">
            <h2 className="mb-8 text-3xl font-display font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Prémiové ponuky
            </h2>

            <Suspense fallback={<FeaturedCarsSkeleton />}>
              <FeaturedCars />
            </Suspense>
          </div>
        </section>

        <Suspense fallback={<RecentlySoldSkeleton />}>
          <RecentlySoldFeed />
        </Suspense>
      </main>
    </div>
  );
}

function FeaturedCarsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="gap-0 overflow-hidden border-zinc-200 bg-white py-0">
          <div className="aspect-[4/3] w-full animate-pulse bg-zinc-200" />
          <CardContent className="space-y-3 px-4 py-4">
            <div className="h-5 w-2/3 rounded bg-zinc-200" />
            <div className="h-4 w-1/2 rounded bg-zinc-200" />
            <div className="h-6 w-1/3 rounded bg-zinc-200" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentlySoldSkeleton() {
  return (
    <section className="py-14 sm:py-16">
      <div className="container-main">
        <div className="mb-6 space-y-2">
          <div className="h-4 w-40 rounded bg-zinc-200" />
          <div className="h-8 w-64 rounded bg-zinc-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="gap-0 border-zinc-200 bg-white py-0">
              <CardContent className="px-4 py-4">
                <div className="h-14 w-14 rounded-lg bg-zinc-200" />
                <div className="mt-3 h-4 w-3/4 rounded bg-zinc-200" />
                <div className="mt-2 h-4 w-1/2 rounded bg-zinc-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
