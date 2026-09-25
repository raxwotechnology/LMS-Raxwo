import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import Employee from '@/lib/models/Employee';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_NAME = 'lms_auth_token';

/**
 * Sign a JWT token for a user
 */
export function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Set the auth token as an HTTP-only cookie on a NextResponse
 */
export function setAuthCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
  return response;
}

/**
 * Clear the auth cookie on a NextResponse
 */
export function clearAuthCookie(response) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

/**
 * Get the authenticated user from a request's cookies.
 * Returns { user, userType } or null if unauthenticated.
 */
export async function getAuthFromRequest(request) {
  try {
    // Try to get token from cookie
    let token = null;

    // In Route Handlers, we can read from the request cookies
    const cookieValue = request.cookies.get(COOKIE_NAME);
    if (cookieValue) {
      token = cookieValue.value;
    }

    // Also support Authorization header for backward compatibility
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    await connectDB();

    // Try Admin first, then Employee
    let user = await Admin.findById(decoded.id);
    let userType = 'admin';

    if (!user) {
      user = await Employee.findById(decoded.id);
      userType = 'employee';
    }

    if (!user || user.status !== 'active') return null;

    return { user, userType };
  } catch {
    return null;
  }
}

/**
 * Get auth token from cookies (for middleware)
 */
export function getTokenFromCookies(request) {
  return request.cookies.get(COOKIE_NAME)?.value || null;
}
