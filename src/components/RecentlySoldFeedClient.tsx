"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { SoldCar } from "@/lib/supabase/cached";

interface RecentlySoldFeedClientProps {
    cars: SoldCar[];
}

export default function RecentlySoldFeedClient({ cars }: RecentlySoldFeedClientProps) {
    return (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/5 text-success text-[10px] font-bold uppercase tracking-widest mb-6 border border-success/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        Aktívny trh
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">
                        Práve predané vozidlá
                    </h2>
                    <p className="text-secondary opacity-60 font-medium">
                        Tieto autá si už našli svojich majiteľov. Pridajte sa k tisícom spokojných zákazníkov, ktorí predali cez nás.
                    </p>
                </div>

                <Link
                    href="/pridat-inzerat"
                    className="h-14 px-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-xl shadow-primary/10 hover:-translate-y-1 hover:bg-accent hover:text-accent-foreground transition-all"
                >
                    Chcem predať auto
                </Link>
            </div>

            {/* Sold Cars Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cars.map((car, index) => (
                    <SoldCarCard key={car.id} car={car} index={index} />
                ))}
            </div>
        </section>
    );
}

function SoldCarCard({ car, index }: { car: SoldCar; index: number }) {
    const [now] = useState(() => Date.now());
    const daysAgo = useMemo(() => Math.floor(
        (now - new Date(car.soldAt).getTime()) / (1000 * 60 * 60 * 24)
    ), [car.soldAt, now]);

    return (
        <div className="group bg-white p-5 rounded-[32px] border border-border/40 hover:shadow-premium transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-center gap-5">
                <div className="flex-shrink-0 w-20 h-20 relative rounded-2xl bg-surface overflow-hidden">
                    {car.image ? (
                        <Image
                            src={car.image}
                            alt={`${car.brand} ${car.model}`}
                            fill
                            sizes="80px"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                            👤
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-primary truncate mb-1">
                        {car.brand} {car.model}
                    </h3>
                    <p className="text-[10px] font-bold text-secondary opacity-40 uppercase tracking-widest mb-2">
                        {car.year} • {car.location}
                    </p>
                    <p className="text-base font-bold text-primary tabular-nums">
                        {formatPrice(car.price)}
                    </p>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-secondary opacity-40">
                    {daysAgo === 0 ? "Dnes" : daysAgo === 1 ? "Včera" : `Pred ${daysAgo} dňami`}
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-success">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Predané
                </span>
            </div>
        </div>
    );
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("sk-SK", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}
