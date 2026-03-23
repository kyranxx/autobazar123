import { z } from "zod";
import { sanitizePlainText } from "@/lib/security/sanitize-text";

export const LISTING_LIMITS = {
  generationMaxLength: 120,
  brandMaxLength: 100,
  modelMaxLength: 100,
  driveTypeMaxLength: 60,
  colorMaxLength: 60,
  cityMaxLength: 120,
  districtMaxLength: 120,
  descriptionMaxLength: 4000,
  yearMin: 1886,
  yearMax: 2100,
  priceMin: 1,
  priceMax: 100000000,
  mileageMin: 0,
  mileageMax: 5000000,
  powerKwMin: 1,
  powerKwMax: 5000,
  engineVolumeMin: 50,
  engineVolumeMax: 20000,
  equipmentItemMaxLength: 80,
  equipmentItemsMax: 128,
  maxPhotos: 25,
} as const;

const fuelTypeSchema = z.enum([
  "petrol",
  "diesel",
  "electric",
  "hybrid",
  "lpg",
  "cng",
  "hydrogen",
]);

const transmissionTypeSchema = z.enum(["manual", "automatic"]);

const bodyTypeSchema = z.enum([
  "sedan",
  "combi",
  "suv",
  "hatchback",
  "coupe",
  "cabriolet",
  "mpv",
  "pickup",
  "commercial",
]);

const deliveryUrlPattern = /^https:\/\/imagedelivery\.net\//;

function normalizeListingText(value: string): string {
  return sanitizePlainText(value.replace(/\r\n/g, "\n").replace(/\u3000/g, " "));
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeListingText(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalShortText(
  maxLength: number,
) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => normalizeOptionalText(value))
    .refine(
      (value) => value === null || value.length <= maxLength,
      `Must be at most ${maxLength} characters.`,
    );
}

function normalizeOptionalIntegerField(min: number, max: number) {
  return z
    .union([z.number().int().finite(), z.null(), z.undefined()])
    .transform((value) => (typeof value === "number" ? value : null))
    .refine(
      (value) => value === null || (value >= min && value <= max),
      `Must be between ${min} and ${max}.`,
    );
}

function normalizeOptionalDateField() {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string") {
        return null;
      }

      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    })
    .refine((value) => {
      if (!value) {
        return true;
      }

      return !Number.isNaN(Date.parse(value));
    }, "Invalid date.");
}

const photoUrlSchema = z
  .string()
  .url()
  .regex(deliveryUrlPattern, "Photos must use Cloudflare delivery URLs.");

export const listingMutationSchema = z.object({
  brandId: z.string().uuid(),
  modelId: z.string().uuid(),
  year: z.number().int().min(LISTING_LIMITS.yearMin).max(LISTING_LIMITS.yearMax),
  priceEur: z.number().int().min(LISTING_LIMITS.priceMin).max(LISTING_LIMITS.priceMax),
  mileageKm: z.number().int().min(LISTING_LIMITS.mileageMin).max(LISTING_LIMITS.mileageMax),
  fuel: fuelTypeSchema,
  transmission: transmissionTypeSchema,
  bodyStyle: bodyTypeSchema,
  powerKw: normalizeOptionalIntegerField(
    LISTING_LIMITS.powerKwMin,
    LISTING_LIMITS.powerKwMax,
  ),
  engineVolumeCm3: normalizeOptionalIntegerField(
    LISTING_LIMITS.engineVolumeMin,
    LISTING_LIMITS.engineVolumeMax,
  ),
  generation: normalizeOptionalShortText(LISTING_LIMITS.generationMaxLength),
  driveType: normalizeOptionalShortText(LISTING_LIMITS.driveTypeMaxLength),
  color: normalizeOptionalShortText(LISTING_LIMITS.colorMaxLength),
  locationCity: z
    .string()
    .transform((value) => normalizeListingText(value).trim())
    .refine(
      (value) => value.length >= 1 && value.length <= LISTING_LIMITS.cityMaxLength,
      `City must be between 1 and ${LISTING_LIMITS.cityMaxLength} characters.`,
    ),
  locationDistrict: normalizeOptionalShortText(LISTING_LIMITS.districtMaxLength),
  description: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => normalizeOptionalText(value))
    .refine(
      (value) => value === null || value.length <= LISTING_LIMITS.descriptionMaxLength,
      `Description must be at most ${LISTING_LIMITS.descriptionMaxLength} characters.`,
    ),
  stkValidUntil: normalizeOptionalDateField(),
  isBoughtInSk: z.boolean(),
  isVatDeductible: z.boolean(),
  hasServiceBook: z.boolean(),
  fullServiceHistory: z.boolean(),
  originalityCheck: z.boolean(),
  garageKept: z.boolean(),
  notCrashed: z.boolean(),
  isImported: z.boolean(),
  photoUrls: z
    .array(photoUrlSchema)
    .min(1, "At least one photo is required.")
    .max(LISTING_LIMITS.maxPhotos, `Maximum of ${LISTING_LIMITS.maxPhotos} photos allowed.`),
  equipment: z
    .array(
      z
        .string()
        .transform((value) => normalizeListingText(value).trim())
        .refine(
          (value) => value.length >= 1 && value.length <= LISTING_LIMITS.equipmentItemMaxLength,
          `Equipment items must be between 1 and ${LISTING_LIMITS.equipmentItemMaxLength} characters.`,
        ),
    )
    .max(
      LISTING_LIMITS.equipmentItemsMax,
      `Maximum of ${LISTING_LIMITS.equipmentItemsMax} equipment items allowed.`,
    ),
}).strict();

export const updateListingBodySchema = listingMutationSchema.extend({
  adId: z.string().uuid(),
}).strict();

export const quickEditAdSchema = z.object({
  adId: z.string().uuid(),
  priceEur: z.number().int().min(LISTING_LIMITS.priceMin).max(LISTING_LIMITS.priceMax),
  mileageKm: normalizeOptionalIntegerField(
    LISTING_LIMITS.mileageMin,
    LISTING_LIMITS.mileageMax,
  ),
  description: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => normalizeOptionalText(value))
    .refine(
      (value) => value === null || value.length <= LISTING_LIMITS.descriptionMaxLength,
      `Description must be at most ${LISTING_LIMITS.descriptionMaxLength} characters.`,
    ),
}).strict();

type QuickEditSchemaMessages = {
  invalidPrice?: string;
  invalidMileage?: string;
  invalidDescription?: string;
};

export function createQuickEditFormSchema(
  messages: QuickEditSchemaMessages = {},
) {
  return z.object({
    priceEur: z
      .string()
      .trim()
      .refine((value) => value.length > 0, {
        message: messages.invalidPrice ?? "Price is required.",
      })
      .transform((value) => Number(value))
      .refine(
        (value) =>
          Number.isFinite(value)
          && Number.isInteger(value)
          && value >= LISTING_LIMITS.priceMin
          && value <= LISTING_LIMITS.priceMax,
        {
          message:
            messages.invalidPrice
            ?? `Price must be between ${LISTING_LIMITS.priceMin} and ${LISTING_LIMITS.priceMax}.`,
        },
      ),
    mileageKm: z
      .string()
      .trim()
      .transform((value) => (value.length > 0 ? Number(value) : null))
      .refine(
        (value) =>
          value === null
          || (
            Number.isFinite(value)
            && Number.isInteger(value)
            && value >= LISTING_LIMITS.mileageMin
            && value <= LISTING_LIMITS.mileageMax
          ),
        {
          message:
            messages.invalidMileage
            ?? `Mileage must be between ${LISTING_LIMITS.mileageMin} and ${LISTING_LIMITS.mileageMax}.`,
        },
      ),
    description: z
      .string()
      .transform((value) => normalizeOptionalText(value))
      .refine(
        (value) => value === null || value.length <= LISTING_LIMITS.descriptionMaxLength,
        {
          message:
            messages.invalidDescription
            ?? `Description must be at most ${LISTING_LIMITS.descriptionMaxLength} characters.`,
        },
      ),
  });
}

export const sellerAdMutationBodySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("full"),
    adId: z.string().uuid(),
    listing: listingMutationSchema,
  }).strict(),
  z.object({
    mode: z.literal("quick"),
    quickEdit: quickEditAdSchema,
  }).strict(),
]);

export function buildListingInsertPayload(
  listing: z.infer<typeof listingMutationSchema>,
) {
  return {
    brand_id: listing.brandId,
    model_id: listing.modelId,
    year: listing.year,
    price_eur: listing.priceEur,
    mileage_km: listing.mileageKm,
    fuel: listing.fuel,
    transmission: listing.transmission,
    body_style: listing.bodyStyle,
    power_kw: listing.powerKw,
    engine_volume_cm3: listing.engineVolumeCm3,
    drive_type: listing.driveType,
    color: listing.color,
    location_city: listing.locationCity,
    location_district: listing.locationDistrict,
    description: listing.description,
    is_bought_in_sk: listing.isBoughtInSk,
    is_vat_deductible: listing.isVatDeductible,
    has_service_book: listing.hasServiceBook,
    full_service_history: listing.fullServiceHistory,
    originality_check: listing.originalityCheck,
    garage_kept: listing.garageKept,
    not_crashed: listing.notCrashed,
    is_imported: listing.isImported,
    warranty_expiration: listing.stkValidUntil,
    photos_json: listing.photoUrls,
    equipment_json: listing.equipment,
  };
}

export type ListingMutationInput = z.infer<typeof listingMutationSchema>;
export type QuickEditAdInput = z.infer<typeof quickEditAdSchema>;
export type QuickEditFormInput = z.input<ReturnType<typeof createQuickEditFormSchema>>;
export type QuickEditFormData = z.infer<ReturnType<typeof createQuickEditFormSchema>>;
