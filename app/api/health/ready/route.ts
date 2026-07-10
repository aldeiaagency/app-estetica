import { NextResponse } from 'next/server'
import { isStripeConfigured } from '@/lib/billing/stripe'
import { prisma } from '@/lib/db/client'
import { isEmailConfigured } from '@/lib/email/client'
import { getFeatureFlags } from '@/lib/features/flags'
import { isStorageConfigured } from '@/lib/storage/r2'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, { ok: boolean; required: boolean }> = {
    database: { ok: false, required: true },
    authSecret: { ok: Boolean(process.env.AUTH_SECRET), required: true },
    appUrl: { ok: Boolean(process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL), required: true },
    cronSecret: { ok: Boolean(process.env.CRON_SECRET), required: true },
    stripe: { ok: isStripeConfigured(), required: false },
    stripeWebhook: { ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET), required: false },
    email: { ok: isEmailConfigured(), required: false },
    storage: { ok: isStorageConfigured(), required: false },
    distributedRateLimit: {
      ok: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      required: process.env.VERCEL_ENV === 'production',
    },
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database.ok = true
  } catch {
    checks.database.ok = false
  }

  const flags = getFeatureFlags()
  if (flags.products || flags.bonos) {
    checks.stripe.required = true
    checks.stripeWebhook.required = true
  }
  if (flags.products) checks.storage.required = true

  const ready = Object.values(checks).every(check => !check.required || check.ok)
  return NextResponse.json({
    status: ready ? 'ready' : 'not_ready',
    checks,
    features: flags,
    timestamp: new Date().toISOString(),
  }, {
    status: ready ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
