/**
 * 🛡️ Rate Limiting with Upstash Redis
 *
 * This provides rate limiting for API routes to prevent abuse.
 * Uses a sliding window algorithm.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getTrimmedEnv } from "@/lib/env";
import { recordFallbackActivation } from "@/lib/fallbacks/monitor";

// Create Redis client (lazy initialization)
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;
let strictRatelimit: Ratelimit | null = null;
const failClosedGenericRateLimit =
  process.env.RATE_LIMIT_FAIL_CLOSED === "true" ||
  process.env.NODE_ENV === "production";
const failClosedStrictRateLimit =
  process.env.STRICT_RATE_LIMIT_FAIL_CLOSED === "true" ||
  process.env.NODE_ENV === "production";

function parseTimeoutMs(
  envVarValue: string | undefined,
  fallbackMs: number,
): number {
  const parsed = Number.parseInt(envVarValue ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackMs;
  }
  return parsed;
}

const strictRateLimitTimeoutMs = parseTimeoutMs(
  process.env.STRICT_RATE_LIMIT_TIMEOUT_MS,
  3000,
);

function getRedis(): Redis | null {
  const redisUrl = getTrimmedEnv("UPSTASH_REDIS_REST_URL");
  const redisToken = getTrimmedEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!redisUrl || !redisToken) {
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });
    } catch (error) {
      console.error("Rate limiting unavailable: Redis init failed", error);
      return null;
    }
  }
  return redis;
}

function getRatelimit(): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
      analytics: true,
      prefix: "autobazar123",
    });
  }
  return ratelimit;
}

function getStrictRatelimit(): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  if (!strictRatelimit) {
    strictRatelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
      prefix: "autobazar123:strict",
      timeout: strictRateLimitTimeoutMs,
      ephemeralCache: new Map(),
    });
  }

  return strictRatelimit;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Usually the IP address or user ID
 * @returns { success: boolean, limit: number, remaining: number, reset: number }
 */
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}>;
export async function checkRateLimit(
  identifier: string,
  options: { failOpenOnInfrastructureError?: boolean },
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}>;
export async function checkRateLimit(
  identifier: string,
  options?: { failOpenOnInfrastructureError?: boolean },
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const failOpenOnInfrastructureError =
    options?.failOpenOnInfrastructureError === true;
  const limiter = getRatelimit();

  // In production, do not bypass rate limiting when Redis is unavailable.
  if (!limiter) {
    void recordFallbackActivation({
      key: "security.rate_limit_infra_fallback",
      summary: "Generic rate limiter unavailable; infrastructure fallback path used.",
      metadata: {
        limiter: "generic",
        failOpenOnInfrastructureError,
        failClosedGenericRateLimit,
      },
    });

    if (failOpenOnInfrastructureError) {
      return { success: true, limit: 100, remaining: 100, reset: 0 };
    }

    if (failClosedGenericRateLimit) {
      console.error("Rate limiting unavailable: Redis not configured");
      return {
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60_000,
      };
    }

    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    void recordFallbackActivation({
      key: "security.rate_limit_infra_fallback",
      summary: "Generic rate limiter threw; infrastructure fallback path used.",
      error,
      metadata: {
        limiter: "generic",
        failOpenOnInfrastructureError,
        failClosedGenericRateLimit,
      },
    });

    if (failOpenOnInfrastructureError) {
      return { success: true, limit: 100, remaining: 100, reset: 0 };
    }

    if (failClosedGenericRateLimit) {
      return {
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60_000,
      };
    }

    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }
}

/**
 * Stricter rate limit for sensitive operations (login, register, contact)
 * 10 requests per minute
 */
export async function checkStrictRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}>;
export async function checkStrictRateLimit(
  identifier: string,
  options: { failOpenOnInfrastructureError?: boolean },
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}>;
export async function checkStrictRateLimit(
  identifier: string,
  options?: { failOpenOnInfrastructureError?: boolean },
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const failOpenOnInfrastructureError =
    options?.failOpenOnInfrastructureError === true;
  const strictLimiter = getStrictRatelimit();
  if (!strictLimiter) {
    console.error("Strict rate limiting unavailable: Redis not configured");
    void recordFallbackActivation({
      key: "security.rate_limit_infra_fallback",
      summary: "Strict rate limiter unavailable; infrastructure fallback path used.",
      metadata: {
        limiter: "strict",
        failOpenOnInfrastructureError,
        failClosedStrictRateLimit,
      },
    });

    if (failOpenOnInfrastructureError) {
      return { success: true, limit: 10, remaining: 10, reset: 0 };
    }

    if (failClosedStrictRateLimit) {
      return { success: false, limit: 10, remaining: 0, reset: Date.now() + 60000 };
    }

    return { success: true, limit: 10, remaining: 10, reset: 0 };
  }

  try {
    const result = await strictLimiter.limit(identifier);
    if (result.reason === "timeout") {
      console.warn(
        "Strict rate limit request timed out; treating as infrastructure failure.",
      );
      void recordFallbackActivation({
        key: "security.strict_rate_limit_timeout_fallback",
        summary: "Strict rate limiter timed out and activated timeout fallback behavior.",
        metadata: {
          failOpenOnInfrastructureError,
          failClosedStrictRateLimit,
        },
      });

      if (failOpenOnInfrastructureError) {
        return {
          success: true,
          limit: result.limit,
          remaining: Math.max(1, result.remaining),
          reset: result.reset,
        };
      }

      if (failClosedStrictRateLimit) {
        return {
          success: false,
          limit: result.limit,
          remaining: 0,
          reset: result.reset || Date.now() + 60_000,
        };
      }

      return {
        success: true,
        limit: result.limit,
        remaining: Math.max(1, result.remaining),
        reset: result.reset,
      };
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Strict rate limit check failed:", error);
    void recordFallbackActivation({
      key: "security.rate_limit_infra_fallback",
      summary: "Strict rate limiter threw; infrastructure fallback path used.",
      error,
      metadata: {
        limiter: "strict",
        failOpenOnInfrastructureError,
        failClosedStrictRateLimit,
      },
    });

    if (failOpenOnInfrastructureError) {
      return { success: true, limit: 10, remaining: 10, reset: 0 };
    }

    if (!failClosedStrictRateLimit) {
      return { success: true, limit: 10, remaining: 10, reset: 0 };
    }

    return { success: false, limit: 10, remaining: 0, reset: Date.now() + 60000 };
  }
}
