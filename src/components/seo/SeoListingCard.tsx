"use client";

import Image from "next/image";
import Link from "next/link";
import { buildAdPath } from "@/lib/cars/ad-path";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { SeoInventoryListing } from "@/lib/seo/inventory";

type SeoRouteListingSource = "seo_city_route" | "seo_model_route";

interface SeoListingCardProps {
  car: SeoInventoryListing;
  source: SeoRouteListingSource;
  position: number;
  imageSizes: string;
  showCityBadge?: boolean;
  extraMetaLine?: string | null;
}

export function SeoListingCard({
  car,
  source,
  position,
  imageSizes,
  showCityBadge = false,
  extraMetaLine = null,
}: SeoListingCardProps) {
  const href = buildAdPath({
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
  });

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-2xl border border-border"
      onClick={() => {
        trackAnalyticsEvent("listing_viewed", {
          adId: car.id,
          source,
          position,
        });
      }}
    >
      <div className="relative aspect-[16/10]">
        <Image
          src={car.image}
          alt={`${car.brand} ${car.model}${car.city ? `, ${car.city}` : ""}`}
          fill
          sizes={imageSizes}
          className="object-cover"
        />
        {showCityBadge ? (
          <span className="absolute right-2 top-2 rounded-lg bg-background/90 px-2 py-1 text-xs font-medium text-secondary">
            {car.city || "-"}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-primary">
          {car.brand} {car.model}
        </h3>
        <p className="text-sm text-secondary">
          {car.year ?? "-"} - {car.mileageKm?.toLocaleString("sk-SK") ?? "-"} km
          {extraMetaLine ? ` - ${extraMetaLine}` : ""}
        </p>
        <p className="mt-2 text-xl font-bold text-accent">
          {car.priceEur?.toLocaleString("sk-SK") ?? "-"} EUR
        </p>
      </div>
    </Link>
  );
}
