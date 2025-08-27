// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware: Path', pathname); // Debug

  // Allow public routes
  if (['/', '/login', '/signup'].includes(pathname)) {
    console.log('Middleware: Allowing public route');
    return NextResponse.next();
  }

  // Check __test cookie
  const sessionToken = request.cookies.get('__test')?.value;
  console.log('Middleware: Session token', sessionToken || 'none'); // Debug
  if (!sessionToken) {
    console.log('Middleware: No token, redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validate token
  try {
    const response = await fetch('https://pulse-woad-mu.vercel.app/api/get-user', {
      method: 'GET',
      headers: {
        Cookie: `__test=${sessionToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    console.log('Middleware: /api/get-user response', data); // Debug

    if (!data.success || !data.user || !data.user.is_verified) {
      console.log('Middleware: Invalid or unverified user, redirecting to /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  } catch (err) {
    console.error('Middleware: Error fetching user', err);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/ai/:path*', '/bookmarks/:path*', '/chat/:path*'],
};