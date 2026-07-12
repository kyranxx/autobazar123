import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HOME_THEME } from "@/components/home/theme";
import { BRAND_THEME } from "@/lib/theme/brand";

const GLOBAL_CSS = readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8");

function getHexToken(tokenName: string): string {
  const escapedToken = tokenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = GLOBAL_CSS.match(new RegExp(`${escapedToken}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`));

  if (!match) {
    throw new Error(`Unable to resolve token "${tokenName}" from src/app/globals.css`);
  }

  return match[1].toLowerCase();
}

describe("brand theme token sync", () => {
  it("locks the approved accessible orange brand accent", () => {
    expect(BRAND_THEME.accent).toBe("#C95010");
    expect(BRAND_THEME.accentHover).toBe("#AD4108");
    expect(BRAND_THEME.accentForeground).toBe("#FFFFFF");
  });

  it("keeps the shared TypeScript theme aligned with global CSS tokens", () => {
    expect(getHexToken("--color-primary")).toBe(BRAND_THEME.primary.toLowerCase());
    expect(getHexToken("--color-primary-hover")).toBe(BRAND_THEME.primaryHover.toLowerCase());
    expect(getHexToken("--color-primary-foreground")).toBe(
      BRAND_THEME.primaryForeground.toLowerCase(),
    );
    expect(getHexToken("--color-accent")).toBe(BRAND_THEME.accent.toLowerCase());
    expect(getHexToken("--color-accent-hover")).toBe(BRAND_THEME.accentHover.toLowerCase());
    expect(getHexToken("--color-accent-foreground")).toBe(
      BRAND_THEME.accentForeground.toLowerCase(),
    );
    expect(getHexToken("--color-accent-subtle")).toBe(
      BRAND_THEME.accentSubtle.toLowerCase(),
    );
    expect(getHexToken("--color-background-muted")).toBe(BRAND_THEME.softSurface.toLowerCase());
    expect(getHexToken("--color-success")).toBe(BRAND_THEME.success.toLowerCase());
    expect(getHexToken("--color-error")).toBe(BRAND_THEME.error.toLowerCase());
  });

  it("keeps homepage theme values pinned to the shared brand palette", () => {
    expect(HOME_THEME.brand).toBe(BRAND_THEME.success);
    expect(HOME_THEME.link).toBe(BRAND_THEME.success);
    expect(HOME_THEME.cta).toBe(BRAND_THEME.accent);
    expect(HOME_THEME.ctaText).toBe(BRAND_THEME.accentForeground);
    expect(HOME_THEME.softSurface).toBe(BRAND_THEME.softSurface);
  });
});
