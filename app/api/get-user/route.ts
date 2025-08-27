import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest

export async function GET(request: NextRequest) { // Type the request parameter
  const sessionToken = request.cookies.get('__test')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch('https://pulse.great-site.net/Google_signup/check-session.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ session_token: sessionToken }),
      credentials: 'include',
    });

    const data = await response.json();
    if (data.success && data.user) {
      return NextResponse.json({ user: data.user });
    } else {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}