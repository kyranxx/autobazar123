"use client";

import React, { useState, useMemo } from "react";
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
        <section className="relative py-20 bg-[#0f172a] overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container-main relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/20 rounded-full text-accent text-xs font-bold uppercase tracking-wider mb-4 animate-fade-in">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            Live Market Activity
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-display font-medium text-white mb-4">
                            Just Sold
                        </h2>
                        <p className="text-lg text-gray-400 max-w-lg font-light">
                            These vehicles found new owners. Join thousands of satisfied customers today.
                        </p>
                    </div>

                    <Link
                        href="/pridat-inzerat"
                        className="btn btn-accent px-6 py-3 rounded-xl shadow-lg hover:shadow-accent/20 hover:scale-105 transition-all text-sm font-bold"
                    >
                        Sell your car
                    </Link>
                </div>

                {/* Sold Cars Grid */}
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
    const [now] = useState(() => Date.now());
    const daysAgo = useMemo(() => Math.floor(
        (now - new Date(car.soldAt).getTime()) / (1000 * 60 * 60 * 24)
    ), [car.soldAt, now]);

    return (
        <div
            className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-accent/50 hover:bg-white/10 transition-all duration-300 flex items-center gap-4 animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex-shrink-0 w-20 h-20 relative rounded-xl overflow-hidden bg-gray-800 border border-white/5 shadow-inner">
                {car.image ? (
                    <Image
                        src={car.image}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        sizes="80px"
                        className="object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">
                        🚗
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold font-display text-white truncate group-hover:text-accent transition-colors">
                    {car.brand} {car.model}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {car.year} • {car.location}
                </p>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-white/90 tabular-nums">
                        {formatCurrency(car.price)}
                    </p>
                    <span className="text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                        {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`}
                    </span>
                </div>
            </div>

            {/* Sold Stamp */}
            <div className="absolute right-2 top-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <CheckBadgeIcon className="w-5 h-5 text-accent/50 group-hover:text-accent" />
            </div>
        </div>
    );
}
