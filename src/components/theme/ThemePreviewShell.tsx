"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";

const PREVIEW_THEME = {
  title: "Forest + Sunset Orange",
  brand: "#1F4D3B",
  link: "#1F4D3B",
  cta: "#E8621A",
  ctaText: "#FFFFFF",
  success: "#1E7B47",
  danger: "#B63B31",
  softSurface: "#F3F7F2",
};

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const fullHex = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  const red = Number.parseInt(fullHex.slice(0, 2), 16);
  const green = Number.parseInt(fullHex.slice(2, 4), 16);
  const blue = Number.parseInt(fullHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function ThemePreviewShellContent({
  children,
  scopeLabel,
}: {
  children: ReactNode;
  scopeLabel: string;
}) {
  const themeVars = useMemo(
    () =>
      ({
        "--preview-brand": PREVIEW_THEME.brand,
        "--preview-link": PREVIEW_THEME.link,
        "--preview-cta": PREVIEW_THEME.cta,
        "--preview-cta-text": PREVIEW_THEME.ctaText,
        "--preview-soft-surface": PREVIEW_THEME.softSurface,
        "--color-primary": PREVIEW_THEME.brand,
        "--color-primary-hover": "#163a2d",
        "--color-primary-foreground": "#ffffff",
        "--color-accent": PREVIEW_THEME.cta,
        "--color-accent-hover": "#cf5716",
        "--color-accent-foreground": PREVIEW_THEME.ctaText,
        "--color-accent-subtle": withAlpha(PREVIEW_THEME.cta, 0.14),
        "--color-digital": PREVIEW_THEME.link,
        "--color-digital-subtle": withAlpha(PREVIEW_THEME.link, 0.18),
        "--color-success": PREVIEW_THEME.success,
        "--color-success-subtle": withAlpha(PREVIEW_THEME.success, 0.15),
        "--color-error": PREVIEW_THEME.danger,
        "--color-error-subtle": withAlpha(PREVIEW_THEME.danger, 0.14),
        "--color-border-focus": PREVIEW_THEME.link,
        "--color-ring": PREVIEW_THEME.cta,
        "--color-background-muted": withAlpha(PREVIEW_THEME.brand, 0.06),
      }) as CSSProperties,
    [],
  );

  return (
    <div
      style={themeVars}
      className="bg-[var(--preview-soft-surface)] selection:bg-[var(--preview-cta)] selection:text-[var(--preview-cta-text)]"
    >
      <section className="w-full bg-[var(--preview-brand)] text-white" aria-label={`Palette preview ${scopeLabel}: ${PREVIEW_THEME.title}`}>
        <div className="container-main py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide">
            <span className="rounded-full bg-white/15 px-2.5 py-1">Forest + Sunset Orange active</span>
            <div className="flex items-center gap-4 text-white/90">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-success)" }} /> Success</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-error)" }} /> Danger</span>
            </div>
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}

export default function ThemePreviewShell(props: { children: ReactNode; scopeLabel: string }) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_THEME_PREVIEW !== "true") {
    return <>{props.children}</>;
  }

  return <ThemePreviewShellContent {...props} />;
}
