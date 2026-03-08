"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { SoldCar } from "@/lib/supabase/cached";
import { formatCurrency } from "@/config/vat";
import { VerifiedIcon } from "@/components/ui/Icons";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";

interface RecentlySoldFeedClientProps {
  cars: SoldCar[];
}

export default function RecentlySoldFeedClient({ cars }: RecentlySoldFeedClientProps) {
  const t = useTranslations("recentlySold");
  const visibleCars = useMemo(() => cars.slice(0, 6), [cars]);

  return (
    <section className="section section-muted bg-background-muted">
      <div className="container-main">
        <div className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{t("marketEyebrow")}</p>
            <h2 className="mb-4 mt-3 text-3xl font-display font-semibold text-text-primary sm:text-5xl">
              {t("title")}
            </h2>
            <p className="max-w-xl text-base text-text-secondary sm:text-lg">{t("description")}</p>
          </div>

          <Link href="/moj-ucet?tab=create" className="btn-accent px-6 py-3 text-sm font-semibold">
            {t("sellCarCta")}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCars.map((car) => (
            <SoldCarCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SoldCarCard({ car }: { car: SoldCar }) {
  const t = useTranslations("recentlySold");

  return (
    <div className="group relative flex min-w-0 items-center gap-4 rounded-2xl border border-black/10 bg-white/90 p-4 shadow-xs">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-black/10 bg-background-tertiary">
        {car.image ? (
          <Image
            src={optimizeCloudflareImage(car.image, {
              width: 160,
              height: 160,
              fit: "cover",
              quality: 82,
              format: "auto",
            })}
            alt={`${car.brand} ${car.model}`}
            fill
            loading="lazy"
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-text-tertiary">
            {t("carFallback")}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-display font-semibold text-text-primary">
          {car.brand} {car.model}
        </h3>
        <p className="mt-0.5 truncate text-xs text-text-tertiary">
          {car.year} - {car.location}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-semibold tabular-nums text-text-primary">{formatCurrency(car.price)}</p>
          <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] font-semibold text-text-tertiary">
            {t("soldPrefix")} {car.soldDateLabel}
          </span>
        </div>
      </div>

      <div className="absolute right-2 top-2 opacity-60">
        <VerifiedIcon className="h-5 w-5 text-primary" />
      </div>
    </div>
  );
}
