import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  if (nextUrl.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/dashboard', nextUrl))
    }
    const role = req.auth?.user?.role
    if (!role || !['BUSINESS', 'BUSINESS_ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', nextUrl))
    }
    if (req.auth?.user?.role !== 'PLATFORM_ADMIN') {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/cuenta/:path*'],
}
