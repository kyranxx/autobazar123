"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { SoldCar } from "@/lib/supabase/cached";
import { formatCurrency } from "@/config/vat";
import { VerifiedIcon } from "@/components/ui/Icons";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";

interface RecentlySoldFeedClientProps {
  cars: SoldCar[];
}

export default function RecentlySoldFeedClient({
  cars,
}: RecentlySoldFeedClientProps) {
  return (
    <section className="section section-muted bg-[#f0f3ea]">
      <div className="container-main">
        <div className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d5e9f]">Trh v pohybe</p>
            <h2 className="mb-4 mt-3 text-3xl font-display font-semibold text-text-primary sm:text-5xl">
              Nedávno predané
            </h2>
            <p className="max-w-xl text-base text-text-secondary sm:text-lg">
              Tieto vozidlá si už našli nových majiteľov. Sleduj tempo predaja a nastav cenu realisticky.
            </p>
          </div>

          <Link href="/pridat-inzerat" className="btn-accent px-6 py-3 text-sm font-semibold">
            Predať auto
          </Link>
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {cars.map((car, index) => (
            <SoldCarCard key={car.id} car={car} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SoldCarCard({ car, index }: { car: SoldCar; index: number }) {
  return (
    <div
      className="group relative flex min-w-[260px] snap-start items-center gap-4 rounded-2xl border border-black/10 bg-white/85 p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm sm:min-w-[300px]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-text-tertiary">
            Auto
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-display font-semibold text-text-primary">
          {car.brand} {car.model}
        </h3>
        <p className="mt-0.5 truncate text-xs text-text-tertiary">
          {car.year} • {car.location}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-semibold tabular-nums text-text-primary">{formatCurrency(car.price)}</p>
          <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] font-semibold text-text-tertiary">
            Predané {car.soldDateLabel}
          </span>
        </div>
      </div>

      <div className="absolute right-2 top-2 opacity-60 transition-opacity group-hover:opacity-100">
        <VerifiedIcon className="h-5 w-5 text-[#2d5e9f]" />
      </div>
    </div>
  );
}

