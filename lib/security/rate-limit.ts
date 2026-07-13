import { headers } from 'next/headers'

interface RateLimitPolicy {
  limit: number
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  retryAfterSeconds: number
}

const POLICIES = {
  auth: { limit: 8, windowSeconds: 15 * 60 },
  passwordReset: { limit: 4, windowSeconds: 60 * 60 },
  booking: { limit: 12, windowSeconds: 10 * 60 },
  bookingLookup: { limit: 20, windowSeconds: 10 * 60 },
  order: { limit: 10, windowSeconds: 10 * 60 },
  waitlist: { limit: 10, windowSeconds: 10 * 60 },
  lead: { limit: 5, windowSeconds: 30 * 60 },
  upload: { limit: 30, windowSeconds: 10 * 60 },
} satisfies Record<string, RateLimitPolicy>

export type RateLimitScope = keyof typeof POLICIES

type LocalEntry = { count: number; resetAt: number }
const localStore = new Map<string, LocalEntry>()

function localRateLimit(key: string, policy: RateLimitPolicy): RateLimitResult {
  const now = Date.now()
  const current = localStore.get(key)
  if (!current || current.resetAt <= now) {
    localStore.set(key, { count: 1, resetAt: now + policy.windowSeconds * 1000 })
    return { success: true, remaining: policy.limit - 1, retryAfterSeconds: policy.windowSeconds }
  }

  current.count += 1
  localStore.set(key, current)
  return {
    success: current.count <= policy.limit,
    remaining: Math.max(0, policy.limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}

async function upstashRateLimit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const bucket = Math.floor(Date.now() / (policy.windowSeconds * 1000))
  const redisKey = `rl:${key}:${bucket}`
  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, String(policy.windowSeconds + 5), 'NX'],
    ]),
    cache: 'no-store',
  })

  if (!response.ok) return null
  const data = await response.json() as Array<{ result?: number }>
  const count = Number(data[0]?.result ?? 1)
  return {
    success: count <= policy.limit,
    remaining: Math.max(0, policy.limit - count),
    retryAfterSeconds: policy.windowSeconds,
  }
}

export async function getRequestFingerprint(extra = ''): Promise<string> {
  const requestHeaders = await headers()
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? requestHeaders.get('x-real-ip')
    ?? 'unknown'
  const userAgent = requestHeaders.get('user-agent')?.slice(0, 80) ?? 'unknown'
  return `${ip}:${userAgent}:${extra.trim().toLowerCase()}`
}

export async function checkRateLimit(scope: RateLimitScope, identifier: string): Promise<RateLimitResult> {
  const policy = POLICIES[scope]
  const key = `${scope}:${identifier}`
  const distributedRequired = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  try {
    const distributedResult = await upstashRateLimit(key, policy)
    if (distributedResult) return distributedResult
    if (distributedRequired) {
      console.error('[rate-limit] distributed backend is required but not configured')
      return { success: false, remaining: 0, retryAfterSeconds: policy.windowSeconds }
    }
    return localRateLimit(key, policy)
  } catch (error) {
    if (distributedRequired) {
      console.error('[rate-limit] distributed backend unavailable', error)
      return { success: false, remaining: 0, retryAfterSeconds: policy.windowSeconds }
    }
    console.warn('[rate-limit] distributed backend unavailable; using development fallback', error)
    return localRateLimit(key, policy)
  }
}

export async function enforceRateLimit(scope: RateLimitScope, identifier: string): Promise<void> {
  const result = await checkRateLimit(scope, identifier)
  if (!result.success) {
    const error = new Error('RATE_LIMITED') as Error & { retryAfterSeconds?: number }
    error.retryAfterSeconds = result.retryAfterSeconds
    throw error
  }
}
