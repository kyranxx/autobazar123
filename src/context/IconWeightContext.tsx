"use client";

import { createContext, use, useCallback, useState, type ReactNode } from "react";

export type IconWeight = "regular" | "bold" | "fill" | "duotone";

const STORAGE_KEY = "icon-weight-preference";

function isValidWeight(value: string): value is IconWeight {
  return ["regular", "bold", "fill", "duotone"].includes(value);
}

function getInitialWeight(): IconWeight {
  if (typeof window === "undefined") return "regular";
  try {
    const urlParam = new URLSearchParams(window.location.search).get("icons");
    if (urlParam && isValidWeight(urlParam)) return urlParam;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidWeight(stored)) return stored;
  } catch {
    // ignore
  }
  return "regular";
}

const IconWeightContext = createContext<{
  weight: IconWeight;
  setWeight: (w: IconWeight) => void;
}>({
  weight: "regular",
  setWeight: () => {},
});

export function useIconWeight() {
  return use(IconWeightContext);
}

export function IconWeightProvider({ children }: { children: ReactNode }) {
  const [weight, setWeightState] = useState<IconWeight>(getInitialWeight);

  const setWeight = useCallback((w: IconWeight) => {
    setWeightState(w);
    try {
      localStorage.setItem(STORAGE_KEY, w);
    } catch {
      // ignore
    }
  }, []);

  return (
    <IconWeightContext.Provider value={{ weight, setWeight }}>
      {children}
    </IconWeightContext.Provider>
  );
}
