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

        // 2. Determine admin status
        let isAdmin = false;
        if (user) {
            const { data: adminEntry } = await supabase
                .from('site_admins')
                .select('user_id')
                .eq('user_id', user.id)
                .single();
            isAdmin = !!adminEntry;
        }

        // 3. Maintenance Check
        if (!hasBypass && !isAdmin) {
            try {
                // We use a Direct DB check here for reliability
                const { data: maintenanceSetting } = await supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', 'maintenance_mode')
                    .single();

                const isEnabled = maintenanceSetting?.value === 'true' || maintenanceSetting?.value === true;

                if (isEnabled) {
                    const response = NextResponse.redirect(new URL('/maintenance', request.url));
                    // Add header to tell bots not to index this redirect
                    response.headers.set('x-robots-tag', 'noindex, nofollow');
                    return response;
                }
            } catch (err) {
                console.error("Maintenance check failed:", err);
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
