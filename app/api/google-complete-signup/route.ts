// app/api/google-complete-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    return NextResponse.redirect(new URL('/complete-signup?user_id=' + userId, process.env.NEXTAUTH_URL || 'https://pulse-woad-mu.vercel.app'));
  } catch (error) {
    console.error('Error in google-complete-signup GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const formData = new URLSearchParams(body);
    const userId = formData.get('user_id');

    // Forward the request to the PHP backend with user_id
    const res = await fetch('https://pulse.great-site.net/Google_signup/google_complete_signup.php', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body + (userId ? `&user_id=${userId}` : ''),
    });

    const contentType = res.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const data = await res.json();

      if (data.success && data.user?.token) {
        const response = NextResponse.json(data);
        response.cookies.set({
          name: '__test',
          value: data.user.token,
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'none',
          domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined,
          maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        return response;
      }

      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      return NextResponse.json({ error: 'Unexpected response format', response: text }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in google-complete-signup POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://pulse-woad-mu.vercel.app',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}