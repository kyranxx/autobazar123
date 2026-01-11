"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface ComparisonCar {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    fuel: string;
    transmission: string;
    power: number;
    image: string;
    features: string[];
}

const COMPARISON_STORAGE_KEY = "autobazar123_comparison";
const MAX_COMPARE_ITEMS = 3;

// Hook to manage comparison list
export function useComparison() {
    const [items, setItems] = useState<ComparisonCar[]>(() => {
        // Initialize from localStorage during first render (client-side only)
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(COMPARISON_STORAGE_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return [];
                }
            }
        }
        return [];
    });
    const [isOpen, setIsOpen] = useState(false);

    const addToComparison = (car: ComparisonCar) => {
        setItems((prev) => {
            if (prev.length >= MAX_COMPARE_ITEMS) {
                alert(`Môžete porovnať maximálne ${MAX_COMPARE_ITEMS} vozidlá`);
                return prev;
            }
            if (prev.find((c) => c.id === car.id)) {
                return prev; // Already in list
            }
            const newItems = [...prev, car];
            localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(newItems));
            return newItems;
        });
    };

    const removeFromComparison = (carId: string) => {
        setItems((prev) => {
            const newItems = prev.filter((c) => c.id !== carId);
            localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(newItems));
            return newItems;
        });
    };

    const clearComparison = () => {
        setItems([]);
        localStorage.removeItem(COMPARISON_STORAGE_KEY);
        setIsOpen(false);
    };

    const isInComparison = (carId: string) => items.some((c) => c.id === carId);

    return {
        items,
        isOpen,
        setIsOpen,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        count: items.length,
    };
}

// Floating comparison button
export function ComparisonFloatingButton({
    count,
    onClick,
}: {
    count: number;
    onClick: () => void;
}) {
    if (count === 0) return null;

    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3 rounded-full bg-accent text-white shadow-lg hover:bg-accent-hover transition-all animate-bounce-subtle"
        >
            <span className="text-lg">⚖️</span>
            <span className="font-semibold">Porovnať ({count})</span>
        </button>
    );
}

// Comparison modal
export function ComparisonModal({
    items,
    onClose,
    onRemove,
    onClear,
}: {
    items: ComparisonCar[];
    onClose: () => void;
    onRemove: (id: string) => void;
    onClear: () => void;
}) {
    if (items.length === 0) return null;

    // Comparison specs
    const specs = [
        { label: "Ročník", key: "year" as const },
        { label: "Cena", key: "price" as const, format: (v: number) => `${v.toLocaleString()} €` },
        { label: "Kilometre", key: "mileage" as const, format: (v: number) => `${v.toLocaleString()} km` },
        { label: "Palivo", key: "fuel" as const },
        { label: "Prevodovka", key: "transmission" as const },
        { label: "Výkon", key: "power" as const, format: (v: number) => `${v} kW` },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold text-primary">Porovnanie vozidiel</h2>
                        <p className="text-sm text-secondary">{items.length} vozidlá</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClear}
                            className="px-4 py-2 text-sm text-error hover:bg-error/5 rounded-lg"
                        >
                            Vymazať všetko
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full hover:bg-surface flex items-center justify-center"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        {/* Car headers */}
                        <thead>
                            <tr>
                                <th className="p-4 text-left font-medium text-secondary w-40">Vozidlo</th>
                                {items.map((car) => (
                                    <th key={car.id} className="p-4 text-center min-w-[200px]">
                                        <div className="relative">
                                            <button
                                                onClick={() => onRemove(car.id)}
                                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white text-xs hover:bg-error/90"
                                            >
                                                ✕
                                            </button>
                                            <div className="relative w-full h-32 mb-3">
                                                <Image
                                                    src={car.image}
                                                    alt={`${car.brand} ${car.model}`}
                                                    fill
                                                    sizes="200px"
                                                    className="object-cover rounded-lg"
                                                />
                                            </div>
                                            <Link
                                                href={`/auto/${car.id}`}
                                                className="font-semibold text-primary hover:text-accent"
                                            >
                                                {car.brand} {car.model}
                                            </Link>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Specs rows */}
                        <tbody>
                            {specs.map((spec, idx) => (
                                <tr key={spec.key} className={idx % 2 === 0 ? "bg-surface/50" : ""}>
                                    <td className="p-4 font-medium text-secondary">{spec.label}</td>
                                    {items.map((car) => {
                                        const value = car[spec.key];
                                        const formatted = spec.format ? spec.format(value as number) : value;
                                        return (
                                            <td key={car.id} className="p-4 text-center text-primary">
                                                {formatted}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}

                            {/* Features row */}
                            <tr className="bg-surface/50">
                                <td className="p-4 font-medium text-secondary">Výbava</td>
                                {items.map((car) => (
                                    <td key={car.id} className="p-4 text-center">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {car.features.slice(0, 5).map((f) => (
                                                <span
                                                    key={f}
                                                    className="px-2 py-0.5 text-xs rounded bg-accent/10 text-accent"
                                                >
                                                    {f}
                                                </span>
                                            ))}
                                            {car.features.length > 5 && (
                                                <span className="text-xs text-secondary">
                                                    +{car.features.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
                    >
                        Zavrieť porovnanie
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add to comparison button for car cards
export function AddToCompareButton({
    car,
    onAdd,
    onRemove,
    isInComparison,
}: {
    car: ComparisonCar;
    onAdd: (car: ComparisonCar) => void;
    onRemove: (id: string) => void;
    isInComparison: boolean;
}) {
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isInComparison) {
                    onRemove(car.id);
                } else {
                    onAdd(car);
                }
            }}
            className={`p-2 rounded-lg transition-colors ${isInComparison
                ? "bg-accent text-white"
                : "bg-surface text-secondary hover:text-accent hover:bg-accent/10"
                }`}
            title={isInComparison ? "Odstrániť z porovnania" : "Pridať do porovnania"}
        >
            ⚖️
        </button>
    );
}
