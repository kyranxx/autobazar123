/**
 * Returns a safe relative redirect path.
 *
 * Prevents open-redirect attacks by ensuring the redirect target:
 *   - Is a non-empty string
 *   - Starts with `/` (relative path)
 *   - Does NOT start with `//` (protocol-relative URL → different origin)
 *   - Does NOT contain `@` (userinfo trick: `https://origin@evil.com`)
 *   - Does NOT start with `http://` or `https://` (absolute URL)
 *
 * @param path - The redirect path from user input (query param, etc.)
 * @param fallback - Returned when `path` fails validation (defaults to "/")
 */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = "/",
): string {
  if (!path || typeof path !== "string") return fallback;

  const trimmed = path.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("@") ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return fallback;
  }

  return trimmed;
}
