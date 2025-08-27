// app/api/google-complete-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Forward the request to PHP with proper cookies
    const res = await fetch('https://pulse.great-site.net/Google_signup/google_complete_signup.php', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json, text/html', // Accept both JSON and HTML
      },
    });

    // Check content type to handle both JSON and HTML responses
    const contentType = res.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      // If it's HTML, we need to handle it differently
      const html = await res.text();
      
      // For GET requests, we should redirect to the PHP page directly
      // since it returns an HTML form
      return new NextResponse(html, {
        status: res.status,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
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
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}