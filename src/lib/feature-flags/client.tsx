"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

type FlagValues = Record<string, boolean>;

interface FeatureFlagContextValue {
  flags: FlagValues;
  isLoading: boolean;
  isEnabled: (flagKey: string) => boolean;
  refetch: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);
const EMPTY_FLAGS: FlagValues = Object.freeze({}) as FlagValues;

function hasAnyFlags(flags: FlagValues): boolean {
  return Object.keys(flags).length > 0;
}

interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: FlagValues;
}

export function FeatureFlagProvider({
  children,
  initialFlags = EMPTY_FLAGS,
}: FeatureFlagProviderProps) {
  const hasInitialFlags = hasAnyFlags(initialFlags);
  const [fetchedFlags, setFetchedFlags] = useState<FlagValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFlags = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/flags");
      if (response.ok) {
        const data = (await response.json()) as { flags?: FlagValues };
        setFetchedFlags(data.flags ?? EMPTY_FLAGS);
      }
    } catch (error) {
      console.error("Failed to fetch feature flags:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialFlags && fetchedFlags === null) {
      void fetchFlags();
    }
  }, [fetchFlags, fetchedFlags, hasInitialFlags]);

  const flags = fetchedFlags ?? initialFlags;

  const isEnabled = useCallback(
    (flagKey: string): boolean => flags[flagKey] ?? false,
    [flags],
  );

  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags,
      isLoading,
      isEnabled,
      refetch: fetchFlags,
    }),
    [fetchFlags, flags, isEnabled, isLoading],
  );

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagProvider",
    );
  }
  return context;
}

export function useFeatureFlag(flagKey: string): {
  enabled: boolean;
  isLoading: boolean;
} {
  const { isEnabled, isLoading } = useFeatureFlags();
  return {
    enabled: isEnabled(flagKey),
    isLoading,
  };
}
