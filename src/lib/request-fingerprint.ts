import { createHash } from "node:crypto";

const IP_HEADERS = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
  "x-vercel-forwarded-for",
  "x-client-ip",
] as const;

function getFirstHeaderValue(
  headers: Headers,
  headerName: (typeof IP_HEADERS)[number],
): string | null {
  const rawValue = headers.get(headerName);
  if (!rawValue) {
    return null;
  }

  const firstValue = rawValue.split(",")[0]?.trim();
  return firstValue || null;
}

export function getClientIp(headers: Headers): string | null {
  for (const headerName of IP_HEADERS) {
    const value = getFirstHeaderValue(headers, headerName);
    if (value) {
      return value;
    }
  }

  return null;
}

export function createRequestFingerprint(headers: Headers): string {
  const ip = getClientIp(headers) ?? "unknown-ip";
  const userAgent = headers.get("user-agent")?.trim() || "unknown-ua";
  const acceptLanguage =
    headers.get("accept-language")?.trim() || "unknown-lang";

  const rawFingerprint = `${ip}|${userAgent}|${acceptLanguage}`;
  return createHash("sha256").update(rawFingerprint).digest("hex").slice(0, 24);
}

export function createRateLimitIdentifier(
  namespace: string,
  headers: Headers,
): string {
  return `${namespace}:${createRequestFingerprint(headers)}`;
}
