import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("homepage launch design source contract", () => {
  it("keeps the homepage search-first without the old image hero", () => {
    const root = process.cwd();
    const shellSource = readFileSync(path.join(root, "src/components/home/HomePageShell.tsx"), "utf8");
    const searchSource = readFileSync(path.join(root, "src/components/home/HomeFrontpageSearch.tsx"), "utf8");

    expect(shellSource).toContain("HomeFrontpageSearch");
    expect(shellSource).toContain("search-first");
    expect(shellSource).toContain('id="home-search-heading"');
    expect(shellSource).toContain('className="sr-only"');
    expect(shellSource).not.toContain("/homepage-reference-hero.png");
    expect(shellSource).not.toContain("/hero-forest-champagne.jpg");
    expect(searchSource).toContain("HomeSearchFormClient");
    expect(existsSync(path.join(root, "src/components/home/HomeFrontpageSearch.tsx"))).toBe(true);
    expect(existsSync(path.join(root, "src/components/home/HomeSearchFormClient.tsx"))).toBe(true);
  });

  it("keeps homepage search body-style filters on supported listing values", () => {
    const root = process.cwd();
    const shellSource = readFileSync(path.join(root, "src/components/home/HomePageShell.tsx"), "utf8");
    const formSource = readFileSync(path.join(root, "src/components/home/HomeSearchFormClient.tsx"), "utf8");

    expect(shellSource).toContain("/vysledky?bodyStyle=commercial");
    expect(shellSource).not.toContain("bodyStyle=wagon");
    expect(shellSource).not.toContain("bodyStyle=motorcycle");
    expect(formSource).toContain('bodyStyle: "combi"');
    expect(formSource).toContain('bodyStyle: "commercial"');
    expect(formSource).not.toContain('bodyStyle: "wagon"');
    expect(formSource).not.toContain('bodyStyle: "van"');
    expect(formSource).not.toContain('bodyStyle: "motorcycle"');
  });

  it("keeps homepage search submit safe before client hydration", () => {
    const root = process.cwd();
    const formSource = readFileSync(path.join(root, "src/components/home/HomeSearchFormClient.tsx"), "utf8");

    expect(formSource).toContain('action="/vysledky"');
    expect(formSource).toContain('method="get"');
  });

  it("keeps the frontpage search panel focused on buyer search", () => {
    const root = process.cwd();
    const searchSource = readFileSync(path.join(root, "src/components/home/HomeFrontpageSearch.tsx"), "utf8");

    expect(searchSource).toContain("HomeSearchFormClient");
    expect(searchSource).not.toContain("CREATE_LISTING_ROUTE");
    expect(searchSource).not.toContain("ctaSellCar");
  });

  it("does not block the search-first section on featured ad data", () => {
    const root = process.cwd();
    const shellSource = readFileSync(path.join(root, "src/components/home/HomePageShell.tsx"), "utf8");

    expect(shellSource).toContain("fallback={<HomeFeaturedAdsFallback />}");
    expect(shellSource).toContain("HomeFeaturedAdsSection");
    expect(shellSource).toContain("min-h-[19.5rem]");
    expect(shellSource).not.toContain("getFeaturedCars(),");
  });

  it("does not render an empty popular-brands block while taxonomy loads", () => {
    const root = process.cwd();
    const formSource = readFileSync(path.join(root, "src/components/home/HomeSearchFormClient.tsx"), "utf8");

    expect(formSource).toContain("featuredBrands.length > 0");
  });

  it("keeps repeated popular-brand logo image alt text non-duplicative", () => {
    const root = process.cwd();
    const shellSource = readFileSync(path.join(root, "src/components/home/HomePageShell.tsx"), "utf8");

    expect(shellSource).toContain("alt={`Logo značky ${brand.name}`}");
  });
});
