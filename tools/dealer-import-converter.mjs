#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CANONICAL_FIELDS = [
  "dealer_name",
  "source_reference",
  "brand",
  "model",
  "generation",
  "year",
  "vin",
  "price_eur",
  "mileage_km",
  "fuel",
  "transmission",
  "body_style",
  "power_kw",
  "engine_volume_cm3",
  "drive_type",
  "color",
  "location_city",
  "location_district",
  "stk_valid_until",
  "is_bought_in_sk",
  "is_vat_deductible",
  "has_service_book",
  "full_service_history",
  "originality_check",
  "garage_kept",
  "not_crashed",
  "is_imported",
  "photo_urls",
  "equipment",
  "description",
  "contact_phone",
  "contact_email",
  "source_url",
  "review_status",
  "review_notes",
];

const FIELD_ALIASES = {
  dealer_name: ["dealer_name", "dealer", "predajca", "autobazar", "firma", "company"],
  source_reference: ["source_reference", "reference", "external_id", "id", "stock_id", "skladove_cislo", "cislo"],
  brand: ["brand", "make", "manufacturer", "znacka", "vyrobca"],
  model: ["model", "typ"],
  generation: ["generation", "generacia", "verzia", "variant"],
  year: ["year", "rok", "rok_vyroby", "vyroba", "first_registration", "prva_registracia"],
  vin: ["vin", "vin_cislo"],
  price_eur: ["price_eur", "price", "cena", "cena_eur", "amount", "suma"],
  mileage_km: ["mileage_km", "mileage", "km", "najazd", "najazdene", "stav_tachometra"],
  fuel: ["fuel", "palivo", "fuel_type", "typ_paliva"],
  transmission: ["transmission", "prevodovka", "gearbox", "radenie"],
  body_style: ["body_style", "body_type", "karoseria", "body", "typ_karoserie"],
  power_kw: ["power_kw", "kw", "vykon", "vykon_kw", "power"],
  engine_volume_cm3: ["engine_volume_cm3", "engine_cc", "objem", "objem_cm3", "engine_volume"],
  drive_type: ["drive_type", "pohon", "nahon"],
  color: ["color", "farba"],
  location_city: ["location_city", "city", "mesto", "obec", "lokalita"],
  location_district: ["location_district", "district", "okres"],
  stk_valid_until: ["stk_valid_until", "stk", "stk_do", "technical_inspection"],
  is_bought_in_sk: ["is_bought_in_sk", "kupene_v_sr", "povod_sr", "slovak_origin"],
  is_vat_deductible: ["is_vat_deductible", "odpocet_dph", "vat_deductible", "dph"],
  has_service_book: ["has_service_book", "servisna_knizka", "service_book"],
  full_service_history: ["full_service_history", "servisna_historia", "service_history"],
  originality_check: ["originality_check", "kontrola_originality", "ko"],
  garage_kept: ["garage_kept", "garazovane"],
  not_crashed: ["not_crashed", "nehavarovane", "not_crashed_vehicle"],
  is_imported: ["is_imported", "dovoz", "import"],
  photo_urls: ["photo_urls", "photos", "foto", "fotky", "fotografie", "images", "pictures", "image_urls"],
  equipment: ["equipment", "vybava", "extras", "features"],
  description: ["description", "popis", "poznamka", "note"],
  contact_phone: ["contact_phone", "phone", "telefon", "tel"],
  contact_email: ["contact_email", "email", "mail"],
  source_url: ["source_url", "url", "link", "detail_url", "listing_url"],
};

const FUEL_MAP = new Map([
  ["petrol", "petrol"],
  ["benzin", "petrol"],
  ["gasoline", "petrol"],
  ["diesel", "diesel"],
  ["nafta", "diesel"],
  ["electric", "electric"],
  ["elektro", "electric"],
  ["elektrina", "electric"],
  ["hybrid", "hybrid"],
  ["mild_hybrid", "hybrid"],
  ["plug_in_hybrid", "hybrid"],
  ["phev", "hybrid"],
  ["lpg", "lpg"],
  ["cng", "cng"],
  ["hydrogen", "hydrogen"],
  ["vodik", "hydrogen"],
]);

const TRANSMISSION_MAP = new Map([
  ["manual", "manual"],
  ["manualna", "manual"],
  ["mechanicka", "manual"],
  ["automat", "automatic"],
  ["automatic", "automatic"],
  ["automaticka", "automatic"],
  ["dsg", "automatic"],
]);

const BODY_MAP = new Map([
  ["sedan", "sedan"],
  ["limuzina", "sedan"],
  ["combi", "combi"],
  ["kombi", "combi"],
  ["suv", "suv"],
  ["hatchback", "hatchback"],
  ["coupe", "coupe"],
  ["kupe", "coupe"],
  ["cabriolet", "cabriolet"],
  ["kabriolet", "cabriolet"],
  ["mpv", "mpv"],
  ["pickup", "pickup"],
  ["pick_up", "pickup"],
  ["commercial", "commercial"],
  ["uzitkove", "commercial"],
  ["dodavka", "commercial"],
]);

const BOOLEAN_FIELDS = new Set([
  "is_bought_in_sk",
  "is_vat_deductible",
  "has_service_book",
  "full_service_history",
  "originality_check",
  "garage_kept",
  "not_crashed",
  "is_imported",
]);

const INTEGER_FIELDS = new Set([
  "year",
  "price_eur",
  "mileage_km",
  "power_kw",
  "engine_volume_cm3",
]);

const REQUIRED_FIELDS = [
  "brand",
  "model",
  "year",
  "price_eur",
  "mileage_km",
  "fuel",
  "transmission",
  "body_style",
  "location_city",
  "photo_urls",
];

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function mapInputRow(row) {
  const normalized = new Map();
  for (const [key, value] of Object.entries(row)) {
    normalized.set(normalizeKey(key), value);
  }
  return normalized;
}

function getField(rowMap, field) {
  const aliases = FIELD_ALIASES[field] ?? [field];
  for (const alias of aliases) {
    const key = normalizeKey(alias);
    if (rowMap.has(key)) {
      const value = rowMap.get(key);
      if (Array.isArray(value)) {
        if (value.length > 0) return value;
      } else if (cleanText(value).length > 0) {
        return value;
      }
    }
  }
  return "";
}

function parseInteger(value) {
  const raw = cleanText(value);
  if (!raw) return "";
  const normalized = raw
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? String(Math.round(parsed)) : "";
}

function parseYear(value) {
  const raw = cleanText(value);
  const direct = parseInteger(raw);
  if (direct && Number(direct) >= 1886 && Number(direct) <= 2100) {
    return direct;
  }
  const match = raw.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function normalizeEnum(value, mapping) {
  const key = normalizeKey(value);
  return mapping.get(key) ?? "";
}

function parseBoolean(value, field) {
  const raw = normalizeKey(value);
  if (!raw) return "";

  if (["true", "yes", "ano", "1", "y"].includes(raw)) return "true";
  if (["false", "no", "nie", "0", "n"].includes(raw)) return "false";
  return "";
}

function splitList(value) {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }
  const raw = cleanText(value);
  if (!raw) return [];
  return raw
    .split(/[|;,\n]+/)
    .map(cleanText)
    .filter(Boolean);
}

function normalizeDate(value) {
  const raw = cleanText(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const dateMatch = raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if (!dateMatch) return raw;

  const [, day, month, year] = dateMatch;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeFieldValue(field, value, notes) {
  if (field === "year") return parseYear(value);
  if (INTEGER_FIELDS.has(field)) return parseInteger(value);
  if (BOOLEAN_FIELDS.has(field)) return parseBoolean(value, field);
  if (field === "fuel") {
    const normalized = normalizeEnum(value, FUEL_MAP);
    if (!normalized && cleanText(value)) notes.push(`unknown fuel "${cleanText(value)}"`);
    return normalized;
  }
  if (field === "transmission") {
    const normalized = normalizeEnum(value, TRANSMISSION_MAP);
    if (!normalized && cleanText(value)) notes.push(`unknown transmission "${cleanText(value)}"`);
    return normalized;
  }
  if (field === "body_style") {
    const normalized = normalizeEnum(value, BODY_MAP);
    if (!normalized && cleanText(value)) notes.push(`unknown body_style "${cleanText(value)}"`);
    return normalized;
  }
  if (field === "stk_valid_until") return normalizeDate(value);
  if (field === "photo_urls" || field === "equipment") return splitList(value).join("|");
  if (field === "vin") return cleanText(value).toUpperCase().replace(/\s+/g, "");
  return cleanText(value);
}

function reviewRow(row) {
  const notes = [];

  for (const field of REQUIRED_FIELDS) {
    if (!row[field]) notes.push(`missing ${field}`);
  }

  if (row.vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(row.vin)) {
    notes.push("invalid vin length or characters");
  }

  if (row.photo_urls) {
    const photoUrls = row.photo_urls.split("|").filter(Boolean);
    const invalidPhotos = photoUrls.filter((url) => !/^https?:\/\//i.test(url));
    if (invalidPhotos.length > 0) {
      notes.push(`invalid photo url count ${invalidPhotos.length}`);
    }
  }

  return notes;
}

export function convertRows(rows) {
  return rows.map((inputRow, index) => {
    const rowMap = mapInputRow(inputRow);
    const notes = [];
    const output = {};

    for (const field of CANONICAL_FIELDS) {
      if (field === "review_status" || field === "review_notes") continue;
      const rawValue = getField(rowMap, field);
      output[field] = normalizeFieldValue(field, rawValue, notes);
    }

    if (!output.source_reference) {
      output.source_reference = `row-${index + 1}`;
    }

    const reviewNotes = [...notes, ...reviewRow(output)];
    output.review_status = reviewNotes.length > 0 ? "needs_review" : "ready";
    output.review_notes = [...new Set(reviewNotes)].join("; ");

    return output;
  });
}

function countDelimiter(line, delimiter) {
  let count = 0;
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') inQuotes = !inQuotes;
    if (!inQuotes && char === delimiter) count += 1;
  }
  return count;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const commaCount = countDelimiter(firstLine, ",");
  const semicolonCount = countDelimiter(firstLine, ";");
  return semicolonCount > commaCount ? ";" : ",";
}

export function parseCsv(text) {
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(value);
      value = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cleanText(cell).length > 0)) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cleanText(cell).length > 0)) rows.push(row);

  const [headers = [], ...body] = rows;
  return body.map((cells) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[cleanText(header)] = cleanText(cells[index] ?? "");
    });
    return entry;
  });
}

export function writeCsv(rows) {
  const escapeCell = (value) => {
    const raw = String(value ?? "");
    if (/[",\r\n]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  return [
    CANONICAL_FIELDS.join(","),
    ...rows.map((row) => CANONICAL_FIELDS.map((field) => escapeCell(row[field])).join(",")),
  ].join("\n") + "\n";
}

export function parseJson(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  for (const key of ["vehicles", "cars", "listings", "ads", "items"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (data && typeof data === "object") return [data];
  return [];
}

function decodeXml(value) {
  return cleanText(value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function parseXml(text) {
  const cleaned = text.replace(/<!--[\s\S]*?-->/g, "");
  const containerTags = ["vehicle", "car", "listing", "ad", "inzerat", "vozidlo"];

  for (const tag of containerTags) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    const matches = [...cleaned.matchAll(pattern)];
    if (matches.length === 0) continue;

    return matches.map((match) => {
      const block = match[1];
      const row = {};
      const childPattern = /<([A-Za-z0-9_-]+)\b[^>]*>([\s\S]*?)<\/\1>/g;
      for (const child of block.matchAll(childPattern)) {
        row[child[1]] = decodeXml(child[2].replace(/<[^>]+>/g, " "));
      }
      return row;
    });
  }

  return [];
}

export function parseInventory(text, filePath = "") {
  const ext = path.extname(filePath).toLowerCase();
  const trimmed = text.trimStart();

  if (ext === ".json" || trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return parseJson(text);
  }

  if (ext === ".xml" || trimmed.startsWith("<")) {
    return parseXml(text);
  }

  return parseCsv(text);
}

export function buildReport({ inputPath, outputPath, rows }) {
  const readyRows = rows.filter((row) => row.review_status === "ready").length;
  return {
    inputPath,
    outputPath,
    totalRows: rows.length,
    readyRows,
    needsReviewRows: rows.length - readyRows,
    rows: rows.map((row, index) => ({
      rowNumber: index + 1,
      sourceReference: row.source_reference,
      status: row.review_status,
      notes: row.review_notes,
    })),
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = value;
    index += 1;
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
node tools/dealer-import-converter.mjs --input <file.csv|json|xml> --output <clean.csv> [--report <report.json>]

Example:
node tools/dealer-import-converter.mjs --input docs/dealer-import/autobazar123-import-example.csv --output .tmp/dealer-import/clean.csv --report .tmp/dealer-import/report.json`);
}

async function ensureParent(filePath) {
  await mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
}

export async function convertInventoryFile({ inputPath, outputPath, reportPath }) {
  const input = await readFile(inputPath, "utf8");
  const parsedRows = parseInventory(input, inputPath);
  const rows = convertRows(parsedRows);
  const csv = writeCsv(rows);

  await ensureParent(outputPath);
  await writeFile(outputPath, csv, "utf8");

  const report = buildReport({ inputPath, outputPath, rows });
  if (reportPath) {
    await ensureParent(reportPath);
    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  }

  return report;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (!args.input || !args.output) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const report = await convertInventoryFile({
    inputPath: args.input,
    outputPath: args.output,
    reportPath: args.report,
  });

  console.log(
    `Converted ${report.totalRows} rows: ${report.readyRows} ready, ${report.needsReviewRows} needs review.`,
  );
  console.log(`Output: ${args.output}`);
  if (args.report) console.log(`Report: ${args.report}`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
