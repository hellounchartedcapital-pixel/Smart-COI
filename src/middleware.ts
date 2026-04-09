import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Cookie name must match the value exported from src/lib/session.ts. */
const SESSION_COOKIE = 'smartcoi-session';

// Routes that don't require authentication
const publicRoutes = [
  '/', '/login', '/signup', '/reset-password', '/opengraph-image', '/twitter-image', '/favicon.ico',
  // Marketing / SEO pages
  '/terms', '/privacy', '/coi-tracking-software',
  '/certificate-of-insurance-tracking', '/vendor-insurance-compliance',
  '/tenant-insurance-tracking', '/ai-coi-extraction', '/audit', '/llms.txt', '/og-image.png',
  // Infrastructure
  '/api/health',
];
const publicPrefixes = [
  '/portal/', '/api/portal/', '/api/webhooks/', '/api/cron/', '/api/auth/',
  // Marketing / SEO prefixes
  '/blog', '/compare', '/features/', '/for/', '/alternatives/', '/insurance-requirements',
  // Sentry tunnel
  '/monitoring',
];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true;
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;
  // Allow static assets and Next.js internals
  if (pathname.startsWith('/_next/')) return true;
  if (/\.(?:svg|png|jpg|jpeg|gif|ico|css|js|woff2?)$/.test(pathname)) return true;
  return false;
}

// Routes that authenticated users should be redirected away from
const authRoutes = ['/login', '/signup', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that are never auth-gated (portal, webhooks, marketing, etc.)
  // skip auth entirely. This is critical for the portal flow where vendors/tenants
  // are unauthenticated — checking BEFORE creating the Supabase client avoids
  // unnecessary auth calls and cookie mutations that can interfere with rendering.
  const isPublic = isPublicRoute(pathname);
  const isAuthPage = authRoutes.includes(pathname);

  // If the route is public AND not an auth page (login/signup), skip auth entirely.
  // Auth pages need the Supabase check so logged-in users can be redirected to dashboard.
  if (isPublic && !isAuthPage) {
    return NextResponse.next();
  }

  // ── Session cookie gate ──────────────────────────────────────────────
  // The session cookie is set on login with a max-age matching the chosen
  // timeout (24 h standard, 7 d remember-me). When the browser removes the
  // expired cookie the middleware treats the user as unauthenticated — even
  // if Supabase still holds a valid refresh token — so the login page is
  // never bypassed by a stale token refresh.
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasSessionCookie) {
    // Auth page (login/signup) with no session → let them through
    if (isAuthPage) {
      return NextResponse.next();
    }
    // Protected route with no session → redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    url.searchParams.set(
      'message',
      'Your session has expired. Please log in again.'
    );
    return NextResponse.redirect(url);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, block all requests — never fail open
  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse('Service Unavailable', { status: 503 });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token — this must be called to keep the session alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated user trying to visit login/signup → redirect to dashboard
  // (but allow /reset-password since user needs a session to update their password)
  if (user && isAuthPage && pathname !== '/reset-password') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Unauthenticated user trying to visit a protected route → redirect to login
  // (public routes were already handled above, so anything here is protected)
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
};
