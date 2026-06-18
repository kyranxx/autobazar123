/**
 * Next.js 16 Proxy for Autobazar123
 *
 * Handles:
 * - Security headers (CSP, HSTS, etc.)
 * - RBAC route protection (admin, dealer, authenticated routes)
 * - Request ID generation for logging
 * - Rate limiting integration
 * - Maintenance mode
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isValidMaintenanceBypassToken,
  resolveMaintenanceBypassSecret,
} from "@/lib/security/maintenance-bypass";
import { buildCspHeader } from "@/lib/security/csp";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import type { FallbackKey } from "@/lib/fallbacks/registry";
import {
  CSRF_TOKEN_COOKIE_NAME,
  generateCsrfToken,
} from "@/lib/security/csrf-token";
import { assertRuntimeEnvConfigured } from "@/lib/env";
import {
  isSiteIndexingEnabled,
  PRELAUNCH_ROBOTS_HEADER,
} from "@/lib/seo/crawl-policy";

assertRuntimeEnvConfigured("proxy");

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Maintenance checks run on most page requests. Keep them cheap (short cache) and safe
// (fail-open quickly if Supabase is slow/unavailable) to avoid slowing down the whole site.
const MAINTENANCE_CACHE_TTL_MS = 30_000;
const MAINTENANCE_QUERY_TIMEOUT_MS = 2_000;
const AUTH_GET_USER_TIMEOUT_MS = 3_000;

const maintenanceCache: {
  value: boolean;
  expiresAt: number;
  inFlight: Promise<boolean> | null;
} = {
  value: false,
  expiresAt: 0,
  inFlight: null,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emitProxyFallbackEvent(
  key: FallbackKey,
  summary: string,
  metadata?: Record<string, unknown>,
) {
  void import("@/lib/fallbacks/monitor")
    .then(({ recordFallbackActivation }) =>
      recordFallbackActivation({
        key,
        summary,
        metadata,
      }))
    .catch((error) => {
      console.error("Proxy fallback monitoring import failed", error);
    });
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  onTimeout?: () => void,
): Promise<T> {
  return (await Promise.race([
    promise,
    delay(timeoutMs).then(() => {
      try {
        onTimeout?.();
      } catch (error) {
        console.error("Proxy fallback timeout callback failed", error);
      }
      return fallback;
    }),
  ])) as T;
}

async function getMaintenanceModeCached(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<boolean> {
  const now = Date.now();
  if (now < maintenanceCache.expiresAt) {
    return maintenanceCache.value;
  }

  if (maintenanceCache.inFlight) {
    return maintenanceCache.inFlight;
  }

  maintenanceCache.inFlight = (async () => {
    const publicSupabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });

    const enabled = await withTimeout(
      (async () => {
        const { data: maintenanceSetting, error } = await publicSupabase
          .from("site_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();

        if (error || !maintenanceSetting) return false;

        return (
          maintenanceSetting.value === "true" || maintenanceSetting.value === true
        );
      })(),
      MAINTENANCE_QUERY_TIMEOUT_MS,
      false,
      () =>
        emitProxyFallbackEvent(
          "proxy.maintenance_query_timeout_fallback",
          "Maintenance-mode query timed out and fell back to fail-open value.",
          {
            timeoutMs: MAINTENANCE_QUERY_TIMEOUT_MS,
          },
        ),
    );

    maintenanceCache.value = enabled;
    maintenanceCache.expiresAt = Date.now() + MAINTENANCE_CACHE_TTL_MS;
    return enabled;
  })();

  try {
    return await maintenanceCache.inFlight;
  } finally {
    maintenanceCache.inFlight = null;
  }
}

// Next.js dev bundles rely on eval-based source mapping in development.
// Keep production CSP strict while avoiding false-positive dev-only issues.
const googleOneTapEnabled =
  process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP === "true" ||
  (process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP !== "false" &&
    Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID));

function getSecurityHeaders(protocol: string): Record<string, string> {
  // `upgrade-insecure-requests` breaks local `http://localhost` by upgrading internal
  // navigations/prefetches to `https://localhost` (which isn't serving TLS).
  const shouldUpgradeInsecureRequests =
    process.env.NODE_ENV === "production" && protocol === "https:";

  const csp = buildCspHeader({
    isDev: process.env.NODE_ENV !== "production",
    enableGoogleOneTap: googleOneTapEnabled,
    includeUpgradeInsecureRequests: shouldUpgradeInsecureRequests,
    publicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  return {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
    "X-XSS-Protection": "1; mode=block",
  };
}

const PROTECTED_ROUTES = {
  admin: ["/admin"],
  dealer: ["/dealer"],
  authenticated: [
    "/moj-ucet",
    "/moje-inzeraty",
    "/pridat-inzerat",
    "/upravit-inzerat",
    "/ulozene",
    "/spravy",
  ],
};

const MAINTENANCE_BYPASS_HOSTS = new Set(["autobazar123.vercel.app"]);

function isProtectedRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

function isMaintenanceBypassHost(hostname: string): boolean {
  return MAINTENANCE_BYPASS_HOSTS.has(hostname.toLowerCase());
}

function isNavigationPrefetchRequest(request: NextRequest): boolean {
  const nextRouterPrefetch = request.headers.get("next-router-prefetch") === "1";
  const middlewarePrefetch = request.headers.get("x-middleware-prefetch") === "1";
  const purpose = request.headers.get("purpose")?.toLowerCase() === "prefetch";
  const secPurpose =
    request.headers.get("sec-purpose")?.toLowerCase() === "prefetch";

  return nextRouterPrefetch || middlewarePrefetch || purpose || secPurpose;
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return false;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data } = await adminClient
      .from("site_admins")
      .select("user_id")
      .eq("user_id", userId)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

async function checkIsDealer(userId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return false;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data } = await adminClient
      .from("dealers")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const requestId = generateRequestId();
  const pathname = request.nextUrl.pathname;
  const isFacetedSearchResultsRoute = pathname === "/vysledky";
  const hasSearchQueryParams = request.nextUrl.searchParams.size > 0;
  const redirectTarget = `${pathname}${request.nextUrl.search}`;
  const securityHeaders = getSecurityHeaders(request.nextUrl.protocol);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    supabaseResponse.headers.set("X-Request-ID", requestId);
    return supabaseResponse;
  }

  const isMaintenancePage = pathname === "/maintenance";
  const isAdminPage = pathname.startsWith("/admin");
  const isAuthRoute =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/prihlasenie") ||
    pathname.startsWith("/registracia");
  const isStaticAsset = pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/);
  const isApiRoute = pathname.startsWith("/api");

  let userId: string | null = null;
  let hasFetchedUser = false;

  const getUserId = async (): Promise<string | null> => {
    if (hasFetchedUser) return userId;
    hasFetchedUser = true;

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh session if expired - important for protected pages and server components that
    // require auth. Public pages shouldn't block on this network call.
    try {
      const fetchedUser = await withTimeout(
        (async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          return user ?? null;
        })(),
        AUTH_GET_USER_TIMEOUT_MS,
        null,
        () =>
          emitProxyFallbackEvent(
            "proxy.auth_get_user_timeout_fallback",
            "Proxy auth user lookup timed out and fell back to unauthenticated state.",
            {
              timeoutMs: AUTH_GET_USER_TIMEOUT_MS,
              pathname,
            },
          ),
      );
      userId = fetchedUser?.id ?? null;
    } catch {
      userId = null;
    }

    return userId;
  };

  // Rate limiting for protected routes
  const isProtected =
    isProtectedRoute(pathname, PROTECTED_ROUTES.admin) ||
    isProtectedRoute(pathname, PROTECTED_ROUTES.dealer) ||
    isProtectedRoute(pathname, PROTECTED_ROUTES.authenticated);
  const isPrefetchRequest = isNavigationPrefetchRequest(request);

  if (isProtected && !isStaticAsset && !isPrefetchRequest) {
    try {
      const { checkRateLimit } = await import("@/lib/ratelimit");
      const currentUserId = await getUserId();
      const rateLimitIdentifier = currentUserId
        ? `proxy:user:${currentUserId}`
        : createRateLimitIdentifier("proxy", request.headers);
      const rateLimitResult = await checkRateLimit(rateLimitIdentifier);

      if (!rateLimitResult.success) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-Request-ID": requestId,
          },
        });
      }
    } catch (error) {
      console.error("Rate limit check error:", error);
    }
  }

  // RBAC: Check admin routes
  if (isProtectedRoute(pathname, PROTECTED_ROUTES.admin) && !isStaticAsset) {
    const currentUserId = await getUserId();
    if (!currentUserId) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", redirectTarget);
      return NextResponse.redirect(loginUrl);
    }

    const isAdmin = await checkIsAdmin(currentUserId);
    if (!isAdmin) {
      return new NextResponse("Forbidden: Admin access required", {
        status: 403,
        headers: {
          "X-Request-ID": requestId,
          ...securityHeaders,
        },
      });
    }
  }

  // RBAC: Check dealer routes
  if (isProtectedRoute(pathname, PROTECTED_ROUTES.dealer) && !isStaticAsset) {
    const currentUserId = await getUserId();
    if (!currentUserId) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", redirectTarget);
      return NextResponse.redirect(loginUrl);
    }

    const [isDealer, isAdmin] = await Promise.all([
      checkIsDealer(currentUserId),
      checkIsAdmin(currentUserId),
    ]);

    if (!isDealer && !isAdmin) {
      return new NextResponse("Forbidden: Dealer access required", {
        status: 403,
        headers: {
          "X-Request-ID": requestId,
          ...securityHeaders,
        },
      });
    }
  }

  // RBAC: Check authenticated routes
  if (
    isProtectedRoute(pathname, PROTECTED_ROUTES.authenticated) &&
    !isStaticAsset
  ) {
    const currentUserId = await getUserId();
    if (!currentUserId) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", redirectTarget);
      return NextResponse.redirect(loginUrl);
    }
  }


  // Maintenance mode check (skip for admin, auth, static assets, api routes)
  if (
    !isMaintenancePage &&
    !isAdminPage &&
    !isAuthRoute &&
    !isStaticAsset &&
    !isApiRoute
  ) {
    const maintenanceDisabled =
      process.env.NEXT_PUBLIC_DISABLE_MAINTENANCE === "true" ||
      isMaintenanceBypassHost(request.nextUrl.hostname);
    if (!maintenanceDisabled) {
      const hasBypass = await isValidMaintenanceBypassToken(
        request.cookies.get("maintenance_bypass")?.value,
        resolveMaintenanceBypassSecret(),
      );

      if (!hasBypass) {
        const isEnabled = await getMaintenanceModeCached(supabaseUrl, supabaseKey);
        if (isEnabled) {
          // Keep admin access during maintenance, but only pay the auth + RBAC cost when
          // maintenance mode is actually enabled.
          const currentUserId = await getUserId();
          const isAdmin = currentUserId ? await checkIsAdmin(currentUserId) : false;

          if (!isAdmin) {
            const redirectUrl = new URL("/maintenance", request.url);
            const response = NextResponse.redirect(redirectUrl);
            response.headers.set(
              "X-Robots-Tag",
              "noindex, nofollow, noarchive",
            );
            response.headers.set("X-Request-ID", requestId);
            return response;
          }
        }
      }
    }
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value);
  });

  if (!request.cookies.get(CSRF_TOKEN_COOKIE_NAME)?.value) {
    supabaseResponse.cookies.set(CSRF_TOKEN_COOKIE_NAME, generateCsrfToken(), {
      httpOnly: false,
      sameSite: "strict",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
    });
  }

  // Keep faceted search result variants out of the index while preserving crawl.
  if (!isSiteIndexingEnabled()) {
    supabaseResponse.headers.set("X-Robots-Tag", PRELAUNCH_ROBOTS_HEADER);
  } else if (isFacetedSearchResultsRoute && hasSearchQueryParams) {
    supabaseResponse.headers.set("X-Robots-Tag", "noindex, follow");
  }

  // Request tracking
  supabaseResponse.headers.set("X-Request-ID", requestId);
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - .well-known (platform/browser probes like Chrome DevTools app-specific JSON)
     * - favicon.ico (favicon file)
     * - manifest.webmanifest
     * - sw.js
     * - public folder assets
     */
    "/((?!_next/static|_next/image|\\.well-known|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
