import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

describe("SEO metadata source", () => {
  it("does not append a second brand suffix to page titles that are already brand-qualified", () => {
    const layoutSource = readSource("src/app/layout.tsx");

    expect(layoutSource).toMatch(/template:\s*`%s`,/u);
  });

  it("keeps the search results title brand-qualified without relying on the root template", () => {
    const searchPageSource = readSource("src/app/(site)/vysledky/page.tsx");

    expect(searchPageSource).toContain('title: "Výsledky vyhľadávania áut | Autobazar123"');
  });
});
