import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("llms.txt route", () => {
  it("returns plain text content with cache headers", async () => {
    const response = GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("cache-control")).toContain("max-age=3600");
    expect(text).toContain("# Autobazar123");
    expect(text).toContain("https://autobazar123.sk/sitemap.xml");
    expect(text).toContain("https://autobazar123.sk/{brand}/{model}/{city}");
  });
});

