import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { reportOperationalError } from '@/lib/observability/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [expiredTokens, oldWebhookEvents] = await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { expires: { lt: new Date() } } }),
      prisma.$executeRaw`
        DELETE FROM "StripeWebhookEvent"
        WHERE "createdAt" < CURRENT_TIMESTAMP - INTERVAL '90 days'
          AND "status" IN ('PROCESSED', 'FAILED')
      `,
    ])

    return NextResponse.json({
      ok: true,
      removed: {
        expiredVerificationTokens: expiredTokens.count,
        oldStripeWebhookEvents: Number(oldWebhookEvents),
      },
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    await reportOperationalError('cron.data_retention.failed', error)
    return NextResponse.json({ error: 'Data retention cleanup failed' }, { status: 500 })
  }
}
