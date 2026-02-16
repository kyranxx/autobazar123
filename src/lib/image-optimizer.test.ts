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

  it("adds default optimization params to Cloudflare URLs", () => {
    const optimized = optimizeCloudflareImage(CF_URL);

    expect(optimized).toContain("quality=80");
    expect(optimized).toContain("format=auto");
    expect(optimized).toContain("fit=scale-down");
  });

  it("appends params using '&' when URL already has a query string", () => {
    const optimized = optimizeCloudflareImage(`${CF_URL}?v=1`, { width: 640 });
    expect(optimized).toContain("?v=1&");
    expect(optimized).toContain("width=640");
  });
});

describe("responsive image helpers", () => {
  it("generates srcset entries for requested widths", () => {
    const srcSet = generateSrcSet(CF_URL, [320, 640]);
    expect(srcSet).toContain("320w");
    expect(srcSet).toContain("640w");
    expect(srcSet).toContain("format=webp");
  });

  it("builds thumbnail URL with cover crop and webp", () => {
    const thumbnail = getThumbnailUrl(CF_URL, "sm");
    expect(thumbnail).toContain("width=200");
    expect(thumbnail).toContain("height=200");
    expect(thumbnail).toContain("fit=cover");
    expect(thumbnail).toContain("format=webp");
  });

  it("builds hero URL with banner dimensions", () => {
    const hero = getHeroImageUrl(CF_URL);
    expect(hero).toContain("width=1920");
    expect(hero).toContain("height=600");
    expect(hero).toContain("fit=cover");
  });
});

describe("preloadImage", () => {
  it("injects a preload link into document head", () => {
    preloadImage(CF_URL);

    const links = document.querySelectorAll('link[rel=\"preload\"]');
    expect(links.length).toBeGreaterThan(0);

    const link = links[links.length - 1] as HTMLLinkElement;
    expect(link.getAttribute("href")).toContain("format=webp");
    expect(link.imageSrcset || link.getAttribute("imagesrcset")).toContain("320w");
    expect(link.imageSizes || link.getAttribute("imagesizes")).toContain("100vw");
  });
});
