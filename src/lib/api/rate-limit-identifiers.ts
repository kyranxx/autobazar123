import type { NextRequest } from "next/server";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";

export function getAccountDeleteRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("account_delete", request.headers);
}

export function getAccountPasswordRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("account_password_update", request.headers);
}

export function getAccountPhoneRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("account_phone_update", request.headers);
}

export function getContactSubmitRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("contact_submit", request.headers);
}

export function getDealerVerificationRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("dealer_verification_request", request.headers);
}

export function getModerationNotificationRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("account_moderation_notification_update", request.headers);
}

export function getPasswordResetRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("auth_password_reset", request.headers);
}

export function getRecoveryPasswordRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("account_password_recovery", request.headers);
}

export function getRegisterRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("auth_register", request.headers);
}

export function getRegisterResendRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("auth_register_resend", request.headers);
}

export function getSavedSearchesRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("account_saved_searches", request.headers);
}
