const LOCALHOST_DEV_ORIGIN = "http://localhost:3000";
const CALLBACK_PATH = "/auth/callback";

type LocationLike = Pick<Location, "origin" | "hostname">;

function normalizeOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch {
    return null;
  }
}

function normalizeCallbackUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

function isLocalHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1";
}

export function resolveOAuthCallbackUrl(location?: LocationLike | null): string {
  const configuredOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN || "",
  );
  if (configuredOrigin) {
    return `${configuredOrigin}${CALLBACK_PATH}`;
  }

  const activeLocation =
    location || (typeof window !== "undefined" ? window.location : null);

  if (!activeLocation) {
    return `${LOCALHOST_DEV_ORIGIN}${CALLBACK_PATH}`;
  }

  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && !isLocalHost(activeLocation.hostname)) {
    return `${LOCALHOST_DEV_ORIGIN}${CALLBACK_PATH}`;
  }

  return `${activeLocation.origin}${CALLBACK_PATH}`;
}

export function oauthProviderUrlMatchesExpectedCallback(
  providerUrl: string,
  expectedCallbackUrl: string,
): boolean {
  try {
    const parsedProviderUrl = new URL(providerUrl);
    const redirectTo = parsedProviderUrl.searchParams.get("redirect_to");
    if (!redirectTo) {
      return false;
    }

    return (
      normalizeCallbackUrl(redirectTo) ===
      normalizeCallbackUrl(expectedCallbackUrl)
    );
  } catch {
    return false;
  }
}
