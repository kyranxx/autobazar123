import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "./robots";

describe("robots", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks all crawlers by default", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_INDEXING_ENABLED", "");

    expect(robots()).toEqual({
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

    const policy = robots();

    expect(policy.rules).toEqual([
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
      }),
    ]);
    expect(policy.sitemap).toBe("https://autobazar123.sk/sitemap.xml");
  });
});
