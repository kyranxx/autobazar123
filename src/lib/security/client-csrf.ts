import { CSRF_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME } from "@/lib/security/csrf-token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const candidate = part.trim();
    if (candidate.startsWith(prefix)) {
      return decodeURIComponent(candidate.slice(prefix.length));
    }
  }

  return null;
}

function getCsrfToken(): string | null {
  return readCookie(CSRF_TOKEN_COOKIE_NAME);
}

export function createCsrfHeaders(
  headers?: HeadersInit,
): Record<string, string> {
  const csrfToken = getCsrfToken();
  const normalized =
    headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : Array.isArray(headers)
        ? Object.fromEntries(headers)
        : { ...(headers || {}) };

  if (csrfToken) {
    normalized[CSRF_TOKEN_HEADER_NAME] = csrfToken;
  }

  return normalized;
}
