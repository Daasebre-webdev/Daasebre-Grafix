// app/api/google-complete-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // For GET requests, redirect to our custom complete signup page
    return NextResponse.redirect(new URL('/complete-signup', process.env.NEXTAUTH_URL || 'https://pulse-woad-mu.vercel.app'));
  } catch (error) {
    console.error('Error in google-complete-signup GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    
    // Forward the request to the PHP backend
    const res = await fetch('https://pulse.great-site.net/Google_signup/google_complete_signup.php', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body,
    });

    const contentType = res.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await res.json();
      
      // Check if the PHP response contains a session token
      if (data.success && data.user?.token) {
        // Create a response with the JSON data
        const response = NextResponse.json(data);
        
        // Set the session cookie for our Vercel domain
        response.cookies.set({
          name: '__test',
          value: data.user.token,
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'none',
          // Set domain to current hostname (your Vercel domain)
          domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined,
          maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        
        return response;
      }
      
      return NextResponse.json(data, { status: res.status });
    } else {
      // Handle non-JSON responses from POST
      const text = await res.text();
      return NextResponse.json(
        { error: 'Unexpected response format', response: text },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in google-complete-signup POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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