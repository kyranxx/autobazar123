"use client";

import { useState } from "react";
import { useIconWeight, type IconWeight } from "@/context/IconWeightContext";

const WEIGHTS: { value: IconWeight; label: string }[] = [
  { value: "regular", label: "Regular" },
  { value: "bold", label: "Bold" },
  { value: "fill", label: "Fill" },
  { value: "duotone", label: "Duotone" },
];

export default function IconWeightSwitcher() {
  const { weight, setWeight } = useIconWeight();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[300] flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-background p-1.5 shadow-lg animate-modal-in">
          {WEIGHTS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => {
                setWeight(w.value);
                setOpen(false);
              }}
              className={`rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${
                weight === w.value
                  ? "bg-accent text-accent-foreground"
                  : "text-text-secondary hover:bg-background-tertiary"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-border bg-background-secondary px-4 py-2 text-sm font-semibold text-text-primary shadow-md backdrop-blur-sm transition-all hover:shadow-lg"
      >
        <span className="flex size-2 rounded-full bg-accent" />
        Icons: {WEIGHTS.find((w) => w.value === weight)?.label}
      </button>
    </div>
  );
}
