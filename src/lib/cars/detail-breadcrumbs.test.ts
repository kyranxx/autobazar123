import { describe, expect, it } from "vitest";
import {
  buildCarDetailBreadcrumbItems,
  buildCarDetailBreadcrumbJsonLd,
} from "@/lib/cars/detail-breadcrumbs";

describe("detail breadcrumbs", () => {
  const car = {
    id: "75573f75-b6c0-458c-adf7-c165e5b32e5e",
    brand: "Škoda",
    model: "Octavia",
    year: 2020,
    engine_volume_cm3: 1968,
    fuel: "diesel",
    transmission: "automatic",
  };

  it("builds the visible ad breadcrumb with separate brand and model crumbs", () => {
    expect(buildCarDetailBreadcrumbItems(car)).toEqual([
      { label: "Inzeráty", href: "/vysledky" },
      {
        label: "Škoda",
        href: "/vysledky?brand=%C5%A0koda",
      },
      {
        label: "Octavia",
        href: "/vysledky?brand=%C5%A0koda&model=Octavia",
      },
      { label: "Škoda Octavia 2.0 Nafta Automat, 2020" },
    ]);
  });

  it("keeps a readable space between engine volume and hybrid fuel labels", () => {
    expect(
      buildCarDetailBreadcrumbItems({
        ...car,
        brand: "Honda",
        model: "CR-V",
        year: 2024,
        engine_volume_cm3: 3100,
        fuel: "Hybrid",
        transmission: "automatic",
      }).at(-1),
    ).toEqual({ label: "Honda CR-V 3.1 Hybrid Automat, 2024" });
  });

  it("builds matching BreadcrumbList JSON-LD for the ad detail page", () => {
    expect(
      buildCarDetailBreadcrumbJsonLd({
        car,
        canonicalUrl:
          "https://www.autobazar123.sk/auto/75573f75-b6c0-458c-adf7-c165e5b32e5e-skoda-octavia-2020",
        siteUrl: "https://www.autobazar123.sk",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inzeráty",
          item: "https://www.autobazar123.sk/vysledky",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Škoda",
          item: "https://www.autobazar123.sk/vysledky?brand=%C5%A0koda",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Octavia",
          item: "https://www.autobazar123.sk/vysledky?brand=%C5%A0koda&model=Octavia",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Škoda Octavia 2.0 Nafta Automat, 2020",
          item: "https://www.autobazar123.sk/auto/75573f75-b6c0-458c-adf7-c165e5b32e5e-skoda-octavia-2020",
        },
      ],
    });
  });
});
