import { afterEach, describe, expect, it } from "vitest";
import {
  generateSrcSet,
  getHeroImageUrl,
  getThumbnailUrl,
  optimizeCloudflareImage,
  preloadImage,
} from "./image-optimizer";

const CF_URL = "https://imagedelivery.net/account/image-id/public";
const NON_CF_URL = "https://example.com/car.jpg";

afterEach(() => {
  document
    .querySelectorAll('link[rel=\"preload\"][as=\"image\"]')
    .forEach((node) => node.remove());
});

describe("optimizeCloudflareImage", () => {
  it("returns non-cloudflare URLs unchanged", () => {
    expect(optimizeCloudflareImage(NON_CF_URL)).toBe(NON_CF_URL);
  });

  it("replaces the named variant with Cloudflare flexible options", () => {
    const optimized = optimizeCloudflareImage(CF_URL);

    expect(optimized).toBe(
      "https://imagedelivery.net/account/image-id/quality=80,format=auto,fit=scale-down",
    );
  });

  it("removes obsolete query params instead of sending ignored options", () => {
    const optimized = optimizeCloudflareImage(`${CF_URL}?v=1`, { width: 640 });
    expect(optimized).toBe(
      "https://imagedelivery.net/account/image-id/width=640,quality=80,format=auto,fit=scale-down",
    );
  });

  it("leaves signed Cloudflare URLs unchanged", () => {
    const signedUrl = `${CF_URL}?exp=123&sig=signature`;
    expect(optimizeCloudflareImage(signedUrl, { width: 640 })).toBe(signedUrl);
  });
});

describe("responsive image helpers", () => {
  it("generates srcset entries for requested widths", () => {
    const srcSet = generateSrcSet(CF_URL, [320, 640]);
    expect(srcSet).toContain("320w");
    expect(srcSet).toContain("640w");
    expect(srcSet).toContain("format=webp");
    expect(srcSet).not.toContain("?");
  });

  it("builds thumbnail URL with cover crop and webp", () => {
    const thumbnail = getThumbnailUrl(CF_URL, "sm");
    expect(thumbnail).toContain(
      "/width=200,height=200,quality=85,format=webp,fit=cover",
    );
  });

  it("builds hero URL with banner dimensions", () => {
    const hero = getHeroImageUrl(CF_URL);
    expect(hero).toContain(
      "/width=1920,height=600,quality=85,format=webp,fit=cover",
    );
  });
});

describe("preloadImage", () => {
  it("injects a preload link into document head", () => {
    preloadImage(CF_URL);

    const links = document.querySelectorAll('link[rel=\"preload\"]');
    expect(links.length).toBeGreaterThan(0);

    const link = links[links.length - 1] as HTMLLinkElement;
    expect(link.getAttribute("href")).toContain("/quality=80,format=webp");
    expect(link.imageSrcset || link.getAttribute("imagesrcset")).toContain("320w");
    expect(link.imageSizes || link.getAttribute("imagesizes")).toContain("100vw");
  });
});
