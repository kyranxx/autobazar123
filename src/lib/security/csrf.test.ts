import { afterEach, describe, expect, it, vi } from "vitest";
import { validateSameOriginRequest } from "./csrf";

type MockRequest = {
  headers: Headers;
  nextUrl: {
    origin: string;
  };
};

function createRequest({
  nextOrigin = "https://autobazar123.sk",
  origin,
  referer,
}: {
  nextOrigin?: string;
  origin?: string;
  referer?: string;
} = {}): MockRequest {
  const headers = new Headers();
  if (typeof origin === "string") {
    headers.set("origin", origin);
  }
  if (typeof referer === "string") {
    headers.set("referer", referer);
  }

  return {
    headers,
    nextUrl: {
      origin: nextOrigin,
    },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("validateSameOriginRequest", () => {
  it("accepts same-origin requests via Origin header", () => {
    const result = validateSameOriginRequest(
      createRequest({ origin: "https://autobazar123.sk" }),
    );

    expect(result).toEqual({ ok: true, source: "origin" });
  });

  it("accepts same-origin requests via Referer when Origin is missing", () => {
    const result = validateSameOriginRequest(
      createRequest({ referer: "https://autobazar123.sk/kontakt" }),
    );

    expect(result).toEqual({ ok: true, source: "referer" });
  });

  it("rejects cross-origin requests", () => {
    const result = validateSameOriginRequest(
      createRequest({ origin: "https://attacker.example" }),
    );

    expect(result).toEqual({ ok: false, reason: "cross_origin" });
  });

  it("rejects missing Origin and Referer headers", () => {
    const result = validateSameOriginRequest(createRequest());

    expect(result).toEqual({ ok: false, reason: "missing_origin" });
  });

  it("accepts trusted env origins", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.autobazar123.sk");

    const result = validateSameOriginRequest(
      createRequest({ origin: "https://www.autobazar123.sk" }),
    );

    expect(result).toEqual({ ok: true, source: "origin" });
  });

  it("accepts extra trusted origins from CSRF_TRUSTED_ORIGINS", () => {
    vi.stubEnv(
      "CSRF_TRUSTED_ORIGINS",
      "https://partner.autobazar123.sk, https://app.autobazar123.sk",
    );

    const result = validateSameOriginRequest(
      createRequest({ origin: "https://partner.autobazar123.sk" }),
    );

    expect(result).toEqual({ ok: true, source: "origin" });
  });

  it("rejects malformed Origin headers", () => {
    const result = validateSameOriginRequest(
      createRequest({ origin: "not-a-url" }),
    );

    expect(result).toEqual({ ok: false, reason: "invalid_origin" });
  });
});

