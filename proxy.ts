import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/login', '/register']

export function proxy(req: NextRequest) {
  const token = req.cookies.get('fluxy_access_token')?.value
  const path = req.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
