import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE = readFileSync(
  path.resolve(process.cwd(), "src/components/home/HomePageShell.tsx"),
  "utf8",
);

describe("homepage hero mascot contract", () => {
  it("keeps the car background and uses the approved key-holding mascot as a separate layer", () => {
    expect(SOURCE).toContain(
      'const HOME_HERO_BACKGROUND_SRC = "/brand/autoninja/homepage-hero-car-studio-v1.webp"',
    );
    expect(SOURCE).toContain(
      'const HOME_HERO_MASCOT_SRC = "/brand/autoninja/mascot-leaning-key-hero-v2.webp"',
    );
    expect(SOURCE).not.toContain("homepage-hero-ninja-leisure-v2.webp");
    expect(SOURCE).not.toContain("mascot-steering-wheel-hero-v1.webp");
    expect(SOURCE).toContain("object-cover object-[64%_center]");
    expect(SOURCE).toContain("object-contain object-center");
    expect(SOURCE).toContain("bottom-[5.75rem]");
    expect(SOURCE).toContain("top-3");
  });

  it("ships transparent masters and optimized production assets for both layers", () => {
    const assetRoot = path.resolve(process.cwd(), "public/brand/autoninja");

    expect(existsSync(path.join(assetRoot, "homepage-hero-car-studio-v1.png"))).toBe(true);
    expect(existsSync(path.join(assetRoot, "homepage-hero-car-studio-v1.webp"))).toBe(true);
    expect(existsSync(path.join(assetRoot, "mascot-leaning-key-hero-v2.png"))).toBe(true);
    expect(existsSync(path.join(assetRoot, "mascot-leaning-key-hero-v2.webp"))).toBe(true);
  });
});
