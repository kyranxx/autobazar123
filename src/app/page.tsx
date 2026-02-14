import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeaturedCars from "@/components/FeaturedCars";
import RecentlySoldFeed from "@/components/RecentlySoldFeed";
import HomeSearchFilters from "@/components/HomeSearchFilters";
import ActiveAdsCount from "@/components/ActiveAdsCount";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { buttonVariants } from "@/components/ui/shadcn/button";
import { cn } from "@/utils/cn";

export const dynamic = "force-dynamic";

const quickLinks = [
  { label: "SUV do 35 000 EUR", href: "/vysledky?bodyType=SUV&priceTo=35000" },
  { label: "Automat", href: "/vysledky?transmission=automatic" },
  { label: "Do 100 000 km", href: "/vysledky?mileageTo=100000" },
  { label: "Hybrid", href: "/vysledky?fuel=hybrid" },
];

const journeyCards = [
  {
    title: "Rodinné auto",
    description: "Priestor, bezpečnosť a overené kusy pripravené na rýchly výber.",
    href: "/vysledky?bodyType=SUV&priceTo=35000",
  },
  {
    title: "Mestské auto",
    description: "Nízke náklady, jednoduché parkovanie a dostupná cena.",
    href: "/vysledky?priceTo=12000",
  },
  {
    title: "Leasing ready",
    description: "Ponuky vhodné na financovanie s jasnými podmienkami.",
    href: "/kalkulacka-leasingu",
  },
  {
    title: "4x4 na zimu",
    description: "Silná trakcia, stabilita a istota v náročných podmienkach.",
    href: "/vysledky?drivetrain=4x4",
  },
];

const trustMetrics = [
  {
    label: "Aktívny trh",
    value: <ActiveAdsCount />,
  },
  {
    label: "Top hodnotenie",
    value: "4,9/5",
  },
  {
    label: "Priemerná reakcia",
    value: "17 min",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-white to-zinc-100 text-zinc-950">
      <Navbar />

      <main id="main-content" className="pb-20">
        <section className="border-b border-zinc-200/80">
          <div className="container-main py-12 sm:py-16 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
              <div>
                <Badge
                  variant="outline"
                  className="border-zinc-300 bg-white px-3 py-1 text-[11px] tracking-[0.16em] uppercase"
                >
                  Nová generácia autobazára
                </Badge>

                <h1 className="mt-5 max-w-3xl text-4xl font-display font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                  Auto kúpiš rýchlejšie,
                  <span className="block text-zinc-500">
                    bez chaosu a bez kompromisov.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base text-zinc-600 sm:text-lg">
                  Čistá, rýchla a dôveryhodná cesta od prvého hľadania po kontakt
                  s predajcom.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/vysledky"
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "rounded-full bg-zinc-950 text-white hover:bg-zinc-800",
                    )}
                  >
                    Prejsť na ponuky
                  </Link>
                  <Link
                    href="/pridat-inzerat"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-full border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
                    )}
                  >
                    Predať auto
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {trustMetrics.map((metric) => (
                    <Card
                      key={metric.label}
                      className="gap-0 border-zinc-200 bg-white/90 py-0 shadow-sm"
                    >
                      <CardContent className="px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                          {metric.label}
                        </p>
                        <div className="mt-2 text-lg font-semibold text-zinc-900">
                          {metric.value}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-full border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <Card className="border-zinc-200 bg-white/95 py-0 shadow-xl shadow-zinc-300/30">
                <CardHeader className="border-b border-zinc-200 px-6 py-5">
                  <CardTitle className="text-lg">Inteligentné vyhľadávanie</CardTitle>
                  <CardDescription>
                    Značka, model, cena a ďalšie filtre na jednom mieste.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 py-6">
                  <HomeSearchFilters />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="container-main">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Rýchly výber
                </p>
                <h2 className="mt-2 text-3xl font-display font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  Výber podľa zámeru
                </h2>
              </div>
              <Link
                href="/vysledky"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
                )}
              >
                Otvoriť všetky ponuky
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {journeyCards.map((card) => (
                <Card
                  key={card.title}
                  className="gap-0 border-zinc-200 bg-white py-0 hover:border-zinc-400"
                >
                  <CardContent className="px-6 py-6">
                    <h3 className="text-xl font-semibold text-zinc-900">{card.title}</h3>
                    <p className="mt-2 text-sm text-zinc-600">{card.description}</p>
                    <Link
                      href={card.href}
                      className={cn(
                        buttonVariants({ variant: "link", size: "sm" }),
                        "mt-3 h-auto px-0 text-zinc-900",
                      )}
                    >
                      Otvoriť výber
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-50/70 py-14 sm:py-16">
          <div className="container-main">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="text-3xl font-display font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Prémiové ponuky
              </h2>
              <Link
                href="/vysledky"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
                )}
              >
                Všetky autá
              </Link>
            </div>

            <Suspense fallback={<FeaturedCarsSkeleton />}>
              <FeaturedCars />
            </Suspense>
          </div>
        </section>

        <Suspense fallback={<RecentlySoldSkeleton />}>
          <RecentlySoldFeed />
        </Suspense>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="container-main py-10 text-sm text-zinc-500">
          © {new Date().getFullYear()} Autobazar123
        </div>
      </footer>
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
