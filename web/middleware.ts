import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const guestOnlyRoutes = ['/sign-in', '/sign-up'];
const protectedRoutes = ['/host', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessToken = request.cookies.has('accessToken');

  // Redirect authenticated users away from guest-only pages (e.g. sign-in)
  if (guestOnlyRoutes.some((route) => pathname.startsWith(route)) && hasAccessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users away from protected pages (e.g. /host, /admin)
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !hasAccessToken) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/sign-in', '/sign-up', '/host/:path*', '/admin/:path*'],
};
