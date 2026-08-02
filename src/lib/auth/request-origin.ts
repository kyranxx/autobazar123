import { APP_URLS } from "@/config/config";
import {
  getMarketConfig,
  resolveKnownMarketCodeFromHost,
  type MarketCode,
} from "@/config/markets";

type RequestOriginSource = {
  headers: Pick<Headers, "get">;
  nextUrl: {
    origin: string;
  };
};

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

function pickForwardedValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

function extractHostname(host: string): string {
  const candidate = host.trim();
  if (!candidate) return "";

  if (candidate.startsWith("[")) {
    const closingIndex = candidate.indexOf("]");
    if (closingIndex >= 0) {
      return candidate.slice(1, closingIndex);
    }
  }

  const hostname = candidate.split(":")[0];
  return hostname || candidate;
}

function isLoopbackHost(hostname: string): boolean {
  const normalized = extractHostname(hostname).toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1"
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

function resolveMarketCodeFromOrigin(origin: string | null): MarketCode | null {
  if (!origin) return null;

  try {
    return resolveKnownMarketCodeFromHost(new URL(origin).hostname);
  } catch {
    return null;
  }
}

function inferProtocol(host: string, forwardedProto: string | null): "http" | "https" {
  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  return isLoopbackHost(host) ? "http" : "https";
}

function resolveRequestOriginCandidate(request: RequestOriginSource): string | null {
  const requestOrigin = normalizeOrigin(request.nextUrl?.origin);
  if (requestOrigin) return requestOrigin;

  const forwardedHost = pickForwardedValue(request.headers.get("x-forwarded-host"));
  if (forwardedHost) {
    const forwardedProto = pickForwardedValue(
      request.headers.get("x-forwarded-proto"),
    );
    const protocol = inferProtocol(forwardedHost, forwardedProto);
    return `${protocol}://${forwardedHost}`;
  }

  const host = request.headers.get("host");
  if (host) {
    const protocol = inferProtocol(host, null);
    return `${protocol}://${host}`;
  }

  return null;
}

export function resolveAuthRequestOrigin(request: RequestOriginSource): string {
  const requestOrigin = resolveRequestOriginCandidate(request);
  const configuredOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN,
  );
  const forwardedHost = pickForwardedValue(
    request.headers.get("x-forwarded-host"),
  );
  const headerHost = request.headers.get("host");
  const requestMarketCode =
    resolveMarketCodeFromOrigin(requestOrigin) ??
    resolveKnownMarketCodeFromHost(forwardedHost || headerHost);
  const configuredMarketCode = resolveMarketCodeFromOrigin(configuredOrigin);

  if (configuredOrigin) {
    if (
      requestOrigin &&
      isLoopbackOrigin(requestOrigin) &&
      !isLoopbackOrigin(configuredOrigin)
    ) {
      return requestOrigin;
    }

    if (
      requestMarketCode &&
      configuredMarketCode &&
      requestMarketCode !== configuredMarketCode
    ) {
      return getMarketConfig(requestMarketCode).origin;
    }

    return configuredOrigin;
  }

  if (requestMarketCode) {
    return getMarketConfig(requestMarketCode).origin;
  }

  if (requestOrigin) return requestOrigin;

  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    APP_URLS.siteOrigin
  );
}
