"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { HOME_THEME, withAlpha } from "@/components/home/theme";
import { BRAND_THEME } from "@/lib/theme/brand";

function ThemePreviewShellContent({
  children,
}: {
  children: ReactNode;
  scopeLabel: string;
}) {
  const themeVars = useMemo(
    () =>
      ({
        "--preview-brand": HOME_THEME.brand,
        "--preview-link": HOME_THEME.link,
        "--preview-cta": HOME_THEME.cta,
        "--preview-cta-text": HOME_THEME.ctaText,
        "--preview-soft-surface": HOME_THEME.softSurface,
        "--color-primary": BRAND_THEME.primary,
        "--color-primary-hover": BRAND_THEME.primaryHover,
        "--color-primary-foreground": BRAND_THEME.primaryForeground,
        "--color-accent": BRAND_THEME.accent,
        "--color-accent-hover": BRAND_THEME.accentHover,
        "--color-accent-foreground": BRAND_THEME.accentForeground,
        "--color-accent-subtle": BRAND_THEME.accentSubtle,
        "--color-digital": HOME_THEME.link,
        "--color-digital-subtle": withAlpha(HOME_THEME.link, 0.18),
        "--color-success": BRAND_THEME.success,
        "--color-success-subtle": withAlpha(BRAND_THEME.success, 0.15),
        "--color-error": BRAND_THEME.error,
        "--color-error-subtle": withAlpha(BRAND_THEME.error, 0.14),
        "--color-border-focus": HOME_THEME.link,
        "--color-ring": HOME_THEME.cta,
        "--color-background-muted": withAlpha(HOME_THEME.brand, 0.06),
      }) as CSSProperties,
    [],
  );

  return (
    <div
      style={themeVars}
      className="bg-[var(--preview-soft-surface)] selection:bg-[var(--preview-cta)] selection:text-[var(--preview-cta-text)]"
    >
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
