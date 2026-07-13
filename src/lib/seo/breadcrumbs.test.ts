import { describe, expect, it } from "vitest";
import {
  buildBreadcrumbSchemaItems,
  buildSearchResultsBreadcrumbItems,
  buildSearchResultsBreadcrumbSchemaItems,
} from "./breadcrumbs";

describe("breadcrumbs", () => {
  it("uses Romanian canonical search paths for the Romanian market", () => {
    expect(
      buildSearchResultsBreadcrumbItems(
        { brand: "Dacia", model: "Duster" },
        { listingsLabel: "Anunțuri", marketCode: "RO" },
      ),
    ).toEqual([
      { label: "Anunțuri", href: "/masini" },
      { label: "Dacia", href: "/masini?brand=Dacia" },
      { label: "Duster" },
    ]);
  });

  it("builds split brand and model search result breadcrumbs", () => {
    expect(
      buildSearchResultsBreadcrumbItems({ brand: "Škoda", model: "Octavia" }),
    ).toEqual([
      { label: "Inzeráty", href: "/vysledky" },
      { label: "Škoda", href: "/vysledky?brand=%C5%A0koda" },
      { label: "Octavia" },
    ]);
  });

  it("builds matching absolute BreadcrumbList items for filtered results", () => {
    expect(
      buildSearchResultsBreadcrumbSchemaItems(
        { brand: "Škoda", model: "Octavia" },
        "https://example.test",
      ),
    ).toEqual([
      { name: "Inzeráty", url: "https://example.test/vysledky" },
      {
        name: "Škoda",
        url: "https://example.test/vysledky?brand=%C5%A0koda",
      },
      {
        name: "Octavia",
        url: "https://example.test/vysledky?brand=%C5%A0koda&model=Octavia",
      },
    ]);
  });

  it("builds static page BreadcrumbList items from the visible trail", () => {
    expect(
      buildBreadcrumbSchemaItems({
        items: [{ label: "Cenník" }],
        currentHref: "/ceny",
        siteUrl: "https://example.test",
      }),
    ).toEqual([{ name: "Cenník", url: "https://example.test/ceny" }]);
  });
});
