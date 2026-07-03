import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("root layout source contract", () => {
  it("keeps map-only Leaflet CSS out of the global layout bundle", () => {
    const root = process.cwd();
    const layoutSource = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
    const simpleMapSource = readFileSync(path.join(root, "src/components/SimpleMap.tsx"), "utf8");

    expect(layoutSource).not.toContain('import "leaflet/dist/leaflet.css"');
    expect(simpleMapSource).toContain('import "leaflet/dist/leaflet.css"');
  });

  it("does not emit speculative root preconnect hints before the homepage needs them", () => {
    const root = process.cwd();
    const layoutSource = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
    const nextConfigSource = readFileSync(path.join(root, "next.config.ts"), "utf8");

    expect(layoutSource).not.toContain('rel="preconnect"');
    expect(nextConfigSource).not.toContain("rel=preconnect");
  });
});
