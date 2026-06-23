import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  convertInventoryFile,
  convertRows,
  parseCsv,
  parseJson,
  parseXml,
} from "./dealer-import-converter.mjs";

test("parseCsv supports semicolon dealer exports and normalizes fields", () => {
  const rows = parseCsv(
    [
      "znacka;model;rok;cena;km;palivo;prevodovka;karoseria;foto;mesto",
      "Skoda;Octavia;2019;12 990 EUR;145 000;nafta;manualna;kombi;https://example.com/1.jpg|https://example.com/2.jpg;Trebisov",
    ].join("\n"),
  );

  const [converted] = convertRows(rows);

  assert.equal(converted.brand, "Skoda");
  assert.equal(converted.model, "Octavia");
  assert.equal(converted.year, "2019");
  assert.equal(converted.price_eur, "12990");
  assert.equal(converted.mileage_km, "145000");
  assert.equal(converted.fuel, "diesel");
  assert.equal(converted.transmission, "manual");
  assert.equal(converted.body_style, "combi");
  assert.equal(converted.review_status, "ready");
});

test("convertRows flags missing required data instead of marking row ready", () => {
  const [converted] = convertRows([
    {
      brand: "Volkswagen",
      model: "Golf",
      year: "2020",
      price: "10900",
      fuel: "benzin",
      transmission: "automat",
      body: "hatchback",
      city: "Michalovce",
    },
  ]);

  assert.equal(converted.review_status, "needs_review");
  assert.match(converted.review_notes, /missing mileage_km/);
  assert.match(converted.review_notes, /missing photo_urls/);
});

test("convertRows keeps canonical not_crashed booleans true", () => {
  const [converted] = convertRows([
    {
      brand: "Skoda",
      model: "Octavia",
      year: "2019",
      price: "12990",
      mileage: "145000",
      fuel: "diesel",
      transmission: "manual",
      body: "combi",
      city: "Trebisov",
      photos: "https://example.com/1.jpg",
      not_crashed: "true",
    },
  ]);

  assert.equal(converted.not_crashed, "true");
  assert.equal(converted.review_status, "ready");
});

test("parseJson accepts common wrapper keys", () => {
  const rows = parseJson(JSON.stringify({
    vehicles: [
      {
        make: "Toyota",
        model: "Corolla",
        year: 2021,
        price: 15900,
        mileage: 90000,
        fuel: "hybrid",
        gearbox: "automatic",
        body: "sedan",
        city: "Kosice",
        photos: ["https://example.com/corolla.jpg"],
      },
    ],
  }));

  const [converted] = convertRows(rows);
  assert.equal(converted.brand, "Toyota");
  assert.equal(converted.fuel, "hybrid");
  assert.equal(converted.review_status, "ready");
});

test("parseXml reads simple vehicle feeds", () => {
  const rows = parseXml(`
    <vehicles>
      <vehicle>
        <brand>Hyundai</brand>
        <model>i30</model>
        <year>2018</year>
        <price_eur>8900</price_eur>
        <mileage_km>132000</mileage_km>
        <fuel>benzin</fuel>
        <transmission>manual</transmission>
        <body_style>hatchback</body_style>
        <location_city>Roznava</location_city>
        <photo_urls>https://example.com/i30.jpg</photo_urls>
      </vehicle>
    </vehicles>
  `);

  const [converted] = convertRows(rows);
  assert.equal(converted.brand, "Hyundai");
  assert.equal(converted.fuel, "petrol");
  assert.equal(converted.review_status, "ready");
});

test("convertInventoryFile writes clean CSV and report", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "dealer-import-"));
  try {
    const input = path.join(dir, "input.csv");
    const output = path.join(dir, "clean.csv");
    const report = path.join(dir, "report.json");

    await writeFile(
      input,
      [
        "brand,model,year,price,mileage,fuel,transmission,body,city,photos",
        "Skoda,Octavia,2019,12990,145000,diesel,manual,combi,Trebisov,https://example.com/1.jpg",
      ].join("\n"),
      "utf8",
    );

    const result = await convertInventoryFile({
      inputPath: input,
      outputPath: output,
      reportPath: report,
    });

    const cleanCsv = await readFile(output, "utf8");
    const reportJson = JSON.parse(await readFile(report, "utf8"));

    assert.equal(result.totalRows, 1);
    assert.equal(result.readyRows, 1);
    assert.match(cleanCsv, /review_status/);
    assert.equal(reportJson.rows[0].status, "ready");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
