const DEFAULT_SITE_ORIGIN = "https://autobazar123.sk";

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

function inferProtocol(host: string, forwardedProto: string | null): "http" | "https" {
  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  return host.includes("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";
}

export function resolveAuthRequestOrigin(
  request: RequestOriginSource,
): string {
  const configuredOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN,
  );
  if (configuredOrigin) return configuredOrigin;

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

  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    DEFAULT_SITE_ORIGIN
  );
}
