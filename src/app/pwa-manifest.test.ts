import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type ManifestIcon = {
  src?: string;
  sizes?: string;
  type?: string;
  purpose?: string;
};

describe("PWA manifest", () => {
  it("publishes fixed-size PNG icons for install surfaces", () => {
    const root = process.cwd();
    const manifest = JSON.parse(
      readFileSync(path.join(root, "public/manifest.webmanifest"), "utf8"),
    ) as { icons?: ManifestIcon[] };

    const icons = manifest.icons ?? [];
    expect(icons).toContainEqual(
      expect.objectContaining({
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      }),
    );
    expect(icons).toContainEqual(
      expect.objectContaining({
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      }),
    );
    expect(icons).toContainEqual(
      expect.objectContaining({
        src: "/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: expect.stringContaining("maskable"),
      }),
    );

    for (const src of ["/icon-192.png", "/icon-512.png", "/maskable-icon-512.png"]) {
      expect(existsSync(path.join(root, "public", src.slice(1)))).toBe(true);
    }
  });
});
