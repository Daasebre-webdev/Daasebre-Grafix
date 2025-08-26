import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    console.log("➡️ Forwarding cookies:", cookieHeader);

  const res = await fetch("https://pulse.great-site.net/Google_signup/get_user.php", {
  method: "GET",
  credentials: "include", // ← ADD THIS
  headers: {
    "Content-Type": "application/json",
    // Don't manually set Cookie header - let browser handle it
  },
});

    const text = await res.text();
    console.log("📥 Raw backend response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    const response = NextResponse.json(data, { status: res.status });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      console.log("🍪 Backend set-cookie:", setCookie);
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (err) {
    console.error("❌ Proxy request failed:", err);
    return NextResponse.json(
      { error: "Proxy request failed", details: String(err) },
      { status: 500 }
    );
  }
}
