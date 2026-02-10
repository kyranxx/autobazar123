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

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://*.algolia.net https://*.algolianet.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://imagedelivery.net https://images.unsplash.com https://plus.unsplash.com https://*.supabase.co",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.algolia.net https://*.algolianet.com https://api.stripe.com https://*.upstash.io",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  "X-XSS-Protection": "1; mode=block",
};

const PROTECTED_ROUTES = {
  admin: ["/admin"],
  dealer: ["/dealer"],
  authenticated: [
    "/moj-ucet",
    "/moje-inzeraty",
    "/pridat-inzerat",
    "/favorites",
    "/messages",
  ],
};

function isProtectedRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
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
      .from("profiles")
      .select("is_dealer")
      .eq("id", userId)
      .single();
    return data?.is_dealer ?? false;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const requestId = generateRequestId();
  const pathname = request.nextUrl.pathname;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    supabaseResponse.headers.set("X-Request-ID", requestId);
    return supabaseResponse;
  }

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
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh session if expired - important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Rate limiting for protected routes
  const isProtected =
    isProtectedRoute(pathname, PROTECTED_ROUTES.admin) ||
    isProtectedRoute(pathname, PROTECTED_ROUTES.dealer) ||
    isProtectedRoute(pathname, PROTECTED_ROUTES.authenticated);

  if (isProtected && !isStaticAsset) {
    try {
      const { checkRateLimit } = await import("@/lib/ratelimit");
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const rateLimitResult = await checkRateLimit(`proxy:${ip}`);

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
    if (!user) {
      const loginUrl = new URL("/prihlasenie", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isAdmin = await checkIsAdmin(user.id);
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
    if (!user) {
      const loginUrl = new URL("/prihlasenie", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const [isDealer, isAdmin] = await Promise.all([
      checkIsDealer(user.id),
      checkIsAdmin(user.id),
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
    if (!user) {
      const loginUrl = new URL("/prihlasenie", request.url);
      loginUrl.searchParams.set("redirect", pathname);
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
      process.env.NEXT_PUBLIC_DISABLE_MAINTENANCE === "true";
    if (!maintenanceDisabled) {
      const hasBypass =
        request.cookies.get("maintenance_bypass")?.value === "true";
      const isAdmin = user ? await checkIsAdmin(user.id) : false;

      if (!hasBypass && !isAdmin) {
        const publicSupabase = createServerClient(supabaseUrl, supabaseKey, {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {},
          },
        });

        const { data: maintenanceSetting, error: dbError } =
          await publicSupabase
            .from("site_settings")
            .select("value")
            .eq("key", "maintenance_mode")
            .maybeSingle();

        if (!dbError && maintenanceSetting) {
          const isEnabled =
            maintenanceSetting.value === "true" ||
            maintenanceSetting.value === true;
          if (isEnabled) {
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

  // Request tracking
  supabaseResponse.headers.set("X-Request-ID", requestId);

  // User ID header for logging (internal use only)
  if (user) {
    supabaseResponse.headers.set("X-User-ID", user.id);
  }

  // API route specific headers
  if (isApiRoute) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    supabaseResponse.headers.set("X-RateLimit-Limit", "100");
    supabaseResponse.headers.set("X-Client-IP", ip);
  }

  supabaseResponse.headers.set("X-Middleware-Applied", "true");
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
