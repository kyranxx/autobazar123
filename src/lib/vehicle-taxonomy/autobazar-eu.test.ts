import { describe, expect, it } from "vitest";
import {
  buildAutobazarEuBrandUrl,
  parseAutobazarEuBrandsFromHtml,
  parseAutobazarEuModelsFromHtml,
} from "./autobazar-eu";

function filterLabel(label: string) {
  return `<span class="text-[14px] font-semibold text-[rgba(235,235,245,.6)]">${label}</span>`;
}

describe("autobazar.eu taxonomy parser", () => {
  it("parses source brands from the server-rendered filter before fuel labels", () => {
    const html = [
      filterLabel("Škoda"),
      filterLabel("Lynk &amp; Co"),
      filterLabel("Iná značka"),
      filterLabel("Diesel"),
      filterLabel("Benzín"),
    ].join("");

    expect(parseAutobazarEuBrandsFromHtml(html)).toEqual([
      {
        name: "Škoda",
        slug: "skoda",
        sourceUrl: buildAutobazarEuBrandUrl("skoda"),
      },
      {
        name: "Lynk & Co",
        slug: "lynk-co",
        sourceUrl: buildAutobazarEuBrandUrl("lynk-co"),
      },
      {
        name: "Iná značka",
        slug: "ina-znacka",
        sourceUrl: buildAutobazarEuBrandUrl("ina-znacka"),
      },
    ]);
  });

  it("parses all model labels before fuel labels, including long-tail and other-model options", () => {
    const html = [
      filterLabel("XC60"),
      filterLabel("EX30"),
      filterLabel("Iný model"),
      filterLabel("S80"),
      filterLabel("V90 Cross Country"),
      filterLabel("Diesel"),
      filterLabel("SUV"),
    ].join("");

    expect(parseAutobazarEuModelsFromHtml(html, "volvo")).toEqual([
      { name: "XC60", slug: "xc60" },
      { name: "EX30", slug: "ex30" },
      { name: "Iný model", slug: "iny-model" },
      { name: "S80", slug: "s80" },
      { name: "V90 Cross Country", slug: "v90-cross-country" },
    ]);
  });

  it("does not confuse numeric model names with later seat-count filters", () => {
    const html = [
      filterLabel("CX-5"),
      filterLabel("3"),
      filterLabel("6"),
      filterLabel("Diesel"),
      filterLabel("5"),
    ].join("");

    expect(parseAutobazarEuModelsFromHtml(html, "mazda")).toEqual([
      { name: "CX-5", slug: "cx-5" },
      { name: "3", slug: "3" },
      { name: "6", slug: "6" },
    ]);
  });

  it("falls back to static brand/model links when the filter widget is absent", () => {
    const html = `
      <a href="/vysledky/osobne-vozidla/volvo/xc60/"><span>XC60</span><span>486</span></a>
      <a href="/en/vysledky/osobne-vozidla/volvo/ex30/"><span>EX30</span></a>
      <a href="/vysledky/osobne-vozidla/skoda/octavia/"><span>Octavia</span></a>
    `;

    expect(parseAutobazarEuModelsFromHtml(html, "volvo")).toEqual([
      { name: "XC60", slug: "xc60" },
      { name: "EX30", slug: "ex30" },
    ]);
  });
});
