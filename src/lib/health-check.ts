/**
 * Comprehensive Health Check for All Systems
 * Run manually or from API endpoint
 */

import { createClient } from "@/lib/supabase/server";

export interface HealthStatus {
  database: {
    status: "ok" | "error";
    latency: number;
    error?: string;
  };
  api: {
    status: "ok" | "error";
    endpoints: {
      health: boolean;
      auth: boolean;
      search: boolean;
      payment: boolean;
    };
    error?: string;
  };
  storage: {
    status: "ok" | "error";
    buckets: string[];
    error?: string;
  };
  cache: {
    status: "ok" | "error";
    latency?: number;
    error?: string;
  };
  overall: "healthy" | "degraded" | "critical";
  timestamp: string;
  uptime: number;
}

/**
 * Check database connectivity
 */
export async function checkDatabase(): Promise<HealthStatus["database"]> {
  const start = Date.now();
  try {
    const supabase = await createClient();

    // Simple query to test connection
    const { data: _data, error } = await supabase
      .from("ads")
      .select("count", { count: "exact", head: true });

    if (error) {
      return {
        status: "error",
        latency: Date.now() - start,
        error: error.message,
      };
    }

    return {
      status: "ok",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "error",
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check API endpoints
 */
export async function checkAPI(): Promise<HealthStatus["api"]> {
  const endpoints = {
    health: false,
    auth: false,
    search: false,
    payment: false,
  };

  try {
    // Health endpoint
    try {
      const healthRes = await fetch("/api/health");
      endpoints.health = healthRes.ok;
    } catch {
      endpoints.health = false;
    }

    // Auth endpoint (no auth required for status check)
    try {
      const authRes = await fetch("/auth/login", { method: "GET" });
      endpoints.auth = authRes.status !== 500;
    } catch {
      endpoints.auth = false;
    }

    // Search endpoint
    try {
      const searchRes = await fetch("/vysledky", { method: "GET" });
      endpoints.search = searchRes.status !== 500;
    } catch {
      endpoints.search = false;
    }

    // Payment endpoint
    try {
      const paymentRes = await fetch("/kredity", { method: "GET" });
      endpoints.payment = paymentRes.status !== 500;
    } catch {
      endpoints.payment = false;
    }

    const allHealthy = Object.values(endpoints).every((v) => v);

    return {
      status: allHealthy ? "ok" : "error",
      endpoints,
    };
  } catch (error) {
    return {
      status: "error",
      endpoints,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check storage connectivity
 */
export async function checkStorage(): Promise<HealthStatus["storage"]> {
  try {
    const supabase = await createClient();

    // List buckets
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      return {
        status: "error",
        buckets: [],
        error: error.message,
      };
    }

    return {
      status: "ok",
      buckets: (data || []).map((b) => b.name),
    };
  } catch (error) {
    return {
      status: "error",
      buckets: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check cache connectivity (Redis/Upstash)
 */
export async function checkCache(): Promise<HealthStatus["cache"]> {
  const start = Date.now();
  try {
    // Only check if UPSTASH_REDIS_REST_URL is set
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return {
        status: "ok",
        latency: 0,
      };
    }

    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        status: "error",
        latency,
        error: `HTTP ${response.status}`,
      };
    }

    return {
      status: "ok",
      latency,
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();

  const [database, api, storage, cache] = await Promise.all([
    checkDatabase(),
    checkAPI(),
    checkStorage(),
    checkCache(),
  ]);

  // Determine overall status
  const allOk = [database, api, storage, cache].every(
    (check) => check.status === "ok",
  );
  const overall = allOk ? "healthy" : "degraded";

  // If critical systems down, mark as critical
  const criticalDown =
    database.status === "error" ||
    (api.status === "error" &&
      !Object.values(api.endpoints || {}).some((v) => v));
  const status = criticalDown ? "critical" : overall;

  return {
    database,
    api,
    storage,
    cache,
    overall: status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
}
