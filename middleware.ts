import NextAuth from 'next-auth'
import { edgeAuthConfig } from '@/lib/auth/edge-config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(edgeAuthConfig)

// ─── Rate limiting (best-effort, per-isolate) ────────────────────────────────
// Stores: ip → [timestamp, ...] within the sliding window
type RateLimitStore = Map<string, number[]>

declare global {
  // eslint-disable-next-line no-var
  var __rl_store: RateLimitStore | undefined
}

const WINDOW_MS = 60_000  // 1 minute
const MAX_REQUESTS = 60   // per IP per window

function isRateLimited(ip: string): boolean {
  if (!globalThis.__rl_store) globalThis.__rl_store = new Map()
  const store = globalThis.__rl_store
  const now = Date.now()
  const hits = (store.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  hits.push(now)
  store.set(ip, hits)
  return hits.length > MAX_REQUESTS
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  // Rate limiting on public API routes (exclude Stripe webhooks — verified by signature)
  if (
    nextUrl.pathname.startsWith('/api/') &&
    !nextUrl.pathname.startsWith('/api/webhooks/')
  ) {
    const ip = getClientIp(req)
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

  // Auth guards
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
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/cuenta/:path*',
    '/api/:path*',
  ],
}
