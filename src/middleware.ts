import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired - important for Server Components
    const { data: { user } } = await supabase.auth.getUser()

    // 🛠️ Maintenance Mode Logic (STRICT ENFORCEMENT)
    const isMaintenancePage = request.nextUrl.pathname === '/maintenance'
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
    const isAuthRoute = request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/sign-in')
    const isStaticAsset = request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)

    if (!isMaintenancePage && !isAdminPage && !isAuthRoute && !isStaticAsset) {
        // 1. Check for bypass cookie
        const hasBypass = request.cookies.get('maintenance_bypass')?.value === 'true'

        // 2. Check for admin status
        let isAdmin = false;
        if (user) {
            try {
                // Create a service role client or regular client to check admin status
                // We use the existing supabase client which has the user's session
                const { data: adminEntry } = await supabase
                    .from('site_admins')
                    .select('user_id')
                    .eq('user_id', user.id)
                    .maybeSingle();
                isAdmin = !!adminEntry;
            } catch (e) {
                console.error("Admin check error", e);
            }
        }

        // 3. IF NOT ADMIN AND NO BYPASS, CHECK DB
        if (!hasBypass && !isAdmin) {
            // Create a fresh client for public data to avoid session issues/conflicts
            const publicSupabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: { getAll() { return [] }, setAll() { } }
                }
            );

            const { data: maintenanceSetting, error: dbError } = await publicSupabase
                .from('site_settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .maybeSingle();

            if (!dbError && maintenanceSetting) {
                const isEnabled = maintenanceSetting.value === 'true' || maintenanceSetting.value === true;
                if (isEnabled) {
                    const redirectUrl = new URL('/maintenance', request.url);
                    // Critical: Add noindex headers to the redirect itself
                    const response = NextResponse.redirect(redirectUrl);
                    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
                    return response;
                }
            }
        }
    }

    // 🛡️ Security Headers
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
    supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
    supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    supabaseResponse.headers.set('X-Frame-Options', 'DENY')

    // 🛑 Basic API Protection (Rate Limiting Placeholder)
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    if (isApiRoute) {
        // Here we could add Upstash Redis check
        // For now, only allow certain referers or add a standard limit signal
        supabaseResponse.headers.set('X-RateLimit-Limit', '100')
    }

    supabaseResponse.headers.set('X-Middleware-Applied', 'true')
    return supabaseResponse
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
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
