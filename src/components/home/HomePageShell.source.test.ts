import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE = readFileSync(
  path.resolve(process.cwd(), "src/components/home/HomePageShell.tsx"),
  "utf8",
);

describe("homepage hero mascot contract", () => {
  it("uses the approved steering-wheel mascot and keeps its full silhouette visible", () => {
    expect(SOURCE).toContain(
      'const HOME_HERO_MASCOT_SRC = "/brand/autoninja/mascot-steering-wheel-hero-v1.webp"',
    );
    expect(SOURCE).not.toContain("homepage-hero-ninja-leisure-v2.webp");
    expect(SOURCE).toContain("object-contain object-center");
    expect(SOURCE).toContain("bottom-[5.75rem]");
    expect(SOURCE).toContain("top-3");
  });

  it("ships both the transparent master and optimized production asset", () => {
    const assetRoot = path.resolve(process.cwd(), "public/brand/autoninja");

    expect(existsSync(path.join(assetRoot, "mascot-steering-wheel-hero-v1.png"))).toBe(true);
    expect(existsSync(path.join(assetRoot, "mascot-steering-wheel-hero-v1.webp"))).toBe(true);
  });
});
