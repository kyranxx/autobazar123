"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { SoldCar } from "@/lib/supabase/cached";
import { formatCurrency } from "@/config/vat";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

interface RecentlySoldFeedClientProps {
    cars: SoldCar[];
}

export default function RecentlySoldFeedClient({ cars }: RecentlySoldFeedClientProps) {
    return (
        <section className="section section-muted">
            <div className="container-main">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
                    <div>
                        <p className="eyebrow mb-3">Live market</p>
                        <h2 className="text-3xl sm:text-5xl font-display font-semibold text-text-primary mb-4">
                            Just Sold
                        </h2>
                        <p className="text-lg text-text-secondary max-w-lg">
                            These vehicles found new owners. Join thousands of satisfied customers today.
                        </p>
                    </div>

                    <Link
                        href="/pridat-inzerat"
                        className="btn-accent px-6 py-3 text-sm font-semibold"
                    >
                        Sell your car
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cars.map((car, index) => (
                        <SoldCarCard key={car.id} car={car} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function SoldCarCard({ car, index }: { car: SoldCar; index: number }) {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        setNow(Date.now());
    }, []);

    const daysAgo = useMemo(() => {
        if (now === null) return null;
        return Math.floor((now - new Date(car.soldAt).getTime()) / (1000 * 60 * 60 * 24));
    }, [car.soldAt, now]);

    return (
        <div
            className="group card card-hover p-4 flex items-center gap-4"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex-shrink-0 w-20 h-20 relative rounded-xl overflow-hidden bg-background-tertiary border border-border-subtle">
                {car.image ? (
                    <Image
                        src={car.image}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        loading="lazy"
                        sizes="80px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary text-2xl">
                        Car
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold font-display text-text-primary truncate">
                    {car.brand} {car.model}
                </h3>
                <p className="text-xs text-text-tertiary mt-0.5 truncate">
                    {car.year} - {car.location}
                </p>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-semibold text-text-primary tabular-nums">
                        {formatCurrency(car.price)}
                    </p>
                    <span className="text-[10px] font-semibold text-text-tertiary bg-surface px-2 py-0.5 rounded-full border border-border-subtle" suppressHydrationWarning>
                        {daysAgo === null ? "—" : daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`}
                    </span>
                </div>
            </div>

            <div className="absolute right-2 top-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <CheckBadgeIcon className="w-5 h-5 text-accent" />
            </div>
        </div>
    );
}
