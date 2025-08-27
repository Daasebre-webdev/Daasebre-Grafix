// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. First, verify middleware is running
  console.log(`[Middleware] Path: ${request.nextUrl.pathname}`)
  
  // 2. Add a test header to verify it works
  const response = NextResponse.next()
  response.headers.set('x-middleware-test', 'success')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - API routes (/_next/static, /_next/image, /favicon.ico)
     * - Static files
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}