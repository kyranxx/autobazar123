"use client";

import Link from "next/link";

const categories = [
    {
        id: "city",
        name: "Mestské",
        description: "Kompaktné a úsporné",
        icon: CityIcon,
        gradient: "from-blue-500 to-cyan-400",
        href: "/auta?kategoria=mestske",
    },
    {
        id: "family",
        name: "Rodinné",
        description: "Priestor pre všetkých",
        icon: FamilyIcon,
        gradient: "from-emerald-500 to-teal-400",
        href: "/auta?kategoria=rodinne",
    },
    {
        id: "suv",
        name: "SUV",
        description: "Sila a komfort",
        icon: SUVIcon,
        gradient: "from-orange-500 to-amber-400",
        href: "/auta?kategoria=suv",
    },
    {
        id: "luxury",
        name: "Luxusné",
        description: "Najvyššia trieda",
        icon: LuxuryIcon,
        gradient: "from-violet-500 to-purple-400",
        href: "/auta?kategoria=luxusne",
    },
    {
        id: "electric",
        name: "Elektrické",
        description: "Budúcnosť je tu",
        icon: ElectricIcon,
        gradient: "from-green-500 to-lime-400",
        href: "/auta?kategoria=elektricke",
    },
];

export default function LifestyleCategories() {
    return (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                    Nájdite auto podľa životného štýlu
                </h2>
                <p className="mt-3 text-secondary max-w-xl mx-auto">
                    Vyberáme tie najlepšie autá pre každú príležitosť
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
                {categories.map((category, index) => (
                    <Link
                        key={category.id}
                        href={category.href}
                        className={`group relative flex flex-col items-center p-4 rounded-xl border border-border bg-white shadow-sm hover:border-accent/40 hover:shadow-lg transition-all duration-300 opacity-0 animate-slide-in-up stagger-${index + 1}`}
                    >
                        {/* Icon Container */}
                        <div
                            className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                            <category.icon />
                        </div>

                        {/* Text */}
                        <h3 className="mt-3 text-sm font-semibold text-primary">
                            {category.name}
                        </h3>
                        <p className="mt-1 text-xs text-secondary text-center">
                            {category.description}
                        </p>

                        {/* Hover Arrow */}
                        <span className="absolute bottom-3 right-3 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-accent">
                            →
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

// Icons
function CityIcon() {
    return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );
}

function FamilyIcon() {
    return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );
}

function SUVIcon() {
    return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21h1.5M14.5 21H16M5 17h14a2 2 0 002-2v-3a2 2 0 00-2-2h-1l-2-4H8L6 10H5a2 2 0 00-2 2v3a2 2 0 002 2zm2.5 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
    );
}

function LuxuryIcon() {
    return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
    );
}

function ElectricIcon() {
    return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15H4.5v-4.5zM3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18zm.75-9h.008v.008H4.5V9zm0 3h.008v.008H4.5V12zm0 3h.008v.008H4.5V15zm3-6h.008v.008H7.5V9zm0 3h.008v.008H7.5V12zm0 3h.008v.008H7.5V15zm3-6h.008v.008h-.008V9zm0 3h.008v.008h-.008V12zm0 3h.008v.008h-.008V15zm3-3h.008v.008h-.008V12z" />
        </svg>
    );
}
