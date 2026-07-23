import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Navbar source contract", () => {
  it("does not use low-contrast mint for the logo on white header surfaces", () => {
    const source = readFileSync(path.join(process.cwd(), "src/components/Navbar.tsx"), "utf8");

    expect(source).not.toContain('prominent ? "text-[var(--color-mint)]"');
  });

  it("does not speculatively prefetch header navigation links", () => {
    const source = readFileSync(path.join(process.cwd(), "src/components/Navbar.tsx"), "utf8");

    expect(source).toContain("prefetch={false}");
  });

  it("keeps the shared header white with the black and orange wordmark", () => {
    const source = readFileSync(path.join(process.cwd(), "src/components/Navbar.tsx"), "utf8");

    expect(source).toContain("border-black/10 bg-white text-text-primary");
    expect(source).not.toContain("bg-background-dark");
    expect(source).toContain("inverse={false}");
    expect(source).toContain("responsiveInverse={false}");
    expect(source).toContain('prominent');
    expect(source).toContain('"text-xl text-text-primary md:text-[1.85rem]"');
  });

  it("keeps the mobile menu compact without a separate title bar", () => {
    const source = readFileSync(path.join(process.cwd(), "src/components/Navbar.tsx"), "utf8");

    expect(source).not.toContain('menuTitle={tNav("menuTitle")}');
    expect(source).toContain("h-svh w-[86%] max-w-[320px]");
    expect(source).toContain("min-h-0 flex-1 overflow-y-auto");
    expect(source).not.toContain("LanguageSwitcher");
    expect(source).toContain("flex min-h-11 items-center rounded-lg");
  });
});
