// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose"; // Use jose for Edge compatibility

export async function middleware(request: NextRequest) {
  // 1. Verify middleware is running
  console.log(`[Middleware] Path: ${request.nextUrl.pathname}`);

  // 2. Add a test header
  const response = NextResponse.next();
  response.headers.set("x-middleware-test", "success");

  // 3. Check if the path is public
  const publicPaths = ["/", "/login", "/verify-email"];
  const path = request.nextUrl.pathname;

  if (publicPaths.includes(path)) {
    return response;
  }

  // 4. Get JWT from cookies
  const token = request.cookies.get("jwt_token")?.value;

  if (!token) {
    console.log("[Middleware] No token found, redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 5. Verify JWT using jose (Edge compatible)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in .env");
    }
    await jwtVerify(token, secret);
    return response;
  } catch (err) {
    console.error("[Middleware] Invalid token:", err);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - API routes (/_next/static, /_next/image, /favicon.ico)
     * - Static files
     * - Public paths (e.g., login, verify-email)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|verify-email).*)",
  ],
  // Remove runtime: "nodejs" - defaults to Edge runtime
};