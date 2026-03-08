/**
 * RecentlySoldFeed - Server Component
 * Fetches data server-side for faster initial render and better SEO
 * Uses shared Next.js data cache via supabase cached helpers
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRecentlySoldCars } from "@/lib/supabase/cached";
import RecentlySoldFeedClient from "./RecentlySoldFeedClient";

export default async function RecentlySoldFeed() {
  const cars = await getRecentlySoldCars();
  const t = await getTranslations("recentlySold");

  if (cars.length === 0) {
    return (
      <section className="section section-muted bg-background-muted">
        <div className="container-main py-10 text-center sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t("marketEyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-display font-semibold text-text-primary sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-text-secondary sm:text-lg">
            {t("emptyDescription")}
          </p>
          <Link
            href="/vysledky"
            className="btn-accent mt-6 inline-flex px-6 py-3 text-sm font-semibold"
          >
            {t("browseListings")}
          </Link>
        </div>
      </section>
    );
  }

  return <RecentlySoldFeedClient cars={cars} />;
}
