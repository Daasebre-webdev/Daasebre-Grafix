// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Path: ${pathname}`);

  // Handle CORS preflight (OPTIONS) requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://pulse-woad-mu.vercel.app',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Public routes that don't require authentication
  const publicPaths = ['/', '/login', '/verify', '/signup'];
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Read session token from cookie
  const sessionToken = request.cookies.get('__test')?.value;
  console.log(`[Middleware] Session token: ${sessionToken || 'none'}`);

  if (!sessionToken) {
    console.log('[Middleware] No session token, redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify session token with backend API
  try {
    const apiResponse = await fetch('https://pulse-woad-mu.vercel.app/api/get-user', {
      method: 'GET',
      headers: {
        Cookie: `__test=${sessionToken}`,
      },
      credentials: 'include',
    });

    const data = await apiResponse.json();
    console.log('[Middleware] /api/get-user response:', { status: apiResponse.status, data });

    if (!data.user) {
      console.log('[Middleware] Invalid session, clearing cookie and redirecting to /login');

      const response = NextResponse.redirect(new URL('/login', request.url));
      // Clear invalid cookie
      response.cookies.set('__test', '', { path: '/', maxAge: 0 });
      return response;
    }
  } catch (error) {
    console.error('[Middleware] Error verifying session:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Session token is valid, allow access
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
