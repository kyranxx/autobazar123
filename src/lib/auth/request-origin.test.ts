import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveAuthRequestOrigin } from "./request-origin";

type MockRequest = {
  headers: Headers;
  nextUrl: { origin: string };
};

function createMockRequest({
  origin = "http://localhost:3000",
  host,
  forwardedHost,
  forwardedProto,
}: {
  origin?: string;
  host?: string;
  forwardedHost?: string;
  forwardedProto?: string;
} = {}): MockRequest {
  const headers = new Headers();

  if (host) headers.set("host", host);
  if (forwardedHost) headers.set("x-forwarded-host", forwardedHost);
  if (forwardedProto) headers.set("x-forwarded-proto", forwardedProto);

  return {
    headers,
    nextUrl: { origin },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveAuthRequestOrigin", () => {
  it("prefers configured auth redirect origin when set", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN", "http://localhost:3010");

    const request = createMockRequest({ origin: "https://autobazar123.sk" });

    expect(resolveAuthRequestOrigin(request)).toBe("http://localhost:3010");
  });

  it("prefers localhost request origin over a non-localhost configured override", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN", "https://autobazar123.sk");

    const request = createMockRequest({ origin: "http://localhost:3000" });

    expect(resolveAuthRequestOrigin(request)).toBe("http://localhost:3000");
  });

  it("prefers localhost host header over a non-localhost configured override", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN", "https://autobazar123.sk");

    const request = createMockRequest({
      origin: "",
      host: "localhost:3000",
    });

    expect(resolveAuthRequestOrigin(request)).toBe("http://localhost:3000");
  });

  it("uses request nextUrl origin when no explicit override exists", () => {
    delete process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN;

    const request = createMockRequest({ origin: "http://localhost:3000" });

    expect(resolveAuthRequestOrigin(request)).toBe("http://localhost:3000");
  });

  it("falls back to host header and infers localhost protocol", () => {
    delete process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN;

    const request = createMockRequest({
      origin: "",
      host: "localhost:3001",
    });

    expect(resolveAuthRequestOrigin(request)).toBe("http://localhost:3001");
  });

  it("falls back to site url when request origin and headers are unavailable", () => {
    delete process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN;
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://autobazar123.sk");

    const request = createMockRequest({ origin: "" });

    expect(resolveAuthRequestOrigin(request)).toBe("https://autobazar123.sk");
  });
});
