import { describe, expect, it } from "vitest";

import {
  buildCarDetailBreadcrumbItems,
  buildCarDetailBreadcrumbSchemaItems,
} from "./detail-breadcrumbs";
import type { CarData } from "./car-detail";

const baseCar = {
  id: "56e8e190-f13c-4398-8fb7-5183fc025aaa",
  brand: "Škoda",
  model: "Octavia",
  year: 2020,
  fuel: "diesel",
  transmission: "manual",
  engine_volume_cm3: 1968,
} as CarData;

describe("car detail breadcrumbs", () => {
  it("builds split brand and model breadcrumbs for an ad detail page", () => {
    expect(buildCarDetailBreadcrumbItems(baseCar)).toEqual([
      { label: "Inzeráty", href: "/vysledky" },
      { label: "Škoda", href: "/vysledky?brand=%C5%A0koda" },
      {
        label: "Octavia",
        href: "/vysledky?brand=%C5%A0koda&model=Octavia",
      },
      { label: "Škoda Octavia 2.0 Nafta Manuál, 2020" },
    ]);
  });

  it("builds matching BreadcrumbList schema items for an ad detail page", () => {
    expect(
      buildCarDetailBreadcrumbSchemaItems(baseCar, {
        currentHref: "/auto/skoda-octavia-2020-56e8e190-f13c-4398-8fb7-5183fc025aaa",
        siteUrl: "https://example.test",
      }),
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
      {
        name: "Škoda Octavia 2.0 Nafta Manuál, 2020",
        url: "https://example.test/auto/skoda-octavia-2020-56e8e190-f13c-4398-8fb7-5183fc025aaa",
      },
    ]);
  });

  it("uses Romanian public copy for Romanian market breadcrumbs", () => {
    expect(
      buildCarDetailBreadcrumbItems(baseCar, {
        marketCode: "RO",
        listingsLabel: "Anunțuri",
      }),
    ).toEqual([
      { label: "Anunțuri", href: "/masini" },
      { label: "Škoda", href: "/masini?brand=%C5%A0koda" },
      {
        label: "Octavia",
        href: "/masini?brand=%C5%A0koda&model=Octavia",
      },
      { label: "Škoda Octavia 2.0 Diesel Manuală, 2020" },
    ]);
  });
});
