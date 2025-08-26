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
        "Cookie": cookieHeader, // forward PHP session cookies
      },
    });

    const text = await res.text(); // read raw text first

    let data;
    try {
      data = JSON.parse(text); // try to parse JSON
    } catch {
      data = { raw: text }; // fallback if backend didn’t send JSON
    }

    // Forward backend response
    const response = NextResponse.json(data, { status: res.status });

    // Copy PHPSESSID if backend sets it
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { error: "Proxy request failed", details: String(err) },
      { status: 500 }
    );
  }
}
