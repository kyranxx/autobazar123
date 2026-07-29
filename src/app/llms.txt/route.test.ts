import { existsSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("llms.txt route", () => {
  it("returns plain text content with cache headers", async () => {
    const response = GET(new NextRequest("https://www.autoninja.sk/llms.txt"));
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("cache-control")).toContain("max-age=3600");
    expect(text).toContain("# AutoNinja");
    expect(text).toContain("[Sitemap](https://www.autoninja.sk/sitemap.xml)");
    expect(text).toContain("[Search hub](https://www.autoninja.sk/vysledky)");
    expect(text).toContain("https://www.autoninja.sk/sitemap.xml");
    expect(text).toContain("https://www.autoninja.sk/{brand}/{model}/{city}");
  });

  it("returns Romanian market URLs for Romanian domain requests", async () => {
    const response = GET(new NextRequest("https://www.autoninja.ro/llms.txt"));
    const text = await response.text();

    expect(text).toContain("Romania-focused car marketplace");
    expect(text).toContain("# AutoNinja");
    expect(text).toContain("[Search hub](https://www.autoninja.ro/masini)");
    expect(text).toContain("[Dealers](https://www.autoninja.ro/dealeri)");
    expect(text).toContain("https://www.autoninja.ro/sitemap.xml");
    expect(text).not.toContain("https://www.autoninja.sk/sitemap.xml");
  });

  it("has no conflicting public file shadowing the route", () => {
    expect(existsSync(join(process.cwd(), "public", "llms.txt"))).toBe(false);
  });
});
