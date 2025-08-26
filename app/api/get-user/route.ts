import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Read __test cookie from request
    const sessionToken = req.cookies.get("__test")?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    // Fetch user from PHP backend
    const res = await fetch(
      "https://pulse.great-site.net/Google_signup/get_user.php",
      {
        headers: {
          // Forward the session token cookie
          Cookie: `__test=${sessionToken}`,
        },
        credentials: "include",
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch user from PHP:", res.statusText);
      // Invalid token? Clear the cookie
      const response = NextResponse.json({ user: null });
      response.cookies.set("__test", "", {
        path: "/",
        domain: ".pulse.great-site.net",
        maxAge: 0,
      });
      return response;
    }

    const data = await res.json();

    // Backend returned no user? Clear cookie
    if (!data || !data.id) {
      const response = NextResponse.json({ user: null });
      response.cookies.set("__test", "", {
        path: "/",
        domain: ".pulse.great-site.net",
        maxAge: 0,
      });
      return response;
    }

    // Everything good: return user
    return NextResponse.json({ user: data });
  } catch (err) {
    console.error("Error in /api/get-user:", err);
    const response = NextResponse.json({ user: null, error: "Internal server error" });
    // Clear potentially bad cookie
    response.cookies.set("__test", "", {
      path: "/",
      domain: ".pulse.great-site.net",
      maxAge: 0,
    });
    return response;
  }
}
