import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Read __test cookie from request
    const sessionToken = req.cookies.get("__test")?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    // Fetch user from PHP endpoint
    const res = await fetch('https://pulse.great-site.net/Google_signup/get_user.php', {
      headers: {
        // Forward the session token cookie
        Cookie: `__test=${sessionToken}`
      },
      credentials: 'include'
    });

    if (!res.ok) {
      console.error("Failed to fetch user from PHP:", res.statusText);
      return NextResponse.json({ user: null });
    }

    const data = await res.json();

    // Return user object or null
    return NextResponse.json({ user: data });
  } catch (err) {
    console.error("Error in /api/get-user:", err);
    return NextResponse.json({ user: null, error: 'Internal server error' });
  }
}
