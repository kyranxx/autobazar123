import { APP_URLS } from "@/config/config";

const LOCALHOST_DEV_ORIGIN = APP_URLS.localhostOrigin;
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

function normalizeRedirectUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "[::1]"
  );
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    return isLoopbackHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function resolveOAuthCallbackUrl(location?: LocationLike | null): string {
  const activeLocation =
    location || (typeof window !== "undefined" ? window.location : null);
  const activeOrigin = activeLocation ? normalizeOrigin(activeLocation.origin) : null;

  const configuredOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN || "",
  );
  if (configuredOrigin) {
    if (
      activeLocation &&
      activeOrigin &&
      isLoopbackOrigin(configuredOrigin) &&
      !isLoopbackHost(activeLocation.hostname)
    ) {
      return `${activeOrigin}${CALLBACK_PATH}`;
    }

    return `${configuredOrigin}${CALLBACK_PATH}`;
  }

  if (!activeLocation) {
    return `${LOCALHOST_DEV_ORIGIN}${CALLBACK_PATH}`;
  }

  if (activeOrigin) {
    return `${activeOrigin}${CALLBACK_PATH}`;
  }

  return `${LOCALHOST_DEV_ORIGIN}${CALLBACK_PATH}`;
}

export function providerUrlMatchesExpectedRedirect(
  providerUrl: string,
  expectedRedirectUrl: string,
): boolean {
  try {
    const parsedProviderUrl = new URL(providerUrl);
    const redirectTo = parsedProviderUrl.searchParams.get("redirect_to");
    if (!redirectTo) {
      return false;
    }

    return (
      normalizeRedirectUrl(redirectTo) ===
      normalizeRedirectUrl(expectedRedirectUrl)
    );
  } catch {
    return false;
  }
}

export function oauthProviderUrlMatchesExpectedCallback(
  providerUrl: string,
  expectedCallbackUrl: string,
): boolean {
  return providerUrlMatchesExpectedRedirect(providerUrl, expectedCallbackUrl);
}
