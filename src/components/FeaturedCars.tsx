/**
 * FeaturedCars - Server Component
 * Fetches data server-side for faster initial render and better SEO
 * Uses shared Next.js data cache via supabase cached helpers
 */
import Link from "next/link";
import { getFeaturedCars } from "@/lib/supabase/cached";
import FeaturedCarsClient from "./FeaturedCarsClient";

export default async function FeaturedCars() {
  const cars = await getFeaturedCars();

  if (cars.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/80 p-6 text-center shadow-xs">
        <p className="text-base font-semibold text-text-primary">
          Zatial nemame ziadne odporucane inzeraty.
        </p>
        <p className="mt-2 text-sm text-text-tertiary">
          Pozrite si aktualnu ponuku a nastavte filtre podla seba.
        </p>
        <Link
          href="/vysledky"
          className="mt-4 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-text-primary hover:bg-black/[0.03]"
        >
          Prejst na vysledky
        </Link>
      </div>
    );
  }

  return <FeaturedCarsClient cars={cars} />;
}
