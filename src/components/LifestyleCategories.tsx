"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

export default function LifestyleCategories() {
    const t = useTranslations("sections");
    const tBody = useTranslations("bodyType");

    const categories = [
        {
            id: "city",
            name: tBody("hatchback"),
            icon: CityCarIcon,
            href: "/auta?kategoria=mestske",
        },
        {
            id: "family",
            name: tBody("wagon"),
            icon: FamilyCarIcon,
            href: "/auta?kategoria=rodinne",
        },
        {
            id: "suv",
            name: tBody("suv"),
            icon: SuvCarIcon,
            href: "/auta?kategoria=suv",
        },
        {
            id: "luxury",
            name: tBody("coupe"),
            icon: LuxuryCarIcon,
            href: "/auta?kategoria=luxusne",
        },
        {
            id: "electric",
            name: tBody("convertible"),
            icon: ElectricCarIcon,
            href: "/auta?kategoria=elektricke",
        },
    ];

    return (
        <section className="py-24 border-y border-border/40 bg-surface/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8 text-center md:text-left">
                    <div className="max-w-xl">
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-3">
                            Hľadať podľa kategórie
                        </h2>
                        <p className="text-secondary opacity-60 font-medium text-sm">
                            Vyberte si auto, ktoré dokonale sadne do vášho životného štýlu.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={category.href}
                            className="group flex flex-col items-center p-6 bg-white border border-border/60 rounded-2xl hover:border-accent/40 hover:shadow-premium transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Color Circle Background */}
                            <div className="w-24 h-24 rounded-full bg-surface group-hover:bg-accent/10 flex items-center justify-center text-primary group-hover:text-accent-foreground transition-all duration-300 mb-6">
                                <div className="w-16 h-12">
                                    <category.icon className="w-full h-full" />
                                </div>
                            </div>

                            <h3 className="text-xs font-bold text-primary text-center uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                                {category.name}
                            </h3>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Custom Illustrated Car Icons (Noble Minimalist Style)
// Accent color applied to details

function CityCarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 48" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M10 34h44l-4-14H14L10 34z" />
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M14 20l3-9h30l3 9M10 34v6h8M54 34v6h-8M24 40h16" />
            <circle cx="16" cy="34" r="5" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
            <circle cx="48" cy="34" r="5" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
        </svg>
    );
}

function FamilyCarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 48" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 34h56l-3-12H7L4 34z" />
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 22l4-10h42l4 10M4 34v6h8M60 34v6h-8M18 40h28" />
            <path strokeWidth="1.5" strokeLinecap="round" d="M23 12v10M41 12v10" className="opacity-40" />
            <circle cx="14" cy="34" r="5" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
            <circle cx="50" cy="34" r="5" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
        </svg>
    );
}

function SuvCarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 48" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 34h52l-3-14H9L6 34z" />
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 20l4-12h38l4 12M6 34v7h9M58 34v7h-9M21 41h22" />
            <circle cx="15" cy="34" r="6" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
            <circle cx="49" cy="34" r="6" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
            <path strokeWidth="1.5" strokeLinecap="round" d="M60 25h2M2 25h2" />
        </svg>
    );
}

function LuxuryCarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 48" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2 36h60l-5-10H7L2 36z" />
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 26l8-8h34l8 8M2 36v5h10M62 36v5h-10M18 41h28" />
            <circle cx="14" cy="36" r="5" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
            <circle cx="50" cy="36" r="5" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
        </svg>
    );
}

function ElectricCarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 48" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 34h48l-4-10H12L8 34z" />
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 24l5-8h26l-4 8M8 34v6h8M56 34v6h-8M22 40h20" />
            <circle cx="16" cy="34" r="5" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
            <circle cx="48" cy="34" r="5" strokeWidth="1.5" className="fill-white group-hover:fill-accent transition-colors duration-300" />
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M36 6l-4 6h4l-4 6" className="text-accent fill-accent" />
        </svg>
    );
}
