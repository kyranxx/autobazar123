type FallbackCriticality = "critical" | "non_critical";

type FallbackCategory =
  | "api"
  | "auth"
  | "payment"
  | "search"
  | "system"
  | "admin";

interface FallbackPolicy {
  key: string;
  category: FallbackCategory;
  criticality: FallbackCriticality;
  thresholdCount: number;
  thresholdWindowMinutes: number;
  owner: string;
  reason: string;
  reviewBy: string;
}

function createPolicy(policy: FallbackPolicy): FallbackPolicy {
  return policy;
}

export const FALLBACK_REGISTRY = {
  "search.algolia_missing_keys": createPolicy({
    key: "search.algolia_missing_keys",
    category: "search",
    criticality: "non_critical",
    thresholdCount: 3,
    thresholdWindowMinutes: 15,
    owner: "search",
    reason: "Algolia search credentials are missing and the app switched to fallback catalog search.",
    reviewBy: "2026-06-30",
  }),
  "search.algolia_unavailable": createPolicy({
    key: "search.algolia_unavailable",
    category: "search",
    criticality: "critical",
    thresholdCount: 1,
    thresholdWindowMinutes: 5,
    owner: "search",
    reason: "Algolia requests failed at runtime and search traffic degraded to fallback catalog search.",
    reviewBy: "2026-06-30",
  }),
  "search.catalog_api_degraded": createPolicy({
    key: "search.catalog_api_degraded",
    category: "search",
    criticality: "critical",
    thresholdCount: 1,
    thresholdWindowMinutes: 5,
    owner: "search",
    reason: "Fallback catalog API returned empty degraded response due to upstream read failure.",
    reviewBy: "2026-06-30",
  }),
  "home.featured_cars_empty_fallback": createPolicy({
    key: "home.featured_cars_empty_fallback",
    category: "system",
    criticality: "non_critical",
    thresholdCount: 5,
    thresholdWindowMinutes: 30,
    owner: "platform",
    reason: "Featured cars cache read failed and returned an empty list.",
    reviewBy: "2026-06-30",
  }),
  "security.rate_limit_infra_fallback": createPolicy({
    key: "security.rate_limit_infra_fallback",
    category: "auth",
    criticality: "non_critical",
    thresholdCount: 10,
    thresholdWindowMinutes: 5,
    owner: "security",
    reason: "Rate-limit infrastructure fallback path activated due to Redis/limiter failure.",
    reviewBy: "2026-06-30",
  }),
  "security.strict_rate_limit_timeout_fallback": createPolicy({
    key: "security.strict_rate_limit_timeout_fallback",
    category: "auth",
    criticality: "non_critical",
    thresholdCount: 5,
    thresholdWindowMinutes: 5,
    owner: "security",
    reason: "Strict rate-limit timeout fallback activated for sensitive routes.",
    reviewBy: "2026-06-30",
  }),
  "proxy.maintenance_query_timeout_fallback": createPolicy({
    key: "proxy.maintenance_query_timeout_fallback",
    category: "system",
    criticality: "non_critical",
    thresholdCount: 3,
    thresholdWindowMinutes: 15,
    owner: "platform",
    reason: "Maintenance mode lookup timed out and fell back to fail-open value.",
    reviewBy: "2026-06-30",
  }),
  "proxy.auth_get_user_timeout_fallback": createPolicy({
    key: "proxy.auth_get_user_timeout_fallback",
    category: "auth",
    criticality: "non_critical",
    thresholdCount: 5,
    thresholdWindowMinutes: 5,
    owner: "security",
    reason: "Proxy auth user lookup timed out and fell back to unauthenticated state.",
    reviewBy: "2026-06-30",
  }),
} as const;

export type FallbackKey = keyof typeof FALLBACK_REGISTRY;

export function getFallbackPolicy(key: FallbackKey): FallbackPolicy {
  return FALLBACK_REGISTRY[key];
}

export function getAllFallbackPolicies(): FallbackPolicy[] {
  return Object.values(FALLBACK_REGISTRY);
}
