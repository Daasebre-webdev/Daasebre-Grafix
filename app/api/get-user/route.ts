import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  let response: NextResponse; // Declare response variable at the top

  try {
    const sessionToken = req.cookies.get('__test')?.value;
    console.log(`[/api/get-user] Session token: ${sessionToken || 'none'}`);

    if (!sessionToken) {
      console.log('[/api/get-user] No session token, clearing cookie and returning null user');
      response = NextResponse.json({ success: false, user: null });
      response.cookies.set('__test', '', { path: '/', maxAge: 0 });
      return response;
    }

    // Fetch user from PHP backend using credentials
    const res = await fetch('https://pulse.great-site.net/Google_signup/get_user.php', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`[/api/get-user] Failed to fetch user from PHP: ${res.status} ${res.statusText}`, new Error().stack);
      response = NextResponse.json({ success: false, user: null, error: `Backend error: ${res.statusText}` });
      response.cookies.set('__test', '', { path: '/', maxAge: 0 });
      return response;
    }

    const data = await res.json();
    console.log('[/api/get-user] PHP response:', JSON.stringify(data));

    if (!data || !data.user?.id) {
      console.log('[/api/get-user] No valid user data, clearing cookie');
      response = NextResponse.json({ success: false, user: null, error: 'No valid user data' });
      response.cookies.set('__test', '', { path: '/', maxAge: 0 });
      return response;
    }

    // Prepare the response with user data
    response = NextResponse.json({ success: true, user: data.user });

    // Trigger fetchUser on client if user is valid
    if (data.user?.is_verified) {
      response.headers.set('X-Trigger-FetchUser', 'true');
    }

    return response;
  } catch (err) {
    console.error('[/api/get-user] Error:', err instanceof Error ? err.stack : err);
    response = NextResponse.json({ success: false, user: null, error: 'Internal server error' });
    response.cookies.set('__test', '', { path: '/', maxAge: 0 });
    return response;
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://pulse-woad-mu.vercel.app',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}