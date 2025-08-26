// app/api/get-user/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Read __test cookie from request
    const sessionToken = req.cookies.get("__test")?.value;
    console.log(`[/api/get-user] Session token: ${sessionToken || "none"}`);

    if (!sessionToken) {
      console.log("[/api/get-user] No session token, returning null user");
      return NextResponse.json({ user: null });
    }

    // Fetch user from PHP backend
    const res = await fetch("https://pulse.great-site.net/Google_signup/get_user.php", {
      method: "GET",
      headers: {
        Cookie: `__test=${sessionToken}`,
      },
      credentials: "include",
    });

    if (!res.ok) {
      console.error(`[/api/get-user] Failed to fetch user from PHP: ${res.status} ${res.statusText}`);
      return NextResponse.json({ user: null });
    }

    const data = await res.json();
    console.log("[/api/get-user] PHP response:", data);

    // Check for valid user data
    if (!data || !data.id) {
      console.log("[/api/get-user] No valid user data, returning null user");
      return NextResponse.json({ user: null });
    }

    // Return user data
    return NextResponse.json({ user: data });
  } catch (err) {
    console.error("[/api/get-user] Error:", err);
    return NextResponse.json({ user: null, error: "Internal server error" });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://pulse-woad-mu.vercel.app",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cookie",
      "Access-Control-Max-Age": "86400",
    },
  });
}