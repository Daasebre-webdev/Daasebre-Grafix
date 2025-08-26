import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Grab cookies (including PHPSESSID) from the incoming request
    const cookieHeader = req.headers.get("cookie") || "";

    // Forward request to your PHP backend
    const res = await fetch("https://pulse.great-site.net/Google_signup/get_user.php", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward PHP session cookies
        "Cookie": cookieHeader,
      },
      // Don't use credentials here (server-to-server)
    });

    const data = await res.json();

    // Forward backend response + cookies back to browser
    const response = NextResponse.json(data, { status: res.status });

    // Copy PHPSESSID back if InfinityFree sets it
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: "Proxy request failed", details: String(err) },
      { status: 500 }
    );
  }
}
