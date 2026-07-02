import { afterEach, describe, expect, it, vi } from "vitest";
import robots, { buildRobotsPolicy } from "./robots";
import { MARKET_CONFIGS } from "@/config/markets";

describe("robots", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks all crawlers by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_INDEXING_ENABLED", "");

    await expect(robots()).resolves.toEqual({
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    });
  });

  it("allows public crawling only when indexing is explicitly enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_INDEXING_ENABLED", "true");

    const policy = buildRobotsPolicy(MARKET_CONFIGS.SK, true);

    expect(policy.rules).toEqual([
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
      }),
    ]);
    expect(policy.sitemap).toBe("https://www.autobazar123.sk/sitemap.xml");
  });

  it("uses the market origin for sitemap URLs", () => {
    const policy = buildRobotsPolicy(MARKET_CONFIGS.RO, true);

    expect(policy.sitemap).toBe("https://www.autobazar123.ro/sitemap.xml");
  });
});
