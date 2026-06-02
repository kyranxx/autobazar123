"use client";

import {
  createContext,
  use,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type IconWeight = "regular" | "bold" | "fill" | "duotone";

const STORAGE_KEY = "icon-weight-preference";
const ICON_WEIGHT_CHANGE_EVENT = "autobazar123:icon-weight-change";

function isValidWeight(value: string): value is IconWeight {
  return ["regular", "bold", "fill", "duotone"].includes(value);
}

function getBrowserWeightPreference(): IconWeight | null {
  if (typeof window === "undefined") return null;
  try {
    const urlParam = new URLSearchParams(window.location.search).get("icons");
    if (urlParam && isValidWeight(urlParam)) return urlParam;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidWeight(stored)) return stored;
  } catch {
    // ignore
  }
  return null;
}

function getIconWeightSnapshot(): IconWeight {
  return getBrowserWeightPreference() ?? "regular";
}

function getServerIconWeightSnapshot(): IconWeight {
  return "regular";
}

function subscribeToIconWeightChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const notifyOnStorageChange = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener(ICON_WEIGHT_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", notifyOnStorageChange);

  return () => {
    window.removeEventListener(ICON_WEIGHT_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", notifyOnStorageChange);
  };
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
  const weight = useSyncExternalStore(
    subscribeToIconWeightChanges,
    getIconWeightSnapshot,
    getServerIconWeightSnapshot,
  );

  const setWeight = useCallback((w: IconWeight) => {
    try {
      localStorage.setItem(STORAGE_KEY, w);
      window.dispatchEvent(new Event(ICON_WEIGHT_CHANGE_EVENT));
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
