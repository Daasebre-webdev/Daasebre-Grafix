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

  // Public routes don't require authentication
  const publicPaths = ['/', '/login', '/verify'];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Check session token
  const sessionToken = request.cookies.get('__test')?.value;
  console.log(`[Middleware] Session token: ${sessionToken || 'none'}`);

  if (!sessionToken) {
    console.log('[Middleware] No session token, redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify session with /api/get-user
  try {
    const response = await fetch('https://pulse-woad-mu.vercel.app/api/get-user', {
      method: 'GET',
      headers: {
        Cookie: `__test=${sessionToken}`,
      },
      credentials: 'include',
    });
    const data = await response.json();
    console.log('[Middleware] /api/get-user response:', data);

    if (!data.user) {
      console.log('[Middleware] No valid user, redirecting to /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    console.error('[Middleware] Error fetching user:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};