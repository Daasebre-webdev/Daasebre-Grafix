// app/api/get-user/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("__test")?.value;
    console.log(`[/api/get-user] Session token: ${sessionToken || "none"}`);

    if (!sessionToken) {
      console.log("[/api/get-user] No session token, clearing cookie and returning null user");
      const response = NextResponse.json({ user: null });
      response.cookies.set("__test", "", { path: "/", maxAge: 0 });
      return response;
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
      const response = NextResponse.json({ user: null });
      response.cookies.set("__test", "", { path: "/", maxAge: 0 });
      return response;
    }

    const data = await res.json();
    console.log("[/api/get-user] PHP response:", data);

    if (!data || !data.user?.id) {
      console.log("[/api/get-user] No valid user data, clearing cookie");
      const response = NextResponse.json({ user: null });
      response.cookies.set("__test", "", { path: "/", maxAge: 0 });
      return response;
    }

    return NextResponse.json({ user: data.user });
  } catch (err) {
    console.error("[/api/get-user] Error:", err);
    const response = NextResponse.json({ user: null, error: "Internal server error" });
    response.cookies.set("__test", "", { path: "/", maxAge: 0 });
    return response;
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
