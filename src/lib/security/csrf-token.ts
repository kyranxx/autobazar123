export const CSRF_TOKEN_COOKIE_NAME = "ab_csrf";
export const CSRF_TOKEN_HEADER_NAME = "x-csrf-token";

export function generateCsrfToken(): string {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`;
}
