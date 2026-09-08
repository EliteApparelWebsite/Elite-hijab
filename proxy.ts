import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // ── 1. Refresh Supabase auth session (keeps tokens alive) ───────────
  const hasRealSupabase =
    supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && supabaseUrl !== ''

  let supabaseUser: any = null

  if (hasRealSupabase) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    // IMPORTANT: Do NOT add logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard
    // to debug issues with users being randomly logged out.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    supabaseUser = user
  }

  // ── 2. Determine if the visitor is authenticated ────────────────────
  // The app uses three auth mechanisms:
  //   a) Real Supabase Auth session (refreshed above)
  //   b) Custom cookie session from OTP login (hijabistaa-user-session)
  //   c) Mock admin cookie for local development (mock-admin-logged-in)

  const hasMockCookie =
    request.cookies.get('mock-admin-logged-in')?.value === 'true'

  const hasCustomSession = !!request.cookies.get('hijabistaa-user-session')?.value

  const isLoggedIn = !!supabaseUser || hasCustomSession || hasMockCookie

  // ── 3. Route protection ─────────────────────────────────────────────
  const pathname = request.nextUrl.pathname

  // Admin routes: must be logged in (page-level code further verifies admin role)
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'

  if (isAdminRoute && !isLoggedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Protected customer routes
  // Note: /checkout is intentionally NOT gated here — it handles inline
  // OTP verification and account creation as part of the checkout form.
  const isProtectedCustomerRoute = pathname.startsWith('/account')

  if (isProtectedCustomerRoute && !isLoggedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // IMPORTANT: Return the response so refreshed auth cookies
  // are forwarded to the browser.
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - Public assets (svg, png, jpg, jpeg, gif, webp, ico)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
