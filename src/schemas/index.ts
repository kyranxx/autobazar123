/**
 * 🔐 Zod Validation Schemas
 *
 * Central validation layer for all data entering the system.
 * Prevents SQL Injection (SQLi) and Cross-Site Scripting (XSS).
 *
 * Usage:
 *   import { AdFormSchema } from '@/schemas';
 *   const result = AdFormSchema.safeParse(formData);
 *   if (!result.success) { // handle errors }
 */

import { z } from "zod";
import { sanitizePlainText } from "@/lib/security/sanitize-text";

// ==============================================
// ENUMS (Match Database EXACTLY)
// ==============================================

const FuelTypeEnum = z.enum([
  "petrol",
  "diesel",
  "electric",
  "hybrid",
  "lpg",
  "cng",
  "hydrogen",
]);
type FuelType = z.infer<typeof FuelTypeEnum>;

const TransmissionTypeEnum = z.enum(["manual", "automatic"]);
type TransmissionType = z.infer<typeof TransmissionTypeEnum>;

const BodyTypeEnum = z.enum([
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
type BodyType = z.infer<typeof BodyTypeEnum>;

const AdStatusEnum = z.enum([
  "draft",
  "active",
  "sold",
  "expired",
  "banned",
]);
type AdStatus = z.infer<typeof AdStatusEnum>;

// ==============================================
// COMMON VALIDATORS
// ==============================================

// Slovak phone number (starts with +421 or 09xx)
export const PhoneSchema = z
  .string()
  .regex(
    /^(\+421|09)[0-9]{8,9}$/,
    "Neplatné telefónne číslo (napr. +421912345678 alebo 0912345678)",
  )
  .optional()
  .or(z.literal(""));

// Email validation
const EmailSchema = z.string().email("Neplatná emailová adresa");

// UUID validation
const UuidSchema = z.string().uuid("Neplatné ID");

// URL validation
const UrlSchema = z
  .string()
  .url("Neplatná URL adresa")
  .optional()
  .or(z.literal(""));

// Price validation (positive number, max 10 million)
const PriceSchema = z
  .number()
  .positive("Cena musí byť kladné číslo")
  .max(10000000, "Maximálna cena je 10 000 000 €");

// Year validation (1900 - current year + 1)
const currentYear = new Date().getFullYear();
const YearSchema = z
  .number()
  .int("Rok musí byť celé číslo")
  .min(1900, "Rok musí byť minimálne 1900")
  .max(currentYear + 1, `Rok nemôže byť väčší ako ${currentYear + 1}`);

// Mileage validation (0 - 2 million km)
const MileageSchema = z
  .number()
  .int("Kilometre musia byť celé číslo")
  .min(0, "Kilometre nemôžu byť záporné")
  .max(2000000, "Neplatný počet kilometrov");

// Power in kW (1 - 2000)
const PowerKwSchema = z
  .number()
  .int("Výkon musí byť celé číslo")
  .min(1, "Výkon musí byť minimálne 1 kW")
  .max(2000, "Neplatný výkon")
  .optional();

// Engine volume in cm³ (50 - 10000)
const EngineVolumeSchema = z
  .number()
  .int("Objem motora musí byť celé číslo")
  .min(50, "Minimálny objem je 50 cm³")
  .max(10000, "Maximálny objem je 10000 cm³")
  .optional();

// Sanitized text (prevent XSS)
const SanitizedTextSchema = z
  .string()
  .transform((val) => sanitizePlainText(val));

// ==============================================
// PROFILE SCHEMAS
// ==============================================

const ProfileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(2, "Meno musí mať minimálne 2 znaky")
    .max(100, "Meno je príliš dlhé")
    .optional(),
  phone: PhoneSchema,
  avatar_url: UrlSchema,
});
type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

const ProfilePublicSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  full_name: z.string().nullable(),
  phone: z.string().nullable(),
  is_verified: z.boolean(),
  avatar_url: z.string().nullable(),
  credit_balance: z.number().default(0),
  created_at: z.string(),
});
type ProfilePublic = z.infer<typeof ProfilePublicSchema>;

// ==============================================
// DEALER SCHEMAS
// ==============================================

export const DealerRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, "Názov firmy musí mať minimálne 2 znaky")
    .max(100, "Názov firmy je príliš dlhý"),
  slug: z
    .string()
    .min(3, "URL musí mať minimálne 3 znaky")
    .max(50, "URL je príliš dlhá")
    .regex(
      /^[a-z0-9-]+$/,
      "URL môže obsahovať len malé písmená, čísla a pomlčky",
    ),
  description: z.string().max(2000, "Popis je príliš dlhý").optional(),
  website_url: UrlSchema,
  address: z.string().max(200, "Adresa je príliš dlhá").optional(),
  city: z.string().max(100, "Názov mesta je príliš dlhý").optional(),
  phone: PhoneSchema,
});
type DealerRegistration = z.infer<typeof DealerRegistrationSchema>;

const DealerUpdateSchema = DealerRegistrationSchema.partial();
type DealerUpdate = z.infer<typeof DealerUpdateSchema>;

// ==============================================
// AD (CAR LISTING) SCHEMAS
// ==============================================

// Step 1: Basic Vehicle Info
const AdBasicInfoSchema = z.object({
  brand_id: UuidSchema.optional(),
  model_id: UuidSchema.optional(),
  brand: z
    .string()
    .min(1, "Značka je povinná")
    .max(50, "Názov značky je príliš dlhý"),
  model: z
    .string()
    .min(1, "Model je povinný")
    .max(50, "Názov modelu je príliš dlhý"),
  generation: z.string().max(50, "Generácia je príliš dlhá").optional(),
  year: YearSchema,
  price_eur: PriceSchema,
  mileage_km: MileageSchema,
});

// Step 2: Technical Specs
const AdTechnicalSpecsSchema = z.object({
  fuel: FuelTypeEnum,
  transmission: TransmissionTypeEnum,
  body_style: BodyTypeEnum,
  power_kw: PowerKwSchema,
  engine_volume_cm3: EngineVolumeSchema,
  drive_type: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
});

// Step 3: Slovak Trust Signals
const AdTrustSignalsSchema = z.object({
  is_bought_in_sk: z.boolean().default(false),
  is_vat_deductible: z.boolean().default(false),
  has_service_book: z.boolean().default(false),
  full_service_history: z.boolean().default(false),
  originality_check: z.boolean().default(false),
  warranty_expiration: z.string().datetime().optional().nullable(),
  garage_kept: z.boolean().default(false),
  not_crashed: z.boolean().default(false),
  is_imported: z.boolean().default(false),
});

// Step 4: Location & Description
export const AdLocationSchema = z.object({
  location_city: z
    .string()
    .min(2, "Mesto je povinné")
    .max(100, "Názov mesta je príliš dlhý"),
  location_district: z
    .string()
    .max(100, "Názov okresu je príliš dlhý")
    .optional(),
  description: z
    .string()
    .max(5000, "Popis môže mať maximálne 5000 znakov")
    .optional()
    .transform((val) => (val ? sanitizePlainText(val) : val)),
});

// Step 5: Photos & Equipment
const AdMediaSchema = z.object({
  photos_json: z
    .array(z.string().url("Neplatná URL obrázku"))
    .min(1, "Minimálne 1 fotka je povinná")
    .max(30, "Maximálne 30 fotiek"),
  equipment_json: z.array(z.string()).default([]),
});

// Complete Ad Form Schema (combines all steps)
const AdFormSchema = AdBasicInfoSchema.merge(AdTechnicalSpecsSchema)
  .merge(AdTrustSignalsSchema)
  .merge(AdLocationSchema)
  .merge(AdMediaSchema);
type AdForm = z.infer<typeof AdFormSchema>;

// Ad creation/update schema (what we send to the database)
const AdCreateSchema = AdFormSchema.extend({
  seller_id: UuidSchema,
  dealer_id: UuidSchema.optional(),
});
type AdCreate = z.infer<typeof AdCreateSchema>;

const AdUpdateSchema = AdFormSchema.partial().extend({
  id: UuidSchema,
});
type AdUpdate = z.infer<typeof AdUpdateSchema>;

// Full Ad from database (includes computed fields)
const AdFullSchema = AdFormSchema.extend({
  id: UuidSchema,
  seller_id: UuidSchema,
  dealer_id: UuidSchema.optional().nullable(),
  status: AdStatusEnum,
  views_count: z.number().default(0),
  click_count: z.number().default(0),
  is_top_ad: z.boolean().default(false),
  is_highlighted: z.boolean().default(false),
  top_expires_at: z.string().datetime().optional().nullable(),
  highlight_expires_at: z.string().datetime().optional().nullable(),
  published_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  sold_at: z.string().datetime().optional().nullable(),
  auto_prolong: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
type AdFull = z.infer<typeof AdFullSchema>;

// ==============================================
// INQUIRY (CONTACT MESSAGE) SCHEMAS
// ==============================================

export const InquiryCreateSchema = z.object({
  ad_id: UuidSchema,
  message: z
    .string()
    .min(10, "Správa musí mať minimálne 10 znakov")
    .max(2000, "Správa môže mať maximálne 2000 znakov")
    .transform((val) => sanitizePlainText(val)),
  phone: PhoneSchema,
});
type InquiryCreate = z.infer<typeof InquiryCreateSchema>;

// ==============================================
// SEARCH/FILTER SCHEMAS
// ==============================================

export const AdSearchFiltersSchema = z.object({
  brand_id: UuidSchema.optional(),
  model_id: UuidSchema.optional(),
  year_from: z.number().int().min(1900).optional(),
  year_to: z
    .number()
    .int()
    .max(currentYear + 1)
    .optional(),
  price_from: z.number().min(0).optional(),
  price_to: z.number().max(10000000).optional(),
  mileage_from: z.number().int().min(0).optional(),
  mileage_to: z.number().int().max(2000000).optional(),
  fuel: FuelTypeEnum.optional(),
  transmission: TransmissionTypeEnum.optional(),
  body_style: BodyTypeEnum.optional(),
  power_from: z.number().int().min(1).optional(),
  power_to: z.number().int().max(2000).optional(),
  location_city: z.string().optional(),
  // Trust signals
  is_bought_in_sk: z.boolean().optional(),
  has_service_book: z.boolean().optional(),
  not_crashed: z.boolean().optional(),
  // Sorting
  sort_by: z.enum(["price", "year", "mileage", "created_at"]).optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  // Pagination
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});
type AdSearchFilters = z.infer<typeof AdSearchFiltersSchema>;

// ==============================================
// CREDIT TRANSACTION SCHEMAS
// ==============================================

const CreditTransactionActionSchema = z.enum([
  "top_up",
  "publish",
  "prolong",
  "top_ad",
  "highlight",
  "bump",
  "refund",
]);
type CreditTransactionAction = z.infer<
  typeof CreditTransactionActionSchema
>;

const CreditTopUpSchema = z.object({
  package_id: UuidSchema,
  stripe_payment_id: z.string().optional(),
});
type CreditTopUp = z.infer<typeof CreditTopUpSchema>;

export const CreditSpendSchema = z.object({
  ad_id: UuidSchema,
  action: CreditTransactionActionSchema,
  credits: z.number().int().positive("Počet kreditov musí byť kladný"),
});
type CreditSpend = z.infer<typeof CreditSpendSchema>;

// ==============================================
// AUTH SCHEMAS
// ==============================================

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6, "Heslo musí mať minimálne 6 znakov"),
});
type Login = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    email: EmailSchema,
    password: z.string().min(6, "Heslo musí mať minimálne 6 znakov"),
    confirmPassword: z.string(),
    full_name: z
      .string()
      .min(2, "Meno musí mať minimálne 2 znaky")
      .max(100, "Meno je príliš dlhé")
      .optional(),
    phone: PhoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Heslá sa nezhodujú",
    path: ["confirmPassword"],
  });
type Register = z.infer<typeof RegisterSchema>;

const PasswordResetSchema = z.object({
  email: EmailSchema,
});
type PasswordReset = z.infer<typeof PasswordResetSchema>;

const NewPasswordSchema = z
  .object({
    password: z.string().min(6, "Heslo musí mať minimálne 6 znakov"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Heslá sa nezhodujú",
    path: ["confirmPassword"],
  });
type NewPassword = z.infer<typeof NewPasswordSchema>;

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Safe parse wrapper with better error formatting
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(
    (err) => `${err.path.join(".")}: ${err.message}`,
  );

  return { success: false, errors };
}

/**
 * Format Zod errors for display in forms
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join(".");
    if (!formatted[path]) {
      formatted[path] = err.message;
    }
  });

  return formatted;
}
