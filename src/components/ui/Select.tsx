"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { cn } from "@/utils/cn";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export interface SelectOption {
    value: string;
    label: string | ReactNode;
    count?: number;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    error?: boolean;
}

export default function Select({
    value,
    onChange,
    options,
    placeholder = "Vyberte...",
    disabled = false,
    className,
    error = false
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        if (disabled) return;
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/5 border text-left transition-all outline-none",
                    "text-sm text-white",
                    isOpen ? "border-accent ring-4 ring-accent/10" : "border-white/10 hover:border-white/30",
                    error && "border-red-500",
                    disabled && "opacity-50 cursor-not-allowed bg-white/5",
                    className
                )}
            >
                <span className={cn(
                    "truncate flex-1",
                    !selectedOption && "text-white/40"
                )}>
                    {selectedOption ? (
                        <span className="flex items-center justify-between w-full">
                            <span>{selectedOption.label}</span>
                            {selectedOption.count !== undefined && (
                                <span className="opacity-50 ml-2">({selectedOption.count})</span>
                            )}
                        </span>
                    ) : (
                        placeholder
                    )}
                </span>
                <ChevronDownIcon
                    className={cn(
                        "w-4 h-4 ml-2 text-white/40 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                        {placeholder && (
                            <button
                                type="button"
                                onClick={() => handleSelect("")}
                                className={cn(
                                    "w-full flex items-center px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                                    !value ? "bg-accent text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {placeholder}
                            </button>
                        )}

                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                                    value === option.value
                                        ? "bg-accent/20 text-accent font-medium"
                                        : "text-white hover:bg-white/10"
                                )}
                            >
                                <span>{option.label}</span>
                                {option.count !== undefined && (
                                    <span className="opacity-40 text-xs">({option.count})</span>
                                )}
                            </button>
                        ))}

                        {options.length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-white/40">
                                Žiadne možnosti
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
