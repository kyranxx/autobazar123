'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type FlagValues = Record<string, boolean>;

interface FeatureFlagContextValue {
    flags: FlagValues;
    isLoading: boolean;
    isEnabled: (flagKey: string) => boolean;
    refetch: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

interface FeatureFlagProviderProps {
    children: ReactNode;
    initialFlags?: FlagValues;
}

export function FeatureFlagProvider({ children, initialFlags = {} }: FeatureFlagProviderProps) {
    const [flags, setFlags] = useState<FlagValues>(initialFlags);
    const [isLoading, setIsLoading] = useState(!Object.keys(initialFlags).length);

    const fetchFlags = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/flags');
            if (response.ok) {
                const data = await response.json();
                setFlags(data.flags);
            }
        } catch (error) {
            console.error('Failed to fetch feature flags:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!Object.keys(initialFlags).length) {
            fetchFlags();
        }
    }, [initialFlags]);

    const isEnabled = (flagKey: string): boolean => {
        return flags[flagKey] ?? false;
    };

    const value: FeatureFlagContextValue = {
        flags,
        isLoading,
        isEnabled,
        refetch: fetchFlags,
    };

    return (
        <FeatureFlagContext.Provider value={value}>
            {children}
        </FeatureFlagContext.Provider>
    );
}

export function useFeatureFlags(): FeatureFlagContextValue {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }
    return context;
}

export function useFeatureFlag(flagKey: string): { enabled: boolean; isLoading: boolean } {
    const { isEnabled, isLoading } = useFeatureFlags();
    return {
        enabled: isEnabled(flagKey),
        isLoading,
    };
}
