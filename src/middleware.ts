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

    // 🛠️ Maintenance Mode Logic
    const isMaintenancePage = request.nextUrl.pathname === '/maintenance'
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
    const isStaticAsset = request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)

    if (!isMaintenancePage && !isAdminPage && !isStaticAsset) {
        // 1. Check for bypass cookie
        const hasBypass = request.cookies.get('maintenance_bypass')?.value === 'true'
        // 2. Check if user is admin (admin should always see the site)
        const ADMIN_EMAILS = ["admin@autobazar123.sk", "admin@example.com"];
        const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

        if (!hasBypass && !isAdmin) {
            try {
                // Fetch maintenance mode from site_settings table
                // If table doesn't exist, this will fail and we'll proceed as normal
                const { data: maintenanceSetting } = await supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', 'maintenance_mode')
                    .single()

                if (maintenanceSetting?.value === 'true' || maintenanceSetting?.value === true) {
                    return NextResponse.redirect(new URL('/maintenance', request.url))
                }
            } catch (err) {
                // Ignore DB error (e.g. table not created yet)
                console.error("Maintenance check failed:", err)
            }
        }
    }

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
