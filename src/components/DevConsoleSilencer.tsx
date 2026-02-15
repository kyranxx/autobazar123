"use client";

import { useEffect } from "react";

const SUPPRESSED_WARN_PREFIXES = [
  "[react-instantsearch-nextjs] InstantSearchNext relies on experimental APIs",
];

export function DevConsoleSilencer() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const originalWarn = console.warn;

    console.warn = (...args: unknown[]) => {
      const first = args[0];
      if (typeof first === "string") {
        for (const prefix of SUPPRESSED_WARN_PREFIXES) {
          if (first.startsWith(prefix)) return;
        }
      }
      originalWarn(...args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null;
}

