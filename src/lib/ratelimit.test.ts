import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisInitMock = vi.fn();
const ratelimitLimitMock = vi.fn();
const ratelimitCtorMock = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    constructor(config: unknown) {
      redisInitMock(config);
    }
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow(limit: number, window: string) {
      return { limit, window };
    }

    constructor(config: unknown) {
      ratelimitCtorMock(config);
    }

    limit(identifier: string) {
      return ratelimitLimitMock(identifier);
    }
  },
}));

async function loadRateLimitModule() {
  vi.resetModules();
  return import("./ratelimit");
}

describe("checkStrictRateLimit", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("fails open when Redis client initialization throws and fail-open is requested", async () => {
    redisInitMock.mockImplementationOnce(() => {
      throw new Error("invalid redis config");
    });

    const { checkStrictRateLimit } = await loadRateLimitModule();
    const result = await checkStrictRateLimit("maintenance_unlock:fingerprint", {
      failOpenOnInfrastructureError: true,
    });

    expect(result).toEqual({ success: true, limit: 10, remaining: 10, reset: 0 });
    expect(ratelimitCtorMock).not.toHaveBeenCalled();
    expect(ratelimitLimitMock).not.toHaveBeenCalled();
  });

  it("stays fail-closed in production when fail-open is not requested", async () => {
    redisInitMock.mockImplementationOnce(() => {
      throw new Error("invalid redis config");
    });

    const { checkStrictRateLimit } = await loadRateLimitModule();
    const result = await checkStrictRateLimit("maintenance_unlock:fingerprint");

    expect(result.success).toBe(false);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(0);
    expect(result.reset).toBeGreaterThan(Date.now());
  });

  it("fails closed on strict limiter timeout in production", async () => {
    ratelimitLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60_000,
      reason: "timeout",
    });

    const { checkStrictRateLimit } = await loadRateLimitModule();
    const result = await checkStrictRateLimit("auth_register:fingerprint");

    expect(result.success).toBe(false);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(0);
  });

  it("trims Redis env values before initializing Upstash", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", " https://example.upstash.io \n");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "\n token \r\n");
    ratelimitLimitMock.mockResolvedValueOnce({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });

    const { checkStrictRateLimit } = await loadRateLimitModule();
    await checkStrictRateLimit("auth_register:fingerprint");

    expect(redisInitMock).toHaveBeenCalledWith({
      url: "https://example.upstash.io",
      token: "token",
    });
  });

  it("supports Vercel Upstash integration environment names", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv(
      "UPSTASH_REDIS_REST_KV_REST_API_URL",
      "https://vercel-integration.upstash.io",
    );
    vi.stubEnv("UPSTASH_REDIS_REST_KV_REST_API_TOKEN", "integration-token");
    ratelimitLimitMock.mockResolvedValueOnce({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });

    const { checkStrictRateLimit } = await loadRateLimitModule();
    await checkStrictRateLimit("auth_register:fingerprint");

    expect(redisInitMock).toHaveBeenCalledWith({
      url: "https://vercel-integration.upstash.io",
      token: "integration-token",
    });
  });

  it("allows timeout only when explicit fail-open is requested", async () => {
    ratelimitLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60_000,
      reason: "timeout",
    });

    const { checkStrictRateLimit } = await loadRateLimitModule();
    const result = await checkStrictRateLimit("maintenance_unlock:fingerprint", {
      failOpenOnInfrastructureError: true,
    });

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
  });
});
