import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  // Get JWT from cookies or Authorization header
  const token = request.cookies.get('jwt_token')?.value || 
                request.cookies.get('__test')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in .env');
    }
    const decoded = jwt.verify(token, secret) as {
      sub: string;
      email: string;
      is_verified: boolean;
      name?: string;
      picture?: string;
      google_id?: string;
    };

    // Construct user object
    const user = {
      id: decoded.sub,
      email: decoded.email,
      is_verified: decoded.is_verified,
      name: decoded.name || decoded.email.split('@')[0] || 'Unknown User',
      picture: decoded.picture || '/default-profile.png',
      google_id: decoded.google_id,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}