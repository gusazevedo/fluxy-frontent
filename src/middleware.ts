import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard']
const AUTH_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('fluxy_access_token')?.value

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_PATHS.includes(pathname)

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
