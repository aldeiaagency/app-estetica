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
    const run = await prisma.dataRetentionRun.create({ data: { status: 'RUNNING', summary: {} } })
    const [expiredTokens, oldWebhookEvents, oldAuditLogs, oldOutboxEvents, anonymizedOrders, anonymizedCustomers] = await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { expires: { lt: new Date() } } }),
      prisma.$executeRaw`
        DELETE FROM "StripeWebhookEvent"
        WHERE "createdAt" < CURRENT_TIMESTAMP - INTERVAL '90 days'
          AND "status" IN ('PROCESSED', 'FAILED')
      `,
      prisma.adminAuditLog.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } }),
      prisma.integrationOutbox.deleteMany({
        where: {
          createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          status: { in: ['DELIVERED', 'FAILED'] },
        },
      }),
      prisma.$executeRaw`
        UPDATE "Order"
        SET "customerName" = 'Datos eliminados',
            "customerEmail" = CONCAT('deleted+', "id", '@invalid.local'),
            "customerPhone" = NULL,
            "notes" = NULL
        WHERE "createdAt" < CURRENT_TIMESTAMP - INTERVAL '5 years'
          AND "customerEmail" NOT LIKE 'deleted+%@invalid.local'
      `,
      prisma.$executeRaw`
        UPDATE "Customer" c
        SET "name" = 'Datos eliminados',
            "email" = CONCAT('deleted+', c."id", '@invalid.local'),
            "phone" = NULL,
            "marketingConsent" = FALSE,
            "marketingConsentDate" = NULL
        WHERE c."userId" IS NULL
          AND c."createdAt" < CURRENT_TIMESTAMP - INTERVAL '5 years'
          AND c."email" NOT LIKE 'deleted+%@invalid.local'
          AND NOT EXISTS (SELECT 1 FROM "Booking" b WHERE b."customerId" = c."id" AND b."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '5 years')
          AND NOT EXISTS (SELECT 1 FROM "BonoInstance" bi WHERE bi."customerId" = c."id" AND bi."purchasedAt" >= CURRENT_TIMESTAMP - INTERVAL '5 years')
      `,
    ])

    const summary = {
      expiredVerificationTokens: expiredTokens.count,
      oldStripeWebhookEvents: Number(oldWebhookEvents),
      oldAuditLogs: oldAuditLogs.count,
      oldOutboxEvents: oldOutboxEvents.count,
      anonymizedOrders: Number(anonymizedOrders),
      anonymizedCustomers: Number(anonymizedCustomers),
    }
    await prisma.dataRetentionRun.update({
      where: { id: run.id },
      data: { status: 'COMPLETED', summary, finishedAt: new Date() },
    })

    return NextResponse.json({
      ok: true,
      removed: summary,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    await reportOperationalError('cron.data_retention.failed', error)
    return NextResponse.json({ error: 'Data retention cleanup failed' }, { status: 500 })
  }
}
