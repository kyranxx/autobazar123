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
    error = false,
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
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg bg-background-secondary border border-border-subtle text-left transition-colors outline-none shadow-xs min-h-[44px]",
                    "text-sm text-text-primary",
                    isOpen ? "border-border-focus ring-2 ring-digital-subtle" : "hover:border-border-strong",
                    error && "border-error",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                <span className={cn("truncate flex-1", !selectedOption && "text-text-muted")}>
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
                        "w-4 h-4 ml-2 text-text-tertiary transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-2 overflow-hidden rounded-lg border border-border-subtle bg-background-secondary shadow-sm max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                        {placeholder && (
                            <button
                                type="button"
                                onClick={() => handleSelect("")}
                                className={cn(
                                    "w-full flex items-center px-3 py-2.5 rounded-md text-sm text-left transition-colors",
                                    !value ? "bg-accent-subtle text-accent font-semibold" : "text-text-secondary hover:bg-background-tertiary"
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
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm text-left transition-colors",
                                    value === option.value
                                        ? "bg-accent-subtle text-accent font-semibold"
                                        : "text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                                )}
                            >
                                <span>{option.label}</span>
                                {option.count !== undefined && (
                                    <span className="opacity-40 text-xs">({option.count})</span>
                                )}
                            </button>
                        ))}

                        {options.length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-text-tertiary">
                                Žiadne možnosti
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
