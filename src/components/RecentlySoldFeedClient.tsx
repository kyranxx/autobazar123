"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { SoldCar } from "@/lib/supabase/cached";
import { formatCurrency } from "@/config/vat";

interface RecentlySoldFeedClientProps {
    cars: SoldCar[];
}

export default function RecentlySoldFeedClient({ cars }: RecentlySoldFeedClientProps) {
    return (
        <section className="section bg-background-secondary">
            <div className="container-main">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-subtle text-success text-[10px] font-medium uppercase tracking-wider mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            Aktívny trh
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-semibold text-text-primary mb-2">
                            Práve predané vozidlá
                        </h2>
                        <p className="text-sm text-text-tertiary max-w-lg">
                            Tieto autá si už našli svojich majiteľov. Pridajte sa k tisícom spokojných zákazníkov.
                        </p>
                    </div>

                    <Link
                        href="/pridat-inzerat"
                        className="btn-primary w-full sm:w-auto"
                    >
                        Chcem predať auto
                    </Link>
                </div>

                {/* Sold Cars Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cars.map((car, index) => (
                        <SoldCarCard key={car.id} car={car} index={index} />
                    ))}
                </div>
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
        <div className="group bg-white p-4 rounded-lg border border-border hover:border-border-strong transition-colors">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-16 h-16 relative rounded-md bg-background-secondary overflow-hidden">
                    {car.image ? (
                        <Image
                            src={car.image}
                            alt={`${car.brand} ${car.model}`}
                            fill
                            sizes="64px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted text-lg">
                            🚗
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                        {car.brand} {car.model}
                    </h3>
                    <p className="text-xs text-text-tertiary">
                        {car.year} • {car.location}
                    </p>
                    <p className="text-base font-semibold text-text-primary tabular-nums mt-1">
                        {formatCurrency(car.price)}
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                <span className="text-xs text-text-muted">
                    {daysAgo === 0 ? "Dnes" : daysAgo === 1 ? "Včera" : `Pred ${daysAgo} dňami`}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-success">
                    <CheckIcon className="w-3.5 h-3.5" />
                    Predané
                </span>
            </div>
        </div>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}
