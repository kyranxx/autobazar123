import { NextResponse } from "next/server";
import { BRAND_URL } from "@/config/brand";

type CsrfRequestLike = {
  headers: Pick<Headers, "get">;
  nextUrl: {
    origin: string;
  };
};

type CsrfValidationFailureReason =
  | "missing_origin"
  | "invalid_origin"
  | "invalid_referer"
  | "cross_origin";

type CsrfValidationResult =
  | { ok: true; source: "origin" | "referer" }
  | { ok: false; reason: CsrfValidationFailureReason };

const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"] as const;
const DEFAULT_ERROR_MESSAGE = "Invalid request origin.";

function normalizeOrigin(value: string | null | undefined): string | null {
  const candidate = (value || "").trim();
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function getTrustedOrigins(request: CsrfRequestLike): Set<string> {
  const trusted = new Set<string>();
  const candidates = [
    request.nextUrl.origin,
    BRAND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeOrigin(candidate);
    if (normalized) trusted.add(normalized);
  }

  const extraTrustedOrigins = process.env.CSRF_TRUSTED_ORIGINS || "";
  for (const candidate of extraTrustedOrigins.split(",")) {
    const normalized = normalizeOrigin(candidate);
    if (normalized) trusted.add(normalized);
  }

  if (process.env.NODE_ENV !== "production") {
    for (const devOrigin of DEV_ORIGINS) {
      trusted.add(devOrigin);
    }
  }

  return trusted;
}

export function validateSameOriginRequest(
  request: CsrfRequestLike,
): CsrfValidationResult {
  const trustedOrigins = getTrustedOrigins(request);
  const originHeader = request.headers.get("origin");

  if (originHeader !== null) {
    const origin = normalizeOrigin(originHeader);
    if (!origin) {
      return { ok: false, reason: "invalid_origin" };
    }

    if (!trustedOrigins.has(origin)) {
      return { ok: false, reason: "cross_origin" };
    }

    return { ok: true, source: "origin" };
  }

  const refererHeader = request.headers.get("referer");
  if (refererHeader !== null) {
    const refererOrigin = normalizeOrigin(refererHeader);
    if (!refererOrigin) {
      return { ok: false, reason: "invalid_referer" };
    }

    if (!trustedOrigins.has(refererOrigin)) {
      return { ok: false, reason: "cross_origin" };
    }

    return { ok: true, source: "referer" };
  }

  return { ok: false, reason: "missing_origin" };
}

export function rejectInvalidCsrfRequest(
  request: CsrfRequestLike,
): NextResponse | null {
  const validation = validateSameOriginRequest(request);
  if (validation.ok) return null;

  return NextResponse.json({ error: DEFAULT_ERROR_MESSAGE }, { status: 403 });
}

