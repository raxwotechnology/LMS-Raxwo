import { NextResponse } from 'next/server';

function isTokenValid(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Expired
    }
    return true;
  } catch {
    return false;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Skip API routes and static asset requests
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png'
  ) {
    return NextResponse.next();
  }

  // 2. Admin Route Protection
  if (pathname.startsWith('/admin')) {
    // Skip middleware for admin login
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get('lms_auth_token')?.value;
    if (!token || !isTokenValid(token)) {
      const loginUrl = new URL('/admin/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.set('lms_auth_token', '', { maxAge: 0, path: '/' });
      }
      return response;
    }

    return NextResponse.next();
  }

  // 3. Student Auth Pages (/login, /register)
  const studentToken = request.cookies.get('student_token')?.value;
  if (pathname === '/login' || pathname === '/register') {
    // If student is already logged in, redirect them directly to the student dashboard
    if (studentToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 4. Student Portal Protection
  // Root URL redirects to dashboard if logged in, or /login if not
  if (pathname === '/') {
    if (studentToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Before accessing any student portal section, require student sign-in
  const protectedStudentRoutes = [
    '/dashboard',
    '/courses',
    '/my-learning',
    '/classes',
    '/results',
    '/certificates',
    '/payments',
    '/notifications',
    '/exam-registration',
  ];
  const isProtectedStudentRoute = protectedStudentRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedStudentRoute && !studentToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets / uploads public folders
     */
    '/((?!_next/static|_next/image|assets|uploads).*)',
  ],
};
