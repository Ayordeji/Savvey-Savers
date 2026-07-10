import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token from session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;

  // 1. Unauthenticated requests trying to access dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const payload = await verifyToken(sessionCookie);
    if (!payload) {
      // Invalidate invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // 2. Member trying to access Admin-only views
    const adminRoutes = [
      '/dashboard/users',
      '/dashboard/settings',
      '/dashboard/waiting-list',
      '/dashboard/deleted-records',
    ];

    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
    if (isAdminRoute && payload.role !== 'ADMIN') {
      // Redirect unauthorized member back to member dashboard root
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }



  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
};
