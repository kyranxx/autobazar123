import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { sanitizePlainText } from "@/lib/security/sanitize-text";

type ContactSchemaMessages = {
  invalidName?: string;
  invalidEmail?: string;
  invalidMessage?: string;
};

type ResetPasswordSchemaMessages = {
  passwordMinLength?: string;
  passwordMismatch?: string;
};

type RegisterClientSchemaMessages = {
  fullNameRequired?: string;
  fullNameTooLong?: string;
  invalidEmail?: string;
  passwordMinLength?: string;
  passwordsMismatch?: string;
  mustAgreeTerms?: string;
};

function normalizePlainText(value: string): string {
  return sanitizePlainText(value.replace(/\r\n/g, "\n").replace(/\u3000/g, " "));
}

function normalizeOptionalPhone(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function createContactFormSchema(messages: ContactSchemaMessages = {}) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, messages.invalidName ?? "Name must be at least 2 characters.")
      .max(100, messages.invalidName ?? "Name must be at most 100 characters.")
      .transform((value) => normalizePlainText(value))
      .refine((value) => value.length >= 2 && value.length <= 100, {
        message: messages.invalidName ?? "Name must be at least 2 characters.",
      }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email(messages.invalidEmail ?? "Invalid email.")
      .max(254, messages.invalidEmail ?? "Invalid email."),
    subject: z
      .union([
        z.enum(["general", "technical", "billing", "partnership"]),
        z.literal(""),
      ])
      .transform((value) => (value === "" ? "general" : value)),
    message: z
      .string()
      .trim()
      .min(10, messages.invalidMessage ?? "Message must be at least 10 characters.")
      .max(2000, messages.invalidMessage ?? "Message must be at most 2000 characters.")
      .transform((value) => normalizePlainText(value))
      .refine((value) => value.length >= 10 && value.length <= 2000, {
        message: messages.invalidMessage ?? "Message must be at least 10 characters.",
      }),
  });
}

export function createRegisterClientSchema(
  messages: RegisterClientSchemaMessages = {},
) {
  return z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email(messages.invalidEmail ?? "Invalid email address."),
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        messages.passwordMinLength ?? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      ),
    confirmPassword: z.string(),
    fullName: z
      .string()
      .trim()
      .min(1, messages.fullNameRequired ?? "Full name is required.")
      .max(120, messages.fullNameTooLong ?? "Full name is too long.")
      .transform((value) => normalizePlainText(value))
      .refine((value) => value.length >= 1, {
        message: messages.fullNameRequired ?? "Full name is required.",
      }),
    agreedToTerms: z.literal(true, {
      message: messages.mustAgreeTerms ?? "You must agree to the terms.",
    }),
    dealerInterest: z.boolean().optional().default(false),
  }).refine((value) => value.password === value.confirmPassword, {
    message: messages.passwordsMismatch ?? "Passwords do not match.",
    path: ["confirmPassword"],
  });
}

export const registerRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
  fullName: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .transform((value) => normalizePlainText(value))
    .refine((value) => value.length >= 1),
  dealerInterest: z.boolean().optional().default(false),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
}).strict();

export function createResetPasswordFormSchema(
  messages: ResetPasswordSchemaMessages = {},
) {
  return z.object({
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        messages.passwordMinLength ?? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      ),
    confirmPassword: z.string(),
  }).refine((value) => value.password === value.confirmPassword, {
    message: messages.passwordMismatch ?? "Passwords do not match.",
    path: ["confirmPassword"],
  });
}

export const updatePasswordBodySchema = z.object({
  password: z.string().min(MIN_PASSWORD_LENGTH),
}).strict();

export const deleteAccountBodySchema = z.object({
  confirm: z.literal("DELETE"),
}).strict();

export const updatePhoneBodySchema = z.object({
  phone: z
    .union([z.string().trim().max(32), z.null()])
    .transform((value) => normalizeOptionalPhone(value)),
}).strict();

export const updateModerationNotificationBodySchema = z.object({
  notifyModerationEmail: z.boolean(),
}).strict();

export const recoveryPasswordBodySchema = z.object({
  password: z.string().min(MIN_PASSWORD_LENGTH),
  tokenHash: z.string().trim().min(1),
}).strict();
export type ResetPasswordFormInput = z.input<ReturnType<typeof createResetPasswordFormSchema>>;
