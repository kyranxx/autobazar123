import { createHash } from "node:crypto";

export const NORMALIZED_VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export type DecodedListingVinData = {
  vin: string;
  makeName: string | null;
  modelName: string | null;
  modelYear: number | null;
  bodyStyle: string | null;
  fuel: string | null;
  transmission: string | null;
  engineVolumeCm3: number | null;
  driveType: string | null;
  provider: "vincario";
};

type VincarioDecodeEntry = {
  label?: string | null;
  value?: string | number | boolean | null;
};

type VincarioDecodeResponse = {
  decode?: VincarioDecodeEntry[] | null;
};

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeLookupLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeVinInput(value: string): string {
  return value
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();
}

export function isNormalizedVin(value: string): boolean {
  return NORMALIZED_VIN_REGEX.test(value);
}

function parseInteger(value: string | null | undefined): number | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed);
}

function mapBodyStyle(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized.includes("sport utility") || normalized.includes("crossover") || normalized.includes("suv")) {
    return "suv";
  }
  if (normalized.includes("sedan") || normalized.includes("saloon")) {
    return "sedan";
  }
  if (normalized.includes("wagon") || normalized.includes("estate") || normalized.includes("combi")) {
    return "combi";
  }
  if (normalized.includes("hatchback") || normalized.includes("liftback") || normalized.includes("fastback")) {
    return "hatchback";
  }
  if (normalized.includes("coupe")) {
    return "coupe";
  }
  if (
    normalized.includes("convertible") ||
    normalized.includes("cabriolet") ||
    normalized.includes("roadster")
  ) {
    return "cabriolet";
  }
  if (
    normalized.includes("minivan") ||
    normalized.includes("multi purpose") ||
    normalized.includes("mpv")
  ) {
    return "mpv";
  }
  if (normalized.includes("pickup")) {
    return "pickup";
  }
  if (normalized.includes("van") || normalized.includes("cargo") || normalized.includes("commercial")) {
    return "commercial";
  }

  return null;
}

function mapFuelType(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized.includes("diesel")) return "diesel";
  if (normalized.includes("gasoline") || normalized.includes("petrol")) return "petrol";
  if (normalized.includes("electric")) return "electric";
  if (normalized.includes("hybrid")) return "hybrid";
  if (normalized.includes("lpg")) return "lpg";
  if (normalized.includes("cng") || normalized.includes("natural gas")) return "cng";
  if (normalized.includes("hydrogen")) return "hydrogen";

  return null;
}

function mapTransmission(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (
    normalized.includes("automatic") ||
    normalized.includes("cvt") ||
    normalized.includes("dct") ||
    normalized.includes("auto")
  ) {
    return "automatic";
  }

  if (normalized.includes("manual")) {
    return "manual";
  }

  return null;
}

function mapDriveType(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase().replace(/-/g, " ");

  if (
    normalized.includes("all wheel") ||
    normalized.includes("4x4") ||
    normalized.includes("4wd") ||
    normalized.includes("awd")
  ) {
    return "4x4";
  }

  if (normalized.includes("front wheel") || normalized.includes("fwd")) {
    return "front";
  }

  if (normalized.includes("rear wheel") || normalized.includes("rwd")) {
    return "rear";
  }

  return null;
}

function createDecodeLookup(entries: VincarioDecodeEntry[]): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const entry of entries) {
    const label = normalizeText(entry.label ?? undefined);
    if (!label) {
      continue;
    }

    const value =
      typeof entry.value === "string"
        ? entry.value
        : entry.value === null || entry.value === undefined
          ? ""
          : String(entry.value);

    lookup.set(normalizeLookupLabel(label), value);
  }

  return lookup;
}

function findDecodedValue(lookup: Map<string, string>, candidates: string[]): string | null {
  for (const candidate of candidates) {
    const value = normalizeText(lookup.get(normalizeLookupLabel(candidate)));
    if (value) {
      return value;
    }
  }

  return null;
}

export function createVincarioControlSum(
  vin: string,
  apiKey: string,
  secretKey: string,
): string {
  return createHash("sha1")
    .update(`${vin}|decode|${apiKey}|${secretKey}`)
    .digest("hex")
    .slice(0, 10);
}

export function mapVincarioDecodeEntriesToListingVinData(
  vin: string,
  entries: VincarioDecodeEntry[],
): DecodedListingVinData {
  const lookup = createDecodeLookup(entries);

  const makeName = findDecodedValue(lookup, ["Make"]);
  const modelName = findDecodedValue(lookup, ["Model"]);
  const modelYear = parseInteger(findDecodedValue(lookup, ["Model Year", "Year"]));
  const bodyStyle = mapBodyStyle(findDecodedValue(lookup, ["Body", "Body Class"]));
  const fuel = mapFuelType(
    findDecodedValue(lookup, ["Fuel Type - Primary", "Fuel Type Primary", "Fuel Type"]),
  );
  const transmission = mapTransmission(
    findDecodedValue(lookup, ["Transmission", "Transmission Style", "Transmission Type"]),
  );
  const engineVolumeCm3 = parseInteger(
    findDecodedValue(lookup, [
      "Displacement (ccm)",
      "Engine displacement (ccm)",
      "Displacement (cm3)",
      "Engine Capacity (ccm)",
    ]),
  );
  const driveType = mapDriveType(findDecodedValue(lookup, ["Drive", "Drive Type"]));

  return {
    vin,
    makeName,
    modelName,
    modelYear,
    bodyStyle,
    fuel,
    transmission,
    engineVolumeCm3,
    driveType,
    provider: "vincario",
  };
}

export async function decodeVinWithVincario(
  vin: string,
  apiKey: string,
  secretKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DecodedListingVinData> {
  const normalizedVin = normalizeVinInput(vin);

  if (!isNormalizedVin(normalizedVin)) {
    throw new Error("VIN must be a valid 17-character code.");
  }

  const normalizedApiKey = apiKey.trim();
  const normalizedSecretKey = secretKey.trim();

  if (!normalizedApiKey || !normalizedSecretKey) {
    throw new Error("European VIN decoder credentials are missing.");
  }

  const controlSum = createVincarioControlSum(
    normalizedVin,
    normalizedApiKey,
    normalizedSecretKey,
  );

  const response = await fetchImpl(
    `https://api.vincario.com/3.2/${normalizedApiKey}/${controlSum}/decode/${normalizedVin}.json`,
    {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`European VIN decoder request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as VincarioDecodeResponse;
  const entries = Array.isArray(payload.decode) ? payload.decode : [];

  if (entries.length === 0) {
    throw new Error("European VIN decoder returned no result.");
  }

  return mapVincarioDecodeEntriesToListingVinData(normalizedVin, entries);
}
