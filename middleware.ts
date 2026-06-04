import NextAuth from 'next-auth'
import { edgeAuthConfig } from '@/lib/auth/edge-config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(edgeAuthConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  if (nextUrl.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=/dashboard`, nextUrl))
    if (!['BUSINESS', 'BUSINESS_ADMIN'].includes(role ?? '')) return NextResponse.redirect(new URL('/', nextUrl))
  }

  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/auth/signin', nextUrl))
    if (role !== 'PLATFORM_ADMIN') return NextResponse.redirect(new URL('/', nextUrl))
  }

  if (nextUrl.pathname.startsWith('/cuenta')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/cuenta/:path*'],
}
