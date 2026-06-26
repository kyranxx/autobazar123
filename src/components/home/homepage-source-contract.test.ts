import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("homepage launch design source contract", () => {
  it("keeps the launch hero and frontpage search shell wired", () => {
    const root = process.cwd();
    const shellSource = readFileSync(path.join(root, "src/components/home/HomePageShell.tsx"), "utf8");

    expect(shellSource).toContain("HomeFrontpageSearch");
    expect(shellSource).toContain("/homepage-reference-hero.png");
    expect(shellSource).not.toContain("/hero-forest-champagne.jpg");
    expect(existsSync(path.join(root, "src/components/home/HomeFrontpageSearch.tsx"))).toBe(true);
    expect(existsSync(path.join(root, "public/homepage-reference-hero.png"))).toBe(true);
  });
});
