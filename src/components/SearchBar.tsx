"use client";

import { useState } from "react";

interface SearchBarProps {
    variant?: "hero" | "compact";
}

export default function SearchBar({ variant = "hero" }: SearchBarProps) {
    const [brand, setBrand] = useState("");
    const [location, setLocation] = useState("");
    const [priceMax, setPriceMax] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement search navigation
        console.log({ brand, location, priceMax });
    };

    if (variant === "compact") {
        return (
            <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 rounded-full border border-border bg-background p-1.5 shadow-sm"
            >
                <label htmlFor="search-compact" className="sr-only">
                    Hľadať autá
                </label>
                <input
                    id="search-compact"
                    name="search"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Hľadať autá..."
                    className="flex-1 bg-transparent px-4 py-2 text-sm placeholder:text-tertiary focus:outline-none"
                />
                <button
                    type="submit"
                    aria-label="Hľadať"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white hover:bg-accent-hover"
                >
                    <SearchIcon />
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSearch} className="w-full">
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-2 shadow-xl md:flex-row md:items-center md:rounded-full">
                {/* Brand & Model */}
                <div className="flex-1 px-5 py-3">
                    <label htmlFor="search-brand" className="block text-[10px] font-bold uppercase tracking-wider text-tertiary">
                        Značka & Model
                    </label>
                    <input
                        id="search-brand"
                        name="brand"
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Napr. Škoda Octavia"
                        className="w-full bg-transparent text-sm font-medium text-primary placeholder:text-secondary focus:outline-none"
                    />
                </div>

                <Divider />

                {/* Location */}
                <div className="flex-1 px-5 py-3">
                    <label htmlFor="search-location" className="block text-[10px] font-bold uppercase tracking-wider text-tertiary">
                        Lokalita
                    </label>
                    <input
                        id="search-location"
                        name="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Celé Slovensko"
                        className="w-full bg-transparent text-sm font-medium text-primary placeholder:text-secondary focus:outline-none"
                    />
                </div>

                <Divider />

                {/* Price */}
                <div className="flex-1 px-5 py-3">
                    <label htmlFor="search-price" className="block text-[10px] font-bold uppercase tracking-wider text-tertiary">
                        Cena do
                    </label>
                    <input
                        id="search-price"
                        name="price"
                        type="text"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        placeholder="Bez limitu"
                        className="w-full bg-transparent text-sm font-medium text-primary placeholder:text-secondary focus:outline-none"
                    />
                </div>

                {/* Search Button */}
                <button
                    type="submit"
                    className="group mt-2 flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-white hover:bg-accent-hover md:mt-0 active:scale-[0.98]"
                >
                    <SearchIcon />
                    <span className="font-semibold">Hľadať</span>
                </button>
            </div>
        </form>
    );
}

function Divider() {
    return <div className="hidden h-10 w-px bg-border md:block" />;
}

function SearchIcon() {
    return (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
        </svg>
    );
}
