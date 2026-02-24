import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeaturedCars from "@/components/FeaturedCars";
import RecentlySoldFeed from "@/components/RecentlySoldFeed";
import HomeSearchFilters from "@/components/HomeSearchFilters";
import { buttonVariants } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { cn } from "@/utils/cn";

export const revalidate = 300;

const heroSignals = [
  "Vyhľadávanie s okamžitým počtom výsledkov",
  "Filtrovanie značka/model/cena bez zbytočných krokov",
  "Rýchly prechod na reálne ponuky na /vysledky",
  "Silný mobilný flow bez zbytočného klikania",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-white to-zinc-100 text-zinc-950">
      <Navbar />

      <main id="main-content" className="pb-20">
        <section className="relative overflow-hidden border-b border-zinc-200/80">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(24,24,27,0.08),transparent_38%),radial-gradient(circle_at_84%_12%,rgba(59,130,246,0.12),transparent_30%)]" />

          <div className="container-main relative py-12 sm:py-16 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="space-y-6">
                <p className="inline-flex rounded-full border border-zinc-300 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                  Search-First Frontpage
                </p>

                <h1 className="text-4xl font-display font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                  Vyhľadávanie áut bez chaosu
                </h1>

                <p className="max-w-2xl text-base text-zinc-600 sm:text-lg">
                  Zvoľte značku, model, cenu a ďalšie filtre. Hneď uvidíte ponuky,
                  ktoré dávajú zmysel.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/vysledky"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "rounded-full bg-zinc-950 px-7 text-white shadow-[0_14px_30px_-16px_rgba(24,24,27,0.65)] hover:bg-zinc-800",
                    )}
                  >
                    Zobraziť všetky ponuky
                  </Link>
                  <Link
                    href="/pridat-inzerat"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-full border-zinc-300 bg-white/90 px-7 text-zinc-900 hover:bg-white",
                    )}
                  >
                    Pridať inzerát
                  </Link>
                </div>

                <ul className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
                  {heroSignals.map((signal) => (
                    <li
                      key={signal}
                      className="rounded-xl border border-zinc-200 bg-white/80 px-3 py-2"
                    >
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>

              <Card className="border-zinc-200 bg-white/95 py-0 shadow-xl shadow-zinc-300/35">
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
