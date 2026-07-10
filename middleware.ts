import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { edgeAuthConfig } from '@/lib/auth/edge-config'
import { FEATURE_ROUTE_RULES, isFeatureEnabled } from '@/lib/features/flags'

const { auth } = NextAuth(edgeAuthConfig)

type RateLimitStore = Map<string, number[]>
declare global {
  // eslint-disable-next-line no-var
  var __rl_store: RateLimitStore | undefined
}

const WINDOW_MS = 60_000
const MAX_REQUESTS = 60

function isRateLimited(ip: string): boolean {
  if (!globalThis.__rl_store) globalThis.__rl_store = new Map()
  const store = globalThis.__rl_store
  const now = Date.now()
  const hits = (store.get(ip) ?? []).filter(timestamp => now - timestamp < WINDOW_MS)
  hits.push(now)
  store.set(ip, hits)
  return hits.length > MAX_REQUESTS
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
}

function disabledFeatureFor(pathname: string) {
  return FEATURE_ROUTE_RULES.find(rule => (
    !isFeatureEnabled(rule.flag)
    && rule.prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ))
}

export default auth(request => {
  const { nextUrl } = request
  const disabled = disabledFeatureFor(nextUrl.pathname)
  if (disabled) {
    if (nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const home = new URL('/', nextUrl)
    home.searchParams.set('feature', 'unavailable')
    return NextResponse.redirect(home)
  }

  // Auth.js may expose a session-shaped object while no valid user identity is
  // present. Protected routes require an actual user id, not merely a truthy
  // auth object, otherwise anonymous traffic can be misclassified by role.
  const isLoggedIn = Boolean(request.auth?.user?.id)
  const role = request.auth?.user?.role

  if (nextUrl.pathname.startsWith('/api/') && !nextUrl.pathname.startsWith('/api/webhooks/')) {
    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'Content-Type': 'text/plain',
        },
      })
    }
  }

  if (nextUrl.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl),
      )
    }
    if (!['BUSINESS', 'BUSINESS_ADMIN'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/auth/signin', nextUrl))
    if (role !== 'PLATFORM_ADMIN') return NextResponse.redirect(new URL('/', nextUrl))
  }

  if (nextUrl.pathname.startsWith('/cuenta') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  }

  const response = NextResponse.next()
  response.headers.set('x-content-type-options', 'nosniff')
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  return response
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/cuenta/:path*',
    '/api/:path*',
    '/productos/:path*',
    '/carrito/:path*',
    '/pedido/:path*',
    '/bono/:path*',
    '/mi-perfil-belleza/:path*',
    '/mi-rutina/:path*',
    '/mi-plan/:path*',
  ],
}
